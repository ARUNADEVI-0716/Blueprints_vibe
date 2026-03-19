// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
// import { supabase } from '@/lib/supabaseClient'
// import { LoanStatusPageSkeleton } from '@/components/Skeleton'
//
// export default function LoanStatusPage() {
//     const { user } = useAuth()
//     const navigate = useNavigate()
//     const [applications, setApplications] = useState<any[]>([])
//     const [loading, setLoading] = useState(true)
//     const [selected, setSelected] = useState<any>(null)
//
//     useEffect(() => {
//         fetchApplications()
//
//         // Real-time subscription
//         const channel = supabase
//             .channel('loan_status_changes')
//             .on('postgres_changes', {
//                 event: 'UPDATE',
//                 schema: 'public',
//                 table: 'loan_applications',
//                 filter: `user_id=eq.${user?.id}`
//             }, (payload) => {
//                 setApplications(prev =>
//                     prev.map(app => app.id === payload.new.id ? { ...app, ...payload.new } : app)
//                 )
//                 if (selected?.id === payload.new.id) {
//                     setSelected((prev: any) => ({ ...prev, ...payload.new }))
//                 }
//             })
//             .subscribe()
//
//         return () => { supabase.removeChannel(channel) }
//     }, [user?.id])
//
//     // Reset when user changes — prevents showing another user's loans
//     useEffect(() => {
//         setApplications([])
//         setSelected(null)
//         setLoading(true)
//     }, [user?.id])
//
//     const fetchApplications = async () => {
//         if (!user?.id) return
//         setLoading(true)
//         const { data } = await supabase
//             .from('loan_applications')
//             .select('*')
//             .eq('user_id', user?.id)
//             .order('created_at', { ascending: false })
//         setApplications(data || [])
//         if (data && data.length > 0) setSelected(data[0])
//         else setSelected(null)
//         setLoading(false)
//     }
//
//     const getStatusColor = (status: string) => {
//         if (status === 'approved') return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✅' }
//         if (status === 'rejected') return { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200',     icon: '❌' }
//         if (status === 'repaid')   return { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200',  icon: '🏆' }
//         return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' }
//     }
//
//     const getScoreColor = (score: number) => {
//         if (score >= 750) return '#22c55e'
//         if (score >= 650) return '#8b5cf6'
//         if (score >= 550) return '#f59e0b'
//         return '#ef4444'
//     }
//
//     const getTimelineSteps = (status: string) => [
//         { label: 'Application Submitted', done: true, icon: '📋' },
//         { label: 'AI Credit Analysis',    done: true, icon: '🤖' },
//         { label: 'Officer Review',        done: status !== 'pending', icon: '👨‍💼', active: status === 'pending' },
//         { label: status === 'rejected' ? 'Application Rejected' : 'Loan Approved', done: status === 'approved' || status === 'rejected' || status === 'repaid', icon: status === 'rejected' ? '❌' : '✅' },
//         { label: 'Sign Agreement',        done: status === 'approved' || status === 'repaid', icon: '✍️', active: status === 'approved' },
//         { label: 'Funds Disbursed',       done: status === 'repaid', icon: '💰' },
//         { label: 'Loan Repaid',           done: status === 'repaid', icon: '🏆' },
//     ]
//
//     if (loading) return <LoanStatusPageSkeleton />
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
//                         <span className="text-base bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full font-semibold ml-2">
//                             Loan Status
//                         </span>
//                     </div>
//                     <div className="flex items-center gap-4">
//                         <button onClick={() => navigate('/apply-loan')}
//                                 className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base px-6 py-2.5 rounded-xl transition-colors">
//                             + New Application
//                         </button>
//                         <button onClick={() => navigate('/dashboard')}
//                                 className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">
//                             Dashboard
//                         </button>
//                     </div>
//                 </div>
//             </nav>
//
//             <main className="max-w-7xl mx-auto px-10 py-14">
//
//                 {/* Header */}
//                 <div className="mb-12">
//                     <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Real-time Updates</p>
//                     <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
//                         My Applications
//                     </h1>
//                     <p className="text-gray-400 text-xl">
//                         Track your loan applications in real-time. Updates appear instantly.
//                     </p>
//                 </div>
//
//                 {/* No applications */}
//                 {applications.length === 0 && (
//                     <div className="text-center py-24 bg-white rounded-3xl border border-purple-100">
//                         <div className="text-7xl mb-6">📋</div>
//                         <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">No Applications Yet</h2>
//                         <p className="text-gray-400 text-xl mb-10">Apply for your first loan to get started</p>
//                         <button onClick={() => navigate('/apply-loan')}
//                                 className="btn-primary"
//                                 style={{ width: 'auto', padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
//                             Apply for a Loan →
//                         </button>
//                     </div>
//                 )}
//
//                 {applications.length > 0 && (
//                     <div className="grid lg:grid-cols-3 gap-8">
//
//                         {/* Applications list */}
//                         <div className="space-y-4">
//                             <h2 className="font-bold text-xl text-gray-600 mb-5">All Applications</h2>
//                             {applications.map(app => {
//                                 const s = getStatusColor(app.status)
//                                 return (
//                                     <button key={app.id}
//                                             onClick={() => setSelected(app)}
//                                             className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
//                                                 selected?.id === app.id
//                                                     ? 'border-purple-500 bg-purple-50'
//                                                     : 'border-purple-100 bg-white hover:border-purple-300'
//                                             }`}>
//                                         <div className="flex items-center justify-between mb-3">
//                                             <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
//                                                 {app.purpose}
//                                             </span>
//                                             <span className={`text-sm font-bold px-3 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
//                                                 {s.icon} {app.status}
//                                             </span>
//                                         </div>
//                                         <p className="font-display font-bold text-2xl text-gray-900 mb-1">
//                                             ₹{Number(app.amount).toLocaleString('en-IN')}
//                                         </p>
//                                         <p className="text-gray-400 text-sm">
//                                             {new Date(app.created_at).toLocaleDateString('en-IN', {
//                                                 day: 'numeric', month: 'short', year: 'numeric'
//                                             })}
//                                         </p>
//                                     </button>
//                                 )
//                             })}
//                         </div>
//
//                         {/* Selected application detail */}
//                         {selected && (
//                             <div className="lg:col-span-2 space-y-6">
//
//                                 {/* Status banner */}
//                                 {selected.status === 'approved' && (
//                                     <div>
//                                         <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-10 text-center mb-4"
//                                              style={{ boxShadow: '0 8px 30px rgba(34,197,94,0.3)' }}>
//                                             <div className="text-6xl mb-4">🎉</div>
//                                             <h2 className="font-display font-bold text-4xl text-white mb-3">
//                                                 Loan Approved!
//                                             </h2>
//                                             <p className="text-emerald-100 text-xl mb-6">
//                                                 ₹{Number(selected.amount).toLocaleString('en-IN')} has been disbursed to your account
//                                             </p>
//                                             {selected.stripe_payment_id && (
//                                                 <div className="bg-white/20 rounded-2xl px-6 py-3 inline-block">
//                                                     <p className="text-white text-base font-semibold">
//                                                         Payment ID: {selected.stripe_payment_id.slice(0, 20)}…
//                                                     </p>
//                                                 </div>
//                                             )}
//                                         </div>
//                                         {/* Agreement CTA — shown when not yet signed */}
//                                         {!selected.agreement_signed && (
//                                             <div className="bg-white rounded-3xl p-8 border-2 border-emerald-300 flex items-center justify-between gap-6">
//                                                 <div>
//                                                     <p className="font-bold text-xl text-gray-900 mb-1">✍️ Sign Loan Agreement</p>
//                                                     <p className="text-gray-400 text-base">
//                                                         Your loan is approved! Sign the digital agreement to receive your funds.
//                                                     </p>
//                                                 </div>
//                                                 <button
//                                                     onClick={() => navigate('/agreement', { state: { applicationId: selected.id } })}
//                                                     className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-8 py-4 rounded-2xl transition-colors flex-shrink-0"
//                                                     style={{ boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
//                                                     Sign Now →
//                                                 </button>
//                                             </div>
//                                         )}
//
//                                         {/* Pay EMI CTA — shown only after agreement is signed */}
//                                         {selected.agreement_signed && (
//                                             <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 flex items-center justify-between gap-6">
//                                                 <div>
//                                                     <p className="font-bold text-xl text-gray-900 mb-1">💳 Start Repaying Your Loan</p>
//                                                     <p className="text-gray-400 text-base">
//                                                         Pay monthly EMIs to repay your loan and boost your credit score.
//                                                     </p>
//                                                 </div>
//                                                 <button
//                                                     onClick={() => navigate('/repayment', { state: { applicationId: selected.id } })}
//                                                     className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-base px-8 py-4 rounded-2xl transition-colors flex-shrink-0"
//                                                     style={{ boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}>
//                                                     Pay EMI →
//                                                 </button>
//                                             </div>
//                                         )}
//                                     </div>
//                                 )}
//
//                                 {selected.status === 'repaid' && (
//                                     <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-3xl p-10 text-center"
//                                          style={{ boxShadow: '0 8px 30px rgba(109,40,217,0.4)' }}>
//                                         <div className="text-6xl mb-4">🏆</div>
//                                         <h2 className="font-display font-bold text-4xl text-white mb-3">
//                                             Loan Fully Repaid!
//                                         </h2>
//                                         <p className="text-purple-200 text-xl mb-4">
//                                             Congratulations on repaying your loan!
//                                         </p>
//                                         <div className="flex items-center justify-center gap-3 mb-6">
//                                             <span className={`text-base font-bold px-4 py-2 rounded-full ${selected.repaid_on_time ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
//                                                 {selected.repaid_on_time ? '⏱ Repaid On Time' : '⚠️ Repaid Late'}
//                                             </span>
//                                         </div>
//                                         <button onClick={() => navigate('/apply-loan')}
//                                                 className="bg-white text-purple-700 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-purple-50 transition-colors">
//                                             Apply for Next Loan →
//                                         </button>
//                                     </div>
//                                 )}
//
//                                 {selected.status === 'rejected' && (
//                                     <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center">
//                                         <div className="text-6xl mb-4">😔</div>
//                                         <h2 className="font-display font-bold text-4xl text-red-700 mb-3">
//                                             Application Rejected
//                                         </h2>
//                                         <p className="text-red-500 text-xl mb-4">
//                                             Unfortunately your application was not approved at this time
//                                         </p>
//                                         {selected.officer_notes && (
//                                             <div className="bg-white rounded-2xl p-6 text-left mt-4">
//                                                 <p className="text-sm font-bold text-gray-400 uppercase mb-2">Officer Notes</p>
//                                                 <p className="text-gray-700 text-base">{selected.officer_notes}</p>
//                                             </div>
//                                         )}
//                                         <button onClick={() => navigate('/apply-loan')}
//                                                 className="mt-6 btn-primary"
//                                                 style={{ width: 'auto', padding: '14px 32px', fontSize: '16px', borderRadius: '14px' }}>
//                                             Try Again →
//                                         </button>
//                                     </div>
//                                 )}
//
//                                 {selected.status === 'pending' && (
//                                     <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl p-10 text-center"
//                                          style={{ boxShadow: '0 8px 30px rgba(109,40,217,0.3)' }}>
//                                         <div className="text-6xl mb-4 animate-pulse">⏳</div>
//                                         <h2 className="font-display font-bold text-4xl text-white mb-3">
//                                             Under Review
//                                         </h2>
//                                         <p className="text-purple-100 text-xl">
//                                             Our officer is reviewing your application. You'll be notified instantly when a decision is made.
//                                         </p>
//                                         <div className="flex items-center justify-center gap-2 mt-6">
//                                             <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
//                                             <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
//                                             <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
//                                         </div>
//                                     </div>
//                                 )}
//
//                                 {/* Timeline */}
//                                 <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                                     <h3 className="font-bold text-2xl text-gray-800 mb-8">Application Timeline</h3>
//                                     <div className="space-y-6">
//                                         {getTimelineSteps(selected.status).map((step, i) => (
//                                             <div key={i} className="flex items-center gap-5">
//                                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
//                                                     step.done ? 'bg-purple-100' : step.active ? 'bg-yellow-100' : 'bg-gray-100'
//                                                 }`}>
//                                                     {step.icon}
//                                                 </div>
//                                                 <div className="flex-1">
//                                                     <p className={`text-lg font-semibold ${
//                                                         step.done ? 'text-gray-900' : step.active ? 'text-yellow-700' : 'text-gray-300'
//                                                     }`}>
//                                                         {step.label}
//                                                     </p>
//                                                 </div>
//                                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
//                                                     step.done ? 'bg-purple-600 text-white' :
//                                                         step.active ? 'bg-yellow-400 text-white' :
//                                                             'bg-gray-200 text-gray-400'
//                                                 }`}>
//                                                     {step.done ? '✓' : step.active ? '…' : ''}
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//
//                                 {/* Application details */}
//                                 <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                                     <h3 className="font-bold text-2xl text-gray-800 mb-8">Application Details</h3>
//                                     <div className="grid grid-cols-2 gap-6">
//                                         {[
//                                             { label: 'Loan Amount', value: `₹${Number(selected.amount).toLocaleString('en-IN')}` },
//                                             { label: 'Purpose', value: selected.purpose },
//                                             { label: 'Tenure', value: `${selected.tenure} months` },
//                                             { label: 'Employment', value: selected.employment_type },
//                                             { label: 'Monthly Income', value: `₹${Number(selected.monthly_income).toLocaleString('en-IN')}` },
//                                             { label: 'Profile Type', value: selected.user_type === 'new' ? '🌟 Cold Start' : '✅ Existing' },
//                                         ].map(item => (
//                                             <div key={item.label} className="bg-purple-50 rounded-2xl p-5">
//                                                 <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">{item.label}</p>
//                                                 <p className="text-xl font-bold text-gray-800">{item.value}</p>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//
//                                 {/* Credit score */}
//                                 {selected.credit_score && (
//                                     <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                                         <div className="flex items-center justify-between mb-6">
//                                             <h3 className="font-bold text-2xl text-gray-800">Credit Score at Application</h3>
//                                             <button onClick={() => navigate('/credit-score')}
//                                                     className="text-purple-600 font-semibold text-base hover:text-purple-800 transition-colors">
//                                                 Full Report →
//                                             </button>
//                                         </div>
//                                         <div className="flex items-center gap-6">
//                                             <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-3xl"
//                                                  style={{
//                                                      background: `${getScoreColor(selected.credit_score)}15`,
//                                                      color: getScoreColor(selected.credit_score)
//                                                  }}>
//                                                 {selected.credit_score}
//                                             </div>
//                                             <div>
//                                                 <p className="text-xl font-bold text-gray-900">
//                                                     {selected.score_breakdown?.grade} · {selected.score_breakdown?.riskLevel}
//                                                 </p>
//                                                 <p className="text-gray-400 text-base mt-1">
//                                                     {selected.score_breakdown?.isColdStart
//                                                         ? '🌟 Cold Start Model Used'
//                                                         : '✅ Hybrid Scoring Model Used'}
//                                                 </p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </main>
//         </div>
//     )
// }
//

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { LoanStatusPageSkeleton } from '@/components/Skeleton'

