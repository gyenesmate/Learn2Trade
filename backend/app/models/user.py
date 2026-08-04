from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import CITEXT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cryptocurrency import CryptoCurrency
    from app.models.investment import Investment
    from app.models.price_alert import PriceAlert
    from app.models.watchlist import WatchlistSubscription


class AppUser(Base):
    __tablename__ = "app_user"
    __table_args__ = (
        UniqueConstraint("username", name="uq_app_user_username"),
        UniqueConstraint("email", name="uq_app_user_email"),
        CheckConstraint(
            "length(TRIM(BOTH FROM username::text)) > 0",
            name="chk_app_user_username_not_empty",
        ),
        CheckConstraint(
            "length(TRIM(BOTH FROM email::text)) > 0",
            name="chk_app_user_email_not_empty",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    username: Mapped[str] = mapped_column(CITEXT, nullable=False)
    email: Mapped[str] = mapped_column(CITEXT, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    is_banned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
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

    preference: Mapped[Optional[UserPreference]] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    wallet: Mapped[Optional[UserWallet]] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    watchlist_subscriptions: Mapped[List[WatchlistSubscription]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    investments: Mapped[List[Investment]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    price_alerts: Mapped[List[PriceAlert]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserPreference(Base):
    __tablename__ = "user_preference"
    __table_args__ = (
        CheckConstraint(
            "theme::text = ANY (ARRAY['light'::character varying,"
            " 'dark'::character varying, 'system'::character varying]::text[])",
            name="chk_user_preference_theme",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE", name="fk_user_preference_user"),
        primary_key=True,
    )
    theme: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'system'"),
    )

    user: Mapped[AppUser] = relationship(back_populates="preference")


class UserWallet(Base):
    __tablename__ = "user_wallet"
    __table_args__ = (
        CheckConstraint("balance >= 0::numeric", name="chk_user_wallet_balance"),
        CheckConstraint(
            "currency_code::text = upper(currency_code::text)",
            name="chk_user_wallet_currency_code",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE", name="fk_user_wallet_user"),
        primary_key=True,
    )
    currency_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        server_default=text("'USD'"),
    )
    balance: Mapped[Decimal] = mapped_column(
        Numeric(20, 8),
        nullable=False,
        server_default=text("0"),
    )
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

    user: Mapped[AppUser] = relationship(back_populates="wallet")
