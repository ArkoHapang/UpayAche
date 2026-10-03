# UpayAche — Behavioral Anomaly Detection Evaluation Report

> **Engine**: Unsupervised Isolation Forest (`v1.0.0`)  
> **Evaluation Date**: 2026-10-01T21:30:07.409637+00:00  
> **Total Evaluated Transactions**: 2497  
> **Contamination Rate**: 0.10  
> **Latency**: < 5ms per inference

---

## 1. Unsupervised Anomaly Detection Performance

| Metric | Score | Note |
| :--- | :--- | :--- |
| **Precision** | **0.9360** | Precision of flagged anomalies vs known behavioral outliers |
| **Recall** | **0.6290** | Coverage of extreme behavioral outliers |
| **F1 Score** | **0.7524** | Harmonic mean of precision and recall |
| **ROC-AUC** | **0.9606** | Area under the anomaly score ROC curve |

---

## 2. Confusion Matrix

```
                        Predicted Normal (0)    Predicted Anomaly (1)
Actual Normal (2125):          2109                    16                 (False Positives)
Actual Anomaly (372):          138                     234                (True Positives)
```

- **False Positive Rate**: 0.75% on normal transactions.
- **Normal Inlier Retention**: 99.25% of typical daytime activity marked normal.

---

## 3. Behavior-by-Behavior Outlier Sensitivity

| Behavior Pattern | Samples | Expected Anomaly | Detection Rate | Mean Anomaly Score |
| :--- | :--- | :--- | :--- | :--- |
| Normal Transaction | 2125 | NORMAL (0) | 0.8% | 0.1614 |
| Unusually Large Transaction | 34 | ANOMALY (1) | 67.7% | 0.5513 |
| High Transaction Velocity | 34 | ANOMALY (1) | 82.3% | 0.6735 |
| New Unrecognized Device | 34 | ANOMALY (1) | 100.0% | 0.7185 |
| New High-Risk Recipient | 34 | ANOMALY (1) | 20.6% | 0.3536 |
| Unusual Transaction Time | 34 | ANOMALY (1) | 70.6% | 0.5687 |
| Unusual Location Shift | 34 | ANOMALY (1) | 52.9% | 0.5176 |
| Sudden Behavioral Change | 34 | ANOMALY (1) | 100.0% | 0.6590 |
| Multiple Wallets Connected to One (Smurfing) | 34 | ANOMALY (1) | 2.9% | 0.2629 |
| Suspicious Transaction Chain / Circular Layering | 33 | ANOMALY (1) | 3.0% | 0.4595 |
| Repeated Identical Transfers | 34 | ANOMALY (1) | 91.2% | 0.6720 |
| Synthetic Scam-Like Pattern (Lottery/Impersonation) | 33 | ANOMALY (1) | 100.0% | 0.5652 |

---

## 4. Key Architectural Insights & Separation of Concerns

1. **Unsupervised vs Supervised Separation**:
   - Isolation Forest does NOT predict fraud; it quantifies **statistical deviation from habit**.
   - An atypical transaction (e.g., sudden midnight cash-out or high-volume burst) is flagged as an anomaly even if it does not exhibit known scam signatures.
2. **Composite Fusion Invariant**:
   - In Phase 7/8, the anomaly score $S_{\text{Anomaly}}$ feeds into the Composite Risk formula alongside XGBoost risk probability $P_{\text{XGB}}$.
