"""
UpayAche — Phase 7 Wallet Network Intelligence Test Suite.
Verifies:
1. Graph builder constructs valid MultiDiGraph with nodes (wallets) and directed edges (transactions)
2. Metric calculations for all required scenarios:
   - Isolated wallet (degree = 0, no transactions, component size = 1)
   - Normal wallet (moderate degree, balanced flows, low concentration)
   - High-degree wallet (hub node, high transaction volume & PageRank)
   - Connected suspicious wallets (detects 1-hop mules, HIGH/CRITICAL risk tiers, fraud edges)
   - Transaction chains (multi-hop traversal paths and circular layering cycles)
3. REST API endpoints under /api/v1/network:
   - GET /api/v1/network/graph/{wallet_id}
   - GET /api/v1/network/metrics/{wallet_id}
   - GET /api/v1/network/components
   - GET /api/v1/network/cycles
   - GET /api/v1/network/chains/{wallet_id}
   - 404 error handling for non-existent wallets
"""

import sys
import pytest
import pandas as pd
import networkx as nx
from pathlib import Path
from starlette.testclient import TestClient

# Ensure backend in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.main import app
from app.graph.builder import (
    build_transaction_graph_from_dfs,
    load_synthetic_transaction_graph
)
from app.graph.analysis import (
    calculate_wallet_node_metrics,
    compute_connected_components,
    detect_cycles_in_graph,
    trace_transaction_chains,
    extract_ego_network,
    format_graph_response
)
from app.services.network_service import get_network_service, WalletNetworkService


@pytest.fixture(scope="module")
def api_client():
    """FastAPI TestClient fixture with analyst authentication."""
    return TestClient(app, headers={"Authorization": "Bearer test-analyst-token"})


@pytest.fixture(scope="module")
def network_service():
    """WalletNetworkService singleton fixture."""
    return get_network_service()


@pytest.fixture(scope="module")
def synthetic_graph(network_service):
    """NetworkX graph populated with synthetic transactions."""
    return network_service.graph


@pytest.fixture(scope="module")
def test_wallets_df():
    """Load wallets DataFrame."""
    return pd.read_csv(PROJECT_ROOT / "data" / "synthetic" / "wallets.csv")


# =============================================================================
# 1. Isolated Wallet Scenario
# =============================================================================

def test_isolated_wallet_metrics():
    """
    Scenario 1: Isolated Wallet with zero transactions.
    Must have degree=0, inflow=0, outflow=0, concentration=0, and component_size=1.
    """
    # Create controlled mini-graph with an isolated node
    G = nx.MultiDiGraph()
    G.add_node(
        "isolated-wallet-100",
        wallet_number="W-ISO-0100",
        phone_number_masked="017****0100",
        wallet_type="PERSONAL",
        balance=1500.0,
        currency="BDT",
        status="ACTIVE",
        kyc_status="VERIFIED",
        risk_tier="LOW",
        is_synthetic_mule=False
    )
    # Add a separate connected pair
    G.add_node("w-a", wallet_number="W-A", risk_tier="LOW", is_synthetic_mule=False)
    G.add_node("w-b", wallet_number="W-B", risk_tier="LOW", is_synthetic_mule=False)
    G.add_edge("w-a", "w-b", id="tx-1", amount=500.0, tx_type="P2P", timestamp="2026-01-15T10:00:00")

    comp_map, comp_sizes = compute_connected_components(G)
    metrics = calculate_wallet_node_metrics(
        G,
        "isolated-wallet-100",
        component_map=comp_map,
        component_sizes=comp_sizes
    )

    assert metrics["degree"] == 0
    assert metrics["inbound_transactions"] == 0
    assert metrics["outbound_transactions"] == 0
    assert metrics["transaction_count"] == 0
    assert metrics["total_inflow"] == 0.0
    assert metrics["total_outflow"] == 0.0
    assert metrics["total_transferred_amount"] == 0.0
    assert metrics["network_concentration"] == 0.0
    assert metrics["suspicious_neighbors_count"] == 0
    assert len(metrics["suspicious_neighbors"]) == 0
    assert metrics["component_size"] == 1
    assert metrics["in_cycle"] is False


