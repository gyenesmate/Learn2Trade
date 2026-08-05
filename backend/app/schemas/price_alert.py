from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AlertType(str, Enum):
    ABOVE = "above"
    BELOW = "below"


class PriceAlertCreateRequest(BaseModel):
    crypto_currency_id: UUID
    alert_price: Decimal = Field(ge=0, max_digits=30, decimal_places=12)
    description: Optional[str] = None
    alert_type: AlertType
    is_active: bool = True


class PriceAlertUpdate(BaseModel):
    alert_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
        max_digits=30,
        decimal_places=12,
    )
    description: Optional[str] = None
    alert_type: Optional[AlertType] = None
    is_active: Optional[bool] = None


class PriceAlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    crypto_currency_id: UUID
    alert_price: Decimal
    description: Optional[str]
    alert_type: AlertType
    is_active: bool
    created_at: datetime
