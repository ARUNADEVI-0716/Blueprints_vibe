import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    // Start as null = still waiting to know if session is valid
    const [sessionReady, setSessionReady] = useState<boolean | null>(null)

    useEffect(() => {
        // Supabase processes the #access_token hash from the email link and fires
        // PASSWORD_RECOVERY. We MUST listen for this event — calling getSession()
        // immediately won't work because the token hasn't been exchanged yet.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' && session) {
                setSessionReady(true)
            } else if (event === 'SIGNED_IN' && session) {
                // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
                setSessionReady(true)
            }
        })

        // Also check for an existing valid session (e.g. user refreshed the page
        // after the token was already exchanged)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true)
            } else {
                // No session yet — give onAuthStateChange 3s to fire from the hash token.
                // If nothing fires in that window, the link is expired/invalid.
                const timer = setTimeout(() => {
                    setSessionReady(prev => {
                        if (prev === null) return false   // still waiting → declare invalid
                        return prev
                    })
                }, 3000)
                return () => clearTimeout(timer)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // sessionReady=false means token expired / invalid link
    useEffect(() => {
        if (sessionReady === false) {
            navigate('/forgot-password')
        }
    }, [sessionReady])

    const getStrength = (p: string) => {
        if (!p) return 0
        let s = 0
        if (p.length >= 6) s++
        if (p.length >= 10) s++
        if (/[A-Z]/.test(p)) s++
        if (/[0-9]/.test(p)) s++
        if (/[^A-Za-z0-9]/.test(p)) s++
        return s
    }
    const strength = getStrength(password)
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength]
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength]

    const handleReset = async () => {
        setError('')
        if (!password || !confirmPassword) { setError('Please fill in all fields.'); return }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

        setLoading(true)
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
        setTimeout(() => navigate('/login'), 3000)
    }

    // ── Waiting for token exchange ──
    if (sessionReady === null) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif', background: '#f7f9fb' }}>
                <div style={{ textAlign: 'center' }}>
                    <SpinnerIcon size={36} />
                    <p style={{ marginTop: 16, fontSize: 14, color: '#43474f', fontWeight: 500 }}>Verifying reset link...</p>
                </div>
            </div>
        )
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
                                <rect x="3" y="11" width="18" height="11" rx="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                    </div>

                    {/* Card */}
                    <div style={{ background: '#ffffff', borderRadius: 12, padding: '40px', boxShadow: '0 24px 48px -12px rgba(25,28,30,0.08)', border: '1px solid rgba(196,198,208,0.08)' }}>

                        {!success ? (
                            <>
                                <div style={{ marginBottom: 32 }}>
                                    <h1 style={{ fontWeight: 800, fontSize: 28, color: '#001736', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                                        Set New Password
                                    </h1>
                                    <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.6, margin: 0 }}>
                                        Choose a strong password for your account.
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

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                                    {/* New password */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                            New Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780', display: 'flex', alignItems: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="Min. 6 characters"
                                                disabled={loading}
                                                style={{ width: '100%', paddingLeft: 44, paddingRight: 44, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif' }}
                                                onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                                onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(p => !p)}
                                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#747780', display: 'flex', alignItems: 'center', padding: 0 }}>
                                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                        {/* Strength meter */}
                                        {password && (
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                                    {[1,2,3,4,5].map(i => (
                                                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i <= strength ? strengthColor : '#e0e3e5', transition: 'all 0.3s' }} />
                                                    ))}
                                                </div>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: strengthColor, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{strengthLabel}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm password */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                            Confirm Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780', display: 'flex', alignItems: 'center' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                </svg>
                                            </span>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Repeat your password"
                                                disabled={loading}
                                                style={{ width: '100%', paddingLeft: 44, paddingRight: 44, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif' }}
                                                onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                                onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}
                                            />
                                            {/* Match indicator */}
                                            {confirmPassword && (
                                                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: password === confirmPassword ? '#16a34a' : '#dc2626' }}>
                                                    {password === confirmPassword ? (
                                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"/>
                                                        </svg>
                                                    ) : (
                                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                        </svg>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleReset}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #001736 0%, #002b5b 100%)', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(0,23,54,0.25)', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
                                        onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}
                                    >
                                        {loading ? <><SpinnerIcon size={16} /> Updating...</> : 'Update Password'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* ── Success ── */
                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                <div style={{ width: 64, height: 64, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <h2 style={{ fontWeight: 800, fontSize: 24, color: '#001736', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
                                    Password Updated
                                </h2>
                                <p style={{ fontSize: 14, color: '#43474f', marginBottom: 6, lineHeight: 1.6 }}>
                                    Your password has been successfully reset.
                                </p>
                                <p style={{ fontSize: 13, color: '#747780', margin: 0 }}>
                                    Redirecting you to login...
                                </p>
                            </div>
                        )}
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

function EyeIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    )
}
function EyeOffIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    )
}
function SpinnerIcon({ size = 16 }: { size?: number }) {
    return (
        <svg style={{ animation: 'spin 0.75s linear infinite' }} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
    )
}