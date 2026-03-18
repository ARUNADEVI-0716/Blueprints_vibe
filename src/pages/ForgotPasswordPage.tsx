import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleReset = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        if (!email) { setError('Please enter your email address.'); return }
        setLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (resetError) { setError(resetError.message); setLoading(false); return }
        setSuccess(true)
        setLoading(false)
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-10 shadow-sm shadow-purple-100" style={{ border: '1px solid #ede9fe' }}>

                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                            <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                            <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                            <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                        </svg>
                    </div>
                    <span className="font-display font-bold text-purple-900 text-lg tracking-tight">Nexus</span>
                </div>

                {!success ? (
                    <>
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <rect x="1" y="5" width="20" height="14" rx="3" stroke="#7c3aed" strokeWidth="1.5"/>
                                <path d="M1 8l10 7 10-7" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight mb-1.5">Forgot password?</h1>
                        <p className="text-gray-400 text-sm mb-7">Enter your email and we'll send you a reset link.</p>

                        {error && (
                            <div className="error-box mb-5">
                                <svg width="14" height="14" viewBox="0 0 15 15" fill="none" className="mt-0.5 flex-shrink-0">
                                    <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label className="field-label">Email address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                       placeholder="you@company.com" autoComplete="email"
                                       className="auth-input" disabled={loading} />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? <span className="flex items-center gap-2"><Spinner />Sending…</span> : 'Send reset link'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5"/>
                                <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Check your inbox</h2>
                        <p className="text-gray-400 text-sm mb-2">
                            We sent a reset link to <span className="text-purple-600 font-medium">{email}</span>
                        </p>
                        <p className="text-xs text-gray-300">Didn't get it? Check your spam folder.</p>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-gray-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M8 2L4 6.5 8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}