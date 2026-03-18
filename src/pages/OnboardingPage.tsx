import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'


export default function OnboardingPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState<'details'>('details')
    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        if (!name || !age) { setError('Please fill in your name and age.'); return }
        if (parseInt(age) < 18) { setError('You must be at least 18 years old.'); return }
        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: name, age, phone, role: 'applicant' }
        })

        if (updateError) { setError(updateError.message); setLoading(false); return }
        navigate('/dashboard')
    }

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-4xl bg-white rounded-3xl p-16 shadow-sm shadow-purple-100"
                 style={{ border: '1px solid #ede9fe' }}>

                {/* Brand */}
                <div className="flex items-center gap-4 mb-12">
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
                <div className="flex items-center gap-4 mb-12">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold">✓</div>
                        <span className="text-base text-purple-600 font-semibold">Account Created</span>
                    </div>
                    <div className="flex-1 h-px bg-purple-200" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold">2</div>
                        <span className="text-base text-purple-600 font-semibold">Your Details</span>
                    </div>
                    <div className="flex-1 h-px bg-purple-100" />
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-300 text-base font-bold">3</div>
                        <span className="text-base text-gray-400 font-semibold">Dashboard</span>
                    </div>
                </div>

                {/* ── STEP 2: Details form ── */}
                {step === 'details' && (
                    <>
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">👤</span>
                                <span className="text-base font-bold text-purple-500 uppercase tracking-wide">Applicant</span>
                            </div>
                            <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-3">
                                Tell us about yourself
                            </h1>
                            <p className="text-gray-400 text-xl">Just a few details to get you started</p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 text-base rounded-2xl px-6 py-4 mb-6">
                                <svg width="18" height="18" viewBox="0 0 15 15" fill="none" className="mt-0.5 flex-shrink-0">
                                    <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-base font-bold text-gray-500 mb-2.5 tracking-wide uppercase">Full name</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                        <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
                                            <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                                            <path d="M2 13c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                        </svg>
                                    </span>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                                           placeholder="John Doe" autoComplete="name"
                                           className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-5 text-lg text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-purple-400"
                                           style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                           disabled={loading} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-base font-bold text-gray-500 mb-2.5 tracking-wide uppercase">Age</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                        <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
                                            <rect x="2" y="2" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                            <path d="M5 7h5M7.5 5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                        </svg>
                                    </span>
                                    <input type="number" value={age} onChange={e => setAge(e.target.value)}
                                           placeholder="25" min="18" max="100"
                                           className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-5 text-lg text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-purple-400"
                                           style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                           disabled={loading} />
                                </div>
                                <p className="text-sm text-gray-300 mt-2">Must be 18 or older</p>
                            </div>

                            <div>
                                <label className="block text-base font-bold text-gray-500 mb-2.5 tracking-wide uppercase">
                                    Phone number <span className="text-gray-300 normal-case font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                                        <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
                                            <rect x="4" y="1" width="7" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                            <circle cx="7.5" cy="11.5" r="0.75" fill="currentColor"/>
                                        </svg>
                                    </span>
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                           placeholder="+91 98765 43210"
                                           className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-5 text-lg text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-300 focus:border-purple-400"
                                           style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
                                           disabled={loading} />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary"
                                    style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
                                {loading
                                    ? <span className="flex items-center gap-2"><Spinner />Saving…</span>
                                    : <span className="flex items-center gap-2">Go to Dashboard →</span>}
                            </button>
                        </form>
                    </>
                )}

                <p className="text-center text-base text-gray-300 mt-8">
                    Signed in as <span className="text-purple-400">{user?.email}</span>
                </p>
            </div>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}

