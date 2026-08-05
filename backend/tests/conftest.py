from __future__ import annotations

from collections.abc import Generator
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, require_admin
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.user import AppUser, UserPreference, UserWallet


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Generator[None, None, None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_user(
    *,
    is_admin: bool = False,
    is_banned: bool = False,
    username: str = "tester",
) -> AppUser:
    now = datetime.now(timezone.utc)
    user_id = uuid4()
    user = AppUser(
        id=user_id,
        username=username,
        email=f"{username}@example.com",
        password_hash=hash_password("Password1"),
        avatar_url=None,
        is_admin=is_admin,
        is_banned=is_banned,
        created_at=now,
        updated_at=now,
    )
    user.preference = UserPreference(user_id=user_id, theme="light")
    user.wallet = UserWallet(
        user_id=user_id,
        currency_code="USD",
        balance=Decimal("100.00"),
        created_at=now,
        updated_at=now,
    )
    return user


@pytest.fixture
def auth_user() -> AppUser:
    return make_user()


@pytest.fixture
def admin_user() -> AppUser:
    return make_user(is_admin=True, username="admin")


@pytest.fixture
def authed_client(client: TestClient, auth_user: AppUser) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: auth_user
    return client


@pytest.fixture
def admin_client(client: TestClient, admin_user: AppUser) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[require_admin] = lambda: admin_user
    return client
