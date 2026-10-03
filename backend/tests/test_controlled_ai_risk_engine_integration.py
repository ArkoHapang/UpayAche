import pytest
from unittest.mock import MagicMock, patch
from app.schemas.evidence import (
    StructuredRiskEvidence,
    TieredInvestigationResponse,
    ModelResultTier,
    EvidenceTier,
    AIExplanationTier,
    SHAPContributionItem,
)
from app.services.evidence_compiler import RiskEvidenceCompiler, get_risk_evidence_compiler


def test_structured_risk_evidence_contract():
    """Verify StructuredRiskEvidence contains strictly safe fields and accepts valid payload."""
    evidence = StructuredRiskEvidence(
        risk_score=0.88,
        risk_level="HIGH",
        top_risk_features=["velocity_1h", "amount"],
        shap_contributions=[
            SHAPContributionItem(
                feature_name="velocity_1h",
                shap_value=0.35,
                direction="increases_risk",
                importance=0.35,
            )
        ],
        anomaly_score=0.72,
        anomaly_reasons=["Sudden velocity spike after 30 days dormancy"],
        network_signals=["Cycle detected in 2-hop neighborhood"],
        related_wallet_count=4,
        suspicious_connection_count=2,
        transaction_context={"transaction_id": "TX_TEST_001", "amount": 25000.0},
    )

    data = evidence.model_dump()
    assert data["risk_score"] == 0.88
    assert data["risk_level"] == "HIGH"
    assert data["anomaly_score"] == 0.72
    assert "velocity_1h" in data["top_risk_features"]
    assert len(data["shap_contributions"]) == 1
    assert data["related_wallet_count"] == 4
    assert data["suspicious_connection_count"] == 2
    assert data["transaction_context"]["amount"] == 25000.0


def test_missing_values_explicitly_unavailable():
    """Gemini and evidence compiler must never invent scores. Missing values must be None or 'Unavailable'."""
    evidence = StructuredRiskEvidence(
        risk_score=None,
        risk_level=None,
        top_risk_features=[],
        shap_contributions=[],
        anomaly_score=None,
        anomaly_reasons=[],
        network_signals=[],
        related_wallet_count=0,
        suspicious_connection_count=0,
        transaction_context={},
    )

    compiler = get_risk_evidence_compiler()
    tiered = compiler.generate_tiered_response(evidence, query="Explain status")

    # Verify model result tier has explicitly marked unavailable fields
    assert tiered.model_result.risk_score is None
    assert tiered.model_result.risk_level == "Unavailable"
    assert tiered.model_result.anomaly_score is None
    assert tiered.model_result.anomaly_level == "Unavailable"

    # Verify AI explanation acknowledges missing data rather than inventing
    assert "not available" in tiered.ai_explanation.narrative_explanation.lower() or "unavailable" in tiered.ai_explanation.narrative_explanation.lower()


def test_three_tier_separation_invariant():
    """Verify strict separation between Model result, Evidence, and AI explanation."""
    evidence = StructuredRiskEvidence(
        risk_score=0.91,
        risk_level="CRITICAL",
        top_risk_features=["rapid_drain", "night_hours"],
        shap_contributions=[
            SHAPContributionItem(
                feature_name="rapid_drain",
                shap_value=0.45,
                direction="increases_risk",
                importance=0.45,
            )
        ],
        anomaly_score=0.85,
        anomaly_reasons=["High-velocity outbound transfers"],
        network_signals=["High in-degree mule recipient pattern"],
        related_wallet_count=8,
        suspicious_connection_count=3,
        transaction_context={
            "transaction_id": "TX_CRIT_999",
            "sender_wallet": "017****1234",
            "receiver_wallet": "018****9999",
            "amount": 50000.0,
        },
    )

    compiler = get_risk_evidence_compiler()
    tiered = compiler.generate_tiered_response(
        evidence,
        query="What is the risk level?",
        ai_narrative="AI Explanation: The transaction exhibits characteristics of mule account cash-out.",
    )

    # 1. Model result tier: numerical scores and classifications only
    assert isinstance(tiered.model_result, ModelResultTier)
    assert tiered.model_result.risk_score == 0.91
    assert tiered.model_result.risk_level == "CRITICAL"
    assert tiered.model_result.anomaly_score == 0.85
    assert tiered.model_result.scoring_engine == "XGBoost v1.2"
    assert tiered.model_result.anomaly_engine == "Isolation Forest"

    # 2. Evidence tier: deterministic empirical signals
    assert isinstance(tiered.evidence, EvidenceTier)
    assert tiered.evidence.related_wallet_count == 8
    assert tiered.evidence.suspicious_connection_count == 3
    assert len(tiered.evidence.top_risk_features) == 2
    assert tiered.evidence.shap_contributions[0].feature_name == "rapid_drain"
    assert len(tiered.evidence.network_signals) == 1

    # 3. AI explanation tier: textual interpretation only (no authority over score)
    assert isinstance(tiered.ai_explanation, AIExplanationTier)
    assert "AI Explanation" in tiered.ai_explanation.narrative_explanation
    assert len(tiered.ai_explanation.investigator_checklist) > 0


def test_chat_service_formats_three_tiers():
    """Verify chat service formats three distinct sections: Model result, Evidence, and AI explanation."""
    from app.services.chat_service import get_customer_chat_service

    chat_service = get_customer_chat_service()

    # Query referencing a transaction
    response = chat_service.answer_message(
        message="Why was transaction TX_9999 flagged?",
        session_id="test_session_tiered",
    )

    content = response.content
    assert "### Model result" in content or "Model result" in content
    assert "### Evidence" in content or "Evidence" in content
    assert "### AI explanation" in content or "AI explanation" in content
    assert response.structured_evidence is not None
    assert response.tiered_response is not None
