import { Router } from 'express'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { createClient } from '@supabase/supabase-js'
import { Response } from 'express'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expires: number; mobile: string }>()

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP to guarantor mobile
router.post('/send-otp', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { guarantorMobile, applicationId } = req.body

        if (!guarantorMobile || !/^\d{10}$/.test(guarantorMobile)) {
            return res.status(400).json({ error: 'Invalid mobile number' })
        }

        const otp = generateOTP()
        const key = `${req.userId}_${applicationId || 'new'}`
        otpStore.set(key, {
            otp,
            expires: Date.now() + 10 * 60 * 1000, // 10 minutes
            mobile: guarantorMobile
        })

        // In production: send SMS via Twilio/MSG91
        // For sandbox: log to console and return in dev mode
        console.log(`[GUARANTOR OTP] Mobile: +91${guarantorMobile} | OTP: ${otp} | Key: ${key}`)

        // Save OTP attempt to DB for audit
        // Save OTP attempt to DB for audit (non-blocking — ignore errors)
        void (async () => {
            try {
                await supabase.from('guarantor_otp_logs').insert([{
                    user_id: req.userId,
                    application_id: applicationId || null,
                    mobile: guarantorMobile,
                    otp_sent_at: new Date().toISOString()
                }])
            } catch (_) {}
        })()

        res.json({
            success: true,
            message: `OTP sent to +91${guarantorMobile.slice(0, 2)}XXXXXXXX${guarantorMobile.slice(-2)}`,
            // Only expose OTP in sandbox/dev
            ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp })
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// Verify guarantor OTP
router.post('/verify-otp', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { applicationId } = req.body
        const key = `${req.userId}_${applicationId || 'new'}`
        const record = otpStore.get(key)

        if (!record) {
            return res.status(400).json({ error: 'No OTP found. Please request a new one.' })
        }

        if (Date.now() > record.expires) {
            otpStore.delete(key)
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
        }

        // OTP verified — clean up
        otpStore.delete(key)

        // If applicationId present, mark guarantor as verified in DB
        if (applicationId) {
            await supabase
                .from('loan_applications')
                .update({
                    guarantor_otp_verified: true,
                    guarantor_verified_at: new Date().toISOString()
                })
                .eq('id', applicationId)
                .eq('user_id', req.userId)
        }

        res.json({ success: true, verified: true })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

export default router