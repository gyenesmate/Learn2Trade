from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
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


class Investment(Base):
    __tablename__ = "investment"
    __table_args__ = (
        CheckConstraint("amount > 0::numeric", name="chk_investment_amount"),
        CheckConstraint(
            "buying_price >= 0::numeric",
            name="chk_investment_buying_price",
        ),
        CheckConstraint(
            "selling_price IS NULL OR selling_price >= 0::numeric",
            name="chk_investment_selling_price",
        ),
        CheckConstraint(
            "(selling_price IS NULL AND sold_at IS NULL)"
            " OR (selling_price IS NOT NULL AND sold_at IS NOT NULL)",
            name="chk_investment_sale_state",
        ),
        CheckConstraint(
            "sold_at IS NULL OR sold_at >= created_at",
            name="chk_investment_sale_date",
        ),
        Index("idx_investment_user_id", "user_id"),
        Index("idx_investment_crypto_currency_id", "crypto_currency_id"),
        Index(
            "idx_investment_user_open",
            "user_id",
            postgresql_where=text("sold_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app_user.id", ondelete="CASCADE", name="fk_investment_user"),
        nullable=False,
    )
    crypto_currency_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "crypto_currency.id",
            ondelete="RESTRICT",
            name="fk_investment_crypto",
        ),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(30, 12), nullable=False)
    buying_price: Mapped[Decimal] = mapped_column(Numeric(30, 12), nullable=False)
    selling_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(30, 12),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sold_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[AppUser] = relationship(back_populates="investments")
    crypto_currency: Mapped[CryptoCurrency] = relationship(
        back_populates="investments",
    )
