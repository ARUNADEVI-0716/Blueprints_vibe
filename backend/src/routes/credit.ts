import { Router, Response } from 'express'
import { verifyToken, AuthRequest, supabaseAdmin, userDb } from '../middleware/auth'
import { calculateCreditScore, extractAlternativeSignalsFromTransactions } from '../services/creditEngine'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()

// supabaseAdmin and userDb imported from auth middleware

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

// ── Feature extraction from Plaid bank data ───────────────────

function extractFeatures(
    txList: any[],
    accList: any[],
    repaidLoans: any[],
    approvedLoans: any[],
    employmentType?: string
) {
    // Transaction volume per month
    const byMonth: Record<string, number>  = {}
    const creditsByMonth: Record<string, number> = {}

    txList.forEach(t => {
        const month = t.date?.slice(0, 7)
        if (!month) return
        byMonth[month] = (byMonth[month] || 0) + 1
        if (t.amount < 0)
            creditsByMonth[month] = (creditsByMonth[month] || 0) + Math.abs(t.amount)
    })

    const months        = Math.max(Object.keys(byMonth).length, 1)
    const monthCounts   = Object.values(byMonth)
    const avgTx         = monthCounts.reduce((a, b) => a + b, 0) / monthCounts.length
    const variance      = monthCounts.reduce((s, v) => s + Math.pow(v - avgTx, 2), 0) / monthCounts.length
    const txConsistency = Math.max(0, 1 - Math.sqrt(variance) / Math.max(avgTx, 1))

    // Balance and income
    const avgBalance       = accList.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0)
    const creditVals       = Object.values(creditsByMonth)
    const incomeMonthly    = creditVals.length > 0
        ? creditVals.reduce((a, b) => a + b, 0) / creditVals.length
        : 0

    // Savings rate
    const totalCredits = txList.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    const totalDebits  = txList.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const savingsRate  = totalCredits > 0
        ? Math.min(1, Math.max(-1, (totalCredits - totalDebits) / totalCredits))
        : 0

    // Luxury spend ratio
    const luxuryKeywords = ['entertainment', 'food and drink', 'shopping', 'travel', 'recreation']
    const luxurySpend    = txList
        .filter(t => t.amount > 0 && luxuryKeywords.some(k => t.category?.toLowerCase().includes(k)))
        .reduce((s, t) => s + t.amount, 0)
    const luxuryRatio    = totalDebits > 0 ? Math.min(1, luxurySpend / totalDebits) : 0.2

    // Alternative signals — real or sandbox-simulated
    let rentPayments = 0, utilityPayments = 0
    const rawSignals = txList.length > 0
        ? extractAlternativeSignalsFromTransactions(txList) : null
    if (rawSignals && ((rawSignals.rentPaymentsOnTime ?? 0) > 0 || (rawSignals.utilityPaymentsOnTime ?? 0) > 0)) {
        rentPayments    = rawSignals.rentPaymentsOnTime    ?? 0
        utilityPayments = rawSignals.utilityPaymentsOnTime ?? 0
    } else {
        // Sandbox fallback: derive from transaction regularity
        rentPayments    = Math.min(months, 12)
        utilityPayments = Math.min(months - 1, 10)
    }

    // Repayment history
    const repaidLoansCount  = repaidLoans.length
    const repaidOnTime      = repaidLoans.filter((l: any) => l.repaid_on_time === true).length
    const priorRepaymentPct = repaidLoansCount > 0 ? repaidOnTime / repaidLoansCount : 0

    const isColdStart = approvedLoans.length === 0

    return {
        avg_monthly_transactions:  parseFloat((txList.length / months).toFixed(4)),
        transaction_consistency:   parseFloat(txConsistency.toFixed(4)),
        avg_balance:               parseFloat(avgBalance.toFixed(2)),
        income_credit_monthly:     parseFloat(incomeMonthly.toFixed(2)),
        savings_rate:              parseFloat(savingsRate.toFixed(4)),
        luxury_spend_ratio:        parseFloat(luxuryRatio.toFixed(4)),
        months_of_data:            months,
        rent_payments_on_time:     rentPayments,
        utility_payments_on_time:  utilityPayments,
        repaid_loans_count:        repaidLoansCount,
        prior_repayment_pct:       parseFloat(priorRepaymentPct.toFixed(4)),
        employment_type:           employmentType || 'Other',
        is_cold_start:             isColdStart,
        // Meta — saved with breakdown but NOT sent to ML service
        _meta: {
            totalTransactions:  txList.length,
            totalAccounts:      accList.length,
            totalBalance:       avgBalance,
            approvedLoansCount: approvedLoans.length,
            repaidLoansCount,
            repaidOnTime,
        }
    }
}

