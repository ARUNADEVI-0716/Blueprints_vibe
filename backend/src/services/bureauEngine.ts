/**
 * bureauEngine.ts — Bureau Data Fusion Layer
 *
 * Simulates CIBIL/Experian bureau data and fuses it with Nexus alternative
 * signals to produce a hybrid Holistic Risk Score.
 *
 * In production: replace simulateBureauScore() with a real bureau API call
 * (CIBIL API, Experian API, or Equifax API).
 *
 * Architecture:
 *   Bureau Score (CIBIL-style 300–900)
 *     ↓  weighted fusion
 *   Alternative Signals (Nexus bank/transaction data)
 *     ↓
 *   Holistic Risk Score (300–950) + Explainability breakdown
 */

export interface BureauData {
    // CIBIL/Experian-style fields
    bureauScore:         number | null   // 300–900, null if no bureau record
    bureauGrade:         string | null   // 'Excellent' | 'Good' | 'Fair' | 'Poor' | null
    activeLoans:         number          // number of active credit accounts
    defaultHistory:      number          // count of defaults/write-offs in bureau
    creditAge:           number          // months since first credit account
    creditUtilization:   number          // 0–1, ratio of used credit to total
    enquiries90Days:     number          // hard enquiries in last 90 days
    securedLoanRatio:    number          // 0–1, ratio of secured to total loans
    hasBureauRecord:     boolean
}

export interface AlternativeData {
    avgMonthlyTransactions:  number
    transactionConsistency:  number      // 0–1
    avgBalance:              number
    incomeMonthly:           number
    savingsRate:             number      // −1 to 1
    luxurySpendRatio:        number      // 0–1
    monthsOfData:            number
    rentPaymentsOnTime:      number
    utilityPaymentsOnTime:   number
    repaidLoansCount:        number
    priorRepaymentPct:       number      // 0–1
    employmentScore:         number      // 0–1
    isColdStart:             boolean
}

export interface FusionResult {
    holisticScore:           number      // final 300–950
    grade:                   string
    riskLevel:               string
    repaymentProbability:    number      // 0–1
    bureauWeight:            number      // how much bureau contributed (0–1)
    alternativeWeight:       number      // how much alternative data contributed
    hasBureauRecord:         boolean
    isColdStart:             boolean
    isReturningBorrower:     boolean
    recommendation:          string
    factors:                 FusionFactor[]
    dataSourcesUsed:         string[]
    fusionMethod:            'full_hybrid' | 'alternative_only' | 'bureau_primary'
    maxScore:                number
    repaymentBonus:          number
    biasFlags:               string[]    // any bias concerns flagged
}

export interface FusionFactor {
    name:         string
    score:        number       // 0–100
    weight:       number       // contribution weight
    impact:       'positive' | 'neutral' | 'negative'
    source:       'bureau' | 'alternative' | 'hybrid'
    reason:       string
    contribution: number
}

// ── Bureau score simulator ────────────────────────────────────
// In production: replace with real bureau API call
// Inputs: existing loan data from your DB + applicant PAN/Aadhaar
// This deterministically computes a bureau-like score from the data
// you already have — so it's consistent and not random.

