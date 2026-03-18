// interface Transaction {
//     amount: number
//     date: string
//     category: string
//     merchant: string
// }
//
// interface Account {
//     balance: number
//     account_type: string
// }
//
// interface AlternativeSignals {
//     rentPaymentsOnTime?: number
//     utilityPaymentsOnTime?: number
//     mobileRechargePattern?: 'monthly' | 'postpaid' | 'weekly' | 'irregular'
//     employmentType?: string
//     selfReportedIncome?: number
//     hasOwnedPropertyBefore?: boolean
// }
//
// interface CreditInput {
//     transactions: Transaction[]
//     accounts: Account[]
//     isColdStart: boolean
//     hasExistingLoans?: boolean
//     priorRepaymentHistory?: number
//     alternativeSignals?: AlternativeSignals
// }
//
// interface ScoreFactor {
//     name: string
//     score: number
//     weight: number
//     impact: 'positive' | 'neutral' | 'negative'
//     reason: string
//     contribution: number
// }
//
// interface CreditResult {
//     score: number
//     grade: string
//     isColdStart: boolean
//     maxScore: number
//     factors: ScoreFactor[]
//     recommendation: string
//     riskLevel: string
//     alternativeSignalsUsed: boolean
// }
//
// // ── Helpers ───────────────────────────────────────────────────
//
// function getImpact(score: number): 'positive' | 'neutral' | 'negative' {
//     if (score >= 60) return 'positive'
//     if (score >= 40) return 'neutral'
//     return 'negative'
// }
//
// function analyzeTransactionRegularity(transactions: Transaction[]): { score: number; reason: string } {
//     if (transactions.length === 0) return { score: 20, reason: 'No transaction history found' }
//
//     const byMonth: Record<string, number> = {}
//     transactions.forEach(t => {
//         const month = t.date.slice(0, 7)
//         byMonth[month] = (byMonth[month] || 0) + 1
//     })
//
//     const monthCounts = Object.values(byMonth)
//     const avgPerMonth = monthCounts.reduce((a, b) => a + b, 0) / monthCounts.length
//     const variance = monthCounts.reduce((sum, c) => sum + Math.pow(c - avgPerMonth, 2), 0) / monthCounts.length
//     const consistency = Math.max(0, 100 - variance * 2)
//     const score = Math.round(Math.min(100, (avgPerMonth / 20) * 60 + consistency * 0.4))
//
//     let reason = ''
//     if (score >= 80) reason = `Excellent: ${Math.round(avgPerMonth)} transactions/month consistently`
//     else if (score >= 60) reason = `Good: ${Math.round(avgPerMonth)} transactions/month`
//     else if (score >= 40) reason = `Fair: Irregular transaction patterns detected`
//     else reason = `Low: Very few transactions (${Math.round(avgPerMonth)}/month)`
//
//     return { score, reason }
// }
//
// function analyzeBalanceStability(accounts: Account[]): { score: number; reason: string } {
//     if (accounts.length === 0) return { score: 20, reason: 'No account data available' }
//
//     const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
//     const avgBalance = totalBalance / accounts.length
//
//     let score = 15
//     if (avgBalance >= 50000) score = 100
//     else if (avgBalance >= 25000) score = 85
//     else if (avgBalance >= 10000) score = 70
//     else if (avgBalance >= 5000) score = 55
//     else if (avgBalance >= 1000) score = 35
//
//     let reason = ''
//     if (score >= 80) reason = `Strong balance: ₹${avgBalance.toLocaleString('en-IN')} average`
//     else if (score >= 55) reason = `Moderate balance: ₹${avgBalance.toLocaleString('en-IN')} average`
//     else reason = `Low balance: ₹${avgBalance.toLocaleString('en-IN')} — risk indicator`
//
//     return { score, reason }
// }
//
// function analyzeIncomeSignals(transactions: Transaction[]): { score: number; reason: string } {
//     const credits = transactions.filter(t => t.amount < 0)
//     const debits = transactions.filter(t => t.amount > 0)
//
//     if (credits.length === 0) return { score: 25, reason: 'No income credits detected in bank data' }
//
//     const totalCredit = credits.reduce((sum, t) => sum + Math.abs(t.amount), 0)
//     const totalDebit = debits.reduce((sum, t) => sum + t.amount, 0)
//     const monthlyIncome = totalCredit / 3
//     const savingsRate = totalCredit > 0 ? ((totalCredit - totalDebit) / totalCredit) * 100 : 0
//
//     let score = 25
//     if (monthlyIncome >= 50000) score = 95
//     else if (monthlyIncome >= 30000) score = 80
//     else if (monthlyIncome >= 15000) score = 65
//     else if (monthlyIncome >= 8000) score = 45
//
//     if (savingsRate > 30) score = Math.min(100, score + 10)
//     else if (savingsRate < 0) score = Math.max(0, score - 15)
//
//     return {
//         score: Math.round(score),
//         reason: `Monthly income: ₹${Math.round(monthlyIncome).toLocaleString('en-IN')}, savings rate: ${Math.round(savingsRate)}%`
//     }
// }
//
// function analyzeSpendingHealth(transactions: Transaction[]): { score: number; reason: string } {
//     if (transactions.length === 0) return { score: 30, reason: 'No spending data available' }
//
//     const debits = transactions.filter(t => t.amount > 0)
//     const luxuryCategories = ['Entertainment', 'Recreation', 'Restaurants']
//     const luxury = debits.filter(t => luxuryCategories.some(c => t.category?.includes(c)))
//
//     const totalSpend = debits.reduce((sum, t) => sum + t.amount, 0)
//     const luxurySpend = luxury.reduce((sum, t) => sum + t.amount, 0)
//     const luxuryRatio = totalSpend > 0 ? (luxurySpend / totalSpend) * 100 : 0
//
//     let score = 25
//     if (luxuryRatio < 10) score = 95
//     else if (luxuryRatio < 20) score = 80
//     else if (luxuryRatio < 30) score = 65
//     else if (luxuryRatio < 40) score = 45
//
//     let reason = `Discretionary spending: ${Math.round(luxuryRatio)}% of total`
//     if (luxuryRatio < 20) reason += ' — healthy pattern'
//     else if (luxuryRatio > 35) reason += ' — high discretionary, risk factor'
//
//     return { score: Math.round(score), reason }
// }
//
// // ── Alternative Signal Analyzers ──────────────────────────────
//
// function analyzeRentHistory(months: number): { score: number; reason: string } {
//     let score = 20
//     if (months >= 24) score = 95
//     else if (months >= 12) score = 80
//     else if (months >= 6) score = 60
//     else if (months >= 3) score = 40
//
//     return {
//         score,
//         reason: `${months} months of on-time rent payments — ${score >= 80 ? 'strong' : score >= 60 ? 'moderate' : 'limited'} payment discipline`
//     }
// }
//
// function analyzeUtilityHistory(months: number): { score: number; reason: string } {
//     let score = 15
//     if (months >= 24) score = 90
//     else if (months >= 12) score = 75
//     else if (months >= 6) score = 55
//     else if (months >= 3) score = 35
//
//     return {
//         score,
//         reason: `${months} months of on-time utility payments — demonstrates consistent bill payment behavior`
//     }
// }
//
// function analyzeMobilePattern(pattern: string): { score: number; reason: string } {
//     const patterns: Record<string, { score: number; reason: string }> = {
//         postpaid:  { score: 90, reason: 'Postpaid plan — stable income and payment commitment' },
//         monthly:   { score: 75, reason: 'Regular monthly recharge — consistent financial behavior' },
//         weekly:    { score: 50, reason: 'Weekly recharge — managed but limited cash flow' },
//         irregular: { score: 25, reason: 'Irregular recharge pattern — inconsistent financial behavior' },
//     }
//     return patterns[pattern] ?? { score: 30, reason: 'Unknown mobile payment pattern' }
// }
//
// function analyzeEmploymentType(type: string): { score: number; reason: string } {
//     const types: Record<string, { score: number; reason: string }> = {
//         'Salaried':       { score: 90, reason: 'Salaried employment — stable, predictable income source' },
//         'Business Owner': { score: 80, reason: 'Business owner — established income, higher variability' },
//         'Self-Employed':  { score: 70, reason: 'Self-employed — income present but variable' },
//         'Freelancer':     { score: 55, reason: 'Freelancer — irregular income, higher risk profile' },
//     }
//     return types[type] ?? { score: 40, reason: 'Employment type not verified' }
// }
//
// // ── Auto-extract from Plaid transactions ──────────────────────
//
// export function extractAlternativeSignalsFromTransactions(
//     transactions: Transaction[]
// ): AlternativeSignals {
//     if (transactions.length === 0) return {}
//
//     const rentKeywords = ['rent', 'landlord', 'housing', 'lease', 'apartment', 'flat']
//     const rentTx = transactions.filter(t =>
//         rentKeywords.some(k =>
//             t.merchant?.toLowerCase().includes(k) ||
//             t.category?.toLowerCase().includes(k)
//         )
//     )
//     const rentMonthsOnTime = new Set(rentTx.map(t => t.date?.slice(0, 7))).size
//
//     const utilityKeywords = [
//         'electricity', 'electric', 'power', 'water', 'gas', 'utility',
//         'bescom', 'tata power', 'adani', 'bses', 'msedcl', 'tneb',
//         'internet', 'broadband', 'jio', 'airtel', 'bsnl', 'vodafone'
//     ]
//     const utilityTx = transactions.filter(t =>
//         utilityKeywords.some(k =>
//             t.merchant?.toLowerCase().includes(k) ||
//             t.category?.toLowerCase().includes(k)
//         )
//     )
//     const utilityMonthsOnTime = new Set(utilityTx.map(t => t.date?.slice(0, 7))).size
//
//     const mobileKeywords = ['recharge', 'mobile', 'prepaid', 'jio', 'airtel', 'vi', 'bsnl', 'postpaid']
//     const mobileTx = transactions.filter(t =>
//         mobileKeywords.some(k => t.merchant?.toLowerCase().includes(k))
//     )
//
//     let mobileRechargePattern: AlternativeSignals['mobileRechargePattern'] = 'irregular'
//     if (mobileTx.length > 0) {
//         const avgAmount = mobileTx.reduce((s, t) => s + Math.abs(t.amount), 0) / mobileTx.length
//         const byMonth = new Set(mobileTx.map(t => t.date?.slice(0, 7))).size
//         if (avgAmount > 300 && byMonth >= 2) mobileRechargePattern = 'postpaid'
//         else if (byMonth >= 2) mobileRechargePattern = 'monthly'
//         else if (mobileTx.length >= 4) mobileRechargePattern = 'weekly'
//     }
//
//     const salaryKeywords = ['salary', 'sal credit', 'payroll', 'wages', 'employer']
//     const hasSalary = transactions.some(t =>
//         salaryKeywords.some(k => t.merchant?.toLowerCase().includes(k)) && t.amount < 0
//     )
//     const businessKeywords = ['gst', 'invoice', 'business', 'vendor', 'client']
//     const hasBusiness = transactions.some(t =>
//         businessKeywords.some(k => t.merchant?.toLowerCase().includes(k))
//     )
//
//     const employmentType = hasSalary ? 'Salaried' : hasBusiness ? 'Business Owner' : 'Self-Employed'
//
//     return { rentPaymentsOnTime: rentMonthsOnTime, utilityPaymentsOnTime: utilityMonthsOnTime, mobileRechargePattern, employmentType }
// }
//
// // ── Grade / Risk / Recommendation ────────────────────────────
//
// function getGrade(score: number): string {
//     if (score >= 800) return 'Excellent'
//     if (score >= 700) return 'Very Good'
//     if (score >= 600) return 'Good'
//     if (score >= 500) return 'Fair'
//     return 'Poor'
// }
//
// function getRiskLevel(score: number): string {
//     if (score >= 750) return 'Low Risk'
//     if (score >= 650) return 'Medium Risk'
//     if (score >= 550) return 'Medium-High Risk'
//     return 'High Risk'
// }
//
// function getRecommendation(score: number, isColdStart: boolean, altUsed: boolean): string {
//     const note = altUsed ? ' (based on alternative financial signals)' : ''
//     if (isColdStart) {
//         if (score >= 650) return `Cold start profile shows strong financial behavior${note}. Eligible for loans up to ₹5,00,000.`
//         if (score >= 550) return `Moderate cold start profile${note}. Eligible for loans up to ₹2,00,000 with standard rates.`
//         return `Limited financial signals${note}. Consider a smaller loan to build credit history.`
//     }
//     if (score >= 750) return 'Excellent credit profile. Eligible for premium loan products at best rates.'
//     if (score >= 650) return 'Good credit profile. Eligible for most loan products at standard rates.'
//     return 'Fair credit. Eligible for basic loan products. Consider building credit history.'
// }
//
// // ── Main scoring function ─────────────────────────────────────
//
// export function calculateCreditScore(input: CreditInput): CreditResult {
//     const { transactions, accounts, isColdStart, priorRepaymentHistory, alternativeSignals } = input
//
//     // Determine data availability — defined at top level so accessible everywhere
//     const hasPlaidData: boolean = transactions.length > 0 || accounts.length > 0
//     const hasAltSignals: boolean = !!(
//         alternativeSignals && (
//             (alternativeSignals.rentPaymentsOnTime ?? 0) > 0 ||
//             (alternativeSignals.utilityPaymentsOnTime ?? 0) > 0 ||
//             !!alternativeSignals.mobileRechargePattern ||
//             !!alternativeSignals.employmentType
//         )
//     )
//     const alternativeSignalsUsed: boolean = isColdStart && hasAltSignals && !hasPlaidData
//
//     const regularity = analyzeTransactionRegularity(transactions)
//     const balance    = analyzeBalanceStability(accounts)
//     const income     = analyzeIncomeSignals(transactions)
//     const spending   = analyzeSpendingHealth(transactions)
//
//     let factors: ScoreFactor[]
//     let rawScore: number
//
//     if (isColdStart) {
//         if (hasPlaidData) {
//             // Cold start WITH Plaid bank data
//             factors = [
//                 { name: 'Transaction Regularity',    score: regularity.score, weight: 0.30, impact: getImpact(regularity.score), reason: regularity.reason, contribution: regularity.score * 0.30 },
//                 { name: 'Account Balance Stability', score: balance.score,    weight: 0.25, impact: getImpact(balance.score),    reason: balance.reason,    contribution: balance.score    * 0.25 },
//                 { name: 'Income Signals',            score: income.score,     weight: 0.25, impact: getImpact(income.score),     reason: income.reason,     contribution: income.score     * 0.25 },
//                 { name: 'Spending Health',           score: spending.score,   weight: 0.20, impact: getImpact(spending.score),   reason: spending.reason,   contribution: spending.score   * 0.20 },
//             ]
//         } else if (hasAltSignals && alternativeSignals) {
//             // Cold start WITHOUT bank data — use auto-extracted alternative signals
//             const rent       = analyzeRentHistory(alternativeSignals.rentPaymentsOnTime ?? 0)
//             const utility    = analyzeUtilityHistory(alternativeSignals.utilityPaymentsOnTime ?? 0)
//             const mobile     = analyzeMobilePattern(alternativeSignals.mobileRechargePattern ?? 'irregular')
//             const employment = analyzeEmploymentType(alternativeSignals.employmentType ?? '')
//
//             factors = [
//                 { name: 'Rent Payment History',   score: rent.score,       weight: 0.30, impact: getImpact(rent.score),       reason: rent.reason,       contribution: rent.score       * 0.30 },
//                 { name: 'Utility Bill Payments',  score: utility.score,    weight: 0.25, impact: getImpact(utility.score),    reason: utility.reason,    contribution: utility.score    * 0.25 },
//                 { name: 'Employment Stability',   score: employment.score, weight: 0.25, impact: getImpact(employment.score), reason: employment.reason, contribution: employment.score * 0.25 },
//                 { name: 'Mobile Payment Pattern', score: mobile.score,     weight: 0.20, impact: getImpact(mobile.score),     reason: mobile.reason,     contribution: mobile.score     * 0.20 },
//             ]
//         } else {
//             // No data at all
//             factors = [
//                 { name: 'Transaction Regularity', score: 20, weight: 0.30, impact: 'negative', reason: 'No bank data available',     contribution: 6 },
//                 { name: 'Account Balance',        score: 20, weight: 0.25, impact: 'negative', reason: 'No account data available',  contribution: 5 },
//                 { name: 'Income Signals',         score: 20, weight: 0.25, impact: 'negative', reason: 'No income data available',   contribution: 5 },
//                 { name: 'Spending Health',        score: 20, weight: 0.20, impact: 'negative', reason: 'No spending data available', contribution: 4 },
//             ]
//         }
//
//         rawScore = factors.reduce((sum, f) => sum + f.contribution, 0)
//         rawScore = Math.round(300 + (rawScore / 100) * 450)
//
//     } else {
//         // Existing user — hybrid scoring
//         const repayment = priorRepaymentHistory ?? 50
//         factors = [
//             { name: 'Prior Loan Repayment',      score: repayment,        weight: 0.25, impact: getImpact(repayment),        reason: `${repayment}% on-time repayment history`, contribution: repayment        * 0.25 },
//             { name: 'Transaction Regularity',    score: regularity.score, weight: 0.20, impact: getImpact(regularity.score), reason: regularity.reason,                        contribution: regularity.score * 0.20 },
//             { name: 'Account Balance Stability', score: balance.score,    weight: 0.20, impact: getImpact(balance.score),    reason: balance.reason,                           contribution: balance.score    * 0.20 },
//             { name: 'Income Signals',            score: income.score,     weight: 0.20, impact: getImpact(income.score),     reason: income.reason,                            contribution: income.score     * 0.20 },
//             { name: 'Spending Health',           score: spending.score,   weight: 0.15, impact: getImpact(spending.score),   reason: spending.reason,                          contribution: spending.score   * 0.15 },
//         ]
//         rawScore = factors.reduce((sum, f) => sum + f.contribution, 0)
//         rawScore = Math.round(300 + (rawScore / 100) * 600)
//     }
//
//     const score = Math.min(isColdStart ? 750 : 900, Math.max(300, rawScore))
//
//     return {
//         score,
//         grade: getGrade(score),
//         isColdStart,
//         maxScore: isColdStart ? 750 : 900,
//         factors,
//         recommendation: getRecommendation(score, isColdStart, alternativeSignalsUsed),
//         riskLevel: getRiskLevel(score),
//         alternativeSignalsUsed,
//     }
// }


