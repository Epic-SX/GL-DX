from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contract import Contract, ContractStatus
from app.models.user import User
from app.api.deps import get_current_user, require_manager

router = APIRouter(prefix="/contracts", tags=["contracts"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class ContractCreate(BaseModel):
    fc_store_name: str
    owner_name: str
    contract_type: str = "FC加盟契約"
    amount: Decimal = Decimal(0)
    notes: Optional[str] = None


class ContractOut(BaseModel):
    id: int
    contract_number: str
    fc_store_name: str
    owner_name: str
    contract_type: str
    amount: float
    status: str
    notes: Optional[str]
    created_at: datetime
    sent_at: Optional[datetime]
    signed_at: Optional[datetime]
    expires_at: Optional[datetime]
    model_config = {"from_attributes": True}


def _next_contract_number(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"CTR-{year}-"
    count = db.query(Contract).filter(Contract.contract_number.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:03d}"


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ContractOut])
def list_contracts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Contract)
    if status:
        q = q.filter(Contract.status == status)
    return q.order_by(desc(Contract.created_at)).all()


@router.post("", response_model=ContractOut)
def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    contract = Contract(
        contract_number=_next_contract_number(db),
        status=ContractStatus.draft,
        **data.model_dump(),
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/{contract_id}/send", response_model=ContractOut)
def send_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    contract.status = ContractStatus.sent
    contract.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)
    return contract


@router.post("/{contract_id}/sign", response_model=ContractOut)
def sign_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    now = datetime.utcnow()
    contract.status = ContractStatus.signed
    contract.signed_at = now
    contract.expires_at = now + timedelta(days=365)
    db.commit()
    db.refresh(contract)
    return contract
