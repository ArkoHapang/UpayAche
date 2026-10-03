"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  AlertTriangle,
  Cpu,
  Network,
  Activity,
  Smartphone,
  FileText,
  Check,
  Copy,
  Info,
  PhoneCall,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  X,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AppShell,
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from "@/components/design-system";
import {
  fetchKnowledgeArticles,
  KnowledgeArticleItem,
  fetchKnowledgeTopics
} from "@/lib/api";

// -----------------------------------------------------------------------------
// Curated Seed Knowledge Base (11 Prescribed Sections)
// Factual, zero hallucinated official policies, with explicit provenance tagging.
// -----------------------------------------------------------------------------
interface HelpArticle {
  id: string;
  title: string;
  category:
    | "GETTING_STARTED"
    | "TRANSACTION_RISK"
    | "SECURITY"
    | "SCAM_AWARENESS"
    | "MULE_NETWORKS"
    | "ANOMALY_DETECTION"
    | "NETWORK_INTELLIGENCE"
    | "AI_EXPLAINABILITY"
    | "PRIVACY"
    | "RESPONSIBLE_AI"
    | "FAQ";
  categoryLabel: string;
  updatedDate: string;
  source: string;
  provenance: "PROTOTYPE" | "GENERAL_MFS_SECURITY" | "OFFICIAL_EXTERNAL";
  summary: string;
  content: string;
  suggestedPrompt: string;
  keywords: string[];
}

