import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { OfficerDashboardSkeleton } from '@/components/Skeleton'
import { useCounter } from '@/hooks/useCounter'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function OfficerDashboard() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    const [search, setSearch] = useState('')
    const [token, setToken] = useState('')
    const [activeNav, setActiveNav] = useState('applications')
    const [showFilterPanel, setShowFilterPanel] = useState(false)
    const [showDatePanel, setShowDatePanel] = useState(false)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [minScore, setMinScore] = useState('')
    const [maxScore, setMaxScore] = useState('')
    const [filterUserType, setFilterUserType] = useState<'all' | 'new' | 'existing'>('all')
    const [filterPurpose, setFilterPurpose] = useState('')

    const officerEmail = localStorage.getItem('officer_email') || 'Officer'
    const officerInitials = officerEmail.slice(0, 2).toUpperCase()

    const stats = {
        total:    applications.length,
        pending:  applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved' || a.status === 'repaid').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    const totalCount    = useCounter(stats.total)
    const pendingCount  = useCounter(stats.pending)
    const approvedCount = useCounter(stats.approved)
    const rejectedCount = useCounter(stats.rejected)

    const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0
    const totalDisbursed = applications
        .filter(a => a.status === 'approved' || a.status === 'repaid')
        .reduce((sum, a) => sum + Number(a.amount || 0), 0)
    const avgScore = applications.filter(a => a.credit_score).length > 0
        ? Math.round(applications.filter(a => a.credit_score).reduce((s, a) => s + a.credit_score, 0) / applications.filter(a => a.credit_score).length)
        : 0

    const purposeCounts = applications.reduce((acc: Record<string, number>, a) => {
        const p = a.purpose || 'Other'
        acc[p] = (acc[p] || 0) + 1
        return acc
    }, {})

    const uniquePurposes = Array.from(new Set(applications.map(a => a.purpose).filter(Boolean)))

    useEffect(() => {
        const link = document.createElement('link')
        link.rel  = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
        document.head.appendChild(link)

        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { navigate('/officer/login'); return }

            const allowedEmail = import.meta.env.VITE_OFFICER_EMAIL
            if (allowedEmail && session.user.email !== allowedEmail) {
                navigate('/officer/login'); return
            }

            setToken(session.access_token)
            localStorage.setItem('officer_token', session.access_token)
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) { navigate('/officer/login') }
            else if (event === 'TOKEN_REFRESHED' && session) {
                setToken(session.access_token)
                localStorage.setItem('officer_token', session.access_token)
            }
        })

        void initAuth()
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (!token) return
        fetchApplications()
        const interval = setInterval(fetchApplications, 5000)
        return () => clearInterval(interval)
    }, [token])

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/applications`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.status === 401) { navigate('/officer/login'); return }
            const data = await res.json()
            setApplications(data || [])
        } catch { setError('Failed to load applications') }
        finally { setLoading(false) }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('officer_token')
        localStorage.removeItem('officer_email')
        localStorage.removeItem('officer_totp_verified')
        navigate('/officer/login')
    }

    const clearFilters = () => {
        setMinScore(''); setMaxScore(''); setFilterUserType('all'); setFilterPurpose('')
        setDateFrom(''); setDateTo('')
    }

    const filtered = applications.filter(app => {
        if (filter !== 'all' && app.status !== filter) return false
        if (search) {
            const q = search.toLowerCase()
            if (!app.full_name?.toLowerCase().includes(q) &&
                !app.email?.toLowerCase().includes(q) &&
                !app.purpose?.toLowerCase().includes(q)) return false
        }
        if (minScore && app.credit_score < Number(minScore)) return false
        if (maxScore && app.credit_score > Number(maxScore)) return false
        if (filterUserType !== 'all' && app.user_type !== filterUserType) return false
        if (filterPurpose && app.purpose !== filterPurpose) return false
        if (dateFrom && new Date(app.created_at) < new Date(dateFrom)) return false
        if (dateTo) {
            const to = new Date(dateTo); to.setHours(23, 59, 59)
            if (new Date(app.created_at) > to) return false
        }
        return true
    })

    const activeFiltersCount = [minScore, maxScore, filterUserType !== 'all' ? filterUserType : '', filterPurpose, dateFrom, dateTo].filter(Boolean).length

    const getStatusDot   = (s: string) => s === 'approved' || s === 'repaid' ? '#16a34a' : s === 'rejected' ? '#ba1a1a' : '#0060ac'
    const getStatusLabel = (s: string) => s === 'repaid' ? 'Repaid' : s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending'
    const getScoreLabel  = (s: number) => s >= 800 ? 'Exceptional' : s >= 750 ? 'Excellent' : s >= 700 ? 'Good' : s >= 650 ? 'Fair' : 'Poor'

    const msIcon = (name: string, size = 20, color?: string) => (
        <span className="material-symbols-outlined" style={{ fontSize: size, color, lineHeight: 1 }}>{name}</span>
    )

    const navItems = [
        { key: 'overview',     icon: 'dashboard',    label: 'Overview' },
        { key: 'applications', icon: 'description',  label: 'Applications' },
        { key: 'underwriting', icon: 'verified_user', label: 'Underwriting' },
        { key: 'reports',      icon: 'analytics',    label: 'Reports' },
        { key: 'settings',     icon: 'settings',     label: 'Settings' },
    ]

    if (loading) return <OfficerDashboardSkeleton />

    // ── Sub-views ─────────────────────────────────────────────

    const OverviewView = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontWeight: 900, fontSize: 26, color: '#001736', letterSpacing: '-0.5px', marginBottom: 4 }}>Portfolio Overview</h2>
                <p style={{ fontSize: 14, color: '#43474f' }}>Real-time summary of all loan activity.</p>
            </div>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    { label: 'Approval Rate',      value: `${approvalRate}%`,                        icon: 'percent',         color: '#16a34a' },
                    { label: 'Total Disbursed',    value: `₹${(totalDisbursed/100000).toFixed(1)}L`, icon: 'payments',        color: '#0060ac' },
                    { label: 'Avg. Credit Score',  value: avgScore || '—',                           icon: 'speed',           color: '#7c3aed' },
                    { label: 'Pending Review',     value: stats.pending,                             icon: 'pending_actions', color: '#d97706' },
                ].map(k => (
                    <div key={k.label} style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #e0e3e5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</span>
                            {msIcon(k.icon, 18, k.color)}
                        </div>
                        <p style={{ fontWeight: 900, fontSize: 30, color: '#001736', letterSpacing: '-1px', margin: 0 }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Status breakdown */}
            <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 20 }}>Status Breakdown</h3>
                {[
                    { label: 'Approved / Repaid', count: stats.approved, color: '#16a34a', total: stats.total },
                    { label: 'Pending Review',    count: stats.pending,  color: '#0060ac', total: stats.total },
                    { label: 'Rejected',          count: stats.rejected, color: '#ba1a1a', total: stats.total },
                ].map(b => (
                    <div key={b.label} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#43474f' }}>{b.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.count} <span style={{ color: '#c4c6d0', fontWeight: 400 }}>/ {b.total}</span></span>
                        </div>
                        <div style={{ height: 6, background: '#f2f4f6', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{ width: `${b.total > 0 ? (b.count / b.total) * 100 : 0}%`, height: '100%', background: b.color, borderRadius: 100, transition: 'width 0.8s ease' }}/>
                        </div>
                    </div>
                ))}
            </div>

            {/* Purpose breakdown */}
            <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 16 }}>Applications by Purpose</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {Object.entries(purposeCounts).sort(([,a],[,b]) => b - a).map(([purpose, count]) => (
                        <div key={purpose} style={{ background: '#f7f9fb', borderRadius: 10, padding: '14px 16px', border: '1px solid #e0e3e5' }}>
                            <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', marginBottom: 4 }}>{purpose}</p>
                            <p style={{ fontWeight: 900, fontSize: 22, color: '#0060ac', margin: 0 }}>{count}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent activity */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e3e5', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f2f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', margin: 0 }}>Recent Applications</h3>
                    <button onClick={() => setActiveNav('applications')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0060ac' }}>
                        View All →
                    </button>
                </div>
                {applications.slice(0, 5).map((app, i) => (
                    <div key={app.id}
                         onClick={() => navigate(`/officer/applications/${app.id}`)}
                         style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < 4 ? '1px solid #f7f9fb' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                         onMouseEnter={e => (e.currentTarget.style.background = '#f7f9fb')}
                         onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#001736', flexShrink: 0 }}>
                                {(app.full_name || '?').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', margin: 0 }}>{app.full_name || 'Unknown'}</p>
                                <p style={{ fontSize: 11, color: '#43474f', margin: 0 }}>{app.purpose} · ₹{Number(app.amount).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: getStatusDot(app.status) }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusDot(app.status) }}/>
                            {getStatusLabel(app.status)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )

    const UnderwritingView = () => {
        const pending = applications.filter(a => a.status === 'pending')
        const highRisk = pending.filter(a => a.credit_score && a.credit_score < 550)
        const coldStart = pending.filter(a => a.user_type === 'new')
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                    <h2 style={{ fontWeight: 900, fontSize: 26, color: '#001736', letterSpacing: '-0.5px', marginBottom: 4 }}>Underwriting Queue</h2>
                    <p style={{ fontSize: 14, color: '#43474f' }}>{pending.length} applications awaiting review.</p>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {[
                        { label: 'Total Pending', value: pending.length, icon: 'pending_actions', color: '#0060ac' },
                        { label: 'High Risk',     value: highRisk.length, icon: 'warning',         color: '#ba1a1a' },
                        { label: 'Cold Start',    value: coldStart.length, icon: 'person_add',      color: '#7c3aed' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #e0e3e5', display: 'flex', alignItems: 'center', gap: 14 }}>
                            {msIcon(s.icon, 22, s.color)}
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, marginBottom: 2 }}>{s.label}</p>
                                <p style={{ fontWeight: 900, fontSize: 24, color: s.color, margin: 0, letterSpacing: '-1px' }}>{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Priority queue */}
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e3e5', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f2f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {msIcon('pending_actions', 18, '#0060ac')}
                        <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', margin: 0 }}>Pending Applications — Priority Order</h3>
                    </div>
                    {pending.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px' }}>
                            {msIcon('check_circle', 40, '#22c55e')}
                            <p style={{ fontWeight: 700, fontSize: 15, color: '#43474f', marginTop: 12 }}>All caught up!</p>
                            <p style={{ fontSize: 13, color: '#747780' }}>No pending applications in the queue.</p>
                        </div>
                    ) : pending.map((app, i) => {
                        const isHighRisk = app.credit_score && app.credit_score < 550
                        const isColdStart = app.user_type === 'new'
                        const ageHours = Math.floor((Date.now() - new Date(app.created_at).getTime()) / 3600000)
                        return (
                            <div key={app.id}
                                 style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 16, alignItems: 'center', borderBottom: i < pending.length - 1 ? '1px solid #f2f4f6' : 'none', background: isHighRisk ? '#fef9f9' : 'white', transition: 'background 0.15s', cursor: 'pointer' }}
                                 onMouseEnter={e => (e.currentTarget.style.background = '#f7f9fb')}
                                 onMouseLeave={e => (e.currentTarget.style.background = isHighRisk ? '#fef9f9' : 'white')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#001736', flexShrink: 0 }}>
                                        {(app.full_name || '?').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', margin: 0 }}>{app.full_name || 'Unknown'}</p>
                                        <p style={{ fontSize: 11, color: '#43474f', margin: 0 }}>{app.purpose} · ₹{Number(app.amount).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {isHighRisk && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#fee2e2', color: '#ba1a1a' }}>High Risk</span>}
                                    {isColdStart && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#eef4ff', color: '#0060ac' }}>Cold Start</span>}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    {app.credit_score ? (
                                        <span style={{ fontSize: 13, fontWeight: 800, color: app.credit_score >= 700 ? '#16a34a' : app.credit_score >= 550 ? '#d97706' : '#ba1a1a' }}>{app.credit_score}</span>
                                    ) : <span style={{ fontSize: 12, color: '#c4c6d0' }}>No Score</span>}
                                </div>
                                <span style={{ fontSize: 11, color: ageHours > 24 ? '#ba1a1a' : '#747780', fontWeight: ageHours > 24 ? 700 : 400 }}>
                                    {ageHours}h ago
                                </span>
                                <button onClick={() => navigate(`/officer/applications/${app.id}`)}
                                        style={{ padding: '7px 16px', background: '#0060ac', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                    Review
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const ReportsView = () => {
        const scoreRanges = [
            { label: '800–950 Exceptional', min: 800, max: 951, color: '#16a34a' },
            { label: '700–799 Good',         min: 700, max: 800, color: '#0060ac' },
            { label: '600–699 Fair',         min: 600, max: 700, color: '#7c3aed' },
            { label: '500–599 Weak',         min: 500, max: 600, color: '#d97706' },
            { label: 'Below 500',            min: 0,   max: 500, color: '#ba1a1a' },
        ]
        const totalWithScore = applications.filter(a => a.credit_score).length

        const monthly: Record<string, { approved: number; rejected: number; pending: number }> = {}
        applications.forEach(app => {
            const month = new Date(app.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
            if (!monthly[month]) monthly[month] = { approved: 0, rejected: 0, pending: 0 }
            if (app.status === 'approved' || app.status === 'repaid') monthly[month].approved++
            else if (app.status === 'rejected') monthly[month].rejected++
            else monthly[month].pending++
        })
        const months = Object.entries(monthly).slice(-6)
        const maxMonthly = Math.max(...months.map(([, v]) => v.approved + v.rejected + v.pending), 1)

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                    <h2 style={{ fontWeight: 900, fontSize: 26, color: '#001736', letterSpacing: '-0.5px', marginBottom: 4 }}>Reports & Analytics</h2>
                    <p style={{ fontSize: 14, color: '#43474f' }}>Portfolio performance and trend analysis.</p>
                </div>

                {/* Summary KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[
                        { label: 'Total Applications', value: stats.total,     icon: 'layers',     color: '#001736' },
                        { label: 'Approval Rate',      value: `${approvalRate}%`, icon: 'percent',    color: '#16a34a' },
                        { label: 'Avg Credit Score',   value: avgScore || '—', icon: 'speed',      color: '#0060ac' },
                        { label: 'Total Volume',       value: `₹${(totalDisbursed/100000).toFixed(1)}L`, icon: 'payments', color: '#7c3aed' },
                    ].map(k => (
                        <div key={k.label} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #e0e3e5' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</span>
                                {msIcon(k.icon, 16, k.color)}
                            </div>
                            <p style={{ fontWeight: 900, fontSize: 28, color: '#001736', letterSpacing: '-1px', margin: 0 }}>{k.value}</p>
                        </div>
                    ))}
                </div>

                {/* Monthly trend — SVG bar chart */}
                {months.length > 0 && (
                    <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                        <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 20 }}>Monthly Volume</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 140, padding: '0 8px' }}>
                            {months.map(([month, v]) => {
                                const total = v.approved + v.rejected + v.pending
                                const h = Math.round((total / maxMonthly) * 120)
                                const aH = Math.round((v.approved / Math.max(total, 1)) * h)
                                const rH = Math.round((v.rejected / Math.max(total, 1)) * h)
                                const pH = h - aH - rH
                                return (
                                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#001736' }}>{total}</span>
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                                            {aH > 0 && <div style={{ height: aH, background: '#16a34a' }}/>}
                                            {pH > 0 && <div style={{ height: pH, background: '#0060ac' }}/>}
                                            {rH > 0 && <div style={{ height: rH, background: '#ba1a1a' }}/>}
                                        </div>
                                        <span style={{ fontSize: 10, color: '#747780' }}>{month}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
                            {[['#16a34a', 'Approved'], ['#0060ac', 'Pending'], ['#ba1a1a', 'Rejected']].map(([c, l]) => (
                                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c }}/>
                                    <span style={{ fontSize: 11, color: '#43474f' }}>{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Credit score distribution */}
                <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                    <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 16 }}>Credit Score Distribution</h3>
                    {scoreRanges.map(r => {
                        const count = applications.filter(a => a.credit_score >= r.min && a.credit_score < r.max).length
                        const pct   = totalWithScore > 0 ? Math.round((count / totalWithScore) * 100) : 0
                        return (
                            <div key={r.label} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#43474f' }}>{r.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{count} <span style={{ color: '#c4c6d0', fontWeight: 400 }}>({pct}%)</span></span>
                                </div>
                                <div style={{ height: 6, background: '#f2f4f6', borderRadius: 100, overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: r.color, borderRadius: 100, transition: 'width 0.8s' }}/>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Purpose breakdown table */}
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e3e5', overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f2f4f6' }}>
                        <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', margin: 0 }}>Applications by Loan Purpose</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f7f9fb' }}>
                        <tr>
                            {['Purpose', 'Applications', 'Approved', 'Rejected', 'Approval Rate'].map(h => (
                                <th key={h} style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(purposeCounts).sort(([,a],[,b]) => b - a).map(([purpose, count], i) => {
                            const purposeApps = applications.filter(a => a.purpose === purpose)
                            const approved    = purposeApps.filter(a => a.status === 'approved' || a.status === 'repaid').length
                            const rejected    = purposeApps.filter(a => a.status === 'rejected').length
                            const rate        = count > 0 ? Math.round((approved / count) * 100) : 0
                            return (
                                <tr key={purpose} style={{ borderTop: '1px solid #f2f4f6', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#001736' }}>{purpose}</td>
                                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#001736' }}>{count}</td>
                                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{approved}</td>
                                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#ba1a1a' }}>{rejected}</td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 60 ? '#16a34a' : rate >= 40 ? '#d97706' : '#ba1a1a' }}>{rate}%</span>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    const SettingsView = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
            <div>
                <h2 style={{ fontWeight: 900, fontSize: 26, color: '#001736', letterSpacing: '-0.5px', marginBottom: 4 }}>Settings</h2>
                <p style={{ fontSize: 14, color: '#43474f' }}>Officer account and dashboard preferences.</p>
            </div>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e3e5', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f2f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {msIcon('account_circle', 18, '#001736')}
                    <h3 style={{ fontWeight: 700, fontSize: 14, color: '#001736', margin: 0 }}>Account</h3>
                </div>
                {[
                    { label: 'Email',      value: officerEmail },
                    { label: 'Role',       value: 'Loan Officer' },
                    { label: 'Auth',       value: 'Supabase + TOTP' },
                    { label: 'Refresh',    value: 'Every 5 seconds' },
                ].map(row => (
                    <div key={row.label} style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f7f9fb' }}>
                        <span style={{ fontSize: 13, color: '#747780' }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#001736' }}>{row.value}</span>
                    </div>
                ))}
            </div>
            <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', color: '#ba1a1a', border: '1px solid #fecaca', borderRadius: 10, padding: '13px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: 'fit-content', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ba1a1a'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.color = '#ba1a1a' }}>
                {msIcon('logout', 18)}
                Sign Out
            </button>
        </div>
    )

    const ApplicationsView = () => (
        <>
            {/* Search + Filters */}
            <section style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#43474f' }}>search</span>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                               placeholder="Search by name, application ID, or email..."
                               style={{ width: '100%', height: 48, paddingLeft: 40, paddingRight: 16, background: '#eceef0', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                               onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 2px rgba(0,96,172,0.2)' }}
                               onBlur={e => { e.target.style.background = '#eceef0'; e.target.style.boxShadow = 'none' }}/>
                    </div>

                    {/* Filter button */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => { setShowFilterPanel(p => !p); setShowDatePanel(false) }}
                                style={{ height: 48, padding: '0 18px', background: activeFiltersCount > 0 ? '#001736' : '#eceef0', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: activeFiltersCount > 0 ? 'white' : '#001736', cursor: 'pointer', transition: 'all 0.2s' }}>
                            {msIcon('filter_list', 18, activeFiltersCount > 0 ? 'white' : '#001736')}
                            Filters
                            {activeFiltersCount > 0 && (
                                <span style={{ background: '#68abff', color: '#001736', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFiltersCount}</span>
                            )}
                        </button>

                        {/* Filter dropdown */}
                        {showFilterPanel && (
                            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, background: 'white', border: '1px solid #e0e3e5', borderRadius: 12, padding: 20, width: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: '#001736', margin: 0 }}>Filter Applications</p>
                                    <button onClick={clearFilters} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: '#0060ac', cursor: 'pointer' }}>Clear All</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Credit Score Range</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input type="number" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="Min"
                                                   style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e0e3e5', borderRadius: 8, fontSize: 13, outline: 'none' }}/>
                                            <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="Max"
                                                   style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #e0e3e5', borderRadius: 8, fontSize: 13, outline: 'none' }}/>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>User Type</label>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {(['all', 'new', 'existing'] as const).map(t => (
                                                <button key={t} onClick={() => setFilterUserType(t)}
                                                        style={{ flex: 1, padding: '7px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filterUserType === t ? '#001736' : '#f2f4f6', color: filterUserType === t ? 'white' : '#43474f', textTransform: 'capitalize' }}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Loan Purpose</label>
                                        <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0e3e5', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white' }}>
                                            <option value="">All Purposes</option>
                                            {uniquePurposes.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button onClick={() => setShowFilterPanel(false)}
                                        style={{ marginTop: 16, width: '100%', padding: '10px', background: '#001736', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    Apply Filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Date range button */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => { setShowDatePanel(p => !p); setShowFilterPanel(false) }}
                                style={{ height: 48, padding: '0 18px', background: (dateFrom || dateTo) ? '#001736' : '#eceef0', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: (dateFrom || dateTo) ? 'white' : '#001736', cursor: 'pointer' }}>
                            {msIcon('calendar_today', 18, (dateFrom || dateTo) ? 'white' : '#001736')}
                            Date Range
                        </button>

                        {showDatePanel && (
                            <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, background: 'white', border: '1px solid #e0e3e5', borderRadius: 12, padding: 20, width: 260, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontWeight: 800, fontSize: 14, color: '#001736', margin: 0, marginBottom: 14 }}>Filter by Date</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>From</label>
                                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                               style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0e3e5', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>To</label>
                                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                               style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e0e3e5', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}/>
                                    </div>
                                    <button onClick={() => { setDateFrom(''); setDateTo('') }}
                                            style={{ width: '100%', padding: '8px', background: '#f2f4f6', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#43474f', cursor: 'pointer' }}>
                                        Clear Dates
                                    </button>
                                    <button onClick={() => setShowDatePanel(false)}
                                            style={{ width: '100%', padding: '9px', background: '#001736', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status pills */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', background: filter === f ? '#001736' : 'white', color: filter === f ? 'white' : '#43474f', boxShadow: filter === f ? 'none' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}>
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Close dropdowns on outside click */}
                    {(showFilterPanel || showDatePanel) && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => { setShowFilterPanel(false); setShowDatePanel(false) }}/>
                    )}
                </div>
            </section>

            {/* Table */}
            <section style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f2f4f6' }}>
                        <tr>
                            {['Applicant', 'Amount', 'Purpose', 'Credit Score', 'User Type', 'Date', 'Status', ''].map(h => (
                                <th key={h} style={{ padding: '12px 20px', fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '56px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#c4c6d0', display: 'block', marginBottom: 10 }}>manage_search</span>
                                <p style={{ fontWeight: 700, fontSize: 14, color: '#43474f', margin: 0, marginBottom: 4 }}>No applications found</p>
                                <p style={{ fontSize: 12, color: '#747780', margin: 0 }}>Try adjusting your search or filters</p>
                            </td></tr>
                        ) : filtered.map((app, i) => (
                            <tr key={app.id}
                                style={{ borderTop: '1px solid #f2f4f6', cursor: 'default', transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,238,240,0.3)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#001736', flexShrink: 0 }}>
                                            {(app.full_name || '?').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', margin: 0, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.full_name || 'Unknown'}</p>
                                            <p style={{ fontSize: 11, color: '#43474f', margin: 0, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.email}</p>
                                        </div>
                                    </div>
                                </td>

                                <td style={{ padding: '16px 20px' }}>
                                    <p style={{ fontWeight: 900, fontSize: 13, color: '#001736', margin: 0 }}>₹{Number(app.amount).toLocaleString('en-IN')}</p>
                                    <p style={{ fontSize: 10, color: '#43474f', margin: 0 }}>{app.tenure}mo</p>
                                </td>

                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: '#43474f' }}>{app.purpose}</span>
                                </td>

                                <td style={{ padding: '16px 20px' }}>
                                    {app.credit_score ? (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, background: app.credit_score >= 700 ? '#042e4e' : '#eceef0', color: app.credit_score >= 700 ? '#a9c9f1' : '#43474f' }}>
                                            <span style={{ fontWeight: 800, fontSize: 11 }}>{app.credit_score}</span>
                                            <span style={{ fontSize: 10, opacity: 0.6 }}>{getScoreLabel(app.credit_score)}</span>
                                        </div>
                                    ) : <span style={{ fontSize: 12, color: '#c4c6d0' }}>N/A</span>}
                                </td>

                                <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', background: app.user_type === 'existing' ? '#d4e3ff' : '#eceef0', color: app.user_type === 'existing' ? '#004883' : '#43474f' }}>
                                            {app.user_type === 'existing' ? 'Returning' : 'New'}
                                        </span>
                                </td>

                                <td style={{ padding: '16px 20px' }}>
                                    <p style={{ fontSize: 12, color: '#43474f', margin: 0 }}>{new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                                    <p style={{ fontSize: 10, color: '#747780', margin: 0 }}>{new Date(app.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                </td>

                                <td style={{ padding: '16px 20px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: getStatusDot(app.status) }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusDot(app.status), flexShrink: 0 }}/>
                                            {getStatusLabel(app.status)}
                                        </span>
                                </td>

                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    <button onClick={() => navigate(`/officer/applications/${app.id}`)}
                                            style={{ padding: '6px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: app.status === 'pending' ? 'rgba(0,96,172,0.1)' : app.status === 'approved' || app.status === 'repaid' ? 'rgba(22,163,74,0.1)' : 'rgba(186,26,26,0.1)', color: app.status === 'pending' ? '#0060ac' : app.status === 'approved' || app.status === 'repaid' ? '#16a34a' : '#ba1a1a', whiteSpace: 'nowrap' }}
                                            onMouseEnter={e => {
                                                const btn = e.currentTarget as HTMLButtonElement
                                                btn.style.background = app.status === 'pending' ? '#0060ac' : app.status === 'approved' || app.status === 'repaid' ? '#16a34a' : '#ba1a1a'
                                                btn.style.color = 'white'
                                            }}
                                            onMouseLeave={e => {
                                                const btn = e.currentTarget as HTMLButtonElement
                                                btn.style.background = app.status === 'pending' ? 'rgba(0,96,172,0.1)' : app.status === 'approved' || app.status === 'repaid' ? 'rgba(22,163,74,0.1)' : 'rgba(186,26,26,0.1)'
                                                btn.style.color = app.status === 'pending' ? '#0060ac' : app.status === 'approved' || app.status === 'repaid' ? '#16a34a' : '#ba1a1a'
                                            }}>
                                        {app.status === 'pending' ? 'Review' : 'View'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '12px 20px', background: '#f2f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#43474f' }}>
                        Showing {filtered.length} of {applications.length} applications · Auto-refreshes every 5s
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[{ icon: 'chevron_left' }, { icon: 'chevron_right' }].map(b => (
                            <button key={b.icon} style={{ padding: 6, background: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#43474f', display: 'flex', alignItems: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{b.icon}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )

    return (
        <div style={{ fontFamily: 'Public Sans, Inter, sans-serif', background: '#f7f9fb', minHeight: '100vh' }}>

            {/* ── Sidebar ────────────────────────────────────── */}
            <aside style={{ position: 'fixed', left: 0, top: 0, width: 256, height: '100vh', background: '#f8fafc', borderRight: '1px solid #e0e3e5', display: 'flex', flexDirection: 'column', padding: '24px 16px', zIndex: 40 }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#001736', letterSpacing: '-0.5px', marginBottom: 32, padding: '0 8px' }}>NEXUS FINTECH</div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    {navItems.map(item => {
                        const isActive = activeNav === item.key
                        return (
                            <button key={item.key} onClick={() => setActiveNav(item.key)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500, background: isActive ? 'white' : 'transparent', color: isActive ? '#001736' : '#64748b', boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.15s', textAlign: 'left', width: '100%' }}
                                    onMouseEnter={e => !isActive && ((e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9')}
                                    onMouseLeave={e => !isActive && ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: isActive ? '#001736' : '#94a3b8' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                <div style={{ background: '#002b5b', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#68abff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#001736', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                        {officerInitials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{officerEmail.split('@')[0]}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Loan Officer</p>
                    </div>
                    <button onClick={handleLogout} title="Sign out"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 4, borderRadius: 6, flexShrink: 0, transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Top AppBar ─────────────────────────────────── */}
            <header style={{ position: 'fixed', top: 0, left: 256, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e2e8f0', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#001736' }}>account_balance</span>
                    <h1 style={{ fontWeight: 800, fontSize: 18, color: '#001736', letterSpacing: '-0.5px', margin: 0 }}>Officer Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#d4e3ff', padding: '3px 10px', borderRadius: 100 }}>
                        <div style={{ width: 7, height: 7, background: '#0060ac', borderRadius: '50%' }}/>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#001c39', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live System</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[{ icon: 'notifications' }, { icon: 'search' }].map(b => (
                        <button key={b.icon} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{b.icon}</span>
                        </button>
                    ))}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#001736', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer', border: '2px solid #e0e3e5' }}>
                        {officerInitials}
                    </div>
                </div>
            </header>

            {/* ── Main Content ───────────────────────────────── */}
            <main style={{ marginLeft: 256, paddingTop: 64, minHeight: '100vh' }}>
                <div style={{ padding: '32px 28px' }}>

                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 20, fontSize: 14 }}>
                            {error}
                        </div>
                    )}

                    {/* Stats row — always visible */}
                    <section style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
                            {[
                                { label: 'Total Applications', value: totalCount,    border: '#001736', icon: 'layers',          iconColor: '#001736', sub: 'All time',         filterKey: 'all' },
                                { label: 'Pending Review',     value: pendingCount,  border: '#0060ac', icon: 'pending_actions', iconColor: '#0060ac', sub: 'Awaiting decision', filterKey: 'pending' },
                                { label: 'Approved',           value: approvedCount, border: '#16a34a', icon: 'verified',        iconColor: '#16a34a', sub: 'Including repaid',  filterKey: 'approved' },
                                { label: 'Rejected',           value: rejectedCount, border: '#ba1a1a', icon: 'block',           iconColor: '#ba1a1a', sub: 'Declined',          filterKey: 'rejected' },
                            ].map(card => (
                                <div key={card.label}
                                     onClick={() => { setFilter(card.filterKey as any); setActiveNav('applications') }}
                                     style={{ flexShrink: 0, width: 220, background: 'white', borderRadius: 12, padding: '18px', borderLeft: `4px solid ${card.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}
                                     onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.background = '#f7f9fb' }}
                                     onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLDivElement).style.background = 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{card.label}</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: card.iconColor, opacity: 0.25 }}>{card.icon}</span>
                                    </div>
                                    <div style={{ fontSize: 34, fontWeight: 900, color: '#001736', letterSpacing: '-1px', marginBottom: 6 }}>{card.value}</div>
                                    <div style={{ fontSize: 10, color: '#747780' }}>{card.sub}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Route to view */}
                    {activeNav === 'overview'     && <OverviewView/>}
                    {activeNav === 'applications' && <ApplicationsView/>}
                    {activeNav === 'underwriting' && <UnderwritingView/>}
                    {activeNav === 'reports'      && <ReportsView/>}
                    {activeNav === 'settings'     && <SettingsView/>}
                </div>
            </main>

            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                ::-webkit-scrollbar { height: 4px; width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #eceef0; border-radius: 10px; }
            `}</style>
        </div>
    )
}