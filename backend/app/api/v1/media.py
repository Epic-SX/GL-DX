from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product, ProductImage
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/media", tags=["media"])


class MediaItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    url: str
    is_primary: bool
    filename: str
    uploaded_at: Optional[datetime] = None


@router.get("", response_model=List[MediaItemOut])
def list_media(
    category: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """商品画像を横断的に一覧表示する画像ギャラリー（⑨）。

    商品登録時に S3 / ローカルへ蓄積された画像を product 情報とともに返す。
    """
    q = (
        db.query(ProductImage, Product)
        .join(Product, ProductImage.product_id == Product.id)
    )
    if category:
        q = q.filter(Product.category == category)
    if product_id:
        q = q.filter(ProductImage.product_id == product_id)

    rows = q.order_by(desc(ProductImage.created_at)).all()

    return [
        MediaItemOut(
            id=img.id,
            product_id=img.product_id,
            product_name=product.name,
            brand=product.brand,
            category=product.category,
            url=img.url,
            is_primary=img.is_primary,
            filename=img.url.rsplit("/", 1)[-1],
            uploaded_at=img.created_at,
        )
        for img, product in rows
    ]
