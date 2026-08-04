from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cryptocurrency import CryptoCurrency
    from app.models.user import AppUser


class WatchlistSubscription(Base):
    __tablename__ = "watchlist_subscription"
    __table_args__ = (
        Index("idx_watchlist_crypto_currency_id", "crypto_currency_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "app_user.id",
            ondelete="CASCADE",
            name="fk_watchlist_subscription_user",
        ),
        primary_key=True,
    )
    crypto_currency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "crypto_currency.id",
            ondelete="CASCADE",
            name="fk_watchlist_subscription_crypto",
        ),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[AppUser] = relationship(back_populates="watchlist_subscriptions")
    crypto_currency: Mapped[CryptoCurrency] = relationship(
        back_populates="watchlist_subscriptions",
    )
