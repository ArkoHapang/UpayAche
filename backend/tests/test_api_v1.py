"""
UpayAche — Phase 9 FastAPI Backend API v1 Test Suite.
Validates:
1. Standard HTTP Status Codes:
   - 200 OK (all GET and POST endpoints)
   - 201 Created (POST /api/v1/investigations, POST /api/v1/investigations/{id}/notes)
   - 400 Bad Request
   - 401 Unauthorized (missing or invalid Bearer token)
   - 403 Forbidden (RBAC violations, VIEWER mutations, reopening closed cases)
   - 404 Not Found (invalid transaction, wallet, or case IDs)
   - 422 Unprocessable Entity (validation errors and invalid state machine transitions)
   - 500 Internal Server Error (structured error envelope and request ID capture)
2. Middleware Invariants:
   - Request IDs attached to responses (X-Request-ID)
   - Custom incoming X-Request-ID propagation
   - Process time tracking (X-Process-Time-Ms)
3. End-to-end multi-module data flow:
   - auth, transactions, risk, network, investigations, ai
"""

import sys
import uuid
import pytest
from pathlib import Path
from unittest.mock import patch
from starlette.testclient import TestClient

# Ensure project root and backend in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from app.db.repository import get_repository


@pytest.fixture(scope="module")
def client():
    """Create test client instance."""
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="module")
def repo():
    """Access global data repository."""
    return get_repository()


@pytest.fixture(scope="module")
def admin_headers():
    return {"Authorization": "Bearer test-admin-token"}


@pytest.fixture(scope="module")
def analyst_headers():
    return {"Authorization": "Bearer test-analyst-token"}


@pytest.fixture(scope="module")
def viewer_headers():
    return {"Authorization": "Bearer test-viewer-token"}


# =============================================================================
# 1. Health & Root Endpoints
# =============================================================================

def test_health_endpoints(client):
    res_root = client.get("/health")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "healthy"

    res_v1 = client.get("/api/v1/health")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "healthy"


def test_request_id_middleware(client):
    # Auto-generated request ID
    res = client.get("/health")
    assert "X-Request-ID" in res.headers
    assert res.headers["X-Request-ID"].startswith("req-")
    assert "X-Process-Time-Ms" in res.headers

    # Custom propagated request ID
    custom_id = "req-audit-999-custom"
    res_custom = client.get("/health", headers={"X-Request-ID": custom_id})
    assert res_custom.headers["X-Request-ID"] == custom_id


# =============================================================================
# 2. Authentication & Roles (Auth Module)
# =============================================================================

