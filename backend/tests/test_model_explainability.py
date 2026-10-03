"""
UpayAche — Phase 8 Model Explainability (SHAP) Test Suite.
Verifies:
1. SHAP TreeExplainer initialization and base value calibration
2. Structure and schema compliance:
   - risk score
   - risk level
   - top contributing features (feature, contribution, direction, human_readable_explanation)
   - direction strictly in {"increased_risk", "decreased_risk", "neutral"}
3. Grounded explanations (no invented text):
   - normal transaction (mitigating factors / decreased_risk)
   - large transaction (amount / amount_deviation increased_risk)
   - new device (new_device increased_risk)
   - high velocity (velocity_5min increased_risk)
   - unusual time (transaction_hour nocturnal increased_risk)
   - combined suspicious behavior (CRITICAL alert with multiple positive drivers)
4. Additive efficiency of Shapley values
5. REST API integration:
   - POST /api/v1/risk/explain
   - POST /api/v1/risk/score
   - Input validation error handling (422)
"""

import sys
import pytest
import numpy as np
from datetime import datetime, timezone, timedelta
from pathlib import Path
from starlette.testclient import TestClient

# Ensure project root and backend in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from ml.features import FEATURE_NAMES
from ml.explainability import (
    RiskExplainabilityService,
    get_risk_explainability_service,
    TransactionExplanation,
    FeatureContribution
)


@pytest.fixture(scope="module")
def api_client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture(scope="module")
def explain_service():
    """RiskExplainabilityService fixture."""
    return get_risk_explainability_service()


# =============================================================================
# 1. Initialization & Schema Compliance
# =============================================================================

def test_explainability_service_initialization(explain_service):
    """Verify that TreeExplainer is properly initialized with a numeric base_value."""
    assert explain_service.explainer is not None
    assert isinstance(explain_service.base_value, float)
    assert not np.isnan(explain_service.base_value)


def test_explanation_schema_contract(explain_service):
    """Verify that explanation output strictly matches the required contract."""
    res = explain_service.explain_transaction(
        amount=1500.0,
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [1500.0], "primary_device_id": "d1"},
        tx_device_id="d1"
    )

    assert isinstance(res, TransactionExplanation)
    assert 0.0 <= res.risk_score <= 1.0
    assert res.risk_level in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert res.prediction in {0, 1}
    assert isinstance(res.base_value, float)
    assert len(res.top_contributing_features) > 0
    assert isinstance(res.summary_narrative, str)
    assert len(res.summary_narrative) > 0

    for item in res.top_contributing_features:
        assert isinstance(item, FeatureContribution)
        assert item.feature in FEATURE_NAMES
        assert isinstance(item.contribution, float)
        assert item.direction in {"increased_risk", "decreased_risk", "neutral"}
        assert isinstance(item.human_readable_explanation, str)
        assert len(item.human_readable_explanation) > 0


# =============================================================================
# 2. Grounded Explanation Scenarios (DO NOT invent explanations)
# =============================================================================

def test_normal_transaction_explanation(explain_service):
    """Normal transaction should show mitigating feature contributions (decreased_risk)."""
    res = explain_service.explain_transaction(
        amount=400.0,
        timestamp=datetime(2026, 1, 15, 13, 0, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [350.0, 450.0, 400.0],
            "primary_device_id": "phone-1",
            "last_device_id": "phone-1",
            "registered_location_id": "loc-1",
            "seen_recipients": ["trusted-friend"]
        },
        receiver_profile={"id": "trusted-friend", "risk_tier": "LOW"},
        tx_device_id="phone-1",
        tx_location_id="loc-1"
    )

    assert res.risk_level == "LOW"
    assert res.prediction == 0

    # Top drivers should reduce risk
    decreased = [c for c in res.top_contributing_features if c.direction == "decreased_risk"]
    assert len(decreased) >= 1
    # Check that amount or velocity reduced risk
    amount_contrib = next((c for c in res.all_contributions if c.feature == "amount"), None)
    assert amount_contrib is not None
    assert amount_contrib.direction == "decreased_risk"
    assert "Modest transaction amount" in amount_contrib.human_readable_explanation


def test_large_transaction_explanation(explain_service):
    """Large transaction should attribute positive risk contribution to amount."""
    res = explain_service.explain_transaction(
        amount=95000.0,
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [500.0, 600.0], # Historical avg ~550
            "primary_device_id": "phone-1"
        },
        tx_device_id="phone-1"
    )

    assert res.risk_score >= 0.65
    assert res.prediction == 1

    # Find amount and amount_deviation contributions
    amount_contrib = next(c for c in res.all_contributions if c.feature == "amount")
    assert amount_contrib.direction == "increased_risk"
    assert amount_contrib.contribution > 0.0
    assert "95,000.00" in amount_contrib.human_readable_explanation


def test_new_device_explanation(explain_service):
    """New unrecognized device should contribute positive risk to new_device."""
    res = explain_service.explain_transaction(
        amount=8000.0,
        timestamp=datetime(2026, 1, 15, 15, 0, tzinfo=timezone.utc),
        sender_history={"primary_device_id": "phone-primary", "last_device_id": "phone-primary"},
        tx_device_id="rooted-burner-terminal-99" # Brand new device
    )

    new_dev_contrib = next(c for c in res.all_contributions if c.feature == "new_device")
    assert new_dev_contrib.direction == "increased_risk"
    assert new_dev_contrib.contribution > 0.0
    assert "unrecognized hardware device" in new_dev_contrib.human_readable_explanation


