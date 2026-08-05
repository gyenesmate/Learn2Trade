import os
from pathlib import Path

import pytest

from app.core.config import Settings, get_settings


def test_settings_load_database_url_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://user:secret@localhost:5432/testdb",
    )
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")

    settings = Settings(_env_file=None)

    assert settings.sqlalchemy_database_url.endswith("@localhost:5432/testdb")
    assert "secret" not in repr(settings.database_url)
    assert str(settings.database_url) == "**********"


def test_get_settings_reads_backend_env_file() -> None:
    get_settings.cache_clear()
    settings = get_settings()
    env_path = Path(__file__).resolve().parents[1] / ".env"

    assert env_path.exists() or "DATABASE_URL" in os.environ
    assert settings.sqlalchemy_database_url.startswith("postgresql+psycopg://")
    assert "password" not in repr(settings)
