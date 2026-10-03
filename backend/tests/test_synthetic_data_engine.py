"""
UpayAche — Phase 4 Synthetic Data Engine Test Suite.
Verifies:
1. File generation & presence across data/synthetic, data/raw, data/processed
2. Schema validity & column contracts
3. Relational integrity (foreign keys between wallets, devices, locations, transactions, features)
4. Normal records properties
5. Known suspicious records (verifying all 11 suspicious patterns are present & labeled)
6. Missing values audit
7. Duplicate primary key audit
8. Timestamp validity & chronological ordering
9. Zero PII compliance (strictly masked MSISDNs)
"""

import re
import pytest
import pandas as pd
from datetime import datetime
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
SYNTHETIC_DIR = DATA_DIR / "synthetic"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"


@pytest.fixture(scope="module")
def datasets():
    """Load all generated datasets into pandas DataFrames."""
    wallets_path = SYNTHETIC_DIR / "wallets.csv"
    tx_path = SYNTHETIC_DIR / "transactions.csv"
    dev_path = SYNTHETIC_DIR / "devices.csv"
    loc_path = SYNTHETIC_DIR / "locations.csv"
    merch_path = SYNTHETIC_DIR / "merchants.csv"
    rel_path = SYNTHETIC_DIR / "wallet_relationships.csv"
    feat_path = PROCESSED_DIR / "dataset_labeled_features.csv"

    assert wallets_path.exists(), f"Missing {wallets_path}"
    assert tx_path.exists(), f"Missing {tx_path}"
    assert dev_path.exists(), f"Missing {dev_path}"
    assert loc_path.exists(), f"Missing {loc_path}"
    assert merch_path.exists(), f"Missing {merch_path}"
    assert rel_path.exists(), f"Missing {rel_path}"
    assert feat_path.exists(), f"Missing {feat_path}"

    return {
        "wallets": pd.read_csv(wallets_path),
        "transactions": pd.read_csv(tx_path),
        "devices": pd.read_csv(dev_path),
        "locations": pd.read_csv(loc_path),
        "merchants": pd.read_csv(merch_path),
        "relationships": pd.read_csv(rel_path),
        "features": pd.read_csv(feat_path)
    }


def test_schema_validity(datasets):
    """Verify that all required columns are present in each dataset."""
    expected_wallets_cols = {
        "id", "wallet_number", "phone_number_masked", "wallet_type",
        "risk_tier", "balance", "currency", "status", "kyc_status",
        "primary_device_id", "registered_location_id", "is_synthetic_mule"
    }
    assert expected_wallets_cols.issubset(set(datasets["wallets"].columns))

    expected_tx_cols = {
        "id", "tx_hash", "sender_wallet_id", "receiver_wallet_id",
        "tx_type", "amount", "fee", "status", "device_id", "location_id",
        "timestamp", "pattern_id", "pattern_code", "is_fraud", "is_anomaly", "scenario_id"
    }
    assert expected_tx_cols.issubset(set(datasets["transactions"].columns))

    expected_24_features = {
        "amount", "log_amount", "fee_ratio", "hour_of_day", "is_night", "is_weekend",
        "tx_type_code", "tx_count_1h", "tx_count_24h", "sum_amount_1h", "sum_amount_24h",
        "amount_to_hist_avg", "cashout_velocity_ratio", "p2p_inflow_count_1h", "time_since_last_tx",
        "balance_depletion_ratio", "structuring_proximity", "in_degree", "out_degree",
        "degree_ratio", "pagerank", "ego_clustering_coef", "in_cycle_3", "shortest_path_to_flagged"
    }
    assert expected_24_features.issubset(set(datasets["features"].columns))


def test_no_duplicate_ids(datasets):
    """Verify zero duplicate primary keys across all generated entities."""
    for name, df in datasets.items():
        if "id" in df.columns:
            assert df["id"].is_unique, f"Duplicate IDs detected in {name} dataset!"


def test_no_missing_values(datasets):
    """Verify that mandatory fields have no missing/NaN values."""
    mandatory_checks = {
        "wallets": ["id", "wallet_number", "phone_number_masked", "wallet_type", "balance"],
        "transactions": ["id", "tx_hash", "sender_wallet_id", "receiver_wallet_id", "amount", "timestamp", "is_fraud"],
        "devices": ["id", "device_fingerprint", "device_type", "os", "device_risk_score"],
        "locations": ["id", "location_code", "division", "district", "is_high_risk_zone"],
        "relationships": ["id", "source_wallet_id", "target_wallet_id", "total_tx_count", "total_volume"],
        "features": ["transaction_id", "amount", "log_amount", "is_fraud", "pattern_id"]
    }
    for name, cols in mandatory_checks.items():
        df = datasets[name]
        for col in cols:
            assert df[col].notna().all(), f"Found NaN values in {name}.{col}"


