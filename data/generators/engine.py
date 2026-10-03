"""
UpayAche — Synthetic MFS Data Engine Orchestrator.
Orchestrates generation of all synthetic entities and controlled patterns,
computes 24-dimensional features, and exports standardized datasets to:
- data/synthetic/
- data/raw/
- data/processed/
"""

import json
from pathlib import Path
from typing import Dict, Any
import pandas as pd

from data.generators.locations import generate_locations
from data.generators.devices import generate_devices
from data.generators.merchants import generate_merchants
from data.generators.wallets import generate_wallets
from data.generators.transactions import generate_transactions
from data.generators.relationships import generate_wallet_relationships
from data.generators.features import extract_features_for_transactions
from data.generators.patterns import PATTERNS


class SyntheticDataEngine:
    def __init__(self, base_dir: Path = None, seed: int = 42):
        if base_dir is None:
            base_dir = Path(__file__).resolve().parent.parent
        self.base_dir = base_dir
        self.seed = seed

        self.synthetic_dir = self.base_dir / "synthetic"
        self.raw_dir = self.base_dir / "raw"
        self.processed_dir = self.base_dir / "processed"

        for d in (self.synthetic_dir, self.raw_dir, self.processed_dir):
            d.mkdir(parents=True, exist_ok=True)

    def generate_all(
        self,
        wallet_count: int = 150,
        transaction_count: int = 2500,
        fraud_rate: float = 0.15
    ) -> Dict[str, Any]:
        """Execute full generation pipeline and export artifacts."""
        print(f"Generating synthetic MFS universe (seed={self.seed})...")

        # 1. Locations
        locations = generate_locations()
        df_locations = pd.DataFrame(locations)
        df_locations.to_csv(self.synthetic_dir / "locations.csv", index=False)

        # 2. Devices
        devices = generate_devices(count=40, seed=self.seed)
        df_devices = pd.DataFrame(devices)
        df_devices.to_csv(self.synthetic_dir / "devices.csv", index=False)

        # 3. Merchants
        merchants = generate_merchants()
        df_merchants = pd.DataFrame(merchants)
        df_merchants.to_csv(self.synthetic_dir / "merchants.csv", index=False)

        # 4. Wallets
        wallets = generate_wallets(
            count=wallet_count,
            devices=devices,
            locations=locations,
            seed=self.seed
        )
        df_wallets = pd.DataFrame(wallets)
        df_wallets.to_csv(self.synthetic_dir / "wallets.csv", index=False)

        # 5. Transactions (Normal + 11 Suspicious Patterns)
        transactions = generate_transactions(
            wallets=wallets,
            devices=devices,
            locations=locations,
            merchants=merchants,
            total_count=transaction_count,
            fraud_rate=fraud_rate,
            seed=self.seed
        )
        df_transactions = pd.DataFrame(transactions)
        df_transactions.to_csv(self.synthetic_dir / "transactions.csv", index=False)
        df_transactions.to_csv(self.raw_dir / "raw_transactions_stream.csv", index=False)

        # 6. Wallet Relationships (Graph Edges)
        relationships = generate_wallet_relationships(transactions)
        df_relationships = pd.DataFrame(relationships)
        df_relationships.to_csv(self.synthetic_dir / "wallet_relationships.csv", index=False)

        # 7. Patterns Taxonomy Metadata
        with open(self.synthetic_dir / "patterns.json", "w", encoding="utf-8") as f:
            json.dump(PATTERNS, f, indent=2)

        # 8. Feature Extraction (24-dim features)
        features = extract_features_for_transactions(transactions, wallets, relationships)
        
        # Flatten raw_features dictionary for processed ML tabular dataset
        tabular_rows = []
        for feat in features:
            row = {
                "transaction_id": feat["transaction_id"],
                **feat["raw_features"]
            }
            tabular_rows.append(row)

        df_features = pd.DataFrame(tabular_rows)
        # Merge ground truth labels from transactions
        df_labels = df_transactions[[
            "id", "pattern_id", "pattern_code", "is_fraud", "is_anomaly", "scenario_id"
        ]].rename(columns={"id": "transaction_id"})

        df_processed = pd.merge(df_features, df_labels, on="transaction_id")
        df_processed.to_csv(self.processed_dir / "dataset_labeled_features.csv", index=False)

        # Split train (80%) and test (20%) chronologically
        split_idx = int(len(df_processed) * 0.8)
        df_train = df_processed.iloc[:split_idx]
        df_test = df_processed.iloc[split_idx:]
        df_train.to_csv(self.processed_dir / "train_features.csv", index=False)
        df_test.to_csv(self.processed_dir / "test_features.csv", index=False)

        print(f"Generation complete:")
        print(f" - Wallets: {len(wallets)}")
        print(f" - Transactions: {len(transactions)} (Fraud/Suspicious: {df_transactions['is_fraud'].sum()})")
        print(f" - Graph Relationships: {len(relationships)}")
        print(f" - Processed Features: {df_processed.shape}")

        return {
            "locations": locations,
            "devices": devices,
            "merchants": merchants,
            "wallets": wallets,
            "transactions": transactions,
            "relationships": relationships,
            "features": df_processed
        }
