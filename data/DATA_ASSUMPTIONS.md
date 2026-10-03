# UpayAche — Synthetic Data Generation Assumptions & Guidelines

> **Document Version**: 1.0.0  
> **Applicability**: Synthetic MFS Data Engine & Evaluation Datasets  
> **Guiding Principle**: Realistic Bangladesh MFS Dynamics, Controlled Typologies, Zero Customer PII.

---

## 1. Privacy, Security & Zero-PII Invariants

1. **Synthetic Phone Numbers (MSISDNs)**:
   - All mobile numbers follow the standard Bangladesh telecom prefixes (`017`, `018`, `019`, `016`, `015`, `013`), but are strictly masked in the format `01X****YYYY` (e.g. `017****4101`).
   - No real subscriber MSISDNs, SIM card IMSIs, or CDR telemetry are used.
2. **Zero Government Identity Data**:
   - No real National Identity (NID), Smart NID, Birth Registration, or Passport numbers are included or simulated.
3. **Zero Financial Account PII**:
   - No real bank accounts, routing numbers, credit card numbers, or proprietary upay customer account records are utilized.

---

## 2. Bangladesh MFS Ecosystem & Regulatory Assumptions

The synthetic data model mirrors Bangladesh Bank (BFIU) regulatory guidelines and market realities:

1. **Transaction Channels**:
   - `P2P`: Peer-to-peer wallet transfer (standard consumer send money).
   - `CASH_IN`: Cash deposit into customer wallet performed at an authorized agent point.
   - `CASH_OUT`: Cash withdrawal from customer wallet performed at an agent POS terminal.
   - `PAYMENT`: Merchant purchase QR or online payment.
   - `RECHARGE`: Mobile airtime top-up.

2. **Fee Structures (in BDT)**:
   - `P2P`: ৳0 for transactions $\le$ ৳500; ৳5.00 flat fee for transactions > ৳500.
   - `CASH_OUT`: Standard app fee modeled at $1.49\%$ (৳14.90 per ৳1,000) or $1.80\%$ via USSD.
   - `CASH_IN` & `PAYMENT`: ৳0.00 fee to the sending customer.

3. **Regulatory AML/CFT Structuring Thresholds**:
   - Single P2P transfer threshold: ৳25,000 BDT.
   - Daily velocity threshold: ৳50,000 BDT.
   - Illicit actors systematically structure payments just below these limits (e.g., ৳24,500 to ৳24,950 BDT) to evade automated CTR (Currency Transaction Report) alerts.

4. **Temporal Context & Working Week**:
   - **Weekends**: In Bangladesh, Friday and Saturday are officially observed weekend days. Illicit smurfing and cash-outs disproportionately spike during weekend and nocturnal off-peak hours when human compliance desks are reduced.
   - **Nocturnal Dead Hours**: Legitimate retail and peer transfers overwhelmingly occur between 08:00 AM and 10:00 PM. High-value cash-outs occurring between 01:00 AM and 05:00 AM carry a very high correlation with fraudulent activity.

---

## 3. Account Distribution & Entity Assumptions

Synthetic universe generation assumes:
1. **Wallet Distribution**:
   - **Personal Consumer Wallets (70%)**: Balances ranging from ৳250 to ৳35,000 BDT. Low baseline velocity (1–4 transfers/day).
   - **Agent Wallets (18%)**: Liquidity balances ranging from ৳150,000 to ৳650,000 BDT. High cash-in and cash-out throughput.
   - **Merchant Wallets (6%)**: Commercial accounts processing consumer purchases with settlement cycles ($T+1$ or realtime).
   - **Syndicate & Mule Wallets (6%)**: Divided into *Feeder Smurfs* (multiple feeder accounts) and *Aggregator Mules* (collection hubs with immediate high-percentage cash-out).

2. **Device Hardware Telemetry**:
   - Consumer accounts primarily use standard unrooted Android (Samsung, Xiaomi, Realme, Vivo) and iOS devices with low device risk scores ($\le 0.10$).
   - Fraud syndicate accounts frequently execute transfers from low-cost rooted Android burner devices or emulators with high device risk scores ($\ge 0.80$).

3. **Geographic Distribution**:
   - 80%+ of transactions originate from major urban commercial centers (Dhaka divisions: Dhanmondi, Mirpur, Gulshan, Motijheel; Chittagong Agrabad; Sylhet Zindabazar).
   - Controlled border-zone anomalies are concentrated in high-risk border corridors (e.g., Teknaf, Benapole).

---

## 4. Controlled Suspicious Typologies & Ground Truth Labeling

Every generated record is labeled with:
- `is_fraud`: `0` for normal baseline traffic; `1` for injected typologies (Patterns 2–12).
- `is_anomaly`: `0` for normal baseline; `1` for behavioral outliers.
- `pattern_id`: Explicit integer identifier (1 to 12) for granular recall analysis.

### Injected Typology Invariants
| Pattern | Typology | Invariant Rule |
| :--- | :--- | :--- |
| **P1** | Normal Baseline | Daytime (08:00–22:00), regular device, amounts ৳150–৳4,500. |
| **P2** | Unusually Large | Amount > 10x 30-day average, clustering near ৳25K/৳50K limits. |
| **P3** | High Velocity | $\ge 5$ transfers within 15 minutes from same sender. |
| **P4** | New Device | Unregistered, rooted hardware fingerprint (`device_risk_score > 0.80`). |
| **P5** | New Recipient | First-time transfer to unseen wallet followed by rapid outbound liquidation. |
| **P6** | Unusual Time | Significant transfer between 01:00 AM and 05:00 AM. |
| **P7** | Unusual Location | High-risk border crossing jurisdiction (e.g., Teknaf outpost). |
| **P8** | Behavioral Change | Dormant wallet suddenly reactivates with 100% balance depletion. |
| **P9** | Fan-In Mule | 3–10 feeders funneling structured amounts to 1 aggregator within 30 min. |
| **P10** | Suspicious Chain | Multi-hop circular loop ($A \to B \to C \to A$) with fund retention $> 95\%$. |
| **P11** | Repeated Transfers | Burst of identical BDT amounts (e.g., ৳4,999 sent 4 times within minutes). |
| **P12** | Scam Syndicate | End-to-end chain: victim $\to$ mule feeder $\to$ aggregator $\to$ agent cash-out. |

---

## 5. Train/Test Split & Anti-Leakage Protocol

1. **Chronological Splitting**:
   - Training (`data/processed/train_features.csv`, 80%) and Test (`data/processed/test_features.csv`, 20%) sets are split strictly chronologically by transaction timestamp.
   - Random shuffling across time is strictly prohibited to prevent look-ahead bias in velocity features.
2. **Reproducibility**:
   - Deterministic seed generation ensures exact byte-level reproducibility across development environments.
