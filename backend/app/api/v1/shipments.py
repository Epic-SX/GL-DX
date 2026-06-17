from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.shipment import Shipment, DeliveryNote, ShipmentRecipient, Receipt
from app.models.order import Order
from app.models.user import User
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate, ShipmentOut, DeliveryNoteOut,
    ShipmentRecipientCreate, ShipmentRecipientOut,
)
from app.api.deps import get_current_user, require_staff
from app.services.pdf_service import generate_delivery_note_pdf, generate_receipt_pdf
from app.services.sagawa_service import export_sagawa_csv
import io
from datetime import datetime, date

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.post("", response_model=ShipmentOut)
def create_shipment(
    data: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    existing = db.query(Shipment).filter(Shipment.order_id == data.order_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Shipment already exists for this order")

    shipment = Shipment(**data.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


@router.get("/{shipment_id}", response_model=ShipmentOut)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.patch("/{shipment_id}", response_model=ShipmentOut)
def update_shipment(
    shipment_id: int,
    data: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(shipment, k, v)
    db.commit()
    db.refresh(shipment)
    return shipment


@router.post("/{shipment_id}/delivery-note", response_model=DeliveryNoteOut)
def create_delivery_note(
    shipment_id: int,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        # Also try lookup by order_id
        shipment = db.query(Shipment).filter(Shipment.order_id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    existing = db.query(DeliveryNote).filter(DeliveryNote.shipment_id == shipment.id).first()
    if existing:
        return existing

    note_number = f"DN-{date.today().strftime('%Y%m%d')}-{shipment.id:05d}"
    pdf_url = generate_delivery_note_pdf(shipment, note_number)

    dn = DeliveryNote(
        shipment_id=shipment.id,
        note_number=note_number,
        pdf_url=pdf_url,
        notes=notes,
    )
    db.add(dn)
    db.commit()
    db.refresh(dn)
    return dn


@router.get("/sagawa/export-csv")
def export_sagawa(
    shipment_ids: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    ids = [int(i) for i in shipment_ids.split(",") if i.strip().isdigit()]
    shipments = db.query(Shipment).filter(Shipment.id.in_(ids)).all()
    if not shipments:
        raise HTTPException(status_code=404, detail="No shipments found")

    csv_content = export_sagawa_csv(shipments)
    for s in shipments:
        s.sagawa_csv_exported = True
    db.commit()

    return Response(
        content=csv_content,
        media_type="text/csv; charset=shift-jis",
        headers={"Content-Disposition": f"attachment; filename=sagawa_export.csv"},
    )


@router.post("/{shipment_id}/receipt")
def create_receipt(
    shipment_id: int,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """受領書PDFを発行する (shipment_id または order_id で受け付ける)"""
    # Try by shipment.id first, then by order_id
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        shipment = db.query(Shipment).filter(Shipment.order_id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    existing = db.query(Receipt).filter(Receipt.shipment_id == shipment.id).first()
    if existing:
        return {"receipt_number": existing.receipt_number, "pdf_url": existing.pdf_url}

    receipt_number = f"REC-{date.today().strftime('%Y%m%d')}-{shipment.id:05d}"
    pdf_url = generate_receipt_pdf(shipment, receipt_number)

    receipt = Receipt(
        shipment_id=shipment.id,
        receipt_number=receipt_number,
        pdf_url=pdf_url,
        notes=notes,
    )
    db.add(receipt)
    db.commit()
    return {"receipt_number": receipt_number, "pdf_url": pdf_url}


# Recipient Master
@router.get("/recipients/list", response_model=List[ShipmentRecipientOut])
def list_recipients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ShipmentRecipient).order_by(ShipmentRecipient.name).all()


@router.post("/recipients", response_model=ShipmentRecipientOut)
def create_recipient(
    data: ShipmentRecipientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    recipient = ShipmentRecipient(**data.model_dump())
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return recipient
