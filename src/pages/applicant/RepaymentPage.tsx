// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
// import { supabase } from '@/lib/supabaseClient'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// interface EMISlot {
//     emiNumber: number
//     amount: number
//     principal: number
//     interest: number
//     balance: number
//     dueDate: string
//     paid: boolean
//     paidAt: string | null
//     late: boolean
// }
//
// interface Schedule {
//     applicationId: string
//     loanAmount: number
//     annualRate: number
//     emi: number
//     tenure: number
//     totalPayable: number
//     totalPaid: number
//     outstanding: number
//     paidEMIs: number
//     remainingEMIs: number
//     nextDueDate: string
//     nextEMINumber: number
//     isFullyPaid: boolean
//     schedule: EMISlot[]
// }
//
// export default function RepaymentPage() {
//     const { session } = useAuth()
//     const navigate    = useNavigate()
//     const location    = useLocation()
//     const applicationId = location.state?.applicationId || ''
//
//     const [schedule, setSchedule] = useState<Schedule | null>(null)
//     const [loading, setLoading]   = useState(true)
//     const [paying, setPaying]     = useState(false)
//     const [error, setError]       = useState('')
//     const [success, setSuccess]   = useState('')
//     const [showAll, setShowAll]   = useState(false)
//     const [justPaid, setJustPaid] = useState(false)
//
//     useEffect(() => {
//         if (!applicationId) { navigate('/loan-status'); return }
//         fetchSchedule()
//
//         // Realtime: refresh when a new EMI payment is recorded
//         const channel = supabase
//             .channel('repayment_live')
//             .on('postgres_changes', {
//                 event: 'INSERT',
//                 schema: 'public',
//                 table: 'emi_payments',
//                 filter: `application_id=eq.${applicationId}`
//             }, () => fetchSchedule())
//             .on('postgres_changes', {
//                 event: 'UPDATE',
//                 schema: 'public',
//                 table: 'loan_applications',
//                 filter: `id=eq.${applicationId}`
//             }, () => fetchSchedule())
//             .subscribe()
//
//         return () => { supabase.removeChannel(channel) }
//     }, [applicationId])
//
//     const fetchSchedule = async () => {
//         setLoading(true)
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/repayment/schedule/${applicationId}`, {
//                 headers: { Authorization: `Bearer ${session?.access_token}` }
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setSchedule(data)
//         } catch (err: any) {
//             setError(err.message)
//         } finally {
//             setLoading(false)
//         }
//     }
//
//     const handlePayEMI = async () => {
//         setPaying(true); setError(''); setSuccess('')
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/repayment/pay-emi/${applicationId}`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setSuccess(data.message)
//             setJustPaid(true)
//             await fetchSchedule()
//             setTimeout(() => setJustPaid(false), 3000)
//         } catch (err: any) {
//             setError(err.message)
//         } finally {
//             setPaying(false)
//         }
//     }
//
//     if (loading) {
//         return (
//             <div className="page-wrapper flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-6">
//                     <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
//                     <p className="text-xl text-purple-400 font-semibold">Loading repayment schedule…</p>
//                 </div>
//             </div>
//         )
//     }
//
//     if (error && !schedule) {
//         return (
//             <div className="page-wrapper flex items-center justify-center p-8">
//                 <div className="text-center">
//                     <p className="text-5xl mb-4">⚠️</p>
//                     <p className="text-2xl font-bold text-gray-800 mb-2">Could not load schedule</p>
//                     <p className="text-gray-400 mb-6">{error}</p>
//                     <button onClick={() => navigate('/loan-status')} className="btn-primary"
//                             style={{ width: 'auto', padding: '14px 32px', borderRadius: '14px' }}>
//                         ← Back to Loan Status
//                     </button>
//                 </div>
//             </div>
//         )
//     }
//
//     if (!schedule) return null
//
//     const progressPct = Math.round((schedule.paidEMIs / schedule.tenure) * 100)
//     const visibleSlots = showAll ? schedule.schedule : schedule.schedule.slice(0, 6)
//
//     // Is the next EMI overdue?
//     const isOverdue = !schedule.isFullyPaid &&
//         new Date() > new Date(schedule.nextDueDate)
//
//     return (
//         <div className="page-wrapper">
//             {/* Navbar */}
//             <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
//                 <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
//                     <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
//                             <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
//                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
//                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
//                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
//                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
//                             </svg>
//                         </div>
//                         <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
//                         <span className="text-base bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full font-semibold ml-2">
//                             Loan Repayment
//                         </span>
//                     </div>
//                     <button onClick={() => navigate('/loan-status')}
//                             className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">
//                         ← Back to Status
//                     </button>
//                 </div>
//             </nav>
//
//             <main className="max-w-5xl mx-auto px-10 py-14">
//
//                 {/* Fully paid state */}
//                 {schedule.isFullyPaid && (
//                     <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-16 text-center mb-10"
//                          style={{ boxShadow: '0 8px 40px rgba(109,40,217,0.4)' }}>
//                         <div className="text-8xl mb-6">🏆</div>
//                         <h1 className="font-display font-bold text-5xl text-white mb-4">Loan Fully Repaid!</h1>
//                         <p className="text-purple-200 text-xl mb-6">
//                             You have successfully repaid ₹{schedule.totalPayable.toLocaleString('en-IN')} over {schedule.tenure} months.
//                         </p>
//                         <div className="bg-white/20 rounded-2xl px-8 py-4 inline-block">
//                             <p className="text-white text-lg font-semibold">
//                                 🚀 Your credit score has been boosted! Apply for your next loan anytime.
//                             </p>
//                         </div>
//                         <div className="mt-8">
//                             <button onClick={() => navigate('/apply-loan')}
//                                     className="bg-white text-purple-700 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-purple-50 transition-colors">
//                                 Apply for Next Loan →
//                             </button>
//                         </div>
//                     </div>
//                 )}
//
//                 {/* Header */}
//                 <div className="mb-10">
//                     <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Repayment Dashboard</p>
//                     <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
//                         Loan of ₹{schedule.loanAmount.toLocaleString('en-IN')}
//                     </h1>
//                     <p className="text-gray-400 text-xl">
//                         {schedule.annualRate}% per annum · {schedule.tenure} months · EMI ₹{schedule.emi.toLocaleString('en-IN')}/month
//                     </p>
//                 </div>
//
//                 {/* Alerts */}
//                 {error && (
//                     <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
//                         <span>⚠️</span> {error}
//                     </div>
//                 )}
//                 {success && (
//                     <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
//                         <span>🎉</span> {success}
//                     </div>
//                 )}
//                 {isOverdue && !schedule.isFullyPaid && (
//                     <div className="bg-red-50 border border-red-300 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
//                         <span className="text-2xl">🚨</span>
//                         <div>
//                             <p className="font-bold text-red-700 text-base">EMI Overdue!</p>
//                             <p className="text-red-600 text-sm">
//                                 EMI {schedule.nextEMINumber} was due on {new Date(schedule.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Pay now to avoid late marks on your record.
//                             </p>
//                         </div>
//                     </div>
//                 )}
//
//                 <div className="grid lg:grid-cols-3 gap-8">
//
//                     {/* Left: Pay EMI card + progress */}
//                     <div className="space-y-6">
//
//                         {/* Pay EMI */}
//                         {!schedule.isFullyPaid && (
//                             <div className={`rounded-3xl p-8 border-2 ${isOverdue ? 'bg-red-50 border-red-300' : 'bg-white border-purple-100'}`}>
//                                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Next EMI Due</p>
//                                 <p className="font-display font-bold text-5xl text-purple-600 mb-1">
//                                     ₹{schedule.emi.toLocaleString('en-IN')}
//                                 </p>
//                                 <p className={`text-base font-semibold mb-1 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
//                                     {isOverdue ? '🚨 Overdue — ' : '📅 Due: '}
//                                     {new Date(schedule.nextDueDate).toLocaleDateString('en-IN', {
//                                         day: 'numeric', month: 'long', year: 'numeric'
//                                     })}
//                                 </p>
//                                 <p className="text-gray-400 text-sm mb-6">
//                                     EMI {schedule.nextEMINumber} of {schedule.tenure}
//                                 </p>
//                                 <button
//                                     onClick={handlePayEMI}
//                                     disabled={paying}
//                                     className={`w-full font-bold text-xl py-5 rounded-2xl transition-all disabled:opacity-50 ${
//                                         justPaid ? 'bg-emerald-600 text-white'
//                                             : isOverdue ? 'bg-red-600 hover:bg-red-700 text-white'
//                                                 : 'bg-purple-600 hover:bg-purple-700 text-white'
//                                     }`}
//                                     style={{ boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}>
//                                     {paying
//                                         ? <span className="flex items-center justify-center gap-2"><Spinner /> Processing…</span>
//                                         : justPaid ? '✅ Paid!'
//                                             : `💳 Pay ₹${schedule.emi.toLocaleString('en-IN')}`}
//                                 </button>
//                                 <p className="text-center text-xs text-gray-300 mt-3">
//                                     Simulated payment · No real money charged
//                                 </p>
//                             </div>
//                         )}
//
//                         {/* Progress */}
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                             <h3 className="font-bold text-xl text-gray-800 mb-6">Repayment Progress</h3>
//
//                             {/* Circle progress */}
//                             <div className="flex items-center justify-center mb-6">
//                                 <div className="relative w-36 h-36">
//                                     <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
//                                         <circle cx="18" cy="18" r="15.9"
//                                                 fill="none" stroke="#ede9fe" strokeWidth="2.5"/>
//                                         <circle cx="18" cy="18" r="15.9"
//                                                 fill="none" stroke="#7c3aed" strokeWidth="2.5"
//                                                 strokeDasharray={`${progressPct} ${100 - progressPct}`}
//                                                 strokeLinecap="round"
//                                                 style={{ transition: 'stroke-dasharray 0.5s ease' }}/>
//                                     </svg>
//                                     <div className="absolute inset-0 flex flex-col items-center justify-center">
//                                         <span className="font-display font-bold text-3xl text-purple-700">{progressPct}%</span>
//                                         <span className="text-gray-400 text-xs">complete</span>
//                                     </div>
//                                 </div>
//                             </div>
//
//                             <div className="space-y-3">
//                                 <Row label="EMIs Paid"      value={`${schedule.paidEMIs} / ${schedule.tenure}`} />
//                                 <Row label="Amount Paid"    value={`₹${schedule.totalPaid.toLocaleString('en-IN')}`} color="text-emerald-600" />
//                                 <Row label="Outstanding"    value={`₹${schedule.outstanding.toLocaleString('en-IN')}`} color="text-red-500" />
//                                 <Row label="Total Payable"  value={`₹${schedule.totalPayable.toLocaleString('en-IN')}`} />
//                                 <Row label="Interest Rate"  value={`${schedule.annualRate}% p.a.`} />
//                             </div>
//                         </div>
//
//                         {/* Credit score boost notice */}
//                         <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
//                             <p className="text-purple-700 font-bold text-base mb-1">🚀 Credit Score Boost</p>
//                             <p className="text-purple-600 text-sm leading-relaxed">
//                                 Every EMI you pay on time builds your credit profile.
//                                 Fully repay this loan to unlock a score boost on your next application.
//                             </p>
//                         </div>
//                     </div>
//
//                     {/* Right: EMI Schedule */}
//                     <div className="lg:col-span-2">
//                         <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
//                             <div className="px-8 py-6 border-b border-purple-50 flex items-center justify-between">
//                                 <h3 className="font-bold text-2xl text-gray-800">
//                                     EMI Schedule
//                                     <span className="text-base text-gray-400 font-normal ml-3">
//                                         {schedule.paidEMIs} paid · {schedule.remainingEMIs} remaining
//                                     </span>
//                                 </h3>
//                             </div>
//
//                             {/* Table header */}
//                             <div className="px-8 py-3 bg-purple-50 grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
//                                 <div className="col-span-1">#</div>
//                                 <div className="col-span-3">Due Date</div>
//                                 <div className="col-span-2 text-right">EMI</div>
//                                 <div className="col-span-2 text-right">Principal</div>
//                                 <div className="col-span-2 text-right">Interest</div>
//                                 <div className="col-span-2 text-right">Status</div>
//                             </div>
//
//                             <div className="divide-y divide-purple-50">
//                                 {visibleSlots.map((slot) => {
//                                     const isPast     = new Date() > new Date(slot.dueDate)
//                                     const isNext     = slot.emiNumber === schedule.nextEMINumber && !schedule.isFullyPaid
//                                     const isOverdueSlot = !slot.paid && isPast
//
//                                     return (
//                                         <div key={slot.emiNumber}
//                                              className={`px-8 py-4 grid grid-cols-12 gap-2 items-center transition-colors ${
//                                                  slot.paid        ? 'bg-emerald-50/50'
//                                                      : isNext         ? 'bg-purple-50'
//                                                          : isOverdueSlot  ? 'bg-red-50/50'
//                                                              : ''
//                                              }`}>
//                                             <div className="col-span-1">
//                                                 <span className={`text-sm font-bold ${
//                                                     slot.paid ? 'text-emerald-500'
//                                                         : isNext  ? 'text-purple-600'
//                                                             : isOverdueSlot ? 'text-red-500'
//                                                                 : 'text-gray-300'
//                                                 }`}>
//                                                     {slot.emiNumber}
//                                                 </span>
//                                             </div>
//                                             <div className="col-span-3">
//                                                 <p className="text-sm text-gray-600 font-medium">
//                                                     {new Date(slot.dueDate).toLocaleDateString('en-IN', {
//                                                         day: 'numeric', month: 'short', year: '2-digit'
//                                                     })}
//                                                 </p>
//                                             </div>
//                                             <div className="col-span-2 text-right">
//                                                 <p className="text-sm font-bold text-gray-800">₹{slot.amount.toLocaleString('en-IN')}</p>
//                                             </div>
//                                             <div className="col-span-2 text-right">
//                                                 <p className="text-xs text-gray-400">₹{slot.principal.toLocaleString('en-IN')}</p>
//                                             </div>
//                                             <div className="col-span-2 text-right">
//                                                 <p className="text-xs text-gray-400">₹{slot.interest.toLocaleString('en-IN')}</p>
//                                             </div>
//                                             <div className="col-span-2 text-right">
//                                                 {slot.paid ? (
//                                                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${
//                                                         slot.late ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
//                                                     }`}>
//                                                         {slot.late ? '⚠️ Late' : '✅ Paid'}
//                                                     </span>
//                                                 ) : isNext ? (
//                                                     <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
//                                                         ← Next
//                                                     </span>
//                                                 ) : isOverdueSlot ? (
//                                                     <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">
//                                                         Overdue
//                                                     </span>
//                                                 ) : (
//                                                     <span className="text-xs text-gray-300">Upcoming</span>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     )
//                                 })}
//                             </div>
//
//                             {schedule.schedule.length > 6 && (
//                                 <div className="px-8 py-5 border-t border-purple-50 text-center">
//                                     <button
//                                         onClick={() => setShowAll(!showAll)}
//                                         className="text-purple-600 hover:text-purple-800 font-semibold text-base transition-colors">
//                                         {showAll
//                                             ? '↑ Show less'
//                                             : `↓ Show all ${schedule.tenure} EMIs`}
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </main>
//         </div>
//     )
// }
//
// function Row({ label, value, color }: { label: string; value: string; color?: string }) {
//     return (
//         <div className="flex items-center justify-between py-2.5 border-b border-purple-50 last:border-0">
//             <span className="text-gray-400 text-sm font-medium">{label}</span>
//             <span className={`text-sm font-bold ${color || 'text-gray-800'}`}>{value}</span>
//         </div>
//     )
// }
//
// function Spinner() {
//     return (
//         <svg width="20" height="20" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
//             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
//                     strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
//         </svg>
//     )
// }
//

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface EMISlot {
    emiNumber: number; amount: number; principal: number; interest: number
    balance: number; dueDate: string; paid: boolean; paidAt: string | null; late: boolean
}
interface Schedule {
    applicationId: string; loanAmount: number; annualRate: number; emi: number
    tenure: number; totalPayable: number; totalPaid: number; outstanding: number
    paidEMIs: number; remainingEMIs: number; nextDueDate: string; nextEMINumber: number
    isFullyPaid: boolean; schedule: EMISlot[]
}

