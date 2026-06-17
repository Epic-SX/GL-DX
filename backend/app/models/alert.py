from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class AlertType(str, enum.Enum):
    low_stock = "low_stock"             # 在庫不足
    stagnant_inventory = "stagnant"     # 在庫滞留
    sale_completed = "sale_completed"   # 売却完了
    shipment_delay = "shipment_delay"   # 配送遅延
    contract_renewal = "contract_renewal"  # 契約更新
    fulfillment_step = "fulfillment"    # フルフィルメント行程
    system = "system"                   # システム通知


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    error = "error"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.info)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime, nullable=True)
    read_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class FulfillmentStep(Base):
    """フルフィルメント工程管理"""
    __tablename__ = "fulfillment_steps"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)

    step_order = Column(Integer, nullable=False)  # 1,2,3...
    step_name = Column(String(100), nullable=False)   # e.g. "受注確認", "梱包", "発送"
    status = Column(String(20), default="pending")    # pending/in_progress/completed
    completed_at = Column(DateTime, nullable=True)
    completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    order = relationship("Order", back_populates="fulfillment_steps")
