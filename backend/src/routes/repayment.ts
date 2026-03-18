// // routes/repayment.ts
// import { Router } from 'express'
// import { verifyToken, AuthRequest } from '../middleware/auth'
// import { createClient } from '@supabase/supabase-js'
// import { Response } from 'express'
//
// const router = Router()
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
//
// // ── Helpers ──────────────────────────────────────────────────
//
// function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
//     const r = annualRate / 12 / 100
//     if (r === 0) return Math.round(principal / tenureMonths)
//     const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
//     return Math.round(emi)
// }
//
// function getInterestRate(creditGrade: string): number {
//     const rates: Record<string, number> = {
//         'Excellent': 10.5, 'Very Good': 11.5, 'Good': 13.5, 'Fair': 16.0, 'Poor': 18.5
//     }
//     return rates[creditGrade] ?? 16.0
// }
//
// // ── GET schedule for an application ─────────────────────────
// router.get('/schedule/:applicationId', verifyToken, async (req: AuthRequest, res: Response) => {
//     try {
//         const { data: app, error } = await supabase
//             .from('loan_applications')
//             .select('*')
//             .eq('id', req.params.applicationId)
//             .eq('user_id', req.userId)
//             .single()
//
//         if (error || !app) return res.status(404).json({ error: 'Application not found' })
//         if (app.status !== 'approved' && app.status !== 'repaid') {
//             return res.status(400).json({ error: 'Loan is not active' })
//         }
//
//         // Fetch payments made so far
//         const { data: payments } = await supabase
//             .from('emi_payments')
//             .select('*')
//             .eq('application_id', req.params.applicationId)
//             .order('paid_at', { ascending: true })
//
//         const creditGrade   = app.score_breakdown?.grade || 'Fair'
//         const annualRate    = getInterestRate(creditGrade)
//         const emi           = calculateEMI(app.amount, annualRate, app.tenure)
//         const totalPayable  = emi * app.tenure
//         const totalPaid     = (payments || []).reduce((s: number, p: any) => s + p.amount, 0)
//         const paidEMIs      = (payments || []).length
//         const remainingEMIs = Math.max(0, app.tenure - paidEMIs)
//         const outstanding   = Math.max(0, totalPayable - totalPaid)
//         const nextDueDate   = getNextDueDate(app.approved_at || app.created_at, paidEMIs)
//
//         // Build full EMI schedule
//         const schedule = []
//         let balance = app.amount
//         for (let i = 1; i <= app.tenure; i++) {
//             const interest  = Math.round(balance * annualRate / 12 / 100)
//             const principal = emi - interest
//             balance = Math.max(0, balance - principal)
//             const payment   = (payments || []).find((p: any) => p.emi_number === i)
//             schedule.push({
//                 emiNumber:   i,
//                 amount:      emi,
//                 principal:   principal,
//                 interest:    interest,
//                 balance:     balance,
//                 dueDate:     getDueDate(app.approved_at || app.created_at, i),
//                 paid:        !!payment,
//                 paidAt:      payment?.paid_at || null,
//                 paymentId:   payment?.id || null,
//                 late:        payment?.late || false,
//             })
//         }
//
//         res.json({
//             applicationId:  app.id,
//             loanAmount:     app.amount,
//             annualRate,
//             emi,
//             tenure:         app.tenure,
//             totalPayable,
//             totalPaid,
//             outstanding,
//             paidEMIs,
//             remainingEMIs,
//             nextDueDate,
//             nextEMINumber:  paidEMIs + 1,
//             isFullyPaid:    remainingEMIs === 0,
//             schedule,
//             payments:       payments || [],
//         })
//     } catch (err: any) {
//         res.status(500).json({ error: err.message })
//     }
// })
//
// // ── POST pay next EMI ────────────────────────────────────────
// router.post('/pay-emi/:applicationId', verifyToken, async (req: AuthRequest, res: Response) => {
//     try {
//         const { data: app, error } = await supabase
//             .from('loan_applications')
//             .select('*')
//             .eq('id', req.params.applicationId)
//             .eq('user_id', req.userId)
//             .single()
//
//         if (error || !app) return res.status(404).json({ error: 'Application not found' })
//         if (app.status !== 'approved') {
//             return res.status(400).json({ error: app.status === 'repaid' ? 'Loan already fully repaid' : 'Loan is not active' })
//         }
//
//         // Count payments made
//         const { data: payments } = await supabase
//             .from('emi_payments')
//             .select('id, amount, emi_number')
//             .eq('application_id', req.params.applicationId)
//
//         const paidCount  = (payments || []).length
//         if (paidCount >= app.tenure) {
//             return res.status(400).json({ error: 'All EMIs already paid' })
//         }
//
//         const creditGrade  = app.score_breakdown?.grade || 'Fair'
//         const annualRate   = getInterestRate(creditGrade)
//         const emi          = calculateEMI(app.amount, annualRate, app.tenure)
//         const emiNumber    = paidCount + 1
//         const dueDate      = getDueDate(app.approved_at || app.created_at, emiNumber)
//         const isLate       = new Date() > new Date(dueDate)
//
//         // Record the payment
//         const { data: payment, error: payErr } = await supabase
//             .from('emi_payments')
//             .insert([{
//                 application_id: req.params.applicationId,
//                 user_id:        req.userId,
//                 emi_number:     emiNumber,
//                 amount:         emi,
//                 annual_rate:    annualRate,
//                 due_date:       dueDate,
//                 paid_at:        new Date().toISOString(),
//                 late:           isLate,
//                 // In production: Stripe payment intent ID would go here
//                 stripe_payment_id: `emi_sim_${Date.now()}`
//             }])
//             .select().single()
//
//         if (payErr) throw payErr
//
//         const newPaidCount = paidCount + 1
//         const isFullyPaid  = newPaidCount >= app.tenure
//
//         // If all EMIs paid → mark loan as repaid
//         if (isFullyPaid) {
//             const allOnTime = !(payments || []).some((p: any) => p.late) && !isLate
//             await supabase
//                 .from('loan_applications')
//                 .update({
//                     status:          'repaid',
//                     repaid_on_time:  allOnTime,
//                     repaid_at:       new Date().toISOString(),
//                     updated_at:      new Date().toISOString()
//                 })
//                 .eq('id', req.params.applicationId)
//         }
//
//         const totalPaid     = ((payments || []).reduce((s: number, p: any) => s + p.amount, 0)) + emi
//         const totalPayable  = emi * app.tenure
//         const outstanding   = Math.max(0, totalPayable - totalPaid)
//
//         res.json({
//             success:      true,
//             emiNumber,
//             amount:       emi,
//             isLate,
//             isFullyPaid,
//             totalPaid,
//             outstanding,
//             remainingEMIs: Math.max(0, app.tenure - newPaidCount),
//             message:      isFullyPaid
//                 ? '🏆 Congratulations! Your loan is fully repaid. Your credit score will be boosted.'
//                 : `✅ EMI ${emiNumber}/${app.tenure} paid successfully. ${app.tenure - newPaidCount} EMIs remaining.`
//         })
//     } catch (err: any) {
//         res.status(500).json({ error: err.message })
//     }
// })
//
// // ── Helpers ───────────────────────────────────────────────────
//
// function getDueDate(startDate: string, emiNumber: number): string {
//     const date = new Date(startDate)
//     date.setMonth(date.getMonth() + emiNumber)
//     return date.toISOString().split('T')[0]
// }
//
// function getNextDueDate(startDate: string, paidEMIs: number): string {
//     return getDueDate(startDate, paidEMIs + 1)
// }
//
// export default router

