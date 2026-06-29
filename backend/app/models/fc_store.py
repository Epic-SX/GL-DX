import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class FcStoreStatus(str, enum.Enum):
    active = "active"
    pending = "pending"


class IntakeStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class FcStore(Base):
    __tablename__ = "fc_stores"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(200), nullable=False)
    owner_name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    portal_token = Column(String(100), unique=True, index=True, nullable=True)
    portal_active = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default=FcStoreStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    intake_requests = relationship("IntakeRequest", back_populates="store", cascade="all, delete-orphan")


class IntakeRequest(Base):
    __tablename__ = "intake_requests"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("fc_stores.id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String(500), nullable=False)
    brand = Column(String(200), nullable=True)
    category = Column(String(100), nullable=True)
    condition = Column(String(5), default="A", nullable=False)
    estimated_price = Column(Numeric(12, 0), default=0, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)
    images = Column(JSON, nullable=True)            # list[str] of image URLs
    status = Column(String(20), default=IntakeStatus.pending, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # set when accepted → HQ inventory
    submitted_at = Column(DateTime, default=datetime.utcnow)

    store = relationship("FcStore", back_populates="intake_requests")