export default function LoanStatusPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<any>(null)

    useEffect(() => {
        fetchApplications()
        const channel = supabase
            .channel('loan_status_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loan_applications', filter: `user_id=eq.${user?.id}` }, (payload) => {
                setApplications(prev => prev.map(app => app.id === payload.new.id ? { ...app, ...payload.new } : app))
                if (selected?.id === payload.new.id) setSelected((prev: any) => ({ ...prev, ...payload.new }))
            }).subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user?.id])

    useEffect(() => { setApplications([]); setSelected(null); setLoading(true) }, [user?.id])

    const fetchApplications = async () => {
        if (!user?.id) return
        setLoading(true)
        const { data } = await supabase.from('loan_applications').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
        setApplications(data || [])
        if (data && data.length > 0) setSelected(data[0])
        else setSelected(null)
        setLoading(false)
    }

    const getStatusStyle = (status: string) => {
        if (status === 'approved') return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icon: '✅' }
        if (status === 'rejected') return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: '❌' }
        if (status === 'repaid')   return { bg: '#eef4ff', text: '#0060ac', border: '#a4c9ff', icon: '🏆' }
        return { bg: '#fefce8', text: '#a16207', border: '#fef08a', icon: '⏳' }
    }

    const getScoreColor = (score: number) => score >= 750 ? '#22c55e' : score >= 650 ? '#0060ac' : score >= 550 ? '#f59e0b' : '#ef4444'

    const getTimelineSteps = (status: string) => [
        { label: 'Application Submitted', done: true, icon: '📋' },
        { label: 'AI Credit Analysis',    done: true, icon: '🤖' },
        { label: 'Officer Review',        done: status !== 'pending', icon: '👨‍💼', active: status === 'pending' },
        { label: status === 'rejected' ? 'Application Rejected' : 'Loan Approved', done: status === 'approved' || status === 'rejected' || status === 'repaid', icon: status === 'rejected' ? '❌' : '✅' },
        { label: 'Sign Agreement',        done: status === 'approved' || status === 'repaid', icon: '✍️', active: status === 'approved' },
        { label: 'Funds Disbursed',       done: status === 'repaid', icon: '💰' },
        { label: 'Loan Repaid',           done: status === 'repaid', icon: '🏆' },
    ]

    if (loading) return <LoanStatusPageSkeleton />

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* Navbar */}
            <nav style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#eef4ff', color: '#0060ac', padding: '4px 12px', borderRadius: 100 }}>Loan Status</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => navigate('/apply-loan')}
                                style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                            + New Application
                        </button>
                        <button onClick={() => navigate('/dashboard')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f' }}>
                            Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px' }}>

                {/* Header */}
                <div style={{ marginBottom: 36 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Real-time Updates</p>
                    <h1 style={{ fontWeight: 900, fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#001736', letterSpacing: '-1px', marginBottom: 6 }}>My Applications</h1>
                    <p style={{ fontSize: 15, color: '#43474f' }}>Track your loan applications in real-time. Updates appear instantly.</p>
                </div>

                {/* Empty state */}
                {applications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, border: '1px solid #e0e3e5' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                        <h2 style={{ fontWeight: 900, fontSize: 28, color: '#001736', marginBottom: 8 }}>No Applications Yet</h2>
                        <p style={{ fontSize: 15, color: '#43474f', marginBottom: 28 }}>Apply for your first loan to get started</p>
                        <button onClick={() => navigate('/apply-loan')}
                                style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 10, padding: '14px 36px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                            Apply for a Loan →
                        </button>
                    </div>
                )}

                {applications.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>

                        {/* Applications list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <h2 style={{ fontWeight: 800, fontSize: 14, color: '#43474f', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Applications</h2>
                            {applications.map(app => {
                                const s = getStatusStyle(app.status)
                                const isSelected = selected?.id === app.id
                                return (
                                    <button key={app.id} onClick={() => setSelected(app)}
                                            style={{ textAlign: 'left', padding: '16px', borderRadius: 12, border: `1.5px solid ${isSelected ? '#0060ac' : '#e0e3e5'}`, background: isSelected ? '#eef4ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}
                                            onMouseEnter={e => !isSelected && ((e.currentTarget as HTMLButtonElement).style.borderColor = '#a4c9ff')}
                                            onMouseLeave={e => !isSelected && ((e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e3e5')}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{app.purpose}</span>
                                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: s.bg, color: s.text, border: `1px solid ${s.border}`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {s.icon} {app.status}
                                            </span>
                                        </div>
                                        <p style={{ fontWeight: 900, fontSize: 20, color: '#001736', marginBottom: 4, letterSpacing: '-0.5px' }}>
                                            ₹{Number(app.amount).toLocaleString('en-IN')}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#747780' }}>
                                            {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Selected detail */}
                        {selected && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Status banners */}
                                {selected.status === 'approved' && (
                                    <>
                                        <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 16, padding: '36px', textAlign: 'center', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                                            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                                            <h2 style={{ fontWeight: 900, fontSize: 28, color: 'white', marginBottom: 8 }}>Loan Approved!</h2>
                                            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                                                ₹{Number(selected.amount).toLocaleString('en-IN')} approved for disbursement
                                            </p>
                                            {selected.stripe_payment_id && (
                                                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 16px', display: 'inline-block' }}>
                                                    <p style={{ fontSize: 12, color: 'white' }}>Payment ID: {selected.stripe_payment_id.slice(0, 20)}…</p>
                                                </div>
                                            )}
                                        </div>
                                        {!selected.agreement_signed && (
                                            <div style={{ background: 'white', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: 15, color: '#001736', marginBottom: 4 }}>✍️ Sign Loan Agreement</p>
                                                    <p style={{ fontSize: 13, color: '#43474f' }}>Your loan is approved! Sign the digital agreement to receive your funds.</p>
                                                </div>
                                                <button onClick={() => navigate('/agreement', { state: { applicationId: selected.id } })}
                                                        style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                                                    Sign Now →
                                                </button>
                                            </div>
                                        )}
                                        {selected.agreement_signed && (
                                            <div style={{ background: 'white', border: '1.5px solid #a4c9ff', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: 15, color: '#001736', marginBottom: 4 }}>💳 Start Repaying Your Loan</p>
                                                    <p style={{ fontSize: 13, color: '#43474f' }}>Pay monthly EMIs to repay your loan and boost your credit score.</p>
                                                </div>
                                                <button onClick={() => navigate('/repayment', { state: { applicationId: selected.id } })}
                                                        style={{ background: '#0060ac', color: 'white', border: 'none', borderRadius: 8, padding: '11px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                                                    Pay EMI →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {selected.status === 'repaid' && (
                                    <div style={{ background: 'linear-gradient(135deg, #001736, #002b5b)', borderRadius: 16, padding: '36px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,23,54,0.25)' }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                                        <h2 style={{ fontWeight: 900, fontSize: 28, color: 'white', marginBottom: 8 }}>Loan Fully Repaid!</h2>
                                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>Congratulations on repaying your loan!</p>
                                        <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 100, background: selected.repaid_on_time ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: selected.repaid_on_time ? '#22c55e' : '#fbbf24' }}>
                                            {selected.repaid_on_time ? '⏱ Repaid On Time' : '⚠️ Repaid Late'}
                                        </span>
                                        <div style={{ marginTop: 20 }}>
                                            <button onClick={() => navigate('/apply-loan')}
                                                    style={{ background: 'white', color: '#001736', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                                                Apply for Next Loan →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'rejected' && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '36px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
                                        <h2 style={{ fontWeight: 900, fontSize: 26, color: '#dc2626', marginBottom: 8 }}>Application Rejected</h2>
                                        <p style={{ fontSize: 15, color: '#ef4444', marginBottom: 16 }}>Unfortunately your application was not approved at this time.</p>
                                        {selected.officer_notes && (
                                            <div style={{ background: 'white', borderRadius: 10, padding: '16px', textAlign: 'left', marginBottom: 16 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Officer Notes</p>
                                                <p style={{ fontSize: 14, color: '#374151' }}>{selected.officer_notes}</p>
                                            </div>
                                        )}
                                        <button onClick={() => navigate('/apply-loan')}
                                                style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                                            Try Again →
                                        </button>
                                    </div>
                                )}

                                {selected.status === 'pending' && (
                                    <div style={{ background: 'linear-gradient(135deg, #001736, #0060ac)', borderRadius: 16, padding: '36px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,96,172,0.25)' }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                                        <h2 style={{ fontWeight: 900, fontSize: 26, color: 'white', marginBottom: 8 }}>Under Review</h2>
                                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Our officer is reviewing your application. You'll be notified instantly when a decision is made.</p>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                                            {[0, 150, 300].map(d => (
                                                <div key={d} style={{ width: 10, height: 10, background: 'rgba(255,255,255,0.5)', borderRadius: '50%', animation: `bounce 1s ${d}ms infinite` }}/>
                                            ))}
                                        </div>
                                        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
                                    </div>
                                )}

                                {/* Timeline */}
                                <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                                    <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', marginBottom: 20 }}>Application Timeline</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {getTimelineSteps(selected.status).map((step, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, background: step.done ? '#eef4ff' : step.active ? '#fefce8' : '#f2f4f6' }}>
                                                    {step.icon}
                                                </div>
                                                <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: step.done ? '#001736' : step.active ? '#a16207' : '#c4c6d0' }}>
                                                    {step.label}
                                                </p>
                                                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: step.done ? '#0060ac' : step.active ? '#fbbf24' : '#e0e3e5', color: step.done || step.active ? 'white' : '#c4c6d0', flexShrink: 0 }}>
                                                    {step.done ? '✓' : step.active ? '…' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Details grid */}
                                <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                                    <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', marginBottom: 16 }}>Application Details</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {[
                                            { label: 'Loan Amount',    value: `₹${Number(selected.amount).toLocaleString('en-IN')}` },
                                            { label: 'Purpose',        value: selected.purpose },
                                            { label: 'Tenure',         value: `${selected.tenure} months` },
                                            { label: 'Employment',     value: selected.employment_type },
                                            { label: 'Monthly Income', value: `₹${Number(selected.monthly_income).toLocaleString('en-IN')}` },
                                            { label: 'Profile Type',   value: selected.user_type === 'new' ? '🌟 Cold Start' : '✅ Existing' },
                                        ].map(item => (
                                            <div key={item.label} style={{ background: '#f7f9fb', borderRadius: 10, padding: '14px 16px' }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{item.label}</p>
                                                <p style={{ fontSize: 15, fontWeight: 700, color: '#001736' }}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Credit score */}
                                {selected.credit_score && (
                                    <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', margin: 0 }}>Credit Score at Application</h3>
                                            <button onClick={() => navigate('/credit-score')}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0060ac' }}>
                                                Full Report →
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, background: `${getScoreColor(selected.credit_score)}15`, color: getScoreColor(selected.credit_score), flexShrink: 0 }}>
                                                {selected.credit_score}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 15, color: '#001736', margin: 0 }}>{selected.score_breakdown?.grade} · {selected.score_breakdown?.riskLevel}</p>
                                                <p style={{ fontSize: 13, color: '#43474f', margin: 0 }}>{selected.score_breakdown?.isColdStart ? '🌟 Cold Start Model' : '✅ Hybrid Scoring Model'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}