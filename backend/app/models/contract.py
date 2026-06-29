import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text
from app.core.database import Base


class ContractStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    signed = "signed"


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(50), nullable=False, unique=True)
    fc_store_name = Column(String(200), nullable=False)
    owner_name = Column(String(200), nullable=False)
    contract_type = Column(String(100), default="FC加盟契約", nullable=False)
    amount = Column(Numeric(12, 0), default=0, nullable=False)
    status = Column(String(20), default=ContractStatus.draft, nullable=False)
    notes = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    signed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
