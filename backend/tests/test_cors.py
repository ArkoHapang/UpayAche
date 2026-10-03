"""
UpayAche - CORS & Preflight Configuration Test Suite.
Validates local development origins (localhost:3000, localhost:3001, 127.0.0.1:3000, 127.0.0.1:3001),
preflight OPTIONS handling, credential support, and restrictive policy for unknown origins.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


@pytest.fixture
def client():
    return TestClient(app)


def test_cors_configured_origins():
    """Verify that development origins are properly configured in settings."""
    expected_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    for origin in expected_origins:
        assert origin in settings.cors_origins, f"{origin} must be in settings.cors_origins"


@pytest.mark.parametrize("origin", [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
])
def test_cors_preflight_allowed_origins(client: TestClient, origin: str):
    """Verify OPTIONS preflight requests for protected endpoints succeed with CORS headers."""
    response = client.options(
        "/api/v1/risk/summary",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type,x-request-id",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "authorization" in response.headers.get("access-control-allow-headers", "").lower()


def test_cors_authenticated_get_request(client: TestClient):
    """Verify authenticated GET /api/v1/risk/summary returns CORS headers for localhost:3001."""
    response = client.get(
        "/api/v1/risk/summary",
        headers={
            "Origin": "http://localhost:3001",
            "Authorization": "Bearer test-analyst-token",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3001"
    assert response.headers.get("access-control-allow-credentials") == "true"
    data = response.json()
    assert "total_analyzed" in data
    assert data["total_analyzed"] > 0


def test_cors_unauthenticated_request_preserves_cors_headers(client: TestClient):
    """Verify 401 Unauthorized responses still attach CORS headers so frontend doesn't hit CORS error."""
    response = client.get(
        "/api/v1/risk/summary",
        headers={
            "Origin": "http://localhost:3001",
        }
    )
    assert response.status_code == 401
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3001"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallowed_origin_blocked(client: TestClient):
    """Verify unauthorized external origins receive 400 Bad Request without allow-origin header."""
    response = client.options(
        "/api/v1/risk/summary",
        headers={
            "Origin": "http://malicious-external-site.com",
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
