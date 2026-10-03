# AGENTS.md — Agent System Guidelines & Codebase Invariants

> **Project Name**: UpayAche  
> **Product**: AI-Powered MFS Risk & Scam Intelligence  
> **Tagline**: *See the risk. Understand the reason. Investigate the network.*  
> **Context**: Student hackathon prototype inspired by DIU CPC × upay AI Hackathon 2026. (NOT an official upay product.)

---

## 1. Prime Directives for AI Agents

1. **Phase-by-Phase Discipline**:
   - Do NOT implement the entire application at once.
   - Work strictly within the active phase requested by the user.
   - Wait for explicit user instruction before advancing to the next phase.
2. **Never Rewrite Working Architecture**:
   - If a feature fails or has a bug, isolate and debug it.
   - Never wipe or rewrite large portions of the project because of an isolated error.
3. **Inspect Before Modifying**:
   - Inspect existing files, understand the data contracts, and reuse existing components.
   - Modify only what is strictly necessary.
   - Run tests and report exact changes clearly.
4. **No Fake or Mock Backend Shortcuts**:
   - Never hardcode dashboard KPI statistics in the frontend.
   - Never create fake mock responses to make the UI look finished. All frontend data must flow through backend APIs and the database.
5. **Synthetic Data & Zero PII**:
   - 100% synthetic MFS data only.
   - Masked phone numbers (`017****1234`). Never use real customer identities or PII.

---

## 2. Core Product Architecture & Flow

```
Synthetic Data
      ↓
Feature Engineering (24-dim velocity, temporal, and graph features)
      ↓
ML Risk Engine (Supervised XGBoost)
      ↓
Behavioral Anomaly Detection (Unsupervised Isolation Forest)
      ↓
Network Analysis (NetworkX directed multigraph, cycles, PageRank)
      ↓
SHAP Explanation (TreeExplainer additive feature attributions)
      ↓
AI Investigation Assistant (Guarded Gemini Copilot via Google GenAI SDK)
      ↓
Analyst Dashboard (Next.js + Tailwind + shadcn/ui + Recharts)
      ↓
Human Investigation & 3D Network Graph (Three.js / React Three Fiber)
      ↓
Case Resolution (OPEN → INVESTIGATING → REVIEWED → CLOSED)
      ↓
Audit / Feedback (Immutable PostgreSQL append-only audit trail)
```

---

## 3. User Roles & Investigation State Machine

### 3.1 User Roles
- **`ADMIN`**: System configuration, threshold tuning, user provisioning, full audit trail.
- **`ANALYST`**: Primary operator. Triages alerts, creates cases, transitions case states, submits notes, runs Gemini assistant.
- **`VIEWER`**: Read-only access to dashboard, transaction ledger, and 3D network view. Blocked from mutations.

### 3.2 Investigation States
Every case strictly follows this state machine:
```
[OPEN] ──> [INVESTIGATING] ──> [REVIEWED] ──> [CLOSED]
                 ▲                                │
                 └────────────────────────────────┘ (Reopened by Admin on new evidence)
```
- Direct transitions like `OPEN` → `CLOSED` without review are strictly forbidden and rejected with `422 Unprocessable Entity`.
- Moving to `CLOSED` requires an explicit resolution: `CONFIRMED_FRAUD`, `FALSE_POSITIVE`, or `SUSPICIOUS_MONITOR`.

---

## 4. AI & Gemini Guardrails (Non-Negotiable)

Gemini is strictly an **Analyst Investigation Copilot**, NOT the fraud classifier.

### Gemini Invariants:
- Gemini only receives **pre-validated, structured JSON evidence** compiled by the backend.
- Gemini responses are strictly constrained to a Pydantic schema using Google GenAI SDK `response_mime_type="application/json"`.
- Gemini MUST NEVER:
  - Execute SQL or database commands.
  - Execute JavaScript or Python code.
  - Transfer money or execute financial transactions.
  - Block, suspend, or modify wallets or account balances.
  - Approve or deny transactions.
  - Modify permissions or user roles.
  - Access API keys, database credentials, or environment secrets.

---

## 5. Technology Stack & Coding Standards

### Frontend (`/frontend`)
- **Framework**: Next.js 14+ (App Router), TypeScript (strict mode, zero `any`).
- **Styling**: Tailwind CSS + shadcn/ui.
- **3D Visualization**: React Three Fiber (`@react-three/fiber`), Three.js, `@react-three/drei`.
- **State & Queries**: Zustand for UI state, TanStack Query for server state.
- **Design Philosophy**: Modern, technical, clean dark fintech aesthetic. Avoid generic AI chatbot appearances, excessive gradients, or toy-like gaming UI.

### Backend (`/backend`)
- **Framework**: FastAPI (Python 3.12), Pydantic v2 for all contracts.
- **Libraries**: Pandas, NumPy, Scikit-learn, XGBoost, NetworkX, SHAP.
- **AI SDK**: Official `google-genai` SDK.
- **Separation of Concerns**:
  - Never put ML logic directly inside FastAPI route files (`/api`).
  - Never put database logic directly inside UI components.
  - Never put Gemini logic directly inside UI components.
  - Keep logic cleanly modularized into `app/services/`, `app/ml/`, `app/graph/`, `app/db/`.

### Database (`/supabase`)
- **Engine**: Supabase PostgreSQL 15+ with Row Level Security (RLS) enabled on all tables.
- **Audit Logging**: `audit_logs` table has no `UPDATE` or `DELETE` policies (immutable append-only).

---

## 6. Directory Map Reference

```
UpayAche/
├── AGENTS.md                       # This instruction file
├── docs/                           # Master Architecture Documentation
│   ├── PRD.md                      # Product requirements, roles, journeys, scopes
│   ├── ARCHITECTURE.md             # System, component, and deployment architecture
│   ├── DATABASE.md                 # Supabase schema, types, DDL, and RLS policies
│   ├── API.md                      # REST endpoints, payloads, and error schemas
│   ├── ML.md                       # Feature engineering, XGBoost, Isolation Forest, SHAP
│   ├── AI.md                       # Gemini copilot, evidence contracts, and guardrails
│   ├── SECURITY.md                 # STRIDE threat model, RBAC, and secrets management
│   ├── QA.md                       # Test suites, boundary conditions, and acceptance matrix
│   └── DEMO.md                     # Hackathon presentation script & demo scenarios
├── backend/                        # FastAPI Python 3.12 Backend
└── frontend/                       # Next.js TypeScript Frontend
```

---

## 7. QA & Testing Protocols

Every phase must include tests before claiming completion:
- Unit tests (`pytest`) for features, ML scoring, and graph algorithms.
- Integration tests for API routes, authentication, and state machine transitions.
- Frontend type checks (`tsc --noEmit`).
- Verify empty states, loading states, error states, and valid states.
