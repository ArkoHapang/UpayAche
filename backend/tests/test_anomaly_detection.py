"""
UpayAche — Phase 6 Behavioral Anomaly Detection Test Suite.
Verifies:
1. Model artifact existence and metadata integrity (Isolation Forest)
2. Evaluation metrics meet expectations (ROC-AUC >= 0.90, Precision >= 0.85)
3. Standardized prediction output schema:
   - anomaly_score (float in [0.0, 1.0])
   - is_anomaly (int 0 or 1)
   - model_version (string)
   - timestamp (ISO-8601 string)
4. Specific behavioral anomaly detection scenarios:
   - unusual transaction amount
   - unusual transaction frequency
   - unusual transaction time (nocturnal activity)
   - new device behavior
   - new location behavior
   - recipient behavior change
   - sudden activity spike
   - normal baseline behavior (inlier)
5. Input validation and boundary enforcement (raises ValueError)
6. Strict architectural separation of concerns (Isolation Forest != XGBoost)
"""

import sys
import json
import pytest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from sklearn.ensemble import IsolationForest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.anomaly_features import ANOMALY_FEATURE_NAMES, compute_behavioral_features
from ml.anomaly_service import BehavioralAnomalyService, get_behavioral_anomaly_service
from ml.prediction import RiskPredictionService, get_risk_prediction_service


@pytest.fixture(scope="module")
def anomaly_service():
    """Initialize and return the BehavioralAnomalyService singleton."""
    return get_behavioral_anomaly_service()


@pytest.fixture(scope="module")
def risk_service():
    """Initialize and return the RiskPredictionService singleton for separation tests."""
    return get_risk_prediction_service()


@pytest.fixture(scope="module")
def anomaly_artifacts():
    """Return dictionary of anomaly detection persistent artifact paths."""
    ml_dir = PROJECT_ROOT / "ml"
    return {
        "model_joblib": ml_dir / "models" / "isolation_forest_model.joblib",
        "metadata_json": ml_dir / "models" / "anomaly_metadata.json",
        "eval_metrics": ml_dir / "evaluation" / "anomaly_metrics.json",
        "eval_report": ml_dir / "evaluation" / "anomaly_report.md"
    }


# =============================================================================
# 1. Artifacts & Unsupervised Metrics Verification
# =============================================================================

def test_anomaly_artifacts_exist(anomaly_artifacts):
    """Verify that Isolation Forest training and evaluation generated all artifacts."""
    for name, path in anomaly_artifacts.items():
        assert path.exists(), f"Missing required anomaly artifact: {name} at {path}"
        assert path.stat().st_size > 0, f"Artifact is empty: {name} at {path}"


def test_anomaly_metadata_structure(anomaly_artifacts):
    """Verify anomaly metadata structure, algorithm definition, and feature names."""
    with open(anomaly_artifacts["metadata_json"], "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert meta["model_name"] == "isolation_forest_behavioral_engine"
    assert meta["algorithm"] == "IsolationForest"
    assert meta["paradigm"] == "unsupervised_anomaly_detection"
    assert meta["feature_count"] == 11
    assert set(meta["feature_names"]) == set(ANOMALY_FEATURE_NAMES)
    assert "score_calibration" in meta
    assert meta["score_calibration"]["decision_threshold"] == 0.50


def test_anomaly_evaluation_metrics_pass(anomaly_artifacts):
    """Verify that behavioral anomaly detection meets accuracy and separation baselines."""
    with open(anomaly_artifacts["eval_metrics"], "r", encoding="utf-8") as f:
        eval_data = json.load(f)

    metrics = eval_data["metrics"]
    assert metrics["roc_auc"] >= 0.90, f"ROC-AUC below target: {metrics['roc_auc']}"
    assert metrics["precision"] >= 0.85, f"Precision below target: {metrics['precision']}"

    cm = eval_data["confusion_matrix"]
    assert cm["true_positives"] > 0
    assert cm["true_negatives"] > 0
    assert "behavior_breakdown" in eval_data


def test_anomaly_feature_dimensions():
    """Verify behavioral feature vector contains the 11 required dimensions."""
    expected_features = [
        "amount",
        "amount_deviation",
        "transaction_frequency",
        "transaction_hour",
        "is_nocturnal",
        "new_device",
        "device_change",
        "new_location",
        "new_recipient",
        "velocity_5min",
        "velocity_1hour"
    ]
    assert ANOMALY_FEATURE_NAMES == expected_features
    assert len(ANOMALY_FEATURE_NAMES) == 11


# =============================================================================
# 2. Output Contract Compliance
# =============================================================================

def test_anomaly_output_contract(anomaly_service):
    """Verify prediction response schema matches the mandatory contract."""
    res = anomaly_service.predict_anomaly_transaction(
        amount=500.0,
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [500.0], "primary_device_id": "d1", "registered_location_id": "l1"},
        tx_device_id="d1",
        tx_location_id="l1"
    )

    required_keys = {"anomaly_score", "is_anomaly", "model_version", "timestamp"}
    for key in required_keys:
        assert key in res, f"Missing required anomaly key: {key}"

    assert isinstance(res["anomaly_score"], float)
    assert 0.0 <= res["anomaly_score"] <= 1.0
    assert res["is_anomaly"] in {0, 1}
    assert isinstance(res["model_version"], str)
    assert isinstance(res["timestamp"], str)


