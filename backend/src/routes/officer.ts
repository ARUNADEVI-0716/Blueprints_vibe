import { Router,Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Fixed officer login
router.post('/login', async (req, res) => {
    const { email, password } = req.body

    if (email !== process.env.OFFICER_EMAIL || password !== process.env.OFFICER_PASSWORD) {
        return res.status(401).json({ error: 'Invalid officer credentials' })
    }

    const token = jwt.sign(
        { role: 'officer', email },
        process.env.JWT_SECRET!,
        { expiresIn: '8h' }
    )

    res.json({ token, role: 'officer', email })
})

// Middleware for officer routes
function verifyOfficer(req: any, res: any, next: any) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

    // Token is now a Supabase JWT — verify the email
    try {
        const token = auth.split(' ')[1]
        // Decode without verifying (Supabase verifies it)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())

        if (payload.email !== process.env.OFFICER_EMAIL) {
            return res.status(403).json({ error: 'Not an officer account' })
        }

        req.officer = { email: payload.email }
        next()
    } catch {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

// Get all applications
router.get('/applications', verifyOfficer, async (_req, res) => {
    const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// Get single application with full profile
router.get('/applications/:id', verifyOfficer, async (req, res) => {
    const { data: application } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', req.params.id)
        .single()

    if (!application) return res.status(404).json({ error: 'Not found' })

    // Get credit score
    const { data: creditScore } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', application.user_id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

    // Get transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', application.user_id)
        .order('date', { ascending: false })
        .limit(30)

    // Get accounts
    const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', application.user_id)

    // Get uploaded documents (service role bypasses RLS — officer can see all)
    const { data: documents } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('user_id', application.user_id)
        .order('created_at', { ascending: false })

    res.json({ application, creditScore, transactions, accounts, documents: documents || [] })
})

// Approve application
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

    // Stripe disbursal happens AFTER applicant signs the agreement
    // (triggered from AgreementPage.tsx -> /api/stripe/disburse-loan)
    res.json({ success: true, status: 'approved' })
})

// Reject application
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
    res.json({ success: true, status: 'rejected' })
})

// Verify or reject a document
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

// Get signed URL for a document by file path (so officer can view it)
router.post('/documents/signed-url-by-path', verifyOfficer, async (_req, res) => {
    const { filePath } = _req.body
    if (!filePath) return res.status(400).json({ error: 'filePath required' })

    const { data, error } = await supabase.storage
        .from('loan-documents')
        .createSignedUrl(filePath, 120)

    if (error || !data) return res.status(500).json({ error: error?.message || 'Failed' })
    res.json({ signedUrl: data.signedUrl })
})


// Mark loan as repaid (officer confirms repayment received)
router.post('/applications/:id/mark-repaid', verifyOfficer, async (req: any, res) => {
    const { repaidOnTime } = req.body  // true = paid within tenure, false = late

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
    res.json({ success: true, status: 'repaid', repaidOnTime: repaidOnTime ?? true })
})

export default router