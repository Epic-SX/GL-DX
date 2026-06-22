import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base


class TransferStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    cancelled = "cancelled"


class BankAccount(Base):
    __tablename__ = "bank_accounts"
    id = Column(Integer, primary_key=True)
    bank_name = Column(String(100), nullable=False)
    branch_name = Column(String(100), nullable=False)
    account_type = Column(String(20), default="ordinary", nullable=False)
    account_number = Column(String(20), nullable=False)
    account_holder = Column(String(100), nullable=False)
    is_default = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AccountingEntry(Base):
    __tablename__ = "accounting_entries"
    id = Column(Integer, primary_key=True)
    voucher_number = Column(String(50), nullable=False, unique=True)
    entry_date = Column(Date, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    description = Column(String(500), nullable=False)
    amount = Column(Numeric(12, 0), nullable=False)
    transfer_status = Column(String(20), default=TransferStatus.pending, nullable=False)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", foreign_keys=[client_id])
    bank_account = relationship("BankAccount", foreign_keys=[bank_account_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
