from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.api.deps import get_current_user
from app.services.alert_service import generate_inventory_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[dict])
def list_alerts(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 自動アラート: 滞留在庫を都度スキャンして生成（冪等）
    generate_inventory_alerts(db)
    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "type": a.alert_type.value,
            "severity": a.severity.value,
            "title": a.title,
            "message": a.message,
            "is_read": a.is_read,
            "product_id": a.product_id,
            "order_id": a.order_id,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    generate_inventory_alerts(db)
    count = db.query(Alert).filter(Alert.is_read == False).count()
    return {"count": count}


@router.post("/{alert_id}/read")
def mark_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        alert.read_at = datetime.utcnow()
        alert.read_by_id = current_user.id
        db.commit()
    return {"status": "ok"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Alert).filter(Alert.is_read == False).update({
        "is_read": True,
        "read_at": datetime.utcnow(),
        "read_by_id": current_user.id,
    })
    db.commit()
    return {"status": "ok"}