def test_auth_login_success(client):
    payload = {
        "email": "analyst@upayache.internal",
        "password": "securepassword123"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "ANALYST"


def test_auth_me_with_roles(client, admin_headers, analyst_headers, viewer_headers):
    # ADMIN
    res_admin = client.get("/api/v1/auth/me", headers=admin_headers)
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "ADMIN"

    # ANALYST
    res_analyst = client.get("/api/v1/auth/me", headers=analyst_headers)
    assert res_analyst.status_code == 200
    assert res_analyst.json()["role"] == "ANALYST"

    # VIEWER
    res_viewer = client.get("/api/v1/auth/me", headers=viewer_headers)
    assert res_viewer.status_code == 200
    assert res_viewer.json()["role"] == "VIEWER"


def test_auth_401_unauthorized(client):
    # Missing header
    res_missing = client.get("/api/v1/transactions")
    assert res_missing.status_code == 401
    assert "error" in res_missing.json()
    assert res_missing.json()["error"]["code"] == "UNAUTHORIZED"

    # Invalid header format
    res_bad_format = client.get("/api/v1/transactions", headers={"Authorization": "Token 12345"})
    assert res_bad_format.status_code == 401

    # Invalid token value
    res_invalid_token = client.get("/api/v1/transactions", headers={"Authorization": "Bearer totally_bogus_token_xyz"})
    assert res_invalid_token.status_code == 401


# =============================================================================
# 3. Transactions Module
# =============================================================================

def test_list_transactions_200(client, analyst_headers, repo):
    res = client.get("/api/v1/transactions?limit=10&offset=0", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 10
    assert data["total"] >= 1000

    # Test filtering by tx_type
    res_p2p = client.get("/api/v1/transactions?tx_type=P2P&limit=5", headers=analyst_headers)
    assert res_p2p.status_code == 200
    for item in res_p2p.json()["items"]:
        assert item["tx_type"] == "P2P"


def test_get_single_transaction_200_and_404(client, analyst_headers, repo):
    # Grab a real transaction ID
    txs, _ = repo.list_transactions(limit=1)
    real_id = txs[0]["id"]

    res = client.get(f"/api/v1/transactions/{real_id}", headers=analyst_headers)
    assert res.status_code == 200
    assert res.json()["id"] == real_id

    # 404 for non-existent ID
    res_404 = client.get("/api/v1/transactions/tx-non-existent-9999", headers=analyst_headers)
    assert res_404.status_code == 404
    assert res_404.json()["error"]["code"] == "NOT_FOUND"


def test_analyze_transaction_200_and_422(client, analyst_headers, repo):
    wallets = repo.list_wallets(limit=2)
    w_sender = wallets[0]["id"]
    w_receiver = wallets[1]["id"]

    payload = {
        "amount": 75000.0,
        "sender_wallet_id": w_sender,
        "receiver_wallet_id": w_receiver,
        "tx_type": "CASH_OUT",
        "device_id": "burner-phone-device-01",
        "location_id": "loc-suspicious-01",
        "timestamp": "2026-01-15T02:30:00Z"
    }

    res = client.post("/api/v1/transactions/analyze", json=payload, headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert "risk_score" in data
    assert "risk_level" in data
    assert "anomaly_score" in data
    assert "top_factors" in data
    assert len(data["top_factors"]) > 0

    # 422 on negative amount
    res_422 = client.post(
        "/api/v1/transactions/analyze",
        json={"amount": -500.0, "sender_wallet_id": w_sender, "receiver_wallet_id": w_receiver},
        headers=analyst_headers
    )
    assert res_422.status_code == 422
    assert res_422.json()["error"]["code"] == "VALIDATION_ERROR"


# =============================================================================
# 4. Risk Module
# =============================================================================

def test_risk_summary_200(client, analyst_headers):
    res = client.get("/api/v1/risk/summary", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_analyzed"] > 0
    assert "low_risk_count" in data
    assert "critical_risk_count" in data
    assert "average_risk_score" in data
    assert 0.0 <= data["average_risk_score"] <= 1.0


def test_risk_high_risk_200(client, analyst_headers):
    res = client.get("/api/v1/risk/high-risk?limit=10", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) <= 10
    for item in data["items"]:
        assert item["risk_level"] in ("HIGH", "CRITICAL")
        assert item["risk_score"] >= 0.65


def test_risk_trends_200(client, analyst_headers):
    res = client.get("/api/v1/risk/trends?timeframe=7d", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert "points" in data
    assert len(data["points"]) > 0
    first_pt = data["points"][0]
    assert "period" in first_pt
    assert "transaction_count" in first_pt
    assert "average_risk" in first_pt


def test_risk_transaction_detail_200_and_404(client, analyst_headers, repo):
    txs, _ = repo.list_transactions(limit=1)
    real_id = txs[0]["id"]

    res = client.get(f"/api/v1/risk/{real_id}", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["transaction_id"] == real_id
    assert "risk_score" in data
    assert "anomaly_score" in data
    assert "top_contributing_features" in data
    assert "summary_narrative" in data

    # 404 for invalid transaction
    res_404 = client.get("/api/v1/risk/tx-ghost-404", headers=analyst_headers)
    assert res_404.status_code == 404


def test_risk_model_status_200(client, analyst_headers):
    res = client.get("/api/v1/risk/model/status", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["model_version"] == "v1.0.0"
    assert "trained_at" in data
    assert data["precision"] > 0.0
    assert data["recall"] > 0.0
    assert data["f1"] > 0.0
    assert data["roc_auc"] > 0.0
    assert data["is_synthetic_evaluation"] is True




# =============================================================================
# 5. Network Module
# =============================================================================

def test_network_wallet_and_neighbors_200(client, analyst_headers, repo):
    wallets = repo.list_wallets(limit=1)
    target_wallet = wallets[0]["id"]

    # 1. GET /api/v1/network/wallet/{id}
    res_node = client.get(f"/api/v1/network/wallet/{target_wallet}", headers=analyst_headers)
    assert res_node.status_code == 200
    node_data = res_node.json()
    assert node_data["id"] == target_wallet
    assert "in_degree" in node_data
    assert "out_degree" in node_data
    assert "balance" in node_data

    # 2. GET /api/v1/network/wallet/{id}/neighbors
    res_neighbors = client.get(f"/api/v1/network/wallet/{target_wallet}/neighbors", headers=analyst_headers)
    assert res_neighbors.status_code == 200
    neighbors_data = res_neighbors.json()
    assert neighbors_data["wallet_id"] == target_wallet
    assert "neighbors" in neighbors_data

    # 404 for invalid wallet
    res_404 = client.get("/api/v1/network/wallet/w-ghost-wallet-999", headers=analyst_headers)
    assert res_404.status_code == 404


def test_network_high_risk_and_subgraph_200(client, analyst_headers):
    # High-risk nodes
    res_hr = client.get("/api/v1/network/high-risk?limit=15", headers=analyst_headers)
    assert res_hr.status_code == 200
    hr_data = res_hr.json()
    assert "high_risk_wallets" in hr_data
    assert len(hr_data["high_risk_wallets"]) <= 15

    # Subgraph
    res_sub = client.get("/api/v1/network/subgraph?depth=2", headers=analyst_headers)
    assert res_sub.status_code == 200
    sub_data = res_sub.json()
    assert "nodes" in sub_data
    assert "edges" in sub_data
    assert "metrics" in sub_data


# =============================================================================
# 6. Investigation State Machine & RBAC
# =============================================================================

def test_investigation_lifecycle_state_machine(client, analyst_headers, admin_headers, viewer_headers, repo):
    wallets = repo.list_wallets(limit=1)
    target_wallet = wallets[0]["id"]

    # 1. Create Case -> 201 Created (Status = OPEN)
    create_payload = {
        "title": "Layering & Fan-in Smurfing Case",
        "description": "Suspected mule structuring observed across 3 satellite wallets.",
        "target_wallet_id": target_wallet,
        "priority": "HIGH"
    }
    res_create = client.post("/api/v1/investigations", json=create_payload, headers=analyst_headers)
    assert res_create.status_code == 201
    case = res_create.json()
    case_id = case["id"]
    assert case["status"] == "OPEN"
    assert case["priority"] == "HIGH"

    # 2. VIEWER trying to create case -> 403 Forbidden
    res_viewer_forbidden = client.post("/api/v1/investigations", json=create_payload, headers=viewer_headers)
    assert res_viewer_forbidden.status_code == 403

    # 3. Transition: OPEN -> INVESTIGATING (Valid)
    res_step1 = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "INVESTIGATING", "analyst_comment": "Claiming case for investigation."},
        headers=analyst_headers
    )
    assert res_step1.status_code == 200
    assert res_step1.json()["status"] == "INVESTIGATING"

    # 4. Transition: INVESTIGATING -> REVIEWED (Valid)
    res_step2 = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "REVIEWED", "analyst_comment": "Case submitted for compliance review."},
        headers=analyst_headers
    )
    assert res_step2.status_code == 200
    assert res_step2.json()["status"] == "REVIEWED"

    # 5. Invalid Transition: REVIEWED -> CLOSED without resolution -> 422 Unprocessable Entity
    res_invalid_close = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "CLOSED", "resolution": "PENDING"},
        headers=analyst_headers
    )
    assert res_invalid_close.status_code == 422

    # 6. Valid Transition: REVIEWED -> CLOSED with CONFIRMED_FRAUD -> 200 OK
    res_valid_close = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "CLOSED", "resolution": "CONFIRMED_FRAUD", "analyst_comment": "Fraud confirmed."},
        headers=analyst_headers
    )
    assert res_valid_close.status_code == 200
    assert res_valid_close.json()["status"] == "CLOSED"
    assert res_valid_close.json()["resolution"] == "CONFIRMED_FRAUD"

    # 7. Non-ADMIN trying to reopen CLOSED case -> 403 Forbidden
    res_analyst_reopen = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "INVESTIGATING", "analyst_comment": "Attempting reopen"},
        headers=analyst_headers
    )
    assert res_analyst_reopen.status_code == 403

    # 8. ADMIN reopening CLOSED case -> 200 OK
    res_admin_reopen = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "INVESTIGATING", "analyst_comment": "Admin reopened upon new financial evidence."},
        headers=admin_headers
    )
    assert res_admin_reopen.status_code == 200
    assert res_admin_reopen.json()["status"] == "INVESTIGATING"


