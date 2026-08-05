from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InvestmentCreateRequest(BaseModel):
    crypto_currency_id: UUID
    amount: Decimal = Field(gt=0, max_digits=30, decimal_places=12)
    buying_price: Decimal = Field(gt=0, max_digits=30, decimal_places=12)
    description: Optional[str] = None


class InvestmentSellRequest(BaseModel):
    selling_price: Decimal = Field(gt=0, max_digits=30, decimal_places=12)


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

    @property
    def is_sold(self) -> bool:
        return self.sold_at is not None
