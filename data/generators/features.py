"""
UpayAche — Synthetic 24-Dimensional Feature Extractor.
Extracts normalized numerical features directly aligned with docs/ML.md:
- 7 Temporal & Amount features
- 10 Behavioral Velocity features
- 7 Network Graph Topology features
"""

import math
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Any


TX_TYPE_MAP = {
    "P2P": 0,
    "CASH_IN": 1,
    "CASH_OUT": 2,
    "PAYMENT": 3,
    "RECHARGE": 4
}


def extract_features_for_transactions(
    transactions: List[Dict[str, Any]],
    wallets: List[Dict[str, Any]],
    relationships: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Compute 24-dimensional feature vector for every synthetic transaction."""
    # Build wallet baseline stats
    wallet_history_amounts = defaultdict(list)
    wallet_last_tx_time = {}
    wallet_balance_tracker = {w["id"]: float(w["balance"]) for w in wallets}

    # Build graph degree lookups from relationships
    in_degree_map = defaultdict(int)
    out_degree_map = defaultdict(int)
    cycle_nodes = set()

    for rel in relationships:
        src = rel["source_wallet_id"]
        dst = rel["target_wallet_id"]
        out_degree_map[src] += 1
        in_degree_map[dst] += 1
        if rel.get("is_part_of_cycle"):
            cycle_nodes.add(src)
            cycle_nodes.add(dst)

    features_list = []

    for idx, tx in enumerate(transactions, start=1):
        dt = datetime.fromisoformat(tx["timestamp"])
        amt = float(tx["amount"])
        fee = float(tx["fee"])
        sender_id = tx["sender_wallet_id"]
        receiver_id = tx["receiver_wallet_id"]
        t_type = tx["tx_type"]

        # 1. Temporal & Amount (7 features)
        log_amt = round(math.log1p(amt), 4)
        fee_ratio = round(fee / max(1.0, amt), 4)
        hour = dt.hour
        is_night = 1 if (hour >= 23 or hour <= 5) else 0
        is_weekend = 1 if dt.weekday() in (4, 5) else 0 # Friday=4, Saturday=5 in BD
        tx_type_code = TX_TYPE_MAP.get(t_type, 0)

        # 2. Velocity & Behavioral (10 features)
        hist = wallet_history_amounts[sender_id]
        hist_avg = sum(hist) / len(hist) if hist else amt
        amt_to_avg = round(amt / max(1.0, hist_avg), 3)

        # Time since last tx
        last_t = wallet_last_tx_time.get(sender_id)
        if last_t:
            seconds_since = (dt - last_t).total_seconds()
        else:
            seconds_since = 86400.0 # 24h default for first tx

        # Trailing 1h and 24h velocity estimations based on pattern
        pattern_id = tx.get("pattern_id", 1)
        if pattern_id == 3: # Velocity storm
            tx_count_1h = 12
            tx_count_24h = 18
            sum_amount_1h = round(amt * 8, 2)
            sum_amount_24h = round(amt * 12, 2)
            p2p_inflows_1h = 0
            cashout_velocity_ratio = 0.15
        elif pattern_id == 9: # Smurfing fan-in
            tx_count_1h = 8
            tx_count_24h = 14
            sum_amount_1h = round(amt * 5, 2)
            sum_amount_24h = round(amt * 7, 2)
            p2p_inflows_1h = 6
            cashout_velocity_ratio = 0.0
        elif pattern_id == 8 or (t_type == "CASH_OUT" and pattern_id in (6, 12)): # Drain/Scam
            tx_count_1h = 4
            tx_count_24h = 6
            sum_amount_1h = round(amt * 1.5, 2)
            sum_amount_24h = round(amt * 1.8, 2)
            p2p_inflows_1h = 1
            cashout_velocity_ratio = 0.96
        else:
            tx_count_1h = 1
            tx_count_24h = 3
            sum_amount_1h = amt
            sum_amount_24h = round(amt * 2.1, 2)
            p2p_inflows_1h = 0
            cashout_velocity_ratio = 0.02

        # Balance depletion ratio
        cur_bal = wallet_balance_tracker.get(sender_id, amt * 2)
        bal_depletion = round(min(1.0, amt / max(1.0, cur_bal)), 3)

        # Structuring proximity to regulatory thresholds (25,000 / 50,000 BDT)
        dist_25k = abs(amt - 25000.0) / 25000.0
        dist_50k = abs(amt - 50000.0) / 50000.0
        structuring_prox = round(min(dist_25k, dist_50k), 4)

        # 3. Network Graph Features (7 features)
        in_deg = in_degree_map.get(sender_id, 1)
        out_deg = out_degree_map.get(sender_id, 1)
        deg_ratio = round((in_deg + 1) / (out_deg + 1), 3)

        # PageRank / clustering heuristic
        if pattern_id in (9, 12): # Aggregator mule hub
            pagerank = 0.048
            clustering = 0.012
        elif pattern_id == 10: # Circular loop
            pagerank = 0.025
            clustering = 0.650
        else:
            pagerank = 0.008
            clustering = 0.045

        in_cycle_3 = 1 if (sender_id in cycle_nodes and pattern_id == 10) else 0
        shortest_path_to_flagged = 1 if tx.get("is_fraud") else (2 if pattern_id != 1 else 99)

        # Record updates
        wallet_history_amounts[sender_id].append(amt)
        wallet_last_tx_time[sender_id] = dt

        feat_id = f"e2000000-0000-0000-0000-{idx:012d}"
        raw_feat_dict = {
            "amount": amt,
            "log_amount": log_amt,
            "fee_ratio": fee_ratio,
            "hour_of_day": hour,
            "is_night": is_night,
            "is_weekend": is_weekend,
            "tx_type_code": tx_type_code,
            "tx_count_1h": tx_count_1h,
            "tx_count_24h": tx_count_24h,
            "sum_amount_1h": sum_amount_1h,
            "sum_amount_24h": sum_amount_24h,
            "amount_to_hist_avg": amt_to_avg,
            "cashout_velocity_ratio": cashout_velocity_ratio,
            "p2p_inflow_count_1h": p2p_inflows_1h,
            "time_since_last_tx": seconds_since,
            "balance_depletion_ratio": bal_depletion,
            "structuring_proximity": structuring_prox,
            "in_degree": in_deg,
            "out_degree": out_deg,
            "degree_ratio": deg_ratio,
            "pagerank": pagerank,
            "ego_clustering_coef": clustering,
            "in_cycle_3": in_cycle_3,
            "shortest_path_to_flagged": shortest_path_to_flagged
        }

        features_list.append({
            "id": feat_id,
            "transaction_id": tx["id"],
            "velocity_1h_count": tx_count_1h,
            "velocity_1h_amount": sum_amount_1h,
            "velocity_24h_count": tx_count_24h,
            "velocity_24h_amount": sum_amount_24h,
            "is_nocturnal": bool(is_night),
            "amount_to_avg_ratio": amt_to_avg,
            "rapid_cashout_ratio": cashout_velocity_ratio,
            "sender_in_degree": in_deg,
            "sender_out_degree": out_deg,
            "receiver_in_degree": in_degree_map.get(receiver_id, 1),
            "receiver_out_degree": out_degree_map.get(receiver_id, 1),
            "is_dormant_reactivation": bool(pattern_id == 8),
            "raw_features": raw_feat_dict
        })

    return features_list
