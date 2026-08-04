"""baseline existing schema

Revision ID: 68d18c9bb6b5
Revises:
Create Date: 2026-08-04 22:23:24.072570

Represents the already-deployed Learn2Trade PostgreSQL schema.

For an existing database that already has these tables, do NOT run
``alembic upgrade head``. Use ``alembic stamp head`` instead.

Only run ``alembic upgrade head`` against an empty database.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "68d18c9bb6b5"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.create_table(
        "app_user",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("username", postgresql.CITEXT(), nullable=False),
        sa.Column("email", postgresql.CITEXT(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column(
            "is_admin",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "is_banned",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "length(TRIM(BOTH FROM username::text)) > 0",
            name="chk_app_user_username_not_empty",
        ),
        sa.CheckConstraint(
            "length(TRIM(BOTH FROM email::text)) > 0",
            name="chk_app_user_email_not_empty",
        ),
        sa.PrimaryKeyConstraint("id", name="app_user_pkey"),
        sa.UniqueConstraint("email", name="uq_app_user_email"),
        sa.UniqueConstraint("username", name="uq_app_user_username"),
    )

    op.create_table(
        "crypto_currency",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("exchange_currency", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "length(TRIM(BOTH FROM name)) > 0",
            name="chk_crypto_currency_name_not_empty",
        ),
        sa.CheckConstraint(
            "length(TRIM(BOTH FROM symbol)) > 0"
            " AND symbol::text = upper(symbol::text)",
            name="chk_crypto_currency_symbol_uppercase",
        ),
        sa.CheckConstraint(
            "length(TRIM(BOTH FROM exchange_currency)) > 0"
            " AND exchange_currency::text = upper(exchange_currency::text)",
            name="chk_crypto_currency_exchange_uppercase",
        ),
        sa.PrimaryKeyConstraint("id", name="crypto_currency_pkey"),
        sa.UniqueConstraint(
            "symbol",
            "exchange_currency",
            name="uq_crypto_currency_pair",
        ),
    )

    op.create_table(
        "user_preference",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "theme",
            sa.String(length=20),
            server_default=sa.text("'system'"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "theme::text = ANY (ARRAY['light'::character varying,"
            " 'dark'::character varying, 'system'::character varying]::text[])",
            name="chk_user_preference_theme",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_user.id"],
            name="fk_user_preference_user",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", name="user_preference_pkey"),
    )

    op.create_table(
        "user_wallet",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "currency_code",
            sa.String(length=10),
            server_default=sa.text("'USD'"),
            nullable=False,
        ),
        sa.Column(
            "balance",
            sa.Numeric(20, 8),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("balance >= 0::numeric", name="chk_user_wallet_balance"),
        sa.CheckConstraint(
            "currency_code::text = upper(currency_code::text)",
            name="chk_user_wallet_currency_code",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_user.id"],
            name="fk_user_wallet_user",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", name="user_wallet_pkey"),
    )

    op.create_table(
        "watchlist_subscription",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("crypto_currency_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["crypto_currency_id"],
            ["crypto_currency.id"],
            name="fk_watchlist_subscription_crypto",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_user.id"],
            name="fk_watchlist_subscription_user",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "user_id",
            "crypto_currency_id",
            name="watchlist_subscription_pkey",
        ),
    )
    op.create_index(
        "idx_watchlist_crypto_currency_id",
        "watchlist_subscription",
        ["crypto_currency_id"],
        unique=False,
    )

    op.create_table(
        "investment",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("crypto_currency_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(30, 12), nullable=False),
        sa.Column("buying_price", sa.Numeric(30, 12), nullable=False),
        sa.Column("selling_price", sa.Numeric(30, 12), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sold_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("amount > 0::numeric", name="chk_investment_amount"),
        sa.CheckConstraint(
            "buying_price >= 0::numeric",
            name="chk_investment_buying_price",
        ),
        sa.CheckConstraint(
            "selling_price IS NULL OR selling_price >= 0::numeric",
            name="chk_investment_selling_price",
        ),
        sa.CheckConstraint(
            "(selling_price IS NULL AND sold_at IS NULL)"
            " OR (selling_price IS NOT NULL AND sold_at IS NOT NULL)",
            name="chk_investment_sale_state",
        ),
        sa.CheckConstraint(
            "sold_at IS NULL OR sold_at >= created_at",
            name="chk_investment_sale_date",
        ),
        sa.ForeignKeyConstraint(
            ["crypto_currency_id"],
            ["crypto_currency.id"],
            name="fk_investment_crypto",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_user.id"],
            name="fk_investment_user",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="investment_pkey"),
    )
    op.create_index(
        "idx_investment_crypto_currency_id",
        "investment",
        ["crypto_currency_id"],
        unique=False,
    )
    op.create_index("idx_investment_user_id", "investment", ["user_id"], unique=False)
    op.create_index(
        "idx_investment_user_open",
        "investment",
        ["user_id"],
        unique=False,
        postgresql_where=sa.text("sold_at IS NULL"),
    )

    op.create_table(
        "price_alert",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("crypto_currency_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("alert_price", sa.Numeric(30, 12), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("alert_type", sa.String(length=10), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "alert_price >= 0::numeric",
            name="chk_price_alert_price",
        ),
        sa.CheckConstraint(
            "alert_type::text = ANY (ARRAY['above'::character varying,"
            " 'below'::character varying]::text[])",
            name="chk_price_alert_type",
        ),
        sa.ForeignKeyConstraint(
            ["crypto_currency_id"],
            ["crypto_currency.id"],
            name="fk_price_alert_crypto",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_user.id"],
            name="fk_price_alert_user",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="price_alert_pkey"),
    )
    op.create_index(
        "idx_price_alert_crypto_currency_id",
        "price_alert",
        ["crypto_currency_id"],
        unique=False,
    )
    op.create_index("idx_price_alert_user_id", "price_alert", ["user_id"], unique=False)
    op.create_index(
        "idx_price_alert_active",
        "price_alert",
        ["crypto_currency_id", "alert_type", "alert_price"],
        unique=False,
        postgresql_where=sa.text("is_active = true"),
    )


def downgrade() -> None:
    op.drop_index("idx_price_alert_active", table_name="price_alert")
    op.drop_index("idx_price_alert_user_id", table_name="price_alert")
    op.drop_index("idx_price_alert_crypto_currency_id", table_name="price_alert")
    op.drop_table("price_alert")

    op.drop_index("idx_investment_user_open", table_name="investment")
    op.drop_index("idx_investment_user_id", table_name="investment")
    op.drop_index("idx_investment_crypto_currency_id", table_name="investment")
    op.drop_table("investment")

    op.drop_index("idx_watchlist_crypto_currency_id", table_name="watchlist_subscription")
    op.drop_table("watchlist_subscription")

    op.drop_table("user_wallet")
    op.drop_table("user_preference")
    op.drop_table("crypto_currency")
    op.drop_table("app_user")