def test_investigation_illegal_state_transition_422(client, analyst_headers, repo):
    wallets = repo.list_wallets(limit=1)
    res_create = client.post(
        "/api/v1/investigations",
        json={"title": "Test Skip Case", "description": "Desc", "target_wallet_id": wallets[0]["id"]},
        headers=analyst_headers
    )
    case_id = res_create.json()["id"]

    # Direct OPEN -> CLOSED without review is strictly forbidden -> 422
    res_illegal = client.patch(
        f"/api/v1/investigations/{case_id}",
        json={"status": "CLOSED", "resolution": "CONFIRMED_FRAUD"},
        headers=analyst_headers
    )
    assert res_illegal.status_code == 422
    assert "Illegal state transition" in res_illegal.json()["error"]["message"]


def test_investigation_notes_201_and_403(client, analyst_headers, viewer_headers, repo):
    cases, _ = repo.list_cases(limit=1)
    case_id = cases[0]["id"]

    # Analyst can add note -> 201
    res = client.post(
        f"/api/v1/investigations/{case_id}/notes",
        json={"content": "Verified customer identity and phone logs.", "note_type": "ANALYST"},
        headers=analyst_headers
    )
    assert res.status_code == 201
    assert res.json()["content"] == "Verified customer identity and phone logs."

    # Viewer cannot add note -> 403
    res_v = client.post(
        f"/api/v1/investigations/{case_id}/notes",
        json={"content": "Viewer note", "note_type": "ANALYST"},
        headers=viewer_headers
    )
    assert res_v.status_code == 403


