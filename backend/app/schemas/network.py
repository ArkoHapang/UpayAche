"""
UpayAche — Network Topology & Graph Schemas.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class WalletNodeResponse(BaseModel):
    id: str
    wallet_number: Optional[str] = None
    phone_number_masked: Optional[str] = None
    wallet_type: str = "PERSONAL"
    risk_tier: str = "LOW"
    balance: float = 0.0
    in_degree: int = 0
    out_degree: int = 0
    total_inflow: float = 0.0
    total_outflow: float = 0.0


class WalletNeighborItem(BaseModel):
    neighbor_wallet_id: str
    wallet_number: Optional[str] = None
    phone_number_masked: Optional[str] = None
    direction: str = Field(..., description="INCOMING, OUTGOING, or MUTUAL")
    transaction_count: int
    total_amount: float
    risk_tier: Optional[str] = "LOW"


class WalletNeighborsResponse(BaseModel):
    wallet_id: str
    total_neighbors: int
    neighbors: List[WalletNeighborItem]


class HighRiskNetworkResponse(BaseModel):
    total_flagged_wallets: int
    high_risk_wallets: List[WalletNodeResponse]


class NetworkSubgraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    metrics: Dict[str, Any]
