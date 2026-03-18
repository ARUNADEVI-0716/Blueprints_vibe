// routes/fraud.ts
import { Router } from 'express'
import { verifyToken, AuthRequest, supabaseAdmin } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { Response } from 'express'
import { runFraudCheck } from '../services/fraudEngine'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ── Run fraud check for an application ──────────────────────
async function performFraudCheck(applicationId: string) {
    const { data: app } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (!app) throw new Error('Application not found')

    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, date, merchant, category')
        .eq('user_id', app.user_id)
        .order('date', { ascending: false })
        .limit(90)

    const { data: panMatches } = await supabase
        .from('loan_applications')
        .select('id, full_name')
        .eq('pan_number', app.pan_number)
        .neq('id', applicationId)
        .not('pan_number', 'is', null)

    const { data: aadhaarMatches } = await supabase
        .from('loan_applications')
        .select('id')
        .eq('aadhaar_number', app.aadhaar_number)
        .neq('id', applicationId)
        .not('aadhaar_number', 'is', null)

    const result = runFraudCheck({
        panNumber:                   app.pan_number,
        aadhaarNumber:               app.aadhaar_number,
        transactions:                transactions || [],
        monthlyIncomeDeclared:       app.monthly_income || 0,
        existingPanApplications:     panMatches?.length ?? 0,
        existingAadhaarApplications: aadhaarMatches?.length ?? 0,
        existingNamesForPan:         panMatches?.map((m: any) => m.full_name).filter(Boolean),
        fullName:                    app.full_name,
    })

    await supabase
        .from('loan_applications')
        .update({
            fraud_risk_score: result.riskScore,
            fraud_risk_level: result.riskLevel,
            fraud_flags:      result.flags,
            fraud_blocked:    result.blocked,
            fraud_checked_at: new Date().toISOString()
        })
        .eq('id', applicationId)

    return result
}

// ── Applicant: run fraud check on their own application ──────
router.post('/check/:applicationId', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { applicationId } = req.params

        const { data: app } = await supabase
            .from('loan_applications')
            .select('id')
            .eq('id', applicationId)
            .eq('user_id', req.userId)
            .single()

        if (!app) return res.status(404).json({ error: 'Application not found' })

        const result = await performFraudCheck(applicationId)

        if (result.blocked) {
            return res.status(403).json({
                error: 'Application flagged for fraud review',
                blocked: true,
                riskLevel: result.riskLevel,
                message: 'Your application has been flagged for manual review. Our team will contact you.'
            })
        }

        res.json({ success: true, riskLevel: result.riskLevel, riskScore: result.riskScore })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ── Officer: get fraud report for any application ────────────
router.get('/report/:applicationId', async (req, res) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

    try {
        const token = auth.split(' ')[1]
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

        if (error || !user) return res.status(401).json({ error: 'Invalid token' })
        if (user.email !== process.env.OFFICER_EMAIL) {
            return res.status(403).json({ error: 'Not an officer account' })
        }

        const { applicationId } = req.params
        const result = await performFraudCheck(applicationId)
        res.json(result)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export { performFraudCheck }
export default router