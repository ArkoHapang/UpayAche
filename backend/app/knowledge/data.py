"""
UpayAche — Master RAG Knowledge Base.
Structured repository of verified MFS risk intelligence, account security guidelines,
scam awareness playbooks, explainable AI explanations, and prototype guardrails.
Supports English, Bangla, and Banglish.
"""

from typing import List, Dict, Any

KNOWLEDGE_DOCUMENTS: List[Dict[str, Any]] = [
    # -------------------------------------------------------------------------
    # 1. TRANSACTION RISK & FLAGGING REASONS
    # -------------------------------------------------------------------------
    {
        "id": "doc-risk-001",
        "title": "Why Transactions Get Flagged for Risk",
        "source": "UpayAche Risk Intelligence Guide v1.0",
        "category": "TRANSACTION_RISK",
        "language": "en",
        "version": "v1.0",
        "content": (
            "Transactions are flagged by the UpayAche Risk Engine based on behavioral anomalies, statistical outliers, "
            "and pattern matching. Key reasons include: 1) Velocity Spikes: Unusually frequent transfers within 1 hour or 24 hours "
            "departing from the user's historical cadence. 2) High Amount Outliers: A transaction significantly exceeding the sender's "
            "average transaction baseline (e.g. 5x to 10x higher). 3) Nocturnal Activity: Unusual high-value transfers initiated "
            "during late-night hours (1:00 AM to 5:00 AM). 4) Flagged Counterparties: Sending funds to or receiving funds from wallets "
            "associated with known mule rings or previous fraud cases. 5) Dormant Reactivation: A wallet that was inactive for months "
            "suddenly transferring large volumes. Flagging does NOT mean your money is lost; it simply queues the transaction for human analyst triage."
        ),
        "metadata": {
            "keywords": ["flagged", "transaction flagged", "why flagged", "risk score", "high risk", "velocity", "outlier", "nocturnal"],
            "suggested_prompts": ["Why was this transaction flagged?", "Why is my risk score high?"]
        }
    },
    {
        "id": "doc-risk-002",
        "title": "Understanding Risk Scores and Tiers",
        "source": "UpayAche Model Scoring Standards",
        "category": "TRANSACTION_RISK",
        "language": "en",
        "version": "v1.0",
        "content": (
            "UpayAche calculates a risk score between 0.0 (safest) and 1.0 (highest risk) using an XGBoost gradient boosted model. "
            "The score corresponds to four distinct risk tiers: 1) LOW (0.00 - 0.29): Routine, benign transactions requiring no intervention. "
            "2) MEDIUM (0.30 - 0.69): Mild deviations such as slightly larger amounts or first-time counterparty transfers; monitored passively. "
            "3) HIGH (0.70 - 0.89): Notable anomalies such as sudden velocity increases or multiple cash-outs; generates an automated alert. "
            "4) CRITICAL (0.90 - 1.00): High-probability fraud patterns like rapid smurfing fan-in or known mule syndicates; prioritized for urgent analyst investigation."
        ),
        "metadata": {
            "keywords": ["risk score", "risk tiers", "low risk", "medium risk", "high risk", "critical risk", "xgboost"],
            "suggested_prompts": ["What does a high risk score mean?", "How is risk scored?"]
        }
    },

    # -------------------------------------------------------------------------
    # 2. SCAM AWARENESS & PHISHING
    # -------------------------------------------------------------------------
    {
        "id": "doc-scam-001",
        "title": "OTP & PIN Phishing Defense Playbook",
        "source": "UpayAche Security Center",
        "category": "SCAM_AWARENESS",
        "language": "en",
        "version": "v1.0",
        "content": (
            "One-Time Passwords (OTP) and Personal Identification Numbers (PIN) are your primary security barriers. "
            "GOLDEN RULE: Official customer service, agents, or bank representatives will NEVER ask for your PIN or OTP under any circumstance. "
            "Common phishing techniques: 1) Fake Prize / Lottery: Callers claiming you won money from a campaign and need OTP verification. "
            "2) Accidental Cash-In Scam: Fraudsters sending a fake SMS mimicking a cash-in notification, then calling demanding a refund. "
            "3) Impersonation: Fraudsters posing as upay officials warning that your account is about to be closed unless you verify your OTP. "
            "NEVER share your 4-digit PIN or 6-digit OTP with anyone, even family or trusted agents."
        ),
        "metadata": {
            "keywords": ["otp", "pin", "phishing", "scam", "fake call", "prize scam", "sms scam", "customer care call"],
            "suggested_prompts": ["What should I do if someone asks for my OTP?", "How do scammers steal PINs?"]
        }
    },
    {
        "id": "doc-scam-002",
        "title": "Emergency Family Distress & Impersonation Scams",
        "source": "UpayAche Fraud Intelligence Bulletin",
        "category": "SCAM_AWARENESS",
        "language": "en",
        "version": "v1.0",
        "content": (
            "In emergency impersonation scams, fraudsters call victims claiming their son, daughter, or relative has been hospitalized, arrested, "
            "or met with an accident and desperately needs money sent via MFS immediately. "
            "HOW TO PROTECT YOURSELF: 1) Pause and stay calm. Fraudsters rely on creating artificial panic. 2) Call the relative directly on their known "
            "phone number before sending any money. 3) Ask a specific question only your relative would know. 4) Report the scammer's phone number to official support."
        ),
        "metadata": {
            "keywords": ["emergency scam", "hospital scam", "relative scam", "family accident scam", "impersonation"],
            "suggested_prompts": ["How to recognize emergency distress scams?"]
        }
    },

    # -------------------------------------------------------------------------
    # 3. ACCOUNT & WALLET SECURITY
    # -------------------------------------------------------------------------
    {
        "id": "doc-sec-001",
        "title": "Best Practices for Securing Your MFS Wallet",
        "source": "UpayAche Security Protocol",
        "category": "ACCOUNT_SECURITY",
        "language": "en",
        "version": "v1.0",
        "content": (
            "To keep your mobile financial wallet secure: 1) Never share your PIN with agents or friends. Always enter your PIN yourself on the device. "
            "2) Avoid using obvious PINs like birth years (1998, 2002) or repetitive numbers (1111, 1234). 3) Always verify the recipient's phone number "
            "and name on the confirmation screen before confirming P2P transfers. 4) If your smartphone is lost or stolen, immediately call the official upay "
            "helpline (16268) from another phone to request temporary suspension of your wallet. 5) Avoid using rooted or jailbroken smartphones, as malware "
            "can log keystrokes and intercept SMS OTPs."
        ),
        "metadata": {
            "keywords": ["protect wallet", "secure account", "pin safety", "lost phone", "device security", "rooted phone"],
            "suggested_prompts": ["How can I protect my wallet?", "What if I lost my phone?"]
        }
    },

    # -------------------------------------------------------------------------
    # 4. MULE ACCOUNTS & SUSPICIOUS NETWORKS
    # -------------------------------------------------------------------------
    {
        "id": "doc-mule-001",
        "title": "What is a Mule Account and Why is it Dangerous?",
        "source": "UpayAche AML Compliance Digest",
        "category": "MULE_ACCOUNTS",
        "language": "en",
        "version": "v1.0",
        "content": (
            "A 'mule account' is a mobile wallet or bank account used by criminals to receive and transfer illicit funds, concealing the real identity "
            "of the fraudsters. Criminals recruit mules through fake job offers, commission promises ('let me use your account for 5% reward'), or social engineering. "
            "LEGAL CONSEQUENCES: Operating or allowing someone to use your wallet as a mule account is a severe financial crime under Bangladesh anti-money "
            "laundering laws (Money Laundering Prevention Act). Even if you were unaware, your wallet will be blacklisted, KYC cancelled, and you may face legal prosecution. "
            "NEVER allow any stranger to deposit or route money through your personal wallet."
        ),
        "metadata": {
            "keywords": ["mule account", "money mule", "what is mule", "mule ring", "commission scam", "renting wallet"],
            "suggested_prompts": ["What is a mule account?", "Can I let someone use my wallet?"]
        }
    },
    {
        "id": "doc-net-001",
        "title": "What Does 'Suspicious Network' Mean?",
        "source": "UpayAche Graph Intelligence Whitepaper",
        "category": "NETWORK_INTELLIGENCE",
        "language": "en",
        "version": "v1.0",
        "content": (
            "In UpayAche, a 'Suspicious Network' refers to a cluster of interconnected wallets identified by our NetworkX graph algorithms that exhibit "
            "money-laundering topologies. Common suspicious network patterns include: 1) Smurfing Fan-In: Multiple small wallets sending funds into a single "
            "aggregator wallet just below reporting thresholds, followed by an immediate rapid cash-out. 2) Circular Layering Loops: Wallets sending money in cycles "
            "(e.g., Wallet A -> Wallet B -> Wallet C -> Wallet A) to create fake transaction velocity or disguise ownership. 3) Mule Hubs: Wallets with abnormal "
            "in-degree and out-degree connectivity connecting dozens of unrelated consumer accounts. The 3D network view visualizes these connections."
        ),
        "metadata": {
            "keywords": ["suspicious network", "suspicious networks", "detect suspicious networks", "network graph", "smurfing", "fan in", "circular loop", "pagerank", "graph intelligence", "suspicious connections"],
            "suggested_prompts": ["What does suspicious network mean?", "How does the network graph work?", "How does UpayAche detect suspicious networks?"]
        }
    },

    # -------------------------------------------------------------------------
    # 5. EXPLAINABLE AI & RESPONSIBLE AI
    # -------------------------------------------------------------------------
    {
        "id": "doc-ai-001",
        "title": "How SHAP and Behavioral Anomaly Detection Work",
        "source": "UpayAche Explainable AI Architecture",
        "category": "EXPLAINABILITY_AI",
        "language": "en",
        "version": "v1.0",
        "content": (
            "UpayAche employs transparent, explainable machine learning rather than opaque black boxes. 1) SHAP (SHapley Additive exPlanations): "
            "TreeExplainer breaks down the XGBoost risk score into individual feature contributions. For example, SHAP can show that a transaction scored 0.85 "
            "specifically because: +0.40 came from 'unusually high amount', +0.25 from 'nocturnal transfer time', and +0.10 from 'recipient is a newly created account'. "
            "2) Behavioral Anomaly Detection: An unsupervised Isolation Forest algorithm models normal user habits and flags multi-dimensional outliers. "
            "CAN AI AUTOMATICALLY BLOCK ACCOUNTS? No. In accordance with Responsible AI principles, UpayAche AI serves as an investigative assistant. "
            "All final case actions and decisions are made by human compliance analysts."
        ),
        "metadata": {
            "keywords": ["shap", "explainable ai", "isolation forest", "behavioral anomaly", "can ai block", "automatically block", "black box"],
            "suggested_prompts": ["How does SHAP explain risk?", "Can AI automatically block a transaction?", "What is behavioral anomaly detection?"]
        }
    },

    # -------------------------------------------------------------------------
    # 6. UPAYACHE HACKATHON PROTOTYPE IDENTITY & GUARDRAILS
    # -------------------------------------------------------------------------
    {
        "id": "doc-proto-001",
        "title": "About UpayAche: Scope & Assistant Guardrails",
        "source": "UpayAche Project Documentation",
        "category": "UPAYACHE_PROTOTYPE",
        "language": "en",
        "version": "v1.0",
        "content": (
            "UpayAche is an AI-powered MFS risk and scam intelligence platform prototype developed for the DIU CPC × upay AI Hackathon 2026. "
            "CRITICAL IDENTITY DISCLAIMER: UpayAche AI Assistant is NOT the official upay customer care service. It operates strictly on synthetic, masked data (Zero PII). "
            "STRICT GUARDRAILS: UpayAche AI Assistant CANNOT: 1) Transfer money or refund funds. 2) Approve, cancel, or modify transactions. "
            "3) Block, unblock, or freeze wallets. 4) Change PINs or passwords. 5) Access National ID (NID) or bank credentials. 6) Execute SQL or code. "
            "If you need account alterations, PIN resets, or dispute resolutions on your live official upay account, you must contact official upay customer support "
            "via helpline 16268 or through an authorized upay customer care center."
        ),
        "metadata": {
            "keywords": ["about upayache", "hackathon", "upay official", "transfer money", "block wallet", "change pin", "refund", "customer care"],
            "suggested_prompts": ["Can you refund my money?", "Can you unblock my account?", "Is this official upay support?"]
        }
    },

    # -------------------------------------------------------------------------
    # 7. BANGLA KNOWLEDGE DOCUMENTS
    # -------------------------------------------------------------------------
    {
        "id": "doc-bn-001",
        "title": "আমার ট্রানজেকশন কেন ফ্ল্যাগ করা হয়েছে?",
        "source": "UpayAche বাংলা নির্দেশিকা",
        "category": "TRANSACTION_RISK",
        "language": "bn",
        "version": "v1.0",
        "content": (
            "UpayAche এর এআই রিস্ক ইঞ্জিন আপনার ট্রানজেকশনকে অস্বাভাবিক আচরণ বা সম্ভাব্য জালিয়াতির ঝুঁকির কারণে ফ্ল্যাগ করতে পারে। "
            "প্রধান কারণসমূহ: ১) হঠাৎ অতিরিক্ত লেনদেন: অল্প সময়ে ঘন ঘন টাকা পাঠানো বা উত্তোলন করা। ২) অস্বাভাবিক বড় অংকের টাকা: সাধারণত আপনি যে পরিমাণ টাকা লেনদেন করেন "
            "তার চেয়ে হঠাৎ অনেক বেশি টাকা পাঠানো। ৩) গভীর রাতে লেনদেন: রাত ১টা থেকে ভোর ৫টার মধ্যে বড় অংকের স্থানান্তর। ৪) ঝুঁকিপূর্ণ অ্যাকাউন্ট: যদি প্রাপকের অ্যাকাউন্ট কোনো "
            "মিউল অ্যাকাউন্ট বা সন্দেহজনক নেটওয়ার্কের সাথে যুক্ত থাকে। ট্রানজেকশন ফ্ল্যাগ হওয়া মানেই টাকা আটকে যাওয়া নয়, এটি নিরীক্ষকদের নিরাপত্তার স্বার্থে যাচাইয়ের জন্য প্রেরিত হয়।"
        ),
        "metadata": {
            "keywords": ["ট্রানজেকশন ফ্ল্যাগ", "কেন ফ্ল্যাগ", "ঝুঁকি স্কোর", "টাকা পাঠানো", "লেনদেন"],
            "suggested_prompts": ["আমার ট্রানজেকশন কেন ফ্ল্যাগ করা হয়েছে?", "রিস্ক স্কোর কি?"]
        }
    },
    {
        "id": "doc-bn-002",
        "title": "কিভাবে আপনার এমএফএস ওয়ালেট সুরক্ষিত রাখবেন?",
        "source": "UpayAche বাংলা নিরাপত্তা সহায়িকা",
        "category": "ACCOUNT_SECURITY",
        "language": "bn",
        "version": "v1.0",
        "content": (
            "আপনার মোবাইল ব্যাংকিং ওয়ালেট সুরক্ষিত রাখার নিয়মাবলী: ১) আপনার ৪-সংখ্যার পিন (PIN) কাউকে বলবেন না। এজেন্ট বা পরিবারের সদস্যদের দিয়েও পিন ডায়াল করাবেন না। "
            "২) ওটিপি (OTP) কখনোই কারো সাথে শেয়ার করবেন না। কোনো গ্রাহক সেবা কর্মকর্তা কখনোই আপনার পিন বা ওটিপি জানতে চাইবেন না। ৩) লটারি জেতার ভুয়া ফোনকল বা মেসেজে বিশ্বাস করবেন না। "
            "৪) মোবাইল হারিয়ে গেলে দ্রুত অন্য ফোন দিয়ে অফিসিয়াল হেল্পলাইনে (১৬২৬৮) কল করে ওয়ালেট সাময়িক বন্ধ করুন। ৫) অপরিচিত কোনো লিংকে ক্লিক করে অ্যাপ ইন্সটল করবেন না।"
        ),
        "metadata": {
            "keywords": ["ওয়ালেট সুরক্ষা", "পিন গোপন", "ওটিপি", "নিরাপত্তা", "লটারি প্রতারণা"],
            "suggested_prompts": ["কিভাবে আমার ওয়ালেট সুরক্ষিত রাখব?", "ওটিপি শেয়ার করলে কি হবে?"]
        }
    },
    {
        "id": "doc-bn-003",
        "title": "মিউল অ্যাকাউন্ট (Mule Account) কি এবং কেন এটি বিপজ্জনক?",
        "source": "UpayAche বাংলা কমপ্লায়েন্স",
        "category": "MULE_ACCOUNTS",
        "language": "bn",
        "version": "v1.0",
        "content": (
            "মিউল অ্যাকাউন্ট হলো এমন একটি ওয়ালেট বা ব্যাংক হিসাব, যা প্রতারক বা অপরাধীরা অবৈধ অর্থ পাচার ও নগদ রূপান্তরের জন্য ভাড়া বা কৌশলে ব্যবহার করে। "
            "প্রতারকরা চাকরির প্রলোভন বা কমিশনের লোভ দেখিয়ে সাধারণ মানুষের ওয়ালেট ব্যবহার করে। সতর্কতা: নিজের ওয়ালেট অন্যের টাকার লেনদেনের জন্য ব্যবহার করতে দেওয়া "
            "বাংলাদেশের মানিলন্ডারিং প্রতিরোধ আইনে মারাত্মক অপরাধ। এমন কাজের ফলে আপনার অ্যাকাউন্ট চিরতরে বন্ধ হতে পারে এবং পুলিশি আইনি ঝামেলায় পড়তে পারেন। কখনো অপরিচিত কারো টাকা নিজের অ্যাকাউন্টে নিবেন না।"
        ),
        "metadata": {
            "keywords": ["মিউল অ্যাকাউন্ট", "মানিলন্ডারিং", "ভাড়া অ্যাকাউন্ট", "কমিশন প্রতারণা"],
            "suggested_prompts": ["মিউল অ্যাকাউন্ট কি?", "অন্যের টাকা অ্যাকাউন্টে নিলে কি হবে?"]
        }
    },

    # -------------------------------------------------------------------------
    # 8. BANGLISH KNOWLEDGE DOCUMENTS
    # -------------------------------------------------------------------------
    {
        "id": "doc-bng-001",
        "title": "OTP Share Korle Ki Hobe & PIN Safety (Banglish)",
        "source": "UpayAche Banglish Guide",
        "category": "ACCOUNT_SECURITY",
        "language": "banglish",
        "version": "v1.0",
        "content": (
            "OTP (One-Time Password) ebong PIN holo apnar wallet er main security lock. Kono din karo shathe OTP ba PIN share korben na. "
            "Scammer ra customer care ba lottery er kotha bole apnar OTP cheye thake. Jodi apnar OTP diye den, shathe shathe apnar account theke shob taka "
            "churi hoye jete pare. Upay er kono representative kokhono apnar PIN ba OTP chaibe na. Mone rakhben: 'PIN ar OTP karo shathe share kora jabe na'."
        ),
        "metadata": {
            "keywords": ["otp share", "pin security", "taka churi", "scam call", "lottery scam", "banglish"],
            "suggested_prompts": ["OTP share korle ki hobe?", "PIN kake dibo na?"]
        }
    },
    {
        "id": "doc-bng-002",
        "title": "Why was my transaction flagged? (Banglish)",
        "source": "UpayAche Banglish Guide",
        "category": "TRANSACTION_RISK",
        "language": "banglish",
        "version": "v1.0",
        "content": (
            "Apnar transaction ti UpayAche Risk Engine dara flag kora hoyeche karon: 1) Normal er cheye beshi taka eksathe pathano hoyeche. "
            "2) Khub kom shomoye bar bar transaction hoyeche (velocity spike). 3) Raat er shomoy (midnight cashout) suspicious activity mone hoyeche. "
            "4) Receiver account ti suspicious list e thakte pare. Flagging mane taka noshto hoye jaowa noy; analyst ra manually check korche safe kina."
        ),
        "metadata": {
            "keywords": ["why flagged", "amar transaction flag holo keno", "risk score beshi keno", "banglish"],
            "suggested_prompts": ["Amar transaction flag holo keno?", "Risk score beshi keno?"]
        }
    },
    {
        "id": "doc-ml-001",
        "title": "XGBoost Supervised Fraud Scoring Model",
        "source": "UpayAche Machine Learning Architecture v1.0",
        "category": "MACHINE_LEARNING",
        "language": "en",
        "version": "v1.0",
        "content": (
            "XGBoost (Extreme Gradient Boosting) is the primary supervised machine learning model used in UpayAche to calculate numerical "
            "transaction risk scores between 0.00 and 1.00. It evaluates a 24-dimensional feature vector containing velocity metrics "
            "(e.g., transactions in past 1h/24h), temporal signals (e.g., nocturnal transfers, weekend spikes), amount ratios (e.g., ratio to 30-day average), "
            "and graph topological features (e.g., PageRank centrality, in-degree/out-degree ratios). XGBoost combines an ensemble of decision trees "
            "with gradient descent optimization, delivering state-of-the-art precision and recall for Mobile Financial Services (MFS) fraud detection."
        ),
        "metadata": {
            "keywords": ["xgboost", "gradient boosting", "ml model", "machine learning", "feature vector", "precision", "recall", "supervised model"],
            "suggested_prompts": ["What is XGBoost?", "How does the ML model score transactions?"]
        }
    },
    {
        "id": "doc-net-002",
        "title": "Network Graph Architecture & 3D Visualizer",
        "source": "UpayAche Graph Intelligence Guide",
        "category": "NETWORK_INTELLIGENCE",
        "language": "en",
        "version": "v1.0",
        "content": (
            "The UpayAche Network Graph represents the Mobile Financial Services ecosystem as a directed multigraph built with NetworkX. "
            "Each wallet is modeled as a node (color-coded by risk intensity: emerald for low risk, amber for medium risk, crimson for high risk), "
            "and each transaction is modeled as a directed edge with flow direction, amount, and timestamp. The graph engine executes cycle detection "
            "algorithms to detect circular layering loops, calculates PageRank and hub centrality to identify syndicate leaders, and flags smurfing fan-in "
            "patterns. Analysts interact with this graph via a high-performance 3D visualization canvas powered by Three.js and React Three Fiber."
        ),
        "metadata": {
            "keywords": ["network graph", "how network graph works", "3d graph", "networkx", "three.js", "directed multigraph", "pagerank", "cycle detection"],
            "suggested_prompts": ["How does the network graph work?", "How are suspicious networks detected?"]
        }
    },
    {
        "id": "doc-beg-001",
        "title": "UpayAche Explained for Beginners: Simple Security Guide",
        "source": "UpayAche Beginner Guide",
        "category": "UPAYACHE_PROTOTYPE",
        "language": "en",
        "version": "v1.0",
        "content": (
            "UpayAche is like an intelligent digital security guard for mobile money (like upay). Think of it this way: when thousands of transactions "
            "happen every minute, human analysts cannot inspect every single one. UpayAche uses smart computer models to watch out for suspicious activities—"
            "like someone suddenly sending all their savings at 3 AM to an unknown account, or scammers trying to move stolen money through multiple wallets. "
            "Instead of just blocking people blindly, UpayAche calculates a risk score and explains in plain language WHY something looks unusual, so a human "
            "investigator can make the right decision. It also helps you stay safe from OTP scams and fake lottery calls."
        ),
        "metadata": {
            "keywords": ["beginner", "explain for beginner", "simple explanation", "what is upayache", "easy guide", "for beginners"],
            "suggested_prompts": ["Explain this like I am a beginner", "What is UpayAche in simple words?"]
        }
    }
]


def get_all_knowledge_documents() -> List[Dict[str, Any]]:
    return KNOWLEDGE_DOCUMENTS
