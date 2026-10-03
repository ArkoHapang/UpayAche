"""
UpayAche — Behavioral Anomaly Feature Engineering Pipeline.
Extracts unsupervised behavioral feature vectors for Isolation Forest anomaly detection:
1. amount (unusual transaction amount)
2. amount_deviation (relative historical deviation)
3. transaction_frequency (unusual transaction frequency)
4. transaction_hour (temporal baseline)
5. is_nocturnal (unusual transaction time)
6. new_device (new device behavior)
7. device_change (device switching behavior)
8. new_location (new location behavior)
9. new_recipient (recipient behavior change)
10. velocity_5min (sudden activity spike)
11. velocity_1hour (sustained velocity surge)
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np


ANOMALY_FEATURE_NAMES = [
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


def compute_behavioral_features(
    amount: float,
    timestamp: datetime,
    sender_history: Optional[Dict[str, Any]] = None,
    receiver_profile: Optional[Dict[str, Any]] = None,
    tx_device_id: Optional[str] = "dev-primary",
    tx_location_id: Optional[str] = "loc-primary",
    recent_transactions: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, float]:
    """
    Extract the 11 behavioral features from transaction context for anomaly detection.
    Raises ValueError for invalid inputs (negative/zero amounts, invalid hours, etc.).
    """
    if amount is None or amount <= 0:
        raise ValueError(f"Transaction amount must be strictly positive, got {amount}")

    if not isinstance(timestamp, datetime):
        raise ValueError(f"timestamp must be a datetime instance, got {type(timestamp)}")

    hour = timestamp.hour
    if not (0 <= hour <= 23):
        raise ValueError(f"Invalid transaction hour: {hour}")

    sender_hist = sender_history or {}
    receiver_prof = receiver_profile or {}
    recent_txs = recent_transactions or []

    # 1. Historical Amount Baseline & Deviation
    prior_amounts = sender_hist.get("prior_amounts", [])
    if prior_amounts:
        avg_amt = sum(prior_amounts) / len(prior_amounts)
    else:
        avg_amt = amount
    amt_deviation = abs(amount - avg_amt) / max(1.0, avg_amt)

    # 2. Temporal Behavior
    is_nocturnal = 1.0 if (0 <= hour <= 5 or hour == 23) else 0.0

    # 3. Device Novelty & Switching
    primary_device_id = sender_hist.get("primary_device_id")
    last_device_id = sender_hist.get("last_device_id", primary_device_id)
    is_new_device = 1.0 if (primary_device_id and tx_device_id != primary_device_id) else 0.0
    is_device_change = 1.0 if (last_device_id and tx_device_id != last_device_id) else 0.0

    # 4. Location Novelty
    registered_location_id = sender_hist.get("registered_location_id")
    is_new_location = 1.0 if (registered_location_id and tx_location_id != registered_location_id) else 0.0

    # 5. Recipient Relationship Novelty
    seen_recipients = set(sender_hist.get("seen_recipients", []))
    receiver_id = receiver_prof.get("id", "")
    is_new_recipient = 1.0 if (receiver_id and receiver_id not in seen_recipients) else 0.0
    if not seen_recipients and receiver_id:
        # If recipient list exists but empty, recipient is new
        is_new_recipient = 1.0

    # 6. Activity Velocities
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
        if 0 <= diff_seconds <= 300:
            v_5min += 1
        if 0 <= diff_seconds <= 3600:
            v_1h += 1
        if 0 <= diff_seconds <= 86400:
            v_24h += 1

    tx_frequency_24h = max(1.0, float(v_24h))

    return {
        "amount": float(amount),
        "amount_deviation": float(round(amt_deviation, 4)),
        "transaction_frequency": float(tx_frequency_24h),
        "transaction_hour": float(hour),
        "is_nocturnal": float(is_nocturnal),
        "new_device": float(is_new_device),
        "device_change": float(is_device_change),
        "new_location": float(is_new_location),
        "new_recipient": float(is_new_recipient),
        "velocity_5min": float(v_5min),
        "velocity_1hour": float(v_1h)
    }


def extract_behavioral_features_from_dataframe(
    df_transactions: pd.DataFrame,
    df_wallets: pd.DataFrame
) -> pd.DataFrame:
    """
    Extract behavioral feature vectors from transactions DataFrame for Isolation Forest.
    Calculates actual trailing metrics from timestamped transaction sequences.
    """
    wallet_map = df_wallets.set_index("id").to_dict(orient="index")
    wallet_history_amounts: Dict[str, List[float]] = {}
    wallet_seen_recipients: Dict[str, set] = {}
    wallet_last_device: Dict[str, str] = {}
    wallet_tx_timestamps: Dict[str, List[datetime]] = {}

    rows = []
    df_sorted = df_transactions.sort_values("timestamp").copy()

    for _, row in df_sorted.iterrows():
        sender_id = row["sender_wallet_id"]
        receiver_id = row["receiver_wallet_id"]
        amt = float(row["amount"])
        dt = datetime.fromisoformat(str(row["timestamp"]))
        hour = dt.hour

        s_wallet = wallet_map.get(sender_id, {})
        prior_amts = wallet_history_amounts.setdefault(sender_id, [])
        seen_rec = wallet_seen_recipients.setdefault(sender_id, set())
        last_dev = wallet_last_device.get(sender_id, s_wallet.get("primary_device_id"))

        avg_amt = sum(prior_amts) / len(prior_amts) if prior_amts else amt
        amt_deviation = abs(amt - avg_amt) / max(1.0, avg_amt)

        is_nocturnal = 1.0 if (0 <= hour <= 5 or hour == 23) else 0.0

        primary_dev = s_wallet.get("primary_device_id")
        current_dev = row.get("device_id")
        is_new_device = 1.0 if (primary_dev and current_dev != primary_dev) else 0.0
        is_device_change = 1.0 if (last_dev and current_dev != last_dev) else 0.0

        reg_loc = s_wallet.get("registered_location_id")
        current_loc = row.get("location_id")
        is_new_location = 1.0 if (reg_loc and current_loc != reg_loc) else 0.0

        is_new_rec = 1.0 if receiver_id not in seen_rec else 0.0

        # Trailing window velocities
        sender_tx_times = wallet_tx_timestamps.setdefault(sender_id, [])
        v_5m = sum(1 for t in sender_tx_times if 0 <= (dt - t).total_seconds() <= 300)
        v_1h = sum(1 for t in sender_tx_times if 0 <= (dt - t).total_seconds() <= 3600)
        v_24h = sum(1 for t in sender_tx_times if 0 <= (dt - t).total_seconds() <= 86400)

        rows.append({
            "transaction_id": row["id"],
            "amount": amt,
            "amount_deviation": float(round(amt_deviation, 4)),
            "transaction_frequency": float(max(1, v_24h)),
            "transaction_hour": float(hour),
            "is_nocturnal": float(is_nocturnal),
            "new_device": float(is_new_device),
            "device_change": float(is_device_change),
            "new_location": float(is_new_location),
            "new_recipient": float(is_new_rec),
            "velocity_5min": float(v_5m),
            "velocity_1hour": float(v_1h),
            "is_anomaly": int(row.get("is_anomaly", 0)),
            "pattern_id": int(row.get("pattern_id", 1))
        })

        # Update historical state
        prior_amts.append(amt)
        seen_rec.add(receiver_id)
        wallet_last_device[sender_id] = current_dev
        sender_tx_times.append(dt)

    return pd.DataFrame(rows)
