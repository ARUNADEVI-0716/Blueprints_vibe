"""
main.py — FastAPI microservice for XGBoost credit scoring.
Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Must have run train.py first to generate model.json and scaler.pkl
"""

import json
import pickle
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from xgboost import XGBClassifier
from typing import Optional

app = FastAPI(title="Nexus Credit ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model and scaler on startup ─────────────────────────
model  = XGBClassifier()
scaler = None

@app.on_event("startup")
def load_model():
    global model, scaler
    try:
        model.load_model("model.json")
        with open("scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        print("✅ XGBoost model loaded successfully")
    except FileNotFoundError:
        print("❌ model.json or scaler.pkl not found. Run train.py first.")

# ── Employment type → score mapping ──────────────────────────
EMPLOYMENT_SCORES = {
    'Salaried — Government':  0.95,
    'Armed Forces / Defence': 0.95,
    'Salaried — Private':     0.88,
    'Salaried':               0.88,
    'Doctor / Medical':       0.88,
    'Teacher / Professor':    0.85,
    'Business Owner':         0.80,
    'Consultant':             0.75,
    'Self-Employed':          0.70,
    'Trader / Merchant':      0.68,
    'Farmer / Agriculture':   0.65,
    'Freelancer':             0.55,
    'Gig Worker':             0.45,
    'Contract Worker':        0.45,
    'Part-time Worker':       0.40,
    'Daily Wage Worker':      0.35,
    'Retired / Pensioner':    0.70,
    'Homemaker':              0.30,
    'Student':                0.25,
    'Unemployed':             0.15,
    'Other':                  0.40,
}

# ── Score bands ───────────────────────────────────────────────
def prob_to_score(prob: float, is_cold_start: bool, repaid_loans_count: int) -> dict:
    """
    Convert XGBoost repayment probability (0-1) to Nexus score (300-950).

    prob = probability of repayment (higher = better borrower)
    """
    # Base score range depends on user type
    if repaid_loans_count >= 1:
        # Returning borrower: 400–900 base + up to 50 bonus
        base_min, base_max = 400, 900
        bonus = min(50, repaid_loans_count * 17)
    elif is_cold_start:
        # Cold start: 300–750
        base_min, base_max = 300, 750
        bonus = 0
    else:
        # Existing (approved, not yet repaid): 350–850
        base_min, base_max = 350, 850
        bonus = 0

    raw_score = int(base_min + prob * (base_max - base_min)) + bonus
    score     = min(950, max(300, raw_score))

    # Grade
    if score >= 800: grade = 'Excellent'
    elif score >= 700: grade = 'Very Good'
    elif score >= 600: grade = 'Good'
    elif score >= 500: grade = 'Fair'
    else: grade = 'Poor'

    # Risk level
    if score >= 750: risk = 'Low Risk'
    elif score >= 650: risk = 'Medium Risk'
    elif score >= 550: risk = 'Medium-High Risk'
    else: risk = 'High Risk'

    # Recommendation
    is_returning = repaid_loans_count > 0
    if is_returning:
        if score >= 800: rec = '⭐ Returning borrower with excellent repayment record. Eligible for premium loans.'
        elif score >= 700: rec = '✅ Returning borrower with strong repayment history. Eligible at preferential rates.'
        else: rec = '✅ Returning borrower. Good repayment history noted.'
    elif is_cold_start:
        if score >= 650: rec = 'Cold start profile shows strong financial behavior. Eligible for loans up to ₹5,00,000.'
        elif score >= 550: rec = 'Moderate cold start profile. Eligible for loans up to ₹2,00,000.'
        else: rec = 'Limited financial signals. Consider a smaller loan to build credit history.'
    else:
        if score >= 750: rec = 'Excellent credit profile. Eligible for premium loan products at best rates.'
        elif score >= 650: rec = 'Good credit profile. Eligible for most loan products at standard rates.'
        else: rec = 'Fair credit. Eligible for basic loan products.'

    max_score = 950 if is_returning else 750 if is_cold_start else 850

    return {
        'score':                score,
        'grade':                grade,
        'riskLevel':            risk,
        'recommendation':       rec,
        'repaymentProbability': round(prob, 4),
        'repaymentBonus':       bonus,
        'isReturningBorrower':  is_returning,
        'isColdStart':          is_cold_start,
        'maxScore':             max_score,
        'model':                'XGBoost',
    }

# ── Request schema ────────────────────────────────────────────
class CreditRequest(BaseModel):
    # Transaction features
    avg_monthly_transactions:  float = Field(0, ge=0)
    transaction_consistency:   float = Field(0.5, ge=0, le=1)
    avg_balance:               float = Field(0, ge=0)
    income_credit_monthly:     float = Field(0, ge=0)
    savings_rate:              float = Field(0, ge=-1, le=1)
    luxury_spend_ratio:        float = Field(0.2, ge=0, le=1)
    months_of_data:            int   = Field(0, ge=0)

    # Alternative signals
    rent_payments_on_time:     int   = Field(0, ge=0)
    utility_payments_on_time:  int   = Field(0, ge=0)

    # Repayment history
    repaid_loans_count:        int   = Field(0, ge=0)
    prior_repayment_pct:       float = Field(0.0, ge=0, le=1)

    # Employment
    employment_type:           Optional[str] = 'Other'

    # Flags
    is_cold_start:             bool  = True

# ── Feature importance explanation ───────────────────────────
FEATURE_NAMES = [
    'avg_monthly_transactions', 'transaction_consistency',
    'avg_balance', 'income_credit_monthly',
    'savings_rate', 'luxury_spend_ratio', 'months_of_data',
    'rent_payments_on_time', 'utility_payments_on_time',
    'repaid_loans_count', 'prior_repayment_pct',
    'employment_score', 'is_cold_start',
]

FEATURE_LABELS = {
    'avg_monthly_transactions': 'Transaction Activity',
    'transaction_consistency':  'Transaction Regularity',
    'avg_balance':              'Account Balance Stability',
    'income_credit_monthly':    'Monthly Income Signals',
    'savings_rate':             'Savings Rate',
    'luxury_spend_ratio':       'Spending Health',
    'months_of_data':           'Data History Length',
    'rent_payments_on_time':    'Rent Payment History',
    'utility_payments_on_time': 'Utility Payment History',
    'repaid_loans_count':       'Loan Repayment Track Record',
    'prior_repayment_pct':      'Repayment Percentage',
    'employment_score':         'Employment Stability',
    'is_cold_start':            'First-time Borrower',
}

# ── Predict endpoint ──────────────────────────────────────────
@app.post("/predict")
def predict(req: CreditRequest):
    if scaler is None:
        raise HTTPException(503, "Model not loaded. Run train.py first.")

    employment_score = EMPLOYMENT_SCORES.get(req.employment_type or 'Other', 0.40)

    features = np.array([[
        req.avg_monthly_transactions,
        req.transaction_consistency,
        req.avg_balance,
        req.income_credit_monthly,
        req.savings_rate,
        req.luxury_spend_ratio,
        req.months_of_data,
        req.rent_payments_on_time,
        req.utility_payments_on_time,
        req.repaid_loans_count,
        req.prior_repayment_pct,
        employment_score,
        int(req.is_cold_start),
    ]], dtype=np.float32)

    features_scaled = scaler.transform(features)
    repay_prob      = float(model.predict_proba(features_scaled)[0][1])

    result = prob_to_score(repay_prob, req.is_cold_start, req.repaid_loans_count)

    # Add feature contributions for explainability
    importances   = model.feature_importances_
    feature_vals  = features[0]
    contributions = []
    for i, (name, imp) in enumerate(zip(FEATURE_NAMES, importances)):
        val = feature_vals[i]
        # Normalize value to 0-100 for display
        if name == 'avg_balance':           display = min(100, val / 1000)
        elif name == 'income_credit_monthly': display = min(100, val / 800)
        elif name == 'avg_monthly_transactions': display = min(100, val * 3)
        elif name == 'months_of_data':       display = min(100, val * 3)
        elif name in ('transaction_consistency','savings_rate','prior_repayment_pct','employment_score'):
            display = val * 100
        elif name == 'luxury_spend_ratio':   display = (1 - val) * 100
        elif name == 'is_cold_start':        display = (1 - val) * 100
        elif name in ('rent_payments_on_time','utility_payments_on_time','repaid_loans_count'):
            display = min(100, val * 5)
        else: display = val

        display = float(np.clip(display, 0, 100))
        contributions.append({
            'name':       FEATURE_LABELS.get(name, name),
            'score':      round(display),
            'weight':     round(float(imp), 4),
            'impact':     'positive' if display >= 60 else 'neutral' if display >= 40 else 'negative',
            'reason':     f"{'Strong' if display >= 70 else 'Moderate' if display >= 45 else 'Weak'} signal from {FEATURE_LABELS.get(name, name).lower()}",
            'contribution': round(display * float(imp), 2),
        })

    contributions.sort(key=lambda x: -x['weight'])
    result['factors'] = contributions
    result['alternativeSignalsUsed'] = req.repaid_loans_count == 0 and req.avg_monthly_transactions < 5

    return result

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": scaler is not None}

@app.get("/feature-importance")
def feature_importance():
    if scaler is None:
        raise HTTPException(503, "Model not loaded")
    importances = model.feature_importances_
    return {
        name: round(float(imp), 4)
        for name, imp in sorted(
            zip(FEATURE_NAMES, importances),
            key=lambda x: -x[1]
        )
    }