export function simulateBureauScore(
    repaidLoansCount: number,
    defaultHistory: number,
    monthsOfData: number,
    avgBalance: number,
    incomeMonthly: number,
    existingLoans: number
): BureauData {
    // If no loan history at all — no bureau record
    const hasBureauRecord = repaidLoansCount > 0 || existingLoans > 0 || monthsOfData >= 6

    if (!hasBureauRecord) {
        return {
            bureauScore:       null,
            bureauGrade:       null,
            activeLoans:       0,
            defaultHistory:    0,
            creditAge:         0,
            creditUtilization: 0.3,
            enquiries90Days:   0,
            securedLoanRatio:  0,
            hasBureauRecord:   false,
        }
    }

    // Compute bureau score from available signals
    let baseScore = 500

    // Repayment history is the biggest factor in real CIBIL (35%)
    if (repaidLoansCount >= 3)       baseScore += 120
    else if (repaidLoansCount >= 2)  baseScore += 90
    else if (repaidLoansCount >= 1)  baseScore += 60

    // Default history is heavily penalized
    if (defaultHistory === 0)        baseScore += 80
    else if (defaultHistory === 1)   baseScore -= 60
    else                             baseScore -= 120

    // Credit utilization — lower is better
    const utilization = Math.min(1, avgBalance > 0 ? 0.2 : 0.5)
    if (utilization < 0.3)           baseScore += 40
    else if (utilization > 0.7)      baseScore -= 40

    // Credit age
    if (monthsOfData >= 24)          baseScore += 40
    else if (monthsOfData >= 12)     baseScore += 20

    // Income stability
    if (incomeMonthly >= 50000)      baseScore += 30
    else if (incomeMonthly >= 25000) baseScore += 15

    const bureauScore = Math.min(900, Math.max(300, baseScore))

    let bureauGrade = 'Poor'
    if (bureauScore >= 800)      bureauGrade = 'Excellent'
    else if (bureauScore >= 700) bureauGrade = 'Good'
    else if (bureauScore >= 600) bureauGrade = 'Fair'

    return {
        bureauScore,
        bureauGrade,
        activeLoans:       existingLoans,
        defaultHistory,
        creditAge:         monthsOfData,
        creditUtilization: utilization,
        enquiries90Days:   0,
        securedLoanRatio:  0.4,
        hasBureauRecord:   true,
    }
}

// ── Factor analysis ───────────────────────────────────────────

function bureauScoreToFactor(bureau: BureauData): FusionFactor {
    if (!bureau.hasBureauRecord || bureau.bureauScore === null) {
        return {
            name: 'Credit Bureau Record', score: 0, weight: 0,
            impact: 'neutral', source: 'bureau',
            reason: 'No bureau record — alternative signals used instead',
            contribution: 0
        }
    }
    const normalized = ((bureau.bureauScore - 300) / 600) * 100
    return {
        name:         'CIBIL / Bureau Score',
        score:        Math.round(normalized),
        weight:       0,   // set dynamically in fusion
        impact:       normalized >= 60 ? 'positive' : normalized >= 40 ? 'neutral' : 'negative',
        source:       'bureau',
        reason:       `Bureau score ${bureau.bureauScore}/900 (${bureau.bureauGrade})`,
        contribution: 0    // computed in fusion
    }
}

function defaultHistoryFactor(bureau: BureauData): FusionFactor | null {
    if (!bureau.hasBureauRecord) return null
    const score = bureau.defaultHistory === 0 ? 100 : bureau.defaultHistory === 1 ? 30 : 0
    return {
        name:         'Default History',
        score,
        weight:       0,
        impact:       score >= 60 ? 'positive' : 'negative',
        source:       'bureau',
        reason:       bureau.defaultHistory === 0
            ? 'No defaults or write-offs in bureau records'
            : `${bureau.defaultHistory} default(s) recorded — significant risk flag`,
        contribution: 0
    }
}

function creditUtilizationFactor(bureau: BureauData): FusionFactor | null {
    if (!bureau.hasBureauRecord) return null
    const u = bureau.creditUtilization
    const score = u < 0.3 ? 95 : u < 0.5 ? 75 : u < 0.7 ? 50 : 20
    return {
        name:         'Credit Utilization',
        score,
        weight:       0,
        impact:       score >= 60 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
        source:       'bureau',
        reason:       `Using ${Math.round(u * 100)}% of available credit${u < 0.3 ? ' — excellent' : u > 0.7 ? ' — high, risk indicator' : ''}`,
        contribution: 0
    }
}

function enquiryFactor(bureau: BureauData): FusionFactor | null {
    if (!bureau.hasBureauRecord) return null
    const score = bureau.enquiries90Days === 0 ? 90 : bureau.enquiries90Days <= 2 ? 65 : 30
    return {
        name:         'Recent Credit Enquiries',
        score,
        weight:       0,
        impact:       score >= 60 ? 'positive' : 'negative',
        source:       'bureau',
        reason:       bureau.enquiries90Days === 0
            ? 'No hard enquiries in last 90 days'
            : `${bureau.enquiries90Days} credit enquiries in 90 days — may indicate credit stress`,
        contribution: 0
    }
}

// ── Dynamic weight calculator ─────────────────────────────────
// Core logic: when bureau data is absent, weight shifts 100% to alternative.
// When bureau exists, weight depends on data richness.

