from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_admin
from app.db.database import get_db
from app.models.user import AppUser
from app.schemas.user import (
    UserMeRead,
    UserProfileUpdate,
    UserRead,
    WalletAmountRequest,
)
from app.services.investments import credit_wallet, debit_wallet
from app.services.users import build_user_me, ensure_user_defaults

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserRead])
def list_users(
    _: Annotated[AppUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> List[AppUser]:
    return db.query(AppUser).order_by(AppUser.created_at.desc()).all()


@router.get("/me", response_model=UserMeRead)
def get_me(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeRead:
    return build_user_me(db, current_user)


@router.patch("/me", response_model=UserMeRead)
def update_me(
    payload: UserProfileUpdate,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeRead:
    ensure_user_defaults(db, current_user)

    if payload.username is not None:
        current_user.username = payload.username
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.theme is not None and current_user.preference is not None:
        current_user.preference.theme = payload.theme.value

    current_user.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        ) from exc

    db.refresh(current_user)
    user = (
        db.query(AppUser)
        .options(joinedload(AppUser.preference), joinedload(AppUser.wallet))
        .filter(AppUser.id == current_user.id)
        .one()
    )
    return build_user_me(db, user)


@router.post("/me/wallet/deposit", response_model=UserMeRead)
def deposit(
    payload: WalletAmountRequest,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeRead:
    credit_wallet(db, current_user.id, payload.amount)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    user = (
        db.query(AppUser)
        .options(joinedload(AppUser.preference), joinedload(AppUser.wallet))
        .filter(AppUser.id == current_user.id)
        .one()
    )
    return build_user_me(db, user)


@router.post("/me/wallet/withdraw", response_model=UserMeRead)
def withdraw(
    payload: WalletAmountRequest,
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeRead:
    debit_wallet(db, current_user.id, payload.amount)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    user = (
        db.query(AppUser)
        .options(joinedload(AppUser.preference), joinedload(AppUser.wallet))
        .filter(AppUser.id == current_user.id)
        .one()
    )
    return build_user_me(db, user)


@router.post("/{user_id}/ban", response_model=UserRead)
def ban_user(
    user_id: UUID,
    admin: Annotated[AppUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AppUser:
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ban yourself",
        )
    user = db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.is_banned = True
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/unban", response_model=UserRead)
def unban_user(
    user_id: UUID,
    _: Annotated[AppUser, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AppUser:
    user = db.get(AppUser, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.is_banned = False
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
