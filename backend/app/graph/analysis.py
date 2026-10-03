"""
UpayAche — Network Graph Analytics & Topology Engine.
Calculates node and graph-level topological intelligence:
- Degree, in/out transactions, and transaction volume
- Weakly and strongly connected components
- Suspicious 1-hop neighbor detection
- Herfindahl-Hirschman network flow concentration
- Directed cycle & transaction chain tracing
- Ego-subgraph extraction and API response formatting
"""

from typing import Dict, Any, List, Set, Tuple, Optional
import networkx as nx
from app.graph.schemas import (
    GraphNode,
    GraphEdge,
    NodeMetadata,
    RiskMetadata,
    NetworkGraphResponse,
    WalletNetworkSummary
)


def calculate_wallet_node_metrics(
    G: nx.MultiDiGraph,
    node_id: str,
    component_map: Optional[Dict[str, int]] = None,
    component_sizes: Optional[Dict[int, int]] = None,
    cycles_set: Optional[Set[str]] = None,
    pagerank_scores: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculate comprehensive topological metrics for a single wallet node:
    - Degree (total, inbound, outbound)
    - Total transferred volume (inflow, outflow, total)
    - Suspicious neighbor count and identifiers
    - Network concentration (Herfindahl-Hirschman Index on counterparty flows)
    - Component membership & cycle participation
    """
    if not G.has_node(node_id):
        raise KeyError(f"Wallet node '{node_id}' does not exist in graph")

    node_data = G.nodes[node_id]

    in_degree = G.in_degree(node_id)
    out_degree = G.out_degree(node_id)
    degree = in_degree + out_degree
    tx_count = degree

    total_inflow = 0.0
    for _, _, edge_data in G.in_edges(node_id, data=True):
        total_inflow += float(edge_data.get("amount", 0.0))

    total_outflow = 0.0
    outflow_by_target: Dict[str, float] = {}
    for _, target, edge_data in G.out_edges(node_id, data=True):
        amt = float(edge_data.get("amount", 0.0))
        total_outflow += amt
        outflow_by_target[target] = outflow_by_target.get(target, 0.0) + amt

    total_transferred = round(total_inflow + total_outflow, 2)
    total_inflow = round(total_inflow, 2)
    total_outflow = round(total_outflow, 2)

    # Network Concentration (HHI):
    # Quantifies if outflows are concentrated into a single funnel node (1.0)
    # or distributed among many recipients (approaching 0.0).
    if total_outflow > 0 and outflow_by_target:
        hhi = sum((amt / total_outflow) ** 2 for amt in outflow_by_target.values())
        concentration = round(max(0.0, min(1.0, hhi)), 4)
    elif total_inflow > 0:
        # If purely receiving, check inbound concentration
        inflow_by_source: Dict[str, float] = {}
        for source, _, edge_data in G.in_edges(node_id, data=True):
            amt = float(edge_data.get("amount", 0.0))
            inflow_by_source[source] = inflow_by_source.get(source, 0.0) + amt
        hhi = sum((amt / total_inflow) ** 2 for amt in inflow_by_source.values())
        concentration = round(max(0.0, min(1.0, hhi)), 4)
    else:
        concentration = 0.0

    # Suspicious Neighbors Analysis (1-Hop Ego Neighborhood)
    # A neighbor is considered suspicious if flagged as HIGH/CRITICAL risk tier,
    # or marked as synthetic mule, or connected via a confirmed fraud transaction.
    predecessors = set(G.predecessors(node_id))
    successors = set(G.successors(node_id))
    all_neighbors = predecessors.union(successors)

    suspicious_ids: List[str] = []
    suspicious_details: List[Dict[str, Any]] = []

    for nbr_id in all_neighbors:
        nbr_data = G.nodes[nbr_id]
        nbr_tier = str(nbr_data.get("risk_tier", "LOW")).upper()
        is_mule = bool(nbr_data.get("is_synthetic_mule", False))

        # Check edge fraud flags between node and neighbor
        edge_fraud = False
        for _, _, edata in G.edges([node_id, nbr_id], data=True):
            if int(edata.get("is_fraud", 0)) == 1:
                edge_fraud = True
                break

        if nbr_tier in ("HIGH", "CRITICAL") or is_mule or edge_fraud:
            suspicious_ids.append(nbr_id)
            suspicious_details.append({
                "wallet_id": nbr_id,
                "wallet_number": nbr_data.get("wallet_number", f"WAL-{nbr_id[:8]}"),
                "risk_tier": nbr_tier,
                "is_synthetic_mule": is_mule,
                "mule_cluster_role": nbr_data.get("mule_cluster_role")
            })

    # Connected component info
    comp_id = component_map.get(node_id, 0) if component_map else 0
    comp_size = component_sizes.get(comp_id, 1) if component_sizes else 1

    in_cycle = (node_id in cycles_set) if cycles_set is not None else False
    pr_score = pagerank_scores.get(node_id, 0.0) if pagerank_scores else 0.0

    return {
        "wallet_id": node_id,
        "wallet_number": str(node_data.get("wallet_number", f"WAL-{node_id[:8]}")),
        "phone_number_masked": str(node_data.get("phone_number_masked", "017****0000")),
        "wallet_type": str(node_data.get("wallet_type", "PERSONAL")),
        "balance": float(node_data.get("balance", 0.0)),
        "currency": str(node_data.get("currency", "BDT")),
        "status": str(node_data.get("status", "ACTIVE")),
        "kyc_status": str(node_data.get("kyc_status", "VERIFIED")),
        "risk_tier": str(node_data.get("risk_tier", "LOW")),
        "is_synthetic_mule": bool(node_data.get("is_synthetic_mule", False)),
        "mule_cluster_role": node_data.get("mule_cluster_role"),
        "primary_device_id": node_data.get("primary_device_id"),
        "registered_location_id": node_data.get("registered_location_id"),
        "degree": degree,
        "inbound_transactions": in_degree,
        "outbound_transactions": out_degree,
        "transaction_count": tx_count,
        "total_inflow": total_inflow,
        "total_outflow": total_outflow,
        "total_transferred_amount": total_transferred,
        "network_concentration": concentration,
        "suspicious_neighbors_count": len(suspicious_ids),
        "suspicious_neighbor_ids": suspicious_ids,
        "suspicious_neighbors": suspicious_details,
        "component_id": comp_id,
        "component_size": comp_size,
        "in_cycle": in_cycle,
        "pagerank": round(pr_score, 6)
    }


def compute_connected_components(G: nx.MultiDiGraph) -> Tuple[Dict[str, int], Dict[int, int]]:
    """Compute weakly connected component IDs and sizes for all nodes."""
    component_map = {}
    component_sizes = {}
    for comp_idx, comp_nodes in enumerate(nx.weakly_connected_components(G)):
        c_size = len(comp_nodes)
        component_sizes[comp_idx] = c_size
        for node in comp_nodes:
            component_map[node] = comp_idx
    return component_map, component_sizes


def detect_cycles_in_graph(G: nx.MultiDiGraph, max_cycle_length: int = 5) -> List[List[str]]:
    """
    Detect circular transaction loops (e.g. 3-node layering cycles A -> B -> C -> A).
    Converts MultiDiGraph to simple DiGraph for cycle detection.
    """
    simple_di = nx.DiGraph(G)
    cycles = []
    # simple_cycles generates elementary directed cycles with bounded length
    for cycle in nx.simple_cycles(simple_di, length_bound=max_cycle_length):
        if 3 <= len(cycle) <= max_cycle_length:
            cycles.append(cycle)
        if len(cycles) >= 50: # Cap at 50 loops to maintain latency
            break
    return cycles


def trace_transaction_chains(
    G: nx.MultiDiGraph,
    source_wallet_id: str,
    max_depth: int = 4
) -> List[Dict[str, Any]]:
    """
    Trace forward fund dispersal paths from source wallet up to max_depth hops.
    """
    if not G.has_node(source_wallet_id):
        return []

    chains = []
    visited_paths = []

    def dfs(current: str, current_path: List[str], current_edges: List[Dict[str, Any]], depth: int):
        if depth >= max_depth:
            return

        for _, successor, edge_data in G.out_edges(current, data=True):
            if successor in current_path: # Avoid infinite loop on cycles
                continue

            new_path = current_path + [successor]
            new_edges = current_edges + [{
                "id": str(edge_data.get("id")),
                "source": current,
                "target": successor,
                "amount": float(edge_data.get("amount", 0.0)),
                "tx_type": str(edge_data.get("tx_type", "P2P")),
                "timestamp": str(edge_data.get("timestamp", "")),
                "is_fraud": int(edge_data.get("is_fraud", 0)),
                "is_anomaly": int(edge_data.get("is_anomaly", 0))
            }]

            if len(new_path) >= 2:
                tot_amt = sum(e["amount"] for e in new_edges)
                has_fraud = any(e["is_fraud"] == 1 for e in new_edges)
                chains.append({
                    "path_wallets": new_path,
                    "total_hops": len(new_path) - 1,
                    "total_amount_transferred": round(tot_amt, 2),
                    "transactions": new_edges,
                    "is_suspicious": has_fraud
                })

            dfs(successor, new_path, new_edges, depth + 1)

    dfs(source_wallet_id, [source_wallet_id], [], 0)
    # Sort by total amount descending and return top 20 chains
    chains.sort(key=lambda c: c["total_amount_transferred"], reverse=True)
    return chains[:20]


def extract_ego_network(
    G: nx.MultiDiGraph,
    focal_wallet_id: str,
    hops: int = 1,
    max_nodes: int = 50
) -> nx.MultiDiGraph:
    """
    Extract a k-hop directed ego subgraph around focal wallet.
    Includes both inbound (senders) and outbound (receivers).
    """
    if not G.has_node(focal_wallet_id):
        raise KeyError(f"Wallet node '{focal_wallet_id}' not found in graph")

    # Breadth-first search neighborhood expansion
    subgraph_nodes: Set[str] = {focal_wallet_id}
    frontier: Set[str] = {focal_wallet_id}

    for _ in range(hops):
        next_frontier: Set[str] = set()
        for node in frontier:
            # Include predecessors and successors
            in_nbrs = set(G.predecessors(node))
            out_nbrs = set(G.successors(node))
            combined = in_nbrs.union(out_nbrs)

            for nbr in combined:
                if nbr not in subgraph_nodes and len(subgraph_nodes) < max_nodes:
                    subgraph_nodes.add(nbr)
                    next_frontier.add(nbr)

        frontier = next_frontier
        if not frontier or len(subgraph_nodes) >= max_nodes:
            break

    # Extract induced subgraph preserving all multi-edges between these nodes
    return G.subgraph(subgraph_nodes).copy()


def format_graph_response(
    subgraph: nx.MultiDiGraph,
    component_map: Optional[Dict[str, int]] = None,
    component_sizes: Optional[Dict[int, int]] = None,
    cycles_set: Optional[Set[str]] = None,
    pagerank_scores: Optional[Dict[str, float]] = None
) -> NetworkGraphResponse:
    """
    Convert a NetworkX MultiDiGraph into the API-ready structured NetworkGraphResponse contract.
    """
    nodes_list: List[GraphNode] = []
    edges_list: List[GraphEdge] = []

    for node_id in subgraph.nodes():
        metrics = calculate_wallet_node_metrics(
            subgraph,
            node_id,
            component_map=component_map,
            component_sizes=component_sizes,
            cycles_set=cycles_set,
            pagerank_scores=pagerank_scores
        )

        node_obj = GraphNode(
            id=node_id,
            label=metrics["wallet_number"],
            degree=metrics["degree"],
            inbound_transactions=metrics["inbound_transactions"],
            outbound_transactions=metrics["outbound_transactions"],
            transaction_count=metrics["transaction_count"],
            total_inflow=metrics["total_inflow"],
            total_outflow=metrics["total_outflow"],
            total_transferred_amount=metrics["total_transferred_amount"],
            component_id=metrics["component_id"],
            metadata=NodeMetadata(
                wallet_number=metrics["wallet_number"],
                phone_number_masked=metrics["phone_number_masked"],
                wallet_type=metrics["wallet_type"],
                balance=metrics["balance"],
                currency=metrics["currency"],
                status=metrics["status"],
                kyc_status=metrics["kyc_status"],
                primary_device_id=metrics["primary_device_id"],
                registered_location_id=metrics["registered_location_id"]
            ),
            risk=RiskMetadata(
                risk_tier=metrics["risk_tier"],
                is_synthetic_mule=metrics["is_synthetic_mule"],
                mule_cluster_role=metrics["mule_cluster_role"],
                suspicious_neighbors_count=metrics["suspicious_neighbors_count"],
                suspicious_neighbor_ids=metrics["suspicious_neighbor_ids"],
                network_concentration_score=metrics["network_concentration"],
                in_cycle=metrics["in_cycle"],
                pagerank=metrics["pagerank"]
            )
        )
        nodes_list.append(node_obj)

    for u, v, key, edata in subgraph.edges(keys=True, data=True):
        edge_obj = GraphEdge(
            id=str(edata.get("id", key)),
            source=str(u),
            target=str(v),
            amount=float(edata.get("amount", 0.0)),
            tx_type=str(edata.get("tx_type", "P2P")),
            timestamp=str(edata.get("timestamp", "")),
            status=str(edata.get("status", "COMPLETED")),
            is_fraud=int(edata.get("is_fraud", 0)),
            is_anomaly=int(edata.get("is_anomaly", 0)),
            pattern_code=edata.get("pattern_code")
        )
        edges_list.append(edge_obj)

    # Graph-level statistics
    graph_metadata = {
        "node_count": len(nodes_list),
        "edge_count": len(edges_list),
        "density": round(float(nx.density(subgraph)), 6) if len(nodes_list) > 1 else 0.0,
        "is_weakly_connected": nx.is_weakly_connected(subgraph) if len(nodes_list) > 1 else True
    }

    return NetworkGraphResponse(
        nodes=nodes_list,
        edges=edges_list,
        total_nodes=len(nodes_list),
        total_edges=len(edges_list),
        graph_metadata=graph_metadata
    )
