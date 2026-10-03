# UpayAche — AI-Powered MFS Risk & Scam Intelligence

> **Tagline**: *See the risk. Understand the reason. Investigate the network.*  
> **Hackathon Context**: Student hackathon prototype inspired by the DIU CPC × upay AI Hackathon 2026. *(NOT an official upay product.)*

---

## 1. Project Overview

UpayAche is an AI-powered Mobile Financial Services (MFS) risk intelligence and compliance investigation platform designed to analyze synthetic MFS transactions, detect sophisticated financial crime typologies (mule rings, smurfing/structuring, nocturnal cash-outs), explain risk factors via SHAP feature attributions, visualize multi-hop wallet networks in interactive 3D, and assist compliance officers with a guarded AI Copilot.

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

## 2. Repository Structure

```
UpayAche/
├── frontend/                       # Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
├── backend/                        # FastAPI (Python 3.12), Pydantic v2
├── data/                           # Synthetic MFS transaction generators & scenario seeds
├── ml/                             # ML training pipelines, feature extractors, SHAP explainers
├── supabase/                       # Supabase PostgreSQL schema, migrations, and RLS policies
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
├── AGENTS.md                       # Agent system guidelines & codebase invariants
├── .gitignore                      # Git ignore definitions
└── README.md                       # Shared project documentation
```

---

## 3. Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, Three.js, React Three Fiber, Zustand, TanStack Query.
- **Backend**: FastAPI, Python 3.12, Pydantic v2, Pandas, NumPy, Scikit-learn, XGBoost, NetworkX, SHAP.
- **Database**: Supabase PostgreSQL 15+, Supabase Auth, Row Level Security (RLS).
- **AI**: Gemini 1.5 via official Google GenAI SDK (`google-genai`), strictly guarded structured evidence input.

---

## 4. Getting Started (Foundation Phase)

### 4.1 Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Health Check: `http://localhost:8000/health`

### 4.2 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Landing Page: `http://localhost:3000`

---

## 5. Security & Invariants

- **Synthetic Data & Zero PII**: All transactions and customer identities are 100% synthetic. Phone numbers are masked (`017****1234`).
- **Guarded AI**: Gemini operates solely as an analytical investigation copilot; it does not execute transactions, modify balances, or touch the database.
- **Zero Client Secrets**: No database credentials, service-role keys, or Gemini API keys are accessible in the client bundle.
