from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.deps import require_admin
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import AppUser
from app.schemas.user import UserRegister
from app.services.investments import sell_investment
from app.services.users import round_money


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("Password1")
    assert verify_password("Password1", hashed)
    assert not verify_password("wrong", hashed)


def test_register_password_policy() -> None:
    try:
        UserRegister(
            username="alice",
            email="alice@example.com",
            password="password1",
        )
        assert False, "expected validation error"
    except Exception as exc:
        assert "uppercase" in str(exc).lower()


def test_create_access_token_contains_subject(auth_user: AppUser) -> None:
    token = create_access_token(auth_user.id)
    assert isinstance(token, str)
    assert len(token) > 20


def test_admin_gate_rejects_non_admin(auth_user: AppUser) -> None:
    try:
        require_admin(auth_user)
        assert False, "expected 403"
    except HTTPException as exc:
        assert exc.status_code == 403


def test_admin_gate_allows_admin(admin_user: AppUser) -> None:
    assert require_admin(admin_user) is admin_user


def test_crypto_create_requires_admin(authed_client: TestClient) -> None:
    response = authed_client.post(
        "/cryptocurrencies",
        json={"name": "Bitcoin", "symbol": "btc", "exchange_currency": "usd"},
    )
    assert response.status_code == 403


def test_users_list_requires_admin(authed_client: TestClient) -> None:
    response = authed_client.get("/users")
    assert response.status_code == 403


def test_round_money_matches_frontend() -> None:
    assert round_money(Decimal("10.456")) == Decimal("10.46")
    assert round_money(Decimal("10.454")) == Decimal("10.45")


def test_sell_investment_rejects_wrong_owner() -> None:
    owner_id = uuid4()
    other_id = uuid4()
    investment_id = uuid4()

    class FakeInvestment:
        id = investment_id
        user_id = owner_id
        sold_at = None
        selling_price = None
        buying_price = Decimal("100")
        amount = Decimal("10")

    class FakeResult:
        def scalars(self):
            return self

        def first(self):
            return FakeInvestment()

    class FakeSession:
        def execute(self, *_args, **_kwargs):
            return FakeResult()

    try:
        sell_investment(
            FakeSession(),  # type: ignore[arg-type]
            user_id=other_id,
            investment_id=investment_id,
            selling_price=Decimal("120"),
        )
        assert False, "expected forbidden"
    except HTTPException as exc:
        assert exc.status_code == 403


def test_sell_investment_rejects_already_sold() -> None:
    from datetime import datetime, timezone

    owner_id = uuid4()
    investment_id = uuid4()

    class FakeInvestment:
        id = investment_id
        user_id = owner_id
        sold_at = datetime.now(timezone.utc)
        selling_price = Decimal("120")
        buying_price = Decimal("100")
        amount = Decimal("10")

    class FakeResult:
        def scalars(self):
            return self

        def first(self):
            return FakeInvestment()

    class FakeSession:
        def execute(self, *_args, **_kwargs):
            return FakeResult()

    try:
        sell_investment(
            FakeSession(),  # type: ignore[arg-type]
            user_id=owner_id,
            investment_id=investment_id,
            selling_price=Decimal("130"),
        )
        assert False, "expected bad request"
    except HTTPException as exc:
        assert exc.status_code == 400
        assert "already sold" in exc.detail.lower()


def test_watchlist_duplicate_conflict(authed_client: TestClient) -> None:
    from sqlalchemy.exc import IntegrityError

    from app.db.database import get_db
    from app.main import app

    crypto_id = uuid4()

    class FakeCrypto:
        id = crypto_id

    class FakeSession:
        def get(self, model, ident):
            return FakeCrypto()

        def add(self, _obj):
            return None

        def commit(self):
            raise IntegrityError("duplicate", params=None, orig=Exception("dup"))

        def rollback(self):
            return None

        def refresh(self, _obj):
            return None

    def override_db():
        yield FakeSession()

    app.dependency_overrides[get_db] = override_db
    response = authed_client.post(
        "/watchlist",
        json={"crypto_currency_id": str(crypto_id)},
    )
    assert response.status_code == 409
