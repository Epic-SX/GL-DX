from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, Boolean
from app.core.database import Base


class EbayToken(Base):
    __tablename__ = "ebay_tokens"

    id = Column(Integer, primary_key=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    access_token_expires_at = Column(DateTime, nullable=True)
    refresh_token_expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
