from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Date, DateTime,
    Enum, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ProductCondition(str, enum.Enum):
    S = "S"   # 未使用
    A = "A"   # 極美品
    B = "B"   # 美品
    C = "C"   # 良品
    D = "D"   # 訳あり


class ProductStatus(str, enum.Enum):
    in_stock = "in_stock"     # 在庫あり
    listed = "listed"         # 出品中
    reserved = "reserved"     # 予約済
    sold = "sold"             # 売却済
    returned = "returned"     # 返品
    disposed = "disposed"     # 廃棄


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # 識別情報
    sku = Column(String(50), unique=True, index=True, nullable=False)
    jan_code = Column(String(13), index=True, nullable=True)
    barcode = Column(String(50), index=True, nullable=True)  # 自社バーコード

    # 商品情報
    name = Column(String(500), nullable=False)
    brand = Column(String(200), nullable=True)
    model_number = Column(String(200), nullable=True)
    category = Column(String(100), nullable=True)
    subcategory = Column(String(100), nullable=True)

    # 状態・ステータス
    condition = Column(Enum(ProductCondition), default=ProductCondition.A, nullable=False)
    status = Column(Enum(ProductStatus), default=ProductStatus.in_stock, nullable=False, index=True)

    # 価格
    cost_price = Column(Numeric(10, 0), nullable=False)       # 仕入原価
    selling_price = Column(Numeric(10, 0), nullable=False)    # 販売価格
    min_selling_price = Column(Numeric(10, 0), nullable=True) # 最低販売価格

    # 在庫・保管
    shelf_location = Column(String(50), nullable=True)  # 棚番号 e.g. "A-2-3"
    stock_quantity = Column(Integer, default=1, nullable=False)
    weight_g = Column(Integer, nullable=True)

    # 詳細
    accessories = Column(Text, nullable=True)    # 付属品
    condition_notes = Column(Text, nullable=True) # 状態詳細
    description = Column(Text, nullable=True)    # 商品説明
    internal_notes = Column(Text, nullable=True) # 内部メモ

    # 仕入れ情報
    acquired_date = Column(Date, nullable=True)
    acquired_from = Column(String(200), nullable=True)  # 仕入先

    # 販売情報
    sold_date = Column(Date, nullable=True)
    sold_price = Column(Numeric(10, 0), nullable=True)

    # 滞留管理
    @property
    def days_in_stock(self):
        if self.acquired_date and self.status == ProductStatus.in_stock:
            return (date.today() - self.acquired_date).days
        return None

    # 担当者
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    listings = relationship("Listing", back_populates="product")
    orders = relationship("Order", back_populates="product")

    def __repr__(self):
        return f"<Product {self.sku}: {self.name}>"


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="images")