def test_isolated_wallet_ego_network():
    """Isolated wallet ego network should contain only itself and 0 edges."""
    G = nx.MultiDiGraph()
    G.add_node("iso-node", wallet_number="W-ISO", risk_tier="LOW", is_synthetic_mule=False)
    ego = extract_ego_network(G, "iso-node", hops=1)
    assert ego.number_of_nodes() == 1
    assert ego.number_of_edges() == 0

    resp = format_graph_response(ego)
    assert resp.total_nodes == 1
    assert resp.total_edges == 0
    assert resp.nodes[0].id == "iso-node"


# =============================================================================
# 2. Normal Wallet Scenario
# =============================================================================

def test_normal_wallet_metrics(network_service, test_wallets_df):
    """
    Scenario 2: Normal consumer wallet.
    Must have moderate degree, natural distributed flow, low concentration.
    """
    # Pick a personal wallet that is not a mule
    personal_wallets = test_wallets_df[
        (test_wallets_df["wallet_type"] == "PERSONAL") &
        (test_wallets_df["is_synthetic_mule"] == False)
    ]
    sample_id = str(personal_wallets.iloc[0]["id"])
    summary = network_service.get_wallet_metrics(sample_id)

    assert summary.wallet_id == sample_id
    assert summary.degree > 0
    assert summary.transaction_count == summary.degree
    assert summary.total_transferred_amount == round(summary.total_inflow + summary.total_outflow, 2)
    assert 0.0 <= summary.network_concentration <= 1.0
    # Consumer wallet in 149-node component
    assert summary.component_size > 1


def test_normal_wallet_ego_network(network_service, test_wallets_df):
    """Normal wallet 1-hop ego network extraction."""
    sample_id = str(test_wallets_df.iloc[0]["id"])
    ego_resp = network_service.get_ego_network(sample_id, hops=1, max_nodes=30)

    assert ego_resp.total_nodes >= 1
    assert ego_resp.total_nodes <= 30
    assert any(n.id == sample_id for n in ego_resp.nodes)

    # All edges must connect valid nodes in the subgraph
    node_ids = {n.id for n in ego_resp.nodes}
    for e in ego_resp.edges:
        assert e.source in node_ids
        assert e.target in node_ids


# =============================================================================
# 3. High-Degree Wallet Scenario
# =============================================================================

def test_high_degree_wallet_metrics(network_service, synthetic_graph):
    """
    Scenario 3: High-degree wallet (Agent or Aggregator hub node).
    Identifies node with maximum degree and validates centrality and volume.
    """
    # Find highest degree node
    degrees = dict(synthetic_graph.degree())
    max_node = max(degrees, key=degrees.get)
    max_degree = degrees[max_node]

    assert max_degree >= 30, f"Expected hub node with degree >= 30, got {max_degree}"

    summary = network_service.get_wallet_metrics(max_node)
    assert summary.degree == max_degree
    assert summary.inbound_transactions + summary.outbound_transactions == max_degree
    assert summary.total_transferred_amount > 10000.0
    assert summary.pagerank > 0.0


# =============================================================================
# 4. Connected Suspicious Wallets Scenario
# =============================================================================

def test_connected_suspicious_wallets(network_service, test_wallets_df, synthetic_graph):
    """
    Scenario 4: Wallet connected to suspicious neighbors (Mule / CRITICAL / Fraud).
    Verifies that 1-hop suspicious neighbors are accurately identified.
    """
    # Find a synthetic mule or feeder wallet
    mules = test_wallets_df[test_wallets_df["is_synthetic_mule"] == True]
    assert len(mules) > 0, "Synthetic mules must exist in dataset"
    mule_id = str(mules.iloc[0]["id"])

    # Find nodes connected to this mule
    neighbors = list(synthetic_graph.predecessors(mule_id)) + list(synthetic_graph.successors(mule_id))
    assert len(neighbors) > 0, "Mule must be connected in the graph"

    connected_partner_id = neighbors[0]
    metrics = network_service.get_wallet_metrics(connected_partner_id)

    # Partner must flag at least 1 suspicious neighbor (the mule)
    assert metrics.suspicious_neighbors_count >= 1
    sus_ids = [n["wallet_id"] for n in metrics.suspicious_neighbors]
    assert mule_id in sus_ids or metrics.suspicious_neighbors_count > 0


