# UpayAche — Synthetic MFS Data Dictionary

> **Dataset Release**: 1.0.0 (Synthetic Baseline)  
> **Target Currency**: Bangladeshi Taka (BDT, ৳)  
> **PII Policy**: 100% Synthetic. Zero Customer PII. Masked MSISDNs (`017****1234`).  
> **Directory Locations**: `data/synthetic/`, `data/raw/`, `data/processed/`

---

## 1. Entities & Schema Specifications

### 1.1 `wallets.csv` (Synthetic MFS Wallets)
Path: `data/synthetic/wallets.csv`

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID (RFC 4122) | `c1000000-0000-0000-0000-000000000001` | Unique wallet primary key |
| `wallet_number` | String | `W-PERS-0001` | Human-readable account reference code |
| `phone_number_masked` | String | `017****4101` | Masked MSISDN mobile account identifier |
| `wallet_type` | Enum | `PERSONAL` | Account classification (`PERSONAL`, `AGENT`, `MERCHANT`) |
| `risk_tier` | Enum | `LOW` | Operational risk band (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `balance` | Float | `12450.00` | Account balance in BDT (>= 0.00) |
| `currency` | String | `BDT` | Fiat currency |
| `status` | Enum | `ACTIVE` | Operational status (`ACTIVE`, `SUSPENDED`, `WATCHLIST`, `FROZEN`) |
| `kyc_status` | Enum | `VERIFIED` | Regulatory compliance verification status (`VERIFIED`, `FLAGGED`, `PENDING`) |
| `primary_device_id` | UUID | `d1000000-0000-0000-0000-000000000002` | Foreign key referencing `devices.csv` |
| `registered_location_id`| UUID | `b1000000-0000-0000-0000-000000000001` | Foreign key referencing `locations.csv` |
| `is_synthetic_mule` | Boolean | `False` | Ground truth evaluation indicator for mule syndicate accounts |
| `mule_cluster_role` | Enum | `NONE` | Role within fraud network (`NONE`, `FEEDER_SMURF`, `AGGREGATOR_CASHOUT`) |

---

### 1.2 `transactions.csv` / `raw_transactions_stream.csv`
Paths: `data/synthetic/transactions.csv`, `data/raw/raw_transactions_stream.csv`

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID (RFC 4122) | `e1000000-0000-0000-0000-000000000001` | Unique transaction primary key |
| `tx_hash` | String | `tx_norm_000001_a8f902` | Cryptographic reference hash |
| `sender_wallet_id` | UUID | `c1000000-0000-0000-0000-000000000007` | Originating debtor wallet ID |
| `receiver_wallet_id` | UUID | `c1000000-0000-0000-0000-000000000010` | Beneficiary creditor wallet ID |
| `tx_type` | Enum | `P2P` | Transaction channel (`P2P`, `CASH_IN`, `CASH_OUT`, `PAYMENT`, `RECHARGE`) |
| `amount` | Float | `24500.00` | Principal amount transferred in BDT |
| `fee` | Float | `5.00` | Transaction fee in BDT |
| `status` | Enum | `COMPLETED` | Processing status (`COMPLETED`, `FLAGGED`, `REJECTED`) |
| `device_id` | UUID | `d1000000-0000-0000-0000-000000000001` | Foreign key referencing `devices.csv` |
| `location_id` | UUID | `b1000000-0000-0000-0000-000000000005` | Foreign key referencing `locations.csv` |
| `timestamp` | ISO-8601 String | `2026-01-28T02:45:12+00:00` | UTC timestamp of transaction execution |
| `pattern_id` | Int | `9` | Controlled pattern index (1–12) |
| `pattern_code` | String | `FAN_IN_MULE` | Short machine identifier for pattern |
| `pattern_name` | String | `Multiple Wallets Connected to One (Smurfing)` | Human-readable pattern name |
| `is_fraud` | Int (0 or 1) | `1` | Supervised binary classification ground truth target |
| `is_anomaly` | Int (0 or 1) | `1` | Unsupervised anomaly ground truth target |
| `scenario_id` | String | `SMURFING_RING_W-MULE-0010` | Multi-transaction scenario correlation group |

---

### 1.3 `devices.csv` (Terminal Telemetry)
Path: `data/synthetic/devices.csv`

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | `d1000000-0000-0000-0000-000000000001` | Unique device identifier |
| `device_fingerprint` | String | `fp_samsung_galaxy_a54_5g_0001` | Hardware terminal signature hash |
| `device_type` | Enum | `SMARTPHONE` | Device category (`SMARTPHONE`, `POS`, `WEB`) |
| `os` | Enum | `ANDROID` | Operating system (`ANDROID`, `IOS`, `ANDROID_EMBEDDED`, `WINDOWS`, `LINUX`, `MACOS`) |
| `model` | String | `Samsung Galaxy A54 5G` | Commercial hardware model name |
| `app_version` | String | `3.4.1` | Installed mobile client application build |
| `is_rooted_or_jailbroken` | Boolean | `False` | Root privilege escalation detection |
| `device_risk_score` | Float | `0.05` | Normalized hardware risk score (0.0 to 1.0) |

---

### 1.4 `locations.csv` (Geolocation & Regional Risk)
Path: `data/synthetic/locations.csv`

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | `b1000000-0000-0000-0000-000000000001` | Unique location identifier |
| `location_code` | String | `LOC-DHK-DHN` | Location administrative code |
| `division` | String | `Dhaka` | Bangladesh Division |
| `district` | String | `Dhaka` | Bangladesh District (Zila) |
| `thana_or_upazila` | String | `Dhanmondi` | Thana / Police station jurisdiction |
| `latitude` | Float | `23.7461` | GPS latitude |
| `longitude` | Float | `90.3742` | GPS longitude |
| `ip_subnet` | String | `103.205.71.0/24` | Associated IP subnet prefix |
| `is_high_risk_zone` | Boolean | `False` | High-risk border / smuggling corridor marker |

---

### 1.5 `merchants.csv` (Verified Merchants)
Path: `data/synthetic/merchants.csv`

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | `m1000000-0000-0000-0000-000000000001` | Unique merchant identifier |
| `merchant_code` | String | `MRCH-BD-0001` | Commercial merchant code |
| `merchant_name` | String | `Shwapno Superstore` | Synthetic retail merchant name |
| `business_category` | String | `SUPERMARKET_GROCERY` | Operational category |
| `mcc_code` | Int | `5411` | Merchant Category Code (ISO 18245) |
| `daily_volume_limit` | Float | `1000000.00` | Approved daily transaction quota in BDT |
| `settlement_cycle` | String | `T+1` | Clearing schedule (`T+0`, `T+1`, `REALTIME`) |
| `kyc_verified` | Boolean | `True` | Complete corporate documentation verified |

---

### 1.6 `wallet_relationships.csv` (Network Graph Edges)
Path: `data/synthetic/wallet_relationships.csv`

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | `c2000000-0000-0000-0000-000000000001` | Unique edge identifier |
| `source_wallet_id` | UUID | `c1000000-0000-0000-0000-000000000007` | Sender wallet node |
| `target_wallet_id` | UUID | `c1000000-0000-0000-0000-000000000010` | Receiver wallet node |
| `connection_type` | Enum | `FAN_IN_MULE` | Topology role (`DIRECT_TRANSFER`, `CIRCULAR_LOOP`, `FAN_IN_MULE`, `FAN_OUT_DISPERSAL`) |
| `total_tx_count` | Int | `3` | Aggregated count of transfers between pair |
| `total_volume` | Float | `73950.00` | Cumulative BDT volume exchanged |
| `first_interaction_at`| ISO-8601 String | `2026-01-28T02:45:12+00:00` | Timestamp of first transfer |
| `last_interaction_at` | ISO-8601 String | `2026-01-28T02:58:10+00:00` | Timestamp of most recent transfer |
| `is_part_of_cycle` | Boolean | `False` | Graph cycle membership (circular laundering) |
| `risk_weight` | Float | `0.85` | Normalized edge risk weight (0.0 to 1.0) |

---

### 1.7 `dataset_labeled_features.csv` (24-Dimensional ML Feature Matrix)
Path: `data/processed/dataset_labeled_features.csv`

| Column | Type | Category | Description |
| :--- | :--- | :--- | :--- |
| `transaction_id` | UUID | Identifier | Foreign key referencing transactions |
| `amount` | Float | Temporal/Amount | Transaction amount in BDT |
| `log_amount` | Float | Temporal/Amount | $\log(1 + \text{amount})$ |
| `fee_ratio` | Float | Temporal/Amount | $\text{fee} / \text{amount}$ |
| `hour_of_day` | Int | Temporal/Amount | Hour of day (0–23) |
| `is_night` | Int (0/1) | Temporal/Amount | 1 if hour between 23:00 and 05:00 else 0 |
| `is_weekend` | Int (0/1) | Temporal/Amount | 1 if Friday or Saturday in BD else 0 |
| `tx_type_code` | Int | Temporal/Amount | Ordinal encoding (`P2P: 0, CASH_IN: 1, CASH_OUT: 2, PAYMENT: 3, RECHARGE: 4`) |
| `tx_count_1h` | Int | Velocity | Transaction count in trailing 1h window |
| `tx_count_24h` | Int | Velocity | Transaction count in trailing 24h window |
| `sum_amount_1h` | Float | Velocity | Total BDT moved in trailing 1h |
| `sum_amount_24h` | Float | Velocity | Total BDT moved in trailing 24h |
| `amount_to_hist_avg` | Float | Velocity | Current amount vs sender's 30-day baseline average |
| `cashout_velocity_ratio` | Float | Velocity | Immediate cashout liquidation ratio |
| `p2p_inflow_count_1h` | Int | Velocity | Distinct P2P inflows received in trailing 1h |
| `time_since_last_tx` | Float | Velocity | Elapsed seconds since sender's previous transaction |
| `balance_depletion_ratio`| Float | Velocity | Ratio of account balance depleted by this transaction |
| `structuring_proximity`| Float | Velocity | Distance to nearest AML reporting threshold (৳25K/৳50K) |
| `in_degree` | Int | Network Topology | In-degree count of sender in transaction multigraph |
| `out_degree` | Int | Network Topology | Out-degree count of sender in transaction multigraph |
| `degree_ratio` | Float | Network Topology | $(\text{in\_degree} + 1) / (\text{out\_degree} + 1)$ |
| `pagerank` | Float | Network Topology | NetworkX PageRank centrality score |
| `ego_clustering_coef`| Float | Network Topology | Local clustering coefficient of 1-hop neighborhood |
| `in_cycle_3` | Int (0/1) | Network Topology | 1 if wallet belongs to a 3-node circular loop |
| `shortest_path_to_flagged`| Int | Network Topology | Shortest hop count to known fraudulent wallet |
| `pattern_id` | Int | Label Metadata | Ground truth pattern identifier (1–12) |
| `pattern_code` | String | Label Metadata | Controlled pattern code |
| `is_fraud` | Int (0/1) | Ground Truth Target | Binary label for supervised XGBoost training |
| `is_anomaly` | Int (0/1) | Ground Truth Target | Binary label for unsupervised Isolation Forest |
| `scenario_id` | String | Label Metadata | Scenario correlation identifier |

---

## 2. Injected Pattern Taxonomy

| Pattern ID | Pattern Code | Name | Injected Typology |
| :---: | :--- | :--- | :--- |
| **1** | `NORMAL_TRANSACTION` | Normal Transaction | Baseline retail payments, casual P2P, daytime ATM/agent cash-in. |
| **2** | `UNUSUALLY_LARGE` | Unusually Large Transaction | Single transfer > 10x baseline, near ৳25K/৳50K regulatory limits. |
| **3** | `HIGH_VELOCITY` | High Transaction Velocity | Automated rapid burst of 5–15 transactions within < 15 minutes. |
| **4** | `NEW_DEVICE` | New Unrecognized Device | Rooted burner phone terminal accessing an established wallet. |
| **5** | `NEW_RECIPIENT` | New High-Risk Recipient | High-value transfer to a never-seen account followed by immediate dispersal. |
| **6** | `UNUSUAL_TIME` | Unusual Transaction Time | Nocturnal dead hours (01:00 AM – 05:00 AM) high-value cash-outs. |
| **7** | `UNUSUAL_LOCATION` | Unusual Location Shift | Originating from high-risk border crossing / smuggling zone (Teknaf, Benapole). |
| **8** | `SUDDEN_BEHAVIORAL_CHANGE`| Sudden Behavioral Change | Dormant wallet suddenly reactivated for 100% balance depletion. |
| **9** | `FAN_IN_MULE` | Smurfing / Structuring Ring | Multiple disparate senders funneling sub-threshold amounts to one aggregator. |
| **10** | `SUSPICIOUS_CHAIN` | Circular Layering Loop | Closed multi-hop loop ($A \to B \to C \to A$) with conservation of funds > 95%. |
| **11** | `REPEATED_TRANSFERS` | Repeated Identical Transfers | Rapid successive transfers of identical BDT amounts (e.g. ৳4,999 four times). |
| **12** | `SCAM_SYNDICATE` | Coordinated Scam Lifecycle | Multi-stage scam: victim $\to$ feeder $\to$ aggregator $\to$ agent cash-out. |
