from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from datetime import datetime, date, timedelta
from decimal import Decimal
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.product import Product, ProductStatus
from app.models.channel import Channel
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    month_start = today.replace(day=1)

    total_inventory = db.query(func.count(Product.id)).filter(
        Product.status.in_([ProductStatus.in_stock, ProductStatus.listed, ProductStatus.reserved])
    ).scalar()

    total_inventory_value = db.query(func.sum(Product.selling_price)).filter(
        Product.status == ProductStatus.in_stock
    ).scalar() or Decimal("0")

    month_sales = db.query(func.sum(Order.sale_price)).filter(
        Order.status == OrderStatus.completed,
        func.date(Order.ordered_at) >= month_start,
    ).scalar() or Decimal("0")

    month_orders = db.query(func.count(Order.id)).filter(
        func.date(Order.ordered_at) >= month_start,
    ).scalar()

    month_profit = db.query(func.sum(Order.gross_profit)).filter(
        Order.status == OrderStatus.completed,
        func.date(Order.ordered_at) >= month_start,
    ).scalar() or Decimal("0")

    stagnant_30 = db.query(func.count(Product.id)).filter(
        Product.status == ProductStatus.in_stock,
        Product.acquired_date <= today - timedelta(days=30),
    ).scalar()

    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_([OrderStatus.pending, OrderStatus.confirmed, OrderStatus.processing])
    ).scalar()

    return {
        "total_inventory": total_inventory,
        "total_inventory_value": float(total_inventory_value),
        "month_sales": float(month_sales),
        "month_orders": month_orders,
        "month_gross_profit": float(month_profit),
        "stagnant_30_days": stagnant_30,
        "pending_orders": pending_orders,
    }


@router.get("/sales/monthly")
def get_monthly_sales(
    year: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not year:
        year = date.today().year

    rows = (
        db.query(
            extract("month", Order.ordered_at).label("month"),
            func.sum(Order.sale_price).label("sales"),
            func.sum(Order.gross_profit).label("profit"),
            func.count(Order.id).label("count"),
        )
        .filter(
            extract("year", Order.ordered_at) == year,
            Order.status == OrderStatus.completed,
        )
        .group_by(extract("month", Order.ordered_at))
        .all()
    )

    monthly = {i: {"month": i, "sales": 0, "profit": 0, "count": 0} for i in range(1, 13)}
    for row in rows:
        m = int(row.month)
        monthly[m] = {
            "month": m,
            "sales": float(row.sales or 0),
            "profit": float(row.profit or 0),
            "count": row.count,
        }
    return list(monthly.values())


@router.get("/sales/by-channel")
def get_sales_by_channel(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    rows = (
        db.query(
            Channel.channel_type,
            Channel.name,
            func.sum(Order.sale_price).label("sales"),
            func.count(Order.id).label("count"),
            func.sum(Order.gross_profit).label("profit"),
        )
        .join(Order, Order.channel_id == Channel.id)
        .filter(
            func.date(Order.ordered_at).between(start_date, end_date),
            Order.status == OrderStatus.completed,
        )
        .group_by(Channel.channel_type, Channel.name)
        .all()
    )

    return [
        {
            "channel_type": row.channel_type.value if row.channel_type else None,
            "channel_name": row.name,
            "sales": float(row.sales or 0),
            "count": row.count,
            "profit": float(row.profit or 0),
        }
        for row in rows
    ]


@router.get("/sales/by-category")
def get_sales_by_category(
    start_date: date = Query(default=None),
    end_date: date = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    rows = (
        db.query(
            Product.category,
            func.sum(Order.sale_price).label("sales"),
            func.count(Order.id).label("count"),
        )
        .join(Order, Order.product_id == Product.id)
        .filter(
            func.date(Order.ordered_at).between(start_date, end_date),
            Order.status == OrderStatus.completed,
        )
        .group_by(Product.category)
        .order_by(func.sum(Order.sale_price).desc())
        .all()
    )

    return [
        {"category": row.category or "未分類", "sales": float(row.sales or 0), "count": row.count}
        for row in rows
    ]


@router.get("/inventory/stagnant")
def get_stagnant_inventory(
    days: int = Query(default=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = date.today() - timedelta(days=days)
    products = db.query(Product).filter(
        Product.status == ProductStatus.in_stock,
        Product.acquired_date <= cutoff,
    ).order_by(Product.acquired_date.asc()).limit(100).all()

    return [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "selling_price": float(p.selling_price),
            "shelf_location": p.shelf_location,
            "acquired_date": p.acquired_date.isoformat() if p.acquired_date else None,
            "days_in_stock": (date.today() - p.acquired_date).days if p.acquired_date else None,
        }
        for p in products
    ]