def test_relational_integrity(datasets):
    """Verify foreign key integrity across entities."""
    wallet_ids = set(datasets["wallets"]["id"])
    device_ids = set(datasets["devices"]["id"])
    location_ids = set(datasets["locations"]["id"])
    tx_ids = set(datasets["transactions"]["id"])

    # Transactions foreign keys
    assert set(datasets["transactions"]["sender_wallet_id"]).issubset(wallet_ids)
    assert set(datasets["transactions"]["receiver_wallet_id"]).issubset(wallet_ids)
    assert set(datasets["transactions"]["device_id"]).issubset(device_ids)
    assert set(datasets["transactions"]["location_id"]).issubset(location_ids)

    # Relationship foreign keys
    assert set(datasets["relationships"]["source_wallet_id"]).issubset(wallet_ids)
    assert set(datasets["relationships"]["target_wallet_id"]).issubset(wallet_ids)

    # Feature matrix foreign key
    assert set(datasets["features"]["transaction_id"]).issubset(tx_ids)


def test_normal_records(datasets):
    """Verify characteristics of baseline normal transactions (Pattern 1)."""
    df_tx = datasets["transactions"]
    normal_df = df_tx[df_tx["pattern_id"] == 1]

    assert len(normal_df) > 0, "No normal transactions found!"
    assert (normal_df["is_fraud"] == 0).all(), "Normal records must have is_fraud == 0"
    assert (normal_df["is_anomaly"] == 0).all(), "Normal records must have is_anomaly == 0"
    assert (normal_df["amount"] > 0).all(), "Transaction amounts must be positive"
    assert (normal_df["status"] == "COMPLETED").all(), "Normal transactions should be completed"

    # Majority of the dataset should be normal
    normal_ratio = len(normal_df) / len(df_tx)
    assert normal_ratio >= 0.70, f"Expected normal ratio >= 70%, found {normal_ratio:.1%}"


def test_known_suspicious_records(datasets):
    """Verify that all 11 suspicious patterns are injected and correctly labeled."""
    df_tx = datasets["transactions"]

    # Injected suspicious patterns are 2 through 12
    for pattern_id in range(2, 13):
        pattern_txs = df_tx[df_tx["pattern_id"] == pattern_id]
        assert len(pattern_txs) > 0, f"Pattern {pattern_id} was not generated!"
        assert (pattern_txs["is_fraud"] == 1).all(), f"Pattern {pattern_id} records must have is_fraud == 1"
        assert (pattern_txs["is_anomaly"] == 1).all(), f"Pattern {pattern_id} records must have is_anomaly == 1"
        assert (pattern_txs["status"] == "FLAGGED").all(), f"Pattern {pattern_id} records should have FLAGGED status"

    # Pattern-specific assertions:
    # Pattern 2: Unusually large transactions
    p2 = df_tx[df_tx["pattern_id"] == 2]
    assert (p2["amount"] >= 20000.0).all(), "Pattern 2 amounts should be large"

    # Pattern 6: Unusual time (nocturnal dead hours)
    p6 = df_tx[df_tx["pattern_id"] == 6]
    for ts_str in p6["timestamp"]:
        dt = datetime.fromisoformat(ts_str)
        assert 1 <= dt.hour <= 5, f"Pattern 6 transaction at {dt.hour} is not nocturnal"


def test_timestamp_validity(datasets):
    """Verify ISO-8601 formatting and chronological validity."""
    df_tx = datasets["transactions"]
    timestamps = [datetime.fromisoformat(ts) for ts in df_tx["timestamp"]]

    # Chronologically sorted
    for i in range(len(timestamps) - 1):
        assert timestamps[i] <= timestamps[i + 1], f"Transactions out of chronological order at index {i}"

    # Relationships first_interaction <= last_interaction
    df_rel = datasets["relationships"]
    for _, row in df_rel.iterrows():
        t1 = datetime.fromisoformat(row["first_interaction_at"])
        t2 = datetime.fromisoformat(row["last_interaction_at"])
        assert t1 <= t2, f"Relationship first_interaction {t1} > last_interaction {t2}"


def test_zero_pii_compliance(datasets):
    """Verify zero real customer PII and strict phone number masking."""
    df_wallets = datasets["wallets"]
    phone_pattern = re.compile(r"^01[3-9]\*\*\*\*[0-9]{4}$")

    for phone in df_wallets["phone_number_masked"]:
        assert phone_pattern.match(phone), f"Invalid or unmasked phone number: {phone}"

    # Wallet numbers follow synthetic standard
    for w_num in df_wallets["wallet_number"]:
        assert any(w_num.startswith(p) for p in ["W-PERS-", "W-AGNT-", "W-MRCH-", "W-MULE-"])
