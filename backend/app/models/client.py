from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ClientType(str, enum.Enum):
    wholesale = "wholesale"         # 卸業者
    consult = "consult"             # コンサルクライアント
    auction_house = "auction_house" # オークション業者
    direct = "direct"               # 直販顧客（個人/法人）
    other = "other"


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)

    # 基本情報
    name = Column(String(200), nullable=False, index=True)          # 担当者名
    company = Column(String(300), nullable=True)                    # 会社名
    client_type = Column(Enum(ClientType), default=ClientType.other, nullable=False)

    # 連絡先
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    fax = Column(String(20), nullable=True)

    # 住所
    postal_code = Column(String(10), nullable=True)
    prefecture = Column(String(10), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)

    # 取引情報
    payment_terms = Column(String(200), nullable=True)  # 支払条件
    credit_limit = Column(Integer, nullable=True)        # 与信限度額
    notes = Column(Text, nullable=True)                  # 備考

    is_active = Column(Boolean, default=True, nullable=False)

    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