def test_high_velocity_explanation(explain_service):
    """High velocity burst should attribute risk to velocity_5min and velocity_1hour."""
    now = datetime(2026, 1, 15, 17, 0, tzinfo=timezone.utc)
    recent_burst = [
        {"timestamp": now - timedelta(seconds=i * 20), "amount": 2500.0}
        for i in range(1, 10) # 9 rapid transactions
    ]

    res = explain_service.explain_transaction(
        amount=3000.0,
        timestamp=now,
        sender_history={"prior_amounts": [3000.0]},
        recent_transactions=recent_burst
    )

    assert res.risk_score >= 0.70
    assert res.prediction == 1

    v5_contrib = next(c for c in res.all_contributions if c.feature == "velocity_5min")
    assert v5_contrib.direction == "increased_risk"
    assert v5_contrib.contribution > 0.0
    assert "velocity storm" in v5_contrib.human_readable_explanation.lower()


def test_unusual_time_explanation(explain_service):
    """Nocturnal transaction should attribute risk to transaction_hour."""
    res = explain_service.explain_transaction(
        amount=35000.0,
        timestamp=datetime(2026, 1, 15, 3, 30, tzinfo=timezone.utc), # 03:30 AM dead hour
        sender_history={"prior_amounts": [1000.0]}
    )

    hour_contrib = next(c for c in res.all_contributions if c.feature == "transaction_hour")
    assert hour_contrib.direction == "increased_risk"
    assert hour_contrib.contribution > 0.0
    assert "nocturnal dead hours" in hour_contrib.human_readable_explanation


def test_combined_suspicious_behavior_explanation(explain_service):
    """Combined red flags should result in CRITICAL alert with multiple positive drivers."""
    now = datetime(2026, 1, 15, 2, 45, tzinfo=timezone.utc)
    recent_burst = [{"timestamp": now - timedelta(seconds=i * 30), "amount": 5000.0} for i in range(1, 8)]

    res = explain_service.explain_transaction(
        amount=95000.0,
        timestamp=now,
        sender_history={"prior_amounts": [300.0], "primary_device_id": "phone-1", "registered_location_id": "loc-home"},
        receiver_profile={"id": "mule-aggregator", "risk_tier": "CRITICAL", "is_synthetic_mule": True},
        tx_device_id="burner-emulator",
        tx_location_id="border-zone",
        recent_transactions=recent_burst,
        top_k=5
    )

    assert res.risk_level == "CRITICAL"
    assert res.risk_score >= 0.88
    assert res.prediction == 1

    # Check that top features list multiple increased_risk features
    positives = [c for c in res.top_contributing_features if c.direction == "increased_risk"]
    assert len(positives) >= 3


# =============================================================================
# 3. Additive Efficiency & Verification
# =============================================================================

def test_additive_efficiency(explain_service):
    """
    SHAP Invariant: sum of SHAP values + base_value reconstructs raw model margin (log-odds).
    """
    test_features = {
        "amount": 25000.0,
        "transaction_hour": 14.0,
        "transaction_frequency": 2.0,
        "average_transaction_amount": 500.0,
        "amount_deviation": 49.0,
        "new_recipient": 1.0,
        "new_device": 1.0,
        "location_change": 0.0,
        "device_change": 1.0,
        "recipient_risk": 0.05,
        "velocity_5min": 0.0,
        "velocity_1hour": 1.0,
        "velocity_24hour": 2.0
    }

    res = explain_service.explain_features(test_features)
    vector = np.array([[test_features[f] for f in FEATURE_NAMES]], dtype=np.float32)

    # Raw model decision margin (log-odds before logistic transform)
    raw_margin = float(explain_service.model.predict(vector, output_margin=True)[0])
    shap_sum = sum(c.contribution for c in res.all_contributions)
    reconstructed_margin = res.base_value + shap_sum

    # Must match within rounding tolerance
    assert abs(raw_margin - reconstructed_margin) < 0.05


def test_no_invented_explanations(explain_service):
    """
    Verify that explanations are dynamically computed from actual values and contributions,
    not static mock text.
    """
    small = explain_service.explain_transaction(
        amount=250.0,
        timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [250.0]}
    )
    huge = explain_service.explain_transaction(
        amount=85000.0,
        timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [250.0]}
    )

    small_amt = next(c for c in small.all_contributions if c.feature == "amount")
    huge_amt = next(c for c in huge.all_contributions if c.feature == "amount")

    assert small_amt.contribution != huge_amt.contribution
    assert small_amt.direction != huge_amt.direction
    assert small_amt.human_readable_explanation != huge_amt.human_readable_explanation


# =============================================================================
# 4. REST API Integration
# =============================================================================

def test_api_risk_explain_endpoint(api_client):
    """Verify POST /api/v1/risk/explain returns 200 and valid schema."""
    payload = {
        "amount": 95000.0,
        "timestamp": "2026-01-15T03:00:00Z",
        "sender_history": {"prior_amounts": [500.0], "primary_device_id": "dev-1"},
        "tx_device_id": "burner-dev-99",
        "top_k": 4
    }

    res = api_client.post("/api/v1/risk/explain", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "risk_score" in data
    assert "risk_level" in data
    assert "top_contributing_features" in data
    assert len(data["top_contributing_features"]) == 4
    for f in data["top_contributing_features"]:
        assert "feature" in f
        assert "contribution" in f
        assert "direction" in f
        assert "human_readable_explanation" in f


def test_api_risk_score_endpoint(api_client):
    """Verify POST /api/v1/risk/score returns 200 and valid schema."""
    payload = {
        "amount": 500.0,
        "timestamp": "2026-01-15T14:00:00Z"
    }

    res = api_client.post("/api/v1/risk/score", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "risk_score" in data
    assert "risk_level" in data
    assert "prediction" in data


def test_api_risk_invalid_input(api_client):
    """Invalid negative amount must return 422."""
    payload = {
        "amount": -500.0
    }
    res = api_client.post("/api/v1/risk/explain", json=payload)
    assert res.status_code == 422
