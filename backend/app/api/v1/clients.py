from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.client import Client, ClientType
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from app.api.deps import get_current_user, require_staff, require_manager

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=List[ClientOut])
def list_clients(
    q: Optional[str] = Query(None),
    client_type: Optional[ClientType] = Query(None),
    active_only: bool = Query(True),
    page: int = Query(1),
    per_page: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Client)
    if active_only:
        query = query.filter(Client.is_active == True)
    if client_type:
        query = query.filter(Client.client_type == client_type)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Client.name.ilike(like),
                Client.company.ilike(like),
                Client.email.ilike(like),
                Client.phone.ilike(like),
            )
        )
    return query.order_by(Client.company, Client.name).offset((page - 1) * per_page).limit(per_page).all()


@router.post("", response_model=ClientOut)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    client = Client(**data.model_dump(), created_by_id=current_user.id)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientOut)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(client, k, v)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    client.is_active = False
    db.commit()
    return {"status": "deactivated"}
