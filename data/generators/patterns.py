"""
UpayAche — Synthetic Patterns Definition & Taxonomy.
Defines the 12 controlled behavioral patterns (1 Normal, 11 Suspicious)
with ground truth labels for supervised and unsupervised ML evaluation.
"""

from typing import Dict, Any

PATTERNS: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "code": "NORMAL_TRANSACTION",
        "name": "Normal Transaction",
        "is_fraud": 0,
        "is_anomaly": 0,
        "description": "Standard peer-to-peer, merchant payment, mobile recharge, or cash-in during daytime/evening hours from registered device and typical location."
    },
    2: {
        "id": 2,
        "code": "UNUSUALLY_LARGE",
        "name": "Unusually Large Transaction",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Single transfer amount > 10x wallet 30-day baseline average, often testing maximum regulatory single-transfer thresholds (৳24,500–৳25,000 or ৳49,000–৳50,000)."
    },
    3: {
        "id": 3,
        "code": "HIGH_VELOCITY",
        "name": "High Transaction Velocity",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Burst of 5 to 15 rapid automated transactions occurring within a tight window (< 15 minutes) with abnormally small interval between successive calls."
    },
    4: {
        "id": 4,
        "code": "NEW_DEVICE",
        "name": "New Unrecognized Device",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Transaction originating from a newly observed hardware terminal fingerprint, specifically flagged as a rooted Android or emulator environment."
    },
    5: {
        "id": 5,
        "code": "NEW_RECIPIENT",
        "name": "New High-Risk Recipient",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "High-value transfer directed to a previously unseen recipient wallet, immediately followed by secondary outbound dispersal or cash-out."
    },
    6: {
        "id": 6,
        "code": "UNUSUAL_TIME",
        "name": "Unusual Transaction Time",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Significant financial activity executed during nocturnal dead hours (01:00 AM – 05:00 AM), which strongly correlates with fraud and illicit cash-outs."
    },
    7: {
        "id": 7,
        "code": "UNUSUAL_LOCATION",
        "name": "Unusual Location Shift",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Transaction originating from a high-risk border crossing / smuggling zone (e.g. Teknaf, Benapole) or showing impossible geographic velocity from user registered location."
    },
    8: {
        "id": 8,
        "code": "SUDDEN_BEHAVIORAL_CHANGE",
        "name": "Sudden Behavioral Change",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Previously dormant or low-activity consumer wallet suddenly executes 100% balance depletion and max-limit cash-outs within 1 hour."
    },
    9: {
        "id": 9,
        "code": "FAN_IN_MULE",
        "name": "Multiple Wallets Connected to One (Smurfing)",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Classic structuring fan-in topology: 3 to 10 distinct sender wallets deposit structured amounts into a single aggregator account within minutes."
    },
    10: {
        "id": 10,
        "code": "SUSPICIOUS_CHAIN",
        "name": "Suspicious Transaction Chain / Circular Layering",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Multi-hop relay chain (A -> B -> C -> D or A -> B -> C -> A circular loop) with conservation of funds > 95%, typical of laundering layering."
    },
    11: {
        "id": 11,
        "code": "REPEATED_TRANSFERS",
        "name": "Repeated Identical Transfers",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Repeated exact or near-identical BDT transfers (e.g. ৳4,999 four times in 8 minutes) to circumvent velocity counters or test card limits."
    },
    12: {
        "id": 12,
        "code": "SCAM_SYNDICATE",
        "name": "Synthetic Scam-Like Pattern (Lottery/Impersonation)",
        "is_fraud": 1,
        "is_anomaly": 1,
        "description": "Complete scam lifecycle: victim deceived into sending funds to a primary mule, mule layers funds to secondary aggregator, aggregator executes immediate agent POS cash-out."
    }
}
