// import { useState, FormEvent } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { supabase } from '@/lib/supabaseClient'
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// export default function OfficerLogin() {
//     const navigate = useNavigate()
//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [error, setError] = useState('')
//     const [loading, setLoading] = useState(false)
//     const [showPassword, setShowPassword] = useState(false)
//
//     const handleLogin = async (e: FormEvent) => {
//         e.preventDefault()
//         setError('')
//         if (!email || !password) { setError('Please fill in all fields.'); return }
//         setLoading(true)
//
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/officer/login`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, password })
//             })
//
//             const data = await res.json()
//
//             if (!res.ok || data.error) {
//                 setError('Invalid officer credentials. Please try again.')
//                 setLoading(false)
//                 return
//             }
//
//             // Save officer token to localStorage
//             localStorage.setItem('officer_token', data.token)
//             localStorage.setItem('officer_email', data.email)
//
// // Check if TOTP already set up
//             const { data: factorsData } = await supabase.auth.mfa.listFactors()
//             const verifiedFactor = factorsData?.totp?.find((f: any) => f.status === 'verified')
//
//             if (verifiedFactor) {
//                 navigate('/officer/verify-2fa')
//             } else {
//                 navigate('/officer/setup-2fa')
//             }
//         } catch {
//             setError('Connection failed. Is the backend running?')
//             setLoading(false)
//         }
//     }
//
//     return (
//         <div className="page-wrapper flex items-center justify-center p-8">
//             <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
//
//                 {/* ── Left — Form ── */}
//                 <div className="bg-white rounded-3xl p-12 flex flex-col justify-center"
//                      style={{ border: '1px solid #ede9fe', boxShadow: '0 4px 24px rgba(109,40,217,0.08)' }}>
//
//                     {/* Brand */}
//                     <div className="flex items-center gap-4 mb-10">
//                         <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
//                             <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
//                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
//                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
//                             </svg>
//                         </div>
//                         <div>
//                             <span className="font-display font-bold text-purple-900 text-3xl tracking-tight block">Nexus</span>
//                             <span className="text-base bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-semibold">Officer Portal</span>
//                         </div>
//                     </div>
//
//                     {/* Heading */}
//                     <div className="mb-10">
//                         <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
//                             Officer Sign In
//                         </h1>
//                         <p className="text-gray-400 text-xl">Access the loan management dashboard</p>
//                     </div>
//
//                     {/* Credentials hint */}
//
//                     {error && (
//                         <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-base rounded-2xl px-5 py-4 mb-6">
//                             <span>⚠️</span> {error}
//                         </div>
//                     )}
//
//                     <form onSubmit={handleLogin} className="space-y-5">
//                         <div>
//                             <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
//                                 Officer Email
//                             </label>
//                             <div className="relative">
//                                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
//                                     <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
//                                         <rect x="1" y="3" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/>
//                                         <path d="M1 5l6.5 4L14 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//                                     </svg>
//                                 </span>
//                                 <input type="email" value={email}
//                                        onChange={e => setEmail(e.target.value)}
//                                        placeholder="officer@nexus.com"
//                                        autoComplete="email"
//                                        className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
//                                        style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
//                                        disabled={loading} />
//                             </div>
//                         </div>
//
//                         <div>
//                             <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
//                                 Password
//                             </label>
//                             <div className="relative">
//                                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
//                                     <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
//                                         <rect x="2.5" y="6" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
//                                         <path d="M5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
//                                     </svg>
//                                 </span>
//                                 <input type={showPassword ? 'text' : 'password'}
//                                        value={password}
//                                        onChange={e => setPassword(e.target.value)}
//                                        placeholder="••••••••"
//                                        autoComplete="current-password"
//                                        className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-14 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
//                                        style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
//                                        disabled={loading} />
//                                 <button type="button"
//                                         onClick={() => setShowPassword(p => !p)}
//                                         className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-purple-400 transition-colors">
//                                     {showPassword ? <EyeOffIcon /> : <EyeIcon />}
//                                 </button>
//                             </div>
//                         </div>
//
//                         <button type="submit" disabled={loading}
//                                 className="btn-primary"
//                                 style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px', marginTop: '8px' }}>
//                             {loading
//                                 ? <span className="flex items-center gap-2"><Spinner /> Signing in…</span>
//                                 : '🔐 Sign In to Officer Portal'}
//                         </button>
//                     </form>
//
//                     <div className="mt-8 pt-6 border-t border-purple-50 text-center">
//                         <p className="text-gray-400 text-base">
//                             Not an officer?{' '}
//                             <button onClick={() => navigate('/login')}
//                                     className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
//                                 Applicant Login →
//                             </button>
//                         </p>
//                     </div>
//                 </div>
//
//                 {/* ── Right — Info Panel ── */}
//                 <div className="hidden lg:flex flex-col justify-between rounded-3xl p-10 relative overflow-hidden"
//                      style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)' }}>
//
//                     {/* Orbs */}
//                     <div className="orb orb-1" />
//                     <div className="orb orb-2" />
//                     <div className="orb orb-3" />
//
//                     <div className="relative z-10">
//                         <div className="flex items-center gap-3 mb-16">
//                             <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
//                                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//                                     <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
//                                     <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                     <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                     <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
//                                 </svg>
//                             </div>
//                             <span className="text-white font-display font-bold text-xl">Nexus Officer Portal</span>
//                         </div>
//                     </div>
//
//                     <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
//                         <div>
//                             <h2 className="font-display font-bold text-4xl text-white leading-tight mb-4">
//                                 Review. Decide.<br />
//                                 <span className="text-purple-200">Make Impact.</span>
//                             </h2>
//                             <p className="text-purple-200 text-lg leading-relaxed">
//                                 Access full applicant profiles, AI credit scores, bank transaction analysis and make real-time loan decisions.
//                             </p>
//                         </div>
//
//                         <div className="space-y-4">
//                             {[
//                                 { icon: '🤖', title: 'AI Credit Reports', desc: 'Full score breakdown for every applicant' },
//                                 { icon: '🏦', title: 'Bank Data Analysis', desc: 'Real Plaid transaction insights' },
//                                 { icon: '⚡', title: 'Real-time Decisions', desc: 'Approve or reject instantly' },
//                             ].map(f => (
//                                 <div key={f.title} className="glass-card p-5 flex items-center gap-4">
//                                     <span className="text-2xl">{f.icon}</span>
//                                     <div>
//                                         <p className="text-white font-semibold text-base">{f.title}</p>
//                                         <p className="text-purple-200 text-sm">{f.desc}</p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//
//                     <div className="relative z-10 mt-8">
//                         <p className="text-purple-300 text-sm">
//                             🔒 Secure officer access · JWT authenticated · Session expires in 8 hours
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }
//
// function EyeIcon() {
//     return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3 14 7.5 14 7.5 11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
// }
// function EyeOffIcon() {
//     return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M6.5 6.6A1.5 1.5 0 009.4 8.5M4 4.3C2.4 5.3 1 7.5 1 7.5S3.5 12 7.5 12c1.2 0 2.3-.3 3.2-.9M6 3.1C6.5 3 7 3 7.5 3c4 0 6.5 4.5 6.5 4.5s-.6 1.1-1.7 2.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
// }
// function Spinner() {
//     return (
//         <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
//             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
//         </svg>
//     )
// }

import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function OfficerLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        if (!email || !password) { setError('Please fill in all fields.'); return }

        // Validate officer credentials before hitting Supabase
        if (email !== 'officer@nexus.com') {
            setError('Invalid officer credentials. Please try again.')
            return
        }

        setLoading(true)

        try {
            // Sign in via Supabase Auth — officer is a real Supabase user
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError || !data.session) {
                setError('Invalid officer credentials. Please try again.')
                setLoading(false)
                return
            }

            // Store officer info — token is now a real Supabase JWT
            localStorage.setItem('officer_token', data.session.access_token)
            localStorage.setItem('officer_email', email)

            // Check if TOTP already set up
            const { data: factorsData } = await supabase.auth.mfa.listFactors()
            const verifiedFactor = factorsData?.totp?.find(
                (f) => (f.status as string) === 'verified'
            )

            if (verifiedFactor) {
                // Already set up — go to verify
                navigate('/officer/verify-2fa')
            } else {
                // First time — set up TOTP
                navigate('/officer/setup-2fa')
            }

        } catch {
            setError('Connection failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">

                {/* ── Left — Form ── */}
                <div className="bg-white rounded-3xl p-12 flex flex-col justify-center"
                     style={{ border: '1px solid #ede9fe', boxShadow: '0 4px 24px rgba(109,40,217,0.08)' }}>

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
                                Officer Portal
                            </span>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="mb-10">
                        <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
                            Officer Sign In
                        </h1>
                        <p className="text-gray-400 text-xl">
                            Access the loan management dashboard
                        </p>
                    </div>

                    {/* Info box */}


                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-base rounded-2xl px-5 py-4 mb-6">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
                                Officer Email
                            </label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                    <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
                                        <rect x="1" y="3" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                        <path d="M1 5l6.5 4L14 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                </span>
                                <input type="email" value={email}
                                       onChange={e => setEmail(e.target.value)}
                                       placeholder="officer@nexus.com"
                                       autoComplete="email"
                                       className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
                                       style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                       disabled={loading} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                    <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
                                        <rect x="2.5" y="6" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                        <path d="M5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                </span>
                                <input type={showPassword ? 'text' : 'password'}
                                       value={password}
                                       onChange={e => setPassword(e.target.value)}
                                       placeholder="••••••••"
                                       autoComplete="current-password"
                                       className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-14 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
                                       style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                       disabled={loading} />
                                <button type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-purple-400 transition-colors">
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                                className="btn-primary"
                                style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px', marginTop: '8px' }}>
                            {loading
                                ? <span className="flex items-center gap-2"><Spinner /> Signing in…</span>
                                : '🔐 Sign In to Officer Portal'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-purple-50 text-center">
                        <p className="text-gray-400 text-base">
                            Not an officer?{' '}
                            <button onClick={() => navigate('/login')}
                                    className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                                Applicant Login →
                            </button>
                        </p>
                    </div>
                </div>

                {/* ── Right — Info Panel ── */}
                <div className="hidden lg:flex flex-col justify-between rounded-3xl p-10 relative overflow-hidden"
                     style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)' }}>

                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                                    <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                    <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                    <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                                </svg>
                            </div>
                            <span className="text-white font-display font-bold text-xl">Nexus Officer Portal</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">
                        <div>
                            <h2 className="font-display font-bold text-4xl text-white leading-tight mb-4">
                                Review. Decide.<br />
                                <span className="text-purple-200">Make Impact.</span>
                            </h2>
                            <p className="text-purple-200 text-lg leading-relaxed">
                                Access full applicant profiles, AI credit scores,
                                bank transaction analysis and make real-time loan decisions.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: '🤖', title: 'AI Credit Reports', desc: 'Full score breakdown for every applicant' },
                                { icon: '🏦', title: 'Bank Data Analysis', desc: 'Real Plaid transaction insights' },
                                { icon: '⚡', title: 'Real-time Decisions', desc: 'Approve or reject instantly' },
                                { icon: '🔐', title: '2FA Protected', desc: 'TOTP secured officer access' },
                            ].map(f => (
                                <div key={f.title} className="glass-card p-5 flex items-center gap-4">
                                    <span className="text-2xl">{f.icon}</span>
                                    <div>
                                        <p className="text-white font-semibold text-base">{f.title}</p>
                                        <p className="text-purple-200 text-sm">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 mt-8">
                        <p className="text-purple-300 text-sm">
                            🔒 Supabase Auth · TOTP 2FA · End-to-end encrypted
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function EyeIcon() {
    return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M1 7.5S3.5 3 7.5 3 14 7.5 14 7.5 11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
}
function EyeOffIcon() {
    return <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M6.5 6.6A1.5 1.5 0 009.4 8.5M4 4.3C2.4 5.3 1 7.5 1 7.5S3.5 12 7.5 12c1.2 0 2.3-.3 3.2-.9M6 3.1C6.5 3 7 3 7.5 3c4 0 6.5 4.5 6.5 4.5s-.6 1.1-1.7 2.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
}
function Spinner() {
    return (
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}