interface Transaction {
    amount: number
    date: string
    category: string
    merchant: string
}

interface Account {
    balance: number
    account_type: string
}

interface AlternativeSignals {
    rentPaymentsOnTime?: number
    utilityPaymentsOnTime?: number
    mobileRechargePattern?: 'monthly' | 'postpaid' | 'weekly' | 'irregular'
    employmentType?: string
    selfReportedIncome?: number
    hasOwnedPropertyBefore?: boolean
}

interface CreditInput {
    transactions: Transaction[]
    accounts: Account[]
    isColdStart: boolean
    hasExistingLoans?: boolean
    priorRepaymentHistory?: number   // 0-100, actual % of on-time repayments
    repaidLoansCount?: number        // number of fully repaid loans
    alternativeSignals?: AlternativeSignals
}

interface ScoreFactor {
    name: string
    score: number
    weight: number
    impact: 'positive' | 'neutral' | 'negative'
    reason: string
    contribution: number
}

interface CreditResult {
    score: number
    grade: string
    isColdStart: boolean
    maxScore: number
    factors: ScoreFactor[]
    recommendation: string
    riskLevel: string
    alternativeSignalsUsed: boolean
    repaymentBonus: number           // bonus points added for on-time repaid loans
    isReturningBorrower: boolean     // true if user has at least 1 fully repaid loan
}

