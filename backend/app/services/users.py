from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.investment import Investment
from app.models.user import AppUser, UserPreference, UserWallet
from app.schemas.user import Theme, UserMeRead


def round_money(amount: Decimal) -> Decimal:
    """Match frontend Number(amount.toFixed(2)) rounding."""
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def ensure_user_defaults(db: Session, user: AppUser) -> AppUser:
    if user.preference is None:
        preference = UserPreference(user_id=user.id, theme=Theme.LIGHT.value)
        db.add(preference)
        user.preference = preference
    if user.wallet is None:
        wallet = UserWallet(
            user_id=user.id,
            currency_code="USD",
            balance=Decimal("0"),
        )
        db.add(wallet)
        user.wallet = wallet
    return user


def compute_profit_index(db: Session, user_id: UUID) -> Decimal:
    investments = (
        db.execute(
            select(Investment).where(
                Investment.user_id == user_id,
                Investment.sold_at.is_not(None),
                Investment.selling_price.is_not(None),
            )
        )
        .scalars()
        .all()
    )
    profit = Decimal("0")
    for investment in investments:
        if investment.buying_price == 0:
            continue
        payout = investment.amount * (
            investment.selling_price / investment.buying_price
        )
        profit += payout - investment.amount
    return round_money(profit)


def build_user_me(db: Session, user: AppUser) -> UserMeRead:
    ensure_user_defaults(db, user)
    theme = Theme(user.preference.theme) if user.preference else Theme.SYSTEM
    balance = user.wallet.balance if user.wallet else Decimal("0")
    currency_code = user.wallet.currency_code if user.wallet else "USD"
    return UserMeRead(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        is_admin=user.is_admin,
        is_banned=user.is_banned,
        created_at=user.created_at,
        updated_at=user.updated_at,
        theme=theme,
        balance=balance,
        currency_code=currency_code,
        profit_index=compute_profit_index(db, user.id),
    )
