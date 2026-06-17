from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from app.core.database import Base


class StaffGPS(Base):
    """スタッフGPS動態管理"""
    __tablename__ = "staff_gps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)  # Reverse geocoded
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
