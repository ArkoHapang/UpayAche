-- UpayAche Migration: 20260201000004_create_investigation_and_audit_tables.sql
-- Description: Create compliance workflow, AI copilot sessions, and append-only audit trail.

-- 1. `investigation_cases` (Core compliance alerts and triage workflow)
CREATE TABLE IF NOT EXISTS public.investigation_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority public.risk_level NOT NULL DEFAULT 'MEDIUM',
    status public.case_status NOT NULL DEFAULT 'OPEN',
    resolution public.case_resolution NOT NULL DEFAULT 'PENDING',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    primary_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    primary_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_case_resolution CHECK (
        (status <> 'CLOSED' AND resolution = 'PENDING') OR
        (status = 'CLOSED' AND resolution IN ('CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'SUSPICIOUS_MONITOR'))
    )
);

-- 2. `investigation_notes` (Analyst case notes, audit memos, and AI summaries)
CREATE TABLE IF NOT EXISTS public.investigation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.investigation_cases(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note_type public.note_type NOT NULL DEFAULT 'ANALYST',
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. `ai_investigations` (Guarded Gemini Copilot investigation sessions and evidence inputs)
CREATE TABLE IF NOT EXISTS public.ai_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.investigation_cases(id) ON DELETE CASCADE,
    analyst_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    model_id VARCHAR(64) NOT NULL DEFAULT 'gemini-1.5-flash',
    prompt_evidence JSONB NOT NULL,
    reasoning_summary TEXT NOT NULL,
    recommended_action VARCHAR(64) NOT NULL,
    confidence_score REAL NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    red_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
    token_usage JSONB NOT NULL DEFAULT '{}'::JSONB,
    guardrail_status VARCHAR(32) NOT NULL DEFAULT 'VALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. `audit_logs` (Immutable append-only forensic compliance trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
