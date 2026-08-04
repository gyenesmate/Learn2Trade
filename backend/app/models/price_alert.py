from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cryptocurrency import CryptoCurrency
    from app.models.user import AppUser


class PriceAlert(Base):
    __tablename__ = "price_alert"
    __table_args__ = (
        CheckConstraint(
            "alert_price >= 0::numeric",
            name="chk_price_alert_price",
        ),
        CheckConstraint(
            "alert_type::text = ANY (ARRAY['above'::character varying,"
            " 'below'::character varying]::text[])",
            name="chk_price_alert_type",
        ),
        Index("idx_price_alert_user_id", "user_id"),
        Index("idx_price_alert_crypto_currency_id", "crypto_currency_id"),
        Index(
            "idx_price_alert_active",
            "crypto_currency_id",
            "alert_type",
            "alert_price",
            postgresql_where=text("is_active = true"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE", name="fk_price_alert_user"),
        nullable=False,
    )
    crypto_currency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "crypto_currency.id",
            ondelete="CASCADE",
            name="fk_price_alert_crypto",
        ),
        nullable=False,
    )
    alert_price: Mapped[Decimal] = mapped_column(Numeric(30, 12), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    alert_type: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[AppUser] = relationship(back_populates="price_alerts")
    crypto_currency: Mapped[CryptoCurrency] = relationship(
        back_populates="price_alerts",
    )
