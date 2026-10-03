-- UpayAche Migration: 20260201000006_create_row_level_security.sql
-- Description: Implement Row Level Security (RLS) policies for ADMIN, ANALYST, and VIEWER roles.

-- ============================================================================
-- 1. SECURITY HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_insert_admin_or_self"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'ADMIN' OR id = auth.uid());

CREATE POLICY "profiles_update_admin_or_self"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN' OR id = auth.uid())
    WITH CHECK (
        public.get_user_role() = 'ADMIN' OR 
        (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
    );

CREATE POLICY "profiles_delete_admin_only"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN');

-- ============================================================================
-- 4. TELEMETRY & REFERENCE TABLES (devices, locations, model_versions)
-- ============================================================================
CREATE POLICY "devices_select_authenticated"
    ON public.devices FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "devices_mutation_admin_only"
    ON public.devices FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "locations_select_authenticated"
    ON public.locations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "locations_mutation_admin_only"
    ON public.locations FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "model_versions_select_authenticated"
    ON public.model_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "model_versions_mutation_admin_only"
    ON public.model_versions FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

-- ============================================================================
-- 5. LEDGER & RISK INTELLIGENCE TABLES (wallets, transactions, features, predictions, graph)
-- ============================================================================
-- Read access: All authenticated roles (ADMIN, ANALYST, VIEWER)
CREATE POLICY "wallets_select_authenticated"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "wallets_mutation_admin_only"
    ON public.wallets FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "transactions_select_authenticated"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "transactions_mutation_admin_only"
    ON public.transactions FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "tx_features_select_authenticated"
    ON public.transaction_features FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "tx_features_mutation_admin_only"
    ON public.transaction_features FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "risk_pred_select_authenticated"
    ON public.risk_predictions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "risk_pred_mutation_admin_only"
    ON public.risk_predictions FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "anomaly_pred_select_authenticated"
    ON public.anomaly_predictions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "anomaly_pred_mutation_admin_only"
    ON public.anomaly_predictions FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "wallet_connections_select_authenticated"
    ON public.wallet_connections FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "wallet_connections_mutation_admin_only"
    ON public.wallet_connections FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

-- ============================================================================
-- 6. INVESTIGATION DATA PROTECTION (cases, notes, AI sessions)
-- VIEWER has ZERO access. Only ADMIN and ANALYST are authorized.
-- ============================================================================

-- Investigation Cases
CREATE POLICY "cases_select_analyst_and_admin"
    ON public.investigation_cases FOR SELECT
    TO authenticated
    USING (public.get_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "cases_insert_analyst_and_admin"
    ON public.investigation_cases FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "cases_update_analyst_and_admin"
    ON public.investigation_cases FOR UPDATE
    TO authenticated
    USING (public.get_user_role() IN ('ADMIN', 'ANALYST'))
    WITH CHECK (public.get_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "cases_delete_admin_only"
    ON public.investigation_cases FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN');

-- Investigation Notes
CREATE POLICY "notes_select_analyst_and_admin"
    ON public.investigation_notes FOR SELECT
    TO authenticated
    USING (public.get_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "notes_insert_analyst_and_admin"
    ON public.investigation_notes FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role() IN ('ADMIN', 'ANALYST') AND
        (author_id = auth.uid() OR public.get_user_role() = 'ADMIN')
    );

CREATE POLICY "notes_update_author_or_admin"
    ON public.investigation_notes FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN' OR (public.get_user_role() = 'ANALYST' AND author_id = auth.uid()))
    WITH CHECK (public.get_user_role() = 'ADMIN' OR (public.get_user_role() = 'ANALYST' AND author_id = auth.uid()));

CREATE POLICY "notes_delete_admin_only"
    ON public.investigation_notes FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN');

-- AI Investigations
CREATE POLICY "ai_inv_select_analyst_and_admin"
    ON public.ai_investigations FOR SELECT
    TO authenticated
    USING (public.get_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "ai_inv_insert_analyst_and_admin"
    ON public.ai_investigations FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('ADMIN', 'ANALYST'));

CREATE POLICY "ai_inv_update_admin_only"
    ON public.ai_investigations FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "ai_inv_delete_admin_only"
    ON public.ai_investigations FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'ADMIN');

-- ============================================================================
-- 7. AUDIT LOGS (Immutable Append-Only Security Trail)
-- VIEWER has ZERO access. ANALYST can view only self-created audit entries.
-- ADMIN can view all audit records.
-- UPDATE and DELETE operations are completely barred.
-- ============================================================================
CREATE POLICY "audit_logs_select_admin_or_author"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.get_user_role() = 'ADMIN' OR (public.get_user_role() = 'ANALYST' AND actor_id = auth.uid()));

CREATE POLICY "audit_logs_insert_authenticated"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Strict Immutability: No UPDATE or DELETE policies are granted on public.audit_logs.