# =============================================================================
# 3. Behavioral Detection Scenarios
# =============================================================================

def test_normal_baseline_behavior(anomaly_service):
    """Normal typical consumer transaction should produce low anomaly score and is_anomaly = 0."""
    res = anomaly_service.predict_anomaly_transaction(
        amount=450.0,
        timestamp=datetime(2026, 1, 15, 14, 30, tzinfo=timezone.utc),
        sender_history={
            "prior_amounts": [400.0, 500.0, 450.0],
            "primary_device_id": "dev-home-phone",
            "last_device_id": "dev-home-phone",
            "registered_location_id": "loc-dhaka",
            "seen_recipients": ["rec-grocer"]
        },
        receiver_profile={"id": "rec-grocer"},
        tx_device_id="dev-home-phone",
        tx_location_id="loc-dhaka",
        recent_transactions=[]
    )

    assert res["anomaly_score"] < 0.40
    assert res["is_anomaly"] == 0


def test_detect_unusual_transaction_amount(anomaly_service):
    """Scenario 1: Detect unusual transaction amount (massive historical deviation)."""
    baseline = anomaly_service.predict_anomaly_transaction(
        amount=500.0,
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [500.0, 450.0, 550.0]}
    )

    unusual_amt = anomaly_service.predict_anomaly_transaction(
        amount=95000.0, # 190x historical average
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [500.0, 450.0, 550.0]}
    )

    assert unusual_amt["features"]["amount_deviation"] > 100.0
    assert unusual_amt["anomaly_score"] > baseline["anomaly_score"]
    assert unusual_amt["is_anomaly"] == 1


def test_detect_unusual_transaction_frequency(anomaly_service):
    """Scenario 2: Detect unusual transaction frequency (25 transactions in 24 hours)."""
    now = datetime(2026, 1, 15, 16, 0, tzinfo=timezone.utc)
    recent_txs = [
        {"timestamp": now - timedelta(hours=i), "amount": 1000.0}
        for i in range(1, 26) # 25 transactions
    ]

    res = anomaly_service.predict_anomaly_transaction(
        amount=1200.0,
        timestamp=now,
        sender_history={"prior_amounts": [1000.0]},
        recent_transactions=recent_txs
    )

    assert res["features"]["transaction_frequency"] >= 20.0
    assert res["anomaly_score"] > 0.40


