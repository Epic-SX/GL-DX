from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    gl = "gl"               # GL管理者 - full access
    fc_owner = "fc_owner"   # FCオーナー - store-level access
    staff = "staff"         # スタッフ - operational access
    viewer = "viewer"       # 閲覧者 - read-only


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    name_kana = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.staff, nullable=False)
    store_name = Column(String(200), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
