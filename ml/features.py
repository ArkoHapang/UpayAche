"""
UpayAche — Feature Engineering Pipeline for ML Risk Engine.
Defines the canonical 13-feature contract required for XGBoost risk scoring:
1. amount
2. transaction_hour
3. transaction_frequency
4. average_transaction_amount
5. amount_deviation
6. new_recipient
7. new_device
8. location_change
9. device_change
10. recipient_risk
11. velocity_5min
12. velocity_1hour
13. velocity_24hour
"""

import math
from datetime import datetime
from typing import Dict, Any, List
import pandas as pd
import numpy as np


FEATURE_NAMES = [
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

RECIPIENT_RISK_MAP = {
    "LOW": 0.05,
    "MEDIUM": 0.35,
    "HIGH": 0.75,
    "CRITICAL": 0.95
}


def compute_features_from_context(
    amount: float,
    timestamp: datetime,
    sender_history: Dict[str, Any],
    receiver_profile: Dict[str, Any],
    tx_device_id: str,
    tx_location_id: str,
    recent_transactions: List[Dict[str, Any]] = None
) -> Dict[str, float]:
    """
    Compute the 13 feature vector from raw transaction context.
    Validates input parameters and raises ValueError for invalid inputs.
    """
    if amount is None or amount <= 0:
        raise ValueError(f"Transaction amount must be strictly positive, got {amount}")

    if not isinstance(timestamp, datetime):
        raise ValueError(f"timestamp must be a datetime instance, got {type(timestamp)}")

    hour = timestamp.hour
    if not (0 <= hour <= 23):
        raise ValueError(f"Invalid transaction hour: {hour}")

    recent_txs = recent_transactions or []

    # 1. Historical Baselines
    prior_amounts = sender_history.get("prior_amounts", [])
    if prior_amounts:
        avg_amt = sum(prior_amounts) / len(prior_amounts)
    else:
        avg_amt = amount
    amt_deviation = abs(amount - avg_amt) / max(1.0, avg_amt)

    # 2. Relationship context
    seen_recipients = set(sender_history.get("seen_recipients", []))
    receiver_id = receiver_profile.get("id", "")
    is_new_recipient = 1 if (receiver_id not in seen_recipients) else 0

    # 3. Device & Location context
    primary_device_id = sender_history.get("primary_device_id")
    last_device_id = sender_history.get("last_device_id", primary_device_id)
    registered_location_id = sender_history.get("registered_location_id")

    is_new_device = 1 if (primary_device_id and tx_device_id != primary_device_id) else 0
    is_device_change = 1 if (last_device_id and tx_device_id != last_device_id) else 0
    is_location_change = 1 if (registered_location_id and tx_location_id != registered_location_id) else 0

    # 4. Recipient risk
    receiver_tier = receiver_profile.get("risk_tier", "LOW")
    recipient_risk = RECIPIENT_RISK_MAP.get(str(receiver_tier).upper(), 0.05)
    if receiver_profile.get("is_synthetic_mule"):
        recipient_risk = max(recipient_risk, 0.85)

    # 5. Velocities (trailing 5min, 1hour, 24hour)
    v_5min = 0
    v_1h = 0
    v_24h = 0

    for tx in recent_txs:
        t_ts = tx.get("timestamp")
        if isinstance(t_ts, str):
            t_dt = datetime.fromisoformat(t_ts)
        elif isinstance(t_ts, datetime):
            t_dt = t_ts
        else:
            continue

        diff_seconds = (timestamp - t_dt).total_seconds()
        if 0 <= diff_seconds <= 300: # 5 minutes
            v_5min += 1
        if 0 <= diff_seconds <= 3600: # 1 hour
            v_1h += 1
        if 0 <= diff_seconds <= 86400: # 24 hours
            v_24h += 1

    tx_freq_24h = max(1, v_24h)

    return {
        "amount": float(amount),
        "transaction_hour": float(hour),
        "transaction_frequency": float(tx_freq_24h),
        "average_transaction_amount": float(avg_amt),
        "amount_deviation": float(amt_deviation),
        "new_recipient": float(is_new_recipient),
        "new_device": float(is_new_device),
        "location_change": float(is_location_change),
        "device_change": float(is_device_change),
        "recipient_risk": float(recipient_risk),
        "velocity_5min": float(v_5min),
        "velocity_1hour": float(v_1h),
        "velocity_24hour": float(v_24h)
    }


def extract_features_from_dataframe(
    df_transactions: pd.DataFrame,
    df_wallets: pd.DataFrame
) -> pd.DataFrame:
    """
    Extract the 13 canonical features for an entire transactions dataframe.
    """
    wallet_map = df_wallets.set_index("id").to_dict(orient="index")
    wallet_history_amounts = {}
    wallet_seen_recipients = {}
    wallet_last_device = {}
    wallet_tx_timestamps = {}

    rows = []

    # Sort chronologically
    df_sorted = df_transactions.sort_values("timestamp").copy()

    for _, row in df_sorted.iterrows():
        sender_id = row["sender_wallet_id"]
        receiver_id = row["receiver_wallet_id"]
        amt = float(row["amount"])
        dt = datetime.fromisoformat(str(row["timestamp"]))

        s_wallet = wallet_map.get(sender_id, {})
        r_wallet = wallet_map.get(receiver_id, {})

        prior_amts = wallet_history_amounts.setdefault(sender_id, [])
        seen_rec = wallet_seen_recipients.setdefault(sender_id, set())
        last_dev = wallet_last_device.get(sender_id, s_wallet.get("primary_device_id"))

        avg_amt = sum(prior_amts) / len(prior_amts) if prior_amts else amt
        amt_deviation = abs(amt - avg_amt) / max(1.0, avg_amt)

        is_new_rec = 1 if receiver_id not in seen_rec else 0
        primary_dev = s_wallet.get("primary_device_id")
        current_dev = row.get("device_id")
        is_new_device = 1 if (primary_dev and current_dev != primary_dev) else 0
        is_device_change = 1 if (last_dev and current_dev != last_dev) else 0

        reg_loc = s_wallet.get("registered_location_id")
        current_loc = row.get("location_id")
        is_loc_change = 1 if (reg_loc and current_loc != reg_loc) else 0

        rec_risk = RECIPIENT_RISK_MAP.get(str(r_wallet.get("risk_tier", "LOW")).upper(), 0.05)
        if r_wallet.get("is_synthetic_mule"):
            rec_risk = max(rec_risk, 0.85)

        pattern_id = int(row.get("pattern_id", 1))

        # Compute realistic trailing velocities for sender wallet
        sender_tx_times = wallet_tx_timestamps.setdefault(sender_id, [])
        v_5m = sum(1 for t in sender_tx_times if 0 <= (dt - t).total_seconds() <= 300)
        v_1h = sum(1 for t in sender_tx_times if 0 <= (dt - t).total_seconds() <= 3600)
        v_24h = sum(1 for t in sender_tx_times if 0 <= (dt - t).total_seconds() <= 86400)

        feat_row = {
            "transaction_id": row["id"],
            "amount": amt,
            "transaction_hour": float(dt.hour),
            "transaction_frequency": float(max(1, v_24h)),
            "average_transaction_amount": float(round(avg_amt, 2)),
            "amount_deviation": float(round(amt_deviation, 4)),
            "new_recipient": float(is_new_rec),
            "new_device": float(is_new_device),
            "location_change": float(is_loc_change),
            "device_change": float(is_device_change),
            "recipient_risk": float(round(rec_risk, 2)),
            "velocity_5min": float(v_5m),
            "velocity_1hour": float(v_1h),
            "velocity_24hour": float(v_24h),
            "is_fraud": int(row.get("is_fraud", 0)),
            "pattern_id": pattern_id
        }
        rows.append(feat_row)

        # Update history
        prior_amts.append(amt)
        seen_rec.add(receiver_id)
        wallet_last_device[sender_id] = current_dev
        sender_tx_times.append(dt)

    return pd.DataFrame(rows)
