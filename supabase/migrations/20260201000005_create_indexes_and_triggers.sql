-- UpayAche Migration: 20260201000005_create_indexes_and_triggers.sql
-- Description: Create performance indexes (B-Tree & GIN) and automatic updated_at timestamp triggers.

-- ============================================================================
-- 1. B-TREE & COMPOSITE INDEXES
-- ============================================================================

-- Devices
CREATE INDEX IF NOT EXISTS idx_devices_risk ON public.devices(device_risk_score DESC);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_division_district ON public.locations(division, district);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Wallets
CREATE INDEX IF NOT EXISTS idx_wallets_risk_tier ON public.wallets(risk_tier);
CREATE INDEX IF NOT EXISTS idx_wallets_type ON public.wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON public.wallets(status);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON public.transactions(sender_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON public.transactions(receiver_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_transactions_device ON public.transactions(device_id);
CREATE INDEX IF NOT EXISTS idx_transactions_location ON public.transactions(location_id);

-- Transaction Features
CREATE INDEX IF NOT EXISTS idx_tx_features_nocturnal ON public.transaction_features(is_nocturnal) WHERE is_nocturnal = TRUE;
CREATE INDEX IF NOT EXISTS idx_tx_features_rapid_cashout ON public.transaction_features(rapid_cashout_ratio DESC);

-- Risk Predictions
CREATE INDEX IF NOT EXISTS idx_risk_predictions_level_score ON public.risk_predictions(risk_level, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_model ON public.risk_predictions(model_version_id);

-- Anomaly Predictions
CREATE INDEX IF NOT EXISTS idx_anomaly_predictions_anomaly ON public.anomaly_predictions(is_anomaly) WHERE is_anomaly = TRUE;
CREATE INDEX IF NOT EXISTS idx_anomaly_predictions_score ON public.anomaly_predictions(anomaly_score);

-- Wallet Connections (Graph Edges)
CREATE INDEX IF NOT EXISTS idx_wallet_conn_source ON public.wallet_connections(source_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_conn_target ON public.wallet_connections(target_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_conn_cycle ON public.wallet_connections(is_part_of_cycle) WHERE is_part_of_cycle = TRUE;
CREATE INDEX IF NOT EXISTS idx_wallet_conn_weight ON public.wallet_connections(risk_weight DESC);

-- Investigation Cases
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.investigation_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON public.investigation_cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON public.investigation_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.investigation_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_primary_tx ON public.investigation_cases(primary_transaction_id);
CREATE INDEX IF NOT EXISTS idx_cases_primary_wallet ON public.investigation_cases(primary_wallet_id);

-- Investigation Notes
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON public.investigation_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_author_id ON public.investigation_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created_at ON public.investigation_notes(created_at DESC);

-- AI Investigations
CREATE INDEX IF NOT EXISTS idx_ai_investigations_case_id ON public.ai_investigations(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_investigations_analyst ON public.ai_investigations(analyst_id);
CREATE INDEX IF NOT EXISTS idx_ai_investigations_created ON public.ai_investigations(created_at DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 2. GIN INDEXES FOR JSONB PAYLOADS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tx_features_raw_gin ON public.transaction_features USING GIN (raw_features);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_shap_gin ON public.risk_predictions USING GIN (shap_values);
CREATE INDEX IF NOT EXISTS idx_risk_predictions_factors_gin ON public.risk_predictions USING GIN (top_risk_factors);
CREATE INDEX IF NOT EXISTS idx_anomaly_predictions_outliers_gin ON public.anomaly_predictions USING GIN (outlier_features);
CREATE INDEX IF NOT EXISTS idx_ai_investigations_flags_gin ON public.ai_investigations USING GIN (red_flags);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON public.audit_logs USING GIN (metadata);

-- ============================================================================
-- 3. AUTOMATIC updated_at TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to applicable tables
CREATE OR REPLACE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_wallet_connections_updated_at
    BEFORE UPDATE ON public.wallet_connections
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_investigation_cases_updated_at
    BEFORE UPDATE ON public.investigation_cases
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_investigation_notes_updated_at
    BEFORE UPDATE ON public.investigation_notes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

