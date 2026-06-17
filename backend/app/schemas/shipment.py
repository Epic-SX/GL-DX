from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.shipment import Carrier, ShipmentStatus


class ShipmentRecipientBase(BaseModel):
    name: str
    company: Optional[str] = None
    postal_code: str
    prefecture: str
    city: str
    address1: str
    address2: Optional[str] = None
    phone: str
    email: Optional[str] = None
    is_default: bool = False


class ShipmentRecipientCreate(ShipmentRecipientBase):
    pass


class ShipmentRecipientOut(ShipmentRecipientBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class ShipmentCreate(BaseModel):
    order_id: int
    carrier: Carrier = Carrier.sagawa
    recipient_name: str
    recipient_postal_code: str
    recipient_address: str
    recipient_phone: str
    sender_name: Optional[str] = None
    sender_postal_code: Optional[str] = None
    sender_address: Optional[str] = None
    sender_phone: Optional[str] = None
    weight_g: Optional[int] = None
    size_code: Optional[str] = None


class ShipmentUpdate(BaseModel):
    tracking_number: Optional[str] = None
    status: Optional[ShipmentStatus] = None
    shipped_at: Optional[datetime] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


class ShipmentOut(BaseModel):
    id: int
    order_id: int
    carrier: Carrier
    tracking_number: Optional[str] = None
    status: ShipmentStatus
    recipient_name: Optional[str] = None
    recipient_postal_code: Optional[str] = None
    recipient_address: Optional[str] = None
    recipient_phone: Optional[str] = None
    sender_name: Optional[str] = None
    weight_g: Optional[int] = None
    size_code: Optional[str] = None
    shipping_label_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    sagawa_csv_exported: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DeliveryNoteOut(BaseModel):
    id: int
    shipment_id: int
    note_number: str
    pdf_url: Optional[str] = None
    issued_at: datetime
    notes: Optional[str] = None

    model_config = {"from_attributes": True}
