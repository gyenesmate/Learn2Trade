from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Theme(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class UserPreferenceBase(BaseModel):
    theme: Theme = Theme.SYSTEM


class UserPreferenceCreate(UserPreferenceBase):
    pass


class UserPreferenceUpdate(BaseModel):
    theme: Optional[Theme] = None


class UserPreferenceRead(UserPreferenceBase):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID


class UserWalletBase(BaseModel):
    currency_code: str = Field(default="USD", min_length=1, max_length=10)
    balance: Decimal = Field(default=Decimal("0"), ge=0, max_digits=20, decimal_places=8)


class UserWalletCreate(UserWalletBase):
    pass


class UserWalletUpdate(BaseModel):
    currency_code: Optional[str] = Field(default=None, min_length=1, max_length=10)
    balance: Optional[Decimal] = Field(
        default=None,
        ge=0,
        max_digits=20,
        decimal_places=8,
    )


class UserWalletRead(UserWalletBase):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    avatar_url: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("username must not be empty")
        return stripped

    @field_validator("email")
    @classmethod
    def email_has_at(cls, value: str) -> str:
        stripped = value.strip()
        if "@" not in stripped or "." not in stripped.split("@")[-1]:
            raise ValueError("email must be a valid address")
        return stripped


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[str] = Field(default=None, min_length=3, max_length=320)
    avatar_url: Optional[str] = None
    is_admin: Optional[bool] = None
    is_banned: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def email_has_at(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        if "@" not in stripped or "." not in stripped.split("@")[-1]:
            raise ValueError("email must be a valid address")
        return stripped


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: str
    avatar_url: Optional[str]
    is_admin: bool
    is_banned: bool
    created_at: datetime
    updated_at: datetime