// ── Helpers ───────────────────────────────────────────────────

function getImpact(score: number): 'positive' | 'neutral' | 'negative' {
    if (score >= 60) return 'positive'
    if (score >= 40) return 'neutral'
    return 'negative'
}

function analyzeTransactionRegularity(transactions: Transaction[]): { score: number; reason: string } {
    if (transactions.length === 0) return { score: 20, reason: 'No transaction history found' }

    const byMonth: Record<string, number> = {}
    transactions.forEach(t => {
        const month = t.date.slice(0, 7)
        byMonth[month] = (byMonth[month] || 0) + 1
    })

    const monthCounts = Object.values(byMonth)
    const avgPerMonth = monthCounts.reduce((a, b) => a + b, 0) / monthCounts.length
    const variance = monthCounts.reduce((sum, c) => sum + Math.pow(c - avgPerMonth, 2), 0) / monthCounts.length
    const consistency = Math.max(0, 100 - variance * 2)
    const score = Math.round(Math.min(100, (avgPerMonth / 20) * 60 + consistency * 0.4))

    let reason = ''
    if (score >= 80) reason = `Excellent: ${Math.round(avgPerMonth)} transactions/month consistently`
    else if (score >= 60) reason = `Good: ${Math.round(avgPerMonth)} transactions/month`
    else if (score >= 40) reason = `Fair: Irregular transaction patterns detected`
    else reason = `Low: Very few transactions (${Math.round(avgPerMonth)}/month)`

    return { score, reason }
}

