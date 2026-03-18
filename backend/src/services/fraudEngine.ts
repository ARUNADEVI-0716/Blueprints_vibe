// fraudEngine.ts — F7 Fraud Detection
// Runs on loan application submission and credit score calculation.
// Returns a fraud risk score (0–100) and a list of flags for the officer.

export interface FraudFlag {
    code: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    detail?: string
}

export interface FraudResult {
    riskScore: number          // 0 = clean, 100 = definitely fraud
    riskLevel: 'clean' | 'low' | 'medium' | 'high' | 'critical'
    flags: FraudFlag[]
    blocked: boolean           // true if riskScore >= 80 (critical fraud)
    recommendation: string
}

interface Transaction {
    amount: number
    date: string
    merchant?: string
    category?: string
}

interface FraudInput {
    panNumber?: string
    aadhaarNumber?: string
    transactions: Transaction[]
    monthlyIncomeDeclared: number
    existingPanApplications?: number   // count of other apps with same PAN
    existingAadhaarApplications?: number
    accountBalance?: number
    fullName?: string
    existingNamesForPan?: string[]     // other names that used same PAN
}

// ── 1. Document / Identity checks ────────────────────────────

function checkPanFormat(pan?: string): FraudFlag[] {
    const flags: FraudFlag[] = []
    if (!pan) return flags

    const upper = pan.toUpperCase()
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(upper)) {
        flags.push({
            code: 'INVALID_PAN_FORMAT',
            severity: 'high',
            message: 'PAN number format is invalid',
            detail: `Submitted PAN "${upper}" does not match AAAAA9999A pattern`
        })
    }

    // Detect obviously fake PANs (all same character, sequential numbers)
    if (/^(.)\1{4}/.test(upper)) {
        flags.push({
            code: 'SUSPICIOUS_PAN_PATTERN',
            severity: 'high',
            message: 'PAN number appears fabricated',
            detail: 'First 5 characters are identical — likely a test or fake PAN'
        })
    }

    return flags
}

function checkDuplicateIdentity(
    existingPanApps: number,
    existingAadhaarApps: number,
    existingNamesForPan?: string[],
    currentName?: string
): FraudFlag[] {
    const flags: FraudFlag[] = []

    if (existingPanApps > 0) {
        flags.push({
            code: 'DUPLICATE_PAN',
            severity: existingPanApps >= 2 ? 'critical' : 'high',
            message: `PAN number linked to ${existingPanApps} other loan application${existingPanApps > 1 ? 's' : ''}`,
            detail: 'Same PAN number has been used in previous applications — possible identity reuse or fraud'
        })
    }

    if (existingAadhaarApps > 0) {
        flags.push({
            code: 'DUPLICATE_AADHAAR',
            severity: existingAadhaarApps >= 2 ? 'critical' : 'high',
            message: `Aadhaar number linked to ${existingAadhaarApps} other application${existingAadhaarApps > 1 ? 's' : ''}`,
            detail: 'Same Aadhaar has been used in multiple applications'
        })
    }

    // Name mismatch on same PAN
    if (existingNamesForPan && currentName && existingNamesForPan.length > 0) {
        const normalized = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
        const nameMismatch = existingNamesForPan.some(n => normalized(n) !== normalized(currentName))
        if (nameMismatch) {
            flags.push({
                code: 'PAN_NAME_MISMATCH',
                severity: 'critical',
                message: 'Different names associated with the same PAN number',
                detail: `Current: "${currentName}" — Previous: "${existingNamesForPan.join('", "')}" — possible identity theft`
            })
        }
    }

    return flags
}

// ── 2. Transaction anomaly detection ─────────────────────────

