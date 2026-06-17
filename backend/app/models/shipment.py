from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class Carrier(str, enum.Enum):
    sagawa = "sagawa"       # 佐川急便
    yamato = "yamato"       # ヤマト運輸
    yupack = "yupack"       # ゆうパック
    other = "other"


class ShipmentStatus(str, enum.Enum):
    preparing = "preparing"     # 準備中
    shipped = "shipped"         # 発送済
    in_transit = "in_transit"   # 配送中
    delivered = "delivered"     # 配達済
    failed = "failed"           # 配達失敗
    returned = "returned"       # 返送


class ShipmentRecipient(Base):
    """出荷先マスタ"""
    __tablename__ = "shipment_recipients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    company = Column(String(200), nullable=True)
    postal_code = Column(String(10), nullable=False)
    prefecture = Column(String(10), nullable=False)
    city = Column(String(100), nullable=False)
    address1 = Column(String(200), nullable=False)
    address2 = Column(String(200), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)

    carrier = Column(Enum(Carrier), default=Carrier.sagawa, nullable=False)
    tracking_number = Column(String(100), nullable=True, index=True)
    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.preparing, nullable=False)

    # 送り状情報
    sender_name = Column(String(200), nullable=True)
    sender_postal_code = Column(String(10), nullable=True)
    sender_address = Column(Text, nullable=True)
    sender_phone = Column(String(20), nullable=True)

    recipient_name = Column(String(200), nullable=True)
    recipient_postal_code = Column(String(10), nullable=True)
    recipient_address = Column(Text, nullable=True)
    recipient_phone = Column(String(20), nullable=True)

    shipping_label_url = Column(String(500), nullable=True)
    weight_g = Column(Integer, nullable=True)
    size_code = Column(String(10), nullable=True)  # 60サイズ等

    shipped_at = Column(DateTime, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)

    sagawa_csv_exported = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="shipment")
    delivery_note = relationship("DeliveryNote", back_populates="shipment", uselist=False)
    receipt = relationship("Receipt", back_populates="shipment", uselist=False)


class DeliveryNote(Base):
    """納品書"""
    __tablename__ = "delivery_notes"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False, unique=True)
    note_number = Column(String(50), unique=True, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    shipment = relationship("Shipment", back_populates="delivery_note")


class Receipt(Base):
    """受領書（受取確認証）"""
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False, unique=True)
    receipt_number = Column(String(50), unique=True, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    shipment = relationship("Shipment", back_populates="receipt")