function analyzeBalanceStability(accounts: Account[]): { score: number; reason: string } {
    if (accounts.length === 0) return { score: 20, reason: 'No account data available' }

    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    const avgBalance = totalBalance / accounts.length

    let score = 15
    if (avgBalance >= 50000) score = 100
    else if (avgBalance >= 25000) score = 85
    else if (avgBalance >= 10000) score = 70
    else if (avgBalance >= 5000) score = 55
    else if (avgBalance >= 1000) score = 35

    let reason = ''
    if (score >= 80) reason = `Strong balance: ₹${avgBalance.toLocaleString('en-IN')} average`
    else if (score >= 55) reason = `Moderate balance: ₹${avgBalance.toLocaleString('en-IN')} average`
    else reason = `Low balance: ₹${avgBalance.toLocaleString('en-IN')} — risk indicator`

    return { score, reason }
}

function analyzeIncomeSignals(transactions: Transaction[]): { score: number; reason: string } {
    const credits = transactions.filter(t => t.amount < 0)
    const debits = transactions.filter(t => t.amount > 0)

    if (credits.length === 0) return { score: 25, reason: 'No income credits detected in bank data' }

    const totalCredit = credits.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalDebit = debits.reduce((sum, t) => sum + t.amount, 0)
    const monthlyIncome = totalCredit / 3
    const savingsRate = totalCredit > 0 ? ((totalCredit - totalDebit) / totalCredit) * 100 : 0

    let score = 25
    if (monthlyIncome >= 50000) score = 95
    else if (monthlyIncome >= 30000) score = 80
    else if (monthlyIncome >= 15000) score = 65
    else if (monthlyIncome >= 8000) score = 45

    if (savingsRate > 30) score = Math.min(100, score + 10)
    else if (savingsRate < 0) score = Math.max(0, score - 15)

    return {
        score: Math.round(score),
        reason: `Monthly income: ₹${Math.round(monthlyIncome).toLocaleString('en-IN')}, savings rate: ${Math.round(savingsRate)}%`
    }
}

