from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
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


@router.get("/item-stats")
def get_item_stats(
    q: str = Query(..., description="商品名・ブランド・カテゴリで検索"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """商品検索キーワードに一致する過去取引の統計情報を返す（平均額・合計・回転率）"""
    products = db.query(Product).filter(
        or_(
            Product.name.ilike(f"%{q}%"),
            Product.brand.ilike(f"%{q}%"),
            Product.category.ilike(f"%{q}%"),
        )
    ).all()

    if not products:
        return {"found": 0, "sold_count": 0, "avg_sale_price": 0, "total_sales": 0,
                "total_profit": 0, "avg_days_to_sell": None, "turnover_rate": 0, "best_channel": None}

    product_ids = [p.id for p in products]

    orders = (
        db.query(Order)
        .filter(Order.product_id.in_(product_ids), Order.status == OrderStatus.completed)
        .all()
    )

    if not orders:
        return {"found": len(products), "sold_count": 0, "avg_sale_price": 0, "total_sales": 0,
                "total_profit": 0, "avg_days_to_sell": None, "turnover_rate": 0, "best_channel": None}

    total_sales = sum(float(o.sale_price) for o in orders)
    total_profit = sum(float(o.gross_profit or 0) for o in orders)
    avg_sale_price = total_sales / len(orders)

    product_map = {p.id: p for p in products}
    days_list = []
    for o in orders:
        p = product_map.get(o.product_id)
        if p and p.acquired_date and o.ordered_at:
            d = (o.ordered_at.date() - p.acquired_date).days
            if 0 <= d <= 365:
                days_list.append(d)
    avg_days_to_sell = round(sum(days_list) / len(days_list), 1) if days_list else None

    channel_counts: dict = {}
    for o in orders:
        if o.channel_id:
            channel_counts[o.channel_id] = channel_counts.get(o.channel_id, 0) + 1
    best_channel = None
    if channel_counts:
        best_ch_id = max(channel_counts, key=lambda k: channel_counts[k])
        ch = db.query(Channel).filter(Channel.id == best_ch_id).first()
        if ch:
            best_channel = ch.name

    return {
        "found": len(products),
        "sold_count": len(orders),
        "avg_sale_price": round(avg_sale_price),
        "total_sales": round(total_sales),
        "total_profit": round(total_profit),
        "avg_days_to_sell": avg_days_to_sell,
        "turnover_rate": round(len(orders) / len(products), 2),
        "best_channel": best_channel,
    }


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


@router.get("/market")
def get_market_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """カテゴリ別の平均販売額・粗利・回転率を返す（相場分析）"""
    products = db.query(Product).filter(Product.category.isnot(None)).all()

    from collections import defaultdict
    by_cat: dict = defaultdict(list)
    for p in products:
        by_cat[p.category].append(p)

    data = []
    for cat, items in by_cat.items():
        sold = [p for p in items if p.status == ProductStatus.sold and p.sold_price]
        total_sold_val = sum(float(p.sold_price) for p in sold)
        total_cost = sum(float(p.cost_price) for p in sold)
        data.append({
            "category": cat,
            "total_count": len(items),
            "sold_count": len(sold),
            "avg_sale_price": round(total_sold_val / len(sold)) if sold else 0,
            "avg_profit_per_item": round((total_sold_val - total_cost) / len(sold)) if sold else 0,
            "profit_margin": round((total_sold_val - total_cost) / total_sold_val * 100, 1) if sold and total_sold_val > 0 else 0,
            "turnover_rate": round(len(sold) / len(items), 2),
            "total_profit": round(total_sold_val - total_cost),
        })

    return sorted(data, key=lambda x: x["sold_count"], reverse=True)


@router.get("/market/trend")
def get_market_trend(
    category: str = Query(default=None),
    brand: str = Query(default=None),
    months: int = Query(default=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """月別の平均落札額・相場推移を返す"""
    cutoff = date.today() - timedelta(days=months * 30)

    q = db.query(Product).filter(
        Product.status == ProductStatus.sold,
        Product.sold_date.isnot(None),
        Product.sold_price.isnot(None),
        Product.sold_date >= cutoff,
    )
    if category:
        q = q.filter(Product.category == category)
    if brand:
        q = q.filter(Product.brand.ilike(f"%{brand}%"))

    items = q.all()

    from collections import defaultdict
    by_month: dict = defaultdict(list)
    for p in items:
        key = (p.sold_date.year, p.sold_date.month)
        by_month[key].append(float(p.sold_price))

    return [
        {
            "year": year,
            "month": month,
            "label": f"{year}年{month}月",
            "avg_price": round(sum(prices) / len(prices)),
            "count": len(prices),
        }
        for (year, month), prices in sorted(by_month.items())
    ]


@router.get("/inventory/analysis")
def get_inventory_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """在庫総額・回転率・カテゴリ別内訳・滞留在庫アクション候補を返す"""
    today = date.today()
    thirty_ago = today - timedelta(days=30)

    active = db.query(Product).filter(
        Product.status.in_([ProductStatus.in_stock, ProductStatus.listed, ProductStatus.reserved])
    ).all()

    total_value = sum(float(p.selling_price) for p in active)
    total_cost_value = sum(float(p.cost_price) for p in active)

    sold_30d = db.query(func.count(Product.id)).filter(
        Product.status == ProductStatus.sold,
        Product.sold_date >= thirty_ago,
    ).scalar() or 0

    total_items = len(active)
    turnover_rate = round((sold_30d * 12) / total_items, 2) if total_items > 0 else 0

    from collections import defaultdict
    by_cat: dict = defaultdict(list)
    for p in active:
        by_cat[p.category or "未分類"].append(p)

    by_category = sorted([
        {
            "category": cat,
            "count": len(items),
            "value": round(sum(float(p.selling_price) for p in items)),
            "cost_value": round(sum(float(p.cost_price) for p in items)),
            "unrealized_profit": round(sum(float(p.selling_price) - float(p.cost_price) for p in items)),
        }
        for cat, items in by_cat.items()
    ], key=lambda x: x["value"], reverse=True)

    stagnant_items = []
    for p in active:
        if p.status == ProductStatus.in_stock and p.acquired_date:
            days = (today - p.acquired_date).days
            if days >= 30:
                discount = 0.85 if days >= 90 else 0.9
                stagnant_items.append({
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "selling_price": float(p.selling_price),
                    "cost_price": float(p.cost_price),
                    "days_in_stock": days,
                    "suggested_price": round(float(p.selling_price) * discount),
                    "shelf_location": p.shelf_location,
                    "category": p.category,
                })

    stagnant_items.sort(key=lambda x: x["days_in_stock"], reverse=True)

    return {
        "total_inventory_value": total_value,
        "total_cost_value": total_cost_value,
        "unrealized_profit": total_value - total_cost_value,
        "total_items": total_items,
        "sold_last_30d": sold_30d,
        "turnover_rate": turnover_rate,
        "stagnant_30d_count": len([x for x in stagnant_items if x["days_in_stock"] >= 30]),
        "stagnant_60d_count": len([x for x in stagnant_items if x["days_in_stock"] >= 60]),
        "stagnant_90d_count": len([x for x in stagnant_items if x["days_in_stock"] >= 90]),
        "by_category": by_category,
        "stagnant_items": stagnant_items[:50],
    }


@router.get("/fc")
def get_fc_analysis(
    year: int = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FC・店舗別の売上・粗利・買取件数・ランキングを返す"""
    from app.models.user import User as UserModel
    from collections import defaultdict

    if not year:
        year = date.today().year

    start = date(year, 1, 1)
    end = date(year, 12, 31)

    orders = (
        db.query(Order)
        .filter(
            Order.status == OrderStatus.completed,
            func.date(Order.ordered_at) >= start,
            func.date(Order.ordered_at) <= end,
            Order.handled_by_id.isnot(None),
        )
        .all()
    )

    by_staff: dict = defaultdict(list)
    for o in orders:
        by_staff[o.handled_by_id].append(o)

    staff_ids = list(by_staff.keys())
    staff_users = db.query(UserModel).filter(UserModel.id.in_(staff_ids)).all() if staff_ids else []
    staff_info = {u.id: u for u in staff_users}

    staff_data = []
    for uid, ords in by_staff.items():
        user = staff_info.get(uid)
        sales = sum(float(o.sale_price or 0) for o in ords)
        profit = sum(float(o.gross_profit or 0) for o in ords)
        staff_data.append({
            "staff_name": user.name if user else f"UID:{uid}",
            "store_name": (user.store_name if user and user.store_name else "本部"),
            "role": user.role if user else "staff",
            "order_count": len(ords),
            "total_sales": round(sales),
            "total_profit": round(profit),
            "profit_margin": round(profit / sales * 100, 1) if sales > 0 else 0,
        })

    staff_data.sort(key=lambda x: x["total_sales"], reverse=True)
    for i, d in enumerate(staff_data):
        d["rank"] = i + 1

    by_store: dict = defaultdict(lambda: {"order_count": 0, "total_sales": 0.0, "total_profit": 0.0})
    for d in staff_data:
        s = d["store_name"]
        by_store[s]["store_name"] = s
        by_store[s]["order_count"] += d["order_count"]
        by_store[s]["total_sales"] += d["total_sales"]
        by_store[s]["total_profit"] += d["total_profit"]

    store_list = sorted(by_store.values(), key=lambda x: x["total_sales"], reverse=True)
    for i, s in enumerate(store_list):
        s["rank"] = i + 1
        s["profit_margin"] = round(s["total_profit"] / s["total_sales"] * 100, 1) if s["total_sales"] > 0 else 0
        s["total_sales"] = round(s["total_sales"])
        s["total_profit"] = round(s["total_profit"])

    ec_types = {"amazon", "rakuten", "shopify", "overseas"}
    ec_sales = sum(
        float(o.sale_price or 0)
        for o in orders
        if o.channel and o.channel.channel_type and o.channel.channel_type.value in ec_types
    )
    store_sales_total = sum(
        float(o.sale_price or 0)
        for o in orders
        if o.channel and o.channel.channel_type and o.channel.channel_type.value == "store"
    )

    return {
        "year": year,
        "by_staff": staff_data,
        "by_store": store_list,
        "ec_sales": round(ec_sales),
        "store_sales": round(store_sales_total),
        "total_orders": len(orders),
    }
