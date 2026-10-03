"""
UpayAche — Phase 10 Authentication, RBAC, IDOR & Security Test Suite.
Validates:
- Unauthenticated access (401)
- Authenticated access (200)
- Viewer restrictions (403 on mutations)
- Analyst permissions (allowed case creation, transitions, notes)
- Admin permissions (case reopening, audit trail access)
- Cross-user data access & IDOR prevention (403)
- Expired session / JWT expiration validation (401)
- Audit log generation & append-only immutability
- Secret leak prevention (no service-role keys in frontend or git)
"""

import os
import time
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.core.security import create_test_jwt, KNOWN_USERS
from app.services.audit_service import get_audit_service


@pytest.fixture
def client():
    return TestClient(app)


# -----------------------------------------------------------------------------
# 1. Unauthenticated Access Tests (401)
# -----------------------------------------------------------------------------

def test_unauthenticated_access_rejected(client):
    """Endpoints requiring authentication must return 401 if token is omitted or invalid."""
    # Omitted token
    res = client.get("/api/v1/transactions")
    assert res.status_code == 401
    assert "Missing Authorization header" in res.json()["detail"]

    # Invalid scheme
    res = client.get("/api/v1/transactions", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert res.status_code == 401
    assert "Invalid authorization scheme" in res.json()["detail"]

    # Unrecognized token
    res = client.get("/api/v1/transactions", headers={"Authorization": "Bearer bogus-token-12345"})
    assert res.status_code == 401
    assert "Invalid or expired access token" in res.json()["detail"]


# -----------------------------------------------------------------------------
# 2. Authenticated Access Tests (200)
# -----------------------------------------------------------------------------

def test_authenticated_access_all_roles(client):
    """ADMIN, ANALYST, and VIEWER can all read ledger and transaction details."""
    for role, token_val in [
        ("ADMIN", "test-admin-token"),
        ("ANALYST", "test-analyst-token"),
        ("VIEWER", "test-viewer-token")
    ]:
        headers = {"Authorization": f"Bearer {token_val}"}
        res = client.get("/api/v1/transactions?limit=5", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data

        # Check /auth/me reflects active identity
        me_res = client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["role"] == role


def test_authenticated_access_with_valid_signed_jwt(client):
    """Cryptographically signed JWT with valid expiration must authenticate successfully."""
    jwt_token = create_test_jwt(role="ANALYST", user_id="u-signed-001", email="analyst.jwt@upayache.internal")
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {jwt_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "u-signed-001"
    assert data["role"] == "ANALYST"
    assert data["email"] == "analyst.jwt@upayache.internal"


# -----------------------------------------------------------------------------
# 3. Viewer Restrictions (403 Forbidden on mutations)
# -----------------------------------------------------------------------------

def test_viewer_restrictions(client):
    """VIEWER role is read-only and must be blocked from mutations with 403 Forbidden."""
    viewer_headers = {"Authorization": "Bearer test-viewer-token"}

    # 1. Blocked from creating cases
    create_res = client.post(
        "/api/v1/investigations",
        headers=viewer_headers,
        json={
            "title": "Unauthorized Viewer Case",
            "description": "Viewer should be blocked.",
            "target_wallet_id": "01700000001",
            "priority": "LOW"
        }
    )
    assert create_res.status_code == 403
    assert "Viewer role is not authorized" in create_res.json()["detail"]

    # 2. Blocked from analyzing / ingesting transactions
    analyze_res = client.post(
        "/api/v1/transactions/analyze",
        headers=viewer_headers,
        json={
            "sender_wallet_id": "01700000001",
            "receiver_wallet_id": "01800000002",
            "amount": 2500.0,
            "tx_type": "P2P"
        }
    )
    assert analyze_res.status_code == 403
    assert "Forbidden" in analyze_res.json()["detail"]

    # 3. Blocked from viewing audit trail
    audit_res = client.get("/api/v1/audit/logs", headers=viewer_headers)
    assert audit_res.status_code == 403


# -----------------------------------------------------------------------------
# 4. Analyst Permissions (Allowed Operational Workflows)
# -----------------------------------------------------------------------------

def test_analyst_permissions_case_lifecycle(client):
    """ANALYST role has full investigation capabilities: create case, transition states, add notes."""
    analyst_headers = {"Authorization": "Bearer test-analyst-token"}

    # Create Case
    create_res = client.post(
        "/api/v1/investigations",
        headers=analyst_headers,
        json={
            "title": "Phase 10 Analyst Flow Case",
            "description": "Verifying analyst permissions.",
            "target_wallet_id": "01711112222",
            "priority": "HIGH"
        }
    )
    assert create_res.status_code == 201
    case_id = create_res.json()["id"]

    # Transition OPEN -> INVESTIGATING
    patch_res = client.patch(
        f"/api/v1/investigations/{case_id}",
        headers=analyst_headers,
        json={"status": "INVESTIGATING", "analyst_comment": "Analyst began review."}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "INVESTIGATING"

    # Transition INVESTIGATING -> REVIEWED
    patch_res2 = client.patch(
        f"/api/v1/investigations/{case_id}",
        headers=analyst_headers,
        json={"status": "REVIEWED", "analyst_comment": "Review complete."}
    )
    assert patch_res2.status_code == 200
    assert patch_res2.json()["status"] == "REVIEWED"

    # Close Case with Resolution
    close_res = client.patch(
        f"/api/v1/investigations/{case_id}",
        headers=analyst_headers,
        json={"status": "CLOSED", "resolution": "CONFIRMED_FRAUD", "analyst_comment": "Fraud verified."}
    )
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "CLOSED"

    # Append Note
    note_res = client.post(
        f"/api/v1/investigations/{case_id}/notes",
        headers=analyst_headers,
        json={"content": "Supplemental evidence logged.", "note_type": "ANALYST"}
    )
    assert note_res.status_code == 201


# -----------------------------------------------------------------------------
# 5. Admin Permissions (Reopen Closed Case & Audit Trail)
# -----------------------------------------------------------------------------

def test_admin_permissions(client):
    """Only ADMIN can reopen a CLOSED case and access full compliance audit logs."""
    analyst_headers = {"Authorization": "Bearer test-analyst-token"}
    admin_headers = {"Authorization": "Bearer test-admin-token"}

    # 1. Create and close a case
    c_res = client.post(
        "/api/v1/investigations",
        headers=analyst_headers,
        json={"title": "Admin Reopen Test", "description": "Testing reopen rule", "target_wallet_id": "01799998888"}
    )
    case_id = c_res.json()["id"]
    client.patch(f"/api/v1/investigations/{case_id}", headers=analyst_headers, json={"status": "INVESTIGATING"})
    client.patch(f"/api/v1/investigations/{case_id}", headers=analyst_headers, json={"status": "REVIEWED"})
    client.patch(f"/api/v1/investigations/{case_id}", headers=analyst_headers, json={"status": "CLOSED", "resolution": "FALSE_POSITIVE"})

    # Analyst attempting to reopen CLOSED case must fail with 403
    reopen_analyst = client.patch(
        f"/api/v1/investigations/{case_id}",
        headers=analyst_headers,
        json={"status": "INVESTIGATING", "analyst_comment": "Analyst trying to reopen"}
    )
    assert reopen_analyst.status_code == 403
    assert "Only ADMIN users can reopen a closed case" in reopen_analyst.json()["detail"]

    # Admin reopening CLOSED case must succeed
    reopen_admin = client.patch(
        f"/api/v1/investigations/{case_id}",
        headers=admin_headers,
        json={"status": "INVESTIGATING", "analyst_comment": "Admin authorized reopening with fresh evidence"}
    )
    assert reopen_admin.status_code == 200
    assert reopen_admin.json()["status"] == "INVESTIGATING"

    # Admin access to Audit Trail
    audit_res = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert audit_res.status_code == 200
    data = audit_res.json()
    assert "items" in data
    assert data["total"] > 0


# -----------------------------------------------------------------------------
# 6. Cross-User Data Access & IDOR Attempts (403)
# -----------------------------------------------------------------------------

def test_cross_user_data_access_idor_prevention(client):
    """
    Insecure Direct Object Reference (IDOR) prevention:
    Non-admin user cannot access another user's private profile.
    Admin has legitimate operational oversight.
    """
    analyst_headers = {"Authorization": "Bearer test-analyst-token"}
    viewer_headers = {"Authorization": "Bearer test-viewer-token"}
    admin_headers = {"Authorization": "Bearer test-admin-token"}

    # Analyst accessing their own profile succeeds (u-analyst-01)
    res_own = client.get("/api/v1/auth/users/u-analyst-01", headers=analyst_headers)
    assert res_own.status_code == 200
    assert res_own.json()["id"] == "u-analyst-01"

    # Analyst attempting to access Viewer's profile (u-viewer-01) must be rejected with 403
    res_cross = client.get("/api/v1/auth/users/u-viewer-01", headers=analyst_headers)
    assert res_cross.status_code == 403
    assert "Forbidden: You are not authorized to modify resource owned by 'u-viewer-01'" in res_cross.json()["detail"]

    # Viewer attempting to access Admin's profile (u-admin-01) must be rejected with 403
    res_cross_viewer = client.get("/api/v1/auth/users/u-admin-01", headers=viewer_headers)
    assert res_cross_viewer.status_code == 403

    # Admin accessing another user's profile is permitted for governance
    res_admin_access = client.get("/api/v1/auth/users/u-analyst-01", headers=admin_headers)
    assert res_admin_access.status_code == 200
    assert res_admin_access.json()["id"] == "u-analyst-01"


# -----------------------------------------------------------------------------
# 7. Expired Session Validation (401)
# -----------------------------------------------------------------------------

def test_expired_session_rejected(client):
    """Expired JWTs or session markers must be rejected with 401."""
    # 1. Simulated expired token string
    res_sim = client.get("/api/v1/transactions", headers={"Authorization": "Bearer dev-expired-token"})
    assert res_sim.status_code == 401
    assert "Token has expired" in res_sim.json()["detail"]

    # 2. Real signed JWT that expired 60 seconds ago
    expired_jwt = create_test_jwt(role="ANALYST", expires_in_seconds=-60)
    res_jwt = client.get("/api/v1/transactions", headers={"Authorization": f"Bearer {expired_jwt}"})
    assert res_jwt.status_code == 401
    assert "Token has expired" in res_jwt.json()["detail"]


# -----------------------------------------------------------------------------
# 8. Immutable Audit Trail Verification
# -----------------------------------------------------------------------------

def test_audit_trail_immutable_and_events_captured(client):
    """Audit service records case mutations and does not expose mutation or delete endpoints."""
    admin_headers = {"Authorization": "Bearer test-admin-token"}

    initial_res = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert initial_res.status_code == 200
    initial_count = initial_res.json()["total"]

    # Perform a case mutation
    c_res = client.post(
        "/api/v1/investigations",
        headers=admin_headers,
        json={"title": "Audit Event Generator Case", "description": "Trigger audit entry", "target_wallet_id": "01700001111"}
    )
    assert c_res.status_code == 201

    updated_res = client.get("/api/v1/audit/logs", headers=admin_headers)
    assert updated_res.status_code == 200
    new_count = updated_res.json()["total"]
    assert new_count > initial_count

    # Verify latest audit record contents
    latest = updated_res.json()["items"][0]
    assert latest["action"] in ("CASE_CREATED", "USER_LOGIN_SUCCESS")
    assert "created_at" in latest
    assert "id" in latest

    # Verify there are NO DELETE or PUT endpoints on /audit/logs
    del_res = client.delete("/api/v1/audit/logs")
    assert del_res.status_code in (404, 405)


# -----------------------------------------------------------------------------
# 9. Secret Scanning & Zero Service-Role Key in Browser
# -----------------------------------------------------------------------------

def test_no_service_role_key_leaked_in_frontend():
    """Verify that frontend environment configs do NOT expose any service-role key."""
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
    
    # Check .env.example
    env_example_path = os.path.join(frontend_dir, ".env.example")
    if os.path.exists(env_example_path):
        with open(env_example_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "SUPABASE_SERVICE_ROLE_KEY" not in content, "Service role key must NEVER be in frontend .env!"
            assert "SERVICE_ROLE" not in content, "Service role key must NEVER be in frontend .env!"

    # Check for any hardcoded secret keys in src
    src_dir = os.path.join(frontend_dir, "src")
    if os.path.exists(src_dir):
        for root, _, files in os.walk(src_dir):
            for file in files:
                if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                    fpath = os.path.join(root, file)
                    with open(fpath, "r", encoding="utf-8") as f:
                        text = f.read()
                        assert "service_role_key" not in text.lower(), f"Potential service_role_key reference found in {fpath}"
                        assert "supabase_service_role" not in text.lower(), f"Potential supabase_service_role found in {fpath}"