function analyzeSpendingHealth(transactions: Transaction[]): { score: number; reason: string } {
    if (transactions.length === 0) return { score: 30, reason: 'No spending data available' }

    const debits = transactions.filter(t => t.amount > 0)
    const luxuryCategories = ['Entertainment', 'Recreation', 'Restaurants']
    const luxury = debits.filter(t => luxuryCategories.some(c => t.category?.includes(c)))

    const totalSpend = debits.reduce((sum, t) => sum + t.amount, 0)
    const luxurySpend = luxury.reduce((sum, t) => sum + t.amount, 0)
    const luxuryRatio = totalSpend > 0 ? (luxurySpend / totalSpend) * 100 : 0

    let score = 25
    if (luxuryRatio < 10) score = 95
    else if (luxuryRatio < 20) score = 80
    else if (luxuryRatio < 30) score = 65
    else if (luxuryRatio < 40) score = 45

    let reason = `Discretionary spending: ${Math.round(luxuryRatio)}% of total`
    if (luxuryRatio < 20) reason += ' — healthy pattern'
    else if (luxuryRatio > 35) reason += ' — high discretionary, risk factor'

    return { score: Math.round(score), reason }
}

// ── Alternative Signal Analyzers ──────────────────────────────

function analyzeRentHistory(months: number): { score: number; reason: string } {
    let score = 20
    if (months >= 24) score = 95
    else if (months >= 12) score = 80
    else if (months >= 6) score = 60
    else if (months >= 3) score = 40

    return {
        score,
        reason: `${months} months of on-time rent payments — ${score >= 80 ? 'strong' : score >= 60 ? 'moderate' : 'limited'} payment discipline`
    }
}

