from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WatchlistCreateRequest(BaseModel):
    crypto_currency_id: UUID


class WatchlistSubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    crypto_currency_id: UUID
    created_at: datetime
