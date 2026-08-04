from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InvestmentBase(BaseModel):
    crypto_currency_id: UUID
    amount: Decimal = Field(gt=0, max_digits=30, decimal_places=12)
    buying_price: Decimal = Field(ge=0, max_digits=30, decimal_places=12)
    selling_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
        max_digits=30,
        decimal_places=12,
    )
    description: Optional[str] = None
    sold_at: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_sale_state(self) -> InvestmentBase:
        if (self.selling_price is None) != (self.sold_at is None):
            raise ValueError(
                "selling_price and sold_at must both be null or both be set",
            )
        return self


class InvestmentCreate(InvestmentBase):
    user_id: UUID


class InvestmentUpdate(BaseModel):
    amount: Optional[Decimal] = Field(
        default=None,
        gt=0,
        max_digits=30,
        decimal_places=12,
    )
    buying_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
        max_digits=30,
        decimal_places=12,
    )
    selling_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
        max_digits=30,
        decimal_places=12,
    )
    description: Optional[str] = None
    sold_at: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_sale_state(self) -> InvestmentUpdate:
        provided = self.model_fields_set
        if "selling_price" in provided or "sold_at" in provided:
            if (self.selling_price is None) != (self.sold_at is None):
                raise ValueError(
                    "selling_price and sold_at must both be null or both be set",
                )
        return self


class InvestmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    crypto_currency_id: UUID
    amount: Decimal
    buying_price: Decimal
    selling_price: Optional[Decimal]
    description: Optional[str]
    sold_at: Optional[datetime]
    created_at: datetime
