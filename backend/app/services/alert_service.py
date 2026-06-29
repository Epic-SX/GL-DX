"""自動アラート生成エンジン。

在庫状態をスキャンして滞留在庫アラートを自動生成する。
冪等性: 同一商品に未読の滞留アラートが既にあればスキップする。
"""
from datetime import date
from sqlalchemy.orm import Session
from app.models.product import Product, ProductStatus
from app.models.alert import Alert, AlertType, AlertSeverity


def generate_inventory_alerts(db: Session) -> int:
    """滞留在庫(30日+)を検出し、値下げ提案つきアラートを生成する。戻り値: 生成件数。"""
    today = date.today()
    created = 0

    products = (
        db.query(Product)
        .filter(Product.status == ProductStatus.in_stock, Product.acquired_date.isnot(None))
        .all()
    )

    for p in products:
        days = (today - p.acquired_date).days
        if days < 30:
            continue

        existing = (
            db.query(Alert)
            .filter(
                Alert.product_id == p.id,
                Alert.alert_type == AlertType.stagnant_inventory,
                Alert.is_read == False,
            )
            .first()
        )
        if existing:
            continue

        severity = AlertSeverity.error if days >= 90 else AlertSeverity.warning
        discount = 0.85 if days >= 90 else 0.9
        suggested = round(float(p.selling_price) * discount)

        db.add(Alert(
            alert_type=AlertType.stagnant_inventory,
            severity=severity,
            title=f"滞留在庫: {p.name}（{days}日）",
            message=(
                f"商品「{p.name}」が{days}日間滞留しています。"
                f"値下げ提案: ¥{suggested:,}（現在 ¥{int(p.selling_price):,}）。"
                f"オークション移行もご検討ください。"
            ),
            product_id=p.id,
        ))
        created += 1

    if created:
        db.commit()
    return created
