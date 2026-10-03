"""
UpayAche — Phase 5 ML Risk Engine Test Suite.
Verifies:
1. Model artifact existence and metadata integrity
2. Evaluation metrics meet target thresholds (Precision, Recall, F1, ROC-AUC >= 0.85)
3. Prediction output contract schema compliance (risk_score, risk_level, prediction, model_version, timestamp)
4. Specific scenarios required by specification:
   - normal transaction (LOW risk)
   - large transaction (elevated risk)
   - new device (elevated risk)
   - new recipient (elevated risk)
   - high velocity (elevated risk)
   - unusual time (elevated risk)
   - combined suspicious behavior (CRITICAL risk)
   - invalid input (raises ValueError with informative message)
5. Zero LLM / Gemini dependency in classifier
6. Dynamic, non-hardcoded continuous risk score computation
"""

import sys
import json
import pytest
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.features import FEATURE_NAMES, compute_features_from_context
from ml.prediction import RiskPredictionService, get_risk_prediction_service


@pytest.fixture(scope="module")
def prediction_service():
    """Initialize and return the RiskPredictionService singleton."""
    return get_risk_prediction_service()


@pytest.fixture(scope="module")
def model_paths():
    """Return dictionary of ML model and evaluation file paths."""
    ml_dir = PROJECT_ROOT / "ml"
    return {
        "model_joblib": ml_dir / "models" / "xgboost_risk_model.joblib",
        "model_json": ml_dir / "models" / "xgboost_risk_model.json",
        "model_metadata": ml_dir / "models" / "model_metadata.json",
        "eval_metrics": ml_dir / "evaluation" / "metrics.json",
        "eval_report": ml_dir / "evaluation" / "report.md"
    }


# =============================================================================
# 1. Artifacts & Evaluation Metrics Validation
# =============================================================================

def test_model_artifacts_exist(model_paths):
    """Verify that training and evaluation generated all required persistent artifacts."""
    for name, path in model_paths.items():
        assert path.exists(), f"Missing required ML artifact: {name} at {path}"
        assert path.stat().st_size > 0, f"Artifact is empty: {name} at {path}"


def test_model_metadata_structure(model_paths):
    """Verify model metadata structure, versioning, and feature contract."""
    with open(model_paths["model_metadata"], "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_name"] == "xgboost_risk_engine"
    assert meta["algorithm"] == "XGBClassifier"
    assert meta["model_version"] == "v1.0.0"
    assert meta["feature_count"] == 13
    assert set(meta["feature_names"]) == set(FEATURE_NAMES)
    assert "risk_levels" in meta
    for level in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
        assert level in meta["risk_levels"]


def test_evaluation_metrics_pass(model_paths):
    """Verify that model evaluation meets production accuracy targets."""
    with open(model_paths["eval_metrics"], "r", encoding="utf-8") as f:
        eval_data = json.load(f)

    metrics = eval_data["metrics"]
    assert metrics["precision"] >= 0.85, f"Precision too low: {metrics['precision']}"
    assert metrics["recall"] >= 0.85, f"Recall too low: {metrics['recall']}"
    assert metrics["f1_score"] >= 0.85, f"F1 score too low: {metrics['f1_score']}"
    assert metrics["roc_auc"] >= 0.90, f"ROC-AUC too low: {metrics['roc_auc']}"

    cm = eval_data["confusion_matrix"]
    assert cm["true_positives"] > 0
    assert cm["true_negatives"] > 0
    assert "false_positive_count" in eval_data
    assert "false_negative_count" in eval_data


def test_feature_vector_dimensions():
    """Verify the 13 canonical features specified in the requirements."""
    expected_features = [
        "amount",
        "transaction_hour",
        "transaction_frequency",
        "average_transaction_amount",
        "amount_deviation",
        "new_recipient",
        "new_device",
        "location_change",
        "device_change",
        "recipient_risk",
        "velocity_5min",
        "velocity_1hour",
        "velocity_24hour"
    ]
    assert FEATURE_NAMES == expected_features
    assert len(FEATURE_NAMES) == 13


# =============================================================================
# 2. Prediction Contract & Schema Compliance
# =============================================================================

