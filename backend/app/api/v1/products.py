import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.services.storage_service import save_bytes
from app.models.product import Product, ProductImage, ProductStatus
from app.models.stock_movement import StockMovement, MovementReason
from app.models.user import User
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut, ProductListOut, ProductSearchParams
)
from app.api.deps import get_current_user, require_staff, require_manager
from app.services.jan_service import generate_sku, generate_barcode_number
from datetime import datetime

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductListOut])
def list_products(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    shelf_location: Optional[str] = Query(None),
    stagnant_days: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Product)

    if q:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{q}%"),
                Product.sku.ilike(f"%{q}%"),
                Product.jan_code.ilike(f"%{q}%"),
                Product.brand.ilike(f"%{q}%"),
                Product.barcode.ilike(f"%{q}%"),
            )
        )
    if category:
        query = query.filter(Product.category == category)
    if status:
        query = query.filter(Product.status == status)
    if shelf_location:
        query = query.filter(Product.shelf_location.ilike(f"%{shelf_location}%"))

    products = query.order_by(Product.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for p in products:
        primary = next((img for img in p.images if img.is_primary), None)
        if not primary and p.images:
            primary = p.images[0]
        item = ProductListOut.model_validate(p)
        item.primary_image_url = primary.url if primary else None
        if p.acquired_date and p.status == ProductStatus.in_stock:
            from datetime import date
            item.days_in_stock = (date.today() - p.acquired_date).days
        result.append(item)

    return result


@router.post("", response_model=ProductOut)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    sku = generate_sku(db)
    barcode_num = generate_barcode_number()
    product = Product(
        **data.model_dump(),
        sku=sku,
        barcode=barcode_num,
        created_by_id=current_user.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/meta")
def get_product_meta(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """過去に登録されたブランド・カテゴリ・仕入先の一覧を返す（オートコンプリート用）"""
    brands = db.query(Product.brand).filter(Product.brand.isnot(None)).distinct().all()
    categories = db.query(Product.category).filter(Product.category.isnot(None)).distinct().all()
    sources = db.query(Product.acquired_from).filter(Product.acquired_from.isnot(None)).distinct().all()
    return {
        "brands": sorted([b[0] for b in brands if b[0]]),
        "categories": sorted([c[0] for c in categories if c[0]]),
        "acquired_from": sorted([s[0] for s in sources if s[0]]),
    }


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(product, k, v)
    product.updated_by_id = current_user.id
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


@router.post("/{product_id}/images", response_model=ProductOut)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"

    content = await file.read()
    url = save_bytes(
        content,
        f"products/{product_id}/{filename}",
        content_type=file.content_type or "image/jpeg",
    )

    if is_primary:
        for img in product.images:
            img.is_primary = False

    image = ProductImage(
        product_id=product_id,
        url=url,
        is_primary=is_primary or len(product.images) == 0,
        sort_order=len(product.images),
    )
    db.add(image)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}/images/{image_id}", status_code=204)
def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    image = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id,
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(image)
    db.commit()


@router.get("/barcode/{barcode}", response_model=ProductOut)
def get_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(
        or_(Product.barcode == barcode, Product.jan_code == barcode, Product.sku == barcode)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---------------------------------------------------------------------------
# Stock movement (在庫移動)
# ---------------------------------------------------------------------------

class MoveRequest(BaseModel):
    to_location: str
    reason: MovementReason = MovementReason.transfer
    quantity: int = 1
    notes: Optional[str] = None


@router.post("/{product_id}/move")
def move_product(
    product_id: int,
    data: MoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """棚移動を記録し shelf_location を更新する"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movement = StockMovement(
        product_id=product_id,
        reason=data.reason,
        from_location=product.shelf_location,
        to_location=data.to_location,
        quantity=data.quantity,
        notes=data.notes,
        moved_by_id=current_user.id,
        moved_at=datetime.utcnow(),
    )
    db.add(movement)

    product.shelf_location = data.to_location
    db.commit()
    return {
        "status": "moved",
        "from": movement.from_location,
        "to": movement.to_location,
        "shelf_location": product.shelf_location,
    }


@router.get("/{product_id}/movements")
def list_movements(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """在庫移動履歴を取得する"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movements = (
        db.query(StockMovement)
        .filter(StockMovement.product_id == product_id)
        .order_by(StockMovement.moved_at.desc())
        .all()
    )
    return [
        {
            "id": m.id,
            "reason": m.reason.value,
            "from_location": m.from_location,
            "to_location": m.to_location,
            "quantity": m.quantity,
            "notes": m.notes,
            "moved_by": m.moved_by.name if m.moved_by else None,
            "moved_at": m.moved_at.isoformat(),
        }
        for m in movements
    ]
