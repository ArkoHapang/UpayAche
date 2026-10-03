-- UpayAche Migration: 20260201000002_create_core_tables.sql
-- Description: Create foundation entity tables (profiles, devices, locations, wallets, model_versions).

-- 1. `devices` (Hardware and client terminal fingerprints)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_fingerprint VARCHAR(64) NOT NULL UNIQUE,
    device_type VARCHAR(32) NOT NULL DEFAULT 'SMARTPHONE',
    os VARCHAR(32) NOT NULL DEFAULT 'ANDROID',
    model VARCHAR(64),
    app_version VARCHAR(32),
    is_rooted_or_jailbroken BOOLEAN NOT NULL DEFAULT FALSE,
    device_risk_score REAL NOT NULL DEFAULT 0.0 CHECK (device_risk_score >= 0.0 AND device_risk_score <= 1.0),
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. `locations` (Geolocation and regional risk metadata)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code VARCHAR(32) NOT NULL UNIQUE,
    division VARCHAR(64) NOT NULL,
    district VARCHAR(64) NOT NULL,
    thana_or_upazila VARCHAR(64),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    ip_subnet VARCHAR(64),
    is_high_risk_zone BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. `profiles` (Compliance officers, analysts, and system administrators)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role public.user_role NOT NULL DEFAULT 'ANALYST',
    full_name VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL DEFAULT 'Compliance & Risk Operations',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 4. `wallets` (Synthetic MFS accounts and compliance risk profiles)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_number VARCHAR(64) NOT NULL UNIQUE,
    phone_number_masked VARCHAR(20) NOT NULL,
    wallet_type public.wallet_type NOT NULL DEFAULT 'PERSONAL',
    risk_tier public.risk_level NOT NULL DEFAULT 'LOW',
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
    status public.wallet_status NOT NULL DEFAULT 'ACTIVE',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',
    primary_device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    registered_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. `model_versions` (Registry of deployed XGBoost, Isolation Forest & SHAP models)
CREATE TABLE IF NOT EXISTS public.model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(64) NOT NULL,
    version_tag VARCHAR(32) NOT NULL,
    algorithm VARCHAR(64) NOT NULL,
    feature_count INT NOT NULL DEFAULT 24 CHECK (feature_count > 0),
    metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
    hyperparameters JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    deployed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_model_name_version UNIQUE (model_name, version_tag)
);
