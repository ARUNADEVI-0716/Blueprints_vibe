import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

export default function OnboardingPage() {
    const { user } = useAuth()
    const navigate  = useNavigate()
    const [name, setName]       = useState('')
    const [age, setAge]         = useState('')
    const [phone, setPhone]     = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')

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

    const inputStyle = {
        width: '100%',
        padding: '13px 16px 13px 44px',
        background: '#f2f4f6',
        border: '1.5px solid transparent',
        borderRadius: 8,
        fontSize: 15,
        color: '#191c1e',
        outline: 'none',
        boxSizing: 'border-box' as const,
        transition: 'all 0.2s',
        fontFamily: 'Public Sans, Inter, sans-serif',
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
                <div style={{ width: 34, height: 34, background: '#001736', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                        <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                        <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                        <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                        <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                    </svg>
                </div>
                <span style={{ fontWeight: 900, fontSize: 20, color: '#001736', letterSpacing: '-0.5px' }}>Nexus</span>
            </div>

            {/* Card */}
            <div style={{ width: '100%', maxWidth: 480, background: 'white', borderRadius: 16, padding: '40px', border: '1px solid #e0e3e5', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

                {/* Progress steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
                    {[
                        { num: '✓', label: 'Account Created', done: true,   active: false },
                        { num: '2', label: 'Your Details',    done: false,  active: true  },
                        { num: '3', label: 'Dashboard',       done: false,  active: false },
                    ].map((s, i) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: 13,
                                    background: s.done ? '#001736' : s.active ? '#0060ac' : '#eceef0',
                                    color: s.done || s.active ? 'white' : '#c4c6d0',
                                    flexShrink: 0
                                }}>
                                    {s.num}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: s.active ? 700 : 500, color: s.done ? '#001736' : s.active ? '#0060ac' : '#c4c6d0', whiteSpace: 'nowrap' }}>
                                    {s.label}
                                </span>
                            </div>
                            {i < 2 && (
                                <div style={{ flex: 1, height: 1, background: s.done ? '#001736' : '#e0e3e5', margin: '0 10px' }}/>
                            )}
                        </div>
                    ))}
                </div>

                {/* Heading */}
                <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                        Applicant
                    </p>
                    <h1 style={{ fontWeight: 900, fontSize: 26, color: '#001736', letterSpacing: '-0.5px', marginBottom: 6 }}>
                        Tell us about yourself
                    </h1>
                    <p style={{ fontSize: 14, color: '#43474f' }}>Just a few details to get you started.</p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '11px 16px', marginBottom: 20, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Full Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Full Name
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780' }}>
                                <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                                    <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M2 13c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                   placeholder="John Doe" autoComplete="name" disabled={loading}
                                   style={inputStyle}
                                   onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                   onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                        </div>
                    </div>

                    {/* Age */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Age
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780' }}>
                                <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                                    <rect x="2" y="2" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M7.5 5v5M5 7.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                </svg>
                            </span>
                            <input type="number" value={age} onChange={e => setAge(e.target.value)}
                                   placeholder="25" min="18" max="100" disabled={loading}
                                   style={inputStyle}
                                   onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                   onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                        </div>
                        <p style={{ fontSize: 12, color: '#c4c6d0', marginTop: 5 }}>Must be 18 or older</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Phone Number <span style={{ fontSize: 10, color: '#c4c6d0', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#747780' }}>
                                <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                                    <rect x="4" y="1" width="7" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                    <circle cx="7.5" cy="11.5" r="0.75" fill="currentColor"/>
                                </svg>
                            </span>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                   placeholder="+91 98765 43210" disabled={loading}
                                   style={inputStyle}
                                   onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                   onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '14px', background: '#001736', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#002b5b') }}
                            onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#001736') }}>
                        {loading ? <><Spinner/> Saving…</> : 'Go to Dashboard →'}
                    </button>
                </form>

                {/* Footer */}
                <p style={{ textAlign: 'center', fontSize: 12, color: '#c4c6d0', marginTop: 24 }}>
                    Signed in as <span style={{ color: '#0060ac', fontWeight: 600 }}>{user?.email}</span>
                </p>
            </div>

            {/* Bottom copyright */}
            <p style={{ fontSize: 11, color: '#c4c6d0', marginTop: 28 }}>
                © 2026 Nexus Financial Technologies. All rights reserved.
            </p>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}