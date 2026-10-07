"""
UpayAche — Synthetic Patterns Definition & Taxonomy.
Defines the 12 controlled behavioral patterns (1 Normal, 11 Suspicious)
and maps them to the 7 canonical Bangladesh MFS Fraud Typologies:
1. ACCOUNT_TAKEOVER
2. MULE_NETWORK
3. SMURFING
4. SOCIAL_ENGINEERING
5. AGENT_CASHOUT_ABUSE
6. NOCTURNAL_CASHOUT
7. RAPID_FUND_MOVEMENT
with explicit evidence features explaining each generated scenario.
"""

from typing import Dict, Any, List

# The 7 Canonical Bangladesh MFS Fraud Typologies
TYPOLOGIES: Dict[str, Dict[str, Any]] = {
    "ACCOUNT_TAKEOVER": {
        "code": "ACCOUNT_TAKEOVER",
        "name": "Account Takeover",
        "name_bn": "অ্যাকাউন্ট টেকওভার / সিম সোয়াপ",
        "description": "Unauthorized access or SIM swap where an unrecognized hardware device accesses the wallet and rapidly initiates high-value transfers or balance depletion.",
        "evidence_features": [
            "new_device",
            "new_recipient",
            "amount_deviation",
            "high_transaction_velocity"
        ]
    },
    "MULE_NETWORK": {
        "code": "MULE_NETWORK",
        "name": "Mule Network",
        "name_bn": "মিউল নেটওয়ার্ক / সাইক্লিক ট্রেইল",
        "description": "Multi-hop layering relay chains, circular cycles, or coordinated mule syndicates distributing illicit funds across intermediate wallets.",
        "evidence_features": [
            "many_outbound_wallets",
            "many_inbound_wallets",
            "high_transaction_velocity",
            "rapid_cash_out"
        ]
    },
    "SMURFING": {
        "code": "SMURFING",
        "name": "Smurfing / Transaction Splitting",
        "name_bn": "স্মার্ফিং / লেনদেন বিভাজন",
        "description": "Structuring multiple below-threshold inflows into a single aggregator account to evade regulatory reporting thresholds.",
        "evidence_features": [
            "many_inbound_wallets",
            "amount_deviation",
            "high_transaction_velocity"
        ]
    },
    "SOCIAL_ENGINEERING": {
        "code": "SOCIAL_ENGINEERING",
        "name": "Social Engineering",
        "name_bn": "সোশ্যাল ইঞ্জিনিয়ারিং / ভুয়া রিভার্সাল",
        "description": "Victim manipulated into transferring funds via fake lottery, impersonation, or erroneous transfer ('ভুল করে টাকা গেছে') scams.",
        "evidence_features": [
            "new_recipient",
            "amount_deviation",
            "rapid_cash_out"
        ]
    },
    "AGENT_CASHOUT_ABUSE": {
        "code": "AGENT_CASHOUT_ABUSE",
        "name": "Agent Cash-out Abuse",
        "name_bn": "এজেন্ট ক্যাশ-আউট অপব্যবহার",
        "description": "Rapid liquidity drain or collusive high-volume liquidation through an agent POS cash-out point exceeding baseline limits.",
        "evidence_features": [
            "rapid_cash_out",
            "agent_abnormality",
            "amount_deviation"
        ]
    },
    "NOCTURNAL_CASHOUT": {
        "code": "NOCTURNAL_CASHOUT",
        "name": "Nocturnal Cash-out",
        "name_bn": "গভীর রাতের অস্বাভাবিক ক্যাশ-আউট",
        "description": "High-value cash-out executed during dead hours (01:00 AM – 05:00 AM) deviating sharply from daytime baseline.",
        "evidence_features": [
            "unusual_hour",
            "rapid_cash_out",
            "amount_deviation"
        ]
    },
    "RAPID_FUND_MOVEMENT": {
        "code": "RAPID_FUND_MOVEMENT",
        "name": "Rapid Fund Movement",
        "name_bn": "দ্রুত ফান্ড স্থানান্তর",
        "description": "High-velocity bursts of transfers with minimal account resting time between inbound and outbound flows.",
        "evidence_features": [
            "high_transaction_velocity",
            "rapid_cash_out",
            "amount_deviation"
        ]
    }
}

