from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError


def test_database_health_connected(client: TestClient) -> None:
    mock_connection = MagicMock()
    mock_connection.__enter__.return_value = mock_connection
    mock_connection.__exit__.return_value = None

    with patch("app.api.routes.health.engine") as mock_engine:
        mock_engine.connect.return_value = mock_connection
        response = client.get("/health/database")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "connected"}
    mock_connection.execute.assert_called_once()


def test_database_health_unavailable(client: TestClient) -> None:
    with patch("app.api.routes.health.engine") as mock_engine:
        mock_engine.connect.side_effect = OperationalError(
            "SELECT 1",
            {},
            Exception("connection refused"),
        )
        response = client.get("/health/database")

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "unhealthy"
    assert body["database"] == "disconnected"
    assert "password" not in body["detail"].lower()
    assert "postgresql" not in body["detail"].lower()
