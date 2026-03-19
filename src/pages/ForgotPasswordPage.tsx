import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
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
            // IMPORTANT: this URL must be added to your Supabase project's
            // Authentication > URL Configuration > Redirect URLs allowlist.
            // Supabase will append #access_token=...&type=recovery to this URL.
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (resetError) { setError(resetError.message); setLoading(false); return }
        setSuccess(true)
        setLoading(false)
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Public Sans, Inter, sans-serif', background: '#f7f9fb' }}>

            {/* ── Header ── */}
            <header style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#001736"/>
                            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#001736" opacity="0.5"/>
                            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#001736" opacity="0.5"/>
                            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#001736"/>
                        </svg>
                        <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a', textTransform: 'uppercase' }}>Nexus</span>
                    </div>
                </div>
            </header>

            {/* ── Main ── */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', position: 'relative', overflow: 'hidden' }}>

                {/* Background orbs */}
                <div style={{ position: 'absolute', top: -96, left: -96, width: 384, height: 384, borderRadius: '50%', background: 'rgba(104,171,255,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 480, height: 480, background: 'rgba(0,43,91,0.06)', transform: 'rotate(45deg) translate(50%,50%)', pointerEvents: 'none' }} />

                <div style={{ width: '100%', maxWidth: 448, position: 'relative', zIndex: 1 }}>

                    {/* Icon above card */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 48px -12px rgba(25,28,30,0.08)' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#001736" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M2 7l10 7 10-7"/>
                            </svg>
                        </div>
                    </div>

                    {/* Card */}
                    <div style={{ background: '#ffffff', borderRadius: 12, padding: '40px', boxShadow: '0 24px 48px -12px rgba(25,28,30,0.08)', border: '1px solid rgba(196,198,208,0.08)' }}>

                        {!success ? (
                            <>
                                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                    <h1 style={{ fontWeight: 800, fontSize: 28, color: '#001736', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                                        Forgot Password?
                                    </h1>
                                    <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.6, margin: 0 }}>
                                        Enter your registered email and we'll send you a reset link.
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                            Email Address
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780', display: 'flex', alignItems: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                                    <path d="M2 7l10 7 10-7"/>
                                                </svg>
                                            </span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="you@company.com"
                                                autoComplete="email"
                                                disabled={loading}
                                                style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif' }}
                                                onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                                onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #001736 0%, #002b5b 100%)', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(0,23,54,0.25)', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
                                        onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}
                                    >
                                        {loading ? (
                                            <><SpinnerIcon /> Sending...</>
                                        ) : (
                                            <>Send Reset Link
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* ── Success ── */
                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                <div style={{ width: 64, height: 64, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <h2 style={{ fontWeight: 800, fontSize: 22, color: '#001736', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
                                    Check Your Inbox
                                </h2>
                                <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.6, marginBottom: 6 }}>
                                    We sent a reset link to{' '}
                                    <span style={{ fontWeight: 700, color: '#0060ac' }}>{email}</span>
                                </p>
                                <p style={{ fontSize: 12, color: '#747780', margin: 0 }}>
                                    Didn't get it? Check your spam folder.
                                </p>
                            </div>
                        )}

                        {/* Back to login */}
                        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #eceef0', textAlign: 'center' }}>
                            <button
                                onClick={() => navigate('/login')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0060ac', fontFamily: 'Public Sans, Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s', padding: 0 }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#001736')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#0060ac')}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                Return to Login
                            </button>
                        </div>
                    </div>

                    {/* Security badges */}
                    <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: 0.45 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <polyline points="9 12 11 14 15 10"/>
                            </svg>
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155' }}>SSL Secured</span>
                        </div>
                        <div style={{ width: 1, height: 12, background: '#c4c6d0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/>
                                <line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/>
                                <line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
                            </svg>
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155' }}>Member FDIC</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#94a3b8', margin: 0 }}>
                        © 2026 Nexus Financial Technologies. All rights reserved.
                    </p>
                    <nav style={{ display: 'flex', gap: 20 }}>
                        {['Privacy Policy', 'Security Standards', 'Compliance'].map(link => (
                            <a key={link} href="#" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
                               onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
                               onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                                {link}
                            </a>
                        ))}
                    </nav>
                </div>
            </footer>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

function SpinnerIcon() {
    return (
        <svg style={{ animation: 'spin 0.75s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
    )
}