function computeWeights(bureau: BureauData, alt: AlternativeData): {
    bureauWeight: number
    alternativeWeight: number
    fusionMethod: FusionResult['fusionMethod']
} {
    if (!bureau.hasBureauRecord) {
        // No bureau record: 100% alternative signals
        return { bureauWeight: 0, alternativeWeight: 1.0, fusionMethod: 'alternative_only' }
    }

    // Has bureau data — determine richness of alternative data
    const altRichness = (
        (alt.monthsOfData >= 3  ? 0.2 : 0) +
        (alt.repaidLoansCount > 0 ? 0.3 : 0) +
        (alt.avgBalance > 1000  ? 0.2 : 0) +
        (alt.rentPaymentsOnTime > 0 ? 0.15 : 0) +
        (alt.utilityPaymentsOnTime > 0 ? 0.15 : 0)
    )

    if (altRichness >= 0.7) {
        // Rich alternative data — true hybrid
        return { bureauWeight: 0.55, alternativeWeight: 0.45, fusionMethod: 'full_hybrid' }
    } else if (altRichness >= 0.3) {
        // Some alternative data — bureau primary
        return { bureauWeight: 0.70, alternativeWeight: 0.30, fusionMethod: 'bureau_primary' }
    } else {
        // Sparse alternative data — rely mostly on bureau
        return { bureauWeight: 0.85, alternativeWeight: 0.15, fusionMethod: 'bureau_primary' }
    }
}

// ── Bias detection ────────────────────────────────────────────

function detectBiasFlags(bureau: BureauData, alt: AlternativeData, bureauWeight: number): string[] {
    const flags: string[] = []

    // Cold start applicants should not be penalized beyond their data
    if (alt.isColdStart && bureauWeight > 0.7) {
        flags.push('cold_start_bureau_overweight: Bureau heavily weighted for first-time applicant — alternative signals should dominate')
    }

    // Low income applicants getting penalized despite good payment history
    if (alt.incomeMonthly < 15000 &&
        alt.rentPaymentsOnTime >= 12 &&
        alt.utilityPaymentsOnTime >= 12) {
        flags.push('low_income_good_payer: Low income but strong payment history — ensure alternative signals are appropriately weighted')
    }

    return flags
}

// ── Main fusion function ──────────────────────────────────────

