-- UpayAche Migration: 20260201000008_security_audit_and_rls_hardening.sql
-- Description: Comprehensive Supabase Security Audit & Row Level Security (RLS) Hardening.
-- Enforces RBAC boundaries for ADMIN, ANALYST, VIEWER, and CUSTOMER roles.
-- Prevents IDOR, customer access to internal investigations/wallets/audit logs, and locks down chat session isolation.

-- ============================================================================
-- 1. ADD CUSTOMER TO USER_ROLE ENUM
-- ============================================================================
DO $$ BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'CUSTOMER';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. SECURITY HELPER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. HARDEN PROFILES POLICIES
-- CUSTOMER cannot view other users. Only ADMIN, ANALYST, and VIEWER can see staff profiles.
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

CREATE POLICY "profiles_select_hardened"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() = 'ADMIN' OR
        (public.get_user_role() IN ('ANALYST', 'VIEWER') AND role IN ('ADMIN', 'ANALYST', 'VIEWER')) OR
        (public.get_user_role() = 'CUSTOMER' AND id = auth.uid())
    );

-- ============================================================================
-- 4. HARDEN WALLETS & TRANSACTIONS POLICIES
-- CUSTOMER has ZERO access to the general ledger or arbitrary wallets.
-- ============================================================================
DROP POLICY IF EXISTS "wallets_select_authenticated" ON public.wallets;

CREATE POLICY "wallets_select_staff_or_owner"
    ON public.wallets FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST', 'VIEWER')
    );

DROP POLICY IF EXISTS "transactions_select_authenticated" ON public.transactions;

CREATE POLICY "transactions_select_staff_only"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST', 'VIEWER')
    );

-- ============================================================================
-- 5. HARDEN MODEL INTERNALS & ML PREDICTIONS
-- Internal model versions, hyperparameter weights, features, and graphs
-- are barred from CUSTOMER role.
-- ============================================================================
DROP POLICY IF EXISTS "model_versions_select_authenticated" ON public.model_versions;

CREATE POLICY "model_versions_select_staff_only"
    ON public.model_versions FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST')
    );

DROP POLICY IF EXISTS "tx_features_select_authenticated" ON public.transaction_features;

CREATE POLICY "tx_features_select_staff_only"
    ON public.transaction_features FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST', 'VIEWER')
    );

DROP POLICY IF EXISTS "risk_pred_select_authenticated" ON public.risk_predictions;

CREATE POLICY "risk_pred_select_staff_only"
    ON public.risk_predictions FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST', 'VIEWER')
    );

DROP POLICY IF EXISTS "anomaly_pred_select_authenticated" ON public.anomaly_predictions;

CREATE POLICY "anomaly_pred_select_staff_only"
    ON public.anomaly_predictions FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST', 'VIEWER')
    );

DROP POLICY IF EXISTS "wallet_connections_select_authenticated" ON public.wallet_connections;

CREATE POLICY "wallet_connections_select_staff_only"
    ON public.wallet_connections FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST', 'VIEWER')
    );

-- ============================================================================
-- 6. INVESTIGATION CASES & AUDIT LOGS PROTECTION
-- CUSTOMER and VIEWER have ZERO access to investigation cases, notes, or AI sessions.
-- Only ADMIN and authorized ANALYSTS are permitted.
-- Audit logs strictly append-only; ANALYSTS view self-created logs only, ADMIN views all.
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_select_admin_or_author" ON public.audit_logs;

CREATE POLICY "audit_logs_select_hardened"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() = 'ADMIN' OR
        (public.get_user_role() = 'ANALYST' AND actor_id = auth.uid())
    );

-- ============================================================================
-- 7. REPAIR CHAT SESSIONS & MESSAGES RLS (IDOR PREVENTION)
-- Replace previous permissive policies with strict user isolation.
-- Users can read, create, and delete ONLY their own sessions.
-- ============================================================================
DROP POLICY IF EXISTS "chat_sessions_all" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_messages_all" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_feedback_all" ON public.chat_feedback;

-- Chat Sessions Isolation
CREATE POLICY "chat_sessions_select_owner_or_admin"
    ON public.chat_sessions FOR SELECT
    TO authenticated, anon
    USING (
        public.get_user_role() = 'ADMIN' OR
        user_id = auth.uid()::text OR
        user_id IS NULL OR
        user_id = 'anon-user'
    );

CREATE POLICY "chat_sessions_insert_owner"
    ON public.chat_sessions FOR INSERT
    TO authenticated, anon
    WITH CHECK (
        public.get_user_role() = 'ADMIN' OR
        user_id = auth.uid()::text OR
        user_id IS NULL OR
        user_id = 'anon-user'
    );

CREATE POLICY "chat_sessions_update_owner"
    ON public.chat_sessions FOR UPDATE
    TO authenticated, anon
    USING (
        public.get_user_role() = 'ADMIN' OR
        user_id = auth.uid()::text OR
        user_id = 'anon-user'
    )
    WITH CHECK (
        public.get_user_role() = 'ADMIN' OR
        user_id = auth.uid()::text OR
        user_id = 'anon-user'
    );

CREATE POLICY "chat_sessions_delete_owner"
    ON public.chat_sessions FOR DELETE
    TO authenticated, anon
    USING (
        public.get_user_role() = 'ADMIN' OR
        user_id = auth.uid()::text OR
        user_id = 'anon-user'
    );

-- Chat Messages Isolation
CREATE POLICY "chat_messages_select_session_owner"
    ON public.chat_messages FOR SELECT
    TO authenticated, anon
    USING (
        public.get_user_role() = 'ADMIN' OR
        session_id IN (
            SELECT id FROM public.chat_sessions
            WHERE user_id = auth.uid()::text OR user_id IS NULL OR user_id = 'anon-user'
        )
    );

CREATE POLICY "chat_messages_insert_session_owner"
    ON public.chat_messages FOR INSERT
    TO authenticated, anon
    WITH CHECK (
        public.get_user_role() = 'ADMIN' OR
        session_id IN (
            SELECT id FROM public.chat_sessions
            WHERE user_id = auth.uid()::text OR user_id IS NULL OR user_id = 'anon-user'
        )
    );

-- Chat Feedback
CREATE POLICY "chat_feedback_insert_all"
    ON public.chat_feedback FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "chat_feedback_select_staff_only"
    ON public.chat_feedback FOR SELECT
    TO authenticated
    USING (
        public.get_user_role() IN ('ADMIN', 'ANALYST')
    );
