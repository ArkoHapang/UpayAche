"""
UpayAche — Risk Intelligence Business Service.
Provides aggregate risk metrics, high-risk feeds, trend analytics, and SHAP details.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from collections import defaultdict
from fastapi import HTTPException

from app.db.repository import DataRepository, get_repository
from app.schemas.risk import (
    RiskSummaryResponse,
    HighRiskTransactionItem,
    HighRiskTransactionsResponse,
    RiskTrendsPoint,
    RiskTrendsResponse,
    RiskDetailResponse
)
from ml.explainability import RiskExplainabilityService, get_risk_explainability_service
from ml.anomaly_service import BehavioralAnomalyService, get_behavioral_anomaly_service
from ml.prediction import RiskPredictionService, get_risk_prediction_service
from ml.features import compute_features_from_context


class RiskAnalyticsService:
    def __init__(
        self,
        repository: Optional[DataRepository] = None,
        explain_service: Optional[RiskExplainabilityService] = None,
        anomaly_service: Optional[BehavioralAnomalyService] = None,
        risk_service: Optional[RiskPredictionService] = None
    ):
        self.repo = repository or get_repository()
        self.explain_service = explain_service or get_risk_explainability_service()
        self.anomaly_service = anomaly_service or get_behavioral_anomaly_service()
        self.risk_service = risk_service or get_risk_prediction_service()

    def get_risk_summary(self) -> RiskSummaryResponse:
        txs, total = self.repo.list_transactions(limit=10000)
        
        low = 0
        med = 0
        high = 0
        crit = 0
        fraud_count = 0
        risk_sum = 0.0

        for t in txs:
            is_fraud = t.get("is_fraud", 0)
            is_anom = t.get("is_anomaly", 0)
            
            # Continuous risk estimation based on ground truth / amount
            if is_fraud == 1:
                score = 0.95
                crit += 1
                fraud_count += 1
            elif is_anom == 1:
                score = 0.75
                high += 1
            elif t.get("amount", 0.0) > 10000:
                score = 0.45
                med += 1
            else:
                score = 0.08
                low += 1

            risk_sum += score

        avg_risk = round(risk_sum / max(1, total), 4)
        fraud_rate = round((fraud_count / max(1, total)) * 100, 2)

        return RiskSummaryResponse(
            total_analyzed=total,
            low_risk_count=low,
            medium_risk_count=med,
            high_risk_count=high,
            critical_risk_count=crit,
            total_fraud_flagged=fraud_count,
            average_risk_score=avg_risk,
            fraud_rate_pct=fraud_rate
        )

    def get_high_risk_transactions(self, limit: int = 50) -> HighRiskTransactionsResponse:
        # Fetch transactions flagged as fraud or anomaly or large amount
        txs, _ = self.repo.list_transactions(limit=1000)
        flagged = [
            t for t in txs
            if t.get("is_fraud") == 1 or t.get("is_anomaly") == 1 or t.get("amount", 0.0) >= 20000.0
        ]

        items: List[HighRiskTransactionItem] = []
        for t in flagged[:limit]:
            is_fraud = int(t.get("is_fraud", 0))
            is_anom = int(t.get("is_anomaly", 0))
            
            if is_fraud == 1:
                score = 0.96
                level = "CRITICAL"
            elif is_anom == 1:
                score = 0.78
                level = "HIGH"
            else:
                score = 0.68
                level = "HIGH"

            items.append(HighRiskTransactionItem(
                id=str(t.get("id")),
                tx_hash=t.get("tx_hash"),
                amount=float(t.get("amount", 0.0)),
                tx_type=str(t.get("tx_type", "P2P")),
                timestamp=str(t.get("timestamp")),
                risk_score=score,
                risk_level=level,
                is_fraud=is_fraud,
                pattern_name=t.get("pattern_name", "High Risk Transfer")
            ))

        return HighRiskTransactionsResponse(
            items=items,
            total=len(items)
        )

    def get_risk_trends(self, timeframe: str = "7d") -> RiskTrendsResponse:
        if timeframe not in ("24h", "7d", "30d", "all"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid timeframe '{timeframe}'. Valid options: '24h', '7d', '30d', 'all'."
            )
        txs, _ = self.repo.list_transactions(limit=5000)
        daily_bins = defaultdict(lambda: {"count": 0, "high_risk": 0, "risk_sum": 0.0, "amount_sum": 0.0})

        for t in txs:
            ts_str = str(t.get("timestamp", ""))
            period = ts_str[:10] if len(ts_str) >= 10 else "2026-01-15"
            amount = float(t.get("amount", 0.0))
            is_flagged = t.get("is_fraud") == 1 or t.get("is_anomaly") == 1
            score = 0.92 if t.get("is_fraud") == 1 else (0.75 if t.get("is_anomaly") == 1 else 0.12)

            daily_bins[period]["count"] += 1
            if is_flagged:
                daily_bins[period]["high_risk"] += 1
            daily_bins[period]["risk_sum"] += score
            daily_bins[period]["amount_sum"] += amount

        points: List[RiskTrendsPoint] = []
        for period in sorted(daily_bins.keys()):
            b = daily_bins[period]
            points.append(RiskTrendsPoint(
                period=period,
                transaction_count=b["count"],
                high_risk_count=b["high_risk"],
                average_risk=round(b["risk_sum"] / max(1, b["count"]), 4),
                total_amount_bdt=round(b["amount_sum"], 2)
            ))

        return RiskTrendsResponse(timeframe=timeframe, points=points)

    def get_transaction_risk(self, transaction_id: str) -> RiskDetailResponse:
        t = self.repo.get_transaction(transaction_id)
        if not t:
            raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found.")

        amount = float(t.get("amount", 0.0))
        try:
            tx_time = datetime.fromisoformat(str(t.get("timestamp")).replace("Z", "+00:00"))
        except Exception:
            tx_time = datetime.now(timezone.utc)

        sender_wallet = self.repo.get_wallet(str(t.get("sender_wallet_id"))) or {}
        sender_hist = {
            "prior_amounts": [500.0, 750.0],
            "primary_device_id": sender_wallet.get("primary_device_id", "dev-primary"),
            "primary_location_id": sender_wallet.get("registered_location_id", "loc-primary")
        }

        features = compute_features_from_context(
            amount=amount,
            timestamp=tx_time,
            sender_history=sender_hist,
            receiver_profile={"risk_score": 0.05},
            tx_device_id=t.get("device_id") or "dev-primary",
            tx_location_id=t.get("location_id") or "loc-primary"
        )

        explain_res = self.explain_service.explain_features(features, top_k=5)

        anomaly_features = {
            "amount": amount,
            "amount_deviation": features["amount_deviation"],
            "transaction_frequency": features["transaction_frequency"],
            "transaction_hour": features["transaction_hour"],
            "is_nocturnal": 1.0 if (tx_time.hour >= 23 or tx_time.hour < 5) else 0.0,
            "new_device": features["new_device"],
            "device_change": features["device_change"],
            "new_location": features["location_change"],
            "new_recipient": features["new_recipient"],
            "velocity_5min": features["velocity_5min"],
            "velocity_1hour": features["velocity_1hour"]
        }
        anomaly_res = self.anomaly_service.predict_anomaly_features(anomaly_features)

        top_contributions = [
            {
                "feature": c.feature,
                "feature_value": c.feature_value,
                "contribution": c.contribution,
                "direction": c.direction,
                "human_readable_explanation": c.human_readable_explanation
            }
            for c in explain_res.top_contributing_features
        ]

        return RiskDetailResponse(
            transaction_id=str(t.get("id")),
            risk_score=explain_res.risk_score,
            risk_level=explain_res.risk_level,
            prediction=explain_res.prediction,
            anomaly_score=anomaly_res["anomaly_score"],
            is_anomaly=anomaly_res["is_anomaly"],
            base_value=explain_res.base_value,
            top_contributing_features=top_contributions,
            summary_narrative=explain_res.summary_narrative,
            model_version=explain_res.model_version,
            timestamp=explain_res.timestamp
        )


_risk_analytics_service: Optional[RiskAnalyticsService] = None

def get_risk_analytics_service() -> RiskAnalyticsService:
    global _risk_analytics_service
    if _risk_analytics_service is None:
        _risk_analytics_service = RiskAnalyticsService()
    return _risk_analytics_service
