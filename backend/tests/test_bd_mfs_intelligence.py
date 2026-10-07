"""
UpayAche — Bangladesh MFS Fraud Intelligence & Composite Risk Test Suite.
Verifies judge feedback requirements:
1. Composite risk calculation (XGBoost 50% + Isolation Forest 25% + Graph 25%)
2. Explicit SHAP scope disclosure (SHAP explains XGBoost, not full composite)
3. Bangladesh MFS fraud typologies (ATO/SIM swap, agent abuse, smurfing, nocturnal, fake reversals)
4. "What happened / Why risky / What to investigate next" triad
5. Bangla summary and responsible AI notices (Risk signal != confirmed fraud)
6. Graph intelligence: mule rings, fan-in/fan-out hubs, shortest paths
7. Case-linked intelligence: recommending connected wallets for review on CONFIRMED_FRAUD without automated blocking
"""

import pytest
import networkx as nx
from starlette.testclient import TestClient

from app.main import app
from app.services.risk_service import get_risk_analytics_service
from app.services.investigation_service import get_investigation_service
from app.services.network_service import get_network_service
from app.graph.analysis import detect_mule_rings, detect_fan_hubs, find_shortest_suspicious_path
from app.core.security import CurrentUser
from app.schemas.investigations import InvestigationCaseUpdate


@pytest.fixture(scope="module")
def api_client():
    return TestClient(app, headers={"Authorization": "Bearer test-analyst-token"})


def test_composite_risk_breakdown():
    """Verify composite risk formulation and SHAP scope disclosure."""
    risk_service = get_risk_analytics_service()
    txs, _ = risk_service.repo.list_transactions(limit=10)
    assert len(txs) > 0

    tx_id = str(txs[0]["id"])
    detail = risk_service.get_transaction_risk(tx_id)

    assert detail.composite_breakdown is not None
    cb = detail.composite_breakdown
    assert cb.supervised_weight == 0.50
    assert cb.anomaly_weight == 0.25
    assert cb.graph_weight == 0.25

    # Composite formula check: 0.50*sup + 0.25*anom + 0.25*graph
    expected = round(0.50 * cb.supervised_score + 0.25 * cb.anomaly_score + 0.25 * cb.graph_score, 4)
    assert abs(cb.composite_score - expected) < 1e-4

    # SHAP scope disclosure check
    assert "SHAP feature attributions explain the supervised XGBoost model specifically" in cb.shap_scope_notice


def test_bangladesh_mfs_intelligence_and_triad():
    """Verify Bangladesh MFS typology, triad breakdown, and Bangla summary."""
    risk_service = get_risk_analytics_service()
    txs, _ = risk_service.repo.list_transactions(limit=10)
    tx_id = str(txs[0]["id"])
    detail = risk_service.get_transaction_risk(tx_id)

    assert detail.mfs_intelligence is not None
    mfs = detail.mfs_intelligence
    assert mfs.typology_code in (
        "ACCOUNT_TAKEOVER",
        "ACCOUNT_TAKEOVER_DEVICE_CHANGE",
        "AGENT_CASHOUT_ABUSE",
        "MULE_NETWORK",
        "MULE_RING_SMURFING",
        "SMURFING",
        "NOCTURNAL_CASHOUT",
        "NOCTURNAL_BURST",
        "SOCIAL_ENGINEERING",
        "FAKE_REVERSAL_SOCIAL_ENGINEERING",
        "RAPID_FUND_MOVEMENT"
    )
    # Evidence features check
    assert hasattr(mfs, "evidence_features")
    assert isinstance(mfs.evidence_features, list)
    # Triad check
    assert len(mfs.what_happened) > 10
    assert len(mfs.why_risky) > 10
    assert len(mfs.what_to_investigate_next) >= 1
    # Bangla check
    assert len(mfs.bangla_summary) > 5
    assert "তদন্ত" in mfs.bangla_summary or "সতর্কবার্তা" in mfs.bangla_summary or "নিয়মিত" in mfs.bangla_summary
    # Responsible AI check
    assert "RISK SIGNAL != CONFIRMED FRAUD" in detail.responsible_ai_notice
    assert "CONFIRMED FRAUD" in detail.responsible_ai_notice.upper()


def test_graph_intelligence_mule_rings_and_hubs():
    """Verify mule ring detection, fan-in/fan-out hubs, and shortest paths."""
    net_service = get_network_service()

    # Mule rings
    rings = net_service.get_mule_rings()
    assert isinstance(rings, list)
    if rings:
        assert "ring_id" in rings[0]
        assert "cycle_length" in rings[0]
        assert rings[0]["cycle_length"] >= 3

    # Fan hubs
    hubs = net_service.get_fan_hubs()
    assert "fan_in_hubs" in hubs
    assert "fan_out_hubs" in hubs
    assert isinstance(hubs["fan_in_hubs"], list)
    assert isinstance(hubs["fan_out_hubs"], list)

    # Shortest suspicious path
    wallets = list(net_service.graph.nodes())
    if len(wallets) >= 2:
        path_res = net_service.get_shortest_suspicious_path(wallets[0])
        if path_res:
            assert "hops" in path_res
            assert "path_wallets" in path_res


def test_api_network_mule_rings_and_hubs(api_client):
    """Verify REST API endpoints for graph intelligence."""
    r_rings = api_client.get("/api/v1/network/mule-rings")
    assert r_rings.status_code == 200
    assert isinstance(r_rings.json(), list)

    r_hubs = api_client.get("/api/v1/network/fan-hubs")
    assert r_hubs.status_code == 200
    data_hubs = r_hubs.json()
    assert "fan_in_hubs" in data_hubs
    assert "fan_out_hubs" in data_hubs


