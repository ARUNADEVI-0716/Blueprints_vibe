// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
// import { supabase } from '@/lib/supabaseClient'
// import { ApplicantDashboardSkeleton } from '@/components/Skeleton'
//
// export default function ApplicantDashboard() {
//     const { user, signOut } = useAuth()
//     const navigate = useNavigate()
//     const [loggingOut, setLoggingOut] = useState(false)
//     const [applications, setApplications] = useState<any[]>([])
//     const [creditScore, setCreditScore] = useState<any>(null)
//     const [bankConnected, setBankConnected] = useState(false)
//     const [loading, setLoading] = useState(true)
//
//     const email = user?.email ?? ''
//     const fullName = user?.user_metadata?.full_name ?? ''
//     const displayName = fullName || email.split('@')[0]
//     const initials = displayName.slice(0, 2).toUpperCase()
//
//     const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
//     useEffect(() => {
//         fetchDashboardData()
//
//         const channel = supabase
//             .channel('applicant_dashboard')
//             .on('postgres_changes', {
//                 event: 'UPDATE',
//                 schema: 'public',
//                 table: 'loan_applications',
//                 filter: `user_id=eq.${user?.id}`
//             }, (payload) => {
//                 setApplications(prev =>
//                     prev.map(app => app.id === payload.new.id ? { ...app, ...payload.new } : app)
//                 )
//             })
//             .subscribe()
//
//         return () => { supabase.removeChannel(channel) }
//     }, [user?.id])
//
//     const fetchDashboardData = async () => {
//         setLoading(true)
//         try {
//             const { data: apps } = await supabase
//                 .from('loan_applications')
//                 .select('*')
//                 .eq('user_id', user?.id)
//                 .order('created_at', { ascending: false })
//             setApplications(apps || [])
//
//             const { data: score } = await supabase
//                 .from('credit_scores')
//                 .select('*')
//                 .eq('user_id', user?.id)
//                 .order('calculated_at', { ascending: false })
//                 .limit(1)
//                 .single()
//             if (score) setCreditScore(score.breakdown)
//
//             const { data: plaidItems } = await supabase
//                 .from('plaid_items')
//                 .select('id')
//                 .eq('user_id', user?.id)
//                 .limit(1)
//             setBankConnected((plaidItems?.length || 0) > 0)
//
//         } catch {
//             // Silent fail
//         } finally {
//             setLoading(false)
//         }
//     }
//
//     const handleLogout = async () => {
//         setLoggingOut(true)
//         await signOut()
//         navigate('/login')
//     }
//
//     const stats = {
//         total:    applications.length,
//         approved: applications.filter(a => a.status === 'approved').length,
//         pending:  applications.filter(a => a.status === 'pending').length,
//         rejected: applications.filter(a => a.status === 'rejected').length,
//     }
//
//     const getStatusColor = (status: string) => {
//         if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
//         if (status === 'rejected') return 'bg-red-100 text-red-700'
//         return 'bg-yellow-100 text-yellow-700'
//     }
//
//     const getStatusIcon = (status: string) => {
//         if (status === 'approved') return '✅'
//         if (status === 'rejected') return '❌'
//         return '⏳'
//     }
//
//     const getScoreColor = (score: number) => {
//         if (score >= 750) return '#22c55e'
//         if (score >= 650) return '#8b5cf6'
//         if (score >= 550) return '#f59e0b'
//         return '#ef4444'
//     }
//
//     // ── Show skeleton while loading ───────────────────────────
//     if (loading) return <ApplicantDashboardSkeleton />
//
//     return (
//         <div className="page-wrapper">
//             {/* Navbar */}
//             <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
//                 <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
//                     <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
//                             <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
//                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
//                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
//                             </svg>
//                         </div>
//                         <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
//                         <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold">Applicant</span>
//                     </div>
//
//                     <div className="flex items-center gap-4">
//                         <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
//                             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
//                             <span className="text-emerald-700 text-sm font-semibold">Live</span>
//                         </div>
//
//                         <div className="hidden sm:flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
//                             <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold">{initials}</div>
//                             <span className="text-base text-purple-700 font-semibold">{displayName}</span>
//                         </div>
//                         <button onClick={handleLogout} disabled={loggingOut}
//                                 className="flex items-center gap-2 text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors bg-white border border-purple-100 rounded-full px-5 py-2.5 hover:border-purple-300 disabled:opacity-50">
//                             {loggingOut ? <Spinner /> : <SignOutIcon />}
//                             Sign out
//                         </button>
//                     </div>
//                 </div>
//             </nav>
//
//             <main className="max-w-7xl mx-auto px-10 py-14">
//
//                 {/* Header */}
//                 <div className="mb-12">
//                     <p className="text-base font-bold text-blue-400 uppercase tracking-widest mb-3">Applicant Dashboard</p>
//                     <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-3">
//                         Welcome, <span className="text-purple-600">{displayName}</span> 👋
//                     </h1>
//                     <p className="text-gray-400 text-xl mt-2">
//                         Track your applications, credit score and loan status — all in real-time.
//                     </p>
//                 </div>
//
//                 {/* Quick action cards */}
//                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//                     {[
//                         {
//                             label: 'Connect Bank',
//                             icon: '🏦',
//                             desc: bankConnected ? '✅ Bank connected' : 'Link your bank account',
//                             path: '/connect-bank',
//                             color: bankConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
//                         },
//                         {
//                             label: 'Credit Score',
//                             icon: '📊',
//                             desc: creditScore ? `Score: ${creditScore.score} · ${creditScore.grade}` : 'Generate your AI score',
//                             path: '/credit-score',
//                             color: 'bg-purple-100 text-purple-700'
//                         },
//                         {
//                             label: 'Apply for Loan',
//                             icon: '💰',
//                             desc: 'Submit a new application',
//                             path: '/apply-loan',
//                             color: 'bg-emerald-100 text-emerald-700'
//                         },
//                         {
//                             label: 'Loan Status',
//                             icon: '📋',
//                             desc: `${stats.total} application${stats.total !== 1 ? 's' : ''} total`,
//                             path: '/loan-status',
//                             color: 'bg-yellow-100 text-yellow-700'
//                         },
//                     ].map(item => (
//                         <button key={item.label}
//                                 onClick={() => navigate(item.path)}
//                                 className="bg-white rounded-3xl p-8 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg hover:shadow-purple-50 text-left group">
//                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 ${item.color} group-hover:scale-110 transition-transform`}>
//                                 {item.icon}
//                             </div>
//                             <p className="font-bold text-xl text-gray-800 mb-1">{item.label}</p>
//                             <p className="text-gray-400 text-base">{item.desc}</p>
//                         </button>
//                     ))}
//                 </div>
//
//                 {/* Stats row */}
//                 <div className="grid grid-cols-4 gap-6 mb-12">
//                     {[
//                         { label: 'Total Applications', value: stats.total,    color: 'text-purple-600 bg-purple-100', icon: '📋' },
//                         { label: 'Approved',           value: stats.approved, color: 'text-emerald-600 bg-emerald-100', icon: '✅' },
//                         { label: 'Under Review',       value: stats.pending,  color: 'text-yellow-600 bg-yellow-100', icon: '⏳' },
//                         { label: 'Rejected',           value: stats.rejected, color: 'text-red-600 bg-red-100', icon: '❌' },
//                     ].map(s => (
//                         <div key={s.label} className="bg-white rounded-3xl p-8 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg hover:shadow-purple-50">
//                             <div className="flex items-center justify-between mb-4">
//                                 <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
//                                 <span className="text-2xl">{s.icon}</span>
//                             </div>
//                             <p className="font-display font-bold text-5xl text-gray-900">{s.value}</p>
//                         </div>
//                     ))}
//                 </div>
//
//                 {/* Credit score banner */}
//                 {creditScore && (
//                     <div className="bg-white rounded-3xl p-8 border border-purple-100 mb-12 flex items-center justify-between gap-6"
//                          style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.06)' }}>
//                         <div className="flex items-center gap-6">
//                             <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-display font-bold text-4xl flex-shrink-0"
//                                  style={{
//                                      background: `${getScoreColor(creditScore.score)}15`,
//                                      color: getScoreColor(creditScore.score)
//                                  }}>
//                                 {creditScore.score}
//                             </div>
//                             <div>
//                                 <p className="text-sm text-gray-400 uppercase tracking-wide font-bold mb-1">Your Credit Score</p>
//                                 <p className="font-display font-bold text-3xl text-gray-900">{creditScore.grade}</p>
//                                 <p className="text-gray-400 text-lg mt-1">{creditScore.riskLevel} · {creditScore.isColdStart ? '🌟 Cold Start' : '✅ Hybrid Model'}</p>
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-4">
//                             <button onClick={() => navigate('/credit-score')}
//                                     className="text-purple-600 hover:text-purple-800 font-semibold text-base border border-purple-200 px-6 py-3 rounded-xl transition-all hover:border-purple-400">
//                                 Full Report →
//                             </button>
//                             <button onClick={() => navigate('/apply-loan')}
//                                     className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-base px-6 py-3 rounded-xl transition-colors">
//                                 Apply Now →
//                             </button>
//                         </div>
//                     </div>
//                 )}
//
//                 {/* Apply banner */}
//                 {!creditScore && (
//                     <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl p-10 mb-12 flex items-center justify-between"
//                          style={{ boxShadow: '0 8px 30px rgba(109,40,217,0.3)' }}>
//                         <div>
//                             <h3 className="text-white font-display font-bold text-3xl mb-2">Get Your Credit Score</h3>
//                             <p className="text-purple-200 text-lg">Connect your bank to generate your AI-powered credit score</p>
//                         </div>
//                         <button onClick={() => navigate('/connect-bank')}
//                                 className="bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-purple-50 transition-colors flex-shrink-0"
//                                 style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
//                             Connect Bank →
//                         </button>
//                     </div>
//                 )}
//
//                 {/* Recent applications */}
//                 <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
//                     <div className="px-10 py-6 border-b border-purple-50 flex items-center justify-between">
//                         <h2 className="text-2xl font-bold text-gray-700">Recent Applications</h2>
//                         <button onClick={() => navigate('/loan-status')}
//                                 className="text-purple-600 font-semibold text-base hover:text-purple-800 transition-colors">
//                             View All →
//                         </button>
//                     </div>
//
//                     {applications.length === 0 && (
//                         <div className="text-center py-16">
//                             <div className="text-5xl mb-4">📋</div>
//                             <p className="text-gray-400 text-xl font-semibold mb-2">No applications yet</p>
//                             <p className="text-gray-300 text-base mb-8">Apply for your first loan to get started</p>
//                             <button onClick={() => navigate('/apply-loan')}
//                                     className="btn-primary"
//                                     style={{ width: 'auto', padding: '14px 32px', fontSize: '16px', borderRadius: '14px' }}>
//                                 Apply Now →
//                             </button>
//                         </div>
//                     )}
//
//                     <div className="divide-y divide-purple-50">
//                         {applications.slice(0, 5).map((app, i) => (
//                             <div key={i}
//                                  className="px-10 py-6 flex items-center gap-6 hover:bg-purple-50/50 transition-colors cursor-pointer"
//                                  onClick={() => navigate('/loan-status')}>
//                                 <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-lg flex-shrink-0">
//                                     {(app.purpose || 'LN').slice(0, 2).toUpperCase()}
//                                 </div>
//                                 <div className="flex-1 min-w-0">
//                                     <p className="text-xl font-bold text-gray-800">{app.purpose} Loan</p>
//                                     <p className="text-base text-gray-400 mt-1">
//                                         {new Date(app.created_at).toLocaleDateString('en-IN', {
//                                             day: 'numeric', month: 'short', year: 'numeric'
//                                         })} · {app.tenure} months
//                                     </p>
//                                 </div>
//                                 <p className="text-xl font-bold text-gray-700">
//                                     ₹{Number(app.amount).toLocaleString('en-IN')}
//                                 </p>
//                                 <span className={`text-base font-bold px-5 py-2 rounded-full ${getStatusColor(app.status)}`}>
//                                     {getStatusIcon(app.status)} {app.status}
//                                 </span>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </main>
//         </div>
//     )
// }
//
// function SignOutIcon() {
//     return <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M9 2H13V13H9M6 10L3 7.5M3 7.5L6 5M3 7.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
// }
// function Spinner() {
//     return (
//         <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
//             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
//         </svg>
//     )
// }

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { ApplicantDashboardSkeleton } from '@/components/Skeleton'
import { useCounter } from '@/hooks/useCounter'

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
        approved: applications.filter(a => a.status === 'approved').length,
        pending:  applications.filter(a => a.status === 'pending').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    // ── Counter animations ────────────────────────────────────
    const totalCount    = useCounter(stats.total)
    const approvedCount = useCounter(stats.approved)
    const pendingCount  = useCounter(stats.pending)
    const rejectedCount = useCounter(stats.rejected)

    useEffect(() => {
        fetchDashboardData()

        const channel = supabase
            .channel('applicant_dashboard')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'loan_applications',
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
                .from('loan_applications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
            setApplications(apps || [])

            const { data: score } = await supabase
                .from('credit_scores')
                .select('*')
                .eq('user_id', user?.id)
                .order('calculated_at', { ascending: false })
                .limit(1)
                .single()
            if (score) setCreditScore(score.breakdown)

            const { data: plaidItems } = await supabase
                .from('plaid_items')
                .select('id')
                .eq('user_id', user?.id)
                .limit(1)
            setBankConnected((plaidItems?.length || 0) > 0)

        } catch {
            // Silent fail
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        await signOut()
        navigate('/login')
    }

    const getStatusColor = (status: string) => {
        if (status === 'approved') return 'bg-emerald-100 text-emerald-700'
        if (status === 'rejected') return 'bg-red-100 text-red-700'
        return 'bg-yellow-100 text-yellow-700'
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

    if (loading) return <ApplicantDashboardSkeleton />

    return (
        <div className="page-wrapper page-enter">
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
                        <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold">Applicant</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-700 text-sm font-semibold">Live</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
                            <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold">{initials}</div>
                            <span className="text-base text-purple-700 font-semibold">{displayName}</span>
                        </div>
                        <button onClick={handleLogout} disabled={loggingOut}
                                className="flex items-center gap-2 text-base text-gray-400 hover:text-purple-600 font-semibold transition-all bg-white border border-purple-100 rounded-full px-5 py-2.5 hover:border-purple-300 disabled:opacity-50 active:scale-95">
                            {loggingOut ? <Spinner /> : <SignOutIcon />}
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-10 py-14">

                {/* Header */}
                <div className="mb-12 fade-up fade-up-1">
                    <p className="text-base font-bold text-blue-400 uppercase tracking-widest mb-3">Applicant Dashboard</p>
                    <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-3">
                        Welcome, <span className="text-purple-600">{displayName}</span> 👋
                    </h1>
                    <p className="text-gray-400 text-xl mt-2">
                        Track your applications, credit score and loan status — all in real-time.
                    </p>
                </div>

                {/* Quick action cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        {
                            label: 'Connect Bank',
                            icon: '🏦',
                            desc: bankConnected ? '✅ Bank connected' : 'Link your bank account',
                            path: '/connect-bank',
                            color: bankConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        },
                        {
                            label: 'Credit Score',
                            icon: '📊',
                            desc: creditScore ? `Score: ${creditScore.score} · ${creditScore.grade}` : 'Generate your AI score',
                            path: '/credit-score',
                            color: 'bg-purple-100 text-purple-700'
                        },
                        {
                            label: 'Apply for Loan',
                            icon: '💰',
                            desc: 'Submit a new application',
                            path: '/apply-loan',
                            color: 'bg-emerald-100 text-emerald-700'
                        },
                        {
                            label: 'Loan Status',
                            icon: '📋',
                            desc: `${stats.total} application${stats.total !== 1 ? 's' : ''} total`,
                            path: '/loan-status',
                            color: 'bg-yellow-100 text-yellow-700'
                        },
                    ].map((item, i) => (
                        <button key={item.label}
                                onClick={() => navigate(item.path)}
                                className={`fade-up fade-up-${i + 2} bg-white rounded-3xl p-8 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg hover:shadow-purple-50 text-left group active:scale-95`}>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 ${item.color} group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <p className="font-bold text-xl text-gray-800 mb-1">{item.label}</p>
                            <p className="text-gray-400 text-base">{item.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Applications', value: totalCount,    color: 'text-purple-600 bg-purple-100', icon: '📋' },
                        { label: 'Approved',           value: approvedCount, color: 'text-emerald-600 bg-emerald-100', icon: '✅' },
                        { label: 'Under Review',       value: pendingCount,  color: 'text-yellow-600 bg-yellow-100', icon: '⏳' },
                        { label: 'Rejected',           value: rejectedCount, color: 'text-red-600 bg-red-100', icon: '❌' },
                    ].map((s, i) => (
                        <div key={s.label} className={`fade-up fade-up-${i + 2} bg-white rounded-3xl p-8 border border-purple-100 hover:border-purple-300 transition-all hover:shadow-lg hover:shadow-purple-50`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
                                <span className="text-2xl">{s.icon}</span>
                            </div>
                            <p className="font-display font-bold text-5xl text-gray-900">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Credit score banner */}
                {creditScore && (
                    <div className="fade-up fade-up-3 bg-white rounded-3xl p-8 border border-purple-100 mb-12 flex items-center justify-between gap-6"
                         style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.06)' }}>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-display font-bold text-4xl flex-shrink-0"
                                 style={{
                                     background: `${getScoreColor(creditScore.score)}15`,
                                     color: getScoreColor(creditScore.score)
                                 }}>
                                {creditScore.score}
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 uppercase tracking-wide font-bold mb-1">Your Credit Score</p>
                                <p className="font-display font-bold text-3xl text-gray-900">{creditScore.grade}</p>
                                <p className="text-gray-400 text-lg mt-1">{creditScore.riskLevel} · {creditScore.isColdStart ? '🌟 Cold Start' : '✅ Hybrid Model'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/credit-score')}
                                    className="text-purple-600 hover:text-purple-800 font-semibold text-base border border-purple-200 px-6 py-3 rounded-xl transition-all hover:border-purple-400 active:scale-95">
                                Full Report →
                            </button>
                            <button onClick={() => navigate('/apply-loan')}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-base px-6 py-3 rounded-xl transition-all active:scale-95">
                                Apply Now →
                            </button>
                        </div>
                    </div>
                )}

                {/* Apply banner */}
                {!creditScore && (
                    <div className="fade-up fade-up-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl p-10 mb-12 flex items-center justify-between"
                         style={{ boxShadow: '0 8px 30px rgba(109,40,217,0.3)' }}>
                        <div>
                            <h3 className="text-white font-display font-bold text-3xl mb-2">Get Your Credit Score</h3>
                            <p className="text-purple-200 text-lg">Connect your bank to generate your AI-powered credit score</p>
                        </div>
                        <button onClick={() => navigate('/connect-bank')}
                                className="bg-white text-purple-700 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-purple-50 transition-all active:scale-95 flex-shrink-0"
                                style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
                            Connect Bank →
                        </button>
                    </div>
                )}

                {/* Recent applications */}
                <div className="fade-up fade-up-4 bg-white rounded-3xl border border-purple-100 overflow-hidden">
                    <div className="px-10 py-6 border-b border-purple-50 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-700">Recent Applications</h2>
                        <button onClick={() => navigate('/loan-status')}
                                className="text-purple-600 font-semibold text-base hover:text-purple-800 transition-colors active:scale-95">
                            View All →
                        </button>
                    </div>

                    {applications.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-5xl mb-4">📋</div>
                            <p className="text-gray-400 text-xl font-semibold mb-2">No applications yet</p>
                            <p className="text-gray-300 text-base mb-8">Apply for your first loan to get started</p>
                            <button onClick={() => navigate('/apply-loan')}
                                    className="btn-primary"
                                    style={{ width: 'auto', padding: '14px 32px', fontSize: '16px', borderRadius: '14px' }}>
                                Apply Now →
                            </button>
                        </div>
                    )}

                    <div className="divide-y divide-purple-50">
                        {applications.slice(0, 5).map((app, i) => (
                            <div key={i}
                                 className="px-10 py-6 flex items-center gap-6 hover:bg-purple-50/50 transition-colors cursor-pointer active:scale-[0.99]"
                                 onClick={() => navigate('/loan-status')}>
                                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-lg flex-shrink-0">
                                    {(app.purpose || 'LN').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xl font-bold text-gray-800">{app.purpose} Loan</p>
                                    <p className="text-base text-gray-400 mt-1">
                                        {new Date(app.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })} · {app.tenure} months
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-gray-700">
                                    ₹{Number(app.amount).toLocaleString('en-IN')}
                                </p>
                                <span className={`text-base font-bold px-5 py-2 rounded-full ${getStatusColor(app.status)}`}>
                                    {getStatusIcon(app.status)} {app.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

function SignOutIcon() {
    return <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M9 2H13V13H9M6 10L3 7.5M3 7.5L6 5M3 7.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function Spinner() {
    return (
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}