from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class MovementReason(str, enum.Enum):
    purchase = "purchase"       # 仕入れ
    sale = "sale"               # 販売
    transfer = "transfer"       # 棚移動
    returned = "returned"       # 返品
    disposal = "disposal"       # 廃棄
    adjustment = "adjustment"   # 棚卸調整
    other = "other"


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    reason = Column(Enum(MovementReason), nullable=False, default=MovementReason.transfer)
    from_location = Column(String(100), nullable=True)   # 移動元棚
    to_location = Column(String(100), nullable=True)     # 移動先棚
    quantity = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)

    moved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    moved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship("Product")
    moved_by = relationship("User", foreign_keys=[moved_by_id])
