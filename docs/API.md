# UpayAche — REST API Specification

> **Document Version**: 1.0.0  
> **Status**: Approved Architecture Baseline  
> **Base URL**: `/api/v1`  
> **Protocol**: HTTPS / REST JSON  
> **Auth Scheme**: Bearer JWT (`Authorization: Bearer <supabase_access_token>`)

---

## 1. Authentication & Role-Based Access Control

All requests to `/api/v1/*` (except health check) must include a valid Supabase Auth Bearer token in the `Authorization` header.

The backend middleware decodes the JWT, queries `public.profiles`, and resolves the user's role:
- **`ADMIN`**: Full access to all read, write, update, delete, configuration, and audit endpoints.
- **`ANALYST`**: Full operational access (create cases, update states `OPEN` → `INVESTIGATING` → `REVIEWED` → `CLOSED`, add notes, run Gemini assistant).
- **`VIEWER`**: Read-only access to transactions, risk scores, 3D network, and dashboards. Write/mutation actions return `403 Forbidden`.

---

## 2. Standard Response & Error Envelope

### 2.1 Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-10-02T02:00:00Z",
    "request_id": "req-18a7c9f"
  }
}
```

### 2.2 Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "User role 'VIEWER' is not permitted to mutate case status.",
    "details": []
  },
  "metadata": {
    "timestamp": "2026-10-02T02:00:00Z",
    "request_id": "req-18a7c9f"
  }
}
```

---

## 3. Endpoints Overview (Phase 9 Implementation)

| Module | Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Health** | `GET` | `/health` | Public | Root health check & system status |
| **Health** | `GET` | `/api/v1/health` | Public | API v1 versioned health check |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Authenticate user, issue Bearer token & role |
| **Auth** | `GET` | `/api/v1/auth/me` | All Roles | Current user identity & active role |
| **Transactions** | `GET` | `/api/v1/transactions` | All Roles | Paginated transaction ledger with filters |
| **Transactions** | `GET` | `/api/v1/transactions/{id}` | All Roles | Single transaction details by UUID or hash |
| **Transactions** | `POST` | `/api/v1/transactions/analyze` | `ADMIN`, `ANALYST` | Real-time ML ingestion & SHAP evaluation |
| **Risk** | `GET` | `/api/v1/risk/summary` | All Roles | Aggregate risk KPIs, counts, and fraud rate |
| **Risk** | `GET` | `/api/v1/risk/high-risk` | All Roles | High & critical risk transaction feed |
| **Risk** | `GET` | `/api/v1/risk/trends` | All Roles | Time-series risk volume & anomaly trends |
| **Risk** | `GET` | `/api/v1/risk/{transaction_id}`| All Roles | Full risk, anomaly, & SHAP feature breakdown |
| **Risk** | `POST` | `/api/v1/risk/score` | All Roles | Dual ML scoring (XGBoost + Isolation Forest) |
| **Risk** | `POST` | `/api/v1/risk/explain` | All Roles | Local SHAP TreeExplainer attributions |
| **Network** | `GET` | `/api/v1/network/wallet/{id}` | All Roles | Wallet topological node profile & degree |
| **Network** | `GET` | `/api/v1/network/wallet/{id}/neighbors` | All Roles | Direct counterparty neighbors & flow direction |
| **Network** | `GET` | `/api/v1/network/high-risk` | All Roles | High-risk nodes & suspicious mule clusters |
| **Network** | `GET` | `/api/v1/network/subgraph` | All Roles | Multi-node neighborhood subgraph extraction |
| **Network** | `GET` | `/api/v1/network/graph/{wallet_id}` | All Roles | Ego-network subgraph for 3D visualizer |
| **Network** | `GET` | `/api/v1/network/metrics/{wallet_id}` | All Roles | Deep topological metrics & PageRank |
| **Network** | `GET` | `/api/v1/network/components` | All Roles | Weakly connected component statistics |
| **Network** | `GET` | `/api/v1/network/cycles` | All Roles | Circular layering loops (3-5 hops) |
| **Network** | `GET` | `/api/v1/network/chains/{wallet_id}` | All Roles | Forward multi-hop transaction flow chains |
| **Investigations**| `GET` | `/api/v1/investigations` | All Roles | List investigation cases by status/priority |
| **Investigations**| `POST`| `/api/v1/investigations` | `ADMIN`, `ANALYST` | Open new case (Status: `OPEN`) |
| **Investigations**| `GET` | `/api/v1/investigations/{id}` | All Roles | Get case details and chronological notes |
| **Investigations**| `PATCH`| `/api/v1/investigations/{id}` | `ADMIN`, `ANALYST` | State transition: `OPEN` → `INVESTIGATING` → `REVIEWED` → `CLOSED` |
| **Investigations**| `POST`| `/api/v1/investigations/{id}/notes` | `ADMIN`, `ANALYST` | Append analyst or AI finding note |
| **AI** | `POST` | `/api/v1/ai/investigate` | `ADMIN`, `ANALYST` | Guarded Gemini Copilot investigation synthesis |

---

## 4. Endpoint Specifications

### 4.1 Ingestion & Risk Scoring

#### `POST /api/v1/risk/score`
Computes real-time risk evaluation using XGBoost, Isolation Forest, and SHAP.

