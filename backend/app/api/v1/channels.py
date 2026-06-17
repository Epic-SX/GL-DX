from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.channel import Channel, Listing, ListingStatus, ChannelType
from app.models.product import Product, ProductStatus
from app.models.user import User
from app.api.deps import get_current_user, require_staff, require_manager
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

router = APIRouter(prefix="/channels", tags=["channels"])


class ListingCreate(BaseModel):
    product_id: int
    channel_id: int
    listed_price: Decimal


class ListingUpdate(BaseModel):
    listed_price: Decimal = None
    status: ListingStatus = None


@router.get("", response_model=List[dict])
def list_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channels = db.query(Channel).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "channel_type": c.channel_type.value,
            "is_active": c.is_active,
            "fee_rate": float(c.fee_rate) if c.fee_rate else None,
        }
        for c in channels
    ]


@router.get("/listings", response_model=List[dict])
def list_listings(
    channel_id: int = None,
    status: str = None,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Listing)
    if channel_id:
        query = query.filter(Listing.channel_id == channel_id)
    if status:
        query = query.filter(Listing.status == status)
    listings = query.order_by(Listing.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return [
        {
            "id": l.id,
            "product_id": l.product_id,
            "product_name": l.product.name if l.product else None,
            "channel_type": l.channel.channel_type.value if l.channel else None,
            "channel_name": l.channel.name if l.channel else None,
            "external_id": l.external_id,
            "status": l.status.value,
            "listed_price": float(l.listed_price),
            "listed_at": l.listed_at.isoformat() if l.listed_at else None,
        }
        for l in listings
    ]


@router.post("/listings", response_model=dict)
def create_listing(
    data: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    channel = db.query(Channel).filter(Channel.id == data.channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    existing = db.query(Listing).filter(
        Listing.product_id == data.product_id,
        Listing.channel_id == data.channel_id,
        Listing.status == ListingStatus.active,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product already listed on this channel")

    listing = Listing(
        product_id=data.product_id,
        channel_id=data.channel_id,
        listed_price=data.listed_price,
        status=ListingStatus.active,
        listed_at=datetime.utcnow(),
    )
    db.add(listing)
    product.status = ProductStatus.listed
    db.commit()
    db.refresh(listing)
    return {"id": listing.id, "status": "listed"}


@router.post("/bulk-list", response_model=dict)
def bulk_list_product(
    product_id: int,
    channel_ids: List[int],
    price: Decimal,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """一括複数チャネルへの出品"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    created = []
    for ch_id in channel_ids:
        channel = db.query(Channel).filter(Channel.id == ch_id).first()
        if not channel:
            continue
        existing = db.query(Listing).filter(
            Listing.product_id == product_id,
            Listing.channel_id == ch_id,
            Listing.status == ListingStatus.active,
        ).first()
        if existing:
            continue
        listing = Listing(
            product_id=product_id,
            channel_id=ch_id,
            listed_price=price,
            status=ListingStatus.active,
            listed_at=datetime.utcnow(),
        )
        db.add(listing)
        created.append(channel.name)

    if created:
        product.status = ProductStatus.listed
    db.commit()

    return {"listed_channels": created, "count": len(created)}
