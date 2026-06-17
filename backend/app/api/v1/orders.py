import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from app.core.database import get_db
from app.models.order import Order, OrderStatus, SaleCertificate
from app.models.alert import FulfillmentStep
from app.models.product import Product, ProductStatus
from app.models.channel import Channel
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderListOut
from app.api.deps import get_current_user, require_staff, require_manager
from app.services.pdf_service import generate_sale_certificate
import uuid
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/orders", tags=["orders"])

FULFILLMENT_STEPS = [
    "受注確認",
    "在庫確認",
    "梱包",
    "発送",
    "配達完了",
]


def generate_order_number(db: Session) -> str:
    from datetime import date
    prefix = f"GL{date.today().strftime('%Y%m%d')}"
    count = db.query(Order).filter(Order.order_number.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:04d}"


@router.get("", response_model=List[OrderListOut])
def list_orders(
    status: str = None,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Order).options(joinedload(Order.product), joinedload(Order.channel))
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(desc(Order.ordered_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for o in orders:
        item = OrderListOut.model_validate(o)
        item.product_name = o.product.name if o.product else None
        item.channel_type = o.channel.channel_type.value if o.channel else None
        result.append(item)
    return result


@router.post("", response_model=OrderOut)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status == ProductStatus.sold:
        raise HTTPException(status_code=409, detail="Product already sold")

    # Auto-apply channel fee rate if platform_fee not explicitly provided
    platform_fee = data.platform_fee
    commission_rate = data.commission_rate
    if data.channel_id and platform_fee == Decimal("0"):
        channel = db.query(Channel).filter(Channel.id == data.channel_id).first()
        if channel and channel.fee_rate:
            commission_rate = channel.fee_rate
            platform_fee = Decimal(str(round(float(data.sale_price) * float(channel.fee_rate) / 100)))

    net = data.sale_price - data.shipping_fee - platform_fee
    gross = net - product.cost_price

    order_data = data.model_dump()
    order_data["platform_fee"] = platform_fee
    order_data["commission_rate"] = commission_rate
    order = Order(
        **order_data,
        order_number=generate_order_number(db),
        net_revenue=net,
        gross_profit=gross,
        handled_by_id=current_user.id,
    )
    db.add(order)

    # Update product status
    product.status = ProductStatus.reserved
    product.sold_date = datetime.utcnow().date()
    product.sold_price = data.sale_price

    db.flush()

    # Create fulfillment steps
    for i, step_name in enumerate(FULFILLMENT_STEPS, start=1):
        step = FulfillmentStep(
            order_id=order.id,
            step_order=i,
            step_name=step_name,
            status="pending",
        )
        db.add(step)

    # Create sale alert
    alert = Alert(
        alert_type=AlertType.sale_completed,
        severity=AlertSeverity.info,
        title=f"売却通知: {product.name}",
        message=f"商品「{product.name}」が¥{data.sale_price:,}で売却されました。",
        product_id=product.id,
        order_id=order.id,
    )
    db.add(alert)

    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).options(
        joinedload(Order.fulfillment_steps)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for k, v in data.model_dump(exclude_none=True).items():
        setattr(order, k, v)

    if data.status == OrderStatus.completed:
        order.completed_at = datetime.utcnow()
        if order.product:
            order.product.status = ProductStatus.sold
    elif data.status == OrderStatus.cancelled:
        order.cancelled_at = datetime.utcnow()
        if order.product:
            order.product.status = ProductStatus.in_stock

    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_id}/fulfillment/{step_id}/complete")
def complete_fulfillment_step(
    order_id: int,
    step_id: int,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    step = db.query(FulfillmentStep).filter(
        FulfillmentStep.id == step_id,
        FulfillmentStep.order_id == order_id,
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    step.status = "completed"
    step.completed_at = datetime.utcnow()
    step.completed_by_id = current_user.id
    if notes:
        step.notes = notes
    db.commit()
    return {"status": "ok", "step": step.step_name}


@router.post("/{order_id}/certificate")
def issue_sale_certificate(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    existing = db.query(SaleCertificate).filter(SaleCertificate.order_id == order_id).first()
    if existing:
        return {"certificate_number": existing.certificate_number, "pdf_url": existing.pdf_url}

    cert_number = f"CERT-{order.order_number}"
    pdf_url = generate_sale_certificate(order, cert_number)

    cert = SaleCertificate(
        order_id=order_id,
        certificate_number=cert_number,
        pdf_url=pdf_url,
        issued_by_id=current_user.id,
    )
    db.add(cert)
    db.commit()
    return {"certificate_number": cert_number, "pdf_url": pdf_url}


@router.get("/export/csv")
def export_orders_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """売上一覧をCSVエクスポート（業者別・月次・年次分析用）"""
    query = db.query(Order).options(
        joinedload(Order.product),
        joinedload(Order.channel),
    )
    if start_date:
        query = query.filter(func.date(Order.ordered_at) >= start_date)
    if end_date:
        query = query.filter(func.date(Order.ordered_at) <= end_date)
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(desc(Order.ordered_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "受注番号", "受注日", "商品名", "SKU", "販路",
        "購入者", "売却額", "送料", "手数料率(%)", "手数料額",
        "手取り額", "粗利", "ステータス",
    ])
    for o in orders:
        writer.writerow([
            o.order_number,
            o.ordered_at.strftime("%Y/%m/%d") if o.ordered_at else "",
            o.product.name if o.product else "",
            o.product.sku if o.product else "",
            o.channel.name if o.channel else "",
            o.buyer_name or "",
            int(o.sale_price) if o.sale_price else 0,
            int(o.shipping_fee) if o.shipping_fee else 0,
            float(o.commission_rate) if o.commission_rate else 0,
            int(o.platform_fee) if o.platform_fee else 0,
            int(o.net_revenue) if o.net_revenue else 0,
            int(o.gross_profit) if o.gross_profit else 0,
            o.status.value if o.status else "",
        ])

    content = output.getvalue().encode("utf-8-sig")  # BOM for Excel
    filename = f"orders_{date.today().strftime('%Y%m%d')}.csv"
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