const SEED_HELP_ARTICLES: HelpArticle[] = [
  // 1. Getting Started
  {
    id: "art-start-001",
    title: "UpayAche Platform Architecture & Forensic Workflows",
    category: "GETTING_STARTED",
    categoryLabel: "Getting Started",
    updatedDate: "October 2026",
    source: "UpayAche System Architecture v1.0",
    provenance: "PROTOTYPE",
    summary: "How UpayAche combines supervised ML, unsupervised anomaly detection, graph intelligence, and guarded LLM copilot.",
    content: `UpayAche is an AI-powered MFS risk and scam intelligence platform developed as a student hackathon prototype inspired by the DIU CPC × upay AI Hackathon 2026.

The platform executes a strict forensic pipeline:
1. Synthetic Data Ingestion: Ingests 100% synthetic MFS transactions with zero PII (phone numbers masked as 017****1234).
2. Feature Store: Computes 24 velocity, temporal, and counterparty graph features.
3. Supervised Risk Scoring: Evaluates numerical fraud probability using a trained XGBoost classifier (0.00 to 1.00).
4. Unsupervised Anomaly Detection: Detects behavioral outliers using Isolation Forest.
5. Graph & Network Analysis: Analyzes topological connectivity, directed cycles, and PageRank with NetworkX.
6. Local Explainability: Computes additive feature attributions using SHAP TreeExplainer.
7. Guarded AI Copilot: Synthesizes evidence dossiers using Gemini 1.5 with strict human-in-the-loop boundaries.
8. Analyst Workspace: Enables human compliance investigators to triage alerts and resolve cases.`,
    suggestedPrompt: "How does the UpayAche architecture and investigation pipeline work?",
    keywords: ["getting started", "architecture", "pipeline", "prototype", "hackathon", "workflow"]
  },
  {
    id: "art-start-002",
    title: "User Roles, Investigation State Machine & Governance",
    category: "GETTING_STARTED",
    categoryLabel: "Getting Started",
    updatedDate: "October 2026",
    source: "UpayAche Governance Guidelines",
    provenance: "PROTOTYPE",
    summary: "Role-based access permissions and the strict linear state machine for case resolution.",
    content: `UpayAche enforces strict Role-Based Access Control (RBAC) and state transitions:

User Roles:
- ADMIN: Full administrative system tuning, user provisioning, threshold configuration, and immutable audit log review.
- ANALYST: Primary operational investigator. Triages alerts, transitions case states, submits notes, and queries Gemini assistant.
- VIEWER: Read-only access to dashboard, transaction ledger, and 3D network view. Blocked from mutations.
- CUSTOMER: Restricted to customer-facing risk guidance and security Q&A via the AI Assistant. Forbidden from internal investigations or audit logs.

Investigation State Machine:
Cases strictly transition: [OPEN] -> [INVESTIGATING] -> [REVIEWED] -> [CLOSED].
Direct transitions like OPEN -> CLOSED without review are strictly rejected with HTTP 422. Closing requires an explicit resolution: CONFIRMED_FRAUD, FALSE_POSITIVE, or SUSPICIOUS_MONITOR.`,
    suggestedPrompt: "What are the user roles and investigation case states in UpayAche?",
    keywords: ["roles", "rbac", "admin", "analyst", "viewer", "state machine", "governance"]
  },

  // 2. Transaction Risk
  {
    id: "art-risk-001",
    title: "Why Transactions Get Flagged for Risk",
    category: "TRANSACTION_RISK",
    categoryLabel: "Transaction Risk",
    updatedDate: "October 2026",
    source: "UpayAche Risk Intelligence Guide v1.0",
    provenance: "PROTOTYPE",
    summary: "The primary behavioral anomalies, statistical outliers, and graph signals that trigger ML risk alerts.",
    content: `Transactions are flagged by the UpayAche Risk Engine based on empirical signals evaluated by machine learning models:

1. Velocity Spikes: Unusually frequent transfers within 10 minutes or 1 hour departing from the user's historical baseline.
2. Amount Outliers: A transaction significantly exceeding the sender's 30-day average transaction amount (e.g. 3.5x to 10x higher).
3. Nocturnal Activity: High-value transfers initiated during late-night hours (1:00 AM to 5:00 AM) that deviate from customary diurnal patterns.
4. Flagged Counterparty Wallets: Sending funds to or receiving funds from accounts associated with known mule clusters or active fraud cases.
5. Inflow-to-Outflow Draining: A wallet receiving a deposit and immediately draining 95%+ of the balance via Cash-Out within minutes.
6. Dormant Reactivation: A wallet inactive for months suddenly initiating maximum-limit transfers.

Important: A risk alert queues the transaction for human compliance triage; it does not automatically block legitimate accounts.`,
    suggestedPrompt: "Why was this transaction flagged for risk?",
    keywords: ["flagged", "transaction flagged", "why flagged", "velocity", "outlier", "nocturnal", "dormant"]
  },
  {
    id: "art-risk-002",
    title: "Understanding Risk Scores, Tiers & Thresholds",
    category: "TRANSACTION_RISK",
    categoryLabel: "Transaction Risk",
    updatedDate: "October 2026",
    source: "UpayAche Model Scoring Standards",
    provenance: "PROTOTYPE",
    summary: "How XGBoost outputs composite risk scores from 0.00 to 1.00 mapped to four operational risk tiers.",
    content: `UpayAche calculates a continuous risk score between 0.000 (safest) and 1.000 (highest risk) using an XGBoost gradient boosted classifier.

Operational Risk Tiers:
- LOW (0.00 - 0.29): Routine, benign transactions conforming to historical baselines. Processed with zero friction.
- MEDIUM (0.30 - 0.69): Mild deviations, such as first-time counterparty transfers or slightly elevated amounts. Passively monitored.
- HIGH (0.70 - 0.89): Notable statistical anomalies such as sudden velocity bursts or abnormal nocturnal cash-outs. Generates an automated alert.
- CRITICAL (0.90 - 1.00): High-probability fraud patterns like rapid smurfing fan-in or known mule syndicates. Prioritized for immediate human analyst investigation.`,
    suggestedPrompt: "What does a high risk score mean and how are tiers calculated?",
    keywords: ["risk score", "risk tiers", "low risk", "medium risk", "high risk", "critical", "xgboost", "thresholds"]
  },

  // 3. Security
  {
    id: "art-sec-001",
    title: "OTP & PIN Defense Protocol: The Golden Rules",
    category: "SECURITY",
    categoryLabel: "Security",
    updatedDate: "October 2026",
    source: "UpayAche Security Protocol",
    provenance: "GENERAL_MFS_SECURITY",
    summary: "Universal security rules for protecting mobile financial credentials against social engineering.",
    content: `Personal Identification Numbers (PIN) and One-Time Passwords (OTP) are your primary security barriers in mobile financial services.

THE GOLDEN RULES:
1. Never Disclose OTP or PIN: Official customer service representatives, agents, bank staff, or law enforcement will NEVER ask for your PIN or OTP under any circumstance.
2. Dial PIN Privately: Always enter your PIN yourself on your device keypad. Never tell an MFS agent to type your PIN for you at cash-in or cash-out points.
3. Avoid Obvious PIN Patterns: Do not use birth years (e.g. 1998, 2002), sequential numbers (1234, 5678), or repeated digits (1111, 0000).
4. Beware of Urgency: Scammers fabricate false emergencies (e.g. 'account suspension', 'lottery winner') to panic victims into revealing OTPs.
5. If You Accidentally Share Credentials: Immediately change your PIN via your mobile app/USSD or contact official customer support to temporarily lock your account.`,
    suggestedPrompt: "What should I do if someone asks for my OTP or PIN?",
    keywords: ["otp", "pin", "security", "credentials", "golden rule", "pin safety", "agent"]
  },
  {
    id: "art-sec-002",
    title: "Device Security, Terminal Fingerprinting & Lost Phones",
    category: "SECURITY",
    categoryLabel: "Security",
    updatedDate: "October 2026",
    source: "MFS Mobile Defense Playbook",
    provenance: "GENERAL_MFS_SECURITY",
    summary: "Safeguarding smartphone hardware, avoiding rogue APKs, and emergency procedures if a device is lost.",
    content: `Device-level security is critical for preventing unauthorized mobile financial access:

1. Device Fingerprinting: UpayAche monitors device identifiers and SIM bindings. If a transaction originates from an unrecognized device, risk scores are elevated to protect account holders.
2. Avoid Rooted or Jailbroken Devices: Operating system tampering bypasses sandboxing, enabling malicious apps to log keystrokes and intercept SMS OTP notifications.
3. Do Not Install Unverified APKs: Only download official MFS applications from authorized app stores (Google Play, Apple App Store). Avoid third-party modded apps.
4. Lost or Stolen Phone Emergency Procedure:
   - Call the official helpline (e.g. 16268 for upay) immediately from another phone to request temporary suspension of your MFS wallet.
   - Contact your mobile network operator to block and reissue the SIM card.
   - File a General Diary (GD) with local police if the device was stolen.`,
    suggestedPrompt: "What should I do if I lose my phone with my MFS wallet on it?",
    keywords: ["lost phone", "device security", "fingerprint", "rooted phone", "apk", "sim lost", "emergency"]
  },

  // 4. Scam Awareness
  {
    id: "art-scam-001",
    title: "Common MFS Scams in Bangladesh: Detection & Defense",
    category: "SCAM_AWARENESS",
    categoryLabel: "Scam Awareness",
    updatedDate: "October 2026",
    source: "UpayAche Fraud Intelligence Bulletin",
    provenance: "GENERAL_MFS_SECURITY",
    summary: "Recognizing fake prize campaigns, accidental cash-in scams, and impersonation schemes.",
    content: `Fraud syndicates employ social engineering to manipulate consumers:

1. Fake Prize / Campaign Scams:
   - Modus: Scammers call claiming you have won a car, gold, or 50,000 BDT in a campaign, and ask for a 'processing fee' or OTP verification.
   - Reality: Legitimate MFS campaigns never ask winners to pay money or share credentials to claim prizes.

2. The Accidental Cash-In Scam:
   - Modus: The victim receives a fake SMS mimicking a cash-in notification, followed by an urgent call claiming the sender accidentally sent money to their number and demands an immediate refund.
   - Reality: Always check your actual wallet balance inside the official app or via USSD (*268#). Never trust SMS text alone.

3. Official Customer Service Impersonation:
   - Modus: Callers claim to be technical officers informing you that your wallet has KYC issues and will be shut down unless you read out an SMS code.
   - Reality: Real customer care representatives cannot and will not ask for one-time passwords.`,
    suggestedPrompt: "How can I recognize common MFS scams like fake lottery or accidental cash-in?",
    keywords: ["scams", "phishing", "fake prize", "lottery scam", "accidental cash in", "impersonation", "social engineering"]
  },
  {
    id: "art-scam-002",
    title: "Emergency Family Distress & Hospital Impersonation Scams",
    category: "SCAM_AWARENESS",
    categoryLabel: "Scam Awareness",
    updatedDate: "October 2026",
    source: "UpayAche Scam Awareness Center",
    provenance: "GENERAL_MFS_SECURITY",
    summary: "How to counter panic-inducing calls claiming a family member is injured or arrested.",
    content: `Emergency distress scams exploit emotional panic:

Modus Operandi:
Fraudsters call victims claiming their son, daughter, or close relative was involved in a severe road accident or arrested by police, and requires immediate hospital deposit or bail money via MFS. Background noises (crying, sirens) are frequently fabricated.

Defensive Protocol:
1. Stay Calm & Take a Breath: Scammers rely on artificial urgency to bypass your rational judgment.
2. Verify Independently: Hang up and call your relative directly on their known personal phone number.
3. Cross-Check with Mutual Friends: If their phone is unreachable, call their workplace, school, or spouse.
4. Ask a Security Question: Ask a question only your actual relative would know (e.g., grandfather's name or childhood memory).
5. Never Send Funds in Haste: Legitimate emergency responders will not demand untraceable peer-to-peer transfers before administering aid.`,
    suggestedPrompt: "How do emergency distress scams work and how can I protect myself?",
    keywords: ["emergency scam", "hospital scam", "accident scam", "police scam", "distress call", "relative scam"]
  },

  // 5. Mule Networks
  {
    id: "art-mule-001",
    title: "What is a Mule Account and Why is Renting Wallets Illegal?",
    category: "MULE_NETWORKS",
    categoryLabel: "Mule Networks",
    updatedDate: "October 2026",
    source: "UpayAche AML Compliance Digest",
    provenance: "GENERAL_MFS_SECURITY",
    summary: "The definition of money mules, syndicate recruitment tactics, and statutory legal consequences.",
    content: `A 'money mule' is someone who allows their bank account or mobile financial wallet to receive and transfer funds on behalf of criminals, concealing the criminal network's identity.

How Syndicates Recruit:
- Fake Work-from-Home Jobs: Promising 5% to 10% commission simply for forwarding incoming deposits.
- Social Media Offers: Ads requesting to 'rent' verified MFS accounts for gaming, cryptocurrency, or e-commerce payments.
- Trust Exploitation: Acquaintances asking to 'hold money temporarily' due to their own account limits.

Legal & Regulatory Consequences:
Under the Bangladesh Money Laundering Prevention Act, operating or permitting your wallet to be used as a money mule is a serious criminal offense. Even if you claim ignorance of the criminal origin of the money:
- Your MFS wallet and bank accounts will be blacklisted across the entire financial sector.
- Your National ID (NID) will be flagged for regulatory sanctions.
- You face criminal prosecution and imprisonment under financial crime laws.
Never allow strangers to deposit, hold, or route money through your personal account.`,
    suggestedPrompt: "What is a mule account and what are the legal consequences under Bangladesh law?",
    keywords: ["mule account", "money mule", "syndicate", "commission scam", "rent wallet", "money laundering", "legal penalty"]
  },
  {
    id: "art-mule-002",
    title: "Mule Ring Typologies: Smurfing, Fan-In & Rapid Cash-Out",
    category: "MULE_NETWORKS",
    categoryLabel: "Mule Networks",
    updatedDate: "October 2026",
    source: "UpayAche Financial Crime Patterns",
    provenance: "PROTOTYPE",
    summary: "How illicit networks structure funds through multiple intermediate wallets to bypass reporting thresholds.",
    content: `UpayAche models three primary mule syndicate typologies:

1. Smurfing Fan-In:
   - A coordinator directs dozens of small, sub-threshold transfers (e.g., 2,000 to 5,000 BDT) from multiple compromised accounts into a central accumulator wallet.
   - Purpose: Evading automated threshold flags for large individual transfers.

2. Rapid Cash-Out Hop:
   - Once accumulated, 95%+ of the illicit funds are routed to an agent outlet and converted to physical cash within 10 to 20 minutes.
   - Purpose: Breaking the electronic audit trail before victims report unauthorized transactions.

3. Multi-Hop Relays:
   - Sending funds across 3 to 5 successive intermediate wallets across different mobile operators to obfuscate the origin of funds.
   UpayAche's NetworkX graph engine detects these multi-hop patterns through path analysis and in-degree/out-degree concentration metrics.`,
    suggestedPrompt: "What are the common mule ring typologies like smurfing and rapid cash-out?",
    keywords: ["smurfing", "fan in", "mule ring", "rapid cash out", "layering", "structuring", "multi hop"]
  },

  // 6. Anomaly Detection
  {
    id: "art-anom-001",
    title: "Unsupervised Behavioral Anomaly Detection with Isolation Forest",
    category: "ANOMALY_DETECTION",
    categoryLabel: "Anomaly Detection",
    updatedDate: "October 2026",
    source: "UpayAche ML Engine Specifications",
    provenance: "PROTOTYPE",
    summary: "How Isolation Forest detects unknown, zero-day fraud patterns without requiring prior fraud labels.",
    content: `While supervised models (XGBoost) excel at recognizing known fraud patterns, novel attack vectors may lack historical training labels. UpayAche implements an unsupervised Isolation Forest model to detect unknown anomalies.

How Isolation Forest Operates:
1. Multi-Dimensional Isolation: The algorithm recursively partitions data points across feature dimensions (amount, velocity, time of day, transfer channel, counterparty novelty).
2. Path Length Metric: Normal, routine transactions require many partitions to isolate deep within tree structures. Anomalous, extreme outliers are isolated in very few partitions (short path length).
3. Continuous Anomaly Score: Outputs a score between 0.00 and 1.00. Transactions scoring above 0.650 are flagged as anomalous.
4. Complementary to Supervised ML: A transaction might not match known scam patterns, but if it radically deviates from the user's 6-month behavioral profile, the anomaly engine flags it for investigator review.`,
    suggestedPrompt: "How does the Isolation Forest behavioral anomaly detection work in UpayAche?",
    keywords: ["isolation forest", "anomaly detection", "unsupervised", "behavioral modeling", "outlier", "novel fraud"]
  },

  // 7. Network Intelligence
  {
    id: "art-net-001",
    title: "Graph Topology, Circular Layering Loops & PageRank",
    category: "NETWORK_INTELLIGENCE",
    categoryLabel: "Network Intelligence",
    updatedDate: "October 2026",
    source: "UpayAche Graph Analytics Whitepaper",
    provenance: "PROTOTYPE",
    summary: "How NetworkX directed multigraphs uncover circular layering, hub accounts, and syndicate clusters.",
    content: `UpayAche constructs a directed multigraph of wallet interactions using NetworkX:

Key Topological Indicators:
1. Circular Layering Loops (Cycles):
   - Wallets routing money in directed cycles (e.g. Wallet A -> Wallet B -> Wallet C -> Wallet A).
   - In legitimate retail commerce, money rarely flows in closed cycles. Circular flows indicate artificial volume generation or structuring to disguise fund origins.

2. PageRank Centrality:
   - Measures the structural influence of a wallet within the network based on the quality and volume of connected counterparties. High-PageRank nodes in abnormal clusters represent syndicate hubs or aggregator nodes.

3. Network Concentration Score:
   - Evaluates whether transactions are distributed across diverse parties or tightly concentrated within a secluded, high-risk community.

4. 3D WebGL Visualization:
   - Renders the interactive graph topology using Three.js and React Three Fiber, allowing analysts to zoom, rotate, filter by risk tier, and trace suspicious money flows in three-dimensional space.`,
    suggestedPrompt: "How does UpayAche detect circular layering loops and graph anomalies?",
    keywords: ["network intelligence", "graph", "networkx", "pagerank", "circular loop", "cycles", "clustering", "3d graph"]
  },

  // 8. AI & Explainability
  {
    id: "art-ai-001",
    title: "SHAP Explainability: Demystifying the Black Box",
    category: "AI_EXPLAINABILITY",
    categoryLabel: "AI & Explainability",
    updatedDate: "October 2026",
    source: "UpayAche Explainable AI Architecture",
    provenance: "PROTOTYPE",
    summary: "How TreeExplainer calculates exact, additive feature attributions for every risk prediction.",
    content: `Traditional machine learning models are often criticized as 'black boxes' that output a score without explanation. UpayAche resolves this using SHAP (SHapley Additive exPlanations) based on cooperative game theory.

How SHAP TreeExplainer Works:
1. Baseline Value: Starts at the expected average risk score across all transactions (e.g., base value = 0.100).
2. Additive Attributions: Every feature receives an exact numerical SHAP contribution (+ or -) showing how much it pushed the risk score above or below baseline.
   - Positive Contribution (+): Factors increasing risk (e.g. +0.285 from velocity spike, +0.210 from amount deviation).
   - Negative Contribution (-): Factors mitigating risk (e.g. -0.065 from established wallet age, -0.040 from clean historical dispute record).
3. Mathematical Consistency: The sum of all SHAP values plus the base value equals the exact final risk score output by XGBoost.
4. Zero Hallucination: Explanations are mathematically derived directly from the tree structure, never fabricated or guessed by an LLM.`,
    suggestedPrompt: "How does SHAP explain why a transaction received a high risk score?",
    keywords: ["shap", "treeexplainer", "explainable ai", "attributions", "feature importance", "transparency", "black box"]
  },

  // 9. Privacy
  {
    id: "art-priv-001",
    title: "Zero PII Architecture & Synthetic Data Framework",
    category: "PRIVACY",
    categoryLabel: "Privacy",
    updatedDate: "October 2026",
    source: "UpayAche Data Protection Protocol",
    provenance: "PROTOTYPE",
    summary: "100% synthetic dataset, masked identifiers, zero storage of real customer NID or biometric data.",
    content: `Privacy and data sovereignty are fundamental design invariants in UpayAche:

1. 100% Synthetic Telemetry:
   - All transactions, account balances, and wallet identifiers in UpayAche are generated using mathematically realistic synthetic distributions.
   - Zero real customer PII (Personally Identifiable Information), real National ID numbers, biometric records, or bank passwords exist in the database.

2. Phone Number Masking:
   - All synthetic mobile numbers follow standard MFS masking: \`017****1234\`. Real identities are never exposed in user interfaces, logs, or LLM context windows.

3. Secure Secrets & Row-Level Security:
   - Supabase PostgreSQL implements Row-Level Security (RLS) on all tables.
   - Customer and Viewer roles are strictly prevented from querying internal investigation dockets or actor audit logs.
   - Service-role credentials and API keys are strictly confined to backend microservices and are never exposed to browser clients.`,
    suggestedPrompt: "How does UpayAche ensure zero PII and protect customer data privacy?",
    keywords: ["privacy", "zero pii", "synthetic data", "masking", "rls", "row level security", "gdpr", "compliance"]
  },

  // 10. Responsible AI
  {
    id: "art-resp-001",
    title: "Responsible AI Guardrails & Human-in-the-Loop Invariants",
    category: "RESPONSIBLE_AI",
    categoryLabel: "Responsible AI",
    updatedDate: "October 2026",
    source: "UpayAche AI Ethics Charter",
    provenance: "PROTOTYPE",
    summary: "Why AI serves strictly as an analyst assistant and can never automatically block wallets or move funds.",
    content: `In high-stakes financial operations, autonomous AI models must not make unilateral, irreversible decisions that harm consumers. UpayAche enforces strict Responsible AI guardrails:

NON-NEGOTIABLE AI INVARIANTS:
1. Never Automatically Block a Wallet:
   - AI risk scores and Gemini Copilot summaries are strictly advisory intelligence tools for human investigators.
   - Freezing accounts, imposing financial sanctions, or filing SAR reports requires formal review and sign-off by a human compliance officer.

2. Gemini Copilot Execution Restrictions:
   The LLM assistant is bounded by pre-validated schemas and strictly CANNOT:
   - Transfer money or issue refunds.
   - Block, suspend, or reactivate wallets.
   - Modify account balances or user roles.
   - Execute SQL queries or arbitrary code.
   - Access database credentials, server secrets, or private keys.

3. Immutable Append-Only Audit Trail:
   - Every analyst decision, case state transition, note entry, and AI query is recorded in an immutable PostgreSQL audit log with timestamps, actor IDs, and IP addresses. Audit logs cannot be updated or deleted.`,
    suggestedPrompt: "Can the AI automatically block an account or transfer money?",
    keywords: ["responsible ai", "guardrails", "human in the loop", "ethics", "never auto block", "audit trail", "safety"]
  },

  // 11. Frequently Asked Questions (FAQ)
  {
    id: "art-faq-001",
    title: "Can UpayAche AI refund my money or unblock my account?",
    category: "FAQ",
    categoryLabel: "Frequently Asked Questions",
    updatedDate: "October 2026",
    source: "UpayAche FAQ",
    provenance: "PROTOTYPE",
    summary: "Clear explanation of assistant capabilities and official support escalation channels.",
    content: `No. UpayAche AI is an educational and forensic investigation copilot designed for the hackathon prototype. It operates with strict read-only safety guardrails:

- It CANNOT transfer money, cancel transactions, or issue refunds.
- It CANNOT unblock, freeze, or modify wallet accounts.
- It CANNOT access real banking credentials or live customer records.

For Live Account Escalation:
If you need account alterations, transaction disputes, or PIN resets on your official upay wallet, you must contact official upay customer support directly:
- Official Helpline: 16268 (Available 24/7)
- Email: support@upaybd.com
- In Person: Visit an authorized upay customer care center.`,
    suggestedPrompt: "Can you refund my money or unblock my account?",
    keywords: ["faq", "refund", "unblock", "help", "customer service", "helpline", "16268"]
  },
  {
    id: "art-faq-002",
    title: "Is UpayAche an official product of upay / UCB?",
    category: "FAQ",
    categoryLabel: "Frequently Asked Questions",
    updatedDate: "October 2026",
    source: "UpayAche Prototype Disclaimer",
    provenance: "PROTOTYPE",
    summary: "Clarification of student hackathon prototype provenance and non-affiliation.",
    content: `No. UpayAche is a student hackathon prototype created for the DIU CPC × upay AI Hackathon 2026.

Important Clarifications:
- NOT an Official upay Product: UpayAche is an independent technology demonstration designed to showcase explainable AI, graph intelligence, and responsible fraud detection for MFS ecosystems.
- 100% Synthetic Data: All accounts, transactions, and risk alerts are synthetic demonstrations with zero connection to real customer accounts or live financial ledgers.
- Prototype Guidance: Knowledge articles and AI assistant outputs are provided for educational risk intelligence and scam awareness purposes.`,
    suggestedPrompt: "Is UpayAche an official upay product?",
    keywords: ["faq", "official product", "disclaimer", "hackathon", "diu cpc", "prototype"]
  },
  {
    id: "art-faq-003",
    title: "What should I do if I suspect an agent or caller is attempting a scam?",
    category: "FAQ",
    categoryLabel: "Frequently Asked Questions",
    updatedDate: "October 2026",
    source: "General MFS Security Standard",
    provenance: "GENERAL_MFS_SECURITY",
    summary: "Immediate steps to protect yourself against suspected fraud attempts.",
    content: `If you receive a suspicious call or encounter an agent demanding unusual fees or credentials:

1. Terminate the Call Immediately: Do not engage in conversation or follow instructions to press numbers or read SMS messages.
2. Never Read Out Any Code: OTP codes contain warnings explicitly stating they should not be shared.
3. Check Balance Privately: Open the official MFS mobile application or dial official USSD (*268# for upay) to independently verify balance.
4. Report the Number: Note the caller's phone number and report it to the official MFS helpline (16268) and the National Emergency Helpline (999 or 333 if reporting cyber crime).`,
    suggestedPrompt: "What should I do if a caller or agent is trying to scam me?",
    keywords: ["faq", "scam caller", "agent scam", "report fraud", "otp scam", "helpline"]
  }
];

