from __future__ import annotations

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.cryptocurrency import CryptoCurrency
from app.models.price_alert import PriceAlert
from app.models.user import AppUser
from app.schemas.price_alert import (
    PriceAlertCreateRequest,
    PriceAlertRead,
    PriceAlertUpdate,
)

router = APIRouter(prefix="/price-alerts", tags=["price-alerts"])


@router.get("/me", response_model=List[PriceAlertRead])
def list_my_alerts(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> List[PriceAlert]:
    return (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == current_user.id)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=PriceAlertRead,
    status_code=status.HTTP_201_CREATED,
)
def create_alert(
    payload: PriceAlertCreateRequest,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PriceAlert:
    crypto = db.get(CryptoCurrency, payload.crypto_currency_id)
    if crypto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cryptocurrency not found",
        )

    alert = PriceAlert(
        user_id=current_user.id,
        crypto_currency_id=payload.crypto_currency_id,
        alert_price=payload.alert_price,
        description=payload.description,
        alert_type=payload.alert_type.value,
        is_active=payload.is_active,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/{alert_id}", response_model=PriceAlertRead)
def update_alert(
    alert_id: UUID,
    payload: PriceAlertUpdate,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PriceAlert:
    alert = db.get(PriceAlert, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Price alert not found",
        )
    if alert.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to update this alert",
        )

    data = payload.model_dump(exclude_unset=True)
    if "alert_type" in data and data["alert_type"] is not None:
        data["alert_type"] = data["alert_type"].value
    for field, value in data.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: UUID,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    alert = db.get(PriceAlert, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Price alert not found",
        )
    if alert.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to delete this alert",
        )
    db.delete(alert)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
