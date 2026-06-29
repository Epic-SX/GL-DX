import uuid
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.fc_store import FcStore, IntakeRequest, FcStoreStatus, IntakeStatus
from app.models.product import Product, ProductImage, ProductStatus, ProductCondition
from app.models.stock_movement import StockMovement, MovementReason
from app.models.user import User
from app.api.deps import get_current_user, require_manager
from app.services.jan_service import generate_sku, generate_barcode_number
from app.services.storage_service import save_bytes

router = APIRouter(prefix="/fc-portal", tags=["fc-portal"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class FcStoreCreate(BaseModel):
    store_name: str
    owner_name: str
    email: Optional[str] = None
    phone: Optional[str] = None


class FcStoreOut(BaseModel):
    id: int
    store_name: str
    owner_name: str
    email: Optional[str]
    phone: Optional[str]
    portal_token: Optional[str]
    portal_active: bool
    status: str
    last_intake: Optional[datetime] = None
    intake_count: int = 0


class IntakeOut(BaseModel):
    id: int
    store_id: int
    store_name: Optional[str] = None
    item_name: str
    brand: Optional[str]
    category: Optional[str]
    condition: str
    estimated_price: float
    quantity: int
    notes: Optional[str]
    images: Optional[List[str]] = None
    status: str
    submitted_at: datetime


class IntakeUpdate(BaseModel):
    status: str


def _store_to_out(store: FcStore, db: Session) -> FcStoreOut:
    agg = (
        db.query(func.count(IntakeRequest.id), func.max(IntakeRequest.submitted_at))
        .filter(IntakeRequest.store_id == store.id)
        .one()
    )
    return FcStoreOut(
        id=store.id,
        store_name=store.store_name,
        owner_name=store.owner_name,
        email=store.email,
        phone=store.phone,
        portal_token=store.portal_token,
        portal_active=store.portal_active,
        status=store.status,
        intake_count=agg[0] or 0,
        last_intake=agg[1],
    )


def _intake_to_out(req: IntakeRequest) -> IntakeOut:
    return IntakeOut(
        id=req.id,
        store_id=req.store_id,
        store_name=req.store.store_name if req.store else None,
        item_name=req.item_name,
        brand=req.brand,
        category=req.category,
        condition=req.condition,
        estimated_price=float(req.estimated_price or 0),
        quantity=req.quantity,
        notes=req.notes,
        images=req.images or [],
        status=req.status,
        submitted_at=req.submitted_at,
    )


# ── Admin: Stores ─────────────────────────────────────────────────────────────

@router.get("/stores", response_model=List[FcStoreOut])
def list_stores(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    stores = db.query(FcStore).order_by(FcStore.created_at).all()
    return [_store_to_out(s, db) for s in stores]


@router.post("/stores", response_model=FcStoreOut)
def create_store(
    data: FcStoreCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    store = FcStore(status=FcStoreStatus.pending, **data.model_dump())
    db.add(store)
    db.commit()
    db.refresh(store)
    return _store_to_out(store, db)


@router.post("/stores/{store_id}/generate-token", response_model=FcStoreOut)
def generate_token(
    store_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    store = db.query(FcStore).filter(FcStore.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    slug = "".join(ch for ch in store.store_name.lower() if ch.isascii() and ch.isalnum())[:10] or "fc"
    store.portal_token = f"fc-{slug}-{uuid.uuid4().hex[:8]}"
    store.portal_active = True
    store.status = FcStoreStatus.active
    db.commit()
    db.refresh(store)
    return _store_to_out(store, db)


# ── Admin: Intake requests ────────────────────────────────────────────────────

@router.get("/intake", response_model=List[IntakeOut])
def list_intake(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(IntakeRequest)
    if status:
        q = q.filter(IntakeRequest.status == status)
    reqs = q.order_by(desc(IntakeRequest.submitted_at)).all()
    return [_intake_to_out(r) for r in reqs]


@router.patch("/intake/{intake_id}", response_model=IntakeOut)
def update_intake(
    intake_id: int,
    data: IntakeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_manager),
):
    req = db.query(IntakeRequest).filter(IntakeRequest.id == intake_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Intake request not found")

    req.status = data.status

    # On acceptance, move the item into HQ inventory (在庫移動) — create a Product
    # plus a stock-movement record, once.
    if data.status == IntakeStatus.accepted and req.product_id is None:
        product = Product(
            sku=generate_sku(db),
            barcode=generate_barcode_number(),
            name=req.item_name,
            brand=req.brand,
            category=req.category,
            condition=ProductCondition(req.condition) if req.condition in ProductCondition.__members__ else ProductCondition.A,
            status=ProductStatus.in_stock,
            cost_price=req.estimated_price or 0,
            selling_price=req.estimated_price or 0,
            stock_quantity=req.quantity or 1,
        )
        db.add(product)
        db.flush()  # assign product.id

        for url in (req.images or []):
            db.add(ProductImage(product_id=product.id, url=url, is_primary=False))

        db.add(StockMovement(
            product_id=product.id,
            reason=MovementReason.transfer,
            from_location=req.store.store_name if req.store else "FC店",
            to_location="本部",
            quantity=req.quantity or 1,
            notes=f"FC入庫申請 #{req.id} より受入",
            moved_by_id=user.id,
        ))
        req.product_id = product.id

    db.commit()
    db.refresh(req)
    return _intake_to_out(req)


# ── Public (no auth): token-based intake form ─────────────────────────────────

class PortalInfoOut(BaseModel):
    store_name: str
    valid: bool = True


@router.get("/public/{token}", response_model=PortalInfoOut)
def portal_info(token: str, db: Session = Depends(get_db)):
    store = db.query(FcStore).filter(FcStore.portal_token == token, FcStore.portal_active == True).first()
    if not store:
        raise HTTPException(status_code=404, detail="Invalid or inactive portal URL")
    return PortalInfoOut(store_name=store.store_name)


@router.post("/public/{token}/intake", response_model=IntakeOut)
async def submit_intake(
    token: str,
    item_name: str = Form(...),
    brand: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    condition: str = Form("A"),
    estimated_price: Decimal = Form(0),
    quantity: int = Form(1),
    notes: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    store = db.query(FcStore).filter(FcStore.portal_token == token, FcStore.portal_active == True).first()
    if not store:
        raise HTTPException(status_code=404, detail="Invalid or inactive portal URL")

    image_urls: List[str] = []
    for f in images:
        if not f or not f.filename:
            continue
        content = await f.read()
        if not content:
            continue
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else "jpg"
        key = f"intake/{store.id}/{uuid.uuid4()}.{ext}"
        image_urls.append(save_bytes(content, key, content_type=f.content_type or "image/jpeg"))

    req = IntakeRequest(
        store_id=store.id,
        item_name=item_name,
        brand=brand,
        category=category,
        condition=condition,
        estimated_price=estimated_price or 0,
        quantity=quantity or 1,
        notes=notes,
        images=image_urls or None,
        status=IntakeStatus.pending,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _intake_to_out(req)