// routes/repayment.ts
import { Router } from 'express'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { Response } from 'express'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ── Helpers ──────────────────────────────────────────────────

function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const r = annualRate / 12 / 100
    if (r === 0) return Math.round(principal / tenureMonths)
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
    return Math.round(emi)
}

function getInterestRate(creditGrade: string): number {
    const rates: Record<string, number> = {
        'Excellent': 10.5, 'Very Good': 11.5, 'Good': 13.5, 'Fair': 16.0, 'Poor': 18.5
    }
    return rates[creditGrade] ?? 16.0
}

// ── GET schedule for an application ─────────────────────────
router.get('/schedule/:applicationId', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { data: app, error } = await supabase
            .from('loan_applications')
            .select('*')
            .eq('id', req.params.applicationId)
            .eq('user_id', req.userId)
            .single()

        if (error || !app) return res.status(404).json({ error: 'Application not found' })
        if (app.status !== 'approved' && app.status !== 'repaid') {
            return res.status(400).json({ error: 'Loan is not active' })
        }

        // Fetch payments made so far
        const { data: payments } = await supabase
            .from('emi_payments')
            .select('*')
            .eq('application_id', req.params.applicationId)
            .order('paid_at', { ascending: true })

        const creditGrade   = app.score_breakdown?.grade || 'Fair'
        const annualRate    = getInterestRate(creditGrade)
        const emi           = calculateEMI(app.amount, annualRate, app.tenure)
        const totalPayable  = emi * app.tenure
        const totalPaid     = (payments || []).reduce((s: number, p: any) => s + p.amount, 0)
        const paidEMIs      = (payments || []).length
        const remainingEMIs = Math.max(0, app.tenure - paidEMIs)
        const outstanding   = Math.max(0, totalPayable - totalPaid)
        const nextDueDate   = getNextDueDate(app.approved_at || app.created_at, paidEMIs)

        // Build full EMI schedule
        const schedule = []
        let balance = app.amount
        for (let i = 1; i <= app.tenure; i++) {
            const interest  = Math.round(balance * annualRate / 12 / 100)
            const principal = emi - interest
            balance = Math.max(0, balance - principal)
            const payment   = (payments || []).find((p: any) => p.emi_number === i)
            schedule.push({
                emiNumber:   i,
                amount:      emi,
                principal:   principal,
                interest:    interest,
                balance:     balance,
                dueDate:     getDueDate(app.approved_at || app.created_at, i),
                paid:        !!payment,
                paidAt:      payment?.paid_at || null,
                paymentId:   payment?.id || null,
                late:        payment?.late || false,
            })
        }

        res.json({
            applicationId:  app.id,
            loanAmount:     app.amount,
            annualRate,
            emi,
            tenure:         app.tenure,
            totalPayable,
            totalPaid,
            outstanding,
            paidEMIs,
            remainingEMIs,
            nextDueDate,
            nextEMINumber:  paidEMIs + 1,
            isFullyPaid:    remainingEMIs === 0,
            schedule,
            payments:       payments || [],
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ── POST pay next EMI ────────────────────────────────────────
router.post('/pay-emi/:applicationId', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { data: app, error } = await supabase
            .from('loan_applications')
            .select('*')
            .eq('id', req.params.applicationId)
            .eq('user_id', req.userId)
            .single()

        if (error || !app) return res.status(404).json({ error: 'Application not found' })
        if (app.status !== 'approved') {
            return res.status(400).json({ error: app.status === 'repaid' ? 'Loan already fully repaid' : 'Loan is not active' })
        }

        // Count payments made
        const { data: payments } = await supabase
            .from('emi_payments')
            .select('id, amount, emi_number')
            .eq('application_id', req.params.applicationId)

        const paidCount  = (payments || []).length
        if (paidCount >= app.tenure) {
            return res.status(400).json({ error: 'All EMIs already paid' })
        }

        const creditGrade  = app.score_breakdown?.grade || 'Fair'
        const annualRate   = getInterestRate(creditGrade)
        const emi          = calculateEMI(app.amount, annualRate, app.tenure)
        const emiNumber    = paidCount + 1
        const dueDate      = getDueDate(app.approved_at || app.created_at, emiNumber)
        const isLate       = new Date() > new Date(dueDate)

        // Record the payment
        const { data: payment, error: payErr } = await supabase
            .from('emi_payments')
            .insert([{
                application_id: req.params.applicationId,
                user_id:        req.userId,
                emi_number:     emiNumber,
                amount:         emi,
                annual_rate:    annualRate,
                due_date:       dueDate,
                paid_at:        new Date().toISOString(),
                late:           isLate,
                // In production: Stripe payment intent ID would go here
                stripe_payment_id: `emi_sim_${Date.now()}`
            }])
            .select().single()

        if (payErr) throw payErr

        const newPaidCount = paidCount + 1
        const isFullyPaid  = newPaidCount >= app.tenure

        // If all EMIs paid → mark loan as repaid + recalculate credit score
        if (isFullyPaid) {
            const allOnTime = !(payments || []).some((p: any) => p.late) && !isLate

            await supabase
                .from('loan_applications')
                .update({
                    status:         'repaid',
                    repaid_on_time: allOnTime,
                    repaid_at:      new Date().toISOString(),
                    updated_at:     new Date().toISOString()
                })
                .eq('id', req.params.applicationId)

            // ── Trigger credit score recalculation immediately ────
            // The loan is now repaid, so repaidLoansCount increases,
            // isReturningBorrower becomes true, and the bonus kicks in.
            // We call our own credit/calculate endpoint internally.
            try {
                const port    = process.env.PORT || 3001
                const baseUrl = process.env.INTERNAL_URL || `http://localhost:${port}`

                // Get a service-level token for this user to call the credit route
                // We pass userId directly via a trusted internal header instead
                await fetch(`${baseUrl}/api/credit/calculate-internal`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'x-internal-user-id': req.userId! }
                })
                console.log(`✅ Credit score recalculated after full repayment for user ${req.userId}`)
            } catch (e) {
                // Non-blocking — score will update next time user visits credit page
                console.warn('⚠️  Could not auto-recalculate credit score after repayment:', e)
            }
        }

        const totalPaid     = ((payments || []).reduce((s: number, p: any) => s + p.amount, 0)) + emi
        const totalPayable  = emi * app.tenure
        const outstanding   = Math.max(0, totalPayable - totalPaid)

        res.json({
            success:      true,
            emiNumber,
            amount:       emi,
            isLate,
            isFullyPaid,
            totalPaid,
            outstanding,
            remainingEMIs: Math.max(0, app.tenure - newPaidCount),
            message:      isFullyPaid
                ? '🏆 Congratulations! Your loan is fully repaid. Your credit score will be boosted.'
                : `✅ EMI ${emiNumber}/${app.tenure} paid successfully. ${app.tenure - newPaidCount} EMIs remaining.`
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ── Helpers ───────────────────────────────────────────────────

function getDueDate(startDate: string, emiNumber: number): string {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + emiNumber)
    return date.toISOString().split('T')[0]
}

function getNextDueDate(startDate: string, paidEMIs: number): string {
    return getDueDate(startDate, paidEMIs + 1)
}

export default router