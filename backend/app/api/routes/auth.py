from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.models.user import AppUser, UserPreference, UserWallet
from app.schemas.user import (
    Theme,
    TokenResponse,
    UserLogin,
    UserMeRead,
    UserRegister,
)
from app.services.users import build_user_me, ensure_user_defaults

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserRegister,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    existing = db.execute(
        select(AppUser).where(
            (AppUser.email == payload.email) | (AppUser.username == payload.username)
        )
    ).scalars().first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered",
        )

    user = AppUser(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        avatar_url=payload.avatar_url,
        is_admin=False,
        is_banned=False,
    )
    db.add(user)
    db.flush()

    db.add(UserPreference(user_id=user.id, theme=Theme.LIGHT.value))
    db.add(
        UserWallet(
            user_id=user.id,
            currency_code="USD",
            balance=0,
        )
    )

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered",
        ) from exc

    user = (
        db.query(AppUser)
        .options(joinedload(AppUser.preference), joinedload(AppUser.wallet))
        .filter(AppUser.id == user.id)
        .one()
    )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=build_user_me(db, user))


@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    user = (
        db.query(AppUser)
        .options(joinedload(AppUser.preference), joinedload(AppUser.wallet))
        .filter(AppUser.email == payload.email)
        .first()
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is banned",
        )

    ensure_user_defaults(db, user)
    db.commit()
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=build_user_me(db, user))


@router.get("/me", response_model=UserMeRead)
def me(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeRead:
    return build_user_me(db, current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    """Stateless JWT logout; clients discard the access token."""
    return Response(status_code=status.HTTP_204_NO_CONTENT)
