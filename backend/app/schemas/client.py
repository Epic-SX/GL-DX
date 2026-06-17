from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.client import ClientType


class ClientBase(BaseModel):
    name: str
    company: Optional[str] = None
    client_type: ClientType = ClientType.other
    email: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    postal_code: Optional[str] = None
    prefecture: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[int] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    client_type: Optional[ClientType] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    postal_code: Optional[str] = None
    prefecture: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ClientOut(ClientBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
