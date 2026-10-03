"""
UpayAche — Transactions Business Service.
Coordinates transaction queries, multi-engine ML scoring, and auto-case creation.
"""

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from fastapi import HTTPException

from app.db.repository import DataRepository, get_repository
from app.schemas.transactions import (
    TransactionResponse,
    TransactionListResponse,
    AnalyzeTransactionRequest,
    AnalyzeTransactionResponse
)
from ml.features import compute_features_from_context
from ml.prediction import RiskPredictionService, get_risk_prediction_service
from ml.anomaly_service import BehavioralAnomalyService, get_behavioral_anomaly_service
from ml.explainability import RiskExplainabilityService, get_risk_explainability_service


class TransactionService:
    def __init__(
        self,
        repository: Optional[DataRepository] = None,
        risk_service: Optional[RiskPredictionService] = None,
        anomaly_service: Optional[BehavioralAnomalyService] = None,
        explain_service: Optional[RiskExplainabilityService] = None
    ):
        self.repo = repository or get_repository()
        self.risk_service = risk_service or get_risk_prediction_service()
        self.anomaly_service = anomaly_service or get_behavioral_anomaly_service()
        self.explain_service = explain_service or get_risk_explainability_service()

    def _enrich_transaction(self, t: Dict[str, Any]) -> TransactionResponse:
        sender_w = self.repo.get_wallet(str(t.get("sender_wallet_id")))
        receiver_w = self.repo.get_wallet(str(t.get("receiver_wallet_id")))
        sender_phone = sender_w.get("phone_number_masked") if sender_w else None
        receiver_phone = receiver_w.get("phone_number_masked") if receiver_w else None

        is_f = int(t.get("is_fraud", 0))
        is_a = int(t.get("is_anomaly", 0))
        amt = float(t.get("amount", 0.0))

        if is_f == 1:
            r_score = 0.96
            r_level = "CRITICAL"
        elif is_a == 1:
            r_score = 0.78
            r_level = "HIGH"
        elif amt >= 20000.0:
            r_score = 0.58
            r_level = "MEDIUM"
        else:
            r_score = 0.08
            r_level = "LOW"

        return TransactionResponse(
            id=str(t.get("id")),
            tx_hash=t.get("tx_hash"),
            sender_wallet_id=str(t.get("sender_wallet_id")),
            receiver_wallet_id=str(t.get("receiver_wallet_id")),
            sender_phone_masked=sender_phone,
            receiver_phone_masked=receiver_phone,
            tx_type=str(t.get("tx_type", "P2P")),
            amount=amt,
            fee=float(t.get("fee", 0.0)),
            status=str(t.get("status", "COMPLETED")),
            device_id=t.get("device_id"),
            location_id=t.get("location_id"),
            timestamp=str(t.get("timestamp")),
            pattern_id=t.get("pattern_id"),
            pattern_code=t.get("pattern_code"),
            pattern_name=t.get("pattern_name"),
            is_fraud=is_f,
            is_anomaly=is_a,
            risk_score=r_score,
            risk_level=r_level
        )

    def list_transactions(
        self,
        limit: int = 50,
        offset: int = 0,
        wallet_id: Optional[str] = None,
        tx_type: Optional[str] = None,
        is_fraud: Optional[int] = None,
        is_anomaly: Optional[int] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        sort_by: str = "timestamp",
        sort_desc: bool = True
    ) -> TransactionListResponse:
        if min_amount is not None and max_amount is not None and min_amount > max_amount:
            raise HTTPException(
                status_code=400,
                detail="Invalid amount filter: min_amount cannot be greater than max_amount."
            )

        items_raw, total = self.repo.list_transactions(
            limit=limit,
            offset=offset,
            wallet_id=wallet_id,
            tx_type=tx_type,
            is_fraud=is_fraud,
            is_anomaly=is_anomaly,
            min_amount=min_amount,
            max_amount=max_amount,
            search=search,
            risk_level=risk_level,
            start_date=start_date,
            end_date=end_date,
            sort_by=sort_by,
            sort_desc=sort_desc
        )

        items = [self._enrich_transaction(t) for t in items_raw]

        return TransactionListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset
        )

    def get_transaction(self, tx_id: str) -> TransactionResponse:
        t = self.repo.get_transaction(tx_id)
        if not t:
            raise HTTPException(status_code=404, detail=f"Transaction '{tx_id}' not found.")

        return self._enrich_transaction(t)

    def analyze_transaction(self, req: AnalyzeTransactionRequest) -> AnalyzeTransactionResponse:
        # 1. Parse or default timestamp
        if req.timestamp:
            try:
                tx_time = datetime.fromisoformat(req.timestamp.replace("Z", "+00:00"))
            except Exception:
                tx_time = datetime.now(timezone.utc)
        else:
            tx_time = datetime.now(timezone.utc)

        # 2. Gather sender history from repository
        prior_txs, _ = self.repo.list_transactions(limit=10, wallet_id=req.sender_wallet_id)
        prior_amounts = [float(p.get("amount", 500.0)) for p in prior_txs] or [req.amount]
        sender_wallet = self.repo.get_wallet(req.sender_wallet_id) or {}
        receiver_wallet = self.repo.get_wallet(req.receiver_wallet_id) or {}

        sender_hist = {
            "prior_amounts": prior_amounts,
            "primary_device_id": sender_wallet.get("primary_device_id", "dev-primary"),
            "primary_location_id": sender_wallet.get("registered_location_id", "loc-primary")
        }
        receiver_profile = {
            "risk_score": 0.50 if receiver_wallet.get("risk_tier") == "HIGH" else 0.05
        }

        # 3. Calculate 13-feature vector
        features = compute_features_from_context(
            amount=req.amount,
            timestamp=tx_time,
            sender_history=sender_hist,
            receiver_profile=receiver_profile,
            tx_device_id=req.device_id or "dev-primary",
            tx_location_id=req.location_id or "loc-primary",
            recent_transactions=prior_txs
        )

        # 4. Supervised XGBoost Risk Classification
        risk_result = self.risk_service.predict_features(features)

        # 5. Behavioral Anomaly Detection (Isolation Forest)
        anomaly_features = {
            "amount": req.amount,
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
        anomaly_result = self.anomaly_service.predict_anomaly_features(anomaly_features)

        # 6. SHAP Explainability Engine
        shap_explanation = self.explain_service.explain_features(features, top_k=5)

        # 7. Persist newly analyzed transaction into repository
        tx_id = str(uuid.uuid4())
        tx_hash = f"tx_live_{tx_id[:8]}"
        is_fraud = int(risk_result["prediction"])
        is_anomaly = int(anomaly_result["is_anomaly"])

        saved_tx = {
            "id": tx_id,
            "tx_hash": tx_hash,
            "sender_wallet_id": req.sender_wallet_id,
            "receiver_wallet_id": req.receiver_wallet_id,
            "tx_type": req.tx_type,
            "amount": req.amount,
            "fee": 0.0,
            "status": "COMPLETED",
            "device_id": req.device_id,
            "location_id": req.location_id,
            "timestamp": tx_time.isoformat(),
            "pattern_code": "LIVE_ANALYSIS",
            "pattern_name": "Live Assessed Transaction",
            "is_fraud": is_fraud,
            "is_anomaly": is_anomaly
        }
        self.repo.save_transaction(saved_tx)

        # 8. Auto-create case if critical risk
        if risk_result["risk_level"] == "CRITICAL" or is_fraud == 1:
            self.repo.create_case(
                title=f"CRITICAL Fraud Alert: {req.tx_type} BDT {req.amount:,.2f}",
                description=(
                    f"Real-time XGBoost risk score {risk_result['risk_score']:.4f}. "
                    f"Summary: {shap_explanation.summary_narrative}"
                ),
                target_wallet_id=req.sender_wallet_id,
                priority="CRITICAL",
                primary_transaction_id=tx_id,
                creator_id="system-realtime-engine"
            )

        from app.services.audit_service import get_audit_service
        get_audit_service().log_event(
            actor_id="engine",
            actor_role="SYSTEM",
            action="TRANSACTION_ANALYZED",
            resource_type="transaction",
            resource_id=tx_id,
            metadata={
                "amount": req.amount,
                "risk_score": risk_result["risk_score"],
                "risk_level": risk_result["risk_level"],
                "is_fraud": is_fraud
            }
        )


        top_factors = [
            {
                "feature": f.feature,
                "contribution": f.contribution,
                "direction": f.direction,
                "human_readable_explanation": f.human_readable_explanation
            }
            for f in shap_explanation.top_contributing_features
        ]

        return AnalyzeTransactionResponse(
            transaction_id=tx_id,
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            is_fraud=is_fraud,
            anomaly_score=anomaly_result["anomaly_score"],
            is_anomaly=is_anomaly,
            top_factors=top_factors,
            summary=shap_explanation.summary_narrative
        )


_tx_service: Optional[TransactionService] = None

def get_transaction_service() -> TransactionService:
    global _tx_service
    if _tx_service is None:
        _tx_service = TransactionService()
    return _tx_service
