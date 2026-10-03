/**
 * UpayAche Frontend API Service.
 * Connects directly to FastAPI backend v1 endpoints.
 * All requests enforce Bearer authentication.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Fallback to default test analyst token during development if no session yet
    headers["Authorization"] = "Bearer test-analyst-token";
  }
  return headers;
}

export interface RiskSummaryData {
  total_analyzed: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  critical_risk_count: number;
  total_fraud_flagged: number;
  average_risk_score: number;
  fraud_rate_pct: number;
}

export interface RiskTrendPoint {
  period: string;
  transaction_count: number;
  high_risk_count: number;
  average_risk: number;
  total_amount_bdt: number;
}

export interface HighRiskTxItem {
  id: string;
  tx_hash?: string;
  amount: number;
  tx_type: string;
  timestamp: string;
  risk_score: number;
  risk_level: string;
  is_fraud: number;
  pattern_name?: string;
}

export interface SuspiciousWalletItem {
  id: string;
  wallet_number?: string;
  phone_number_masked?: string;
  wallet_type: string;
  risk_tier: string;
  balance: number;
  in_degree: number;
  out_degree: number;
  total_inflow: number;
  total_outflow: number;
}

export interface InvestigationNoteItem {
  id: string;
  case_id: string;
  author_id: string;
  author_role: string;
  content: string;
  note_type: string;
  created_at: string;
}

export interface InvestigationCaseItem {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  resolution: string;
  assigned_to?: string;
  target_wallet_id?: string;
  primary_transaction_id?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  notes?: InvestigationNoteItem[];
}

export interface ModelStatusData {
  model_name: string;
  model_version: string;
  algorithm: string;
  trained_at: string;
  train_samples: number;
  val_samples: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  is_synthetic_evaluation: boolean;
}

export async function fetchRiskSummary(token?: string | null): Promise<RiskSummaryData> {
  const res = await fetch(`${API_BASE}/api/v1/risk/summary`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch risk summary: HTTP ${res.status}`);
  return res.json();
}

export async function fetchRiskTrends(token?: string | null, timeframe: string = "7d"): Promise<RiskTrendPoint[]> {
  const res = await fetch(`${API_BASE}/api/v1/risk/trends?timeframe=${timeframe}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch risk trends: HTTP ${res.status}`);
  const data = await res.json();
  return data.points || [];
}

export async function fetchHighRiskTransactions(token?: string | null, limit: number = 10): Promise<HighRiskTxItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/risk/high-risk?limit=${limit}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch high-risk transactions: HTTP ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function fetchSuspiciousWallets(token?: string | null, limit: number = 5): Promise<SuspiciousWalletItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/network/high-risk?limit=${limit}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch suspicious networks: HTTP ${res.status}`);
  const data = await res.json();
  return data.high_risk_wallets || [];
}

export interface CreateCaseParams {
  title: string;
  description: string;
  target_wallet_id: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_transaction_id?: string;
}

export async function fetchInvestigations(
  params: { status?: string; priority?: string; limit?: number; offset?: number } = {},
  token?: string | null
): Promise<InvestigationCaseItem[]> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));

  const res = await fetch(`${API_BASE}/api/v1/investigations?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch investigations: HTTP ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function fetchActiveInvestigations(token?: string | null, limit: number = 5): Promise<InvestigationCaseItem[]> {
  return fetchInvestigations({ limit }, token);
}

export async function fetchSingleCase(
  caseId: string,
  token?: string | null
): Promise<InvestigationCaseItem> {
  const res = await fetch(`${API_BASE}/api/v1/investigations/${caseId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}: HTTP ${res.status}`);
  return res.json();
}

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export async function fetchAuditLogs(
  params: { limit?: number; offset?: number; resource_type?: string; resource_id?: string; actor_id?: string; action?: string } = {},
  token?: string | null
): Promise<{ items: AuditLogItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.resource_type) query.set("resource_type", params.resource_type);
  if (params.resource_id) query.set("resource_id", params.resource_id);
  if (params.actor_id) query.set("actor_id", params.actor_id);
  if (params.action) query.set("action", params.action);

  const res = await fetch(`${API_BASE}/api/v1/audit/logs?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch audit logs: HTTP ${res.status}`);
  return res.json();
}

export async function updateCaseStatus(
  caseId: string,
  payload: { status?: string; resolution?: string; assigned_to?: string; analyst_comment?: string },
  token?: string | null
): Promise<InvestigationCaseItem> {
  const res = await fetch(`${API_BASE}/api/v1/investigations/${caseId}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update case: HTTP ${res.status}`);
  return res.json();
}

export async function addCaseNote(
  caseId: string,
  content: string,
  noteType: string = "ANALYST",
  token?: string | null
): Promise<InvestigationNoteItem> {
  const res = await fetch(`${API_BASE}/api/v1/investigations/${caseId}/notes`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ content, note_type: noteType }),
  });
  if (!res.ok) throw new Error(`Failed to add note: HTTP ${res.status}`);
  return res.json();
}

export async function fetchModelStatus(token?: string | null): Promise<ModelStatusData> {
  const res = await fetch(`${API_BASE}/api/v1/risk/model/status`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch model status: HTTP ${res.status}`);
  return res.json();
}

export async function fetchTransactionDetail(id: string, token?: string | null): Promise<TransactionRiskDetailData> {
  const res = await fetch(`${API_BASE}/api/v1/risk/${id}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch transaction risk detail: HTTP ${res.status}`);
  return res.json();
}

export const fetchTransactionRiskDetail = fetchTransactionDetail;


export interface TransactionItem {
  id: string;
  tx_hash?: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  sender_phone_masked?: string;
  receiver_phone_masked?: string;
  tx_type: string;
  amount: number;
  fee: number;
  status: string;
  device_id?: string;
  location_id?: string;
  timestamp: string;
  pattern_id?: number;
  pattern_code?: string;
  pattern_name?: string;
  is_fraud: number;
  is_anomaly: number;
  risk_score: number;
  risk_level: string;
}

export interface TransactionListParams {
  limit?: number;
  offset?: number;
  wallet_id?: string;
  tx_type?: string;
  is_fraud?: number;
  is_anomaly?: number;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  risk_level?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_desc?: boolean;
}

export interface TransactionListResponseData {
  items: TransactionItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface FeatureContributionData {
  feature: string;
  feature_value: number;
  contribution: number;
  direction: "increased_risk" | "decreased_risk" | "neutral";
  human_readable_explanation: string;
}

export interface TransactionRiskDetailData {
  transaction_id: string;
  risk_score: number;
  risk_level: string;
  prediction: number;
  anomaly_score: number;
  is_anomaly: number;
  base_value: number;
  top_contributing_features: FeatureContributionData[];
  summary_narrative: string;
  model_version: string;
  timestamp: string;
}

export interface CreateCaseParams {
  title: string;
  description: string;
  target_wallet_id: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  primary_transaction_id?: string;
}

export interface AIInvestigationReportData {
  executive_summary: string;
  summary?: string;
  typology_hypothesis: string;
  confidence_level: "LOW" | "MEDIUM" | "HIGH";
  key_suspicious_indicators: string[];
  evidence?: string[];
  relevant_risk_factors?: string[];
  relevant_network_information?: string[];
  suggested_investigation_questions?: string[];
  recommended_actions: string[];
  structured_evidence?: StructuredRiskEvidence | null;
  tiered_response?: TieredInvestigationResponse | null;
}

export async function fetchTransactions(
  params: TransactionListParams = {},
  token?: string | null
): Promise<TransactionListResponseData> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.wallet_id) query.set("wallet_id", params.wallet_id);
  if (params.tx_type) query.set("tx_type", params.tx_type);
  if (params.is_fraud !== undefined) query.set("is_fraud", String(params.is_fraud));
  if (params.is_anomaly !== undefined) query.set("is_anomaly", String(params.is_anomaly));
  if (params.min_amount !== undefined) query.set("min_amount", String(params.min_amount));
  if (params.max_amount !== undefined) query.set("max_amount", String(params.max_amount));
  if (params.search) query.set("search", params.search);
  if (params.risk_level) query.set("risk_level", params.risk_level);
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date) query.set("end_date", params.end_date);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_desc !== undefined) query.set("sort_desc", String(params.sort_desc));

  const res = await fetch(`${API_BASE}/api/v1/transactions?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch transactions: HTTP ${res.status}`);
  return res.json();
}

export async function fetchSingleTransaction(id: string, token?: string | null): Promise<TransactionItem> {
  const res = await fetch(`${API_BASE}/api/v1/transactions/${id}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch transaction ${id}: HTTP ${res.status}`);
  return res.json();
}

export async function createInvestigationCase(
  payload: CreateCaseParams,
  token?: string | null
): Promise<InvestigationCaseItem> {
  const res = await fetch(`${API_BASE}/api/v1/investigations`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create case: HTTP ${res.status}`);
  return res.json();
}

export async function requestAICopilotInvestigation(
  caseId: string,
  focusArea: string = "MULE_STRUCTURING_ANALYSIS",
  question?: string | null,
  token?: string | null
): Promise<AIInvestigationReportData> {
  const payload: Record<string, unknown> = { case_id: caseId, focus_area: focusArea };
  if (question) payload.question = question;

  const res = await fetch(`${API_BASE}/api/v1/ai/investigate`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed AI Copilot investigation: HTTP ${res.status}`);
  const data = await res.json();
  const report = data.data;
  if (data.structured_evidence) report.structured_evidence = data.structured_evidence;
  if (data.tiered_response) report.tiered_response = data.tiered_response;
  return report;
}

export interface GraphNodeMetadata {
  wallet_number: string;
  phone_number_masked: string;
  wallet_type: string;
  balance: number;
  currency: string;
  status: string;
  kyc_status: string;
  primary_device_id?: string;
  registered_location_id?: string;
}

export interface GraphNodeRisk {
  risk_tier: string;
  is_synthetic_mule: boolean;
  mule_cluster_role?: string;
  suspicious_neighbors_count: number;
  suspicious_neighbor_ids: string[];
  network_concentration_score: number;
  in_cycle: boolean;
  pagerank: number;
}

export interface GraphNodeItem {
  id: string;
  label: string;
  degree: number;
  inbound_transactions: number;
  outbound_transactions: number;
  transaction_count: number;
  total_inflow: number;
  total_outflow: number;
  total_transferred_amount: number;
  component_id: number;
  metadata: GraphNodeMetadata;
  risk: GraphNodeRisk;
}

export interface GraphEdgeItem {
  id: string;
  source: string;
  target: string;
  amount: number;
  tx_type: string;
  timestamp: string;
  status: string;
  is_fraud?: number;
  is_anomaly?: number;
  risk_score?: number;
}

export interface NetworkGraphData {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  total_nodes: number;
  total_edges: number;
  graph_density?: number;
  graph_metadata?: {
    node_count?: number;
    edge_count?: number;
    density?: number;
    is_weakly_connected?: boolean;
    [key: string]: any;
  };
  is_directed?: boolean;
}

export interface WalletNetworkSummaryData {
  wallet_id: string;
  wallet_number: string;
  phone_number_masked: string;
  risk_tier: string;
  degree: number;
  inbound_transactions: number;
  outbound_transactions: number;
  transaction_count: number;
  total_inflow: number;
  total_outflow: number;
  total_transferred_amount: number;
  network_concentration: number;
  suspicious_neighbors_count: number;
  suspicious_neighbors: string[];
  component_id: number;
  component_size: number;
  in_cycle: boolean;
  pagerank: number;
}

export async function fetchOverviewGraph(limit: number = 75, token?: string | null): Promise<NetworkGraphData> {
  const res = await fetch(`${API_BASE}/api/v1/network/graph?limit=${limit}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch network graph: HTTP ${res.status}`);
  return res.json();
}

export async function fetchWalletEgoGraph(
  walletId: string,
  hops: number = 1,
  maxNodes: number = 50,
  token?: string | null
): Promise<NetworkGraphData> {
  const res = await fetch(`${API_BASE}/api/v1/network/graph/${walletId}?hops=${hops}&max_nodes=${maxNodes}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch wallet ego graph: HTTP ${res.status}`);
  return res.json();
}

export async function fetchWalletMetrics(
  walletId: string,
  token?: string | null
): Promise<WalletNetworkSummaryData> {
  const res = await fetch(`${API_BASE}/api/v1/network/metrics/${walletId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch wallet metrics: HTTP ${res.status}`);
  return res.json();
}

// -----------------------------------------------------------------------------
// System & Model Analytics Data Contracts (Phase 17)
// -----------------------------------------------------------------------------

export interface ConfusionMatrixData {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
}

export interface ModelPerformanceData {
  model_name: string;
  model_version: string;
  algorithm: string;
  model_type: string;
  trained_at: string;
  train_samples: number;
  val_samples: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  false_positive_rate: number;
  false_negative_rate: number;
  confusion_matrix: ConfusionMatrixData;
  pattern_breakdown?: Record<string, unknown>;
  is_synthetic_evaluation: boolean;
}

export interface RiskDistributionData {
  tier: string;
  count: number;
  percentage: number;
  min_score: number;
  max_score: number;
}

export interface AnomalyDistributionData {
  category: string;
  count: number;
  percentage: number;
  mean_score: number;
}

export interface ModelsAnalyticsData {
  models: ModelPerformanceData[];
  risk_distribution: RiskDistributionData[];
  anomaly_distribution: AnomalyDistributionData[];
  active_version: string;
  evaluation_notice: string;
}

export interface SystemAnalyticsData {
  transactions_analyzed: number;
  alerts_generated: number;
  investigations_created: number;
  investigations_closed: number;
  investigations_open: number;
  investigations_in_progress: number;
  investigations_reviewed: number;
  average_investigation_time_minutes: number;
  total_volume_analyzed_bdt: number;
  alert_rate_pct: number;
  resolution_rate_pct: number;
  evaluation_notice: string;
}

export async function fetchSystemAnalytics(token?: string | null): Promise<SystemAnalyticsData> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/system`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch system analytics: HTTP ${res.status}`);
  return res.json();
}

export async function fetchModelsAnalytics(token?: string | null): Promise<ModelsAnalyticsData> {
  const res = await fetch(`${API_BASE}/api/v1/analytics/models`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch models analytics: HTTP ${res.status}`);
  return res.json();
}

// ----------------------------------------------------------------------------
// Customer Risk Intelligence Chatbot & RAG API
// ----------------------------------------------------------------------------

export interface ChatCitation {
  document_id: string;
  title: string;
  source: string;
  category: string;
  snippet: string;
  similarity_score: number;
}

export interface SHAPContributionItem {
  feature: string;
  feature_value: number;
  contribution: number;
  direction: string;
  human_readable_explanation: string;
}

export interface StructuredRiskEvidence {
  risk_score: number | null;
  risk_level: string | null;
  top_risk_features: string[];
  shap_contributions: SHAPContributionItem[];
  anomaly_score: number | null;
  anomaly_reasons: string[];
  network_signals: string[];
  related_wallet_count: number | null;
  suspicious_connection_count: number | null;
  transaction_context: Record<string, any>;
  model_source: string;
}

export interface TieredInvestigationResponse {
  model_result: {
    risk_score: number | null;
    risk_level: string;
    anomaly_score: number | null;
    anomaly_level: string;
    primary_model: string;
    anomaly_model: string;
  };
  evidence: {
    transaction_context: Record<string, any>;
    top_risk_features: string[];
    shap_contributions: any[];
    anomaly_reasons: string[];
    network_signals: string[];
    related_wallet_count: number | null;
    suspicious_connection_count: number | null;
  };
  ai_explanation: {
    executive_summary: string;
    typology_hypothesis: string;
    confidence_level: string;
    risk_breakdown: string;
    anomaly_explanation: string;
    network_explanation: string;
    investigation_guidance: string[];
    recommended_actions: string[];
  };
}

export interface ChatMessageResponse {
  id: string;
  session_id: string;
  role: string;
  content: string;
  citations: ChatCitation[];
  confidence_tier: "HIGH" | "MEDIUM" | "LOW";
  disclaimer: string;
  suggested_actions: string[];
  created_at: string;
  structured_evidence?: StructuredRiskEvidence | null;
  tiered_response?: TieredInvestigationResponse | null;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatHistoryResponse {
  session_id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    citations?: ChatCitation[];
    created_at: string;
  }>;
}

export interface KnowledgeTopic {
  category: string;
  label: string;
  description: string;
  suggested_prompts: string[];
}

export async function sendChatMessage(
  message: string,
  sessionId?: string,
  categoryFilter?: string,
  language: string = "auto",
  token?: string | null
): Promise<ChatMessageResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/message`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      message,
      session_id: sessionId || null,
      category_filter: categoryFilter || null,
      language,
    }),
  });
  if (!res.ok) throw new Error(`Chat request failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchChatSessions(token?: string | null): Promise<ChatSessionItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/chat/sessions`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch chat sessions: HTTP ${res.status}`);
  const data = await res.json();
  return data.sessions || [];
}

export async function fetchChatHistory(sessionId: string, token?: string | null): Promise<ChatHistoryResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/sessions/${sessionId}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch chat history: HTTP ${res.status}`);
  return res.json();
}

export async function submitChatFeedback(
  messageId: string,
  rating: number,
  feedbackText?: string,
  token?: string | null
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/v1/chat/feedback`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      message_id: messageId,
      rating,
      feedback_text: feedbackText || null,
    }),
  });
  if (!res.ok) throw new Error(`Failed to submit feedback: HTTP ${res.status}`);
  return res.json();
}

export async function fetchKnowledgeTopics(token?: string | null): Promise<KnowledgeTopic[]> {
  const res = await fetch(`${API_BASE}/api/v1/chat/topics`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch topics: HTTP ${res.status}`);
  return res.json();
}

export async function deleteChatSession(
  sessionId: string,
  token?: string | null
): Promise<{ status: string; session_id: string }> {
  const res = await fetch(`${API_BASE}/api/v1/chat/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete chat session: HTTP ${res.status}`);
  return res.json();
}

export interface KnowledgeArticleItem {
  id: string;
  title: string;
  source: string;
  category: string;
  language: string;
  version: string;
  content: string;
  updated_at: string;
  provenance_type: "PROTOTYPE" | "GENERAL_MFS_SECURITY" | "EXTERNAL_OFFICIAL" | string;
  metadata?: {
    keywords?: string[];
    suggested_prompts?: string[];
    [key: string]: any;
  };
}

export async function fetchKnowledgeArticles(
  params: { q?: string; category?: string; language?: string } = {},
  token?: string | null
): Promise<KnowledgeArticleItem[]> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.language) query.set("language", params.language);

  const res = await fetch(`${API_BASE}/api/v1/chat/knowledge?${query.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch knowledge articles: HTTP ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function resetDemoData(token?: string | null): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/investigations/reset-demo`, {
    method: "POST",
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to reset demo data: HTTP ${res.status}`);
  return res.json();
}



