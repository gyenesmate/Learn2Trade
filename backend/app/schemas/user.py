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
        return stripped.lower()

    @field_validator("password")
    @classmethod
    def password_policy(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("password must be at least 8 characters")
        if not any(char.isupper() for char in value):
            raise ValueError("password must contain an uppercase letter")
        if not any(char.isdigit() for char in value):
            raise ValueError("password must contain a digit")
        return value


class UserRegister(UserCreate):
    """Registration payload; admin/banned flags are never accepted from clients."""


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserProfileUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    theme: Optional[Theme] = None

    @field_validator("username")
    @classmethod
    def username_not_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("username must not be empty")
        return stripped


class WalletAmountRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=20, decimal_places=8)


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


class UserMeRead(UserRead):
    theme: Theme = Theme.SYSTEM
    balance: Decimal = Decimal("0")
    currency_code: str = "USD"
    profit_index: Decimal = Decimal("0")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserMeRead
