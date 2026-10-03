"""
UpayAche — Wallet Network Intelligence Graph Schemas.
Pydantic contracts for structured graph topology, node metadata,
risk metadata, edge payloads, and wallet intelligence analytics.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class NodeMetadata(BaseModel):
    """Business & operational metadata for a wallet node."""
    wallet_number: str
    phone_number_masked: str
    wallet_type: str = "PERSONAL"
    balance: float = 0.0
    currency: str = "BDT"
    status: str = "ACTIVE"
    kyc_status: str = "VERIFIED"
    primary_device_id: Optional[str] = None
    registered_location_id: Optional[str] = None


class RiskMetadata(BaseModel):
    """Graph and risk engine intelligence metadata for a wallet node."""
    risk_tier: str = "LOW"
    is_synthetic_mule: bool = False
    mule_cluster_role: Optional[str] = None
    suspicious_neighbors_count: int = 0
    suspicious_neighbor_ids: List[str] = Field(default_factory=list)
    network_concentration_score: float = 0.0 # Herfindahl-Hirschman index (0.0 to 1.0)
    in_cycle: bool = False # Participates in circular money layering
    pagerank: float = 0.0


class GraphNode(BaseModel):
    """Graph node representation representing a financial wallet."""
    id: str # Wallet UUID
    label: str # Display identifier (e.g. wallet_number)
    degree: int = 0
    inbound_transactions: int = 0
    outbound_transactions: int = 0
    transaction_count: int = 0
    total_inflow: float = 0.0
    total_outflow: float = 0.0
    total_transferred_amount: float = 0.0
    component_id: int = 0
    metadata: NodeMetadata
    risk: RiskMetadata


class GraphEdge(BaseModel):
    """Directed graph edge representing a financial transaction between two wallets."""
    id: str # Transaction UUID
    source: str # Sender wallet UUID
    target: str # Receiver wallet UUID
    amount: float
    tx_type: str = "P2P"
    timestamp: str
    status: str = "COMPLETED"
    is_fraud: int = 0
    is_anomaly: int = 0
    pattern_code: Optional[str] = None


class NetworkGraphResponse(BaseModel):
    """API-ready structured transaction graph response for UI / 3D network visualization."""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int
    graph_metadata: Dict[str, Any] = Field(default_factory=dict)


class WalletNetworkSummary(BaseModel):
    """Comprehensive single-wallet topological intelligence summary."""
    wallet_id: str
    wallet_number: str
    wallet_type: str
    risk_tier: str
    degree: int
    inbound_transactions: int
    outbound_transactions: int
    transaction_count: int
    total_inflow: float
    total_outflow: float
    total_transferred_amount: float
    network_concentration: float
    suspicious_neighbors_count: int
    suspicious_neighbors: List[Dict[str, Any]] = Field(default_factory=list)
    component_id: int
    component_size: int
    in_cycle: bool
    pagerank: float


class TransactionChain(BaseModel):
    """Directed transaction path representing multi-hop fund traversal."""
    path_wallets: List[str]
    total_hops: int
    total_amount_transferred: float
    transactions: List[GraphEdge]
    is_suspicious: bool = False
