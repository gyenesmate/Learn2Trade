from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CryptoCurrencyBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    symbol: str = Field(min_length=1, max_length=20)
    exchange_currency: str = Field(min_length=1, max_length=20)

    @field_validator("symbol", "exchange_currency")
    @classmethod
    def uppercase_codes(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("value must not be empty")
        return stripped.upper()

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name must not be empty")
        return stripped


class CryptoCurrencyCreate(CryptoCurrencyBase):
    pass


class CryptoCurrencyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    symbol: Optional[str] = Field(default=None, min_length=1, max_length=20)
    exchange_currency: Optional[str] = Field(default=None, min_length=1, max_length=20)

    @field_validator("symbol", "exchange_currency")
    @classmethod
    def uppercase_codes(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("value must not be empty")
        return stripped.upper()


class CryptoCurrencyRead(CryptoCurrencyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
