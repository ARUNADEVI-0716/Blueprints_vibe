import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { ApplicantDashboardSkeleton } from '@/components/Skeleton'
import { useCounter } from '@/hooks/useCounter'

// ── Icon components ───────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
    const icons: Record<string, JSX.Element> = {
        bank: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/></svg>,
        score: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>,
        apply: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
        status: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
        home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
        business: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
        education: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
        car: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
        payment: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
        bulb: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/></svg>,
        arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
        rocket: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
        signout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
        description: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
        check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    }
    return icons[name] || icons['payment']
}

export default function ApplicantDashboard() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const [applications, setApplications] = useState<any[]>([])
    const [creditScore, setCreditScore] = useState<any>(null)
    const [bankConnected, setBankConnected] = useState(false)
    const [loading, setLoading] = useState(true)

    const email = user?.email ?? ''
    const fullName = user?.user_metadata?.full_name ?? ''
    const displayName = fullName || email.split('@')[0]
    const initials = displayName.slice(0, 2).toUpperCase()

    const stats = {
        total:    applications.length,
        approved: applications.filter(a => a.status === 'approved' || a.status === 'repaid').length,
        pending:  applications.filter(a => a.status === 'pending').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    const totalCount    = useCounter(stats.total)
    const approvedCount = useCounter(stats.approved)
    const pendingCount  = useCounter(stats.pending)
    const rejectedCount = useCounter(stats.rejected)

    useEffect(() => {
        fetchDashboardData()
        const channel = supabase
            .channel('applicant_dashboard')
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'loan_applications',
                filter: `user_id=eq.${user?.id}`
            }, (payload) => {
                setApplications(prev =>
                    prev.map(app => app.id === payload.new.id ? { ...app, ...payload.new } : app)
                )
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user?.id])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const { data: apps } = await supabase
                .from('loan_applications').select('*')
                .eq('user_id', user?.id).order('created_at', { ascending: false })
            setApplications(apps || [])

            const { data: score } = await supabase
                .from('credit_scores').select('*')
                .eq('user_id', user?.id)
                .order('calculated_at', { ascending: false }).limit(1).single()
            if (score) setCreditScore(score.breakdown)

            const { data: plaidItems } = await supabase
                .from('plaid_items').select('id').eq('user_id', user?.id).limit(1)
            setBankConnected((plaidItems?.length || 0) > 0)
        } catch {
            // Silent
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        await signOut()
        navigate('/login')
    }

    const getStatusStyle = (status: string) => {
        if (status === 'approved') return { background: '#dcfce7', color: '#15803d' }
        if (status === 'rejected') return { background: '#fee2e2', color: '#dc2626' }
        if (status === 'repaid')   return { background: '#dbeafe', color: '#1d4ed8' }
        return { background: '#fef9c3', color: '#a16207' }
    }

    const getPurposeIcon = (purpose: string) => {
        const p = (purpose || '').toLowerCase()
        if (p.includes('home') || p.includes('house')) return 'home'
        if (p.includes('business')) return 'business'
        if (p.includes('education') || p.includes('study')) return 'education'
        if (p.includes('car') || p.includes('vehicle')) return 'car'
        return 'payment'
    }

    if (loading) return <ApplicantDashboardSkeleton />

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* ── Navbar ─────────────────────────────────────────── */}
            <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: '#001736', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                            </svg>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 18, color: '#001736', letterSpacing: '-0.5px' }}>Nexus</span>
                        <div style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%' }}/>
                    </div>

                    {/* Nav */}
                    <nav style={{ display: 'flex', gap: 28 }}>
                        {[
                            { label: 'Dashboard',    path: '/dashboard' },
                            { label: 'Applications', path: '/loan-status' },
                            { label: 'Credit Score', path: '/credit-score' },
                        ].map((item, i) => (
                            <button key={item.label} onClick={() => navigate(item.path)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: i === 0 ? '#0060ac' : '#43474f', transition: 'color 0.2s' }}
                                    onMouseEnter={e => i !== 0 && (e.currentTarget.style.color = '#001736')}
                                    onMouseLeave={e => i !== 0 && (e.currentTarget.style.color = '#43474f')}>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#001736', margin: 0 }}>{displayName}</p>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Applicant</p>
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#001736', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>
                            {initials}
                        </div>
                        <button onClick={handleLogout} disabled={loggingOut}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #e0e3e5', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#43474f', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget.style.borderColor = '#001736'); (e.currentTarget.style.color = '#001736') }}
                                onMouseLeave={e => { (e.currentTarget.style.borderColor = '#e0e3e5'); (e.currentTarget.style.color = '#43474f') }}>
                            <Icon name="signout" size={14} color="currentColor"/>
                            {loggingOut ? '…' : 'Sign out'}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main ───────────────────────────────────────────── */}
            <main style={{ paddingTop: 96, maxWidth: 1280, margin: '0 auto', padding: '96px 32px 48px' }}>

                {/* Welcome */}
                <section style={{ marginBottom: 32 }}>
                    <h1 style={{ fontWeight: 900, fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#001736', letterSpacing: '-1px', marginBottom: 6 }}>
                        Welcome back, {displayName}
                    </h1>
                    <p style={{ fontSize: 15, color: '#43474f' }}>Your financial overview as of today.</p>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

                    {/* ── Left ─────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Quick Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {[
                                { label: 'Connect Bank', icon: 'bank',   path: '/connect-bank', primary: false, done: bankConnected },
                                { label: 'Credit Score', icon: 'score',  path: '/credit-score', primary: false, done: !!creditScore },
                                { label: 'Apply Loan',   icon: 'apply',  path: '/apply-loan',   primary: true,  done: false },
                                { label: 'Loan Status',  icon: 'status', path: '/loan-status',  primary: false, done: false },
                            ].map(item => (
                                <button key={item.label} onClick={() => navigate(item.path)}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '18px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: item.primary ? '#001736' : 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.primary ? 'rgba(255,255,255,0.12)' : '#eef4ff' }}>
                                        <Icon name={item.icon} size={18} color={item.primary ? 'white' : '#0060ac'}/>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: item.primary ? 'white' : '#001736', display: 'block' }}>{item.label}</span>
                                    {item.done && (
                                        <span style={{ fontSize: 10, fontWeight: 700, color: item.primary ? 'rgba(255,255,255,0.5)' : '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Icon name="check" size={10} color={item.primary ? 'rgba(255,255,255,0.5)' : '#22c55e'}/> Done
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {[
                                { label: 'Total Apps', value: totalCount,    bg: '#f2f4f6', lc: '#43474f', vc: '#001736', dim: false },
                                { label: 'Approved',   value: approvedCount, bg: '#f0fdf4', lc: '#15803d', vc: '#14532d', dim: false },
                                { label: 'Pending',    value: pendingCount,  bg: '#fefce8', lc: '#a16207', vc: '#713f12', dim: false },
                                { label: 'Rejected',   value: rejectedCount, bg: '#f2f4f6', lc: '#43474f', vc: '#001736', dim: true  },
                            ].map(s => (
                                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '20px', opacity: s.dim ? 0.55 : 1 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: s.lc, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{s.label}</p>
                                    <p style={{ fontSize: 34, fontWeight: 900, color: s.vc, letterSpacing: '-1px', margin: 0 }}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Applications */}
                        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f6' }}>
                                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', margin: 0 }}>Recent Applications</h3>
                                <button onClick={() => navigate('/loan-status')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0060ac' }}>
                                    View All →
                                </button>
                            </div>

                            {applications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                                    <div style={{ width: 48, height: 48, background: '#f2f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <Icon name="description" size={22} color="#c4c6d0"/>
                                    </div>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: '#43474f', marginBottom: 6 }}>No applications yet</p>
                                    <p style={{ fontSize: 13, color: '#747780', marginBottom: 20 }}>Apply for your first loan to get started</p>
                                    <button onClick={() => navigate('/apply-loan')}
                                            style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                                        Apply Now
                                    </button>
                                </div>
                            ) : (
                                applications.slice(0, 6).map((app, i) => (
                                    <div key={i} onClick={() => navigate('/loan-status')}
                                         style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < Math.min(applications.length, 6) - 1 ? '1px solid #f7f9fb' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                         onMouseEnter={e => (e.currentTarget.style.background = '#f7f9fb')}
                                         onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f2f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon name={getPurposeIcon(app.purpose)} size={18} color="#001736"/>
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 14, color: '#001736', margin: 0 }}>{app.purpose} Loan</p>
                                                <p style={{ fontSize: 12, color: '#43474f', margin: 0 }}>
                                                    ₹{Number(app.amount).toLocaleString('en-IN')} · {app.tenure}mo · {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 100, ...getStatusStyle(app.status) }}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Right ─────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Credit Score Card */}
                        <div style={{ background: '#002b5b', borderRadius: 16, padding: '28px 24px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, background: 'rgba(0,96,172,0.35)', borderRadius: '50%', filter: 'blur(40px)' }}/>
                            <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '50%', filter: 'blur(30px)' }}/>

                            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20, position: 'relative', zIndex: 1 }}>
                                Credit Performance
                            </p>

                            {creditScore ? (
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <svg width="148" height="148" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="74" cy="74" r="62" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9"/>
                                            <circle cx="74" cy="74" r="62" fill="none" stroke="#68abff" strokeWidth="9"
                                                    strokeDasharray="389" strokeDashoffset={389 - (389 * ((creditScore.score - 300) / 650))}
                                                    strokeLinecap="round"/>
                                        </svg>
                                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: 38, fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>{creditScore.score}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#68abff', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{creditScore.grade}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>
                                        {creditScore.riskLevel} · {creditScore.isColdStart ? 'Cold Start' : 'Hybrid Model'}
                                    </p>
                                    <button onClick={() => navigate('/credit-score')}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#68abff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        Full Report <Icon name="arrow" size={14} color="#68abff"/>
                                    </button>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                        <Icon name="score" size={28} color="rgba(255,255,255,0.35)"/>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>No credit score yet</p>
                                    <button onClick={() => navigate('/connect-bank')}
                                            style={{ background: '#0060ac', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
                                        Connect Bank to Score
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Financial Tip */}
                        <div style={{ background: 'white', borderRadius: 12, padding: '22px', border: '1px solid #e0e3e5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Icon name="bulb" size={18} color="#0060ac"/>
                                <h4 style={{ fontWeight: 800, fontSize: 14, color: '#001736', margin: 0 }}>Financial Tip</h4>
                            </div>
                            <p style={{ fontSize: 13, color: '#43474f', lineHeight: 1.65, marginBottom: 14 }}>
                                Lowering your credit utilization below 30% could boost your score by up to 25 points before your next application.
                            </p>
                            <button onClick={() => navigate('/credit-score')}
                                    style={{ width: '100%', padding: '9px', background: '#eef4ff', color: '#0060ac', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { (e.currentTarget.style.background = '#0060ac'); (e.currentTarget.style.color = 'white') }}
                                    onMouseLeave={e => { (e.currentTarget.style.background = '#eef4ff'); (e.currentTarget.style.color = '#0060ac') }}>
                                Learn More
                            </button>
                        </div>

                        {/* CTA if no credit score */}
                        {!creditScore && (
                            <div style={{ background: 'linear-gradient(135deg, #001736, #0060ac)', borderRadius: 12, padding: '22px' }}>
                                <div style={{ marginBottom: 10 }}>
                                    <Icon name="rocket" size={24} color="white"/>
                                </div>
                                <p style={{ fontWeight: 800, fontSize: 14, color: 'white', marginBottom: 6 }}>Get Your Credit Score</p>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.5 }}>
                                    Connect your bank to generate your AI-powered credit score instantly.
                                </p>
                                <button onClick={() => navigate('/connect-bank')}
                                        style={{ background: 'white', color: '#001736', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer', width: '100%' }}>
                                    Connect Bank →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}