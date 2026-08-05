from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cryptocurrency import CryptoCurrency
from app.models.investment import Investment
from app.models.user import UserWallet
from app.services.users import round_money


def get_wallet_for_update(db: Session, user_id: UUID) -> UserWallet:
    wallet = (
        db.execute(
            select(UserWallet)
            .where(UserWallet.user_id == user_id)
            .with_for_update()
        )
        .scalars()
        .first()
    )
    if wallet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found",
        )
    return wallet


def credit_wallet(db: Session, user_id: UUID, amount: Decimal) -> UserWallet:
    rounded = round_money(amount)
    if rounded <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0",
        )
    wallet = get_wallet_for_update(db, user_id)
    wallet.balance = wallet.balance + rounded
    wallet.updated_at = datetime.now(timezone.utc)
    return wallet


def debit_wallet(db: Session, user_id: UUID, amount: Decimal) -> UserWallet:
    rounded = round_money(amount)
    if rounded <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0",
        )
    wallet = get_wallet_for_update(db, user_id)
    if wallet.balance < rounded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance",
        )
    wallet.balance = wallet.balance - rounded
    wallet.updated_at = datetime.now(timezone.utc)
    return wallet


def create_investment(
    db: Session,
    *,
    user_id: UUID,
    crypto_currency_id: UUID,
    amount: Decimal,
    buying_price: Decimal,
    description: Optional[str],
) -> Investment:
    crypto = db.get(CryptoCurrency, crypto_currency_id)
    if crypto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cryptocurrency not found",
        )

    debit_wallet(db, user_id, amount)
    investment = Investment(
        user_id=user_id,
        crypto_currency_id=crypto_currency_id,
        amount=amount,
        buying_price=buying_price,
        selling_price=None,
        description=description,
        sold_at=None,
    )
    db.add(investment)
    db.flush()
    return investment


def sell_investment(
    db: Session,
    *,
    user_id: UUID,
    investment_id: UUID,
    selling_price: Decimal,
) -> Investment:
    investment = (
        db.execute(
            select(Investment)
            .where(Investment.id == investment_id)
            .with_for_update()
        )
        .scalars()
        .first()
    )
    if investment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        )
    if investment.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to sell this investment",
        )
    if investment.sold_at is not None or investment.selling_price is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Investment already sold",
        )
    if investment.buying_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid investment buying price",
        )

    payout = investment.amount * (selling_price / investment.buying_price)
    now = datetime.now(timezone.utc)
    investment.selling_price = selling_price
    investment.sold_at = now
    credit_wallet(db, user_id, payout)
    db.flush()
    return investment
