import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function OfficerLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        if (!email || !password) { setError('Please fill in all fields.'); return }

        if (email !== 'officer@nexus.com') {
            setError('Invalid officer credentials. Please try again.')
            return
        }

        setLoading(true)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

            if (signInError || !data.session) {
                setError('Invalid officer credentials. Please try again.')
                setLoading(false)
                return
            }

            localStorage.setItem('officer_token', data.session.access_token)
            localStorage.setItem('officer_email', email)

            const { data: factorsData } = await supabase.auth.mfa.listFactors()
            const verifiedFactor = factorsData?.totp?.find(
                (f) => (f.status as string) === 'verified'
            )

            if (verifiedFactor) {
                navigate('/officer/verify-2fa')
            } else {
                navigate('/officer/setup-2fa')
            }
        } catch {
            setError('Connection failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Public Sans, Inter, sans-serif', background: '#f7f9fb' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

                {/* ── Left Panel ── */}
                <section style={{
                    width: '60%', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #001736 0%, #002b5b 60%, #4a148c 100%)',
                    padding: '48px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                    {/* Orbs */}
                    <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(0,96,172,0.3)', filter: 'blur(80px)', top: '-10%', left: '-5%', zIndex: 0 }}/>
                    <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(100,30,180,0.2)', filter: 'blur(80px)', bottom: '-10%', right: '-5%', zIndex: 0 }}/>

                    {/* Brand */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 10, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                            </svg>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 24, color: 'white', letterSpacing: '-0.5px' }}>Nexus</span>
                    </div>

                    {/* Headline */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontWeight: 900, fontSize: 'clamp(36px, 4vw, 60px)', color: 'white', lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24, maxWidth: 480 }}>
                            Architecting your{' '}
                            <span style={{ color: '#68abff' }}>financial future</span>.
                        </h2>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 400 }}>
                            Access AI-powered credit scoring with the precision of institutional-grade financial tools.
                        </p>
                    </div>

                    {/* Bottom tagline */}
                    <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                            Trusted by thousands of borrowers across India
                        </p>
                    </div>
                </section>

                {/* ── Right Panel — Form ── */}
                <main style={{ width: '40%', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ width: '100%', maxWidth: 400 }}>



                        {/* Tab switcher */}
                        <div style={{ display: 'flex', background: '#eceef0', borderRadius: 10, padding: 4, marginBottom: 40 }}>
                            <button
                                style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'default', fontWeight: 700, fontSize: 14, background: 'white', color: '#001736', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                                Sign In
                            </button>
                        </div>

                        {/* Heading */}
                        <div style={{ marginBottom: 32 }}>
                            <h3 style={{ fontWeight: 900, fontSize: 28, color: '#001736', marginBottom: 8, letterSpacing: '-0.5px' }}>
                                Welcome Back
                            </h3>
                            <p style={{ fontSize: 15, color: '#43474f' }}>
                                Enter your credentials to access your Nexus account.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Email */}
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
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="officer@nexus.com" disabled={loading}
                                        style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif' }}
                                        onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                        onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Password
                                    </label>
                                    <button type="button" onClick={() => navigate('/forgot-password')} style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Public Sans, Inter, sans-serif', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#001736')} onMouseLeave={e => (e.currentTarget.style.color = '#0060ac')}>
                                        Forgot Password?
                                    </button>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780', display: 'flex', alignItems: 'center' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" disabled={loading}
                                        style={{ width: '100%', paddingLeft: 44, paddingRight: 44, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'Public Sans, Inter, sans-serif' }}
                                        onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                        onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#747780', display: 'flex', alignItems: 'center', padding: 0 }}>
                                        {showPassword ? (
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                                <line x1="1" y1="1" x2="23" y2="23"/>
                                            </svg>
                                        ) : (
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #001736 0%, #002b5b 100%)', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(0,23,54,0.25)', transition: 'all 0.2s', marginTop: 4, fontFamily: 'Public Sans, Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
                                    onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}>
                                {loading ? (
                                    <>
                                        <svg style={{ animation: 'spin 0.75s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <path d="M12 2a10 10 0 0 1 10 10"/>
                                        </svg>
                                        Authenticating…
                                    </>
                                ) : 'Sign In'}
                            </button>
                        </form>

                        {/* Terms */}
                        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 32 }}>
                            By signing in, you agree to our{' '}
                            <a href="#" style={{ color: '#0060ac', textDecoration: 'none', fontWeight: 700 }}>Terms</a>
                            {' '}&{' '}
                            <a href="#" style={{ color: '#0060ac', textDecoration: 'none', fontWeight: 700 }}>Privacy Policy</a>
                        </p>
                    </div>
                </main>
            </div>

            {/* ── Footer ── */}
            <footer style={{ borderTop: '1px solid #e0e3e5', background: '#f7f9fb', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    © 2026 Nexus Financial Technologies. All rights reserved.
                </span>
                <div style={{ display: 'flex', gap: 24 }}>
                    {['Privacy Policy', 'Terms of Service', 'Cookie Settings', 'Security'].map(link => (
                        <a key={link} href="#"
                           style={{ fontSize: 11, fontWeight: 600, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none', opacity: 0.8, transition: 'opacity 0.2s' }}
                           onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                           onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}>
                            {link}
                        </a>
                    ))}
                </div>
            </footer>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}