PATTERNS: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "code": "NORMAL_TRANSACTION",
        "name": "Normal Transaction",
        "typology": "NORMAL",
        "is_fraud": 0,
        "is_anomaly": 0,
        "evidence_features": [],
        "description": "Standard peer-to-peer, merchant payment, mobile recharge, or cash-in during daytime/evening hours from registered device and typical location."
    },
    2: {
        "id": 2,
        "code": "UNUSUALLY_LARGE",
        "name": "Unusually Large Transaction",
        "typology": "RAPID_FUND_MOVEMENT",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "amount_deviation",
            "high_transaction_velocity"
        ],
        "description": "Single transfer amount > 10x wallet 30-day baseline average, often testing maximum regulatory single-transfer thresholds (৳24,500–৳25,000 or ৳49,000–৳50,000)."
    },
    3: {
        "id": 3,
        "code": "HIGH_VELOCITY",
        "name": "High Transaction Velocity",
        "typology": "RAPID_FUND_MOVEMENT",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "high_transaction_velocity",
            "amount_deviation"
        ],
        "description": "Burst of 5 to 15 rapid automated transactions occurring within a tight window (< 15 minutes) with abnormally small interval between successive calls."
    },
    4: {
        "id": 4,
        "code": "NEW_DEVICE",
        "name": "New Unrecognized Device",
        "typology": "ACCOUNT_TAKEOVER",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "new_device",
            "amount_deviation"
        ],
        "description": "Transaction originating from a newly observed hardware terminal fingerprint, specifically flagged as a rooted Android or emulator environment."
    },
    5: {
        "id": 5,
        "code": "NEW_RECIPIENT",
        "name": "New High-Risk Recipient",
        "typology": "SOCIAL_ENGINEERING",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "new_recipient",
            "amount_deviation"
        ],
        "description": "High-value transfer directed to a previously unseen recipient wallet, immediately followed by secondary outbound dispersal or cash-out."
    },
    6: {
        "id": 6,
        "code": "UNUSUAL_TIME",
        "name": "Unusual Transaction Time",
        "typology": "NOCTURNAL_CASHOUT",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "unusual_hour",
            "rapid_cash_out",
            "amount_deviation"
        ],
        "description": "Significant financial activity executed during nocturnal dead hours (01:00 AM – 05:00 AM), which strongly correlates with fraud and illicit cash-outs."
    },
    7: {
        "id": 7,
        "code": "UNUSUAL_LOCATION",
        "name": "Unusual Location Shift",
        "typology": "ACCOUNT_TAKEOVER",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "new_device",
            "amount_deviation"
        ],
        "description": "Transaction originating from a high-risk border crossing / smuggling zone (e.g. Teknaf, Benapole) or showing impossible geographic velocity from user registered location."
    },
    8: {
        "id": 8,
        "code": "SUDDEN_BEHAVIORAL_CHANGE",
        "name": "Sudden Behavioral Change",
        "typology": "AGENT_CASHOUT_ABUSE",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "rapid_cash_out",
            "agent_abnormality",
            "amount_deviation"
        ],
        "description": "Previously dormant or low-activity consumer wallet suddenly executes 100% balance depletion and max-limit cash-outs within 1 hour."
    },
    9: {
        "id": 9,
        "code": "FAN_IN_MULE",
        "name": "Multiple Wallets Connected to One (Smurfing)",
        "typology": "SMURFING",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "many_inbound_wallets",
            "amount_deviation",
            "high_transaction_velocity"
        ],
        "description": "Classic structuring fan-in topology: 3 to 10 distinct sender wallets deposit structured amounts into a single aggregator account within minutes."
    },
    10: {
        "id": 10,
        "code": "SUSPICIOUS_CHAIN",
        "name": "Suspicious Transaction Chain / Circular Layering",
        "typology": "MULE_NETWORK",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "many_outbound_wallets",
            "many_inbound_wallets",
            "high_transaction_velocity"
        ],
        "description": "Multi-hop relay chain (A -> B -> C -> D or A -> B -> C -> A circular loop) with conservation of funds > 95%, typical of laundering layering."
    },
    11: {
        "id": 11,
        "code": "REPEATED_TRANSFERS",
        "name": "Repeated Identical Transfers",
        "typology": "RAPID_FUND_MOVEMENT",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "high_transaction_velocity",
            "amount_deviation"
        ],
        "description": "Repeated exact or near-identical BDT transfers (e.g. ৳4,999 four times in 8 minutes) to circumvent velocity counters or test card limits."
    },
    12: {
        "id": 12,
        "code": "SCAM_SYNDICATE",
        "name": "Synthetic Scam-Like Pattern (Lottery/Impersonation)",
        "typology": "MULE_NETWORK",
        "is_fraud": 1,
        "is_anomaly": 1,
        "evidence_features": [
            "new_recipient",
            "many_inbound_wallets",
            "many_outbound_wallets",
            "rapid_cash_out",
            "agent_abnormality"
        ],
        "description": "Complete scam lifecycle: victim deceived into sending funds to a primary mule, mule layers funds to secondary aggregator, aggregator executes immediate agent POS cash-out."
    }
}

