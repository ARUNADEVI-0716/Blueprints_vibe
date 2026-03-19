import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

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

    const handleSignIn = async (e: FormEvent) => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (!email || !password) { setError('Please fill in all fields.'); return }
        setLoading(true)
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
            setError(err.message.toLowerCase().includes('invalid login')
                ? 'Incorrect email or password.'
                : err.message)
            setLoading(false)
            return
        }
        navigate('/dashboard')
    }

    const handleSignUp = async (e: FormEvent) => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (!email || !password || !confirmPassword) { setError('Please fill in all fields.'); return }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true)
        const { data, error: err } = await supabase.auth.signUp({
            email, password,
            options: { emailRedirectTo: `${window.location.origin}/onboarding` }
        })
        if (err) {
            setError(err.message.toLowerCase().includes('already registered')
                ? 'An account with this email already exists.'
                : err.message)
            setLoading(false)
            return
        }
        if (data.session || data.user) navigate('/onboarding')
        else { setSuccess('Account created! Check your email to confirm.'); setLoading(false) }
    }

    const handleGoogle = async () => {
        setGoogleLoading(true)
        const { error: err } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/onboarding` }
        })
        if (err) { setError(err.message); setGoogleLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Public Sans, Inter, sans-serif', background: '#f7f9fb' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

                {/* ── Left Panel ─────────────────────────────────── */}
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

                {/* ── Right Panel — Form ──────────────────────────── */}
                <main style={{ width: '40%', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
                    <div style={{ width: '100%', maxWidth: 400 }}>

                        {/* Tab switcher */}
                        <div style={{ display: 'flex', background: '#eceef0', borderRadius: 10, padding: 4, marginBottom: 40 }}>
                            {(['signin', 'signup'] as const).map(t => (
                                <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
                                        style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                                            background: tab === t ? 'white' : 'transparent',
                                            color: tab === t ? '#001736' : '#43474f',
                                            boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                                        }}>
                                    {t === 'signin' ? 'Sign In' : 'Create Account'}
                                </button>
                            ))}
                        </div>

                        {/* Heading */}
                        <div style={{ marginBottom: 32 }}>
                            <h3 style={{ fontWeight: 900, fontSize: 28, color: '#001736', marginBottom: 8, letterSpacing: '-0.5px' }}>
                                {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
                            </h3>
                            <p style={{ fontSize: 15, color: '#43474f' }}>
                                {tab === 'signin'
                                    ? 'Enter your credentials to access your Nexus account.'
                                    : 'Start for free — no credit card required.'}
                            </p>
                        </div>

                        {/* Error / Success */}
                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                ⚠️ {error}
                            </div>
                        )}
                        {success && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 14, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                ✅ {success}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#747780' }}>✉️</span>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                           placeholder="name@company.com" disabled={loading}
                                           style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                           onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                           onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}/>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Password
                                    </label>
                                    {tab === 'signin' && (
                                        <Link to="/forgot-password" style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none' }}>
                                            Forgot Password?
                                        </Link>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#747780' }}>🔒</span>
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                           placeholder="••••••••" disabled={loading}
                                           style={{ width: '100%', paddingLeft: 44, paddingRight: 44, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                           onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                           onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}/>
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#747780' }}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {/* Strength meter — signup only */}
                                {tab === 'signup' && password && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                            {[1,2,3,4,5].map(i => (
                                                <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i <= strength ? strengthColor : '#e0e3e5', transition: 'all 0.3s' }}/>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: strengthColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{strengthLabel}</p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password — signup only */}
                            {tab === 'signup' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                        Confirm Password
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#747780' }}>🔒</span>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                               placeholder="Repeat your password" disabled={loading}
                                               style={{ width: '100%', paddingLeft: 44, paddingRight: 44, paddingTop: 14, paddingBottom: 14, background: '#eceef0', border: 'none', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                               onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                                               onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}/>
                                        {confirmPassword && (
                                            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>
                                                {password === confirmPassword ? '✅' : '❌'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <button type="submit" disabled={loading}
                                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #001736 0%, #002b5b 100%)', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(0,23,54,0.25)', transition: 'all 0.2s', marginTop: 4 }}
                                    onMouseEnter={e => { if (!loading) (e.currentTarget.style.opacity = '0.9') }}
                                    onMouseLeave={e => { if (!loading) (e.currentTarget.style.opacity = '1') }}>
                                {loading
                                    ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
                                    : (tab === 'signin' ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
                            <div style={{ flex: 1, height: 1, background: '#e0e3e5' }}/>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Or continue with</span>
                            <div style={{ flex: 1, height: 1, background: '#e0e3e5' }}/>
                        </div>

                        {/* Google */}
                        <button onClick={handleGoogle} disabled={googleLoading} type="button"
                                style={{ width: '100%', padding: '14px', background: 'white', border: '1px solid #e0e3e5', borderRadius: 8, fontWeight: 700, fontSize: 15, color: '#191c1e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                            {googleLoading ? '…' : (
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            )}
                            Continue with Google
                        </button>

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

            {/* ── Footer ─────────────────────────────────────────── */}
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
        </div>
    )
}