import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function OfficerTOTPSetup() {
    const navigate = useNavigate()
    const [qrCode, setQrCode] = useState('')
    const [secret, setSecret] = useState('')
    const [factorId, setFactorId] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<'scan' | 'verify' | 'done'>('scan')

    const officerEmail = localStorage.getItem('officer_email') || 'Officer'

    useEffect(() => {
        const token = localStorage.getItem('officer_token')
        if (!token) {
            navigate('/officer/login')
            return
        }
        void enrollTOTP()
    }, [])

    const enrollTOTP = async () => {
        setLoading(true)
        setError('')
        try {
            // Clear any existing unverified factors first
            const { data: factorsData } = await supabase.auth.mfa.listFactors()
            for (const factor of factorsData?.totp || []) {
                // Use type assertion to avoid TypeScript overlap error
                const status = factor.status as string
                if (status === 'unverified') {
                    await supabase.auth.mfa.unenroll({ factorId: factor.id })
                }
            }

            const verified = factorsData?.totp?.find(f => (f.status as string) === 'verified')
            if (verified) {
                // Already set up — go to verify page
                navigate('/officer/verify-2fa')
                return
            }

            // Enroll fresh TOTP
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'Nexus Credit — Officer Portal',
                friendlyName: `Officer: ${officerEmail}`
            })

            if (error) throw error

            setFactorId(data.id)
            setQrCode(data.totp.qr_code)
            setSecret(data.totp.secret)

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to initialize 2FA setup'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter the complete 6-digit code')
            return
        }
        setVerifying(true)
        setError('')

        try {
            // Create challenge
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
            })
            if (challengeError) throw challengeError

            // Verify code
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.id,
                code: otp
            })

            if (verifyError) {
                setError('Invalid code. Please check your authenticator app and try again.')
                setOtp('')
                setVerifying(false)
                return
            }

            // Mark TOTP as set up in localStorage
            localStorage.setItem('officer_totp_verified', 'true')
            setStep('done')
            setTimeout(() => navigate('/officer/dashboard'), 2500)

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Verification failed'
            setError(message)
            setVerifying(false)
        }
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">

                {/* ── Left — Setup Card ── */}
                <div className="bg-white rounded-3xl p-12 border border-purple-100 flex flex-col justify-center"
                     style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.08)' }}>

                    {/* Brand */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
                            <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-display font-bold text-purple-900 text-3xl tracking-tight block">
                                Nexus
                            </span>
                            <span className="text-base bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-semibold">
                                Officer 2FA Setup
                            </span>
                        </div>
                    </div>

                    {/* ── SCAN STEP ── */}
                    {step === 'scan' && (
                        <>
                            <div className="mb-8">
                                <h1 className="font-display font-bold text-4xl text-gray-900 tracking-tight mb-3">
                                    Secure Your Account
                                </h1>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    As a loan officer you have access to sensitive financial data.
                                    Two-factor authentication is <span className="text-purple-600 font-semibold">mandatory</span> for your account.
                                </p>
                            </div>

                            {/* Steps */}
                            <div className="space-y-4 mb-8">
                                {[
                                    { num: '1', icon: '📱', text: 'Download Google Authenticator or Authy on your phone' },
                                    { num: '2', icon: '➕', text: 'Open the app and tap "Add Account" or "+"' },
                                    { num: '3', icon: '📷', text: 'Scan the QR code on the right' },
                                ].map(s => (
                                    <div key={s.num} className="flex items-center gap-4 bg-purple-50 rounded-2xl p-5">
                                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                            {s.num}
                                        </div>
                                        <span className="text-2xl">{s.icon}</span>
                                        <p className="text-gray-700 text-base font-medium">{s.text}</p>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 mb-6 text-base flex items-center gap-3">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <button onClick={() => setStep('verify')}
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
                                {loading
                                    ? <span className="flex items-center gap-2"><Spinner /> Loading QR Code…</span>
                                    : "I've Scanned the QR Code →"}
                            </button>
                        </>
                    )}

                    {/* ── VERIFY STEP ── */}
                    {step === 'verify' && (
                        <>
                            <div className="mb-8">
                                <button onClick={() => setStep('scan')}
                                        className="flex items-center gap-2 text-base text-purple-400 hover:text-purple-600 mb-6 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
                                        <path d="M8 2L4 6.5 8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                    </svg>
                                    Back to QR Code
                                </button>
                                <h1 className="font-display font-bold text-4xl text-gray-900 tracking-tight mb-3">
                                    Enter Verification Code
                                </h1>
                                <p className="text-gray-400 text-lg">
                                    Open your authenticator app and enter the
                                    <span className="text-purple-600 font-bold"> 6-digit code</span> for Nexus
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 mb-6 text-base flex items-center gap-3">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            {/* OTP Input */}
                            <div className="mb-8">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full text-center text-5xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-5 py-6 outline-none transition-all focus:border-purple-500"
                                    style={{
                                        letterSpacing: '0.5em',
                                        boxShadow: otp.length === 6 ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none'
                                    }}
                                    autoFocus
                                />
                                <p className="text-center text-gray-400 text-sm mt-3">
                                    ⏱ Code refreshes every 30 seconds
                                </p>
                            </div>

                            <button onClick={handleVerify}
                                    disabled={verifying || otp.length !== 6}
                                    className="btn-primary"
                                    style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
                                {verifying
                                    ? <span className="flex items-center gap-2"><Spinner /> Verifying…</span>
                                    : '🔐 Activate 2FA & Enter Dashboard'}
                            </button>
                        </>
                    )}

                    {/* ── DONE STEP ── */}
                    {step === 'done' && (
                        <div className="text-center py-8">
                            <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8">
                                🎉
                            </div>
                            <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">
                                2FA Activated!
                            </h2>
                            <p className="text-gray-400 text-xl mb-4">
                                Your officer account is now fully secured
                            </p>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
                                <p className="text-emerald-700 text-base font-semibold">
                                    ✅ From now on, every login will require your authenticator code
                                </p>
                            </div>
                            <p className="text-purple-500 text-base font-semibold animate-pulse">
                                Redirecting to dashboard…
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Right — QR Code Panel ── */}
                <div className="hidden lg:flex flex-col rounded-3xl relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)' }}>

                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />

                    <div className="relative z-10 flex flex-col justify-between h-full p-10">

                        {/* Top */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                                    <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                    <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                    <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                                </svg>
                            </div>
                            <span className="text-white font-display font-bold text-xl">Officer Portal</span>
                        </div>

                        {/* QR Code center */}
                        <div className="flex flex-col items-center justify-center flex-1 py-10">
                            {loading ? (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                                    <p className="text-white text-lg font-semibold">Generating QR Code…</p>
                                </div>
                            ) : qrCode ? (
                                <>
                                    <p className="text-purple-200 text-base font-semibold mb-6 uppercase tracking-widest">
                                        Scan with Authenticator App
                                    </p>
                                    {/* QR Code display */}
                                    <div className="bg-white p-5 rounded-3xl mb-6"
                                         style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                                        <img src={qrCode} alt="TOTP QR Code"
                                             className="w-52 h-52" />
                                    </div>

                                    {/* Manual secret */}
                                    <div className="glass-card px-6 py-4 w-full max-w-xs text-center">
                                        <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-2">
                                            Manual Entry Code
                                        </p>
                                        <p className="font-mono text-white text-sm tracking-widest break-all">
                                            {secret}
                                        </p>
                                    </div>

                                    <p className="text-purple-300 text-sm mt-4 text-center max-w-xs">
                                        Can't scan? Enter the code above manually in your authenticator app
                                    </p>
                                </>
                            ) : (
                                <div className="text-center">
                                    <p className="text-red-300 text-lg font-semibold">Failed to generate QR code</p>
                                    <button onClick={enrollTOTP}
                                            className="mt-4 bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors">
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bottom security info */}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none"
             style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}


