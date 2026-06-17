from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class OrderStatus(str, enum.Enum):
    pending = "pending"         # 受注待ち
    confirmed = "confirmed"     # 受注確定
    processing = "processing"   # 処理中
    shipped = "shipped"         # 発送済
    delivered = "delivered"     # 配達済
    completed = "completed"     # 完了
    cancelled = "cancelled"     # キャンセル
    returned = "returned"       # 返品


class SaleChannel(str, enum.Enum):
    yahoo_auction = "yahoo_auction"
    mercari = "mercari"
    amazon = "amazon"
    rakuten = "rakuten"
    shopify = "shopify"
    wholesale = "wholesale"
    store = "store"
    overseas = "overseas"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=True)

    # 購入者情報
    buyer_name = Column(String(200), nullable=True)
    buyer_email = Column(String(255), nullable=True)
    buyer_phone = Column(String(20), nullable=True)
    buyer_postal_code = Column(String(10), nullable=True)
    buyer_address = Column(Text, nullable=True)

    # 金額
    sale_price = Column(Numeric(10, 0), nullable=False)
    shipping_fee = Column(Numeric(10, 0), default=0)
    platform_fee = Column(Numeric(10, 0), default=0)
    commission_rate = Column(Numeric(5, 2), nullable=True)  # 手数料率%
    net_revenue = Column(Numeric(10, 0), nullable=True)     # 手取り額
    gross_profit = Column(Numeric(10, 0), nullable=True)    # 粗利

    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False, index=True)

    external_order_id = Column(String(200), nullable=True)   # Platform order ID
    platform_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    ordered_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    handled_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="orders")
    channel = relationship("Channel")
    shipment = relationship("Shipment", back_populates="order", uselist=False)
    sale_certificate = relationship("SaleCertificate", back_populates="order", uselist=False)
    fulfillment_steps = relationship("FulfillmentStep", back_populates="order", order_by="FulfillmentStep.step_order")


class SaleCertificate(Base):
    """売却証明書（領収書）"""
    __tablename__ = "sale_certificates"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    certificate_number = Column(String(50), unique=True, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    issued_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    order = relationship("Order", back_populates="sale_certificate")