export function fuseScores(bureau: BureauData, alt: AlternativeData, xgboostScore?: number): FusionResult {
    const { bureauWeight, alternativeWeight, fusionMethod } = computeWeights(bureau, alt)
    const isReturningBorrower = alt.repaidLoansCount > 0

    // ── Bureau sub-score (0–100) ──────────────────────────────
    let bureauSubScore = 50  // neutral default
    if (bureau.hasBureauRecord && bureau.bureauScore !== null) {
        // Normalize bureau 300–900 → 0–100
        bureauSubScore = ((bureau.bureauScore - 300) / 600) * 100

        // Apply modifiers
        if (bureau.defaultHistory >= 2)  bureauSubScore -= 20
        else if (bureau.defaultHistory === 1) bureauSubScore -= 10
        if (bureau.creditUtilization > 0.7)   bureauSubScore -= 10
        if (bureau.enquiries90Days >= 3)       bureauSubScore -= 8
        if (bureau.creditAge >= 24)            bureauSubScore += 5

        bureauSubScore = Math.min(100, Math.max(0, bureauSubScore))
    }

    // ── Alternative sub-score (0–100) ────────────────────────
    // Weighted combination of alternative signals
    const altComponents = {
        transactionActivity:  Math.min(100, alt.avgMonthlyTransactions * 3),
        consistency:          alt.transactionConsistency * 100,
        balance:              Math.min(100, alt.avgBalance / 1000),
        income:               Math.min(100, alt.incomeMonthly / 800),
        savings:              Math.max(0, (alt.savingsRate + 1) / 2 * 100),
        spending:             (1 - alt.luxurySpendRatio) * 100,
        rentHistory:          Math.min(100, alt.rentPaymentsOnTime * 4.17),
        utilityHistory:       Math.min(100, alt.utilityPaymentsOnTime * 4.17),
        employment:           alt.employmentScore * 100,
        repaymentHistory:     alt.repaidLoansCount > 0 ? Math.min(100, alt.priorRepaymentPct * 100) : 50,
    }

    const altWeights = {
        transactionActivity: 0.10,
        consistency:         0.10,
        balance:             0.08,
        income:              0.12,
        savings:             0.08,
        spending:            0.07,
        rentHistory:         0.12,
        utilityHistory:      0.10,
        employment:          0.13,
        repaymentHistory:    0.10,
    }

    const altSubScore = Object.entries(altComponents).reduce(
        (sum, [k, v]) => sum + v * altWeights[k as keyof typeof altWeights], 0
    )

    // ── Fused raw score (0–100) ───────────────────────────────
    let fusedRaw: number
    if (xgboostScore !== undefined) {
        // XGBoost probability of repayment → also blend in
        const mlSubScore = xgboostScore * 100
        fusedRaw = bureauSubScore * (bureauWeight * 0.6) +
            altSubScore    * (alternativeWeight * 0.6) +
            mlSubScore     * 0.4
    } else {
        fusedRaw = bureauSubScore * bureauWeight + altSubScore * alternativeWeight
    }

    // ── Map to Nexus 300–950 scale ────────────────────────────
    let scoreMin: number, scoreMax: number
    if (isReturningBorrower) {
        scoreMin = 400; scoreMax = 900
    } else if (alt.isColdStart) {
        scoreMin = 300; scoreMax = 750
    } else {
        scoreMin = 350; scoreMax = 850
    }

    const repaymentBonus = isReturningBorrower
        ? (alt.repaidLoansCount >= 3 ? 50 : alt.repaidLoansCount === 2 ? 35 : 20)
        : 0

    const holisticScore = Math.min(
        950,
        Math.max(300, Math.round(scoreMin + (fusedRaw / 100) * (scoreMax - scoreMin)) + repaymentBonus)
    )

    // ── Repayment probability (calibrated) ───────────────────
    const repaymentProbability = Math.round(Math.min(0.99, Math.max(0.01, fusedRaw / 100 * 0.85 + 0.1)) * 1000) / 1000

    // ── Build factor list ─────────────────────────────────────
    const factors: FusionFactor[] = []

    // Bureau factors
    if (bureau.hasBureauRecord) {
        const bf  = bureauScoreToFactor(bureau)
        const dhf = defaultHistoryFactor(bureau)
        const cuf = creditUtilizationFactor(bureau)
        const enf = enquiryFactor(bureau)

        const bureauFactors = [bf, dhf, cuf, enf].filter(Boolean) as FusionFactor[]
        const bfWeight = bureauWeight / bureauFactors.length

        bureauFactors.forEach(f => {
            f.weight       = parseFloat((bfWeight * 0.4).toFixed(3))
            f.contribution = parseFloat((f.score * f.weight).toFixed(2))
            factors.push(f)
        })
    }

    // Alternative factors
    const altFactorDefs: Array<[string, number, string, 'positive'|'neutral'|'negative']> = [
        ['Monthly Income Signals',    altComponents.income,        `₹${Math.round(alt.incomeMonthly).toLocaleString('en-IN')}/mo`, alt.incomeMonthly >= 30000 ? 'positive' : 'neutral'],
        ['Employment Stability',      altComponents.employment,    `Score: ${(alt.employmentScore * 100).toFixed(0)}/100`, alt.employmentScore >= 0.7 ? 'positive' : 'neutral'],
        ['Rent Payment History',      altComponents.rentHistory,   `${alt.rentPaymentsOnTime} months on time`, alt.rentPaymentsOnTime >= 12 ? 'positive' : 'neutral'],
        ['Utility Bill Payments',     altComponents.utilityHistory,`${alt.utilityPaymentsOnTime} months on time`, alt.utilityPaymentsOnTime >= 12 ? 'positive' : 'neutral'],
        ['Transaction Regularity',    altComponents.consistency,   `${(alt.transactionConsistency * 100).toFixed(0)}% consistent`, alt.transactionConsistency >= 0.7 ? 'positive' : 'neutral'],
        ['Savings Behavior',          altComponents.savings,       `Rate: ${(alt.savingsRate * 100).toFixed(0)}%`, alt.savingsRate >= 0.2 ? 'positive' : alt.savingsRate < 0 ? 'negative' : 'neutral'],
        ['Spending Health',           altComponents.spending,      `Luxury ratio: ${(alt.luxurySpendRatio * 100).toFixed(0)}%`, alt.luxurySpendRatio < 0.3 ? 'positive' : 'neutral'],
    ]

    const altFactorWeight = alternativeWeight / altFactorDefs.length
    altFactorDefs.forEach(([name, score, reason, impact]) => {
        factors.push({
            name,
            score:        Math.round(score),
            weight:       parseFloat((altFactorWeight * 0.4).toFixed(3)),
            impact,
            source:       'alternative',
            reason,
            contribution: parseFloat((score * altFactorWeight * 0.4).toFixed(2))
        })
    })

    factors.sort((a, b) => b.weight - a.weight)

    // ── Grade / Risk / Recommendation ────────────────────────
    const grade = holisticScore >= 800 ? 'Excellent'
        : holisticScore >= 700 ? 'Very Good'
            : holisticScore >= 600 ? 'Good'
                : holisticScore >= 500 ? 'Fair'
                    : 'Poor'

    const riskLevel = holisticScore >= 750 ? 'Low Risk'
        : holisticScore >= 650 ? 'Medium Risk'
            : holisticScore >= 550 ? 'Medium-High Risk'
                : 'High Risk'

    const bureauNote = bureau.hasBureauRecord
        ? `Bureau score: ${bureau.bureauScore}/900. `
        : 'No bureau record — scored entirely on alternative signals. '

    const recommendation = isReturningBorrower
        ? `⭐ ${bureauNote}Returning borrower with proven repayment track record.`
        : alt.isColdStart
            ? `${bureauNote}Cold-start applicant. Strong alternative signals present.`
            : `${bureauNote}${grade} profile across bureau + bank data.`

    const biasFlags = detectBiasFlags(bureau, alt, bureauWeight)

    const dataSourcesUsed = [
        bureau.hasBureauRecord ? 'CIBIL/Bureau Score' : null,
        alt.avgBalance > 0 || alt.avgMonthlyTransactions > 0 ? 'Bank Transactions (Plaid)' : null,
        alt.rentPaymentsOnTime > 0 ? 'Rent Payment History' : null,
        alt.utilityPaymentsOnTime > 0 ? 'Utility Payments' : null,
        alt.repaidLoansCount > 0 ? 'Nexus Repayment History' : null,
    ].filter(Boolean) as string[]

    return {
        holisticScore,
        grade,
        riskLevel,
        repaymentProbability,
        bureauWeight,
        alternativeWeight,
        hasBureauRecord:      bureau.hasBureauRecord,
        isColdStart:          alt.isColdStart,
        isReturningBorrower,
        recommendation,
        factors,
        dataSourcesUsed,
        fusionMethod,
        maxScore:             isReturningBorrower ? 950 : alt.isColdStart ? 750 : 850,
        repaymentBonus,
        biasFlags,
    }
}

