"""
UpayAche — Phase 17 Analytics & Models Endpoint Test Suite.
Validates:
1. GET /api/v1/analytics/system:
   - Status 200 OK
   - 5 Required Platform Metrics: transactions_analyzed, alerts_generated,
     investigations_created, investigations_closed, average_investigation_time_minutes
   - Metric segregation & prototype disclaimer notice
2. GET /api/v1/analytics/models:
   - Status 200 OK
   - Validated Model Performance items (XGBoost, Isolation Forest)
   - 6 Core Metrics: precision, recall, f1_score, roc_auc, false_positive_rate, false_negative_rate
   - Confusion Matrix (true_positives, false_positives, true_negatives, false_negatives)
   - Risk Distribution & Anomaly Distribution
   - Prototype disclaimer notice
3. Authentication & RBAC protection (401 Unauthorized without bearer token).
"""

import sys
import pytest
from pathlib import Path
from starlette.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from app.services.analytics_service import AnalyticsService, get_analytics_service


@pytest.fixture(scope="module")
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(scope="module")
def analyst_headers():
    return {"Authorization": "Bearer test-analyst-token"}


@pytest.fixture(scope="module")
def viewer_headers():
    return {"Authorization": "Bearer test-viewer-token"}


def test_analytics_endpoints_require_auth(client):
    """Endpoints must reject unauthenticated requests with 401 Unauthorized."""
    res_sys = client.get("/api/v1/analytics/system")
    assert res_sys.status_code == 401

    res_mod = client.get("/api/v1/analytics/models")
    assert res_mod.status_code == 401


def test_get_system_analytics_contract(client, analyst_headers):
    """
    Validates that system analytics endpoint returns authentic platform numbers
    and satisfies all Phase 17 contract fields.
    """
    res = client.get("/api/v1/analytics/system", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()

    # Verify 5 primary required system metrics
    assert "transactions_analyzed" in data
    assert "alerts_generated" in data
    assert "investigations_created" in data
    assert "investigations_closed" in data
    assert "average_investigation_time_minutes" in data

    assert isinstance(data["transactions_analyzed"], int)
    assert data["transactions_analyzed"] >= 0

    assert isinstance(data["alerts_generated"], int)
    assert data["alerts_generated"] >= 0

    assert isinstance(data["investigations_created"], int)
    assert data["investigations_created"] >= 0

    assert isinstance(data["investigations_closed"], int)
    assert data["investigations_closed"] >= 0

    assert isinstance(data["average_investigation_time_minutes"], (int, float))
    assert data["average_investigation_time_minutes"] > 0

    # Verify mandatory prototype notice
    assert "evaluation_notice" in data
    assert "Synthetic hackathon prototype" in data["evaluation_notice"]


def test_get_models_analytics_contract(client, analyst_headers):
    """
    Validates that models analytics endpoint returns evaluated model benchmarks,
    confusion matrices, and live distributions.
    """
    res = client.get("/api/v1/analytics/models", headers=analyst_headers)
    assert res.status_code == 200
    data = res.json()

    # Validate top-level response structure
    assert "models" in data
    assert "risk_distribution" in data
    assert "anomaly_distribution" in data
    assert "active_version" in data
    assert "evaluation_notice" in data

    assert len(data["models"]) >= 2, "Expected at least XGBoost and Isolation Forest models"

    # Validate individual model performance items
    for model in data["models"]:
        assert "model_name" in model
        assert "model_version" in model
        assert "algorithm" in model
        assert "model_type" in model
        assert "train_samples" in model
        assert "val_samples" in model

        # 6 Core ML metrics
        assert 0.0 <= model["precision"] <= 1.0
        assert 0.0 <= model["recall"] <= 1.0
        assert 0.0 <= model["f1_score"] <= 1.0
        assert 0.0 <= model["roc_auc"] <= 1.0
        assert 0.0 <= model["false_positive_rate"] <= 1.0
        assert 0.0 <= model["false_negative_rate"] <= 1.0

        # Confusion Matrix
        cm = model["confusion_matrix"]
        assert "true_positives" in cm
        assert "false_positives" in cm
        assert "true_negatives" in cm
        assert "false_negatives" in cm
        assert cm["true_positives"] >= 0
        assert cm["false_positives"] >= 0
        assert cm["true_negatives"] >= 0
        assert cm["false_negatives"] >= 0

    # Validate Risk Distribution
    risk_dist = data["risk_distribution"]
    assert len(risk_dist) == 4, "Expected LOW, MEDIUM, HIGH, CRITICAL tiers"
    tiers = [r["tier"] for r in risk_dist]
    assert "LOW" in tiers
    assert "MEDIUM" in tiers
    assert "HIGH" in tiers
    assert "CRITICAL" in tiers

    # Validate Anomaly Distribution
    anomaly_dist = data["anomaly_distribution"]
    assert len(anomaly_dist) >= 2
    for item in anomaly_dist:
        assert "category" in item
        assert "count" in item
        assert "percentage" in item
        assert "mean_score" in item

    # Verify notice
    assert "Synthetic hackathon prototype" in data["evaluation_notice"]


def test_analytics_service_direct_unit():
    """Direct unit test of AnalyticsService computation logic."""
    service = get_analytics_service()
    sys_metrics = service.get_system_analytics()
    model_metrics = service.get_models_analytics()

    assert sys_metrics.transactions_analyzed > 0
    assert len(model_metrics.models) >= 2
    assert model_metrics.active_version == "v1.0.0"
