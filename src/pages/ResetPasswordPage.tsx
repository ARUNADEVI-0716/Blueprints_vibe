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

    useEffect(() => {
        // Supabase sends the user back with a session after clicking the reset link
        // We just need to make sure they have a valid session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/forgot-password')
            }
        })
    }, [])

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

    const handleReset = async () => {
        setError('')
        if (!password || !confirmPassword) {
            setError('Please fill in all fields.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)

        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000)
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-white rounded-3xl p-10 border border-purple-100"
                 style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.08)' }}>

                {/* Brand */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                            <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                            <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                            <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                        </svg>
                    </div>
                    <span className="font-display font-bold text-purple-900 text-xl tracking-tight">Nexus</span>
                </div>

                {!success ? (
                    <>
                        {/* Heading */}
                        <div className="mb-8">
                            <h1 className="font-display font-bold text-4xl text-gray-900 tracking-tight mb-2">
                                Reset Password
                            </h1>
                            <p className="text-gray-400 text-base">
                                Enter your new password below.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-6">
                                <ErrIcon />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* New password */}
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-gray-500 mb-2 tracking-wide uppercase">
                                New Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                                    <LockIcon />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="w-full bg-white border border-purple-100 rounded-2xl pl-12 pr-12 py-4 text-base text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-purple-400 transition-colors">
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                                 style={{ background: i <= strength ? strengthColor : '#ede9fe' }} />
                                        ))}
                                    </div>
                                    <p className="text-xs font-semibold" style={{ color: strengthColor }}>
                                        {strengthLabel}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-gray-500 mb-2 tracking-wide uppercase">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                                    <LockIcon />
                                </span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    className="w-full bg-white border border-purple-100 rounded-2xl pl-12 pr-12 py-4 text-base text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
                                    disabled={loading}
                                />
                                {confirmPassword && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                                        {password === confirmPassword
                                            ? <span className="text-emerald-500"><CheckIcon /></span>
                                            : <span className="text-red-400"><ErrIcon /></span>}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="btn-primary"
                            style={{ padding: '16px 28px', fontSize: '16px', borderRadius: '14px' }}>
                            {loading
                                ? <span className="flex items-center gap-2"><Spinner /> Updating…</span>
                                : 'Update Password'}
                        </button>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5" />
                                <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="1.8"
                                      strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">
                            Password Updated!
                        </h2>
                        <p className="text-gray-400 text-sm mb-1">
                            Your password has been successfully reset.
                        </p>
                        <p className="text-gray-300 text-sm">
                            Redirecting you to login…
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
            <rect x="2.5" y="6" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}
function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
            <path d="M1 7.5S3.5 3 7.5 3 14 7.5 14 7.5 11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    )
}
function EyeOffIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
            <path d="M1 1l13 13M6.5 6.6A1.5 1.5 0 009.4 8.5M4 4.3C2.4 5.3 1 7.5 1 7.5S3.5 12 7.5 12c1.2 0 2.3-.3 3.2-.9M6 3.1C6.5 3 7 3 7.5 3c4 0 6.5 4.5 6.5 4.5s-.6 1.1-1.7 2.1"
                  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}
function ErrIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 15 15" fill="none" className="mt-0.5 flex-shrink-0">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    )
}
function CheckIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
function Spinner() {
    return (
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none"
             style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
        </svg>
    )
}