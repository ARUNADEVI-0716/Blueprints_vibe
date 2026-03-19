import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../middleware/auth'
import { sendApprovalEmail, sendRejectionEmail } from '../services/emailService'

const router = Router()

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Officer auth middleware ────────────────────────────────────
async function verifyOfficer(req: any, res: any, next: any) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const token = auth.split(' ')[1]

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' })
        }

        if (user.email !== process.env.OFFICER_EMAIL) {
            return res.status(403).json({ error: 'Not an officer account' })
        }

        req.officer = { email: user.email, id: user.id }
        next()
    } catch {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

// ── 🔥 RESET TOTP (FIX FOR AAL ERROR) ──────────────────────────
router.post('/reset-totp', verifyOfficer, async (req: any, res) => {
    try {
        const userId = req.officer.id

        // Get all MFA factors
        const { data: factorsData, error: listError } =
            await supabaseAdmin.auth.admin.mfa.listFactors({
                userId
            })

        if (listError) throw listError

        const factors = factorsData?.factors || []

        const totpFactors = factors.filter(
            (f: any) => f.factor_type === 'totp'
        )

        let deletedCount = 0

        for (const factor of totpFactors) {
            const { error: deleteError } =
                await supabaseAdmin.auth.admin.mfa.deleteFactor({
                    userId,
                    id: factor.id
                })

            if (!deleteError) {
                deletedCount++
            } else {
                console.error('Failed to delete factor:', factor.id, deleteError)
            }
        }

        res.json({
            success: true,
            message: 'TOTP reset successful',
            deleted: deletedCount
        })
    } catch (err: any) {
        console.error('Reset TOTP error:', err)
        res.status(500).json({ error: err.message })
    }
})

// ── Get all applications ──────────────────────────────────────
router.get('/applications', verifyOfficer, async (_req, res) => {
    const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    res.json(data)
})

// ── Get single application with full profile ──────────────────
router.get('/applications/:id', verifyOfficer, async (req, res) => {
    const { data: application } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', req.params.id)
        .single()

    if (!application) {
        return res.status(404).json({ error: 'Not found' })
    }

    const { data: creditScore } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', application.user_id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', application.user_id)
        .order('date', { ascending: false })
        .limit(30)

    const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', application.user_id)

    const { data: documents } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('user_id', application.user_id)
        .order('created_at', { ascending: false })

    res.json({
        application,
        creditScore,
        transactions,
        accounts,
        documents: documents || []
    })
})

// ── Approve application ───────────────────────────────────────
router.post('/applications/:id/approve', verifyOfficer, async (req: any, res) => {
    const { notes } = req.body

    const { error } = await supabase
        .from('loan_applications')
        .update({
            status: 'approved',
            officer_id: req.officer.email,
            officer_notes: notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)

    if (error) return res.status(500).json({ error: error.message })

    // Trigger Stripe payout
    await fetch(`http://localhost:${process.env.PORT || 3001}/api/stripe/disburse-loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: req.params.id })
    })

    // Send approval email
    const { data: app } = await supabase
        .from('loan_applications')
        .select('email, full_name, amount')
        .eq('id', req.params.id)
        .single()

    if (app) {
        try {
            await sendApprovalEmail(app.email, app.full_name, app.amount)
        } catch (e) {
            console.warn('Approval email failed:', e)
        }
    }

    res.json({ success: true, status: 'approved' })
})

// ── Reject application ────────────────────────────────────────
router.post('/applications/:id/reject', verifyOfficer, async (req: any, res) => {
    const { notes } = req.body

    const { error } = await supabase
        .from('loan_applications')
        .update({
            status: 'rejected',
            officer_id: req.officer.email,
            officer_notes: notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)

    if (error) return res.status(500).json({ error: error.message })

    const { data: app } = await supabase
        .from('loan_applications')
        .select('email, full_name')
        .eq('id', req.params.id)
        .single()

    if (app) {
        try {
            await sendRejectionEmail(app.email, app.full_name, notes)
        } catch (e) {
            console.warn('Rejection email failed:', e)
        }
    }

    res.json({ success: true, status: 'rejected' })
})

// ── Verify or reject a document ───────────────────────────────
router.patch('/documents/:docId', verifyOfficer, async (req: any, res) => {
    const { verified, rejectionReason } = req.body

    const { error } = await supabase
        .from('loan_documents')
        .update({
            verified,
            verified_by: req.officer.email,
            verified_at: new Date().toISOString(),
            rejection_reason: rejectionReason || null
        })
        .eq('id', req.params.docId)

    if (error) return res.status(500).json({ error: error.message })

    res.json({ success: true })
})

// ── Get signed URL ────────────────────────────────────────────
router.post('/documents/signed-url-by-path', verifyOfficer, async (req, res) => {
    const { filePath } = req.body

    if (!filePath) {
        return res.status(400).json({ error: 'filePath required' })
    }

    const { data, error } = await supabase.storage
        .from('loan-documents')
        .createSignedUrl(filePath, 120)

    if (error || !data) {
        return res.status(500).json({ error: error?.message || 'Failed' })
    }

    res.json({ signedUrl: data.signedUrl })
})

// ── Mark loan as repaid ───────────────────────────────────────
router.post('/applications/:id/mark-repaid', verifyOfficer, async (req: any, res) => {
    const { repaidOnTime } = req.body

    const { error } = await supabase
        .from('loan_applications')
        .update({
            status: 'repaid',
            repaid_on_time: repaidOnTime ?? true,
            repaid_at: new Date().toISOString(),
            officer_id: req.officer.email,
            updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)

    if (error) return res.status(500).json({ error: error.message })

    res.json({
        success: true,
        status: 'repaid',
        repaidOnTime: repaidOnTime ?? true
    })
})

export default router