function analyzeUtilityHistory(months: number): { score: number; reason: string } {
    let score = 15
    if (months >= 24) score = 90
    else if (months >= 12) score = 75
    else if (months >= 6) score = 55
    else if (months >= 3) score = 35

    return {
        score,
        reason: `${months} months of on-time utility payments — demonstrates consistent bill payment behavior`
    }
}

function analyzeMobilePattern(pattern: string): { score: number; reason: string } {
    const patterns: Record<string, { score: number; reason: string }> = {
        postpaid:  { score: 90, reason: 'Postpaid plan — stable income and payment commitment' },
        monthly:   { score: 75, reason: 'Regular monthly recharge — consistent financial behavior' },
        weekly:    { score: 50, reason: 'Weekly recharge — managed but limited cash flow' },
        irregular: { score: 25, reason: 'Irregular recharge pattern — inconsistent financial behavior' },
    }
    return patterns[pattern] ?? { score: 30, reason: 'Unknown mobile payment pattern' }
}

function analyzeEmploymentType(type: string): { score: number; reason: string } {
    const types: Record<string, { score: number; reason: string }> = {
        'Salaried':       { score: 90, reason: 'Salaried employment — stable, predictable income source' },
        'Business Owner': { score: 80, reason: 'Business owner — established income, higher variability' },
        'Self-Employed':  { score: 70, reason: 'Self-employed — income present but variable' },
        'Freelancer':     { score: 55, reason: 'Freelancer — irregular income, higher risk profile' },
    }
    return types[type] ?? { score: 40, reason: 'Employment type not verified' }
}

// ── Auto-extract from Plaid transactions ──────────────────────

export function extractAlternativeSignalsFromTransactions(
    transactions: Transaction[]
): AlternativeSignals {
    if (transactions.length === 0) return {}

    const rentKeywords = ['rent', 'landlord', 'housing', 'lease', 'apartment', 'flat']
    const rentTx = transactions.filter(t =>
        rentKeywords.some(k =>
            t.merchant?.toLowerCase().includes(k) ||
            t.category?.toLowerCase().includes(k)
        )
    )
    const rentMonthsOnTime = new Set(rentTx.map(t => t.date?.slice(0, 7))).size

    const utilityKeywords = [
        'electricity', 'electric', 'power', 'water', 'gas', 'utility',
        'bescom', 'tata power', 'adani', 'bses', 'msedcl', 'tneb',
        'internet', 'broadband', 'jio', 'airtel', 'bsnl', 'vodafone'
    ]
    const utilityTx = transactions.filter(t =>
        utilityKeywords.some(k =>
            t.merchant?.toLowerCase().includes(k) ||
            t.category?.toLowerCase().includes(k)
        )
    )
    const utilityMonthsOnTime = new Set(utilityTx.map(t => t.date?.slice(0, 7))).size

    const mobileKeywords = ['recharge', 'mobile', 'prepaid', 'jio', 'airtel', 'vi', 'bsnl', 'postpaid']
    const mobileTx = transactions.filter(t =>
        mobileKeywords.some(k => t.merchant?.toLowerCase().includes(k))
    )

    let mobileRechargePattern: AlternativeSignals['mobileRechargePattern'] = 'irregular'
    if (mobileTx.length > 0) {
        const avgAmount = mobileTx.reduce((s, t) => s + Math.abs(t.amount), 0) / mobileTx.length
        const byMonth = new Set(mobileTx.map(t => t.date?.slice(0, 7))).size
        if (avgAmount > 300 && byMonth >= 2) mobileRechargePattern = 'postpaid'
        else if (byMonth >= 2) mobileRechargePattern = 'monthly'
        else if (mobileTx.length >= 4) mobileRechargePattern = 'weekly'
    }

    const salaryKeywords = ['salary', 'sal credit', 'payroll', 'wages', 'employer']
    const hasSalary = transactions.some(t =>
        salaryKeywords.some(k => t.merchant?.toLowerCase().includes(k)) && t.amount < 0
    )
    const businessKeywords = ['gst', 'invoice', 'business', 'vendor', 'client']
    const hasBusiness = transactions.some(t =>
        businessKeywords.some(k => t.merchant?.toLowerCase().includes(k))
    )

    const employmentType = hasSalary ? 'Salaried' : hasBusiness ? 'Business Owner' : 'Self-Employed'

    return { rentPaymentsOnTime: rentMonthsOnTime, utilityPaymentsOnTime: utilityMonthsOnTime, mobileRechargePattern, employmentType }
}

