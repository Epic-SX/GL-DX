from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models.product import ProductCondition, ProductStatus


class ProductImageOut(BaseModel):
    id: int
    url: str
    is_primary: bool
    sort_order: int
    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str
    brand: Optional[str] = None
    model_number: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    jan_code: Optional[str] = None
    condition: ProductCondition = ProductCondition.A
    cost_price: Decimal
    selling_price: Decimal
    min_selling_price: Optional[Decimal] = None
    shelf_location: Optional[str] = None
    stock_quantity: int = 1
    weight_g: Optional[int] = None
    accessories: Optional[str] = None
    condition_notes: Optional[str] = None
    description: Optional[str] = None
    internal_notes: Optional[str] = None
    acquired_date: Optional[date] = None
    acquired_from: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    jan_code: Optional[str] = None
    condition: Optional[ProductCondition] = None
    status: Optional[ProductStatus] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    min_selling_price: Optional[Decimal] = None
    shelf_location: Optional[str] = None
    stock_quantity: Optional[int] = None
    weight_g: Optional[int] = None
    accessories: Optional[str] = None
    condition_notes: Optional[str] = None
    description: Optional[str] = None
    internal_notes: Optional[str] = None
    acquired_date: Optional[date] = None
    acquired_from: Optional[str] = None


class ProductOut(ProductBase):
    id: int
    sku: str
    barcode: Optional[str] = None
    status: ProductStatus
    sold_date: Optional[date] = None
    sold_price: Optional[Decimal] = None
    days_in_stock: Optional[int] = None
    images: List[ProductImageOut] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    id: int
    sku: str
    jan_code: Optional[str] = None
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    condition: ProductCondition
    status: ProductStatus
    selling_price: Decimal
    cost_price: Decimal
    shelf_location: Optional[str] = None
    stock_quantity: int
    days_in_stock: Optional[int] = None
    primary_image_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductSearchParams(BaseModel):
    q: Optional[str] = None          # 名前・SKU・JANコード検索
    category: Optional[str] = None
    brand: Optional[str] = None
    condition: Optional[ProductCondition] = None
    status: Optional[ProductStatus] = None
    shelf_location: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    stagnant_days: Optional[int] = None  # 滞留日数以上
    page: int = 1
    per_page: int = 50
