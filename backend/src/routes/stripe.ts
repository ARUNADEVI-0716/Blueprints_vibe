import { createLoanPayout, confirmTestPayment } from '../services/stripeService'
import { createClient } from '@supabase/supabase-js'
import { Router,Request, Response, NextFunction } from 'express'
const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

router.post('/disburse-loan', async (req, res) => {
    try {
        const { applicationId } = req.body

        const { data: application, error } = await supabase
            .from('loan_applications')
            .select('*')
            .eq('id', applicationId)
            .single()

        if (error || !application) {
            return res.status(404).json({ error: 'Application not found' })
        }

        // Create Stripe payment
        const payout = await createLoanPayout({
            amount: application.amount,
            applicantEmail: application.email,
            loanApplicationId: applicationId,
            applicantName: application.full_name
        })

        // Confirm immediately in sandbox (test mode)
        await confirmTestPayment(payout.paymentIntentId)

        // Update application with payment info
        await supabase
            .from('loan_applications')
            .update({
                stripe_payment_id: payout.paymentIntentId,
                stripe_payout_status: 'disbursed',
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId)

        res.json({
            success: true,
            paymentId: payout.paymentIntentId,
            amount: application.amount,
            message: 'Loan disbursed successfully'
        })
    } catch (err: any) {
        console.error('Stripe error:', err)
        res.status(500).json({ error: err.message })
    }
})

export default router