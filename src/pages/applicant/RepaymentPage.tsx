import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface EMISlot {
    emiNumber: number
    amount: number
    principal: number
    interest: number
    balance: number
    dueDate: string
    paid: boolean
    paidAt: string | null
    late: boolean
}

interface Schedule {
    applicationId: string
    loanAmount: number
    annualRate: number
    emi: number
    tenure: number
    totalPayable: number
    totalPaid: number
    outstanding: number
    paidEMIs: number
    remainingEMIs: number
    nextDueDate: string
    nextEMINumber: number
    isFullyPaid: boolean
    schedule: EMISlot[]
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

        // Realtime: refresh when a new EMI payment is recorded
        const channel = supabase
            .channel('repayment_live')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'emi_payments',
                filter: `application_id=eq.${applicationId}`
            }, () => fetchSchedule())
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'loan_applications',
                filter: `id=eq.${applicationId}`
            }, () => fetchSchedule())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [applicationId])

    const fetchSchedule = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/api/repayment/schedule/${applicationId}`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSchedule(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePayEMI = async () => {
        setPaying(true); setError(''); setSuccess('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/repayment/pay-emi/${applicationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(data.message)
            setJustPaid(true)
            await fetchSchedule()
            setTimeout(() => setJustPaid(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setPaying(false)
        }
    }

    if (loading) {
        return (
            <div className="page-wrapper flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <p className="text-xl text-purple-400 font-semibold">Loading repayment schedule…</p>
                </div>
            </div>
        )
    }

    if (error && !schedule) {
        return (
            <div className="page-wrapper flex items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-5xl mb-4">⚠️</p>
                    <p className="text-2xl font-bold text-gray-800 mb-2">Could not load schedule</p>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button onClick={() => navigate('/loan-status')} className="btn-primary"
                            style={{ width: 'auto', padding: '14px 32px', borderRadius: '14px' }}>
                        ← Back to Loan Status
                    </button>
                </div>
            </div>
        )
    }

    if (!schedule) return null

    const progressPct = Math.round((schedule.paidEMIs / schedule.tenure) * 100)
    const visibleSlots = showAll ? schedule.schedule : schedule.schedule.slice(0, 6)

    // Is the next EMI overdue?
    const isOverdue = !schedule.isFullyPaid &&
        new Date() > new Date(schedule.nextDueDate)

    return (
        <div className="page-wrapper">
            {/* Navbar */}
            <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
                            </svg>
                        </div>
                        <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
                        <span className="text-base bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full font-semibold ml-2">
                            Loan Repayment
                        </span>
                    </div>
                    <button onClick={() => navigate('/loan-status')}
                            className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">
                        ← Back to Status
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-10 py-14">

                {/* Fully paid state */}
                {schedule.isFullyPaid && (
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-16 text-center mb-10"
                         style={{ boxShadow: '0 8px 40px rgba(109,40,217,0.4)' }}>
                        <div className="text-8xl mb-6">🏆</div>
                        <h1 className="font-display font-bold text-5xl text-white mb-4">Loan Fully Repaid!</h1>
                        <p className="text-purple-200 text-xl mb-6">
                            You have successfully repaid ₹{schedule.totalPayable.toLocaleString('en-IN')} over {schedule.tenure} months.
                        </p>
                        <div className="bg-white/20 rounded-2xl px-8 py-4 inline-block">
                            <p className="text-white text-lg font-semibold">
                                🚀 Your credit score has been boosted! Apply for your next loan anytime.
                            </p>
                        </div>
                        <div className="mt-8">
                            <button onClick={() => navigate('/apply-loan')}
                                    className="bg-white text-purple-700 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-purple-50 transition-colors">
                                Apply for Next Loan →
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-10">
                    <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Repayment Dashboard</p>
                    <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
                        Loan of ₹{schedule.loanAmount.toLocaleString('en-IN')}
                    </h1>
                    <p className="text-gray-400 text-xl">
                        {schedule.annualRate}% per annum · {schedule.tenure} months · EMI ₹{schedule.emi.toLocaleString('en-IN')}/month
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
                        <span>🎉</span> {success}
                    </div>
                )}
                {isOverdue && !schedule.isFullyPaid && (
                    <div className="bg-red-50 border border-red-300 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <div>
                            <p className="font-bold text-red-700 text-base">EMI Overdue!</p>
                            <p className="text-red-600 text-sm">
                                EMI {schedule.nextEMINumber} was due on {new Date(schedule.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Pay now to avoid late marks on your record.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left: Pay EMI card + progress */}
                    <div className="space-y-6">

                        {/* Pay EMI */}
                        {!schedule.isFullyPaid && (
                            <div className={`rounded-3xl p-8 border-2 ${isOverdue ? 'bg-red-50 border-red-300' : 'bg-white border-purple-100'}`}>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Next EMI Due</p>
                                <p className="font-display font-bold text-5xl text-purple-600 mb-1">
                                    ₹{schedule.emi.toLocaleString('en-IN')}
                                </p>
                                <p className={`text-base font-semibold mb-1 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                                    {isOverdue ? '🚨 Overdue — ' : '📅 Due: '}
                                    {new Date(schedule.nextDueDate).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </p>
                                <p className="text-gray-400 text-sm mb-6">
                                    EMI {schedule.nextEMINumber} of {schedule.tenure}
                                </p>
                                <button
                                    onClick={handlePayEMI}
                                    disabled={paying}
                                    className={`w-full font-bold text-xl py-5 rounded-2xl transition-all disabled:opacity-50 ${
                                        justPaid ? 'bg-emerald-600 text-white'
                                            : isOverdue ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                                    style={{ boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}>
                                    {paying
                                        ? <span className="flex items-center justify-center gap-2"><Spinner /> Processing…</span>
                                        : justPaid ? '✅ Paid!'
                                            : `💳 Pay ₹${schedule.emi.toLocaleString('en-IN')}`}
                                </button>
                                <p className="text-center text-xs text-gray-300 mt-3">
                                    Simulated payment · No real money charged
                                </p>
                            </div>
                        )}

                        {/* Progress */}
                        <div className="bg-white rounded-3xl p-8 border border-purple-100">
                            <h3 className="font-bold text-xl text-gray-800 mb-6">Repayment Progress</h3>

                            {/* Circle progress */}
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative w-36 h-36">
                                    <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                                        <circle cx="18" cy="18" r="15.9"
                                                fill="none" stroke="#ede9fe" strokeWidth="2.5"/>
                                        <circle cx="18" cy="18" r="15.9"
                                                fill="none" stroke="#7c3aed" strokeWidth="2.5"
                                                strokeDasharray={`${progressPct} ${100 - progressPct}`}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dasharray 0.5s ease' }}/>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="font-display font-bold text-3xl text-purple-700">{progressPct}%</span>
                                        <span className="text-gray-400 text-xs">complete</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Row label="EMIs Paid"      value={`${schedule.paidEMIs} / ${schedule.tenure}`} />
                                <Row label="Amount Paid"    value={`₹${schedule.totalPaid.toLocaleString('en-IN')}`} color="text-emerald-600" />
                                <Row label="Outstanding"    value={`₹${schedule.outstanding.toLocaleString('en-IN')}`} color="text-red-500" />
                                <Row label="Total Payable"  value={`₹${schedule.totalPayable.toLocaleString('en-IN')}`} />
                                <Row label="Interest Rate"  value={`${schedule.annualRate}% p.a.`} />
                            </div>
                        </div>

                        {/* Credit score boost notice */}
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                            <p className="text-purple-700 font-bold text-base mb-1">🚀 Credit Score Boost</p>
                            <p className="text-purple-600 text-sm leading-relaxed">
                                Every EMI you pay on time builds your credit profile.
                                Fully repay this loan to unlock a score boost on your next application.
                            </p>
                        </div>
                    </div>

                    {/* Right: EMI Schedule */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-purple-50 flex items-center justify-between">
                                <h3 className="font-bold text-2xl text-gray-800">
                                    EMI Schedule
                                    <span className="text-base text-gray-400 font-normal ml-3">
                                        {schedule.paidEMIs} paid · {schedule.remainingEMIs} remaining
                                    </span>
                                </h3>
                            </div>

                            {/* Table header */}
                            <div className="px-8 py-3 bg-purple-50 grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                <div className="col-span-1">#</div>
                                <div className="col-span-3">Due Date</div>
                                <div className="col-span-2 text-right">EMI</div>
                                <div className="col-span-2 text-right">Principal</div>
                                <div className="col-span-2 text-right">Interest</div>
                                <div className="col-span-2 text-right">Status</div>
                            </div>

                            <div className="divide-y divide-purple-50">
                                {visibleSlots.map((slot) => {
                                    const isPast     = new Date() > new Date(slot.dueDate)
                                    const isNext     = slot.emiNumber === schedule.nextEMINumber && !schedule.isFullyPaid
                                    const isOverdueSlot = !slot.paid && isPast

                                    return (
                                        <div key={slot.emiNumber}
                                             className={`px-8 py-4 grid grid-cols-12 gap-2 items-center transition-colors ${
                                                 slot.paid        ? 'bg-emerald-50/50'
                                                     : isNext         ? 'bg-purple-50'
                                                         : isOverdueSlot  ? 'bg-red-50/50'
                                                             : ''
                                             }`}>
                                            <div className="col-span-1">
                                                <span className={`text-sm font-bold ${
                                                    slot.paid ? 'text-emerald-500'
                                                        : isNext  ? 'text-purple-600'
                                                            : isOverdueSlot ? 'text-red-500'
                                                                : 'text-gray-300'
                                                }`}>
                                                    {slot.emiNumber}
                                                </span>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-sm text-gray-600 font-medium">
                                                    {new Date(slot.dueDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-sm font-bold text-gray-800">₹{slot.amount.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-xs text-gray-400">₹{slot.principal.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <p className="text-xs text-gray-400">₹{slot.interest.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                {slot.paid ? (
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                        slot.late ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {slot.late ? '⚠️ Late' : '✅ Paid'}
                                                    </span>
                                                ) : isNext ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                                        ← Next
                                                    </span>
                                                ) : isOverdueSlot ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">Upcoming</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {schedule.schedule.length > 6 && (
                                <div className="px-8 py-5 border-t border-purple-50 text-center">
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-purple-600 hover:text-purple-800 font-semibold text-base transition-colors">
                                        {showAll
                                            ? '↑ Show less'
                                            : `↓ Show all ${schedule.tenure} EMIs`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-purple-50 last:border-0">
            <span className="text-gray-400 text-sm font-medium">{label}</span>
            <span className={`text-sm font-bold ${color || 'text-gray-800'}`}>{value}</span>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}

