from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.accounting import AccountingEntry, BankAccount, TransferStatus
from app.models.user import User
from app.api.deps import get_current_user, require_staff, require_manager

router = APIRouter(prefix="/accounting", tags=["accounting"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class BankAccountCreate(BaseModel):
    bank_name: str
    branch_name: str
    account_type: str = "ordinary"
    account_number: str
    account_holder: str
    is_default: bool = False
    notes: Optional[str] = None


class BankAccountOut(BaseModel):
    id: int
    bank_name: str
    branch_name: str
    account_type: str
    account_number: str
    account_holder: str
    is_default: bool
    notes: Optional[str]
    model_config = {"from_attributes": True}


class EntryCreate(BaseModel):
    entry_date: date
    client_id: Optional[int] = None
    bank_account_id: Optional[int] = None
    description: str
    amount: Decimal
    notes: Optional[str] = None


class EntryUpdate(BaseModel):
    transfer_status: Optional[str] = None
    bank_account_id: Optional[int] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None


class EntryOut(BaseModel):
    id: int
    voucher_number: str
    entry_date: date
    client_id: Optional[int]
    client_name: Optional[str] = None
    bank_account_id: Optional[int]
    bank_account_name: Optional[str] = None
    description: str
    amount: float
    transfer_status: str
    notes: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Bank Accounts ─────────────────────────────────────────────────────────────

@router.get("/bank-accounts", response_model=List[BankAccountOut])
def list_bank_accounts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(BankAccount).order_by(BankAccount.is_default.desc(), BankAccount.bank_name).all()


@router.post("/bank-accounts", response_model=BankAccountOut)
def create_bank_account(
    data: BankAccountCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    if data.is_default:
        db.query(BankAccount).update({"is_default": False})
    account = BankAccount(**data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.patch("/bank-accounts/{account_id}", response_model=BankAccountOut)
def update_bank_account(
    account_id: int,
    data: BankAccountCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    if data.is_default:
        db.query(BankAccount).filter(BankAccount.id != account_id).update({"is_default": False})
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(account, k, v)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/bank-accounts/{account_id}", status_code=204)
def delete_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    db.delete(account)
    db.commit()


# ── Accounting Entries ────────────────────────────────────────────────────────

def _generate_voucher(db: Session, entry_date: date) -> str:
    prefix = f"V{entry_date.strftime('%Y%m%d')}"
    count = db.query(AccountingEntry).filter(AccountingEntry.voucher_number.like(f"{prefix}%")).count()
    return f"{prefix}-{count + 1:04d}"


@router.get("/entries", response_model=List[EntryOut])
def list_entries(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    transfer_status: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(AccountingEntry)
    if start_date:
        query = query.filter(AccountingEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.entry_date <= end_date)
    if transfer_status:
        query = query.filter(AccountingEntry.transfer_status == transfer_status)
    if client_id:
        query = query.filter(AccountingEntry.client_id == client_id)
    entries = query.order_by(desc(AccountingEntry.entry_date)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for e in entries:
        out = EntryOut(
            id=e.id,
            voucher_number=e.voucher_number,
            entry_date=e.entry_date,
            client_id=e.client_id,
            client_name=e.client.name if e.client else None,
            bank_account_id=e.bank_account_id,
            bank_account_name=(
                f"{e.bank_account.bank_name} {e.bank_account.branch_name}" if e.bank_account else None
            ),
            description=e.description,
            amount=float(e.amount),
            transfer_status=e.transfer_status,
            notes=e.notes,
            created_at=e.created_at,
        )
        result.append(out)
    return result


@router.post("/entries", response_model=EntryOut)
def create_entry(
    data: EntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    voucher = _generate_voucher(db, data.entry_date)
    entry = AccountingEntry(
        **data.model_dump(),
        voucher_number=voucher,
        transfer_status=TransferStatus.pending,
        created_by_id=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return EntryOut(
        id=entry.id, voucher_number=entry.voucher_number, entry_date=entry.entry_date,
        client_id=entry.client_id, client_name=entry.client.name if entry.client else None,
        bank_account_id=entry.bank_account_id,
        bank_account_name=f"{entry.bank_account.bank_name} {entry.bank_account.branch_name}" if entry.bank_account else None,
        description=entry.description, amount=float(entry.amount),
        transfer_status=entry.transfer_status, notes=entry.notes, created_at=entry.created_at,
    )


@router.patch("/entries/{entry_id}", response_model=EntryOut)
def update_entry(
    entry_id: int,
    data: EntryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    entry = db.query(AccountingEntry).filter(AccountingEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return EntryOut(
        id=entry.id, voucher_number=entry.voucher_number, entry_date=entry.entry_date,
        client_id=entry.client_id, client_name=entry.client.name if entry.client else None,
        bank_account_id=entry.bank_account_id,
        bank_account_name=f"{entry.bank_account.bank_name} {entry.bank_account.branch_name}" if entry.bank_account else None,
        description=entry.description, amount=float(entry.amount),
        transfer_status=entry.transfer_status, notes=entry.notes, created_at=entry.created_at,
    )


@router.delete("/entries/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    entry = db.query(AccountingEntry).filter(AccountingEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()


@router.get("/summary")
def accounting_summary(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy import func, extract
    y = year or date.today().year
    rows = db.query(AccountingEntry).filter(
        extract("year", AccountingEntry.entry_date) == y
    ).all()
    total = sum(float(e.amount) for e in rows)
    paid = sum(float(e.amount) for e in rows if e.transfer_status == TransferStatus.paid)
    pending = sum(float(e.amount) for e in rows if e.transfer_status == TransferStatus.pending)
    return {"year": y, "total": total, "paid": paid, "pending": pending, "entry_count": len(rows)}
