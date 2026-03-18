import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function OfficerDashboard() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    const [search, setSearch] = useState('')

    const officerEmail = localStorage.getItem('officer_email') || 'Officer'
    const [token, setToken] = useState<string>('')

    useEffect(() => {
        // Get fresh token from Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) { navigate('/officer/login'); return }

            // Verify it's the officer account
            if (session.user.email !== 'officer@nexus.com') {
                navigate('/officer/login')
                return
            }

            setToken(session.access_token)
            localStorage.setItem('officer_token', session.access_token)
        })
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
        } catch {
            setError('Failed to load applications')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('officer_token')
        localStorage.removeItem('officer_email')
        localStorage.removeItem('officer_totp_verified')
        navigate('/officer/login')
    }

    const filtered = applications.filter(app => {
        const matchesFilter = filter === 'all' || app.status === filter
        const matchesSearch = !search ||
            app.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            app.email?.toLowerCase().includes(search.toLowerCase()) ||
            app.purpose?.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    const getStatusStyle = (status: string) => {
        if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200'
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }

    const getStatusIcon = (status: string) => {
        if (status === 'approved') return '✅'
        if (status === 'rejected') return '❌'
        return '⏳'
    }

    const getScoreColor = (score: number) => {
        if (score >= 750) return '#22c55e'
        if (score >= 650) return '#8b5cf6'
        if (score >= 550) return '#f59e0b'
        return '#ef4444'
    }

    if (loading) {
        return (
            <div className="page-wrapper flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <p className="text-xl text-purple-400 font-semibold">Loading applications…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrapper">
            {/* Navbar */}
            <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                                <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                            </svg>
                        </div>
                        <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
                        <span className="text-base bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full font-semibold ml-2">
                            Officer Dashboard
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Real-time indicator */}
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-700 text-sm font-semibold">Live</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
                            <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold">
                                {officerEmail.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-base text-purple-700 font-semibold">{officerEmail}</span>
                        </div>

                        <button onClick={handleLogout}
                                className="flex items-center gap-2 text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors bg-white border border-purple-100 rounded-full px-5 py-2.5 hover:border-purple-300">
                            <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
                                <path d="M9 2H13V13H9M6 10L3 7.5M3 7.5L6 5M3 7.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-10 py-14">

                {/* Header */}
                <div className="mb-12">
                    <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">
                        Officer Dashboard
                    </p>
                    <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-3">
                        Loan Applications
                    </h1>
                    <p className="text-gray-400 text-xl">
                        Review and manage all loan applications. Updates refresh every 5 seconds.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-base">
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-purple-100 text-purple-600', icon: '📋' },
                        { label: 'Pending', value: stats.pending, color: 'bg-yellow-100 text-yellow-600', icon: '⏳' },
                        { label: 'Approved', value: stats.approved, color: 'bg-emerald-100 text-emerald-600', icon: '✅' },
                        { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 text-red-600', icon: '❌' },
                    ].map(stat => (
                        <div key={stat.label}
                             className="bg-white rounded-3xl p-8 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg hover:shadow-purple-50 cursor-pointer"
                             onClick={() => setFilter(stat.label.toLowerCase() as any)}>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-base font-bold px-4 py-2 rounded-full ${stat.color}`}>
                                    {stat.label}
                                </span>
                                <span className="text-3xl">{stat.icon}</span>
                            </div>
                            <p className="font-display font-bold text-6xl text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Filter */}
                <div className="flex items-center gap-4 mb-8 flex-wrap">
                    <div className="relative flex-1 min-w-64">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                            <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
                                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                        </span>
                        <input type="text" value={search}
                               onChange={e => setSearch(e.target.value)}
                               placeholder="Search by name, email or purpose…"
                               className="w-full bg-white border border-purple-100 rounded-2xl pl-14 pr-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
                               style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
                    </div>

                    <div className="flex items-center gap-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                    className={`px-5 py-3 rounded-xl text-base font-semibold transition-all capitalize ${
                                        filter === f
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                            : 'bg-white text-gray-500 border border-purple-100 hover:border-purple-300'
                                    }`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden"
                     style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.06)' }}>

                    {/* Table header */}
                    <div className="px-10 py-5 border-b border-purple-50 grid grid-cols-12 gap-4">
                        {['Applicant', 'Amount', 'Purpose', 'Credit Score', 'Type', 'Date', 'Status', 'Action'].map(h => (
                            <div key={h} className={`text-sm font-bold text-gray-400 uppercase tracking-wide ${
                                h === 'Applicant' ? 'col-span-2' :
                                    h === 'Action' ? 'col-span-2' : 'col-span-1'
                            }`}>
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* No results */}
                    {filtered.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-gray-400 text-xl font-semibold">No applications found</p>
                            <p className="text-gray-300 text-base mt-2">Try adjusting your search or filter</p>
                        </div>
                    )}

                    {/* Rows */}
                    <div className="divide-y divide-purple-50">
                        {filtered.map(app => (
                            <div key={app.id}
                                 className="px-10 py-6 grid grid-cols-12 gap-4 items-center hover:bg-purple-50/30 transition-colors">

                                {/* Applicant */}
                                <div className="col-span-2 flex items-center gap-3">
                                    <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-base flex-shrink-0">
                                        {(app.full_name || app.email || '?').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-bold text-gray-800 truncate">{app.full_name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-400 truncate">{app.email}</p>
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="col-span-1">
                                    <p className="text-base font-bold text-gray-900">
                                        ₹{Number(app.amount).toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-sm text-gray-400">{app.tenure}mo</p>
                                </div>

                                {/* Purpose */}
                                <div className="col-span-1">
                                    <p className="text-base font-semibold text-gray-700">{app.purpose}</p>
                                </div>

                                {/* Credit Score */}
                                <div className="col-span-1">
                                    {app.credit_score ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                                                 style={{
                                                     background: `${getScoreColor(app.credit_score)}15`,
                                                     color: getScoreColor(app.credit_score)
                                                 }}>
                                                {app.credit_score}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-sm">N/A</span>
                                    )}
                                </div>

                                {/* User Type */}
                                <div className="col-span-1">
                                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                                        app.user_type === 'existing'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {app.user_type === 'existing' ? '✅ Existing' : '🌟 New'}
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="col-span-1">
                                    <p className="text-sm text-gray-500">
                                        {new Date(app.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short'
                                        })}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full border capitalize ${getStatusStyle(app.status)}`}>
                                        {getStatusIcon(app.status)} {app.status}
                                    </span>
                                </div>

                                {/* Action */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <button onClick={() => navigate(`/officer/applications/${app.id}`)}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
                                        Review →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-gray-300 text-base mt-8">
                    Showing {filtered.length} of {applications.length} applications · Auto-refreshes every 5s
                </p>
            </main>
        </div>
    )
}