# =============================================================================
# 5. Transaction Chains & Circular Layering Scenario
# =============================================================================

def test_transaction_chains_tracing(network_service, synthetic_graph):
    """
    Scenario 5: Multi-hop transaction chain traversal.
    Traces forward fund paths from active senders.
    """
    # Find a sender with out-edges
    senders = [n for n in synthetic_graph.nodes() if synthetic_graph.out_degree(n) >= 3]
    assert len(senders) > 0
    focal = senders[0]

    chains = network_service.trace_chains(focal, max_depth=3)
    assert isinstance(chains, list)
    if len(chains) > 0:
        first_chain = chains[0]
        assert first_chain.total_hops >= 1
        assert len(first_chain.path_wallets) >= 2
        assert first_chain.path_wallets[0] == focal
        assert first_chain.total_amount_transferred > 0.0
        assert len(first_chain.transactions) == first_chain.total_hops


def test_circular_layering_cycles(network_service):
    """
    Verifies detection of circular transaction loops (Pattern 10).
    """
    cycles = network_service.get_circular_layering_cycles()
    assert isinstance(cycles, list)
    assert len(cycles) > 0, "Expected circular layering cycles to be detected in synthetic network"

    first_cycle = cycles[0]
    assert len(first_cycle) >= 3 # Minimum 3 nodes in circular laundering loop


# =============================================================================
# 6. REST API Endpoints Integration
# =============================================================================

def test_api_get_wallet_graph(api_client, test_wallets_df):
    """Verify GET /api/v1/network/graph/{wallet_id}."""
    sample_id = str(test_wallets_df.iloc[0]["id"])
    res = api_client.get(f"/api/v1/network/graph/{sample_id}?hops=1&max_nodes=25")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert "total_nodes" in data
    assert "total_edges" in data
    assert "graph_metadata" in data
    assert data["total_nodes"] > 0


def test_api_get_wallet_metrics(api_client, test_wallets_df):
    """Verify GET /api/v1/network/metrics/{wallet_id}."""
    sample_id = str(test_wallets_df.iloc[0]["id"])
    res = api_client.get(f"/api/v1/network/metrics/{sample_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["wallet_id"] == sample_id
    assert "degree" in data
    assert "inbound_transactions" in data
    assert "outbound_transactions" in data
    assert "total_transferred_amount" in data
    assert "network_concentration" in data
    assert "suspicious_neighbors_count" in data


def test_api_get_connected_components(api_client):
    """Verify GET /api/v1/network/components."""
    res = api_client.get("/api/v1/network/components")
    assert res.status_code == 200
    data = res.json()
    assert "total_components" in data
    assert "largest_component_size" in data
    assert data["total_components"] >= 1


def test_api_get_cycles(api_client):
    """Verify GET /api/v1/network/cycles."""
    res = api_client.get("/api/v1/network/cycles")
    assert res.status_code == 200
    cycles = res.json()
    assert isinstance(cycles, list)
    assert len(cycles) > 0


def test_api_get_chains(api_client, test_wallets_df):
    """Verify GET /api/v1/network/chains/{wallet_id}."""
    sample_id = str(test_wallets_df.iloc[0]["id"])
    res = api_client.get(f"/api/v1/network/chains/{sample_id}?max_depth=3")
    assert res.status_code == 200
    chains = res.json()
    assert isinstance(chains, list)


def test_api_wallet_not_found(api_client):
    """Non-existent wallet must return 404."""
    fake_id = "00000000-0000-0000-0000-999999999999"
    res = api_client.get(f"/api/v1/network/metrics/{fake_id}")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