// ── Grade / Risk / Recommendation ────────────────────────────

function getGrade(score: number): string {
    if (score >= 800) return 'Excellent'
    if (score >= 700) return 'Very Good'
    if (score >= 600) return 'Good'
    if (score >= 500) return 'Fair'
    return 'Poor'
}

function getRiskLevel(score: number): string {
    if (score >= 750) return 'Low Risk'
    if (score >= 650) return 'Medium Risk'
    if (score >= 550) return 'Medium-High Risk'
    return 'High Risk'
}

function getRecommendation(score: number, isColdStart: boolean, altUsed: boolean, isReturningBorrower: boolean): string {
    const note = altUsed ? ' (based on alternative financial signals)' : ''
    if (isReturningBorrower) {
        if (score >= 800) return '⭐ Returning borrower with excellent repayment track record. Eligible for premium loans at best rates.'
        if (score >= 700) return '✅ Returning borrower with strong repayment history. Eligible for all loan products at preferential rates.'
        if (score >= 600) return '✅ Returning borrower. Good repayment history noted. Eligible for standard loan products.'
        return 'Returning borrower with fair profile. Eligible for basic loan products.'
    }
    if (isColdStart) {
        if (score >= 650) return `Cold start profile shows strong financial behavior${note}. Eligible for loans up to ₹5,00,000.`
        if (score >= 550) return `Moderate cold start profile${note}. Eligible for loans up to ₹2,00,000 with standard rates.`
        return `Limited financial signals${note}. Consider a smaller loan to build credit history.`
    }
    if (score >= 750) return 'Excellent credit profile. Eligible for premium loan products at best rates.'
    if (score >= 650) return 'Good credit profile. Eligible for most loan products at standard rates.'
    return 'Fair credit. Eligible for basic loan products. Consider building credit history.'
}

// ── Main scoring function ─────────────────────────────────────

