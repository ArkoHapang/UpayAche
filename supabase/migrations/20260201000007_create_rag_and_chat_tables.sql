-- UpayAche Migration: 20260201000007_create_rag_and_chat_tables.sql
-- Description: Enable pgvector extension and create RAG knowledge base & customer chatbot tables.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. `knowledge_documents` (Master knowledge repository for RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(16) NOT NULL DEFAULT 'en',
    version VARCHAR(32) NOT NULL DEFAULT 'v1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. `knowledge_chunks` (Embeddings and chunked text for vector similarity retrieval)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for vector cosine similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
    ON public.knowledge_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_id 
    ON public.knowledge_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_category_lang 
    ON public.knowledge_documents(category, language, is_active);

-- 4. `chat_sessions` (Conversations for customer risk intelligence assistant)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64),
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. `chat_messages` (Chat messages with citations and role attributes)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session 
    ON public.chat_messages(session_id, created_at ASC);

-- 6. `chat_feedback` (User helpfulness ratings on chatbot answers)
CREATE TABLE IF NOT EXISTS public.chat_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating IN (1, -1)),
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. RPC Vector Similarity Search Function
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.45,
    match_count int DEFAULT 5,
    filter_category text DEFAULT NULL,
    filter_language text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    title VARCHAR(255),
    source VARCHAR(255),
    category VARCHAR(64),
    content TEXT,
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kc.id,
        kc.document_id,
        kd.title,
        kd.source,
        kd.category,
        kc.content,
        kc.metadata,
        (1 - (kc.embedding <=> query_embedding))::float AS similarity
    FROM public.knowledge_chunks kc
    JOIN public.knowledge_documents kd ON kd.id = kc.document_id
    WHERE kd.is_active = TRUE
      AND (filter_category IS NULL OR kd.category = filter_category)
      AND (filter_language IS NULL OR kd.language = filter_language)
      AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
    ORDER BY kc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 8. Row Level Security (RLS)
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

-- Knowledge base is readable by public/anon & authenticated users
CREATE POLICY "knowledge_docs_read_all"
    ON public.knowledge_documents FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "knowledge_chunks_read_all"
    ON public.knowledge_chunks FOR SELECT
    USING (true);

-- Knowledge base mutation is ADMIN only
CREATE POLICY "knowledge_docs_admin_all"
    ON public.knowledge_documents FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "knowledge_chunks_admin_all"
    ON public.knowledge_chunks FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'ADMIN')
    WITH CHECK (public.get_user_role() = 'ADMIN');

-- Chat sessions readable and insertable
CREATE POLICY "chat_sessions_all"
    ON public.chat_sessions FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "chat_messages_all"
    ON public.chat_messages FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "chat_feedback_all"
    ON public.chat_feedback FOR ALL
    USING (true)
    WITH CHECK (true);