// ── Convenience: build from raw Supabase data ─────────────────
// Call this in credit.ts after feature extraction

export function buildFusionInputs(
    features: Record<string, any>,
    repaidLoansCount: number,
    approvedLoansCount: number,
    defaultHistory = 0
): { bureau: BureauData; alt: AlternativeData } {
    const bureau = simulateBureauScore(
        repaidLoansCount,
        defaultHistory,
        features.months_of_data,
        features.avg_balance,
        features.income_credit_monthly,
        approvedLoansCount
    )

    const alt: AlternativeData = {
        avgMonthlyTransactions:  features.avg_monthly_transactions,
        transactionConsistency:  features.transaction_consistency,
        avgBalance:              features.avg_balance,
        incomeMonthly:           features.income_credit_monthly,
        savingsRate:             features.savings_rate,
        luxurySpendRatio:        features.luxury_spend_ratio,
        monthsOfData:            features.months_of_data,
        rentPaymentsOnTime:      features.rent_payments_on_time,
        utilityPaymentsOnTime:   features.utility_payments_on_time,
        repaidLoansCount,
        priorRepaymentPct:       features.prior_repayment_pct,
        employmentScore:         features.employment_score ?? 0.40,
        isColdStart:             features.is_cold_start,
    }

    return { bureau, alt }
}