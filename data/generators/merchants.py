"""
UpayAche — Synthetic Merchant Generator.
Generates verified synthetic merchant entities with business categories,
MCC codes, settlement schedules, and compliance KYC tiers.
"""

from typing import List, Dict, Any

SYNTHETIC_MERCHANTS = [
    {
        "merchant_name": "Shwapno Superstore (Dhanmondi Branch)",
        "category": "SUPERMARKET_GROCERY",
        "mcc_code": 5411,
        "daily_limit": 1000000.00,
        "settlement_cycle": "T+1"
    },
    {
        "merchant_name": "Aarong Retail Flagship",
        "category": "APPAREL_LIFESTYLE",
        "mcc_code": 5651,
        "daily_limit": 1500000.00,
        "settlement_cycle": "T+1"
    },
    {
        "merchant_name": "Daraz E-Commerce Hub",
        "category": "ONLINE_MARKETPLACE",
        "mcc_code": 5399,
        "daily_limit": 5000000.00,
        "settlement_cycle": "T+0"
    },
    {
        "merchant_name": "Popular Diagnostic Center",
        "category": "HEALTHCARE_SERVICES",
        "mcc_code": 8099,
        "daily_limit": 800000.00,
        "settlement_cycle": "T+1"
    },
    {
        "merchant_name": "Padma Oil Filling Station",
        "category": "PETROLEUM_FUEL",
        "mcc_code": 5541,
        "daily_limit": 1200000.00,
        "settlement_cycle": "T+1"
    },
    {
        "merchant_name": "Star Cineplex Tickets",
        "category": "ENTERTAINMENT",
        "mcc_code": 7832,
        "daily_limit": 500000.00,
        "settlement_cycle": "T+1"
    },
    {
        "merchant_name": "Dhaka Electric Supply Company (DESCO)",
        "category": "UTILITY_ELECTRICITY",
        "mcc_code": 4900,
        "daily_limit": 10000000.00,
        "settlement_cycle": "REALTIME"
    },
    {
        "merchant_name": "Chaldal Online Grocery",
        "category": "GROCERY_DELIVERY",
        "mcc_code": 5499,
        "daily_limit": 2000000.00,
        "settlement_cycle": "T+0"
    }
]


def generate_merchants() -> List[Dict[str, Any]]:
    """Generate deterministic synthetic merchants with RFC 4122 hex UUIDs."""
    merchants = []
    for idx, item in enumerate(SYNTHETIC_MERCHANTS, start=1):
        m_id = f"m1000000-0000-0000-0000-{idx:012d}"
        merchants.append({
            "id": m_id,
            "merchant_code": f"MRCH-BD-{idx:04d}",
            "merchant_name": item["merchant_name"],
            "business_category": item["category"],
            "mcc_code": item["mcc_code"],
            "daily_volume_limit": item["daily_limit"],
            "settlement_cycle": item["settlement_cycle"],
            "kyc_verified": True
        })
    return merchants
