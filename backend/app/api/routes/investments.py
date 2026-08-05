from __future__ import annotations

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.investment import Investment
from app.models.user import AppUser
from app.schemas.investment import (
    InvestmentCreateRequest,
    InvestmentRead,
    InvestmentSellRequest,
)
from app.services.investments import create_investment, sell_investment

router = APIRouter(prefix="/investments", tags=["investments"])


@router.get("/me", response_model=List[InvestmentRead])
def list_my_investments(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> List[Investment]:
    return (
        db.query(Investment)
        .filter(Investment.user_id == current_user.id)
        .order_by(Investment.created_at.desc())
        .all()
    )


@router.get("/me/active", response_model=List[InvestmentRead])
def list_my_active_investments(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    crypto_currency_id: Optional[UUID] = Query(default=None),
) -> List[Investment]:
    query = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.sold_at.is_(None),
    )
    if crypto_currency_id is not None:
        query = query.filter(Investment.crypto_currency_id == crypto_currency_id)
    return query.order_by(Investment.created_at.desc()).all()


@router.post(
    "",
    response_model=InvestmentRead,
    status_code=201,
)
def open_investment(
    payload: InvestmentCreateRequest,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Investment:
    investment = create_investment(
        db,
        user_id=current_user.id,
        crypto_currency_id=payload.crypto_currency_id,
        amount=payload.amount,
        buying_price=payload.buying_price,
        description=payload.description,
    )
    db.commit()
    db.refresh(investment)
    return investment


@router.post("/{investment_id}/sell", response_model=InvestmentRead)
def sell(
    investment_id: UUID,
    payload: InvestmentSellRequest,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Investment:
    investment = sell_investment(
        db,
        user_id=current_user.id,
        investment_id=investment_id,
        selling_price=payload.selling_price,
    )
    db.commit()
    db.refresh(investment)
    return investment