def test_detect_unusual_transaction_time(anomaly_service):
    """Scenario 3: Detect unusual transaction time (dead nocturnal hours 03:00 AM)."""
    daytime = anomaly_service.predict_anomaly_transaction(
        amount=25000.0,
        timestamp=datetime(2026, 1, 15, 14, 0, tzinfo=timezone.utc), # 2:00 PM
        sender_history={"prior_amounts": [25000.0]}
    )

    nocturnal = anomaly_service.predict_anomaly_transaction(
        amount=25000.0,
        timestamp=datetime(2026, 1, 15, 3, 15, tzinfo=timezone.utc), # 03:15 AM
        sender_history={"prior_amounts": [25000.0]}
    )

    assert nocturnal["features"]["is_nocturnal"] == 1.0
    assert nocturnal["anomaly_score"] > daytime["anomaly_score"]


def test_detect_new_device_behavior(anomaly_service):
    """Scenario 4: Detect new unrecognized device behavior."""
    known_dev = anomaly_service.predict_anomaly_transaction(
        amount=8000.0,
        timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
        sender_history={"primary_device_id": "phone-1", "last_device_id": "phone-1"},
        tx_device_id="phone-1"
    )

    new_dev = anomaly_service.predict_anomaly_transaction(
        amount=8000.0,
        timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc),
        sender_history={"primary_device_id": "phone-1", "last_device_id": "phone-1"},
        tx_device_id="unseen-burner-device-88"
    )

    assert new_dev["features"]["new_device"] == 1.0
    assert new_dev["features"]["device_change"] == 1.0
    assert new_dev["anomaly_score"] > known_dev["anomaly_score"]


def test_detect_new_location_behavior(anomaly_service):
    """Scenario 5: Detect new location behavior (displacement to high-risk or novel zone)."""
    home_loc = anomaly_service.predict_anomaly_transaction(
        amount=10000.0,
        timestamp=datetime(2026, 1, 15, 13, 0, tzinfo=timezone.utc),
        sender_history={"registered_location_id": "loc-home"},
        tx_location_id="loc-home"
    )

    remote_loc = anomaly_service.predict_anomaly_transaction(
        amount=10000.0,
        timestamp=datetime(2026, 1, 15, 13, 0, tzinfo=timezone.utc),
        sender_history={"registered_location_id": "loc-home"},
        tx_location_id="loc-border-zone-55"
    )

    assert remote_loc["features"]["new_location"] == 1.0
    assert remote_loc["anomaly_score"] > home_loc["anomaly_score"]


def test_detect_recipient_behavior_change(anomaly_service):
    """Scenario 6: Detect recipient behavior change (novel unseen counterparty with high outflow)."""
    known_rec = anomaly_service.predict_anomaly_transaction(
        amount=500.0,
        timestamp=datetime(2026, 1, 15, 15, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [500.0, 600.0], "seen_recipients": ["trusted-friend-1"]},
        receiver_profile={"id": "trusted-friend-1"}
    )

    new_rec = anomaly_service.predict_anomaly_transaction(
        amount=22000.0,
        timestamp=datetime(2026, 1, 15, 15, 0, tzinfo=timezone.utc),
        sender_history={"prior_amounts": [500.0, 600.0], "seen_recipients": ["trusted-friend-1"]},
        receiver_profile={"id": "unseen-third-party-wallet-99"}
    )

    assert new_rec["features"]["new_recipient"] == 1.0
    assert new_rec["anomaly_score"] > known_rec["anomaly_score"]


def test_detect_sudden_activity_spike(anomaly_service):
    """Scenario 7: Detect sudden activity spike (high velocity burst within 5 minutes)."""
    now = datetime(2026, 1, 15, 17, 0, tzinfo=timezone.utc)
    burst = [
        {"timestamp": now - timedelta(seconds=i * 20), "amount": 3000.0}
        for i in range(1, 10)
    ]

    res = anomaly_service.predict_anomaly_transaction(
        amount=3000.0,
        timestamp=now,
        sender_history={"prior_amounts": [3000.0]},
        recent_transactions=burst
    )

    assert res["features"]["velocity_5min"] >= 8
    assert res["anomaly_score"] >= 0.50
    assert res["is_anomaly"] == 1


# =============================================================================
# 4. Input Validation & Error Handling
# =============================================================================

