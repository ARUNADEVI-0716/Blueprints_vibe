import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function OfficerTOTPVerify() {
    const navigate = useNavigate()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const officerEmail = localStorage.getItem('officer_email') || 'Officer'

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Please enter the 6-digit code')
            return
        }
        setLoading(true)
        setError('')

        try {
            const { data: factorsData } = await supabase.auth.mfa.listFactors()
            const totpFactor = factorsData?.totp?.find(f => f.status === 'verified')

            if (!totpFactor) {
                // No verified factor — go to setup
                navigate('/officer/setup-2fa')
                return
            }

            // Challenge
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: totpFactor.id
            })
            if (challengeError) throw challengeError

            // Verify
            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challenge.id,
                code
            })

            if (verifyError) {
                setError('Invalid code. Please check your authenticator app.')
                setCode('')
                setLoading(false)
                return
            }

            localStorage.setItem('officer_totp_verified', 'true')
            navigate('/officer/dashboard')

        } catch (err: any) {
            setError(err.message || 'Verification failed')
            setLoading(false)
        }
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">

                {/* ── Left — Verify Form ── */}
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
                                Officer 2FA Verification
                            </span>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="mb-10">
                        <h1 className="font-display font-bold text-4xl text-gray-900 tracking-tight mb-3">
                            Two-Factor Auth
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Welcome back, <span className="text-purple-600 font-semibold">{officerEmail}</span>
                        </p>
                        <p className="text-gray-400 text-lg mt-1">
                            Enter the 6-digit code from your authenticator app to continue
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 mb-6 text-base flex items-center gap-3">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Code input */}
                    <div className="mb-8">
                        <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">
                            Authenticator Code
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            placeholder="000000"
                            className="w-full text-center text-5xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-5 py-6 outline-none transition-all focus:border-purple-500"
                            style={{
                                letterSpacing: '0.5em',
                                boxShadow: code.length === 6 ? '0 0 0 3px rgba(139,92,246,0.15)' : 'none'
                            }}
                            autoFocus
                        />
                        <p className="text-center text-gray-400 text-sm mt-3">
                            ⏱ Code refreshes every 30 seconds
                        </p>
                    </div>

                    <button onClick={handleVerify}
                            disabled={loading || code.length !== 6}
                            className="btn-primary mb-6"
                            style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
                        {loading
                            ? <span className="flex items-center gap-2"><Spinner /> Verifying…</span>
                            : '🔐 Verify & Enter Dashboard'}
                    </button>

                    <div className="space-y-3 pt-6 border-t border-purple-50">
                        <button onClick={() => navigate('/officer/login')}
                                className="w-full text-center text-gray-400 hover:text-purple-600 text-base font-medium transition-colors flex items-center justify-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
                                <path d="M8 2L4 6.5 8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                            Back to Login
                        </button>
                        <button onClick={() => navigate('/officer/setup-2fa')}
                                className="w-full text-center text-purple-400 hover:text-purple-600 text-sm font-medium transition-colors">
                            Lost access to authenticator? Re-setup 2FA
                        </button>
                    </div>
                </div>

                {/* ── Right — Info Panel ── */}
                <div className="hidden lg:flex flex-col rounded-3xl relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)' }}>

                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />

                    <div className="relative z-10 flex flex-col justify-between h-full p-10">

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                                    <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                    <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                    <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                                </svg>
                            </div>
                            <span className="text-white font-display font-bold text-xl">Secure Officer Access</span>
                        </div>

                        <div className="flex flex-col items-center justify-center flex-1 py-10">
                            <div className="text-8xl mb-8">🔐</div>
                            <h2 className="font-display font-bold text-4xl text-white text-center mb-4">
                                Protected Access
                            </h2>
                            <p className="text-purple-200 text-lg text-center leading-relaxed max-w-xs">
                                Your officer account is secured with two-factor authentication.
                                Enter your authenticator code to proceed.
                            </p>
                        </div>

                        <div className="glass-card p-6 space-y-4">
                            <p className="text-white font-bold text-base mb-2">
                                🛡️ Why 2FA for Officers?
                            </p>
                            {[
                                'Access to all applicant financial data',
                                'Ability to approve or reject loans',
                                'View sensitive credit score reports',
                                'Real-time Plaid bank transaction data',
                            ].map(reason => (
                                <div key={reason} className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-purple-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <p className="text-purple-200 text-sm">{reason}</p>
                                </div>
                            ))}
                        </div>
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