// ── Call XGBoost Python service ───────────────────────────────

async function callMLService(features: Record<string, any>): Promise<any> {
    const { _meta, ...mlFeatures } = features
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(mlFeatures),
        signal:  AbortSignal.timeout(5000)
    })
    if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as Record<string, any>
        throw new Error(errBody.detail || `ML service error ${response.status}`)
    }
    return response.json()
}

// ── Fallback: rule-based engine (when ML service is offline) ──

function runFallback(
    txList: any[], accList: any[],
    isColdStart: boolean, hasExistingLoans: boolean,
    repaidLoansCount: number, priorRepaymentPct: number
) {
    const altSignals = txList.length > 0
        ? extractAlternativeSignalsFromTransactions(txList) : undefined

    return calculateCreditScore({
        transactions:          txList,
        accounts:              accList,
        isColdStart,
        hasExistingLoans,
        priorRepaymentHistory: repaidLoansCount > 0
            ? Math.round(priorRepaymentPct * 100)
            : hasExistingLoans ? 75 : undefined,
        repaidLoansCount,
        alternativeSignals:    altSignals
    })
}

// ── POST /api/credit/calculate ────────────────────────────────

router.post('/calculate', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const db = userDb(req.userToken!)

        const [
            { data: accounts },
            { data: transactions },
            { data: allLoans }
        ] = await Promise.all([
            db.from('bank_accounts').select('*').eq('user_id', req.userId),
            db.from('transactions').select('*').eq('user_id', req.userId)
                .order('date', { ascending: false }).limit(90),
            db.from('loan_applications')
                .select('id, status, repaid_on_time, repaid_at, employment_type')
                .eq('user_id', req.userId)
                .in('status', ['approved', 'repaid'])
        ])

        const txList        = transactions || []
        const accList       = accounts    || []
        const approvedLoans = (allLoans || []).filter((l: any) =>
            l.status === 'approved' || l.status === 'repaid')
        const repaidLoans   = (allLoans || []).filter((l: any) => l.status === 'repaid')
        const latestEmp     = allLoans?.[0]?.employment_type || req.body?.employmentType

        const features = extractFeatures(txList, accList, repaidLoans, approvedLoans, latestEmp)

        // ── Try XGBoost, fall back to rule engine ─────────────
        let result: any
        let modelUsed: 'xgboost' | 'rule-based' = 'xgboost'

        try {
            result    = await callMLService(features)
            result.model = 'XGBoost'
            console.log(`✅ XGBoost → score: ${result.score}, p(repay): ${result.repaymentProbability}`)
        } catch (mlErr: any) {
            console.warn(`⚠️  ML service offline (${mlErr.message}) — using rule-based fallback`)
            modelUsed = 'rule-based'
            const fb  = runFallback(
                txList, accList,
                features.is_cold_start,
                approvedLoans.length > 0,
                features.repaid_loans_count,
                features.prior_repayment_pct
            )
            result = Object.assign({}, fb, { model: 'rule-based (ML service offline)' })
        }

        // ── Persist to Supabase ───────────────────────────────
        // Build insert — only include columns that definitely exist in the schema.
        // is_returning_borrower and repayment_bonus are stored inside breakdown JSON
        // to avoid schema cache errors on fresh installs.
        const insertPayload: Record<string, any> = {
            user_id:      req.userId,
            score:        result.score,
            grade:        result.grade,
            is_cold_start: result.isColdStart ?? features.is_cold_start,
            breakdown:    Object.assign({}, result as Record<string, any>, {
                features,
                modelUsed,
                isReturningBorrower: result.isReturningBorrower ?? (features.repaid_loans_count > 0),
                repaymentBonus:      result.repaymentBonus ?? 0,
                extractedAt:         new Date().toISOString(),
            })
        }

        const { error: dbErr } = await supabaseAdmin
            .from('credit_scores')
            .insert([insertPayload])

        if (dbErr) throw dbErr

        res.json(Object.assign({}, result, { modelUsed, featureSummary: features._meta }))

    } catch (err: any) {
        console.error('Credit calc error:', err)
        res.status(500).json({ error: err.message })
    }
})

