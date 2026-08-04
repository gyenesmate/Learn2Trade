from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.investment import Investment
    from app.models.price_alert import PriceAlert
    from app.models.watchlist import WatchlistSubscription


class CryptoCurrency(Base):
    __tablename__ = "crypto_currency"
    __table_args__ = (
        UniqueConstraint(
            "symbol",
            "exchange_currency",
            name="uq_crypto_currency_pair",
        ),
        CheckConstraint(
            "length(TRIM(BOTH FROM name)) > 0",
            name="chk_crypto_currency_name_not_empty",
        ),
        CheckConstraint(
            "length(TRIM(BOTH FROM symbol)) > 0"
            " AND symbol::text = upper(symbol::text)",
            name="chk_crypto_currency_symbol_uppercase",
        ),
        CheckConstraint(
            "length(TRIM(BOTH FROM exchange_currency)) > 0"
            " AND exchange_currency::text = upper(exchange_currency::text)",
            name="chk_crypto_currency_exchange_uppercase",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    exchange_currency: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    watchlist_subscriptions: Mapped[List[WatchlistSubscription]] = relationship(
        back_populates="crypto_currency",
        cascade="all, delete-orphan",
    )
    investments: Mapped[List[Investment]] = relationship(
        back_populates="crypto_currency",
    )
    price_alerts: Mapped[List[PriceAlert]] = relationship(
        back_populates="crypto_currency",
        cascade="all, delete-orphan",
    )