**Request Body (`application/json`)**:
```json
{
  "tx_hash": "TX-89211",
  "sender_wallet_id": "W-9812",
  "receiver_wallet_id": "W-AGT-03",
  "tx_type": "CASH_OUT",
  "amount": 24500.00,
  "fee": 45.00,
  "timestamp": "2026-10-02T02:14:00Z"
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "transaction_id": "e2a34b22-8411-4f1b-8711-cf23490b8f01",
    "risk_score": 0.92,
    "risk_level": "CRITICAL",
    "ml_score": 0.89,
    "anomaly_score": 0.85,
    "top_factors": [
      {
        "feature": "velocity_1h_ratio",
        "label": "Abnormal 1-hour transaction surge",
        "attribution": 0.38,
        "direction": "RISK_INCREASE"
      },
      {
        "feature": "night_time_cashout",
        "label": "High-value nocturnal cash-out",
        "attribution": 0.24,
        "direction": "RISK_INCREASE"
      },
      {
        "feature": "network_degree_centrality",
        "label": "High fan-in connectivity",
        "attribution": 0.18,
        "direction": "RISK_INCREASE"
      }
    ],
    "graph_metrics": {
      "sender_in_degree": 8,
      "sender_out_degree": 1,
      "cycle_detected": false,
      "mule_cluster_probability": 0.87
    }
  }
}
```

---

### 4.2 Network Graph Payload (for Three.js / React Three Fiber)

#### `GET /api/v1/network/graph?depth=2&min_risk=0.50&limit=250`
Returns nodes and directed links optimized for 3D force-directed layout.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "W-9812",
        "phone_masked": "017****9812",
        "type": "PERSONAL",
        "risk_tier": "CRITICAL",
        "risk_score": 0.92,
        "balance": 500.00,
        "total_volume_in": 196000.00,
        "total_volume_out": 195500.00
      },
      {
        "id": "W-AGT-03",
        "phone_masked": "018****0003",
        "type": "AGENT",
        "risk_tier": "MEDIUM",
        "risk_score": 0.45,
        "balance": 820000.00,
        "total_volume_in": 1250000.00,
        "total_volume_out": 980000.00
      }
    ],
    "links": [
      {
        "source": "W-9812",
        "target": "W-AGT-03",
        "tx_hash": "TX-89211",
        "tx_type": "CASH_OUT",
        "amount": 24500.00,
        "risk_level": "CRITICAL",
        "timestamp": "2026-10-02T02:14:00Z"
      }
    ],
    "metrics": {
      "total_nodes": 48,
      "total_edges": 72,
      "detected_clusters": 3
    }
  }
}
```

---

### 4.3 Investigation Case State Transitions

#### `PATCH /api/v1/cases/{id}/status`
Transitions a case between valid states: `OPEN`, `INVESTIGATING`, `REVIEWED`, `CLOSED`.

**Request Body (`application/json`)**:
```json
{
  "status": "INVESTIGATING",
  "resolution": "PENDING",
  "analyst_comment": "Claimed for deep-dive. Discovered fan-in mule structuring on 3D visualizer."
}
```

**State Transition Rules**:
- `OPEN` → `INVESTIGATING` (Allowed for `ANALYST`, `ADMIN`)
- `INVESTIGATING` → `REVIEWED` (Allowed for `ANALYST`, `ADMIN`)
- `REVIEWED` → `CLOSED` (Allowed for `ANALYST`, `ADMIN`; requires `resolution` ≠ `PENDING`)
- `CLOSED` → `INVESTIGATING` (Allowed for `ADMIN` only; re-opening case upon new evidence)
- Invalid transitions (e.g., `OPEN` → `CLOSED` directly without review) return `422 Unprocessable Entity`.

---

### 4.4 Guarded Gemini Assistant Endpoint

#### `POST /api/v1/assistant/investigate`
Synthesizes pre-validated structured evidence using Gemini 1.5.

**Request Body (`application/json`)**:
```json
{
  "case_id": "c7a8b901-1234-4567-890a-bcdef0123456",
  "focus_area": "MULE_STRUCTURING_ANALYSIS"
}
```

**Internal Backend Evidence Assembly**:
The backend assembles:
1. Transaction details: Amount, Type, Timestamp, Fees.
2. Top 3 SHAP drivers: Features and attribution values.
3. 2-Hop Network Summary: In-degree, out-degree, mule probability score.
4. Historical baselines: 30-day mean amount, typical transaction hours.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "executive_summary": "High probability structuring pattern identified. Wallet 017****9812 accumulated ৳196,000 via 8 micro-transfers right under the ৳25,000 threshold within 45 minutes, immediately followed by nocturnal cash-out.",
    "typology_hypothesis": "MULE_STRUCTURING_AND_CASH_OUT",
    "confidence_level": "HIGH",
    "key_suspicious_indicators": [
      "Rapid succession of P2P inflows from distinct unlinked wallets",
      "99.7% of aggregated funds liquidated via Agent Cash-Out within 1 hour",
      "Timing between 2:00 AM and 4:30 AM deviates by 4.2σ from user's historical profile"
    ],
    "recommended_actions": [
      "Verify KYC identity of receiver Agent W-AGT-03",
      "Place temporary 24-hour observation hold on sender wallet W-9812",
      "Correlate IP/device fingerprint of incoming P2P senders"
    ]
  }
}
```