def test_prediction_output_contract(prediction_service):
    """Verify prediction response schema matches the mandatory contract."""
    res = prediction_service.predict_transaction(
        amount=600.0,
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [500.0, 700.0], "primary_device_id": "d1", "registered_location_id": "l1"},
        receiver_profile={"id": "rec-1", "risk_tier": "LOW"},
        tx_device_id="d1",
        tx_location_id="l1"
    )

    required_keys = {"risk_score", "risk_level", "prediction", "model_version", "timestamp"}
    for key in required_keys:
        assert key in res, f"Missing required prediction key: {key}"

    assert isinstance(res["risk_score"], float)
    assert 0.0 <= res["risk_score"] <= 1.0
    assert res["risk_level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert res["prediction"] in {0, 1}
    assert isinstance(res["model_version"], str)
    assert isinstance(res["timestamp"], str)


# =============================================================================
# 3. Explicit Scenario Test Cases
# =============================================================================

def test_normal_transaction(prediction_service):
    """Scenario 1: Normal daytime consumer transaction with known device and recipient."""
    res = prediction_service.predict_transaction(
        amount=450.0,
        timestamp=datetime(2026, 1, 15, 13, 30, tzinfo=timezone.utc), # 1:30 PM
        sender_history={
            "prior_amounts": [400.0, 500.0, 450.0],
            "primary_device_id": "dev-known-1",
            "last_device_id": "dev-known-1",
            "registered_location_id": "loc-home",
            "seen_recipients": ["rec-known-1"]
        },
        receiver_profile={"id": "rec-known-1", "risk_tier": "LOW"},
        tx_device_id="dev-known-1",
        tx_location_id="loc-home",
        recent_transactions=[]
    )

    assert res["risk_level"] == "LOW"
    assert res["risk_score"] < 0.35
    assert res["prediction"] == 0


def test_large_transaction(prediction_service):
    """Scenario 2: Unusually large transaction with high deviation from historical average."""
    res = prediction_service.predict_transaction(
        amount=98500.0, # Massive spike
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [300.0, 500.0, 400.0], # Historical avg ~400
            "primary_device_id": "dev-1",
            "last_device_id": "dev-1",
            "registered_location_id": "loc-1",
            "seen_recipients": ["rec-1"]
        },
        receiver_profile={"id": "rec-1", "risk_tier": "LOW"},
        tx_device_id="dev-1",
        tx_location_id="loc-1"
    )

    assert res["risk_score"] >= 0.65
    assert res["risk_level"] in ("HIGH", "CRITICAL")
    assert res["prediction"] == 1


def test_new_device(prediction_service):
    """Scenario 3: Transaction from a new/burner unrecognized device."""
    # Compare known device vs new device with same financial parameters
    baseline = prediction_service.predict_transaction(
        amount=12000.0,
        timestamp=datetime(2026, 1, 15, 15, 0, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [10000.0, 11000.0],
            "primary_device_id": "dev-primary",
            "last_device_id": "dev-primary",
            "registered_location_id": "loc-primary",
            "seen_recipients": ["rec-1"]
        },
        receiver_profile={"id": "rec-1", "risk_tier": "LOW"},
        tx_device_id="dev-primary",
        tx_location_id="loc-primary"
    )

    new_dev = prediction_service.predict_transaction(
        amount=12000.0,
        timestamp=datetime(2026, 1, 15, 15, 0, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [10000.0, 11000.0],
            "primary_device_id": "dev-primary",
            "last_device_id": "dev-primary",
            "registered_location_id": "loc-primary",
            "seen_recipients": ["rec-1"]
        },
        receiver_profile={"id": "rec-1", "risk_tier": "LOW"},
        tx_device_id="dev-burner-rooted-99", # Completely new burner device
        tx_location_id="loc-primary"
    )

    assert new_dev["features"]["new_device"] == 1.0
    assert new_dev["risk_score"] >= baseline["risk_score"]


def test_new_recipient(prediction_service):
    """Scenario 4: High-value transaction to a brand new recipient with mule risk tier."""
    res = prediction_service.predict_transaction(
        amount=22000.0,
        timestamp=datetime(2026, 1, 15, 16, 0, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [1000.0, 2000.0],
            "primary_device_id": "dev-1",
            "last_device_id": "dev-1",
            "registered_location_id": "loc-1",
            "seen_recipients": ["trusted-rec-1", "trusted-rec-2"]
        },
        receiver_profile={"id": "new-unseen-mule-wallet", "risk_tier": "CRITICAL", "is_synthetic_mule": True},
        tx_device_id="dev-1",
        tx_location_id="loc-1"
    )

    assert res["features"]["new_recipient"] == 1.0
    assert res["features"]["recipient_risk"] >= 0.85
    assert res["risk_score"] >= 0.70
    assert res["prediction"] == 1


def test_high_velocity(prediction_service):
    """Scenario 5: High transaction velocity (rapid multi-transaction burst)."""
    now = datetime(2026, 1, 15, 18, 0, tzinfo=timezone.utc)
    recent_txs = [
        {"timestamp": now - timedelta(seconds=i * 20), "amount": 2500.0}
        for i in range(1, 10) # 9 transactions within trailing 3 minutes
    ]

    res = prediction_service.predict_transaction(
        amount=3500.0,
        timestamp=now,
        sender_history={
            "prior_amounts": [3000.0],
            "primary_device_id": "dev-1",
            "last_device_id": "dev-1",
            "registered_location_id": "loc-1"
        },
        receiver_profile={"id": "rec-1", "risk_tier": "LOW"},
        tx_device_id="dev-1",
        tx_location_id="loc-1",
        recent_transactions=recent_txs
    )

    assert res["features"]["velocity_5min"] >= 8
    assert res["risk_score"] >= 0.70
    assert res["prediction"] == 1


