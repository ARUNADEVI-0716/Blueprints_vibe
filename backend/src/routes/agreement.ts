import { Router } from 'express'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { Response } from 'express'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// OTP store for agreement signing
const agreementOtpStore = new Map<string, { otp: string; expires: number }>()

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate agreement HTML (converted to PDF on frontend via print)
// Returns agreement text + sends OTP to applicant email/phone
router.post('/generate', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { applicationId } = req.body

        const { data: app, error } = await supabase
            .from('loan_applications')
            .select('*')
            .eq('id', applicationId)
            .eq('user_id', req.userId)
            .single()

        if (error || !app) {
            return res.status(404).json({ error: 'Application not found' })
        }

        const { data: score } = await supabase
            .from('credit_scores')
            .select('score, grade')
            .eq('user_id', req.userId)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single()

        // Generate OTP for signing
        const otp = generateOTP()
        agreementOtpStore.set(req.userId!, {
            otp,
            expires: Date.now() + 30 * 60 * 1000 // 30 min to sign
        })

        console.log(`[AGREEMENT OTP] User: ${req.userId} | OTP: ${otp}`)

        const interestRate = getInterestRate(score?.grade || 'C')
        const emi = calculateEMI(app.amount, interestRate, app.tenure)
        const totalPayable = emi * app.tenure

        const agreement = {
            applicationId,
            applicantName: app.full_name,
            applicantEmail: app.email,
            loanAmount: app.amount,
            tenure: app.tenure,
            purpose: app.purpose,
            employmentType: app.employment_type,
            monthlyIncome: app.monthly_income,
            creditScore: score?.score || 'N/A',
            creditGrade: score?.grade || 'N/A',
            interestRate,
            emi,
            totalPayable,
            generatedAt: new Date().toISOString(),
            panNumber: app.pan_number || 'Not provided',
            guarantorName: app.guarantor_name || 'N/A',
            guarantorMobile: app.guarantor_mobile || 'N/A',
        }

        res.json({
            success: true,
            agreement,
            ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp })
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// Verify OTP and mark agreement as signed
router.post('/sign', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { otp, applicationId } = req.body
        const record = agreementOtpStore.get(req.userId!)

        if (!record) {
            return res.status(400).json({ error: 'No OTP found. Please generate the agreement again.' })
        }
        if (Date.now() > record.expires) {
            agreementOtpStore.delete(req.userId!)
            return res.status(400).json({ error: 'OTP expired. Please regenerate the agreement.' })
        }
        if (record.otp !== otp) {
            return res.status(400).json({ error: 'Incorrect OTP.' })
        }

        agreementOtpStore.delete(req.userId!)

        await supabase
            .from('loan_applications')
            .update({
                agreement_signed: true,
                agreement_signed_at: new Date().toISOString(),
                agreement_ip: req.ip
            })
            .eq('id', applicationId)
            .eq('user_id', req.userId)

        res.json({ success: true, signed: true, signedAt: new Date().toISOString() })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

function getInterestRate(grade: string): number {
    const rates: Record<string, number> = {
        'A+': 10.5, 'A': 11.5, 'B': 13.5, 'C': 16.0, 'D': 18.5, 'E': 21.0
    }
    return rates[grade] ?? 16.0
}

function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
    const r = annualRate / 12 / 100
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1)
    return Math.round(emi)
}

export default router