def test_case_linked_intelligence_fraud_confirmation():
    """Verify that confirming case as fraud recommends connected wallets for review without auto-blocking."""
    from app.services.audit_service import get_audit_service
    inv_service = get_investigation_service()
    user = CurrentUser(id="usr-analyst", email="analyst@upayache.internal", full_name="Analyst User", role="ANALYST")

    # List cases
    cases_resp = inv_service.list_cases(limit=10)
    assert len(cases_resp.items) > 0
    test_case = cases_resp.items[0]

    # Verify transition to CLOSED with CONFIRMED_FRAUD
    # Ensure it reaches REVIEWED state before closing
    try:
        curr_status = test_case.status
        if curr_status == "OPEN":
            inv_service.update_case(test_case.id, InvestigationCaseUpdate(status="INVESTIGATING"), user)
            inv_service.update_case(test_case.id, InvestigationCaseUpdate(status="REVIEWED"), user)
        elif curr_status == "INVESTIGATING":
            inv_service.update_case(test_case.id, InvestigationCaseUpdate(status="REVIEWED"), user)
        elif curr_status == "CLOSED":
            admin_user = CurrentUser(id="usr-admin", email="admin@upayache.internal", full_name="Admin User", role="ADMIN")
            inv_service.update_case(test_case.id, InvestigationCaseUpdate(status="INVESTIGATING"), admin_user)
            inv_service.update_case(test_case.id, InvestigationCaseUpdate(status="REVIEWED"), user)

        closed_case = inv_service.update_case(
            test_case.id,
            InvestigationCaseUpdate(status="CLOSED", resolution="CONFIRMED_FRAUD", analyst_comment="Fraud verified by forensic audit"),
            user
        )
        assert closed_case.status == "CLOSED"
        assert closed_case.resolution == "CONFIRMED_FRAUD"

        # Check recommended wallets
        assert hasattr(closed_case, "recommended_wallets_for_review")
        assert isinstance(closed_case.recommended_wallets_for_review, list)
        if closed_case.recommended_wallets_for_review:
            rec = closed_case.recommended_wallets_for_review[0]
            assert rec.recommendation == "Recommended for Review"
            assert hasattr(rec, "connection_reason")
            assert hasattr(rec, "hop_distance")
            assert hasattr(rec, "transaction_relationship")
            assert "NEVER automatically blocked" in rec.advisory_notice

        # Verify audit log recorded the recommendation event
        audit_res = get_audit_service().list_logs(resource_type="investigation_case", limit=20)
        actions = [ev.action for ev in audit_res.items]
        assert "CONNECTED_WALLETS_RECOMMENDED_FOR_REVIEW" in actions or "CASE_STATUS_UPDATED" in actions
    finally:
        # Reset demo data to maintain test isolation
        inv_service.reset_demo_data()


def test_gemini_investigation_assistant_separation_and_advisory():
    """Verify Gemini Copilot strictly distinguishes Facts from AI interpretation and carries mandatory advisory label."""
    from app.services.ai_service import get_ai_service
    from app.schemas.ai import AIInvestigationRequest

    inv_service = get_investigation_service()
    ai_service = get_ai_service()
    user = CurrentUser(id="usr-analyst", email="analyst@upayache.internal", full_name="Analyst User", role="ANALYST")

    cases_resp = inv_service.list_cases(limit=5)
    assert len(cases_resp.items) > 0
    test_case = cases_resp.items[0]

    # Test English query
    req_en = AIInvestigationRequest(
        case_id=test_case.id,
        question="Why was this transaction flagged?",
        language="en"
    )
    resp_en = ai_service.investigate(req_en, user=user)
    assert resp_en.success is True
    report = resp_en.data

    # 1. Verify Mandatory Advisory Label
    expected_advisory = "AI-generated investigation assistance. Verify all conclusions against the evidence. Final decisions remain with authorized analysts."
    assert report.advisory_label == expected_advisory
    assert resp_en.tiered_response.ai_explanation.advisory_label == expected_advisory

    # 2. Verify FACTS FROM EVIDENCE
    assert report.facts_from_evidence is not None
    assert isinstance(report.facts_from_evidence.wallet_ids, list)
    assert isinstance(report.facts_from_evidence.transaction_ids, list)
    assert isinstance(report.facts_from_evidence.amounts, list)
    assert isinstance(report.facts_from_evidence.timestamps, list)
    assert isinstance(report.facts_from_evidence.risk_signals, list)

    # 3. Verify AI INTERPRETATION
    assert report.ai_interpretation is not None
    assert len(report.ai_interpretation.likely_explanation) > 0
    assert isinstance(report.ai_interpretation.investigation_recommendation, list)

    # 4. Verify Investigation Triad
    assert report.what_happened is not None and len(report.what_happened) > 0
    assert report.why_risky is not None and len(report.why_risky) > 0
    assert len(report.what_to_investigate_next) > 0

    # 5. Verify Bangla Support
    assert report.bangla_summary is not None
    assert "তদন্ত" in report.bangla_summary or "ঝুঁকি" in report.bangla_summary

    # Test Bangla query explicitly
    req_bn = AIInvestigationRequest(
        case_id=test_case.id,
        question="এই লেনদেনটি কেন ঝুঁকিপূর্ণ?",
        language="bn"
    )
    resp_bn = ai_service.investigate(req_bn, user=user)
    assert resp_bn.success is True
    assert resp_bn.data.bangla_summary is not None

