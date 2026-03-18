import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import AuthPanel from '@/components/AuthPanel'

export default function SignupPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

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
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][strength]
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength]

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (!email || !password || !confirmPassword) { setError('Please fill in all fields.'); return }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true)

        const { data, error: signUpError } = await supabase.auth.signUp({
            email, password,
            options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        })

        if (signUpError) {
            setError(signUpError.message.toLowerCase().includes('already registered')
                ? 'An account with this email already exists.'
                : signUpError.message)
            setLoading(false)
            return
        }

        if (data.session) {
            navigate('/onboarding')
        } else if (data.user) {
            navigate('/onboarding')
        } else {
            setSuccess('Account created! Check your email to confirm.')
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setGoogleLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/onboarding` },
        })
        if (error) { setError(error.message); setGoogleLoading(false) }
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 items-stretch">

                <div className="bg-white rounded-3xl shadow-sm shadow-purple-100 p-12 flex flex-col justify-center"
                     style={{ border: '1px solid #ede9fe' }}>

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
                        <span className="font-display font-bold text-purple-900 text-3xl tracking-tight">Nexus</span>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight leading-tight mb-3">
                            Create account
                        </h1>
                        <p className="text-gray-400 text-xl">Start for free — no credit card required</p>
                    </div>

                    {/* Google */}
                    <div className="mb-6">
                        <button onClick={handleGoogleSignup} disabled={googleLoading} type="button"
                                className="w-full bg-white hover:bg-purple-50 text-gray-700 font-semibold rounded-2xl py-4 px-6 text-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer border border-purple-100"
                                style={{ boxShadow: '0 1px 4px rgba(109,40,217,0.06)' }}>
                            {googleLoading ? <Spinner color="purple" /> : <GoogleIcon />}
                            <span>Sign up with Google</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-purple-100" />
                        <span className="text-base text-gray-300 font-medium">or sign up with email</span>
                        <div className="flex-1 h-px bg-purple-100" />
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-base rounded-2xl px-5 py-4 mb-6">
                            <ErrIcon /><span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-base rounded-2xl px-5 py-4 mb-6">
                            <CheckCircle /><span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="block text-base font-bold text-gray-500 mb-2.5 tracking-wide uppercase">Email address</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><MailIcon /></span>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                       placeholder="you@company.com"
                                       className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-5 text-lg text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-purple-400"
                                       style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                       disabled={loading} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-bold text-gray-500 mb-2.5 tracking-wide uppercase">Password</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><LockIcon /></span>
                                <input type={showPassword ? 'text' : 'password'} value={password}
                                       onChange={e => setPassword(e.target.value)}
                                       placeholder="Min. 6 characters"
                                       className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-14 py-5 text-lg text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-purple-400"
                                       style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                       disabled={loading} />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-purple-400 transition-colors">
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {password && (
                                <div className="mt-3">
                                    <div className="flex gap-1.5 mb-1.5">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                                 style={{ background: i <= strength ? strengthColor : '#ede9fe' }} />
                                        ))}
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-base font-bold text-gray-500 mb-2.5 tracking-wide uppercase">Confirm password</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"><LockIcon /></span>
                                <input type="password" value={confirmPassword}
                                       onChange={e => setConfirmPassword(e.target.value)}
                                       placeholder="Repeat your password"
                                       className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-14 py-5 text-lg text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-purple-400"
                                       style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                       disabled={loading} />
                                {confirmPassword && (
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2">
                                        {password === confirmPassword
                                            ? <span className="text-emerald-500"><CheckCircle /></span>
                                            : <span className="text-red-400"><ErrIcon /></span>}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary"
                                style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px', marginTop: '8px' }}>
                            {loading ? <><Spinner /><span>Creating account…</span></> : 'Create account'}
                        </button>
                    </form>

                    <p className="text-center text-lg text-gray-400 mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                <AuthPanel />
            </div>
        </div>
    )
}

function GoogleIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    )
}
function MailIcon() { return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5l6.5 4L14 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function LockIcon() { return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><rect x="2.5" y="6" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function EyeIcon() { return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3 14 7.5 14 7.5 11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg> }
function EyeOffIcon() { return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M6.5 6.6A1.5 1.5 0 009.4 8.5M4 4.3C2.4 5.3 1 7.5 1 7.5S3.5 12 7.5 12c1.2 0 2.3-.3 3.2-.9M6 3.1C6.5 3 7 3 7.5 3c4 0 6.5 4.5 6.5 4.5s-.6 1.1-1.7 2.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ErrIcon() { return <svg width="18" height="18" viewBox="0 0 15 15" fill="none" className="mt-0.5 flex-shrink-0"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function CheckCircle() { return <svg width="18" height="18" viewBox="0 0 15 15" fill="none" className="mt-0.5 flex-shrink-0"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function Spinner({ color = 'white' }: { color?: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}
             className={color === 'purple' ? 'text-purple-500' : 'text-white'}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}