export function calculateCreditScore(input: CreditInput): CreditResult {
    const { transactions, accounts, isColdStart, priorRepaymentHistory, repaidLoansCount, alternativeSignals } = input
    const isReturningBorrower = (repaidLoansCount ?? 0) > 0

    // Determine data availability — defined at top level so accessible everywhere
    const hasPlaidData: boolean = transactions.length > 0 || accounts.length > 0
    const hasAltSignals: boolean = !!(
        alternativeSignals && (
            (alternativeSignals.rentPaymentsOnTime ?? 0) > 0 ||
            (alternativeSignals.utilityPaymentsOnTime ?? 0) > 0 ||
            !!alternativeSignals.mobileRechargePattern ||
            !!alternativeSignals.employmentType
        )
    )
    const alternativeSignalsUsed: boolean = isColdStart && hasAltSignals && !hasPlaidData

    const regularity = analyzeTransactionRegularity(transactions)
    const balance    = analyzeBalanceStability(accounts)
    const income     = analyzeIncomeSignals(transactions)
    const spending   = analyzeSpendingHealth(transactions)

    let factors: ScoreFactor[]
    let rawScore: number

    if (isColdStart) {
        if (hasPlaidData) {
            // Cold start WITH Plaid bank data
            factors = [
                { name: 'Transaction Regularity',    score: regularity.score, weight: 0.30, impact: getImpact(regularity.score), reason: regularity.reason, contribution: regularity.score * 0.30 },
                { name: 'Account Balance Stability', score: balance.score,    weight: 0.25, impact: getImpact(balance.score),    reason: balance.reason,    contribution: balance.score    * 0.25 },
                { name: 'Income Signals',            score: income.score,     weight: 0.25, impact: getImpact(income.score),     reason: income.reason,     contribution: income.score     * 0.25 },
                { name: 'Spending Health',           score: spending.score,   weight: 0.20, impact: getImpact(spending.score),   reason: spending.reason,   contribution: spending.score   * 0.20 },
            ]
        } else if (hasAltSignals && alternativeSignals) {
            // Cold start WITHOUT bank data — use auto-extracted alternative signals
            const rent       = analyzeRentHistory(alternativeSignals.rentPaymentsOnTime ?? 0)
            const utility    = analyzeUtilityHistory(alternativeSignals.utilityPaymentsOnTime ?? 0)
            const mobile     = analyzeMobilePattern(alternativeSignals.mobileRechargePattern ?? 'irregular')
            const employment = analyzeEmploymentType(alternativeSignals.employmentType ?? '')

            factors = [
                { name: 'Rent Payment History',   score: rent.score,       weight: 0.30, impact: getImpact(rent.score),       reason: rent.reason,       contribution: rent.score       * 0.30 },
                { name: 'Utility Bill Payments',  score: utility.score,    weight: 0.25, impact: getImpact(utility.score),    reason: utility.reason,    contribution: utility.score    * 0.25 },
                { name: 'Employment Stability',   score: employment.score, weight: 0.25, impact: getImpact(employment.score), reason: employment.reason, contribution: employment.score * 0.25 },
                { name: 'Mobile Payment Pattern', score: mobile.score,     weight: 0.20, impact: getImpact(mobile.score),     reason: mobile.reason,     contribution: mobile.score     * 0.20 },
            ]
        } else {
            // No data at all
            factors = [
                { name: 'Transaction Regularity', score: 20, weight: 0.30, impact: 'negative', reason: 'No bank data available',     contribution: 6 },
                { name: 'Account Balance',        score: 20, weight: 0.25, impact: 'negative', reason: 'No account data available',  contribution: 5 },
                { name: 'Income Signals',         score: 20, weight: 0.25, impact: 'negative', reason: 'No income data available',   contribution: 5 },
                { name: 'Spending Health',        score: 20, weight: 0.20, impact: 'negative', reason: 'No spending data available', contribution: 4 },
            ]
        }

        rawScore = factors.reduce((sum, f) => sum + f.contribution, 0)
        rawScore = Math.round(300 + (rawScore / 100) * 450)

    } else {
        // Existing user — hybrid scoring with actual repayment data
        const repayment = priorRepaymentHistory ?? 50

        // Repayment track record score: based on count of fully repaid loans
        // 1 repaid loan → 80, 2 → 90, 3+ → 100
        const repaidCount  = repaidLoansCount ?? 0
        const trackRecord  = repaidCount >= 3 ? 100 : repaidCount === 2 ? 90 : repaidCount === 1 ? 80 : 50
        const trackReason  = repaidCount > 0
            ? `${repaidCount} loan${repaidCount > 1 ? 's' : ''} fully repaid on time — strong repayment track record`
            : 'No completed loans yet — using estimated repayment history'

        factors = [
            { name: 'Repayment Track Record',    score: trackRecord,      weight: 0.30, impact: getImpact(trackRecord),      reason: trackReason,                              contribution: trackRecord      * 0.30 },
            { name: 'Prior Loan Repayment',      score: repayment,        weight: 0.15, impact: getImpact(repayment),        reason: `${repayment}% on-time repayment history`, contribution: repayment        * 0.15 },
            { name: 'Transaction Regularity',    score: regularity.score, weight: 0.20, impact: getImpact(regularity.score), reason: regularity.reason,                        contribution: regularity.score * 0.20 },
            { name: 'Account Balance Stability', score: balance.score,    weight: 0.15, impact: getImpact(balance.score),    reason: balance.reason,                           contribution: balance.score    * 0.15 },
            { name: 'Income Signals',            score: income.score,     weight: 0.12, impact: getImpact(income.score),     reason: income.reason,                            contribution: income.score     * 0.12 },
            { name: 'Spending Health',           score: spending.score,   weight: 0.08, impact: getImpact(spending.score),   reason: spending.reason,                          contribution: spending.score   * 0.08 },
        ]
        rawScore = factors.reduce((sum, f) => sum + f.contribution, 0)
        rawScore = Math.round(300 + (rawScore / 100) * 600)
    }

    // Repayment bonus: flat points added on top for proven repayers
    // 1 loan repaid → +20pts, 2 → +35pts, 3+ → +50pts
    const repaidCount    = repaidLoansCount ?? 0
    const repaymentBonus = isReturningBorrower
        ? repaidCount >= 3 ? 50 : repaidCount === 2 ? 35 : 20
        : 0

    // Score cap:
    // Cold start (first timer, never repaid) → max 750
    // Existing user (approved but not yet repaid) → max 850
    // Returning borrower (at least 1 fully repaid) → max 900 + bonus
    const maxRaw = isReturningBorrower ? 900 : isColdStart ? 750 : 850
    const score  = Math.min(maxRaw, Math.max(300, rawScore)) + repaymentBonus

    return {
        score: Math.min(950, score),   // absolute ceiling 950
        grade: getGrade(score),
        isColdStart,
        maxScore: isReturningBorrower ? 950 : isColdStart ? 750 : 850,
        factors,
        recommendation: getRecommendation(score, isColdStart, alternativeSignalsUsed, isReturningBorrower),
        riskLevel: getRiskLevel(score),
        alternativeSignalsUsed,
        repaymentBonus,
        isReturningBorrower,
    }
}