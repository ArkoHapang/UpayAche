# UpayAche — ML Risk Engine Evaluation Report

> **Model**: XGBoost Risk Classifier (`v1.0.0`)  
> **Evaluation Date**: 2026-10-01T21:24:12.314060+00:00  
> **Test Samples**: 500 (Normal: 426, Suspicious/Fraud: 74)  
> **Latency Target**: < 50ms per transaction inference

---

## 1. Key Performance Metrics

| Metric | Score | Target Threshold | Status |
| :--- | :--- | :--- | :--- |
| **Precision** | **1.0000** | >= 0.8500 | PASSED |
| **Recall** | **0.9865** | >= 0.8500 | PASSED |
| **F1 Score** | **0.9932** | >= 0.8500 | PASSED |
| **ROC-AUC** | **1.0000** | >= 0.9000 | PASSED |

---

## 2. Confusion Matrix

```
                Predicted Normal (0)    Predicted Fraud (1)
Actual Normal:         426                     0                  (False Positives)
Actual Fraud:          1                       73                 (True Positives)
```

- **False Positives (0)**: Legitimate transactions flagged for analyst review.
- **False Negatives (1)**: Illicit transactions missed.

---

## 3. Pattern-by-Pattern Breakdown

| Pattern Name | Samples | Expected | Accuracy | Mean Risk Score |
| :--- | :--- | :--- | :--- | :--- |
| Normal Transaction | 426 | Normal (0) | 100.0% | 0.0032 |
| Unusually Large Transaction | 6 | Fraud (1) | 100.0% | 0.9981 |
| High Transaction Velocity | 5 | Fraud (1) | 100.0% | 0.9953 |
| New Unrecognized Device | 7 | Fraud (1) | 100.0% | 0.9905 |
| New High-Risk Recipient | 9 | Fraud (1) | 100.0% | 0.9970 |
| Unusual Transaction Time | 9 | Fraud (1) | 100.0% | 0.9991 |
| Unusual Location Shift | 3 | Fraud (1) | 100.0% | 0.9987 |
| Sudden Behavioral Change | 4 | Fraud (1) | 100.0% | 0.9991 |
| Multiple Wallets Connected to One (Smurfing) | 4 | Fraud (1) | 100.0% | 0.9990 |
| Suspicious Transaction Chain / Circular Layering | 7 | Fraud (1) | 100.0% | 0.9989 |
| Repeated Identical Transfers | 13 | Fraud (1) | 92.3% | 0.9477 |
| Synthetic Scam-Like Pattern (Lottery/Impersonation) | 7 | Fraud (1) | 100.0% | 0.9982 |

---

## 4. Operational Recommendations
1. Calibrate decision boundary: Default threshold 0.50 achieves balanced F1; threshold 0.70 minimizes false positives for high-priority queues.
2. Feed outputs into SHAP TreeExplainer for compliance officer reason codes.