function checkTransactionAnomalies(
    transactions: Transaction[],
    declaredMonthlyIncome: number
): FraudFlag[] {
    const flags: FraudFlag[] = []
    if (transactions.length === 0) return flags

    const credits = transactions.filter(t => t.amount < 0)
    const debits  = transactions.filter(t => t.amount > 0)

    // Check 1: Declared income vs actual bank credits
    if (credits.length > 0 && declaredMonthlyIncome > 0) {
        const totalCredits = credits.reduce((s, t) => s + Math.abs(t.amount), 0)
        const avgMonthlyCredit = totalCredits / 3  // 90 day window
        const ratio = avgMonthlyCredit / declaredMonthlyIncome

        if (ratio < 0.3) {
            flags.push({
                code: 'INCOME_MISMATCH_LOW',
                severity: 'high',
                message: 'Declared income significantly higher than bank credits',
                detail: `Declared ₹${declaredMonthlyIncome.toLocaleString('en-IN')}/month but bank shows avg ₹${Math.round(avgMonthlyCredit).toLocaleString('en-IN')}/month (${Math.round(ratio * 100)}% match)`
            })
        } else if (ratio > 5) {
            flags.push({
                code: 'INCOME_MISMATCH_HIGH',
                severity: 'medium',
                message: 'Bank credits far exceed declared income',
                detail: `Bank credits are ${Math.round(ratio)}x the declared income — possible undisclosed income sources`
            })
        }
    }

    // Check 2: Round-number transactions (fabricated data pattern)
    const roundNumbers = transactions.filter(t => Math.abs(t.amount) % 1000 === 0)
    const roundRatio   = roundNumbers.length / transactions.length
    if (roundRatio > 0.85 && transactions.length >= 10) {
        flags.push({
            code: 'SUSPICIOUS_ROUND_AMOUNTS',
            severity: 'medium',
            message: 'Unusually high proportion of round-number transactions',
            detail: `${Math.round(roundRatio * 100)}% of transactions are exact multiples of ₹1,000 — may indicate fabricated data`
        })
    }

    // Check 3: Sudden large credit just before application (loan washing)
    const sortedByDate = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
    const recentCredits = sortedByDate.slice(0, 5).filter(t => t.amount < 0)
    if (recentCredits.length > 0) {
        const avgAllCredits = credits.length > 0
            ? credits.reduce((s, t) => s + Math.abs(t.amount), 0) / credits.length
            : 0
        const recentMax = Math.max(...recentCredits.map(t => Math.abs(t.amount)))
        if (avgAllCredits > 0 && recentMax > avgAllCredits * 5) {
            flags.push({
                code: 'SUDDEN_LARGE_CREDIT',
                severity: 'high',
                message: 'Unusually large credit detected just before application',
                detail: `Recent credit of ₹${recentMax.toLocaleString('en-IN')} is ${Math.round(recentMax / avgAllCredits)}x the average — possible loan washing`
            })
        }
    }

    // Check 4: No debit transactions (synthetic account)
    if (debits.length === 0 && credits.length > 5) {
        flags.push({
            code: 'NO_DEBIT_ACTIVITY',
            severity: 'medium',
            message: 'Account shows only credits with no spending activity',
            detail: 'A real active account should have regular debit transactions — this may be a pass-through account'
        })
    }

    // Check 5: All transactions on same day / same week (batch-loaded fake data)
    const uniqueDates = new Set(transactions.map(t => t.date))
    if (uniqueDates.size < transactions.length * 0.2 && transactions.length >= 15) {
        flags.push({
            code: 'TRANSACTION_DATE_CLUSTERING',
            severity: 'high',
            message: 'Transactions clustered on very few dates',
            detail: `${transactions.length} transactions spread across only ${uniqueDates.size} unique dates — may be batch-uploaded fake data`
        })
    }

    return flags
}

// ── 3. Velocity check ────────────────────────────────────────

function checkApplicationVelocity(existingPanApps: number): FraudFlag[] {
    const flags: FraudFlag[] = []
    if (existingPanApps >= 3) {
        flags.push({
            code: 'HIGH_APPLICATION_VELOCITY',
            severity: 'critical',
            message: 'Multiple loan applications submitted in short period',
            detail: `${existingPanApps + 1} applications detected for the same PAN — high-velocity lending fraud pattern`
        })
    }
    return flags
}

// ── 4. Score + risk level ────────────────────────────────────

function computeRiskScore(flags: FraudFlag[]): number {
    const weights = { low: 5, medium: 15, high: 30, critical: 50 }
    const raw = flags.reduce((sum, f) => sum + weights[f.severity], 0)
    return Math.min(100, raw)
}

function getRiskLevel(score: number): FraudResult['riskLevel'] {
    if (score === 0)  return 'clean'
    if (score < 20)   return 'low'
    if (score < 45)   return 'medium'
    if (score < 75)   return 'high'
    return 'critical'
}

function getRecommendation(level: FraudResult['riskLevel']): string {
    switch (level) {
        case 'clean':    return 'No fraud indicators detected. Application can proceed normally.'
        case 'low':      return 'Minor anomalies detected. Review flagged items but can proceed with standard verification.'
        case 'medium':   return 'Moderate risk signals. Manual review recommended before approval.'
        case 'high':     return 'Significant fraud indicators. Do not approve without thorough identity and document verification.'
        case 'critical': return 'Critical fraud signals detected. Application should be blocked pending investigation.'
    }
}

// ── Main export ───────────────────────────────────────────────

export function runFraudCheck(input: FraudInput): FraudResult {
    const flags: FraudFlag[] = [
        ...checkPanFormat(input.panNumber),
        ...checkDuplicateIdentity(
            input.existingPanApplications ?? 0,
            input.existingAadhaarApplications ?? 0,
            input.existingNamesForPan,
            input.fullName
        ),
        ...checkTransactionAnomalies(input.transactions, input.monthlyIncomeDeclared),
        ...checkApplicationVelocity(input.existingPanApplications ?? 0),
    ]

    const riskScore = computeRiskScore(flags)
    const riskLevel = getRiskLevel(riskScore)

    return {
        riskScore,
        riskLevel,
        flags,
        blocked: riskScore >= 80,
        recommendation: getRecommendation(riskLevel)
    }
}