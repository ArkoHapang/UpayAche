"""
UpayAche — Synthetic Transaction Generator.
Synthesizes realistic MFS transaction activity including:
- Normal daytime consumer flows (P2P, Merchant, Utility, Cash-In, Recharge)
- The 11 Controlled Suspicious and Fraud Patterns:
  2. Unusually large transaction
  3. High transaction velocity
  4. New device (rooted burner)
  5. New recipient
  6. Unusual transaction time (nocturnal dead hours)
  7. Unusual location (high-risk border zone)
  8. Sudden behavioral change (dormant account balance drain)
  9. Multiple wallets connected to one (smurfing fan-in)
  10. Suspicious transaction chains / circular layering loops
  11. Repeated transfers (identical amount bursts)
  12. Synthetic scam-like pattern (victim -> mule -> aggregator -> agent cash-out)
"""

import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from data.generators.patterns import PATTERNS


def generate_transactions(
    wallets: List[Dict[str, Any]],
    devices: List[Dict[str, Any]],
    locations: List[Dict[str, Any]],
    merchants: List[Dict[str, Any]],
    total_count: int = 3000,
    fraud_rate: float = 0.15,
    base_time: datetime = None,
    seed: int = 42
) -> List[Dict[str, Any]]:
    """Generate labeled synthetic transactions with controlled patterns."""
    rng = random.Random(seed)
    if base_time is None:
        base_time = datetime(2026, 1, 15, 8, 0, 0, tzinfo=timezone.utc)

    # Separate wallets by role
    personal_wallets = [w for w in wallets if w["wallet_type"] == "PERSONAL" and not w.get("is_synthetic_mule")]
    agent_wallets = [w for w in wallets if w["wallet_type"] == "AGENT"]
    merchant_wallets = [w for w in wallets if w["wallet_type"] == "MERCHANT"]
    mule_feeders = [w for w in wallets if w.get("mule_cluster_role") == "FEEDER_SMURF"]
    mule_aggregators = [w for w in wallets if w.get("mule_cluster_role") == "AGGREGATOR_CASHOUT"]

    # Separate devices
    clean_devices = [d for d in devices if not d["is_rooted_or_jailbroken"]]
    rooted_devices = [d for d in devices if d["is_rooted_or_jailbroken"]]

    # Separate locations
    normal_locations = [l for l in locations if not l["is_high_risk_zone"]]
    border_locations = [l for l in locations if l["is_high_risk_zone"]]

    transactions = []
    current_time = base_time
    tx_index = 1

    # Estimate pattern counts
    target_fraud_txs = int(total_count * fraud_rate)
    target_normal_txs = total_count - target_fraud_txs

    # =========================================================================
    # 1. NORMAL TRANSACTIONS (PATTERN 1)
    # =========================================================================
    for _ in range(target_normal_txs):
        # Step forward 1 to 20 minutes (business hours bias)
        minute_delta = rng.randint(1, 20)
        current_time += timedelta(minutes=minute_delta)

        # Force hour to daytime/evening (08:00 to 22:00)
        hour = rng.choice([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])
        tx_time = current_time.replace(hour=hour, minute=rng.randint(0, 59), second=rng.randint(0, 59))

        tx_flow = rng.choices(["P2P", "MERCHANT_PAYMENT", "CASH_IN", "CASH_OUT", "RECHARGE"], weights=[40, 25, 15, 15, 5])[0]

        if tx_flow == "P2P":
            sender = rng.choice(personal_wallets)
            receiver = rng.choice([w for w in personal_wallets if w["id"] != sender["id"]])
            amount = round(rng.uniform(200.0, 4500.0), 2)
            fee = 5.00 if amount > 500 else 0.00
            tx_type = "P2P"
            device_id = sender["primary_device_id"]
            location_id = sender["registered_location_id"]
        elif tx_flow == "MERCHANT_PAYMENT":
            sender = rng.choice(personal_wallets)
            receiver = rng.choice(merchant_wallets)
            amount = round(rng.uniform(150.0, 3200.0), 2)
            fee = 0.00
            tx_type = "PAYMENT"
            device_id = sender["primary_device_id"]
            location_id = sender["registered_location_id"]
        elif tx_flow == "CASH_IN":
            sender = rng.choice(agent_wallets)
            receiver = rng.choice(personal_wallets)
            amount = round(rng.uniform(1000.0, 10000.0), 2)
            fee = 0.00
            tx_type = "CASH_IN"
            device_id = sender["primary_device_id"]
            location_id = sender["registered_location_id"]
        elif tx_flow == "CASH_OUT":
            sender = rng.choice(personal_wallets)
            receiver = rng.choice(agent_wallets)
            amount = round(rng.uniform(500.0, 8000.0), 2)
            fee = round(amount * 0.0149, 2)
            tx_type = "CASH_OUT"
            device_id = sender["primary_device_id"]
            location_id = receiver["registered_location_id"]
        else: # RECHARGE
            sender = rng.choice(personal_wallets)
            receiver = rng.choice(merchant_wallets)
            amount = round(rng.choice([20.0, 50.0, 100.0, 200.0, 500.0]), 2)
            fee = 0.00
            tx_type = "RECHARGE"
            device_id = sender["primary_device_id"]
            location_id = sender["registered_location_id"]

        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_norm_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": tx_type,
            "amount": amount,
            "fee": fee,
            "status": "COMPLETED",
            "device_id": device_id,
            "location_id": location_id,
            "timestamp": tx_time.isoformat(),
            "pattern_id": 1,
            "pattern_code": PATTERNS[1]["code"],
            "pattern_name": PATTERNS[1]["name"],
            "is_fraud": 0,
            "is_anomaly": 0,
            "scenario_id": "NORMAL_BASELINE"
        })
        tx_index += 1

    # =========================================================================
    # 2. CONTROLLED SUSPICIOUS & FRAUD PATTERNS (PATTERNS 2 to 12)
    # =========================================================================
    patterns_to_generate = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    per_pattern_count = max(5, target_fraud_txs // len(patterns_to_generate))

    # --- Pattern 2: Unusually Large Transaction ---
    for _ in range(per_pattern_count):
        sender = rng.choice(personal_wallets)
        receiver = rng.choice([w for w in personal_wallets if w["id"] != sender["id"]])
        # Near threshold ৳25,000 or ৳50,000
        amount = round(rng.choice([24800.0, 24950.0, 49500.0, 49800.0, 98500.0]), 2)
        current_time += timedelta(minutes=rng.randint(15, 60))
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_lg_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": "P2P",
            "amount": amount,
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": sender["primary_device_id"],
            "location_id": sender["registered_location_id"],
            "timestamp": current_time.isoformat(),
            "pattern_id": 2,
            "pattern_code": PATTERNS[2]["code"],
            "pattern_name": PATTERNS[2]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "LARGE_TRANSACTION_BURST"
        })
        tx_index += 1

    # --- Pattern 3: High Transaction Velocity ---
    burst_sender = rng.choice(personal_wallets)
    burst_time = current_time + timedelta(hours=2)
    for k in range(per_pattern_count):
        receiver = rng.choice([w for w in personal_wallets if w["id"] != burst_sender["id"]])
        burst_time += timedelta(seconds=rng.randint(10, 45)) # rapid automated execution
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_velo_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": burst_sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": "P2P",
            "amount": round(rng.uniform(1500.0, 4500.0), 2),
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": burst_sender["primary_device_id"],
            "location_id": burst_sender["registered_location_id"],
            "timestamp": burst_time.isoformat(),
            "pattern_id": 3,
            "pattern_code": PATTERNS[3]["code"],
            "pattern_name": PATTERNS[3]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": f"VELOCITY_STORM_{burst_sender['wallet_number']}"
        })
        tx_index += 1

    # --- Pattern 4: New Unrecognized Device (Rooted Burner) ---
    for _ in range(per_pattern_count):
        sender = rng.choice(personal_wallets)
        receiver = rng.choice(personal_wallets)
        if receiver["id"] == sender["id"]:
            receiver = personal_wallets[0]
        burner_device = rng.choice(rooted_devices)
        current_time += timedelta(minutes=rng.randint(20, 60))
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_root_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": "P2P",
            "amount": round(rng.uniform(5000.0, 18000.0), 2),
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": burner_device["id"],
            "location_id": sender["registered_location_id"],
            "timestamp": current_time.isoformat(),
            "pattern_id": 4,
            "pattern_code": PATTERNS[4]["code"],
            "pattern_name": PATTERNS[4]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "NEW_ROOTED_DEVICE"
        })
        tx_index += 1

    # --- Pattern 5: New Recipient with Outflow Dispersal ---
    for _ in range(per_pattern_count):
        victim = rng.choice(personal_wallets)
        mule = rng.choice(mule_feeders) if mule_feeders else personal_wallets[1]
        current_time += timedelta(minutes=rng.randint(30, 90))
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_newrec_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": victim["id"],
            "receiver_wallet_id": mule["id"],
            "tx_type": "P2P",
            "amount": round(rng.uniform(12000.0, 24000.0), 2),
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": victim["primary_device_id"],
            "location_id": victim["registered_location_id"],
            "timestamp": current_time.isoformat(),
            "pattern_id": 5,
            "pattern_code": PATTERNS[5]["code"],
            "pattern_name": PATTERNS[5]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "NEW_RECIPIENT_DISPERSAL"
        })
        tx_index += 1

    # --- Pattern 6: Unusual Transaction Time (Nocturnal Dead Hours 01:00-05:00) ---
    for _ in range(per_pattern_count):
        sender = rng.choice(personal_wallets)
        receiver = rng.choice(agent_wallets)
        current_time += timedelta(days=1)
        nocturnal_time = current_time.replace(hour=rng.choice([1, 2, 3, 4]), minute=rng.randint(0, 59))
        amount = round(rng.uniform(15000.0, 35000.0), 2)
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_noct_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": "CASH_OUT",
            "amount": amount,
            "fee": round(amount * 0.0149, 2),
            "status": "FLAGGED",
            "device_id": sender["primary_device_id"],
            "location_id": sender["registered_location_id"],
            "timestamp": nocturnal_time.isoformat(),
            "pattern_id": 6,
            "pattern_code": PATTERNS[6]["code"],
            "pattern_name": PATTERNS[6]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "NOCTURNAL_DEAD_HOURS_DRAIN"
        })
        tx_index += 1

    # --- Pattern 7: Unusual Location (Border / Smuggling Zone) ---
    for _ in range(per_pattern_count):
        sender = rng.choice(personal_wallets)
        receiver = rng.choice(personal_wallets)
        if receiver["id"] == sender["id"]:
            receiver = personal_wallets[2]
        border_loc = rng.choice(border_locations)
        current_time += timedelta(hours=3)
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_geo_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": "P2P",
            "amount": round(rng.uniform(18000.0, 24500.0), 2),
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": sender["primary_device_id"],
            "location_id": border_loc["id"],
            "timestamp": current_time.isoformat(),
            "pattern_id": 7,
            "pattern_code": PATTERNS[7]["code"],
            "pattern_name": PATTERNS[7]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "HIGH_RISK_BORDER_JUMP"
        })
        tx_index += 1

    # --- Pattern 8: Sudden Behavioral Change (Dormant Account 100% Liquidation) ---
    for _ in range(per_pattern_count):
        sender = rng.choice(personal_wallets)
        receiver = rng.choice(agent_wallets)
        current_time += timedelta(days=2)
        amount = round(rng.uniform(22000.0, 48000.0), 2)
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_drain_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": sender["id"],
            "receiver_wallet_id": receiver["id"],
            "tx_type": "CASH_OUT",
            "amount": amount,
            "fee": round(amount * 0.0149, 2),
            "status": "FLAGGED",
            "device_id": sender["primary_device_id"],
            "location_id": receiver["registered_location_id"],
            "timestamp": current_time.isoformat(),
            "pattern_id": 8,
            "pattern_code": PATTERNS[8]["code"],
            "pattern_name": PATTERNS[8]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "DORMANT_COMPLETE_DRAIN"
        })
        tx_index += 1

    # --- Pattern 9: Multiple Wallets Connected to One (Smurfing Fan-In) ---
    aggregator = mule_aggregators[0] if mule_aggregators else personal_wallets[0]
    smurf_time = current_time + timedelta(hours=4)
    feeders = mule_feeders if len(mule_feeders) >= per_pattern_count else personal_wallets[:per_pattern_count]
    for feeder in feeders[:per_pattern_count]:
        smurf_time += timedelta(minutes=rng.randint(2, 6))
        # Structuring amounts just below 25,000 threshold
        amount = round(rng.uniform(24100.0, 24900.0), 2)
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_smurf_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": feeder["id"],
            "receiver_wallet_id": aggregator["id"],
            "tx_type": "P2P",
            "amount": amount,
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": feeder["primary_device_id"],
            "location_id": feeder["registered_location_id"],
            "timestamp": smurf_time.isoformat(),
            "pattern_id": 9,
            "pattern_code": PATTERNS[9]["code"],
            "pattern_name": PATTERNS[9]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": f"SMURFING_RING_{aggregator['wallet_number']}"
        })
        tx_index += 1

    # --- Pattern 10: Suspicious Transaction Chains & Circular Loops ---
    chain_w1 = personal_wallets[3]
    chain_w2 = personal_wallets[4]
    chain_w3 = personal_wallets[5]
    chain_time = current_time + timedelta(days=1)
    
    chain_hops = [
        (chain_w1, chain_w2, 19500.0),
        (chain_w2, chain_w3, 19400.0),
        (chain_w3, chain_w1, 19300.0), # Completes circular loop
    ]
    for _ in range(max(1, per_pattern_count // 3)):
        for s_node, r_node, hop_amt in chain_hops:
            chain_time += timedelta(minutes=rng.randint(8, 15))
            tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
            transactions.append({
                "id": tx_id,
                "tx_hash": f"tx_chain_{tx_index:06d}_{rng.getrandbits(24):06x}",
                "sender_wallet_id": s_node["id"],
                "receiver_wallet_id": r_node["id"],
                "tx_type": "P2P",
                "amount": hop_amt,
                "fee": 5.00,
                "status": "FLAGGED",
                "device_id": s_node["primary_device_id"],
                "location_id": s_node["registered_location_id"],
                "timestamp": chain_time.isoformat(),
                "pattern_id": 10,
                "pattern_code": PATTERNS[10]["code"],
                "pattern_name": PATTERNS[10]["name"],
                "is_fraud": 1,
                "is_anomaly": 1,
                "scenario_id": "TRIANGULAR_CIRCULAR_LOOP"
            })
            tx_index += 1

    # --- Pattern 11: Repeated Identical Transfers ---
    rep_sender = personal_wallets[6]
    rep_receiver = personal_wallets[7]
    rep_time = current_time + timedelta(hours=6)
    fixed_amount = 4999.00
    for _ in range(per_pattern_count):
        rep_time += timedelta(minutes=rng.randint(1, 3))
        tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
        transactions.append({
            "id": tx_id,
            "tx_hash": f"tx_rep_{tx_index:06d}_{rng.getrandbits(24):06x}",
            "sender_wallet_id": rep_sender["id"],
            "receiver_wallet_id": rep_receiver["id"],
            "tx_type": "P2P",
            "amount": fixed_amount,
            "fee": 5.00,
            "status": "FLAGGED",
            "device_id": rep_sender["primary_device_id"],
            "location_id": rep_sender["registered_location_id"],
            "timestamp": rep_time.isoformat(),
            "pattern_id": 11,
            "pattern_code": PATTERNS[11]["code"],
            "pattern_name": PATTERNS[11]["name"],
            "is_fraud": 1,
            "is_anomaly": 1,
            "scenario_id": "REPEATED_IDENTICAL_TRANSFERS"
        })
        tx_index += 1

    # --- Pattern 12: Synthetic Scam-Like Pattern (Lottery/Impersonation Scam) ---
    victim = personal_wallets[8]
    intermediate_mule = mule_feeders[0] if mule_feeders else personal_wallets[9]
    cashout_mule = mule_aggregators[0] if mule_aggregators else personal_wallets[10]
    cashout_agent = agent_wallets[0]
    scam_time = current_time + timedelta(days=2)

    scam_stages = [
        # Stage 1: Victim tricked into sending money
        (victim, intermediate_mule, "P2P", 35000.0, 5.00, "STAGE_1_VICTIM_TRANSFER"),
        # Stage 2: Mule transfers to secondary layer
        (intermediate_mule, cashout_mule, "P2P", 34500.0, 5.00, "STAGE_2_MULE_LAYERING"),
        # Stage 3: Immediate cashout at agent POS
        (cashout_mule, cashout_agent, "CASH_OUT", 34000.0, round(34000 * 0.0149, 2), "STAGE_3_AGENT_CASHOUT")
    ]
    for _ in range(max(1, per_pattern_count // 3)):
        for s_w, r_w, t_type, s_amt, s_fee, stage in scam_stages:
            scam_time += timedelta(minutes=rng.randint(5, 12))
            tx_id = f"e1000000-0000-0000-0000-{tx_index:012d}"
            transactions.append({
                "id": tx_id,
                "tx_hash": f"tx_scam_{tx_index:06d}_{rng.getrandbits(24):06x}",
                "sender_wallet_id": s_w["id"],
                "receiver_wallet_id": r_w["id"],
                "tx_type": t_type,
                "amount": s_amt,
                "fee": s_fee,
                "status": "FLAGGED",
                "device_id": s_w["primary_device_id"],
                "location_id": s_w["registered_location_id"],
                "timestamp": scam_time.isoformat(),
                "pattern_id": 12,
                "pattern_code": PATTERNS[12]["code"],
                "pattern_name": PATTERNS[12]["name"],
                "is_fraud": 1,
                "is_anomaly": 1,
                "scenario_id": f"SCAM_SYNDICATE_{stage}"
            })
            tx_index += 1

    # Sort all transactions chronologically by timestamp
    transactions.sort(key=lambda t: t["timestamp"])

    # Re-index cleanly so ID ordering is monotonically aligned
    for i, t in enumerate(transactions, start=1):
        t["id"] = f"e1000000-0000-0000-0000-{i:012d}"

    return transactions
