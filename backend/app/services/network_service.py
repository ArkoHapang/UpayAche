"""
UpayAche — Wallet Network Intelligence Service.
High-performance in-memory graph service managing the transaction NetworkX
multigraph, topological caching, ego-network extraction, and chain tracing.
"""

from typing import Dict, Any, List, Set, Optional
import networkx as nx
from app.graph.builder import load_synthetic_transaction_graph
from app.graph.analysis import (
    calculate_wallet_node_metrics,
    compute_connected_components,
    detect_cycles_in_graph,
    trace_transaction_chains,
    extract_ego_network,
    format_graph_response,
    detect_mule_rings,
    detect_fan_hubs,
    find_shortest_suspicious_path
)
from app.graph.schemas import (
    NetworkGraphResponse,
    WalletNetworkSummary,
    TransactionChain
)


class WalletNetworkService:
    """
    Singleton service managing MFS transaction graph topology,
    caching PageRank & components, and delivering API-ready network responses.
    """

    def __init__(self, G: Optional[nx.MultiDiGraph] = None):
        self._graph: nx.MultiDiGraph = G if G is not None else load_synthetic_transaction_graph()
        self._component_map: Dict[str, int] = {}
        self._component_sizes: Dict[int, int] = {}
        self._cycles: List[List[str]] = []
        self._cycles_set: Set[str] = set()
        self._pagerank_scores: Dict[str, float] = {}

        self._refresh_graph_indices()

    def _refresh_graph_indices(self) -> None:
        """Pre-compute graph-wide indices for fast query responses."""
        # 1. Connected components
        self._component_map, self._component_sizes = compute_connected_components(self._graph)

        # 2. Cycle detection (3-5 hops)
        self._cycles = detect_cycles_in_graph(self._graph, max_cycle_length=5)
        self._cycles_set = {node for cycle in self._cycles for node in cycle}

        # 3. PageRank centrality
        try:
            self._pagerank_scores = nx.pagerank(self._graph, weight="amount", max_iter=100)
        except Exception:
            # Fallback to unweighted or uniform
            self._pagerank_scores = {node: 1.0 / max(1, self._graph.number_of_nodes()) for node in self._graph.nodes()}

    @property
    def graph(self) -> nx.MultiDiGraph:
        """Access raw NetworkX MultiDiGraph."""
        return self._graph

    def get_wallet_metrics(self, wallet_id: str) -> WalletNetworkSummary:
        """Retrieve complete topological metrics for a specific wallet node."""
        if not self._graph.has_node(wallet_id):
            raise KeyError(f"Wallet '{wallet_id}' not found in transaction network")

        raw_metrics = calculate_wallet_node_metrics(
            self._graph,
            wallet_id,
            component_map=self._component_map,
            component_sizes=self._component_sizes,
            cycles_set=self._cycles_set,
            pagerank_scores=self._pagerank_scores
        )

        return WalletNetworkSummary(
            wallet_id=wallet_id,
            wallet_number=raw_metrics["wallet_number"],
            wallet_type=raw_metrics["wallet_type"],
            risk_tier=raw_metrics["risk_tier"],
            degree=raw_metrics["degree"],
            inbound_transactions=raw_metrics["inbound_transactions"],
            outbound_transactions=raw_metrics["outbound_transactions"],
            transaction_count=raw_metrics["transaction_count"],
            total_inflow=raw_metrics["total_inflow"],
            total_outflow=raw_metrics["total_outflow"],
            total_transferred_amount=raw_metrics["total_transferred_amount"],
            network_concentration=raw_metrics["network_concentration"],
            suspicious_neighbors_count=raw_metrics["suspicious_neighbors_count"],
            suspicious_neighbors=raw_metrics["suspicious_neighbors"],
            component_id=raw_metrics["component_id"],
            component_size=raw_metrics["component_size"],
            in_cycle=raw_metrics["in_cycle"],
            pagerank=raw_metrics["pagerank"]
        )

    def get_ego_network(
        self,
        wallet_id: str,
        hops: int = 1,
        max_nodes: int = 50
    ) -> NetworkGraphResponse:
        """
        Extract directed k-hop ego subgraph around wallet and format as API response.
        """
        if not self._graph.has_node(wallet_id):
            raise KeyError(f"Wallet '{wallet_id}' not found in transaction network")

        subgraph = extract_ego_network(self._graph, wallet_id, hops=hops, max_nodes=max_nodes)
        return format_graph_response(
            subgraph,
            component_map=self._component_map,
            component_sizes=self._component_sizes,
            cycles_set=self._cycles_set,
            pagerank_scores=self._pagerank_scores
        )

    def get_full_network(self, limit_nodes: int = 150) -> NetworkGraphResponse:
        """
        Return global network or top nodes by degree.
        """
        if self._graph.number_of_nodes() <= limit_nodes:
            sub = self._graph
        else:
            sorted_nodes = sorted(self._graph.nodes(), key=lambda n: self._graph.degree(n), reverse=True)
            sub = self._graph.subgraph(sorted_nodes[:limit_nodes])

        return format_graph_response(
            sub,
            component_map=self._component_map,
            component_sizes=self._component_sizes,
            cycles_set=self._cycles_set,
            pagerank_scores=self._pagerank_scores
        )

    def get_connected_components_summary(self) -> Dict[str, Any]:
        """Return global connected component breakdown."""
        comps = list(nx.weakly_connected_components(self._graph))
        return {
            "total_components": len(comps),
            "component_sizes": [len(c) for c in comps],
            "largest_component_size": max(len(c) for c in comps) if comps else 0,
            "isolated_wallets_count": sum(1 for c in comps if len(c) == 1)
        }

    def get_circular_layering_cycles(self) -> List[List[str]]:
        """Return detected circular transaction loops."""
        return self._cycles

    def trace_chains(self, wallet_id: str, max_depth: int = 4) -> List[TransactionChain]:
        """Trace forward transaction chains from wallet."""
        raw_chains = trace_transaction_chains(self._graph, wallet_id, max_depth=max_depth)
        res = []
        for c in raw_chains:
            res.append(TransactionChain(
                path_wallets=c["path_wallets"],
                total_hops=c["total_hops"],
                total_amount_transferred=c["total_amount_transferred"],
                transactions=c["transactions"],
                is_suspicious=c["is_suspicious"]
            ))
        return res

    def get_mule_rings(self) -> List[Dict[str, Any]]:
        """Return detected circular mule rings with participant details."""
        return detect_mule_rings(self._graph)

    def get_fan_hubs(self) -> Dict[str, Any]:
        """Return fan-in aggregator and fan-out disperser hubs."""
        in_hubs, out_hubs = detect_fan_hubs(self._graph)
        return {
            "fan_in_hubs": in_hubs,
            "fan_out_hubs": out_hubs,
            "total_fan_in": len(in_hubs),
            "total_fan_out": len(out_hubs)
        }

    def get_shortest_suspicious_path(self, source_wallet_id: str, target_wallet_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Find the shortest path from wallet to target or nearest mule/suspicious wallet."""
        return find_shortest_suspicious_path(self._graph, source_wallet_id, target_wallet_id)

    def get_wallet_node(self, wallet_id: str):
        """Retrieve node profile with connectivity metrics."""
        from app.schemas.network import WalletNodeResponse
        if not self._graph.has_node(wallet_id):
            raise KeyError(f"Wallet '{wallet_id}' not found in transaction network")

        attrs = self._graph.nodes[wallet_id]
        in_degree = self._graph.in_degree(wallet_id)
        out_degree = self._graph.out_degree(wallet_id)
        
        inflow = sum(
            float(d.get("amount", 0.0))
            for _, _, d in self._graph.in_edges(wallet_id, data=True)
        )
        outflow = sum(
            float(d.get("amount", 0.0))
            for _, _, d in self._graph.out_edges(wallet_id, data=True)
        )

        return WalletNodeResponse(
            id=wallet_id,
            wallet_number=attrs.get("wallet_number"),
            phone_number_masked=attrs.get("phone_number_masked"),
            wallet_type=attrs.get("wallet_type", "PERSONAL"),
            risk_tier=attrs.get("risk_tier", "LOW"),
            balance=float(attrs.get("balance", 0.0)),
            in_degree=in_degree,
            out_degree=out_degree,
            total_inflow=inflow,
            total_outflow=outflow
        )

    def get_wallet_neighbors(self, wallet_id: str):
        """Retrieve structured incoming and outgoing neighbors of target wallet."""
        from app.schemas.network import WalletNeighborsResponse, WalletNeighborItem
        if not self._graph.has_node(wallet_id):
            raise KeyError(f"Wallet '{wallet_id}' not found in transaction network")

        in_neighbors = set(self._graph.predecessors(wallet_id))
        out_neighbors = set(self._graph.successors(wallet_id))
        all_neighbors = in_neighbors | out_neighbors

        items: List[WalletNeighborItem] = []
        for n_id in all_neighbors:
            n_attrs = self._graph.nodes[n_id]
            is_in = n_id in in_neighbors
            is_out = n_id in out_neighbors

            if is_in and is_out:
                direction = "MUTUAL"
            elif is_in:
                direction = "INCOMING"
            else:
                direction = "OUTGOING"

            # Aggregate transactions between wallet_id and n_id
            tx_count = 0
            total_amt = 0.0
            for u, v, d in self._graph.edges([wallet_id, n_id], data=True):
                if (u == wallet_id and v == n_id) or (u == n_id and v == wallet_id):
                    tx_count += 1
                    total_amt += float(d.get("amount", 0.0))

            items.append(WalletNeighborItem(
                neighbor_wallet_id=n_id,
                wallet_number=n_attrs.get("wallet_number"),
                phone_number_masked=n_attrs.get("phone_number_masked"),
                direction=direction,
                transaction_count=tx_count,
                total_amount=round(total_amt, 2),
                risk_tier=n_attrs.get("risk_tier", "LOW")
            ))

        items.sort(key=lambda x: x.total_amount, reverse=True)
        return WalletNeighborsResponse(
            wallet_id=wallet_id,
            total_neighbors=len(items),
            neighbors=items
        )

    def get_high_risk_network(self, min_risk: float = 0.65, limit: int = 50):
        """Find high risk nodes in the transaction graph."""
        from app.schemas.network import HighRiskNetworkResponse, WalletNodeResponse
        flagged: List[WalletNodeResponse] = []
        for node, attrs in self._graph.nodes(data=True):
            tier = attrs.get("risk_tier", "LOW")
            if tier in ("HIGH", "CRITICAL"):
                flagged.append(self.get_wallet_node(node))

        flagged.sort(key=lambda w: (w.risk_tier == "CRITICAL", w.in_degree + w.out_degree), reverse=True)
        return HighRiskNetworkResponse(
            total_flagged_wallets=len(flagged),
            high_risk_wallets=flagged[:limit]
        )

    def get_subgraph(self, wallet_ids: Optional[List[str]] = None, depth: int = 1, min_risk: float = 0.0):
        """Extract multi-node neighborhood subgraph."""
        from app.schemas.network import NetworkSubgraphResponse
        if not wallet_ids:
            # Default to top nodes by degree
            sorted_nodes = sorted(self._graph.nodes(), key=lambda n: self._graph.degree(n), reverse=True)
            nodes_to_extract = set(sorted_nodes[:20])
        else:
            nodes_to_extract = set()
            for wid in wallet_ids:
                if self._graph.has_node(wid):
                    nodes_to_extract.add(wid)
                    # expand by depth
                    curr = {wid}
                    for _ in range(depth):
                        nxt = set()
                        for c in curr:
                            nxt.update(self._graph.predecessors(c))
                            nxt.update(self._graph.successors(c))
                        nodes_to_extract.update(nxt)
                        curr = nxt

        sub = self._graph.subgraph(nodes_to_extract)
        nodes_data = []
        for n, attrs in sub.nodes(data=True):
            nodes_data.append({
                "id": n,
                "wallet_number": attrs.get("wallet_number"),
                "phone_masked": attrs.get("phone_number_masked"),
                "risk_tier": attrs.get("risk_tier", "LOW"),
                "degree": sub.degree(n)
            })

        edges_data = []
        for u, v, k, d in sub.edges(data=True, keys=True):
            edges_data.append({
                "source": u,
                "target": v,
                "amount": float(d.get("amount", 0.0)),
                "tx_type": d.get("tx_type", "P2P")
            })

        return NetworkSubgraphResponse(
            nodes=nodes_data,
            edges=edges_data,
            metrics={
                "node_count": len(nodes_data),
                "edge_count": len(edges_data),
                "density": round(nx.density(sub), 4)
            }
        )


_service_singleton: Optional[WalletNetworkService] = None

def get_network_service() -> WalletNetworkService:
    """Retrieve or initialize global WalletNetworkService instance."""
    global _service_singleton
    if _service_singleton is None:
        _service_singleton = WalletNetworkService()
    return _service_singleton
