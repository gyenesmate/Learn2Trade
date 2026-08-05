from __future__ import annotations

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.cryptocurrency import CryptoCurrency
from app.models.user import AppUser
from app.models.watchlist import WatchlistSubscription
from app.schemas.watchlist import WatchlistCreateRequest, WatchlistSubscriptionRead

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("/me", response_model=List[WatchlistSubscriptionRead])
def list_my_watchlist(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> List[WatchlistSubscription]:
    return (
        db.query(WatchlistSubscription)
        .filter(WatchlistSubscription.user_id == current_user.id)
        .order_by(WatchlistSubscription.created_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=WatchlistSubscriptionRead,
    status_code=status.HTTP_201_CREATED,
)
def subscribe(
    payload: WatchlistCreateRequest,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> WatchlistSubscription:
    crypto = db.get(CryptoCurrency, payload.crypto_currency_id)
    if crypto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cryptocurrency not found",
        )

    subscription = WatchlistSubscription(
        user_id=current_user.id,
        crypto_currency_id=payload.crypto_currency_id,
    )
    db.add(subscription)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already subscribed to this cryptocurrency",
        ) from exc
    db.refresh(subscription)
    return subscription


@router.delete(
    "/{crypto_currency_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unsubscribe(
    crypto_currency_id: UUID,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    subscription = (
        db.query(WatchlistSubscription)
        .filter(
            WatchlistSubscription.user_id == current_user.id,
            WatchlistSubscription.crypto_currency_id == crypto_currency_id,
        )
        .first()
    )
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist subscription not found",
        )
    db.delete(subscription)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
