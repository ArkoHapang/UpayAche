"""
UpayAche — Synthetic Wallet Relationships & Graph Edge Generator.
Computes directed connections between wallets, cumulative flows,
and flags topological cycles (layering loops) and smurfing fan-in structures.
"""

from typing import List, Dict, Any
from collections import defaultdict


def generate_wallet_relationships(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Derive directed multigraph relationships directly from synthetic transactions."""
    edge_map = defaultdict(lambda: {
        "tx_count": 0,
        "total_volume": 0.0,
        "first_tx": None,
        "last_tx": None,
        "connection_type": "DIRECT_TRANSFER",
        "is_part_of_cycle": False,
        "risk_weight": 0.0
    })

    # Aggregate pairwise directed interactions
    for tx in transactions:
        src = tx["sender_wallet_id"]
        dst = tx["receiver_wallet_id"]
        if src == dst:
            continue
        key = (src, dst)
        data = edge_map[key]
        data["tx_count"] += 1
        data["total_volume"] = round(data["total_volume"] + float(tx["amount"]), 2)
        ts = tx["timestamp"]
        if data["first_tx"] is None or ts < data["first_tx"]:
            data["first_tx"] = ts
        if data["last_tx"] is None or ts > data["last_tx"]:
            data["last_tx"] = ts

        # Inherit pattern specific connection attributes
        pattern_id = tx.get("pattern_id")
        if pattern_id in (9, 12): # Fan-in smurfing / scam syndicate
            data["connection_type"] = "FAN_IN_MULE"
            data["risk_weight"] = max(data["risk_weight"], 0.85)
        elif pattern_id == 10: # Suspicious chain / circular loop
            data["connection_type"] = "CIRCULAR_LOOP"
            data["is_part_of_cycle"] = True
            data["risk_weight"] = max(data["risk_weight"], 0.78)
        elif tx.get("is_fraud"):
            data["risk_weight"] = max(data["risk_weight"], 0.70)
        else:
            data["risk_weight"] = max(data["risk_weight"], 0.05)

    relationships = []
    idx = 1
    for (src, dst), data in edge_map.items():
        rel_id = f"c2000000-0000-0000-0000-{idx:012d}"
        relationships.append({
            "id": rel_id,
            "source_wallet_id": src,
            "target_wallet_id": dst,
            "connection_type": data["connection_type"],
            "total_tx_count": data["tx_count"],
            "total_volume": data["total_volume"],
            "first_interaction_at": data["first_tx"],
            "last_interaction_at": data["last_tx"],
            "is_part_of_cycle": data["is_part_of_cycle"],
            "risk_weight": round(data["risk_weight"], 2)
        })
        idx += 1

    return relationships
