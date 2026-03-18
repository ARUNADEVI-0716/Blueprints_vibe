import { useState, useEffect } from 'react'
import FraudAlertPanel from '@/components/FraudAlertPanel'
import { useNavigate, useParams } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function ApplicationReview() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [data, setData]           = useState<any>(null)
    const [loading, setLoading]     = useState(true)
    const [deciding, setDeciding]   = useState(false)
    const [decision, setDecision]   = useState<'approve' | 'reject' | null>(null)
    const [notes, setNotes]         = useState('')
    const [error, setError]         = useState('')
    const [success, setSuccess]     = useState('')
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'score' | 'fraud' | 'decision'>('overview')

    const token = localStorage.getItem('officer_token')

    useEffect(() => {
        if (!token) { navigate('/officer/login'); return }
        fetchApplication()
    }, [id])

    const fetchApplication = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/applications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.status === 401) { navigate('/officer/login'); return }
            const result = await res.json()
            setData(result)
        } catch {
            setError('Failed to load application')
        } finally {
            setLoading(false)
        }
    }


    const handleMarkRepaid = async (repaidOnTime: boolean) => {
        setDeciding(true); setError('')
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/officer/applications/${id}/mark-repaid`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ repaidOnTime })
                }
            )
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            setSuccess(repaidOnTime
                ? '🏆 Loan marked as repaid on time! Borrower credit score will be boosted on next application.'
                : '⚠️ Loan marked as repaid (late). Recorded in borrower repayment history.')
            await fetchApplication()
        } catch (err: any) {
            setError(err.message || 'Failed to update repayment status')
        } finally {
            setDeciding(false)
        }
    }

    const handleDecision = async () => {
        if (!decision) { setError('Please select approve or reject'); return }
        if (!notes.trim()) { setError('Please add officer notes'); return }
        setDeciding(true); setError('')
        try {
            const res = await fetch(
                `${BACKEND_URL}/api/officer/applications/${id}/${decision}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ notes })
                }
            )
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            setSuccess(decision === 'approve'
                ? '✅ Loan approved! Stripe payout has been initiated.'
                : '❌ Application rejected. Applicant has been notified.')
            await fetchApplication()
            setActiveTab('overview')
        } catch (err: any) {
            setError(err.message || 'Decision failed')
        } finally {
            setDeciding(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 750) return '#22c55e'
        if (score >= 650) return '#8b5cf6'
        if (score >= 550) return '#f59e0b'
        return '#ef4444'
    }

    const getImpactColor = (impact: string) => {
        if (impact === 'positive') return 'text-emerald-600 bg-emerald-50 border-emerald-200'
        if (impact === 'negative') return 'text-red-500 bg-red-50 border-red-200'
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }

    if (loading) {
        return (
            <div className="page-wrapper flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <p className="text-xl text-purple-400 font-semibold">Loading application…</p>
                </div>
            </div>
        )
    }

    const { application, creditScore, transactions, accounts } = data || {}

    if (!application) {
        return (
            <div className="page-wrapper flex items-center justify-center">
                <div className="text-center">
                    <p className="text-4xl mb-4">😕</p>
                    <p className="text-2xl font-bold text-gray-800">Application not found</p>
                    <button onClick={() => navigate('/officer/dashboard')}
                            className="mt-6 btn-primary"
                            style={{ width: 'auto', padding: '14px 32px', fontSize: '16px', borderRadius: '14px' }}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const scoreData      = creditScore?.breakdown || application?.score_breakdown
    const alreadyDecided = application.status === 'approved' || application.status === 'rejected' || application.status === 'repaid'
    const agreementSigned       = !!application.agreement_signed
    const guarantorOtpVerified  = !!application.guarantor_otp_verified

    return (
        <div className="page-wrapper">
            {/* Navbar */}
            <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/officer/dashboard')}
                                className="flex items-center gap-2 text-gray-400 hover:text-purple-600 transition-colors font-semibold text-base">
                            <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                                <path d="M8 2L4 6.5 8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Dashboard
                        </button>
                        <span className="text-gray-300">/</span>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                                    <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                    <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                    <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
                                </svg>
                            </div>
                            <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Application Review</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold border ${
                        application.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                application.status === 'repaid'   ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}>
                        {application.status === 'approved' ? '✅' : application.status === 'rejected' ? '❌' : application.status === 'repaid' ? '🏆' : '⏳'}
                        {application.status.toUpperCase()}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-10 py-14">

                {/* Header */}
                <div className="flex items-start justify-between mb-12 flex-wrap gap-6">
                    <div>
                        <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Loan Application</p>
                        <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
                            {application.full_name || 'Unknown Applicant'}
                        </h1>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-gray-400 text-lg">{application.email}</span>
                            <span className={`text-base font-bold px-4 py-1.5 rounded-full ${
                                application.user_type === 'existing' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {application.user_type === 'existing' ? '✅ Existing Customer' : '🌟 Cold Start (First-time)'}
                            </span>
                            {agreementSigned && (
                                <span className="text-base font-bold px-4 py-1.5 rounded-full bg-purple-100 text-purple-700">
                                    ✍️ Agreement Signed
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-base mb-1">Loan Amount Requested</p>
                        <p className="font-display font-bold text-5xl text-purple-600">
                            ₹{Number(application.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-gray-400 text-base mt-1">{application.tenure} months · {application.purpose}</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-6 text-base flex items-center gap-3">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-6 py-4 mb-6 text-base flex items-center gap-3">
                        <span>🎉</span> {success}
                    </div>
                )}

                {/* Tabs — no Documents tab */}
                <div className="flex items-center gap-2 mb-10 border-b border-purple-100 pb-1">
                    {[
                        { id: 'overview',     label: '📋 Overview' },
                        { id: 'score',        label: '📊 Credit Score' },
                        { id: 'transactions', label: '🏦 Bank Data' },
                        { id: 'fraud',        label: '🔍 Fraud', highlight: !!(application.fraud_risk_level && application.fraud_risk_level !== 'clean') },
                        { id: 'decision',     label: '⚖️ Decision', highlight: !alreadyDecided },
                    ].map(tab => (
                        <button key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl text-base font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : tab.highlight
                                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 hover:bg-yellow-200'
                                            : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                                }`}>
                            {tab.label}
                            {tab.highlight && (
                                <span className="ml-2 w-2.5 h-2.5 bg-yellow-500 rounded-full inline-block animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Overview ── */}
                {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-2 gap-8">

                        {/* Applicant Details — now includes PAN + Aadhaar */}
                        <div className="bg-white rounded-3xl p-8 border border-purple-100">
                            <h3 className="font-bold text-2xl text-gray-800 mb-6">👤 Applicant Details</h3>
                            <div className="space-y-1">
                                {[
                                    { label: 'Full Name',      value: application.full_name },
                                    { label: 'Email',          value: application.email },
                                    { label: 'Employment',     value: application.employment_type },
                                    { label: 'Employer',       value: application.employer_name || 'N/A' },
                                    { label: 'Monthly Income', value: `₹${Number(application.monthly_income).toLocaleString('en-IN')}` },
                                    { label: 'PAN Number',     value: application.pan_number || '—', mono: true },
                                    { label: 'Aadhaar',        value: application.aadhaar_number ? `XXXX XXXX ${application.aadhaar_number.slice(-4)}` : '—' },
                                    { label: 'Profile Type',   value: application.user_type === 'existing' ? 'Existing Customer' : 'Cold Start' },
                                ].map((item: any) => (
                                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-purple-50">
                                        <span className="text-gray-400 text-base font-medium">{item.label}</span>
                                        <span className={`text-gray-800 text-base font-semibold ${item.mono ? 'font-mono tracking-widest' : ''}`}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Loan Details */}
                            <div className="bg-white rounded-3xl p-8 border border-purple-100">
                                <h3 className="font-bold text-2xl text-gray-800 mb-6">📋 Loan Details</h3>
                                <div className="space-y-1">
                                    {[
                                        { label: 'Amount',       value: `₹${Number(application.amount).toLocaleString('en-IN')}` },
                                        { label: 'Purpose',      value: application.purpose },
                                        { label: 'Tenure',       value: `${application.tenure} months` },
                                        { label: 'Applied On',   value: new Date(application.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                        { label: 'Status',       value: application.status.toUpperCase() },
                                        { label: 'Officer Notes',value: application.officer_notes || 'None yet' },
                                    ].map((item: any) => (
                                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-purple-50">
                                            <span className="text-gray-400 text-base font-medium">{item.label}</span>
                                            <span className="text-gray-800 text-base font-semibold">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Guarantor */}
                            <div className="bg-white rounded-3xl p-8 border border-purple-100">
                                <h3 className="font-bold text-xl text-gray-800 mb-4">👥 Guarantor</h3>
                                {application.guarantor_name ? (
                                    <div className="space-y-1">
                                        {[
                                            { label: 'Name',         value: application.guarantor_name },
                                            { label: 'Mobile',       value: application.guarantor_mobile },
                                            { label: 'Relation',     value: application.guarantor_relation || 'Not specified' },
                                            { label: 'OTP Verified', value: guarantorOtpVerified ? '✅ Yes' : '❌ No' },
                                        ].map((item: any) => (
                                            <div key={item.label} className="flex items-center justify-between py-3 border-b border-purple-50">
                                                <span className="text-gray-400 text-base font-medium">{item.label}</span>
                                                <span className="text-gray-800 text-base font-semibold">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-base">No guarantor submitted yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Agreement status — full width */}
                        <div className={`lg:col-span-2 rounded-3xl p-6 border flex items-center gap-5 ${
                            agreementSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                            <span className="text-4xl">{agreementSigned ? '✍️' : '⏳'}</span>
                            <div>
                                <p className={`font-bold text-lg ${agreementSigned ? 'text-emerald-800' : 'text-yellow-800'}`}>
                                    {agreementSigned ? 'Loan Agreement Digitally Signed' : 'Loan Agreement Not Yet Signed'}
                                </p>
                                <p className={`text-base ${agreementSigned ? 'text-emerald-600' : 'text-yellow-600'}`}>
                                    {agreementSigned
                                        ? `Signed on ${new Date(application.agreement_signed_at).toLocaleString('en-IN')} · IP: ${application.agreement_ip || 'N/A'}`
                                        : 'Applicant has not completed the digital signature step yet.'}
                                </p>
                            </div>
                        </div>

                        {/* Bank Accounts */}
                        {accounts && accounts.length > 0 && (
                            <div className="bg-white rounded-3xl p-8 border border-purple-100">
                                <h3 className="font-bold text-2xl text-gray-800 mb-6">🏦 Bank Accounts</h3>
                                <div className="space-y-4">
                                    {accounts.map((acc: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-purple-50 rounded-2xl">
                                            <div>
                                                <p className="font-semibold text-gray-800 text-lg">{acc.name}</p>
                                                <p className="text-gray-400 text-sm capitalize">{acc.account_type}</p>
                                            </div>
                                            <p className="font-display font-bold text-2xl text-purple-600">
                                                ₹{Number(acc.balance).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Credit Summary */}
                        {scoreData && (
                            <div className="bg-white rounded-3xl p-8 border border-purple-100">
                                <h3 className="font-bold text-2xl text-gray-800 mb-6">📊 Credit Summary</h3>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-display font-bold text-3xl"
                                         style={{ background: `${getScoreColor(scoreData.score)}15`, color: getScoreColor(scoreData.score) }}>
                                        {scoreData.score}
                                    </div>
                                    <div>
                                        <p className="font-bold text-2xl text-gray-900">{scoreData.grade}</p>
                                        <p className="text-gray-400 text-lg">{scoreData.riskLevel}</p>
                                        <p className="text-base mt-1 font-semibold" style={{ color: getScoreColor(scoreData.score) }}>
                                            {scoreData.isColdStart ? '🌟 Cold Start' : '✅ Hybrid Model'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-base leading-relaxed bg-purple-50 rounded-2xl p-4">
                                    {scoreData.recommendation}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Credit Score ── */}
                {activeTab === 'score' && scoreData && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-10 border border-purple-100 text-center mb-8">
                            <div className="inline-flex items-center gap-6 mb-6">
                                <div className="w-24 h-24 rounded-3xl flex items-center justify-center font-display font-bold text-4xl"
                                     style={{ background: `${getScoreColor(scoreData.score)}15`, color: getScoreColor(scoreData.score) }}>
                                    {scoreData.score}
                                </div>
                                <div className="text-left">
                                    <p className="font-display font-bold text-4xl text-gray-900">{scoreData.grade}</p>
                                    <p className="text-xl text-gray-400">{scoreData.riskLevel}</p>
                                    <p className="text-base font-semibold mt-1" style={{ color: getScoreColor(scoreData.score) }}>
                                        Max: {scoreData.maxScore} · {scoreData.isColdStart ? '🌟 Cold Start' : '✅ Hybrid'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{scoreData.recommendation}</p>
                        </div>
                        <h3 className="font-display font-bold text-3xl text-gray-900 mb-2">
                            Score Factors <span className="text-base text-gray-400 font-normal ml-2">AI breakdown</span>
                        </h3>
                        {scoreData.factors?.map((factor: any, i: number) => (
                            <div key={i} className="bg-white rounded-2xl p-8 border border-purple-100 hover:border-purple-300 transition-all">
                                <div className="flex items-start justify-between gap-4 mb-5">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-gray-800 text-xl">{factor.name}</h3>
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${getImpactColor(factor.impact)}`}>
                                                {factor.impact === 'positive' ? '↑' : factor.impact === 'negative' ? '↓' : '→'} {factor.impact}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-base">{factor.reason}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-display font-bold text-4xl" style={{ color: getScoreColor(factor.score) }}>{factor.score}</p>
                                        <p className="text-gray-400 text-sm">/ 100</p>
                                        <p className="text-purple-500 text-sm font-semibold mt-1">Weight: {(factor.weight * 100).toFixed(0)}%</p>
                                    </div>
                                </div>
                                <div className="h-3 bg-purple-50 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                         style={{ width: `${factor.score}%`, background: getScoreColor(factor.score) }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── TAB: Transactions ── */}
                {activeTab === 'transactions' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display font-bold text-3xl text-gray-900">
                                Bank Transactions <span className="text-base text-gray-400 font-normal ml-2">Last 90 days via Plaid</span>
                            </h3>
                            <div className="bg-blue-50 border border-blue-200 px-5 py-2.5 rounded-full">
                                <p className="text-blue-700 text-base font-semibold">
                                    🏦 {application?.plaid_data_snapshot?.institution || 'Plaid Connected'}
                                </p>
                            </div>
                        </div>
                        {accounts && accounts.length > 0 && (
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {accounts.map((acc: any, i: number) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 border border-purple-100">
                                        <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">{acc.name}</p>
                                        <p className="font-display font-bold text-3xl text-purple-600">₹{Number(acc.balance).toLocaleString('en-IN')}</p>
                                        <p className="text-gray-400 text-sm capitalize mt-1">{acc.account_type}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                            <div className="px-8 py-5 border-b border-purple-50 grid grid-cols-12 gap-4">
                                {['Date', 'Merchant', 'Category', 'Amount'].map(h => (
                                    <div key={h} className={`text-sm font-bold text-gray-400 uppercase tracking-wide ${
                                        h === 'Merchant' ? 'col-span-5' : h === 'Category' ? 'col-span-3' : h === 'Amount' ? 'col-span-2' : 'col-span-2'
                                    }`}>{h}</div>
                                ))}
                            </div>
                            {(!transactions || transactions.length === 0) && (
                                <div className="text-center py-16">
                                    <p className="text-4xl mb-4">🏦</p>
                                    <p className="text-gray-400 text-xl">No transaction data available</p>
                                </div>
                            )}
                            <div className="divide-y divide-purple-50 max-h-96 overflow-y-auto">
                                {transactions?.map((tx: any, i: number) => (
                                    <div key={i} className="px-8 py-4 grid grid-cols-12 gap-4 items-center hover:bg-purple-50/30 transition-colors">
                                        <div className="col-span-2"><p className="text-sm text-gray-500 font-medium">{tx.date}</p></div>
                                        <div className="col-span-5"><p className="text-base font-semibold text-gray-800 truncate">{tx.merchant || 'Unknown'}</p></div>
                                        <div className="col-span-3"><span className="text-sm bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-medium">{tx.category || 'Other'}</span></div>
                                        <div className="col-span-2">
                                            <p className={`text-base font-bold ${tx.amount < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {tx.amount < 0 ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* ── TAB: Fraud ── */}
                {activeTab === 'fraud' && (
                    <FraudAlertPanel
                        applicationId={application.id}
                        token={token!}
                        cachedRiskScore={application.fraud_risk_score}
                        cachedRiskLevel={application.fraud_risk_level}
                        cachedFlags={application.fraud_flags}
                    />
                )}

                {/* ── TAB: Decision ── */}
                {activeTab === 'decision' && (
                    <div className="max-w-3xl mx-auto">
                        {alreadyDecided ? (
                            <div className="space-y-6">
                                <div className={`rounded-3xl p-12 text-center ${
                                    application.status === 'repaid'   ? 'bg-purple-50 border border-purple-200' :
                                        application.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' :
                                            'bg-red-50 border border-red-200'
                                }`}>
                                    <div className="text-7xl mb-6">
                                        {application.status === 'repaid' ? '🏆' : application.status === 'approved' ? '✅' : '❌'}
                                    </div>
                                    <h2 className="font-display font-bold text-4xl mb-4">
                                        {application.status === 'repaid'   ? 'Loan Fully Repaid'  :
                                            application.status === 'approved' ? 'Loan Approved'      : 'Loan Rejected'}
                                    </h2>
                                    {application.status === 'repaid' && (
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <span className={`text-base font-bold px-4 py-2 rounded-full ${application.repaid_on_time ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {application.repaid_on_time ? '⏱ Repaid On Time' : '⚠️ Repaid Late'}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-xl text-gray-600 mb-6">Decision by: <span className="font-semibold">{application.officer_id}</span></p>
                                    {application.officer_notes && (
                                        <div className="bg-white rounded-2xl p-6 text-left">
                                            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Officer Notes</p>
                                            <p className="text-gray-700 text-lg">{application.officer_notes}</p>
                                        </div>
                                    )}
                                    {application.stripe_payment_id && (
                                        <div className="bg-white rounded-2xl p-6 text-left mt-4">
                                            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Stripe Payment ID</p>
                                            <p className="text-gray-700 text-base font-mono">{application.stripe_payment_id}</p>
                                            <p className="text-emerald-600 text-sm mt-1 font-semibold">✅ Funds disbursed via Stripe</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mark as Repaid — shown only for approved loans not yet marked repaid */}
                                {application.status === 'approved' && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-3xl p-8">
                                        <h3 className="font-bold text-xl text-purple-800 mb-2">💰 Mark Loan as Repaid</h3>
                                        <p className="text-purple-600 text-base mb-6">
                                            Once the borrower has completed repayment, mark it here.
                                            This will boost their credit score on their next application.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleMarkRepaid(true)}
                                                disabled={deciding}
                                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50">
                                                {deciding ? <span className="flex items-center justify-center gap-2"><Spinner /> Processing…</span> : '✅ Repaid On Time'}
                                            </button>
                                            <button
                                                onClick={() => handleMarkRepaid(false)}
                                                disabled={deciding}
                                                className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50">
                                                {deciding ? '…' : '⚠️ Repaid Late'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-10 border border-purple-100">
                                <h2 className="font-display font-bold text-3xl text-gray-900 mb-2">Make Your Decision</h2>
                                <p className="text-gray-400 text-lg mb-6">Review all tabs before deciding. Your decision is final.</p>

                                {/* Warning if checklist incomplete */}
                                {(!agreementSigned || !guarantorOtpVerified) && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <p className="font-bold text-yellow-800 text-base mb-1">Incomplete applicant checklist</p>
                                            <p className="text-yellow-700 text-sm">
                                                {!agreementSigned && '• Loan agreement not yet signed by applicant. '}
                                                {!guarantorOtpVerified && '• Guarantor OTP not verified.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Quick summary */}
                                <div className="grid grid-cols-3 gap-4 mb-10">
                                    <div className="bg-purple-50 rounded-2xl p-5 text-center">
                                        <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">Loan Amount</p>
                                        <p className="font-display font-bold text-2xl text-purple-600">₹{Number(application.amount).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-2xl p-5 text-center">
                                        <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">Credit Score</p>
                                        <p className="font-display font-bold text-2xl" style={{ color: getScoreColor(application.credit_score || 0) }}>
                                            {application.credit_score || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 rounded-2xl p-5 text-center">
                                        <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">Risk Level</p>
                                        <p className="font-display font-bold text-2xl text-gray-900">{scoreData?.riskLevel || 'Unknown'}</p>
                                    </div>
                                </div>

                                {/* Decision buttons */}
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    {[
                                        { val: 'approve' as const, icon: '✅', label: 'Approve', desc: 'Funds disbursed via Stripe instantly', activeClass: 'border-emerald-500 bg-emerald-50', textClass: 'text-emerald-700', descClass: 'text-emerald-600' },
                                        { val: 'reject'  as const, icon: '❌', label: 'Reject',  desc: 'Applicant notified with your notes',   activeClass: 'border-red-400 bg-red-50',     textClass: 'text-red-600',     descClass: 'text-red-500' },
                                    ].map(opt => (
                                        <button key={opt.val} onClick={() => setDecision(opt.val)}
                                                className={`p-8 rounded-2xl border-2 transition-all duration-200 text-center ${
                                                    decision === opt.val ? opt.activeClass : 'border-purple-100 hover:border-purple-300'
                                                }`}>
                                            <div className="text-5xl mb-3">{opt.icon}</div>
                                            <p className={`font-bold text-2xl ${opt.textClass}`}>{opt.label}</p>
                                            <p className={`text-base mt-2 ${opt.descClass}`}>{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-8">
                                    <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">
                                        Officer Notes <span className="text-red-400">*</span>
                                    </label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                              placeholder="Provide clear reasoning for your decision. This will be shown to the applicant."
                                              rows={5}
                                              className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 resize-none"
                                              style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
                                </div>

                                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 mb-6 text-base">⚠️ {error}</div>}

                                <button onClick={handleDecision} disabled={deciding || !decision}
                                        className={`w-full font-bold text-xl py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            decision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                                                decision === 'reject'  ? 'bg-red-600 hover:bg-red-700 text-white' :
                                                    'bg-gray-200 text-gray-400'
                                        }`}
                                        style={{ boxShadow: decision ? '0 4px 14px rgba(0,0,0,0.15)' : 'none' }}>
                                    {deciding
                                        ? <span className="flex items-center justify-center gap-3"><Spinner /> Processing…</span>
                                        : decision === 'approve' ? '✅ Confirm Approval & Disburse Funds'
                                            : decision === 'reject'  ? '❌ Confirm Rejection'
                                                : 'Select a decision above'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}