export default function RepaymentPage() {
    const { session } = useAuth()
    const navigate    = useNavigate()
    const location    = useLocation()
    const applicationId = location.state?.applicationId || ''

    const [schedule, setSchedule] = useState<Schedule | null>(null)
    const [loading, setLoading]   = useState(true)
    const [paying, setPaying]     = useState(false)
    const [error, setError]       = useState('')
    const [success, setSuccess]   = useState('')
    const [showAll, setShowAll]   = useState(false)
    const [justPaid, setJustPaid] = useState(false)

    useEffect(() => {
        if (!applicationId) { navigate('/loan-status'); return }
        fetchSchedule()
        const channel = supabase.channel('repayment_live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emi_payments', filter: `application_id=eq.${applicationId}` }, () => fetchSchedule())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loan_applications', filter: `id=eq.${applicationId}` }, () => fetchSchedule())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [applicationId])

    const fetchSchedule = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/api/repayment/schedule/${applicationId}`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSchedule(data)
        } catch (err: any) { setError(err.message) }
        finally { setLoading(false) }
    }

    const handlePayEMI = async () => {
        setPaying(true); setError(''); setSuccess('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/repayment/pay-emi/${applicationId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` } })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(data.message); setJustPaid(true)
            await fetchSchedule()
            setTimeout(() => setJustPaid(false), 3000)
        } catch (err: any) { setError(err.message) }
        finally { setPaying(false) }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    <p style={{ fontSize: 15, color: '#43474f', fontWeight: 600 }}>Loading repayment schedule…</p>
                </div>
            </div>
        )
    }

    if (error && !schedule) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
                    <p style={{ fontWeight: 700, fontSize: 20, color: '#001736', marginBottom: 8 }}>Could not load schedule</p>
                    <p style={{ fontSize: 14, color: '#43474f', marginBottom: 24 }}>{error}</p>
                    <button onClick={() => navigate('/loan-status')} style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back to Loan Status</button>
                </div>
            </div>
        )
    }

    if (!schedule) return null

    const progressPct   = Math.round((schedule.paidEMIs / schedule.tenure) * 100)
    const visibleSlots  = showAll ? schedule.schedule : schedule.schedule.slice(0, 6)
    const isOverdue     = !schedule.isFullyPaid && new Date() > new Date(schedule.nextDueDate)

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* Navbar */}
            <nav style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#eef4ff', color: '#0060ac', padding: '4px 12px', borderRadius: 100 }}>Loan Repayment</span>
                    </div>
                    <button onClick={() => navigate('/loan-status')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f' }}>
                        ← Back to Status
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

                {/* Fully paid */}
                {schedule.isFullyPaid && (
                    <div style={{ background: 'linear-gradient(135deg, #001736, #002b5b)', borderRadius: 20, padding: '64px', textAlign: 'center', marginBottom: 32, boxShadow: '0 8px 32px rgba(0,23,54,0.3)' }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>🏆</div>
                        <h1 style={{ fontWeight: 900, fontSize: 36, color: 'white', marginBottom: 12 }}>Loan Fully Repaid!</h1>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
                            You have successfully repaid ₹{schedule.totalPayable.toLocaleString('en-IN')} over {schedule.tenure} months.
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 24px', display: 'inline-block', marginBottom: 28 }}>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>🚀 Your credit score has been boosted!</p>
                        </div>
                        <div>
                            <button onClick={() => navigate('/apply-loan')}
                                    style={{ background: 'white', color: '#001736', border: 'none', borderRadius: 10, padding: '13px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                                Apply for Next Loan →
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Repayment Dashboard</p>
                    <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 3vw, 34px)', color: '#001736', letterSpacing: '-1px', marginBottom: 6 }}>
                        Loan of ₹{schedule.loanAmount.toLocaleString('en-IN')}
                    </h1>
                    <p style={{ fontSize: 14, color: '#43474f' }}>{schedule.annualRate}% p.a. · {schedule.tenure} months · EMI ₹{schedule.emi.toLocaleString('en-IN')}/month</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 16, fontSize: 14, display: 'flex', gap: 8 }}>⚠️ {error}</div>
                )}
                {success && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '12px 20px', marginBottom: 16, fontSize: 14, display: 'flex', gap: 8 }}>🎉 {success}</div>
                )}
                {isOverdue && !schedule.isFullyPaid && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>🚨</span>
                        <div>
                            <p style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, margin: 0, marginBottom: 2 }}>EMI Overdue!</p>
                            <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>EMI {schedule.nextEMINumber} was due on {new Date(schedule.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Pay now to avoid late marks.</p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

                    {/* Left */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Pay EMI */}
                        {!schedule.isFullyPaid && (
                            <div style={{ background: isOverdue ? '#fef2f2' : 'white', border: `1.5px solid ${isOverdue ? '#fecaca' : '#e0e3e5'}`, borderRadius: 12, padding: '20px' }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Next EMI Due</p>
                                <p style={{ fontWeight: 900, fontSize: 32, color: '#0060ac', letterSpacing: '-1px', marginBottom: 4 }}>
                                    ₹{schedule.emi.toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: 13, fontWeight: 600, color: isOverdue ? '#dc2626' : '#43474f', marginBottom: 4 }}>
                                    {isOverdue ? '🚨 Overdue — ' : '📅 Due: '}
                                    {new Date(schedule.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p style={{ fontSize: 12, color: '#747780', marginBottom: 16 }}>EMI {schedule.nextEMINumber} of {schedule.tenure}</p>
                                <button onClick={handlePayEMI} disabled={paying}
                                        style={{ width: '100%', padding: '13px', background: justPaid ? '#16a34a' : isOverdue ? '#dc2626' : '#001736', color: 'white', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {paying ? <><Spinner/> Processing…</> : justPaid ? '✅ Paid!' : `💳 Pay ₹${schedule.emi.toLocaleString('en-IN')}`}
                                </button>
                                <p style={{ textAlign: 'center', fontSize: 11, color: '#c4c6d0', marginTop: 8 }}>Simulated payment · No real money charged</p>
                            </div>
                        )}

                        {/* Progress */}
                        <div style={{ background: 'white', border: '1px solid #e0e3e5', borderRadius: 12, padding: '20px' }}>
                            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 16 }}>Repayment Progress</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                <div style={{ position: 'relative', width: 120, height: 120 }}>
                                    <svg viewBox="0 0 36 36" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0e3e5" strokeWidth="2.5"/>
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0060ac" strokeWidth="2.5"
                                                strokeDasharray={`${progressPct} ${100 - progressPct}`} strokeLinecap="round"
                                                style={{ transition: 'stroke-dasharray 0.5s ease' }}/>
                                    </svg>
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontWeight: 900, fontSize: 24, color: '#0060ac', letterSpacing: '-1px' }}>{progressPct}%</span>
                                        <span style={{ fontSize: 10, color: '#747780' }}>complete</span>
                                    </div>
                                </div>
                            </div>
                            {[
                                { label: 'EMIs Paid',     value: `${schedule.paidEMIs} / ${schedule.tenure}`,                           color: undefined },
                                { label: 'Amount Paid',   value: `₹${schedule.totalPaid.toLocaleString('en-IN')}`,                      color: '#15803d' },
                                { label: 'Outstanding',   value: `₹${schedule.outstanding.toLocaleString('en-IN')}`,                    color: '#dc2626' },
                                { label: 'Total Payable', value: `₹${schedule.totalPayable.toLocaleString('en-IN')}`,                   color: undefined },
                                { label: 'Interest Rate', value: `${schedule.annualRate}% p.a.`,                                        color: undefined },
                            ].map(r => (
                                <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f2f4f6' }}>
                                    <span style={{ fontSize: 12, color: '#747780' }}>{r.label}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color || '#001736' }}>{r.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Tip */}
                        <div style={{ background: '#eef4ff', border: '1px solid #a4c9ff', borderRadius: 10, padding: '14px 16px' }}>
                            <p style={{ fontWeight: 700, color: '#0060ac', fontSize: 13, marginBottom: 4 }}>🚀 Credit Score Boost</p>
                            <p style={{ color: '#0060ac', fontSize: 12, lineHeight: 1.5 }}>Every on-time EMI builds your credit profile. Fully repay to unlock a score boost.</p>
                        </div>
                    </div>

                    {/* Right — EMI Schedule */}
                    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e0e3e5', overflow: 'hidden' }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f2f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', margin: 0 }}>
                                EMI Schedule
                                <span style={{ fontSize: 12, color: '#747780', fontWeight: 400, marginLeft: 10 }}>
                                    {schedule.paidEMIs} paid · {schedule.remainingEMIs} remaining
                                </span>
                            </h3>
                        </div>

                        {/* Table header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px 80px', gap: 8, padding: '10px 20px', background: '#f7f9fb', fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            <div>#</div><div>Due Date</div><div style={{ textAlign: 'right' }}>EMI</div><div style={{ textAlign: 'right' }}>Principal</div><div style={{ textAlign: 'right' }}>Interest</div><div style={{ textAlign: 'right' }}>Status</div>
                        </div>

                        <div>
                            {visibleSlots.map(slot => {
                                const isPast        = new Date() > new Date(slot.dueDate)
                                const isNext        = slot.emiNumber === schedule.nextEMINumber && !schedule.isFullyPaid
                                const isOverdueSlot = !slot.paid && isPast
                                return (
                                    <div key={slot.emiNumber} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px 80px', gap: 8, padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid #f7f9fb', background: slot.paid ? '#f0fdf4' : isNext ? '#eef4ff' : isOverdueSlot ? '#fef2f2' : 'white' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: slot.paid ? '#15803d' : isNext ? '#0060ac' : isOverdueSlot ? '#dc2626' : '#c4c6d0' }}>
                                            {slot.emiNumber}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#43474f', fontWeight: 500 }}>
                                            {new Date(slot.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#001736' }}>₹{slot.amount.toLocaleString('en-IN')}</div>
                                        <div style={{ textAlign: 'right', fontSize: 11, color: '#747780' }}>₹{slot.principal.toLocaleString('en-IN')}</div>
                                        <div style={{ textAlign: 'right', fontSize: 11, color: '#747780' }}>₹{slot.interest.toLocaleString('en-IN')}</div>
                                        <div style={{ textAlign: 'right' }}>
                                            {slot.paid ? (
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: slot.late ? '#fefce8' : '#f0fdf4', color: slot.late ? '#a16207' : '#15803d' }}>
                                                    {slot.late ? '⚠️ Late' : '✅ Paid'}
                                                </span>
                                            ) : isNext ? (
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: '#eef4ff', color: '#0060ac' }}>← Next</span>
                                            ) : isOverdueSlot ? (
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: '#fef2f2', color: '#dc2626' }}>Overdue</span>
                                            ) : (
                                                <span style={{ fontSize: 10, color: '#c4c6d0' }}>Upcoming</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {schedule.schedule.length > 6 && (
                            <div style={{ padding: '14px', textAlign: 'center', borderTop: '1px solid #f2f4f6' }}>
                                <button onClick={() => setShowAll(!showAll)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0060ac' }}>
                                    {showAll ? '↑ Show less' : `↓ Show all ${schedule.tenure} EMIs`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}
