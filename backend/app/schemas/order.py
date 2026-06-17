from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus


class OrderBase(BaseModel):
    product_id: int
    channel_id: Optional[int] = None
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None
    buyer_postal_code: Optional[str] = None
    buyer_address: Optional[str] = None
    sale_price: Decimal
    shipping_fee: Decimal = Decimal("0")
    platform_fee: Decimal = Decimal("0")
    commission_rate: Optional[Decimal] = None
    external_order_id: Optional[str] = None
    platform_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None
    buyer_postal_code: Optional[str] = None
    buyer_address: Optional[str] = None
    shipping_fee: Optional[Decimal] = None
    platform_fee: Optional[Decimal] = None
    internal_notes: Optional[str] = None


class FulfillmentStepOut(BaseModel):
    id: int
    step_order: int
    step_name: str
    status: str
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


class OrderOut(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    net_revenue: Optional[Decimal] = None
    gross_profit: Optional[Decimal] = None
    ordered_at: datetime
    completed_at: Optional[datetime] = None
    fulfillment_steps: List[FulfillmentStepOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderListOut(BaseModel):
    id: int
    order_number: str
    product_id: int
    product_name: Optional[str] = None
    channel_type: Optional[str] = None
    buyer_name: Optional[str] = None
    sale_price: Decimal
    status: OrderStatus
    ordered_at: datetime

    model_config = {"from_attributes": True}
