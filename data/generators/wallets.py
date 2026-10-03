"""
UpayAche — Synthetic Wallet Generator.
Generates synthetic MFS wallets across Personal, Agent, Merchant, and Mule tiers.
Strictly zero customer PII: phone numbers are masked (017****1234).
"""

import random
from typing import List, Dict, Any

MFS_PREFIXES = ["017", "018", "019", "016", "015", "013"]


def generate_wallets(
    count: int = 200,
    devices: List[Dict[str, Any]] = None,
    locations: List[Dict[str, Any]] = None,
    seed: int = 42
) -> List[Dict[str, Any]]:
    """Generate deterministic synthetic MFS wallets with masked MSISDNs."""
    rng = random.Random(seed)
    wallets = []

    dev_ids = [d["id"] for d in devices] if devices else [f"d1000000-0000-0000-0000-{i:012d}" for i in range(1, 20)]
    loc_ids = [l["id"] for l in locations] if locations else [f"b1000000-0000-0000-0000-{i:012d}" for i in range(1, 10)]

    # Proportions:
    # 70% Personal normal, 18% Agent, 6% Merchant, 6% Syndicate Mule
    num_agents = int(count * 0.18)
    num_merchants = int(count * 0.06)
    num_mules = max(8, int(count * 0.06))
    num_personal = count - num_agents - num_merchants - num_mules

    idx = 1

    # 1. Personal Wallets
    for i in range(1, num_personal + 1):
        w_id = f"c1000000-0000-0000-0000-{idx:012d}"
        prefix = rng.choice(MFS_PREFIXES)
        masked_phone = f"{prefix}****{rng.randint(1000, 9999)}"
        balance = round(rng.uniform(250.0, 35000.0), 2)
        dev = rng.choice(dev_ids[:30]) # clean devices
        loc = rng.choice(loc_ids)

        wallets.append({
            "id": w_id,
            "wallet_number": f"W-PERS-{i:04d}",
            "phone_number_masked": masked_phone,
            "wallet_type": "PERSONAL",
            "risk_tier": "LOW" if balance < 25000 else "MEDIUM",
            "balance": balance,
            "currency": "BDT",
            "status": "ACTIVE",
            "kyc_status": "VERIFIED",
            "primary_device_id": dev,
            "registered_location_id": loc,
            "is_synthetic_mule": False,
            "mule_cluster_role": "NONE"
        })
        idx += 1

    # 2. Agent Wallets
    for i in range(1, num_agents + 1):
        w_id = f"c1000000-0000-0000-0000-{idx:012d}"
        prefix = rng.choice(MFS_PREFIXES)
        masked_phone = f"{prefix}****{rng.randint(1000, 9999)}"
        balance = round(rng.uniform(150000.0, 650000.0), 2)
        dev = rng.choice(dev_ids[8:11]) if len(dev_ids) >= 11 else rng.choice(dev_ids) # POS terminals
        loc = rng.choice(loc_ids)

        wallets.append({
            "id": w_id,
            "wallet_number": f"W-AGNT-{i:04d}",
            "phone_number_masked": masked_phone,
            "wallet_type": "AGENT",
            "risk_tier": "LOW",
            "balance": balance,
            "currency": "BDT",
            "status": "ACTIVE",
            "kyc_status": "VERIFIED",
            "primary_device_id": dev,
            "registered_location_id": loc,
            "is_synthetic_mule": False,
            "mule_cluster_role": "NONE"
        })
        idx += 1

    # 3. Merchant Wallets
    for i in range(1, num_merchants + 1):
        w_id = f"c1000000-0000-0000-0000-{idx:012d}"
        prefix = rng.choice(MFS_PREFIXES)
        masked_phone = f"{prefix}****{rng.randint(1000, 9999)}"
        balance = round(rng.uniform(300000.0, 1500000.0), 2)
        dev = rng.choice(dev_ids[11:14]) if len(dev_ids) >= 14 else rng.choice(dev_ids) # Web portals
        loc = loc_ids[0] # Dhaka commercial

        wallets.append({
            "id": w_id,
            "wallet_number": f"W-MRCH-{i:04d}",
            "phone_number_masked": masked_phone,
            "wallet_type": "MERCHANT",
            "risk_tier": "LOW",
            "balance": balance,
            "currency": "BDT",
            "status": "ACTIVE",
            "kyc_status": "VERIFIED",
            "primary_device_id": dev,
            "registered_location_id": loc,
            "is_synthetic_mule": False,
            "mule_cluster_role": "NONE"
        })
        idx += 1

    # 4. Syndicate Mule Accounts (Smurfing feeders & Aggregators)
    for i in range(1, num_mules + 1):
        w_id = f"c1000000-0000-0000-0000-{idx:012d}"
        prefix = rng.choice(MFS_PREFIXES)
        masked_phone = f"{prefix}****{rng.randint(1000, 9999)}"
        is_aggregator = (i == num_mules or i == num_mules - 1)
        role = "AGGREGATOR_CASHOUT" if is_aggregator else "FEEDER_SMURF"
        balance = round(rng.uniform(50.0, 1200.0), 2)
        dev = rng.choice(dev_ids[-4:]) if len(dev_ids) >= 4 else rng.choice(dev_ids) # Rooted / burner
        loc = loc_ids[9] if len(loc_ids) > 9 else rng.choice(loc_ids) # Teknaf border high risk

        wallets.append({
            "id": w_id,
            "wallet_number": f"W-MULE-{i:04d}",
            "phone_number_masked": masked_phone,
            "wallet_type": "PERSONAL",
            "risk_tier": "CRITICAL" if is_aggregator else "HIGH",
            "balance": balance,
            "currency": "BDT",
            "status": "WATCHLIST" if not is_aggregator else "SUSPENDED",
            "kyc_status": "FLAGGED",
            "primary_device_id": dev,
            "registered_location_id": loc,
            "is_synthetic_mule": True,
            "mule_cluster_role": role
        })
        idx += 1

    return wallets
