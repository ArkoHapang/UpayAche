-- UpayAche Migration: 20260201000003_create_transaction_and_intelligence_tables.sql
-- Description: Create transaction ledger and ML/graph intelligence tables.

-- 1. `transactions` (Immutable core MFS transaction ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(64) NOT NULL UNIQUE,
    sender_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    receiver_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    tx_type public.tx_type NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0.00),
    fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (fee >= 0.00),
    status public.tx_status NOT NULL DEFAULT 'COMPLETED',
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sender_receiver_diff CHECK (sender_wallet_id <> receiver_wallet_id)
);

-- 2. `transaction_features` (Precomputed 24-dimensional feature vector per transaction)
CREATE TABLE IF NOT EXISTS public.transaction_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE CASCADE,
    velocity_1h_count INT NOT NULL DEFAULT 0 CHECK (velocity_1h_count >= 0),
    velocity_1h_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (velocity_1h_amount >= 0.00),
    velocity_24h_count INT NOT NULL DEFAULT 0 CHECK (velocity_24h_count >= 0),
    velocity_24h_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (velocity_24h_amount >= 0.00),
    is_nocturnal BOOLEAN NOT NULL DEFAULT FALSE,
    amount_to_avg_ratio REAL NOT NULL DEFAULT 1.0 CHECK (amount_to_avg_ratio >= 0.0),
    rapid_cashout_ratio REAL NOT NULL DEFAULT 0.0 CHECK (rapid_cashout_ratio >= 0.0 AND rapid_cashout_ratio <= 1.0),
    sender_in_degree INT NOT NULL DEFAULT 0 CHECK (sender_in_degree >= 0),
    sender_out_degree INT NOT NULL DEFAULT 0 CHECK (sender_out_degree >= 0),
    receiver_in_degree INT NOT NULL DEFAULT 0 CHECK (receiver_in_degree >= 0),
    receiver_out_degree INT NOT NULL DEFAULT 0 CHECK (receiver_out_degree >= 0),
    is_dormant_reactivation BOOLEAN NOT NULL DEFAULT FALSE,
    raw_features JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. `risk_predictions` (Supervised XGBoost fraud risk inference and SHAP attributions)
CREATE TABLE IF NOT EXISTS public.risk_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE CASCADE,
    model_version_id UUID REFERENCES public.model_versions(id) ON DELETE SET NULL,
    risk_score REAL NOT NULL CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    risk_level public.risk_level NOT NULL,
    confidence_score REAL NOT NULL DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    shap_values JSONB NOT NULL DEFAULT '{}'::JSONB,
    top_risk_factors JSONB NOT NULL DEFAULT '[]'::JSONB,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. `anomaly_predictions` (Unsupervised Isolation Forest behavioral anomaly detection)
CREATE TABLE IF NOT EXISTS public.anomaly_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE CASCADE,
    model_version_id UUID REFERENCES public.model_versions(id) ON DELETE SET NULL,
    anomaly_score REAL NOT NULL CHECK (anomaly_score >= -1.0 AND anomaly_score <= 1.0),
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    outlier_features JSONB NOT NULL DEFAULT '[]'::JSONB,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. `wallet_connections` (Network graph edges for multi-hop graph analysis)
CREATE TABLE IF NOT EXISTS public.wallet_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    target_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    connection_type public.connection_type NOT NULL DEFAULT 'DIRECT_TRANSFER',
    total_tx_count INT NOT NULL DEFAULT 1 CHECK (total_tx_count > 0),
    total_volume NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_volume >= 0.00),
    first_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_part_of_cycle BOOLEAN NOT NULL DEFAULT FALSE,
    risk_weight REAL NOT NULL DEFAULT 0.0 CHECK (risk_weight >= 0.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_source_target_wallet UNIQUE (source_wallet_id, target_wallet_id),
    CONSTRAINT chk_diff_wallets CHECK (source_wallet_id <> target_wallet_id)
);