export default function HelpKnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProvenance, setSelectedProvenance] = useState<string>("ALL");
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("art-faq-001");
  const [remoteArticles, setRemoteArticles] = useState<KnowledgeArticleItem[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState<boolean>(false);

  // Load articles from backend RAG service if available
  useEffect(() => {
    let isMounted = true;
    async function loadRemoteKnowledge() {
      setIsLoadingRemote(true);
      try {
        const data = await fetchKnowledgeArticles();
        if (isMounted && data && data.length > 0) {
          setRemoteArticles(data);
        }
      } catch (err) {
        // Fallback to rich seed articles seamlessly
        console.warn("Using local curated knowledge articles index:", err);
      } finally {
        if (isMounted) setIsLoadingRemote(false);
      }
    }
    loadRemoteKnowledge();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter articles by query, category, and provenance
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return SEED_HELP_ARTICLES.filter((art) => {
      // Category match
      if (selectedCategory !== "ALL" && art.category !== selectedCategory) {
        return false;
      }
      // Provenance match
      if (selectedProvenance !== "ALL" && art.provenance !== selectedProvenance) {
        return false;
      }
      // Search query match
      if (!q) return true;

      const titleMatch = art.title.toLowerCase().includes(q);
      const summaryMatch = art.summary.toLowerCase().includes(q);
      const contentMatch = art.content.toLowerCase().includes(q);
      const keywordMatch = art.keywords.some((kw) => kw.toLowerCase().includes(q));
      const sourceMatch = art.source.toLowerCase().includes(q);

      return titleMatch || summaryMatch || contentMatch || keywordMatch || sourceMatch;
    });
  }, [searchQuery, selectedCategory, selectedProvenance]);

  // Handle Triggering UpayAche AI Chatbot from an Article
  const handleAskAI = (article: HelpArticle) => {
    const promptToSend = article.suggestedPrompt || `Tell me more about: ${article.title}`;
    // Dispatch global event caught by AIChatWidget
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-upayache-ai", {
          detail: { prompt: promptToSend }
        })
      );
    }
  };

  const handleCopyLink = (articleId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/help#${articleId}`);
      setCopiedArticleId(articleId);
      setTimeout(() => setCopiedArticleId(null), 2000);
    }
  };

  // Section categories list
  const categoryFilters = [
    { key: "ALL", label: "All Categories" },
    { key: "GETTING_STARTED", label: "Getting Started" },
    { key: "TRANSACTION_RISK", label: "Transaction Risk" },
    { key: "SECURITY", label: "Security" },
    { key: "SCAM_AWARENESS", label: "Scam Awareness" },
    { key: "MULE_NETWORKS", label: "Mule Networks" },
    { key: "ANOMALY_DETECTION", label: "Anomaly Detection" },
    { key: "NETWORK_INTELLIGENCE", label: "Network Intelligence" },
    { key: "AI_EXPLAINABILITY", label: "AI & Explainability" },
    { key: "PRIVACY", label: "Privacy" },
    { key: "RESPONSIBLE_AI", label: "Responsible AI" },
    { key: "FAQ", label: "FAQs" },
  ];

  return (
    <AppShell activePath="/help">
      <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans">

        {/* ===================================================================== */}
        {/* HERO & SEARCH BAR SECTION                                             */}
        {/* ===================================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002A54] via-[#003875] to-[#001830] text-white p-8 sm:p-12 shadow-xl border border-blue-900/60">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFD602] text-xs font-mono font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>UpayAche Knowledge &amp; Security Base</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-sans text-white">
              How can we help you stay safe?
            </h1>

            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-sans max-w-2xl">
              Search verified MFS risk intelligence, account security playbooks, scam awareness, and explainable AI architecture.
            </p>

            {/* Prominent Search Bar */}
            <div className="pt-2 relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, scam playbooks, SHAP, velocity, mule accounts..."
                  className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 placeholder-slate-400 text-sm font-sans rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#007BFF]/50 border border-slate-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 p-1"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
            <ShieldCheck className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* PROVENANCE DISTINCTION BANNER (MANDATORY REQUIREMENT)                 */}
        {/* ===================================================================== */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#007BFF] shrink-0" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
              Information Provenance &amp; Verification Standards
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            In compliance with Responsible AI practices, UpayAche clearly distinguishes all knowledge articles to prevent misinformation:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
              <div className="text-xs">
                <strong className="text-slate-900 font-mono block">UpayAche Prototype:</strong>
                <span className="text-slate-500 text-[11px]">
                  Internal system architecture, synthetic data, SHAP explainability, and ML model specifications.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <div className="text-xs">
                <strong className="text-slate-900 font-mono block">General MFS Security:</strong>
                <span className="text-slate-500 text-[11px]">
                  OTP/PIN defense playbooks, device safety, and consumer scam awareness guidelines.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
              <div className="text-xs">
                <strong className="text-slate-900 font-mono block">Official External Info:</strong>
                <span className="text-slate-500 text-[11px]">
                  Bangladesh statutory laws (Money Laundering Prevention Act) &amp; official helpline 16268 escalation.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CATEGORY & PROVENANCE FILTER STRIP                                    */}
        {/* ===================================================================== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                Filter by Topic:
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredArticles.length} of {SEED_HELP_ARTICLES.length} articles
            </div>
          </div>

          {/* Horizontal Category Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categoryFilters.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-[#002A54] text-white shadow-sm"
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ARTICLE CARDS GRID                                                    */}
        {/* ===================================================================== */}
        {filteredArticles.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No matching articles found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No articles matched your search query &ldquo;{searchQuery}&rdquo;. Try another term or ask the AI Assistant directly.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              variant="outline"
              size="sm"
              className="text-xs font-mono mt-2"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const isFaq = article.category === "FAQ";
              return (
                <div
                  key={article.id}
                  id={article.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-[#007BFF]/40"
                >
                  <div className="p-6 space-y-3.5">
                    {/* Top Metadata Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      {/* Provenance Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          article.provenance === "PROTOTYPE"
                            ? "bg-blue-50 text-[#002A54] border-blue-200"
                            : article.provenance === "GENERAL_MFS_SECURITY"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                      >
                        {article.provenance === "PROTOTYPE"
                          ? "UpayAche Prototype"
                          : article.provenance === "GENERAL_MFS_SECURITY"
                          ? "General MFS Security"
                          : "Official External Info"}
                      </span>

                      {/* Updated Date */}
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.updatedDate}
                      </span>
                    </div>

                    {/* Category & Title */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                        {article.categoryLabel}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#007BFF] transition-colors leading-snug">
                        {article.title}
                      </h3>
                    </div>

                    {/* Source Attribution */}
                    <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <strong>Source:</strong> {article.source}
                    </div>

                    {/* Article Content */}
                    <div className="text-xs text-slate-600 font-sans leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto pr-1">
                      {article.content}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Ask UpayAche AI Button (Mandatory Requirement) */}
                    <Button
                      type="button"
                      onClick={() => handleAskAI(article)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-8 shadow-xs gap-1.5 font-mono"
                      title="Ask UpayAche AI about this topic"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      Ask UpayAche AI
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(article.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title="Copy link to article"
                    >
                      {copiedArticleId === article.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================================================== */}
        {/* INTERACTIVE FAQ ACCORDION SECTION                                     */}
        {/* ===================================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <HelpCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Quick answers to common questions about UpayAche and MFS security.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "faq-1",
                q: "Can UpayAche AI refund money or unblock my account?",
                a: "No. UpayAche AI is strictly an educational risk and scam intelligence copilot for the hackathon prototype. It operates with read-only safety guardrails and cannot execute financial transfers, process refunds, or unblock wallets. For real account alterations, contact official upay helpline at 16268.",
                suggested: "Can you refund my money or unblock my account?"
              },
              {
                id: "faq-2",
                q: "Why was a transaction flagged as high risk?",
                a: "A transaction is flagged when empirical features deviate significantly from historical user baselines. Top contributors include: high velocity bursts, nocturnal transfer hours (1:00 AM - 5:00 AM), amount deviation exceeding 3.5x normal averages, and counterparty wallets tied to known mule rings.",
                suggested: "Why was this transaction flagged as high risk?"
              },
              {
                id: "faq-3",
                q: "What should I do if an agent or caller asks for my OTP or PIN?",
                a: "Immediately terminate the conversation. Official customer service representatives or agents will NEVER ask for your PIN or OTP under any circumstance. Sharing your credentials gives fraudsters immediate access to your funds.",
                suggested: "What should I do if an agent asks for my PIN or OTP?"
              },
              {
                id: "faq-4",
                q: "What is a money mule account and why is it illegal?",
                a: "A money mule account is an MFS wallet used by criminals to receive and disguise stolen funds. Allowing someone to use your wallet for commissions is a severe crime under Bangladesh Money Laundering Prevention Act, resulting in account blacklisting and criminal liability.",
                suggested: "What is a mule account and what are the legal consequences?"
              },
              {
                id: "faq-5",
                q: "How does SHAP explain a machine learning risk score?",
                a: "SHAP (TreeExplainer) breaks down the XGBoost risk score into exact additive feature contributions. It calculates how much each variable (e.g. velocity, nocturnal hours) pushed the score above or below baseline, ensuring full explainability.",
                suggested: "How does SHAP explain a machine learning risk score?"
              },
              {
                id: "faq-6",
                q: "Is UpayAche an official product of upay / UCB?",
                a: "No. UpayAche is a student hackathon prototype developed for the DIU CPC × upay AI Hackathon 2026. It operates strictly on synthetic, masked data (Zero PII) and is not an official commercial service of upay.",
                suggested: "Is UpayAche an official product of upay?"
              }
            ].map((faq) => {
              const isOpen = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 hover:text-[#007BFF] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-slate-600 font-sans leading-relaxed border-t border-slate-100 bg-white">
                      <p>{faq.a}</p>
                      <div className="mt-3 pt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          Provenance: UpayAche Prototype / General MFS Guidance
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new CustomEvent("open-upayache-ai", {
                                  detail: { prompt: faq.suggested }
                                })
                              );
                            }
                          }}
                          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] h-7 font-mono gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Ask UpayAche AI
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* OFFICIAL EXTERNAL CONTACT DISCLAIMER CARD                             */}
        {/* ===================================================================== */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white font-mono">
                Need Official upay Customer Support?
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans max-w-xl leading-relaxed">
              UpayAche AI Assistant is an educational prototype and cannot access real live customer accounts. For live account issues, disputes, or lost SIM reporting, contact official channels:
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-1">
              <span>Helpline: <strong className="text-white">16268</strong> (24/7)</span>
              <span>•</span>
              <span>Email: <strong className="text-white">support@upaybd.com</strong></span>
              <span>•</span>
              <a
                href="https://www.upaybd.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                upaybd.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <Button
            asChild
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs h-10 px-5 rounded-xl font-mono shrink-0 shadow-md"
          >
            <a href="tel:16268">
              <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
              Call Official Helpline 16268
            </a>
          </Button>
        </div>

      </div>
    </AppShell>
  );
}
