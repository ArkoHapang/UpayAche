-- UpayAche Migration: 20260201000001_create_extensions_and_enums.sql
-- Description: Enable cryptographic extensions and create custom domain ENUM types.

-- 1. Cryptographic Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Role-Based Access Control (RBAC) Enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Wallet Type Enum
DO $$ BEGIN
    CREATE TYPE public.wallet_type AS ENUM ('PERSONAL', 'AGENT', 'MERCHANT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Risk Level & Priority Enum
DO $$ BEGIN
    CREATE TYPE public.risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Wallet Operational Status Enum
DO $$ BEGIN
    CREATE TYPE public.wallet_status AS ENUM ('ACTIVE', 'SUSPENDED', 'WATCHLIST', 'FROZEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. MFS Transaction Type Enum
DO $$ BEGIN
    CREATE TYPE public.tx_type AS ENUM ('P2P', 'CASH_IN', 'CASH_OUT', 'PAYMENT', 'RECHARGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Transaction Processing Status Enum
DO $$ BEGIN
    CREATE TYPE public.tx_status AS ENUM ('COMPLETED', 'REJECTED', 'PENDING', 'FLAGGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Investigation Case Status State Machine
DO $$ BEGIN
    CREATE TYPE public.case_status AS ENUM ('OPEN', 'INVESTIGATING', 'REVIEWED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 9. Investigation Resolution Classification
DO $$ BEGIN
    CREATE TYPE public.case_resolution AS ENUM ('PENDING', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'SUSPICIOUS_MONITOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 10. Investigation Note Authorship Type
DO $$ BEGIN
    CREATE TYPE public.note_type AS ENUM ('ANALYST', 'AI_SUMMARY', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 11. Network Graph Relationship Classification
DO $$ BEGIN
    CREATE TYPE public.connection_type AS ENUM ('DIRECT_TRANSFER', 'CIRCULAR_LOOP', 'FAN_IN_MULE', 'FAN_OUT_DISPERSAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
