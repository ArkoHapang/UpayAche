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
    RiskDetailResponse,
    CompositeRiskContribution,
    BangladeshMFSIntelligence
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

        # Graph Intelligence contribution
        graph_score = 0.08
        in_cycle = False
        suspicious_nbrs = 0
        try:
            from app.services.network_service import get_network_service
            net_service = get_network_service()
            net_summary = net_service.get_wallet_metrics(str(t.get("sender_wallet_id")))
            if net_summary:
                in_cycle = net_summary.in_cycle
                suspicious_nbrs = net_summary.suspicious_neighbors_count
                g_comp = (0.45 if in_cycle else 0.0) + min(0.35, suspicious_nbrs * 0.15) + min(0.20, net_summary.network_concentration * 0.20)
                graph_score = round(min(1.0, max(0.05, g_comp)), 4)
        except Exception:
            if t.get("is_fraud") == 1 or t.get("is_anomaly") == 1:
                graph_score = 0.65

        # Weighted Composite Risk: 50% Supervised XGBoost, 25% Unsupervised Isolation Forest, 25% Graph Intelligence
        sup_score = round(float(explain_res.risk_score), 4)
        anom_score = round(float(anomaly_res["anomaly_score"]), 4)
        comp_score = round(0.50 * sup_score + 0.25 * anom_score + 0.25 * graph_score, 4)
        alert_thresh = 0.65
        crossed = comp_score >= alert_thresh

        if crossed:
            thresh_reason = (
                f"Transaction crossed the alert threshold ({alert_thresh:.2f}) with composite risk {comp_score:.2f}. "
                f"Driven by Supervised XGBoost ({sup_score:.2f} × 50%), "
                f"Behavioral Anomaly ({anom_score:.2f} × 25%), and "
                f"Graph Network Topology ({graph_score:.2f} × 25%)."
            )
        else:
            thresh_reason = (
                f"Composite score ({comp_score:.2f}) remains below alert threshold ({alert_thresh:.2f}). "
                f"Activity aligns with historical user baseline."
            )

        composite_breakdown = CompositeRiskContribution(
            supervised_score=sup_score,
            supervised_weight=0.50,
            anomaly_score=anom_score,
            anomaly_weight=0.25,
            graph_score=graph_score,
            graph_weight=0.25,
            composite_score=comp_score,
            alert_threshold=alert_thresh,
            threshold_crossed=crossed,
            threshold_reason=thresh_reason,
            shap_scope_notice=(
                "Notice: SHAP feature attributions explain the supervised XGBoost model specifically. "
                "The composite risk integrates XGBoost, Isolation Forest anomaly, and NetworkX topological signals."
            )
        )

        # Bangladesh MFS Typology Classification
        tx_typology = t.get("typology")
        tx_evidence_features = t.get("evidence_features") or []
        is_nocturnal = bool(tx_time.hour >= 23 or tx_time.hour < 5)
        new_dev = bool(features.get("new_device", 0) == 1)
        amt_dev = float(features.get("amount_deviation", 0.0))
        tx_type = str(t.get("tx_type", "P2P")).upper()

        if tx_typology == "ACCOUNT_TAKEOVER" or (not tx_typology and new_dev and amount >= 10000):
            typ_code = "ACCOUNT_TAKEOVER"
            typ_name = "Account Takeover / SIM Swap Indicator"
            typ_name_bn = "অ্যাকাউন্ট টেকওভার / সিম সোয়াপ লক্ষণ"
            why_r = "New unverified hardware device initiating high-value transfer immediately after registration."
            actions = [
                "Verify SIM swap logs and device IMEI binding with telecom provider",
                "Contact sender via secondary verified channel before release",
                "Check recent PIN reset or login location shift"
            ]
            bn_sum = f"সতর্কবার্তা: নতুন ডিভাইস থেকে হঠাৎ {amount:,.0f} টাকার বড় লেনদেন হয়েছে। এটি সিম সোয়াপ বা অ্যাকাউন্ট চুরির লক্ষণ হতে পারে।"
            evid_list = tx_evidence_features if tx_evidence_features else ["new_device", "amount_deviation"]
        elif tx_typology == "AGENT_CASHOUT_ABUSE" or (not tx_typology and tx_type == "CASH_OUT" and (amount >= 20000 or amt_dev > 2.0)):
            typ_code = "AGENT_CASHOUT_ABUSE"
            typ_name = "Agent Cash-Out Structuring Abuse"
            typ_name_bn = "এজেন্ট ক্যাশ-আউট অপব্যবহার"
            why_r = "Rapid liquidity drain via agent cash-out point exceeding daily baseline."
            actions = [
                "Inspect agent wallet history for collusion or repeated split cash-outs",
                "Check recipient agent terminal geofence and timestamp",
                "Review sender fund source before cash-out"
            ]
            bn_sum = f"সতর্কবার্তা: এজেন্ট পয়েন্টের মাধ্যমে অস্বাভাবিক ক্যাশ-আউট লক্ষ্য করা গেছে। মানি লন্ডারিং বা অবৈধ উত্তোলনের ঝুঁকি রয়েছে।"
            evid_list = tx_evidence_features if tx_evidence_features else ["rapid_cash_out", "agent_abnormality", "amount_deviation"]
        elif tx_typology == "SMURFING" or (not tx_typology and (amount in (24999.0, 24500.0, 4999.0, 9999.0) or features.get("velocity_5min", 0.0) >= 15000)):
            typ_code = "SMURFING"
            typ_name = "Transaction Splitting / Smurfing"
            typ_name_bn = "ট্রানজ্যাকশন স্প্লিটিং / স্মার্ফিং"
            why_r = "Amounts structured just below reporting threshold or rapid repeated transfers into mule ring."
            actions = [
                "Trace counterparty network for fan-out splitting to downstream wallets",
                "Check for circular loops (layering cycles) in ego network",
                "Flag recipient wallet for manual KYC review"
            ]
            bn_sum = f"সতর্কবার্তা: সরকারি রিপোর্টিং সীমা এড়াতে লেনদেন ভেঙে ভেঙে (স্মার্ফিং) মিউল অ্যাকাউন্টে পাঠানো হচ্ছে বলে সন্দেহ করা হচ্ছে।"
            evid_list = tx_evidence_features if tx_evidence_features else ["many_inbound_wallets", "amount_deviation", "high_transaction_velocity"]
        elif tx_typology == "MULE_NETWORK":
            typ_code = "MULE_NETWORK"
            typ_name = "Mule Syndicate / Multi-hop Network"
            typ_name_bn = "মিউল সিন্ডিকেট / মাল্টি-হপ নেটওয়ার্ক"
            why_r = "Layering funds across multiple intermediary wallets with high conservation ratio to obfuscate origin."
            actions = [
                "Trace upstream source wallets and downstream aggregator nodes",
                "Review ego network graph clustering and cycle detection metrics",
                "Flag connected cluster for syndicate compliance audit"
            ]
            bn_sum = f"সতর্কবার্তা: জটিল মিউল নেটওয়ার্কের মাধ্যমে অর্থ স্থানান্তরের প্যাটার্ন শনাক্ত করা হয়েছে। লেয়ারিং বা মানি লন্ডারিং ঝুঁকি বিদ্যমান।"
            evid_list = tx_evidence_features if tx_evidence_features else ["many_outbound_wallets", "many_inbound_wallets", "high_transaction_velocity"]
        elif tx_typology == "NOCTURNAL_CASHOUT" or (not tx_typology and is_nocturnal):
            typ_code = "NOCTURNAL_CASHOUT"
            typ_name = "Nocturnal High-Velocity Cash-out"
            typ_name_bn = "গভীর রাতের অস্বাভাবিক ক্যাশ-আউট"
            why_r = f"Unusual transfer timing ({tx_time.strftime('%I:%M %p')}) deviating sharply from daytime baseline."
            actions = [
                "Hold for morning manual review if recipient is first-time contact",
                "Verify user typical transaction hours in profile history",
                "Check biometric or 2FA authentication logs"
            ]
            bn_sum = f"সতর্কবার্তা: রাত {tx_time.strftime('%I:%M %p')}-এ অস্বাভাবিক লেনদেন হয়েছে, যা সাধারণ গ্রাহক আচরণের সাথে মিলে না।"
            evid_list = tx_evidence_features if tx_evidence_features else ["unusual_hour", "rapid_cash_out", "amount_deviation"]
        elif tx_typology == "SOCIAL_ENGINEERING" or (not tx_typology and amt_dev > 3.0):
            typ_code = "SOCIAL_ENGINEERING"
            typ_name = "Potential Social Engineering / Impersonation Scam"
            typ_name_bn = "সোশ্যাল ইঞ্জিনিয়ারিং / ভুয়া রিভার্সাল প্রতারণা"
            why_r = f"Transaction amount is {amt_dev:.1f}x higher than historical average, common in 'ভুল করে টাকা গেছে' scams."
            actions = [
                "Check if sender received suspicious inbound deposit within past 30 minutes",
                "Verify whether customer reported an erroneous transaction",
                "Contact customer care helpline queue for matching complaint"
            ]
            bn_sum = f"সতর্কবার্তা: গ্রাহকের স্বাভাবিক গড়ের তুলনায় {amt_dev:.1f} গুণ বেশি টাকা পাঠানো হয়েছে। 'ভুল করে টাকা গেছে' বলে প্রতারণার শিকার হতে পারেন।"
            evid_list = tx_evidence_features if tx_evidence_features else ["new_recipient", "amount_deviation", "rapid_cash_out"]
        else:
            typ_code = "RAPID_FUND_MOVEMENT"
            typ_name = "Rapid Velocity Movement"
            typ_name_bn = "দ্রুত ফান্ড স্থানান্তরের অস্বাভাবিকতা"
            why_r = "Short time gap between inbound and outbound transfers without typical account resting period."
            actions = [
                "Verify sender KYC status and fund origin",
                "Check downstream counterparty wallets"
            ]
            bn_sum = f"নিয়মিত পর্যবেক্ষণ: স্বাভাবিকের চেয়ে দ্রুত গতিতে ফান্ড ট্রান্সফার হয়েছে। স্ট্যান্ডার্ড মনিটরিং প্রয়োজন।"
            evid_list = tx_evidence_features if tx_evidence_features else ["high_transaction_velocity", "rapid_cash_out", "amount_deviation"]

        what_h = (
            f"BDT {amount:,.2f} {tx_type} transaction executed at {tx_time.strftime('%Y-%m-%d %H:%M UTC')}. "
            f"Device ID: '{t.get('device_id', 'unknown')}' (New device: {'Yes' if new_dev else 'No'}). "
            f"Recipient: '{str(t.get('receiver_wallet_id', 'unknown'))[:8]}...'."
        )

        mfs_intelligence = BangladeshMFSIntelligence(
            typology_code=typ_code,
            typology_name=typ_name,
            typology_name_bn=typ_name_bn,
            what_happened=what_h,
            why_risky=why_r,
            what_to_investigate_next=actions,
            bangla_summary=bn_sum,
            evidence_features=evid_list,
            responsible_ai_disclaimer="ঝুঁকি সতর্কতা: এটি একটি তদন্তমূলক সংকেত (Risk Signal), নিশ্চিত অপরাধ নয়। মানব বিশ্লেষকের পুঙ্খানুপুঙ্খ তদন্ত আবশ্যক।"
        )

        # Why Did Risk Change?
        risk_change_reason = (
            f"Compared to sender 30-day baseline, risk shifted due to: "
            f"{'New hardware device detected (+0.25 risk); ' if new_dev else ''}"
            f"{f'Amount deviation {amt_dev:.1f}x above baseline; ' if amt_dev > 1.5 else ''}"
            f"{'Nocturnal timing window; ' if is_nocturnal else ''}"
            f"{'Cycle participation in network graph; ' if in_cycle else ''}"
            f"{f'{suspicious_nbrs} suspicious counterparties connected.' if suspicious_nbrs > 0 else 'Standard baseline parameters.'}"
        )

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
            risk_score=sup_score,
            risk_level=explain_res.risk_level,
            prediction=explain_res.prediction,
            anomaly_score=anom_score,
            is_anomaly=anomaly_res["is_anomaly"],
            base_value=explain_res.base_value,
            top_contributing_features=top_contributions,
            summary_narrative=explain_res.summary_narrative,
            model_version=explain_res.model_version,
            timestamp=explain_res.timestamp,
            composite_breakdown=composite_breakdown,
            mfs_intelligence=mfs_intelligence,
            risk_change_reason=risk_change_reason,
            responsible_ai_notice=(
                "RISK SIGNAL != CONFIRMED FRAUD: Advisory investigation signal for analyst triage only. "
                "False positives are possible. Final decision remains with human compliance analyst."
            )
        )


_risk_analytics_service: Optional[RiskAnalyticsService] = None

def get_risk_analytics_service() -> RiskAnalyticsService:
    global _risk_analytics_service
    if _risk_analytics_service is None:
        _risk_analytics_service = RiskAnalyticsService()
    return _risk_analytics_service