# =============================================================================
# 7. AI Module (Guarded Gemini Copilot)
# =============================================================================

def test_ai_copilot_investigate_200(client, analyst_headers, repo):
    cases, _ = repo.list_cases(limit=1)
    case_id = cases[0]["id"]

    payload = {
        "case_id": case_id,
        "focus_area": "MULE_STRUCTURING_ANALYSIS"
    }

    res = client.post("/api/v1/ai/investigate", json=payload, headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    report = data["data"]
    assert "executive_summary" in report
    assert "typology_hypothesis" in report
    assert "confidence_level" in report
    assert len(report["key_suspicious_indicators"]) >= 2
    assert len(report["recommended_actions"]) >= 2

    # Verify AI note was automatically appended to the case
    case_detail = client.get(f"/api/v1/investigations/{case_id}", headers=analyst_headers).json()
    ai_notes = [n for n in case_detail["notes"] if n["note_type"] == "AI_COPILOT"]
    assert len(ai_notes) > 0


def test_ai_copilot_invalid_case_404(client, analyst_headers):
    res = client.post("/api/v1/ai/investigate", json={"case_id": "case-ghost-404"}, headers=analyst_headers)
    assert res.status_code == 404


# =============================================================================
# 8. Boundary Conditions: 400, 422, 500 Structured Errors
# =============================================================================

def test_api_422_validation_error(client, analyst_headers):
    # Invalid limit parameter (exceeding maximum 500)
    res = client.get("/api/v1/transactions?limit=9999", headers=analyst_headers)
    assert res.status_code == 422
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "metadata" in body
    assert "request_id" in body["metadata"]


def test_api_400_bad_request(client, analyst_headers):
    # 1. min_amount > max_amount triggers 400 Bad Request
    res = client.get(
        "/api/v1/transactions?min_amount=50000&max_amount=100",
        headers=analyst_headers
    )
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "BAD_REQUEST"
    assert "request_id" in body["metadata"]

    # 2. Invalid timeframe triggers 400 Bad Request
    res_tf = client.get(
        "/api/v1/risk/trends?timeframe=invalid_100years",
        headers=analyst_headers
    )
    assert res_tf.status_code == 400
    assert res_tf.json()["error"]["code"] == "BAD_REQUEST"


def test_api_500_internal_server_error(client, analyst_headers):
    # Simulate an internal unhandled error inside a service method
    with patch("app.services.transaction_service.TransactionService.list_transactions") as mock_err:
        mock_err.side_effect = RuntimeError("Simulated internal database crash")
        res = client.get("/api/v1/transactions", headers=analyst_headers)
        assert res.status_code == 500
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "INTERNAL_SERVER_ERROR"
        assert "metadata" in body
        assert "request_id" in body["metadata"]
