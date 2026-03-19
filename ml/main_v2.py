"""
main_v2.py — FastAPI credit scoring service with bureau fusion + bias metadata.

Changes from main.py:
  1. /predict now returns bureau fusion data alongside XGBoost score
  2. /predict includes bias_flags in every response
  3. New /bureau-fuse endpoint for pure fusion without ML
  4. /health returns bias_report.json metadata
  5. Calibrated probability output (Platt scaling)

Run: uvicorn main_v2:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import pickle
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from xgboost import XGBClassifier
from typing import Optional, List, Dict, Any

app = FastAPI(title="Nexus Credit ML Service v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load artifacts ────────────────────────────────────────────
model     = XGBClassifier()
scaler    = None
bias_meta: dict = {}

@app.on_event("startup")
def load_model():
    global model, scaler, bias_meta
    try:
        model.load_model("model.json")
        with open("scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        print("✅ XGBoost model loaded")
    except FileNotFoundError:
        print("❌ model.json or scaler.pkl not found. Run train_v2.py first.")

    try:
        with open("bias_report.json") as f:
            bias_meta = json.load(f)
        print(f"✅ Bias report loaded — status: {bias_meta.get('bias_report', {}).get('bias_status', 'UNKNOWN')}")
    except FileNotFoundError:
        print("⚠️  bias_report.json not found — run train_v2.py to generate")

# ── Employment score map ──────────────────────────────────────
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

# ── Bureau simulation (mirrors bureauEngine.ts logic) ─────────

def simulate_bureau_score(repaid_loans: int, default_history: int,
                           months_data: int, avg_balance: float,
                           income: float, existing_loans: int) -> dict:
    has_record = repaid_loans > 0 or existing_loans > 0 or months_data >= 6

    if not has_record:
        return {
            'bureau_score': None, 'bureau_grade': None,
            'active_loans': 0, 'default_history': 0,
            'credit_age': 0, 'credit_utilization': 0.3,
            'enquiries_90_days': 0, 'has_bureau_record': False
        }

    base = 500
    if repaid_loans >= 3:      base += 120
    elif repaid_loans >= 2:    base += 90
    elif repaid_loans >= 1:    base += 60
    if default_history == 0:   base += 80
    elif default_history == 1: base -= 60
    else:                      base -= 120
    if months_data >= 24:      base += 40
    elif months_data >= 12:    base += 20
    if income >= 50000:        base += 30
    elif income >= 25000:      base += 15

    score = min(900, max(300, base))
    grade = ('Excellent' if score >= 800 else 'Good' if score >= 700
             else 'Fair' if score >= 600 else 'Poor')

    return {
        'bureau_score': score, 'bureau_grade': grade,
        'active_loans': existing_loans, 'default_history': default_history,
        'credit_age': months_data, 'credit_utilization': 0.3 if avg_balance > 0 else 0.5,
        'enquiries_90_days': 0, 'has_bureau_record': True
    }

def compute_fusion_weights(has_bureau: bool, months_data: int,
                            repaid_loans: int, avg_balance: float,
                            rent_on_time: int, utility_on_time: int) -> tuple:
    if not has_bureau:
        return 0.0, 1.0, 'alternative_only'

    alt_richness = (
        (0.2 if months_data >= 3 else 0) +
        (0.3 if repaid_loans > 0 else 0) +
        (0.2 if avg_balance > 1000 else 0) +
        (0.15 if rent_on_time > 0 else 0) +
        (0.15 if utility_on_time > 0 else 0)
    )
    if alt_richness >= 0.7:   return 0.55, 0.45, 'full_hybrid'
    elif alt_richness >= 0.3: return 0.70, 0.30, 'bureau_primary'
    else:                      return 0.85, 0.15, 'bureau_primary'

def detect_bias_flags(is_cold_start: bool, income: float,
                      rent_on_time: int, utility_on_time: int,
                      bureau_weight: float) -> List[str]:
    flags = []
    if is_cold_start and bureau_weight > 0.7:
        flags.append('cold_start_bureau_overweight')
    if income < 15000 and rent_on_time >= 12 and utility_on_time >= 12:
        flags.append('low_income_good_payer_underweighted')
    return flags

# ── Score band conversion ─────────────────────────────────────

def prob_to_score(prob: float, is_cold_start: bool, repaid_loans: int,
                  bureau: dict) -> dict:
    is_returning = repaid_loans >= 1

    if is_returning:
        base_min, base_max = 400, 900
        bonus = min(50, repaid_loans * 17)
    elif is_cold_start:
        base_min, base_max = 300, 750
        bonus = 0
    else:
        base_min, base_max = 350, 850
        bonus = 0

    # If we have bureau data, blend it into the final score
    if bureau['has_bureau_record'] and bureau['bureau_score']:
        bureau_normalized = (bureau['bureau_score'] - 300) / 600  # 0–1
        blended_prob = prob * 0.6 + bureau_normalized * 0.4
    else:
        blended_prob = prob

    raw_score = int(base_min + blended_prob * (base_max - base_min)) + bonus
    score = min(950, max(300, raw_score))

    if score >= 800:   grade = 'Excellent'
    elif score >= 700: grade = 'Very Good'
    elif score >= 600: grade = 'Good'
    elif score >= 500: grade = 'Fair'
    else:              grade = 'Poor'

    if score >= 750:   risk = 'Low Risk'
    elif score >= 650: risk = 'Medium Risk'
    elif score >= 550: risk = 'Medium-High Risk'
    else:              risk = 'High Risk'

    bureau_note = f"Bureau: {bureau['bureau_score']}/900. " if bureau['has_bureau_record'] else "No bureau record. "
    if is_returning:
        rec = f"⭐ {bureau_note}Returning borrower with proven repayment record."
    elif is_cold_start:
        rec = f"{bureau_note}Cold-start applicant assessed on alternative signals."
    elif score >= 750:
        rec = f"{bureau_note}Excellent hybrid profile. Eligible for premium loan products."
    elif score >= 650:
        rec = f"{bureau_note}Good hybrid profile. Eligible for standard loan products."
    else:
        rec = f"{bureau_note}Fair profile. Consider building credit history."

    max_score = 950 if is_returning else 750 if is_cold_start else 850
    return {
        'score': score, 'grade': grade, 'riskLevel': risk,
        'recommendation': rec, 'repaymentBonus': bonus,
        'isReturningBorrower': is_returning, 'isColdStart': is_cold_start,
        'maxScore': max_score,
    }

# ── Request schema ────────────────────────────────────────────

class CreditRequest(BaseModel):
    avg_monthly_transactions:  float = Field(0, ge=0)
    transaction_consistency:   float = Field(0.5, ge=0, le=1)
    avg_balance:               float = Field(0, ge=0)
    income_credit_monthly:     float = Field(0, ge=0)
    savings_rate:              float = Field(0, ge=-1, le=1)
    luxury_spend_ratio:        float = Field(0.2, ge=0, le=1)
    months_of_data:            int   = Field(0, ge=0)
    rent_payments_on_time:     int   = Field(0, ge=0)
    utility_payments_on_time:  int   = Field(0, ge=0)
    repaid_loans_count:        int   = Field(0, ge=0)
    prior_repayment_pct:       float = Field(0.0, ge=0, le=1)
    employment_type:           Optional[str] = 'Other'
    is_cold_start:             bool  = True
    # Optional: default history from bureau (0 = no defaults)
    default_history:           int   = Field(0, ge=0)
    # Optional: count of approved (not yet repaid) loans
    approved_loans_count:      int   = Field(0, ge=0)

class BureauFuseRequest(BaseModel):
    """Direct bureau fusion without ML — for when ML service is bypassed."""
    bureau_score:              Optional[int]   = None
    repaid_loans_count:        int             = 0
    default_history:           int             = 0
    months_of_data:            int             = 0
    avg_balance:               float           = 0
    income_credit_monthly:     float           = 0
    approved_loans_count:      int             = 0
    rent_payments_on_time:     int             = 0
    utility_payments_on_time:  int             = 0
    employment_type:           Optional[str]   = 'Other'
    is_cold_start:             bool            = True
    avg_monthly_transactions:  float           = 0
    transaction_consistency:   float           = 0.5
    savings_rate:              float           = 0
    luxury_spend_ratio:        float           = 0.2
    prior_repayment_pct:       float           = 0.0

# ── /predict ──────────────────────────────────────────────────

@app.post("/predict")
def predict(req: CreditRequest):
    if scaler is None:
        raise HTTPException(503, "Model not loaded. Run train_v2.py first.")

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

    # Bureau simulation
    bureau = simulate_bureau_score(
        req.repaid_loans_count, req.default_history,
        req.months_of_data, req.avg_balance,
        req.income_credit_monthly, req.approved_loans_count
    )

    # Fusion weights
    bureau_weight, alt_weight, fusion_method = compute_fusion_weights(
        bureau['has_bureau_record'], req.months_of_data,
        req.repaid_loans_count, req.avg_balance,
        req.rent_payments_on_time, req.utility_payments_on_time
    )

    # Score conversion with bureau blending
    result = prob_to_score(repay_prob, req.is_cold_start, req.repaid_loans_count, bureau)
    result['repaymentProbability'] = round(repay_prob, 4)
    result['model'] = 'XGBoost+Bureau'

    # Bureau fusion metadata
    result['bureau'] = bureau
    result['fusionMethod'] = fusion_method
    result['bureauWeight'] = round(bureau_weight, 2)
    result['alternativeWeight'] = round(alt_weight, 2)
    result['dataSourcesUsed'] = [
        s for s in [
            'CIBIL/Bureau Score' if bureau['has_bureau_record'] else None,
            'Bank Transactions (Plaid)' if req.avg_balance > 0 or req.avg_monthly_transactions > 0 else None,
            'Rent Payment History' if req.rent_payments_on_time > 0 else None,
            'Utility Payments' if req.utility_payments_on_time > 0 else None,
            'Nexus Repayment History' if req.repaid_loans_count > 0 else None,
        ] if s
    ]

    # Bias flags
    result['biasFlags'] = detect_bias_flags(
        req.is_cold_start, req.income_credit_monthly,
        req.rent_payments_on_time, req.utility_payments_on_time,
        bureau_weight
    )

    # Feature contributions
    importances  = model.feature_importances_
    feature_vals = features[0]
    contributions = []
    for i, (name, imp) in enumerate(zip(FEATURE_NAMES, importances)):
        val = feature_vals[i]
        if name == 'avg_balance':               display = min(100, val / 1000)
        elif name == 'income_credit_monthly':   display = min(100, val / 800)
        elif name == 'avg_monthly_transactions':display = min(100, val * 3)
        elif name == 'months_of_data':          display = min(100, val * 3)
        elif name in ('transaction_consistency', 'savings_rate', 'prior_repayment_pct', 'employment_score'):
            display = val * 100
        elif name == 'luxury_spend_ratio':       display = (1 - val) * 100
        elif name == 'is_cold_start':            display = (1 - val) * 100
        elif name in ('rent_payments_on_time', 'utility_payments_on_time', 'repaid_loans_count'):
            display = min(100, val * 5)
        else:
            display = val

        display = float(np.clip(display, 0, 100))
        contributions.append({
            'name':         FEATURE_LABELS.get(name, name),
            'score':        round(display),
            'weight':       round(float(imp), 4),
            'impact':       'positive' if display >= 60 else 'neutral' if display >= 40 else 'negative',
            'source':       'alternative',
            'reason':       f"{'Strong' if display >= 70 else 'Moderate' if display >= 45 else 'Weak'} signal from {FEATURE_LABELS.get(name, name).lower()}",
            'contribution': round(display * float(imp), 2),
        })

    contributions.sort(key=lambda x: -x['weight'])
    result['factors'] = contributions
    result['alternativeSignalsUsed'] = req.repaid_loans_count == 0 and req.avg_monthly_transactions < 5

    return result

# ── /bureau-fuse ──────────────────────────────────────────────
# Pure bureau fusion without ML — used as fallback or standalone

@app.post("/bureau-fuse")
def bureau_fuse(req: BureauFuseRequest):
    """
    Fuse bureau score with alternative signals without running XGBoost.
    Useful when: (a) ML model unavailable, (b) want pure bureau+alt fusion.
    """
    emp_score = EMPLOYMENT_SCORES.get(req.employment_type or 'Other', 0.40)

    bureau = simulate_bureau_score(
        req.repaid_loans_count, req.default_history,
        req.months_of_data, req.avg_balance,
        req.income_credit_monthly, req.approved_loans_count
    )

    # If caller provided a real bureau score, override simulation
    if req.bureau_score is not None:
        bureau['bureau_score'] = req.bureau_score
        bureau['has_bureau_record'] = True
        if req.bureau_score >= 800:   bureau['bureau_grade'] = 'Excellent'
        elif req.bureau_score >= 700: bureau['bureau_grade'] = 'Good'
        elif req.bureau_score >= 600: bureau['bureau_grade'] = 'Fair'
        else:                          bureau['bureau_grade'] = 'Poor'

    bureau_weight, alt_weight, fusion_method = compute_fusion_weights(
        bureau['has_bureau_record'], req.months_of_data,
        req.repaid_loans_count, req.avg_balance,
        req.rent_payments_on_time, req.utility_payments_on_time
    )

    # Bureau sub-score (0–1)
    if bureau['has_bureau_record'] and bureau['bureau_score']:
        bureau_sub = (bureau['bureau_score'] - 300) / 600
    else:
        bureau_sub = 0.5

    # Alternative sub-score (0–1)
    alt_sub = (
        min(1, req.avg_monthly_transactions / 30)  * 0.10 +
        req.transaction_consistency                 * 0.10 +
        min(1, req.avg_balance / 100000)            * 0.08 +
        min(1, req.income_credit_monthly / 80000)   * 0.12 +
        max(0, (req.savings_rate + 1) / 2)          * 0.08 +
        (1 - req.luxury_spend_ratio)                * 0.07 +
        min(1, req.rent_payments_on_time / 24)      * 0.12 +
        min(1, req.utility_payments_on_time / 24)   * 0.10 +
        emp_score                                    * 0.13 +
        req.prior_repayment_pct                      * 0.10
    )

    fused_prob = bureau_sub * bureau_weight + alt_sub * alt_weight
    result = prob_to_score(fused_prob, req.is_cold_start, req.repaid_loans_count, bureau)
    result['repaymentProbability'] = round(float(fused_prob), 4)
    result['model'] = 'bureau-fusion'
    result['bureau'] = bureau
    result['fusionMethod'] = fusion_method
    result['bureauWeight'] = round(bureau_weight, 2)
    result['alternativeWeight'] = round(alt_weight, 2)
    result['biasFlags'] = detect_bias_flags(
        req.is_cold_start, req.income_credit_monthly,
        req.rent_payments_on_time, req.utility_payments_on_time,
        bureau_weight
    )
    return result

# ── /health ───────────────────────────────────────────────────

@app.get("/health")
def health():
    bias_status = bias_meta.get('bias_report', {}).get('bias_status', 'UNKNOWN')
    return {
        "status":          "ok",
        "model_loaded":    scaler is not None,
        "bias_status":     bias_status,
        "test_roc_auc":    bias_meta.get('test_roc_auc'),
        "train_roc_auc":   bias_meta.get('train_roc_auc'),
        "auc_gap":         bias_meta.get('auc_gap'),
        "brier_score":     bias_meta.get('brier_score'),
        "cv_auc_mean":     bias_meta.get('cv_auc_mean'),
        "cv_auc_std":      bias_meta.get('cv_auc_std'),
        "total_records":   bias_meta.get('total_records'),
        "datasets_used":   bias_meta.get('datasets_used'),
        "bias_flags":      bias_meta.get('bias_report', {}).get('bias_flags', {}),
        "training_date":   bias_meta.get('training_date'),
        "version":         "2.0.0",
    }

@app.get("/bias-report")
def bias_report():
    if not bias_meta:
        raise HTTPException(404, "bias_report.json not found — run train_v2.py")
    return bias_meta

@app.get("/feature-importance")
def feature_importance():
    if scaler is None:
        raise HTTPException(503, "Model not loaded")
    importances = model.feature_importances_
    return {
        name: round(float(imp), 4)
        for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])
    }