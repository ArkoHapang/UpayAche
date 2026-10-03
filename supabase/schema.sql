-- UpayAche Consolidated Schema Baseline
-- Description: Complete initial database schema definition, indexes, triggers, and RLS policies.

\ir migrations/20260201000001_create_extensions_and_enums.sql
\ir migrations/20260201000002_create_core_tables.sql
\ir migrations/20260201000003_create_transaction_and_intelligence_tables.sql
\ir migrations/20260201000004_create_investigation_and_audit_tables.sql
\ir migrations/20260201000005_create_indexes_and_triggers.sql
\ir migrations/20260201000006_create_row_level_security.sql
\ir migrations/20260201000007_create_rag_and_chat_tables.sql

