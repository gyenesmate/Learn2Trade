from app.db.base import Base
from app.models import (
    AppUser,
    CryptoCurrency,
    Investment,
    PriceAlert,
    UserPreference,
    UserWallet,
    WatchlistSubscription,
)


def test_expected_table_names() -> None:
    assert set(Base.metadata.tables) == {
        "app_user",
        "user_preference",
        "user_wallet",
        "crypto_currency",
        "watchlist_subscription",
        "investment",
        "price_alert",
    }


def test_watchlist_composite_primary_key() -> None:
    pk_columns = list(WatchlistSubscription.__table__.primary_key.columns.keys())
    assert pk_columns == ["user_id", "crypto_currency_id"]


def test_user_wallet_one_to_one() -> None:
    assert AppUser.wallet.property.uselist is False
    assert UserWallet.user.property.uselist is False
    assert UserWallet.__table__.c.user_id.primary_key is True


def test_user_preference_one_to_one() -> None:
    assert AppUser.preference.property.uselist is False
    assert UserPreference.user.property.uselist is False
    assert UserPreference.__table__.c.user_id.primary_key is True


def test_foreign_key_ondelete_rules() -> None:
    wallet_fk = next(iter(UserWallet.__table__.foreign_keys))
    preference_fk = next(iter(UserPreference.__table__.foreign_keys))
    investment_user_fk = next(
        fk
        for fk in Investment.__table__.foreign_keys
        if fk.parent.name == "user_id"
    )
    investment_crypto_fk = next(
        fk
        for fk in Investment.__table__.foreign_keys
        if fk.parent.name == "crypto_currency_id"
    )
    alert_user_fk = next(
        fk for fk in PriceAlert.__table__.foreign_keys if fk.parent.name == "user_id"
    )
    watchlist_crypto_fk = next(
        fk
        for fk in WatchlistSubscription.__table__.foreign_keys
        if fk.parent.name == "crypto_currency_id"
    )

    assert wallet_fk.ondelete == "CASCADE"
    assert preference_fk.ondelete == "CASCADE"
    assert investment_user_fk.ondelete == "CASCADE"
    assert investment_crypto_fk.ondelete == "RESTRICT"
    assert alert_user_fk.ondelete == "CASCADE"
    assert watchlist_crypto_fk.ondelete == "CASCADE"


def test_crypto_currency_unique_pair() -> None:
    names = {constraint.name for constraint in CryptoCurrency.__table__.constraints}
    assert "uq_crypto_currency_pair" in names
