"""
train.py — Run this once to train and save the XGBoost model.
Usage: python train.py

Generates: model.json (XGBoost model), scaler.pkl (feature scaler)

Install deps first:
  pip install xgboost scikit-learn numpy pandas
"""

import numpy as np
import json
import pickle
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

np.random.seed(42)
N = 10000  # synthetic training samples

# ── Feature definitions (must match what the API receives) ────
# Features sent from Node.js:
#   avg_monthly_transactions, transaction_consistency (0-1),
#   avg_balance, income_credit_monthly, savings_rate (0-1),
#   luxury_spend_ratio (0-1), months_of_data,
#   rent_payments_on_time, utility_payments_on_time,
#   repaid_loans_count, prior_repayment_pct (0-1),
#   employment_score (0-1), is_cold_start (0/1)

def generate_sample():
    """Generate a realistic synthetic loan applicant."""
    employment_score = np.random.choice(
        [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.70, 0.75, 0.80, 0.88, 0.95],
        p=[0.02, 0.03, 0.05, 0.07, 0.08, 0.10, 0.10, 0.12, 0.13, 0.15, 0.15]
    )
    avg_balance            = max(0, np.random.lognormal(9.5, 1.2))   # ₹0–₹5L
    income_credit_monthly  = max(0, np.random.lognormal(10.2, 0.9))  # ₹0–₹2L
    avg_monthly_tx         = max(0, np.random.lognormal(2.8, 0.7))   # 0–100
    transaction_consistency= np.clip(np.random.beta(5, 2), 0, 1)
    savings_rate           = np.clip(np.random.beta(2, 4), -0.5, 1)
    luxury_spend_ratio     = np.clip(np.random.beta(2, 6), 0, 1)
    months_of_data         = int(np.clip(np.random.lognormal(2.5, 0.5), 1, 36))
    rent_payments          = np.random.randint(0, min(months_of_data + 1, 25))
    utility_payments       = np.random.randint(0, min(months_of_data + 1, 25))
    repaid_loans_count     = np.random.choice([0,1,2,3,4,5], p=[0.55,0.20,0.12,0.07,0.04,0.02])
    prior_repayment_pct    = np.random.beta(8, 2) if repaid_loans_count > 0 else 0.0
    is_cold_start          = int(repaid_loans_count == 0 and avg_monthly_tx < 5)

    # ── Ground truth: will this person repay? ─────────────────
    # Weighted probability based on features (domain knowledge)
    repay_prob = (
        0.20 * (avg_balance / 100000)                  +
        0.20 * (income_credit_monthly / 80000)          +
        0.15 * transaction_consistency                  +
        0.12 * employment_score                         +
        0.10 * (savings_rate + 0.5)                    +
        0.08 * (1 - luxury_spend_ratio)                +
        0.08 * prior_repayment_pct                     +
        0.04 * (rent_payments / 24)                    +
        0.03 * (utility_payments / 24)                 +
        0.00  # base
    )
    repay_prob = float(np.clip(repay_prob, 0.02, 0.98))
    will_repay = int(np.random.random() < repay_prob)

    return [
        avg_monthly_tx,
        transaction_consistency,
        avg_balance,
        income_credit_monthly,
        savings_rate,
        luxury_spend_ratio,
        months_of_data,
        rent_payments,
        utility_payments,
        repaid_loans_count,
        prior_repayment_pct,
        employment_score,
        is_cold_start,
    ], will_repay

print("Generating synthetic training data…")
rows, labels = zip(*[generate_sample() for _ in range(N)])
X = np.array(rows, dtype=np.float32)
y = np.array(labels, dtype=np.int32)

print(f"Class balance — repay: {y.mean():.2%}  default: {1-y.mean():.2%}")

# ── Scale features ────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── Train / test split ────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ── XGBoost model ─────────────────────────────────────────────
print("Training XGBoost model…")
model = XGBClassifier(
    n_estimators    = 300,
    max_depth       = 6,
    learning_rate   = 0.05,
    subsample       = 0.8,
    colsample_bytree= 0.8,
    scale_pos_weight= (y == 0).sum() / (y == 1).sum(),  # handle imbalance
    use_label_encoder=False,
    eval_metric     = 'logloss',
    random_state    = 42,
    n_jobs          = -1,
)
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

# ── Evaluate ──────────────────────────────────────────────────
y_pred  = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]
print("\n── Classification Report ──")
print(classification_report(y_test, y_pred, target_names=['default', 'repay']))
print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

# ── Feature importance ────────────────────────────────────────
FEATURE_NAMES = [
    'avg_monthly_transactions', 'transaction_consistency',
    'avg_balance', 'income_credit_monthly',
    'savings_rate', 'luxury_spend_ratio', 'months_of_data',
    'rent_payments_on_time', 'utility_payments_on_time',
    'repaid_loans_count', 'prior_repayment_pct',
    'employment_score', 'is_cold_start',
]
importances = model.feature_importances_
print("\n── Feature Importances ──")
for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1]):
    bar = '█' * int(imp * 40)
    print(f"  {name:<30} {imp:.4f}  {bar}")

# ── Save model + scaler ───────────────────────────────────────
model.save_model('model.json')
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

# Save feature names for validation
with open('features.json', 'w') as f:
    json.dump(FEATURE_NAMES, f)

print("\n✅ Saved: model.json, scaler.pkl, features.json")
print("Now run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload")