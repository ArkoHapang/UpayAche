"""
UpayAche — Network Graph Builder.
Constructs NetworkX directed multigraphs (MultiDiGraph) from synthetic
or production MFS wallet accounts and transactions.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import networkx as nx

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent


def build_transaction_graph_from_dfs(
    df_wallets: pd.DataFrame,
    df_transactions: pd.DataFrame
) -> nx.MultiDiGraph:
    """
    Construct a NetworkX MultiDiGraph:
    - Nodes = Wallets with operational & risk attributes
    - Directed Edges = Individual financial transactions with amounts and timestamps
    """
    G = nx.MultiDiGraph()

    # 1. Add all wallet nodes
    for _, w in df_wallets.iterrows():
        wallet_id = str(w["id"])
        G.add_node(
            wallet_id,
            wallet_number=str(w.get("wallet_number", f"WAL-{wallet_id[:8]}")),
            phone_number_masked=str(w.get("phone_number_masked", "017****0000")),
            wallet_type=str(w.get("wallet_type", "PERSONAL")),
            balance=float(w.get("balance", 0.0)),
            currency=str(w.get("currency", "BDT")),
            status=str(w.get("status", "ACTIVE")),
            kyc_status=str(w.get("kyc_status", "VERIFIED")),
            risk_tier=str(w.get("risk_tier", "LOW")),
            is_synthetic_mule=bool(w.get("is_synthetic_mule", False)),
            mule_cluster_role=str(w.get("mule_cluster_role")) if pd.notna(w.get("mule_cluster_role")) else None,
            primary_device_id=str(w.get("primary_device_id")) if pd.notna(w.get("primary_device_id")) else None,
            registered_location_id=str(w.get("registered_location_id")) if pd.notna(w.get("registered_location_id")) else None
        )

    # 2. Add directed transaction edges
    for _, tx in df_transactions.iterrows():
        sender = str(tx["sender_wallet_id"])
        receiver = str(tx["receiver_wallet_id"])

        # Ensure both endpoints exist as nodes even if missing from wallets df
        if not G.has_node(sender):
            G.add_node(sender, wallet_number=f"WAL-{sender[:8]}", risk_tier="LOW", is_synthetic_mule=False)
        if not G.has_node(receiver):
            G.add_node(receiver, wallet_number=f"WAL-{receiver[:8]}", risk_tier="LOW", is_synthetic_mule=False)

        tx_id = str(tx["id"])
        amount = float(tx.get("amount", 0.0))
        tx_type = str(tx.get("tx_type", "P2P"))
        timestamp = str(tx.get("timestamp", ""))
        status = str(tx.get("status", "COMPLETED"))
        is_fraud = int(tx.get("is_fraud", 0))
        is_anomaly = int(tx.get("is_anomaly", 0))
        pattern_code = str(tx.get("pattern_code")) if pd.notna(tx.get("pattern_code")) else None

        G.add_edge(
            sender,
            receiver,
            key=tx_id,
            id=tx_id,
            amount=amount,
            tx_type=tx_type,
            timestamp=timestamp,
            status=status,
            is_fraud=is_fraud,
            is_anomaly=is_anomaly,
            pattern_code=pattern_code
        )

    return G


def load_synthetic_transaction_graph(
    data_dir: Optional[Path] = None
) -> nx.MultiDiGraph:
    """Load default synthetic transactions and wallets into NetworkX graph."""
    if data_dir is None:
        data_dir = PROJECT_ROOT / "data" / "synthetic"

    wallets_path = data_dir / "wallets.csv"
    tx_path = data_dir / "transactions.csv"

    if not wallets_path.exists() or not tx_path.exists():
        raise FileNotFoundError(
            f"Synthetic data files not found in {data_dir}. "
            "Ensure Phase 4 data generation has been run."
        )

    df_wallets = pd.read_csv(wallets_path)
    df_tx = pd.read_csv(tx_path)

    return build_transaction_graph_from_dfs(df_wallets, df_tx)
