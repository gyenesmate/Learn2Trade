from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.database import get_db
from app.models.cryptocurrency import CryptoCurrency
from app.models.user import AppUser
from app.schemas.cryptocurrency import (
    CryptoCurrencyCreate,
    CryptoCurrencyRead,
    CryptoCurrencyUpdate,
)

router = APIRouter(prefix="/cryptocurrencies", tags=["cryptocurrencies"])


@router.get("", response_model=List[CryptoCurrencyRead])
def list_cryptocurrencies(
    _: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> List[CryptoCurrency]:
    return db.query(CryptoCurrency).order_by(CryptoCurrency.name.asc()).all()


@router.get("/{crypto_id}", response_model=CryptoCurrencyRead)
def get_cryptocurrency(
    crypto_id: UUID,
    _: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CryptoCurrency:
    crypto = db.get(CryptoCurrency, crypto_id)
    if crypto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cryptocurrency not found",
        )
    return crypto


@router.post(
    "",
    response_model=CryptoCurrencyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_cryptocurrency(
    payload: CryptoCurrencyCreate,
    _: Annotated[AppUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> CryptoCurrency:
    crypto = CryptoCurrency(
        name=payload.name,
        symbol=payload.symbol,
        exchange_currency=payload.exchange_currency,
    )
    db.add(crypto)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cryptocurrency pair already exists",
        ) from exc
    db.refresh(crypto)
    return crypto


@router.patch("/{crypto_id}", response_model=CryptoCurrencyRead)
def update_cryptocurrency(
    crypto_id: UUID,
    payload: CryptoCurrencyUpdate,
    _: Annotated[AppUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> CryptoCurrency:
    crypto = db.get(CryptoCurrency, crypto_id)
    if crypto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cryptocurrency not found",
        )

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(crypto, field, value)
    crypto.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cryptocurrency pair already exists",
        ) from exc
    db.refresh(crypto)
    return crypto


@router.delete("/{crypto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cryptocurrency(
    crypto_id: UUID,
    _: Annotated[AppUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    crypto = db.get(CryptoCurrency, crypto_id)
    if crypto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cryptocurrency not found",
        )
    try:
        db.delete(crypto)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cryptocurrency is referenced by investments",
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
