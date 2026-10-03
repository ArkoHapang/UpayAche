-- UpayAche Synthetic Database Seed
-- Environment: Supabase PostgreSQL 15+
-- Compliance Note: 100% Synthetic Data. Zero PII. Phone numbers are strictly masked.
-- All UUIDs are valid RFC-4122 Hexadecimal identifiers.

-- ============================================================================
-- 1. PROFILES (Admins, Analysts, Viewers)
-- ============================================================================
INSERT INTO public.profiles (id, email, role, full_name, department, is_active)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'admin.tanvir@upayache.internal', 'ADMIN', 'Tanvir Rahman', 'Executive Security & Risk Oversight', true),
    ('a1000000-0000-0000-0000-000000000002', 'analyst.nusrat@upayache.internal', 'ANALYST', 'Nusrat Jahan', 'Financial Crime Compliance (AML/CFT)', true),
    ('a1000000-0000-0000-0000-000000000003', 'analyst.arif@upayache.internal', 'ANALYST', 'Arif Hossain', 'Fraud Operations & Triage Unit', true),
    ('a1000000-0000-0000-0000-000000000004', 'auditor.farhana@upayache.internal', 'VIEWER', 'Farhana Chowdhury', 'Internal Audit & Regulatory Compliance', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. DEVICES (Terminal Telemetry & Fingerprints)
-- ============================================================================
INSERT INTO public.devices (id, device_fingerprint, device_type, os, model, app_version, is_rooted_or_jailbroken, device_risk_score)
VALUES
    ('d1000000-0000-0000-0000-000000000001', 'fp_samsung_sm990_root', 'SMARTPHONE', 'ANDROID', 'Samsung Galaxy A54 5G', '3.4.1', true, 0.85),
    ('d1000000-0000-0000-0000-000000000002', 'fp_apple_iphone14_clean', 'SMARTPHONE', 'IOS', 'iPhone 14 Pro', '3.4.2', false, 0.05),
    ('d1000000-0000-0000-0000-000000000003', 'fp_pos_terminal_sunmi', 'POS', 'ANDROID_EMBEDDED', 'Sunmi V2 POS', '2.8.0', false, 0.12),
    ('d1000000-0000-0000-0000-000000000004', 'fp_xiaomi_redmi_burner', 'SMARTPHONE', 'ANDROID', 'Xiaomi Redmi Note 12', '3.4.0', true, 0.78),
    ('d1000000-0000-0000-0000-000000000005', 'fp_web_merchant_portal', 'WEB', 'LINUX', 'Chrome Browser 126', 'web-1.0', false, 0.08)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. LOCATIONS (Bangladesh Geolocation & Regional Risk Zones)
-- ============================================================================
INSERT INTO public.locations (id, location_code, division, district, thana_or_upazila, latitude, longitude, ip_subnet, is_high_risk_zone)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'LOC-DHK-DHN', 'Dhaka', 'Dhaka', 'Dhanmondi', 23.746100, 90.374200, '103.205.71.0/24', false),
    ('b1000000-0000-0000-0000-000000000002', 'LOC-DHK-MIR', 'Dhaka', 'Dhaka', 'Mirpur', 23.822300, 90.365400, '103.205.72.0/24', false),
    ('b1000000-0000-0000-0000-000000000003', 'LOC-CTG-AGR', 'Chittagong', 'Chittagong', 'Agrabad Commercial Area', 22.327400, 91.812200, '118.179.80.0/24', false),
    ('b1000000-0000-0000-0000-000000000004', 'LOC-SYL-ZIN', 'Sylhet', 'Sylhet', 'Zindabazar', 24.894900, 91.868700, '119.30.34.0/24', false),
    ('b1000000-0000-0000-0000-000000000005', 'LOC-CXB-TEK', 'Chittagong', 'Cox''s Bazar', 'Teknaf Border Outpost', 20.865400, 92.298100, '45.112.58.0/24', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. WALLETS (Synthetic Wallets with Masked MSISDNs)
-- ============================================================================
INSERT INTO public.wallets (id, wallet_number, phone_number_masked, wallet_type, risk_tier, balance, currency, status, kyc_status, primary_device_id, registered_location_id)
VALUES
    -- Standard Personal Wallets
    ('c1000000-0000-0000-0000-000000000001', 'W-PERS-101', '017****4101', 'PERSONAL', 'LOW', 12450.00, 'BDT', 'ACTIVE', 'VERIFIED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
    ('c1000000-0000-0000-0000-000000000002', 'W-PERS-102', '018****5202', 'PERSONAL', 'LOW', 8320.50, 'BDT', 'ACTIVE', 'VERIFIED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002'),
    ('c1000000-0000-0000-0000-000000000003', 'W-PERS-103', '019****6303', 'PERSONAL', 'LOW', 6200.00, 'BDT', 'ACTIVE', 'VERIFIED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003'),
    
    -- Agent Wallets
    ('c1000000-0000-0000-0000-000000000004', 'W-AGNT-201', '016****7404', 'AGENT', 'LOW', 285400.00, 'BDT', 'ACTIVE', 'VERIFIED', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001'),
    ('c1000000-0000-0000-0000-000000000005', 'W-AGNT-202', '015****8505', 'AGENT', 'MEDIUM', 174000.00, 'BDT', 'ACTIVE', 'VERIFIED', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004'),
    
    -- Merchant Wallet
    ('c1000000-0000-0000-0000-000000000006', 'W-MRCH-301', '013****9606', 'MERCHANT', 'LOW', 542900.00, 'BDT', 'ACTIVE', 'VERIFIED', 'd1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001'),
    
    -- Smurfing Fan-In Inflow Mule Wallets
    ('c1000000-0000-0000-0000-000000000007', 'W-MULE-801', '017****1111', 'PERSONAL', 'HIGH', 150.00, 'BDT', 'WATCHLIST', 'VERIFIED', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005'),
    ('c1000000-0000-0000-0000-000000000008', 'W-MULE-802', '017****2222', 'PERSONAL', 'HIGH', 220.00, 'BDT', 'WATCHLIST', 'VERIFIED', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005'),
    ('c1000000-0000-0000-0000-000000000009', 'W-MULE-803', '017****3333', 'PERSONAL', 'HIGH', 310.00, 'BDT', 'WATCHLIST', 'VERIFIED', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005'),
    
    -- Mule Aggregator / Rapid Cash-Out Destination Wallet
    ('c1000000-0000-0000-0000-000000000010', 'W-MULE-999', '018****9999', 'PERSONAL', 'CRITICAL', 850.00, 'BDT', 'SUSPENDED', 'FLAGGED', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. MODEL VERSIONS (ML Inference Registry)
-- ============================================================================
INSERT INTO public.model_versions (id, model_name, version_tag, algorithm, feature_count, metrics, hyperparameters, is_active, deployed_by, deployed_at)
VALUES
    ('f1000000-0000-0000-0000-000000000001', 'xgboost_risk_engine', 'v1.0.0', 'XGBClassifier', 24, 
     '{"precision": 0.942, "recall": 0.915, "f1_score": 0.928, "roc_auc": 0.978, "pr_auc": 0.941}'::JSONB,
     '{"max_depth": 6, "learning_rate": 0.05, "n_estimators": 300, "scale_pos_weight": 14.5}'::JSONB,
     true, 'a1000000-0000-0000-0000-000000000001', '2026-01-15T10:00:00Z'),
    ('f1000000-0000-0000-0000-000000000002', 'isolation_forest_anomaly', 'v1.0.0', 'IsolationForest', 24,
     '{"pr_auc": 0.891, "contamination": 0.025, "silhouette_score": 0.72}'::JSONB,
     '{"n_estimators": 200, "max_samples": "auto", "contamination": 0.025}'::JSONB,
     true, 'a1000000-0000-0000-0000-000000000001', '2026-01-15T10:05:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. TRANSACTIONS (MFS Ledger Activity)
-- ============================================================================
INSERT INTO public.transactions (id, tx_hash, sender_wallet_id, receiver_wallet_id, tx_type, amount, fee, status, device_id, location_id, timestamp)
VALUES
    -- Scenario A: Smurfing Fan-In Layering into Mule Aggregator
    ('e1000000-0000-0000-0000-000000000001', 'tx_hash_smurf_leg_01_a8f9', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000010', 'P2P', 24500.00, 5.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', '2026-01-28T02:45:12Z'),
    ('e1000000-0000-0000-0000-000000000002', 'tx_hash_smurf_leg_02_b7e3', 'c1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000010', 'P2P', 24800.00, 5.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', '2026-01-28T02:51:30Z'),
    ('e1000000-0000-0000-0000-000000000003', 'tx_hash_smurf_leg_03_c1d2', 'c1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000010', 'P2P', 24650.00, 5.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', '2026-01-28T02:58:10Z'),
    
    -- Scenario A (Continued): Rapid Nocturnal Cash-Out at Agent
    ('e1000000-0000-0000-0000-000000000004', 'tx_hash_nocturnal_cashout_99', 'c1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000004', 'CASH_OUT', 73000.00, 1314.00, 'FLAGGED', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', '2026-01-28T03:14:45Z'),
    
    -- Scenario B: Circular Layering Loop (W-PERS-101 -> W-PERS-102 -> W-PERS-103 -> W-PERS-101)
    ('e1000000-0000-0000-0000-000000000005', 'tx_hash_cycle_hop_1_e44a', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'P2P', 15000.00, 5.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', '2026-01-27T14:10:00Z'),
    ('e1000000-0000-0000-0000-000000000006', 'tx_hash_cycle_hop_2_f55b', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'P2P', 14900.00, 5.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', '2026-01-27T14:25:00Z'),
    ('e1000000-0000-0000-0000-000000000007', 'tx_hash_cycle_hop_3_a66c', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'P2P', 14800.00, 5.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', '2026-01-27T14:40:00Z'),

    -- Scenario C: Benign Merchant Purchase & Agent Cash In
    ('e1000000-0000-0000-0000-000000000008', 'tx_hash_benign_merchant_77d', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'PAYMENT', 1850.00, 0.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', '2026-01-27T18:30:00Z'),
    ('e1000000-0000-0000-0000-000000000009', 'tx_hash_benign_cashin_88e', 'c1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'CASH_IN', 5000.00, 0.00, 'COMPLETED', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', '2026-01-27T11:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. TRANSACTION FEATURES (24-Dimensional Engineered Features)
-- ============================================================================
INSERT INTO public.transaction_features (id, transaction_id, velocity_1h_count, velocity_1h_amount, velocity_24h_count, velocity_24h_amount, is_nocturnal, amount_to_avg_ratio, rapid_cashout_ratio, sender_in_degree, sender_out_degree, receiver_in_degree, receiver_out_degree, is_dormant_reactivation, raw_features)
VALUES
    ('e2000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 4, 73000.00, 6, 73950.00, true, 8.45, 0.98, 3, 1, 12, 45, true,
     '{"amount": 73000.0, "velocity_1h_count": 4, "velocity_1h_amount": 73000.0, "is_nocturnal": 1, "rapid_cashout_ratio": 0.98, "device_risk_score": 0.85, "pagerank": 0.042, "betweenness": 0.081}'::JSONB),
    ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 1, 24500.00, 2, 24500.00, true, 4.12, 0.00, 0, 1, 3, 0, false,
     '{"amount": 24500.0, "velocity_1h_count": 1, "velocity_1h_amount": 24500.0, "is_nocturnal": 1, "rapid_cashout_ratio": 0.0, "device_risk_score": 0.85, "pagerank": 0.015, "betweenness": 0.012}'::JSONB),
    ('e2000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', 1, 15000.00, 3, 18000.00, false, 2.10, 0.00, 2, 3, 2, 2, false,
     '{"amount": 15000.0, "velocity_1h_count": 1, "velocity_1h_amount": 15000.0, "is_nocturnal": 0, "rapid_cashout_ratio": 0.0, "device_risk_score": 0.05, "pagerank": 0.021, "betweenness": 0.045}'::JSONB),
    ('e2000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000008', 1, 1850.00, 2, 2400.00, false, 0.45, 0.00, 1, 4, 180, 15, false,
     '{"amount": 1850.0, "velocity_1h_count": 1, "velocity_1h_amount": 1850.0, "is_nocturnal": 0, "rapid_cashout_ratio": 0.0, "device_risk_score": 0.05, "pagerank": 0.008, "betweenness": 0.001}'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. RISK PREDICTIONS (Supervised XGBoost Scoring & SHAP Feature Explanations)
-- ============================================================================
INSERT INTO public.risk_predictions (id, transaction_id, model_version_id, risk_score, risk_level, confidence_score, shap_values, top_risk_factors, evaluated_at)
VALUES
    ('e3000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', 0.965, 'CRITICAL', 0.94,
     '{"rapid_cashout_ratio": 0.38, "is_nocturnal": 0.24, "device_risk_score": 0.18, "velocity_1h_amount": 0.12, "amount_to_avg_ratio": 0.08}'::JSONB,
     '["rapid_cashout_ratio (0.98 vs avg 0.04)", "is_nocturnal (03:14 AM)", "device_risk_score (rooted burner)", "fan_in_velocity (3 deposits in 30m)"]'::JSONB,
     '2026-01-28T03:14:46Z'),
    ('e3000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 0.785, 'HIGH', 0.88,
     '{"is_nocturnal": 0.32, "amount_near_regulatory_threshold": 0.28, "high_risk_zone": 0.15}'::JSONB,
     '["amount_near_regulatory_threshold (৳24,500 < ৳25,000)", "is_nocturnal (02:45 AM)", "high_risk_zone (Teknaf)"]'::JSONB,
     '2026-01-28T02:45:13Z'),
    ('e3000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000001', 0.720, 'HIGH', 0.82,
     '{"circular_loop_indicator": 0.45, "rapid_hop_velocity": 0.22}'::JSONB,
     '["circular_loop_indicator (3-hop loop detected)", "flow_conservation_ratio (99.3%)"]'::JSONB,
     '2026-01-27T14:10:02Z'),
    ('e3000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000001', 0.035, 'LOW', 0.99,
     '{"verified_merchant_recipient": -0.45, "daytime_transaction": -0.25}'::JSONB,
     '["verified_merchant_recipient (W-MRCH-301)", "expected_amount_distribution"]'::JSONB,
     '2026-01-27T18:30:01Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. ANOMALY PREDICTIONS (Isolation Forest Behavioral Outlier Inference)
-- ============================================================================
INSERT INTO public.anomaly_predictions (id, transaction_id, model_version_id, anomaly_score, is_anomaly, outlier_features, evaluated_at)
VALUES
    ('e4000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000002', -0.485, true,
     '["rapid_cashout_ratio", "nocturnal_hour", "sudden_inflow_spike"]'::JSONB, '2026-01-28T03:14:46Z'),
    ('e4000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', -0.215, true,
     '["nocturnal_hour", "threshold_proximity"]'::JSONB, '2026-01-28T02:45:13Z'),
    ('e4000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000002', 0.320, false,
     '[]'::JSONB, '2026-01-27T18:30:01Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. WALLET CONNECTIONS (Graph Edge Relationships for NetworkX)
-- ============================================================================
INSERT INTO public.wallet_connections (id, source_wallet_id, target_wallet_id, connection_type, total_tx_count, total_volume, first_interaction_at, last_interaction_at, is_part_of_cycle, risk_weight)
VALUES
    -- Smurfing Fan-In Inflows into Mule Aggregator
    ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000010', 'FAN_IN_MULE', 1, 24500.00, '2026-01-28T02:45:12Z', '2026-01-28T02:45:12Z', false, 0.85),
    ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000010', 'FAN_IN_MULE', 1, 24800.00, '2026-01-28T02:51:30Z', '2026-01-28T02:51:30Z', false, 0.85),
    ('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000010', 'FAN_IN_MULE', 1, 24650.00, '2026-01-28T02:58:10Z', '2026-01-28T02:58:10Z', false, 0.85),
    
    -- Mule Aggregator to Agent Cash-Out Node
    ('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000004', 'DIRECT_TRANSFER', 1, 73000.00, '2026-01-28T03:14:45Z', '2026-01-28T03:14:45Z', false, 0.95),

    -- Circular Layering Loop (101 -> 102 -> 103 -> 101)
    ('c2000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'CIRCULAR_LOOP', 2, 28000.00, '2026-01-20T10:00:00Z', '2026-01-27T14:10:00Z', true, 0.75),
    ('c2000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'CIRCULAR_LOOP', 2, 27900.00, '2026-01-20T10:15:00Z', '2026-01-27T14:25:00Z', true, 0.75),
    ('c2000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'CIRCULAR_LOOP', 2, 27800.00, '2026-01-20T10:30:00Z', '2026-01-27T14:40:00Z', true, 0.75),

    -- Legitimate Transfers
    ('c2000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'DIRECT_TRANSFER', 5, 8420.00, '2026-01-10T12:00:00Z', '2026-01-27T18:30:00Z', false, 0.05)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. INVESTIGATION CASES (Compliance Triage & State Machine Cases)
-- ============================================================================
INSERT INTO public.investigation_cases (id, case_number, title, description, priority, status, resolution, assigned_to, primary_transaction_id, primary_wallet_id, created_at)
VALUES
    ('a2000000-0000-0000-0000-000000000001', 'CASE-2026-0001', 'Coordinated Nocturnal Fan-In Smurfing & 98% Cash-Out',
     'High-velocity structuring ring detected. Three feeder accounts deposited ৳73,950 total within 30 minutes at 02:45–02:58 AM, followed by immediate 98% cash-out at Agent W-AGNT-201.',
     'CRITICAL', 'INVESTIGATING', 'PENDING', 'a1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000010', '2026-01-28T03:30:00Z'),
     
    ('a2000000-0000-0000-0000-000000000002', 'CASE-2026-0002', 'Triangular Circular Fund Layering Cycle Detected',
     'Closed-loop circular flow identified among W-PERS-101, W-PERS-102, and W-PERS-103 with >99% flow conservation ratio across successive hops.',
     'HIGH', 'OPEN', 'PENDING', 'a1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', '2026-01-27T15:00:00Z'),

    ('a2000000-0000-0000-0000-000000000003', 'CASE-2026-0003', 'High Velocity Cash Dispersal Verification',
     'Reviewed high transaction volume during mega flash sale. Verified authentic KYC documents and business registration.',
     'LOW', 'CLOSED', 'FALSE_POSITIVE', 'a1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000006', '2026-01-26T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. INVESTIGATION NOTES (Case Timeline & Analyst Logs)
-- ============================================================================
INSERT INTO public.investigation_notes (id, case_id, author_id, note_type, content, is_internal, created_at)
VALUES
    ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'ANALYST',
     'Initiated case review. Feeder wallets registered in Teknaf high-risk border zone. IP addresses match known proxy subnets. Flagged wallet W-MULE-999 for temporary freeze pending STR submission.', true, '2026-01-28T03:45:00Z'),
    ('a3000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'SYSTEM',
     'Automated Alert: Aggregator wallet W-MULE-999 operational status transitioned to SUSPENDED. Balance remaining: ৳850.00.', true, '2026-01-28T04:00:00Z'),
    ('a3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'ANALYST',
     'Confirmed merchant credentials with corporate registration registry. E-commerce campaign verified. Marked as False Positive and resolved.', true, '2026-01-26T11:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. AI INVESTIGATIONS (Guarded Gemini Copilot Forensic Session)
-- ============================================================================
INSERT INTO public.ai_investigations (id, case_id, analyst_id, model_id, prompt_evidence, reasoning_summary, recommended_action, confidence_score, red_flags, token_usage, guardrail_status)
VALUES
    ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'gemini-1.5-flash',
     '{"case_number": "CASE-2026-0001", "target_wallet": "W-MULE-999", "inflow_total": 73950.0, "cashout_amount": 73000.0, "time_window_minutes": 29, "hour": "03:14 AM", "device_rooted": true, "location": "Teknaf"}'::JSONB,
     'The structured evidence demonstrates classical smurfing typology: multiple below-threshold inflows (৳24,500, ৳24,800, ৳24,650) arriving from disparate burner devices, followed by an immediate 98.7% cash-out at an agent POS during non-business nocturnal hours. Rooted OS environment corroborates evasion tactics.',
     'FREEZE_RECOMMENDED', 0.96,
     '["Sub-threshold smurfing structuring", "Rapid cash-out within 30m", "Nocturnal nocturnal anomaly (03:14 AM)", "Rooted device fingerprint"]'::JSONB,
     '{"prompt_tokens": 420, "completion_tokens": 145, "total_tokens": 565}'::JSONB,
     'VALIDATED')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. AUDIT LOGS (Immutable Append-Only Forensic Audit Trail)
-- ============================================================================
INSERT INTO public.audit_logs (id, actor_id, action, resource_type, resource_id, metadata, ip_address, created_at)
VALUES
    ('a5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'MODEL_DEPLOY', 'MODEL_VERSION', 'f1000000-0000-0000-0000-000000000001', '{"version": "v1.0.0", "algorithm": "XGBClassifier"}'::JSONB, '103.205.71.10', '2026-01-15T10:00:00Z'),
    ('a5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'CASE_STATUS_TRANSITION', 'INVESTIGATION_CASE', 'a2000000-0000-0000-0000-000000000001', '{"from": "OPEN", "to": "INVESTIGATING"}'::JSONB, '103.205.71.22', '2026-01-28T03:35:00Z'),
    ('a5000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'AI_INVESTIGATION_RUN', 'AI_INVESTIGATION', 'a4000000-0000-0000-0000-000000000001', '{"model": "gemini-1.5-flash", "confidence": 0.96}'::JSONB, '103.205.71.22', '2026-01-28T03:50:00Z'),
    ('a5000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'WALLET_SUSPEND', 'WALLET', 'c1000000-0000-0000-0000-000000000010', '{"reason": "Smurfing cash-out syndicate confirmed"}'::JSONB, '103.205.71.22', '2026-01-28T04:00:00Z')
ON CONFLICT (id) DO NOTHING;