def test_anomaly_invalid_negative_amount(anomaly_service):
    """Negative amount must raise ValueError."""
    with pytest.raises(ValueError, match="strictly positive"):
        anomaly_service.predict_anomaly_transaction(
            amount=-200.0,
            timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
        )


def test_anomaly_invalid_zero_amount(anomaly_service):
    """Zero amount must raise ValueError."""
    with pytest.raises(ValueError, match="strictly positive"):
        anomaly_service.predict_anomaly_transaction(
            amount=0.0,
            timestamp=datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
        )


def test_anomaly_invalid_hour(anomaly_service):
    """Invalid hour must raise ValueError."""
    features = {f: 1.0 for f in ANOMALY_FEATURE_NAMES}
    features["transaction_hour"] = 28.0
    with pytest.raises(ValueError, match="between 0 and 23"):
        anomaly_service.predict_anomaly_features(features)


def test_anomaly_missing_feature(anomaly_service):
    """Missing required feature in feature dict must raise ValueError."""
    features = {f: 1.0 for f in ANOMALY_FEATURE_NAMES if f != "is_nocturnal"}
    with pytest.raises(ValueError, match="Missing required behavioral feature"):
        anomaly_service.predict_anomaly_features(features)


def test_anomaly_negative_velocity(anomaly_service):
    """Negative velocity must raise ValueError."""
    features = {f: 1.0 for f in ANOMALY_FEATURE_NAMES}
    features["velocity_5min"] = -3.0
    with pytest.raises(ValueError, match="cannot be negative"):
        anomaly_service.predict_anomaly_features(features)


# =============================================================================
# 5. Strict Separation of Concerns (Anomaly != Fraud Classification)
# =============================================================================

def test_separation_of_anomaly_and_risk_systems(anomaly_service, risk_service):
    """
    CRITICAL INVARIANT: Verify that Anomaly Detection and Fraud Risk Classification
    remain strictly separate systems with different paradigms, models, and contracts.
    """
    # 1. Verify underlying model architectures differ
    import xgboost as xgb
    assert isinstance(anomaly_service.model, IsolationForest), "Anomaly service must use IsolationForest"
    assert isinstance(risk_service.model, xgb.XGBClassifier), "Risk service must use XGBClassifier"

    # 2. Verify Anomaly features do not depend on fraud labels or mule risk
    assert "recipient_risk" not in ANOMALY_FEATURE_NAMES
    assert "is_fraud" not in ANOMALY_FEATURE_NAMES
    assert "pattern_id" not in ANOMALY_FEATURE_NAMES

    # 3. Verify independent execution on a legitimate but atypical transaction
    # Example: A completely legitimate user sending a large amount at an unusual time to a family member.
    # It IS an anomaly (atypical habit), but may NOT be fraud.
    ts = datetime(2026, 1, 15, 3, 30, tzinfo=timezone.utc)
    anom_res = anomaly_service.predict_anomaly_transaction(
        amount=70000.0,
        timestamp=ts,
        sender_history={"prior_amounts": [500.0], "primary_device_id": "d1", "registered_location_id": "l1"},
        receiver_profile={"id": "trusted-family", "risk_tier": "LOW", "is_synthetic_mule": False},
        tx_device_id="d1",
        tx_location_id="l1"
    )

    # Anomaly engine correctly detects statistical behavioral divergence
    assert "anomaly_score" in anom_res
    assert "is_anomaly" in anom_res
    assert anom_res["anomaly_score"] >= 0.50
    assert anom_res["is_anomaly"] == 1

    # Contrast with risk output contract
    risk_res = risk_service.predict_transaction(
        amount=70000.0,
        timestamp=ts,
        sender_history={"prior_amounts": [500.0], "primary_device_id": "d1", "registered_location_id": "l1"},
        receiver_profile={"id": "trusted-family", "risk_tier": "LOW", "is_synthetic_mule": False},
        tx_device_id="d1",
        tx_location_id="l1"
    )
    assert "risk_score" in risk_res
    assert "risk_level" in risk_res
    assert "prediction" in risk_res
