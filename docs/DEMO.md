# UpayAche — Live Demonstration Script & Presentation Playbook

> **Target Duration**: 3–5 Minutes  
> **Audience**: Hackathon Judges, FinTech Specialists, DIU CPC × upay AI Evaluation Panel  
> **Core Narrative**: **DETECT** $\rightarrow$ **EXPLAIN** $\rightarrow$ **VISUALIZE** $\rightarrow$ **INVESTIGATE** $\rightarrow$ **HUMAN ACTION** $\rightarrow$ **CUSTOMER AI**

---

## 1. 20-Step Live Demonstration Playbook

| Step # | Screen / Route | Action to Perform | What Judges See / Key Narrative |
| :---: | :--- | :--- | :--- |
| **01** | `/` (Landing Page) | Open hero banner and show architecture flow | Upay-inspired fintech UI, 100% synthetic data notice, zero real customer PII. |
| **02** | `/login` (Analyst Login) | Click **`ANALYST`** in the One-Click Role Switcher | Instant role-based JWT authentication, green verified session card. |
| **03** | `/dashboard` (Dashboard) | View real-time KPI metrics & Recharts graphs | 2,400+ monitored transactions, XGBoost alert spikes, 7-day volume & anomaly curves. |
| **04** | `/transactions/e1000000-0000-0000-0000-000000002128` | Click top alert `tx_lg_002131_9d63bd` in priority table | High-risk BDT 49,800.00 P2P transfer between masked wallets `017****2832` $\rightarrow$ `015****9004`. |
| **05** | Transaction Workbench | Highlight **Risk Score: 0.994** | Numerical fraud probability from supervised XGBoost engine (NOT an LLM guess). |
| **06** | Transaction Workbench | Inspect **SHAP Waterfall Attribution Chart** | Exact mathematical factors: `amount` (+5.786), `amount_deviation` (+1.129), `velocity_5min`. |
| **07** | Transaction Workbench | Inspect **Behavioral Anomaly Result** | Unsupervised Isolation Forest outlier detection: 98.4% anomaly confidence. |
| **08** | Transaction Workbench | Scroll to **Network Intelligence** section | Shows counterparty metrics, degree centrality, and connected wallet count. |
| **09** | `/network` | Inspect suspicious wallet connections | Identifies Aggregator Mule `c1000000-0000-0000-0000-000000000149` (`W-PERS-0149`). |
| **10** | `/network/c1000000-0000-0000-0000-000000000149` | Orbit & rotate the **3D WebGL Multi-Graph** | 7 outer amber `FEEDER_SMURF` nodes funneling funds into central crimson aggregator node. |
| **11** | `/investigations` | Open docket case `CASE-2026-1006` | Status initialized as **`OPEN`** (Priority: `CRITICAL`). |
| **12** | Investigation Workspace | Click **"Synthesize Evidence"** (Gemini Copilot) | Guarded AI copilot produces structured dossier: `MULE_STRUCTURING_AND_CASH_OUT` typology. |
| **13** | Investigation Workspace | Type & save **Analyst Note** | `"Confirmed smurfing pattern via 3D graph and SHAP velocity metrics. Recommending agent KYC inspection."` |
| **14** | Investigation Workspace | Transition: `OPEN` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `REVIEWED` $\rightarrow$ `CLOSED` | Strict state machine enforcement; resolution chosen: `CONFIRMED_FRAUD`. |
| **15** | Investigation Workspace | Click **Audit Trail** tab | Immutable, timestamped record proving analyst ID, action, state change, and resolution. |
| **16** | `/chat` | Open **Customer AI Assistant** | Public risk copilot with official helpline `16268` and knowledge topics. |
| **17** | `/chat` | Ask: *"Someone called asking for my upay OTP. Should I share it?"* | Immediate warning: never share OTP or PIN; explanation of phone phishing tactics. |
| **18** | `/chat` | Ask: *"কে একজন ফোন করে আমার উপায়ের ওটিপি চেয়েছে, আমি কি তা দেব?"* | Fluent, grounded Bengali explanation with actionable safety steps. |
| **19** | `/chat` | Click citation pill below response | Grounded source displayed: **OTP & PIN Phishing Defense Playbook** (`SCAM_AWARENESS`). |
| **20** | `/dashboard` | Click **"Dashboard"** in sidebar | Returns to central console showing updated closed case statistics and live pipeline. |

---

## 2. Deterministic Synthetic Demo IDs

Use these exact IDs during the live presentation for 100% predictable outcomes:

| Item | Identifier / Value | Description |
| :--- | :--- | :--- |
| **Primary Transaction** | `e1000000-0000-0000-0000-000000002128`<br>(Hash: `tx_lg_002131_9d63bd`) | BDT 49,800.00 P2P, Risk Score: **0.994** (CRITICAL), Anomaly: **True** |
| **Sender Wallet** | `c1000000-0000-0000-0000-000000000080`<br>(Masked: `017****2832`) | Personal wallet with sudden high-velocity volume deviation |
| **Receiver Wallet** | `c1000000-0000-0000-0000-000000000076`<br>(Masked: `015****9004`) | Destination wallet |
| **Aggregator Mule** | `c1000000-0000-0000-0000-000000000149`<br>(Wallet: `W-PERS-0149`) | Central smurfing node with 7 `FEEDER_SMURF` wallets connected in 3D canvas |
| **Primary Case** | `CASE-2026-1006`<br>(UUID: `78860497-57be-585d-b3e1-29d632efb546`) | Initial status: `OPEN`, Priority: `CRITICAL` |

---

## 3. Demo Data Reset Mechanism

Before presenting or between rehearsals, you can reset the entire system back to the pristine initial synthetic state in two ways:

### Option A: From the UI (Recommended)
1. Go to **`/settings`** (or click Settings in sidebar).
2. Click **"Reset Demo Data"** in the top action bar.
3. All cases, state machine transitions, notes, and audit logs revert immediately to pristine initial values.

### Option B: Via REST API
```bash
curl -X POST http://localhost:8000/api/v1/investigations/reset-demo \
  -H "Authorization: Bearer test-admin-token"
```

---

## 4. Judges' Q&A Cheat Sheet

| Question | Winning Answer |
| :--- | :--- |
| *Does Gemini score the transactions?* | **No.** XGBoost scores numerical fraud probability (0.00–1.00), Isolation Forest flags behavioral anomalies, and NetworkX measures graph centrality. Gemini operates strictly as an analyst investigation copilot that receives structured mathematical evidence. |
| *How is customer privacy protected?* | **100% synthetic dataset** generated for Bangladesh MFS patterns. All phone numbers are masked (`017****1234`). No real PII exists anywhere in the database or UI. |
| *Can an analyst accidentally skip review?* | **No.** Direct transitions like `OPEN` $\rightarrow$ `CLOSED` are rejected with `422 Unprocessable Entity` by our strict state machine service. Every state change is immutably logged to an append-only audit trail. |
| *What happens if Google GenAI is offline?* | The backend includes an instant deterministic fallback engine that synthesizes the exact structured evidence schema within 5ms. |