// ── GET /api/credit/latest ────────────────────────────────────

router.get('/latest', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const db = userDb(req.userToken!)
        const { data } = await db
            .from('credit_scores')
            .select('*')
            .eq('user_id', req.userId)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single()
        res.json(data || null)
    } catch {
        res.json(null)
    }
})

// ── GET /api/credit/ml-health ─────────────────────────────────

router.get('/ml-health', async (_req, res: Response) => {
    try {
        const r    = await fetch(`${ML_SERVICE_URL}/health`, { signal: AbortSignal.timeout(3000) })
        const data = await r.json()
        res.json(Object.assign({ online: true }, data as Record<string, any>))
    } catch {
        res.json({ online: false, message: 'ML service unreachable — rule-based engine is active' })
    }
})


// ── POST /api/credit/calculate-internal ──────────────────────
// Called by repayment.ts after loan fully repaid (no JWT needed,
// uses x-internal-user-id header instead)

router.post('/calculate-internal', async (req: any, res: Response) => {
    const userId = req.headers['x-internal-user-id'] as string
    if (!userId) return res.status(400).json({ error: 'Missing x-internal-user-id' })

    // Trust only internal calls (same process / loopback)
    const origin = req.headers['origin'] || req.headers['host'] || ''
    const isLoopback = req.socket?.remoteAddress === '127.0.0.1' ||
        req.socket?.remoteAddress === '::1' ||
        req.socket?.remoteAddress === '::ffff:127.0.0.1'
    if (!isLoopback && !process.env.ALLOW_INTERNAL_CALLS) {
        return res.status(403).json({ error: 'Internal endpoint — localhost only' })
    }

    try {
        const [
            { data: accounts },
            { data: transactions },
            { data: allLoans }
        ] = await Promise.all([
            supabaseAdmin.from('bank_accounts').select('*').eq('user_id', userId),
            supabaseAdmin.from('transactions').select('*').eq('user_id', userId)
                .order('date', { ascending: false }).limit(90),
            supabaseAdmin.from('loan_applications')
                .select('id, status, repaid_on_time, repaid_at, employment_type')
                .eq('user_id', userId)
                .in('status', ['approved', 'repaid'])
        ])

        const txList        = transactions || []
        const accList       = accounts    || []
        const approvedLoans = (allLoans || []).filter((l: any) =>
            l.status === 'approved' || l.status === 'repaid')
        const repaidLoans   = (allLoans || []).filter((l: any) => l.status === 'repaid')
        const latestEmp     = allLoans?.[0]?.employment_type

        const features = extractFeatures(txList, accList, repaidLoans, approvedLoans, latestEmp)

        let result: any
        let modelUsed: 'xgboost' | 'rule-based' = 'xgboost'

        try {
            result       = await callMLService(features)
            result.model = 'XGBoost'
        } catch {
            modelUsed = 'rule-based'
            const fb  = runFallback(
                txList, accList,
                features.is_cold_start,
                approvedLoans.length > 0,
                features.repaid_loans_count,
                features.prior_repayment_pct
            )
            result = Object.assign({}, fb, { model: 'rule-based (ML service offline)' })
        }

        await supabaseAdmin.from('credit_scores').insert([{
            user_id:      userId,
            score:        result.score,
            grade:        result.grade,
            is_cold_start: result.isColdStart ?? features.is_cold_start,
            breakdown:    Object.assign({}, result as Record<string, any>, {
                features,
                modelUsed,
                isReturningBorrower: result.isReturningBorrower ?? (features.repaid_loans_count > 0),
                repaymentBonus:      result.repaymentBonus ?? 0,
                triggeredBy:         'loan_repayment',
                extractedAt:         new Date().toISOString(),
            })
        }])

        console.log(`✅ Internal recalc for ${userId}: score=${result.score} (${modelUsed})`)
        res.json({ success: true, score: result.score, grade: result.grade })

    } catch (err: any) {
        console.error('Internal credit calc error:', err)
        res.status(500).json({ error: err.message })
    }
})

export default router