def test_unusual_time(prediction_service):
    """Scenario 6: Cash-out during nocturnal dead hours (03:15 AM)."""
    res = prediction_service.predict_transaction(
        amount=32000.0,
        timestamp=datetime(2026, 1, 15, 3, 15, tzinfo=timezone.utc), # 03:15 AM
        sender_history={
            "prior_amounts": [1000.0, 1500.0],
            "primary_device_id": "dev-1",
            "last_device_id": "dev-1",
            "registered_location_id": "loc-1"
        },
        receiver_profile={"id": "agent-1", "risk_tier": "LOW"},
        tx_device_id="dev-1",
        tx_location_id="loc-1"
    )

    assert res["features"]["transaction_hour"] == 3.0
    assert res["risk_score"] >= 0.70
    assert res["prediction"] == 1


def test_combined_suspicious_behavior(prediction_service):
    """Scenario 7: Combined multi-vector suspicious behavior (CRITICAL alert)."""
    now = datetime(2026, 1, 15, 2, 45, tzinfo=timezone.utc) # Dead hour 02:45 AM
    recent_burst = [
        {"timestamp": now - timedelta(seconds=i * 30), "amount": 5000.0}
        for i in range(1, 8) # High velocity
    ]

    res = prediction_service.predict_transaction(
        amount=95000.0, # Huge liquidation amount
        timestamp=now,
        sender_history={
            "prior_amounts": [300.0, 400.0],
            "primary_device_id": "dev-phone-primary",
            "last_device_id": "dev-phone-primary",
            "registered_location_id": "loc-dhaka-central",
            "seen_recipients": ["trusted-contact"]
        },
        receiver_profile={
            "id": "border-mule-aggregator",
            "risk_tier": "CRITICAL",
            "is_synthetic_mule": True
        },
        tx_device_id="dev-rooted-emulator", # New burner device
        tx_location_id="loc-border-zone", # Location jump
        recent_transactions=recent_burst
    )

    assert res["risk_score"] >= 0.88
    assert res["risk_level"] == "CRITICAL"
    assert res["prediction"] == 1


# =============================================================================
# 4. Input Validation & Error Handling
# =============================================================================

def test_invalid_input_negative_amount(prediction_service):
    """Negative amount must raise ValueError."""
    with pytest.raises(ValueError, match="strictly positive"):
        prediction_service.predict_transaction(
            amount=-500.0,
            timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
        )


def test_invalid_input_zero_amount(prediction_service):
    """Zero amount must raise ValueError."""
    with pytest.raises(ValueError, match="strictly positive"):
        prediction_service.predict_transaction(
            amount=0.0,
            timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
        )


def test_invalid_input_missing_feature(prediction_service):
    """Missing canonical feature in feature dict must raise ValueError."""
    features = {f: 1.0 for f in FEATURE_NAMES if f != "velocity_5min"} # Missing velocity_5min
    with pytest.raises(ValueError, match="Missing required feature: 'velocity_5min'"):
        prediction_service.predict_features(features)


def test_invalid_input_non_numeric(prediction_service):
    """Non-numeric feature value must raise ValueError."""
    features = {f: 1.0 for f in FEATURE_NAMES}
    features["amount"] = "one_thousand" # String instead of float
    with pytest.raises(ValueError, match="must be a valid number"):
        prediction_service.predict_features(features)


def test_invalid_input_invalid_hour(prediction_service):
    """Invalid hour must raise ValueError."""
    features = {f: 1.0 for f in FEATURE_NAMES}
    features["transaction_hour"] = 25.0
    with pytest.raises(ValueError, match="between 0 and 23"):
        prediction_service.predict_features(features)


def test_invalid_input_negative_velocity(prediction_service):
    """Negative velocity must raise ValueError."""
    features = {f: 1.0 for f in FEATURE_NAMES}
    features["velocity_1hour"] = -5.0
    with pytest.raises(ValueError, match="cannot be negative"):
        prediction_service.predict_features(features)


# =============================================================================
# 5. Core Invariants (No Gemini in classifier, dynamic continuous scoring)
# =============================================================================

def test_no_gemini_dependency_in_classifier(prediction_service):
    """Ensure Gemini SDK is NOT used for ML classification."""
    # Verify underlying model is pure XGBoost
    import xgboost as xgb
    assert isinstance(prediction_service.model, xgb.XGBClassifier)


def test_dynamic_non_hardcoded_scores(prediction_service):
    """Ensure risk scores are continuous floats calculated dynamically, not hardcoded."""
    scores = set()
    test_amounts = [200.0, 500.0, 1500.0, 10000.0, 25000.0, 80000.0]
    
    for amt in test_amounts:
        res = prediction_service.predict_transaction(
            amount=amt,
            timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
            sender_history={"prior_amounts": [500.0]}
        )
        scores.add(res["risk_score"])

    # Must produce dynamic variations, not static mock constants
    assert len(scores) >= 2
