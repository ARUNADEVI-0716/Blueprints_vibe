import { useState, useEffect } from 'react'
import FraudAlertPanel from '@/components/FraudAlertPanel'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

function MSIcon({ name, size = 20, color, fill = 0 }: { name: string; size?: number; color?: string; fill?: number }) {
    return (
        <span className="material-symbols-outlined"
              style={{ fontSize: size, color, lineHeight: 1, fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, verticalAlign: 'middle' }}>
            {name}
        </span>
    )
}

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
        const link = document.createElement('link')
        link.rel  = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
        document.head.appendChild(link)
        if (!token) { navigate('/officer/login'); return }
        fetchApplication()
    }, [id])

    const [documents, setDocuments] = useState<any[]>([])

    const fetchApplication = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/applications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.status === 401) { navigate('/officer/login'); return }
            const result = await res.json()
            setData(result)

            // Fetch documents from Supabase directly
            // Fetch documents — try by application ID first, fall back to user_id
            const { data: docs } = await supabase
                .from('loan_documents')
                .select('*')
                .eq('user_id', result.application.user_id)
                .order('created_at', { ascending: true })
            setDocuments(docs || [])
        } catch { setError('Failed to load application') }
        finally  { setLoading(false) }
    }

    const handleMarkRepaid = async (repaidOnTime: boolean) => {
        setDeciding(true); setError('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/applications/${id}/mark-repaid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ repaidOnTime })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            setSuccess(repaidOnTime
                ? 'Loan marked as repaid on time. Credit score will be boosted on next application.'
                : 'Loan marked as repaid (late). Recorded in borrower repayment history.')
            await fetchApplication()
        } catch (err: any) { setError(err.message || 'Failed to update repayment status') }
        finally { setDeciding(false) }
    }

    const handleDecision = async () => {
        if (!decision)       { setError('Please select approve or reject'); return }
        if (!notes.trim())   { setError('Please add officer notes'); return }
        setDeciding(true); setError('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/applications/${id}/${decision}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ notes })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            setSuccess(decision === 'approve'
                ? 'Loan approved. Stripe payout has been initiated.'
                : 'Application rejected. Applicant has been notified.')
            await fetchApplication()
            setActiveTab('overview')
        } catch (err: any) { setError(err.message || 'Decision failed') }
        finally { setDeciding(false) }
    }

    const getScoreColor = (s: number) =>
        s >= 750 ? '#22c55e' : s >= 650 ? '#0060ac' : s >= 550 ? '#f59e0b' : '#ef4444'

    const getScoreLabel = (s: number) =>
        s >= 800 ? 'Exceptional' : s >= 750 ? 'Excellent' : s >= 700 ? 'Good' : s >= 650 ? 'Fair' : 'Poor'

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <p style={{ fontSize: 15, color: '#43474f', fontWeight: 600 }}>Loading application…</p>
            </div>
        </div>
    )

    const { application, creditScore, transactions, accounts } = data || {}
    if (!application) return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
                <MSIcon name="search_off" size={48} color="#c4c6d0"/>
                <p style={{ fontWeight: 700, fontSize: 20, color: '#001736', margin: '16px 0 8px' }}>Application not found</p>
                <button onClick={() => navigate('/officer/dashboard')}
                        style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    )

    const scoreData       = creditScore?.breakdown || application?.score_breakdown
    const alreadyDecided  = ['approved', 'rejected', 'repaid'].includes(application.status)
    const agreementSigned = !!application.agreement_signed
    const guarantorOtpVerified = !!application.guarantor_otp_verified

    const statusColor = application.status === 'approved' ? '#15803d'
        : application.status === 'rejected' ? '#ba1a1a'
            : application.status === 'repaid'   ? '#0060ac'
                : '#a16207'

    const statusBg = application.status === 'approved' ? '#f0fdf4'
        : application.status === 'rejected' ? '#fef2f2'
            : application.status === 'repaid'   ? '#eef4ff'
                : '#fefce8'

    const statusIcon = application.status === 'approved' ? 'check_circle'
        : application.status === 'rejected' ? 'cancel'
            : application.status === 'repaid'   ? 'workspace_premium'
                : 'pending'

    // ── shared styles ───────────────────────────────────────
    const card   = { background: 'white', borderRadius: 12, border: '1px solid #e0e3e5', padding: '24px' }
    const row    = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f2f4f6' } as const
    const labelS = { fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }
    const valS   = { fontSize: 14, fontWeight: 600, color: '#001736' }

    const tabs = [
        { id: 'overview',     icon: 'assignment',    label: 'Overview' },
        { id: 'score',        icon: 'speed',          label: 'Credit Score' },
        { id: 'transactions', icon: 'account_balance', label: 'Bank Data' },
        { id: 'fraud',        icon: 'policy',         label: 'Fraud', highlight: !!(application.fraud_risk_level && application.fraud_risk_level !== 'clean') },
        { id: 'decision',     icon: 'gavel',          label: 'Decision', highlight: !alreadyDecided },
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif', paddingBottom: 40 }}>

            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    vertical-align: middle;
                }
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
            `}</style>

            {/* ── TopAppBar ────────────────────────────────── */}
            <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/officer/dashboard')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: '#001736', transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#e0e3e5')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <MSIcon name="arrow_back" size={22}/>
                    </button>
                    <div>
                        <h1 style={{ fontWeight: 800, fontSize: 17, color: '#001736', margin: 0, letterSpacing: '-0.3px' }}>
                            {application.full_name || 'Unknown Applicant'}
                        </h1>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Application Review
                        </span>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: statusBg, color: statusColor, padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                            <MSIcon name={statusIcon} size={14} color={statusColor} fill={1}/>
                            {application.status.toUpperCase()}
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#002b5b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7594ca', fontWeight: 700, fontSize: 12 }}>
                            {(application.full_name || 'XX').slice(0, 2).toUpperCase()}
                        </div>
                    </div>
                </div>
                <div style={{ height: 1, background: '#e2e8f0' }}/>
            </header>

            <main style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>

                {/* ── Hero — Bento snapshot ──────────────────── */}
                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginTop: 24, marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ background: '#001736', padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7594ca', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loan Amount</span>
                        <h2 style={{ fontWeight: 900, fontSize: 30, color: 'white', letterSpacing: '-1px', margin: 0 }}>
                            ₹{Number(application.amount).toLocaleString('en-IN')}
                        </h2>
                    </div>
                    <div style={{ background: '#002b5b', padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7594ca', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Purpose</span>
                        <h2 style={{ fontWeight: 800, fontSize: 20, color: 'white', margin: 0 }}>{application.purpose}</h2>
                    </div>
                    <div style={{ background: '#0060ac', padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Term</span>
                        <h2 style={{ fontWeight: 800, fontSize: 20, color: 'white', margin: 0 }}>{application.tenure} Months</h2>
                    </div>
                </section>

                {/* Alerts */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MSIcon name="warning" size={16} color="#dc2626"/> {error}
                    </div>
                )}
                {success && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '12px 20px', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MSIcon name="check_circle" size={16} color="#15803d" fill={1}/> {success}
                    </div>
                )}

                {/* ── Tabs ──────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e0e3e5', paddingBottom: 1 }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', position: 'relative',
                                    background: activeTab === tab.id ? '#001736' : tab.highlight ? '#fefce8' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : tab.highlight ? '#a16207' : '#43474f',
                                    boxShadow: activeTab === tab.id ? '0 -1px 0 #001736' : 'none'
                                }}>
                            <MSIcon name={tab.icon} size={16} color={activeTab === tab.id ? 'white' : tab.highlight ? '#a16207' : '#747780'}/>
                            {tab.label}
                            {tab.highlight && (
                                <span style={{ width: 7, height: 7, background: '#f59e0b', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Overview ─────────────────────────── */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                        {/* Applicant Profile */}
                        <div style={card}>
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', margin: 0, marginBottom: 6 }}>Applicant Profile</h3>
                                <div style={{ width: 36, height: 3, background: '#0060ac', borderRadius: 2 }}/>
                            </div>
                            {[
                                { label: 'Full Name',      value: application.full_name },
                                { label: 'Email Address',  value: application.email },
                                { label: 'Employment',     value: application.employment_type },
                                { label: 'Employer',       value: application.employer_name || 'N/A' },
                                { label: 'Monthly Income', value: `₹${Number(application.monthly_income).toLocaleString('en-IN')}` },
                                { label: 'PAN Number',     value: application.pan_number || '—', mono: true },
                                { label: 'Aadhaar',        value: application.aadhaar_number ? `XXXX XXXX ${application.aadhaar_number.slice(-4)}` : '—' },
                                { label: 'Profile Type',   value: application.user_type === 'existing' ? 'Existing Customer' : 'Cold Start' },
                            ].map((item: any) => (
                                <div key={item.label} style={row}>
                                    <span style={labelS}>{item.label}</span>
                                    <span style={{ ...valS, fontFamily: item.mono ? 'monospace' : 'inherit', letterSpacing: item.mono ? '0.1em' : 'normal' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Right column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Credit Summary — Stitch style dark card */}
                            {scoreData && (
                                <div style={{ background: '#001736', borderRadius: 12, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Credit Summary</span>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 16 }}>
                                            <span style={{ fontWeight: 900, fontSize: 44, color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>{scoreData.score}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#68abff' }}>{getScoreLabel(scoreData.score)}</span>
                                        </div>
                                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 2 }}>Risk Level</span>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#68abff' }}>{scoreData.riskLevel}</span>
                                            </div>
                                            <MSIcon name="verified_user" size={36} color="rgba(255,255,255,0.15)" fill={1}/>
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', right: -16, bottom: -16, width: 120, height: 120, background: '#0060ac', opacity: 0.25, borderRadius: '50%', filter: 'blur(32px)' }}/>
                                </div>
                            )}

                            {/* Loan Details */}
                            <div style={card}>
                                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 14 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MSIcon name="receipt_long" size={16} color="#0060ac"/>Loan Details</span>
                                </h3>
                                {[
                                    { label: 'Amount',       value: `₹${Number(application.amount).toLocaleString('en-IN')}` },
                                    { label: 'Purpose',      value: application.purpose },
                                    { label: 'Tenure',       value: `${application.tenure} months` },
                                    { label: 'Applied On',   value: new Date(application.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                    { label: 'Status',       value: application.status.toUpperCase() },
                                    { label: 'Officer Notes', value: application.officer_notes || 'None yet' },
                                ].map((item: any) => (
                                    <div key={item.label} style={row}>
                                        <span style={labelS}>{item.label}</span>
                                        <span style={valS}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Guarantor */}
                            <div style={card}>
                                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 14 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MSIcon name="group" size={16} color="#0060ac"/>Guarantor</span>
                                </h3>
                                {application.guarantor_name ? (
                                    [
                                        { label: 'Name',         value: application.guarantor_name },
                                        { label: 'Mobile',       value: application.guarantor_mobile },
                                        { label: 'Relation',     value: application.guarantor_relation || 'Not specified' },
                                        { label: 'OTP Verified', value: guarantorOtpVerified ? 'Verified' : 'Not verified' },
                                    ].map((item: any) => (
                                        <div key={item.label} style={row}>
                                            <span style={labelS}>{item.label}</span>
                                            <span style={{ ...valS, color: item.label === 'OTP Verified' ? (guarantorOtpVerified ? '#15803d' : '#ba1a1a') : '#001736' }}>
                                                {item.label === 'OTP Verified' && <MSIcon name={guarantorOtpVerified ? 'check_circle' : 'cancel'} size={13} color={guarantorOtpVerified ? '#15803d' : '#ba1a1a'} fill={1}/>}
                                                {' '}{item.value}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ fontSize: 13, color: '#747780' }}>No guarantor submitted yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Agreement status — full width */}
                        <div style={{ gridColumn: '1 / -1', borderRadius: 12, padding: '18px 24px', border: `1px solid ${agreementSigned ? '#bbf7d0' : '#fef08a'}`, background: agreementSigned ? '#f0fdf4' : '#fefce8', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <MSIcon name={agreementSigned ? 'draw' : 'pending_actions'} size={28} color={agreementSigned ? '#15803d' : '#a16207'} fill={agreementSigned ? 1 : 0}/>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 14, color: agreementSigned ? '#14532d' : '#a16207', margin: 0, marginBottom: 2 }}>
                                    {agreementSigned ? 'Loan Agreement Digitally Signed' : 'Loan Agreement Not Yet Signed'}
                                </p>
                                <p style={{ fontSize: 12, color: agreementSigned ? '#15803d' : '#a16207', margin: 0 }}>
                                    {agreementSigned
                                        ? `Signed on ${new Date(application.agreement_signed_at).toLocaleString('en-IN')} · IP: ${application.agreement_ip || 'N/A'}`
                                        : 'Applicant has not completed the digital signature step yet.'}
                                </p>
                            </div>
                        </div>

                        {/* Bank Accounts */}
                        {accounts && accounts.length > 0 && (
                            <div style={card}>
                                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 16 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MSIcon name="account_balance" size={16} color="#0060ac"/>Bank Accounts</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {accounts.map((acc: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f7f9fb', borderRadius: 10, border: '1px solid #e0e3e5' }}>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', margin: 0 }}>{acc.name}</p>
                                                <p style={{ fontSize: 11, color: '#747780', margin: 0, textTransform: 'capitalize' }}>{acc.account_type}</p>
                                            </div>
                                            <p style={{ fontWeight: 900, fontSize: 16, color: '#0060ac', margin: 0 }}>₹{Number(acc.balance).toLocaleString('en-IN')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Officer Notes textarea */}
                        <div style={{ ...card, gridColumn: accounts && accounts.length > 0 ? 'auto' : '1 / -1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <MSIcon name="edit_note" size={16} color="#0060ac"/>Officer Internal Notes
                                </h3>
                            </div>
                            <textarea placeholder="Enter review summary or internal concerns..."
                                      defaultValue={application.officer_notes || ''}
                                      rows={4}
                                      style={{ width: '100%', background: '#f7f9fb', border: '1.5px solid #e0e3e5', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#191c1e', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Public Sans, Inter, sans-serif', transition: 'all 0.2s' }}
                                      onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                      onBlur={e => { e.target.style.background = '#f7f9fb'; e.target.style.borderColor = '#e0e3e5' }}/>
                        </div>
                    </div>
                )}

                {/* ── TAB: Credit Score ─────────────────────── */}
                {activeTab === 'score' && scoreData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Score hero */}
                        <div style={{ ...card, textAlign: 'center', padding: '36px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 30, background: `${getScoreColor(scoreData.score)}15`, color: getScoreColor(scoreData.score) }}>
                                    {scoreData.score}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontWeight: 900, fontSize: 28, color: '#001736', letterSpacing: '-1px', margin: 0 }}>{scoreData.grade}</p>
                                    <p style={{ fontSize: 14, color: '#43474f', margin: 0 }}>{scoreData.riskLevel}</p>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: getScoreColor(scoreData.score), margin: 0, marginTop: 2 }}>
                                        Max: {scoreData.maxScore} · {scoreData.isColdStart ? 'Cold Start' : 'Hybrid Model'}
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.7, maxWidth: 600, margin: '0 auto', background: '#f7f9fb', borderRadius: 10, padding: '14px 20px' }}>
                                {scoreData.recommendation}
                            </p>
                        </div>

                        <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', margin: '8px 0 0' }}>
                            Score Factors
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#747780', marginLeft: 10 }}>AI breakdown · {scoreData.factors?.length} signals analysed</span>
                        </h3>

                        {scoreData.factors?.map((factor: any, i: number) => {
                            const ic = factor.impact === 'positive' ? '#15803d' : factor.impact === 'negative' ? '#ba1a1a' : '#a16207'
                            const ib = factor.impact === 'positive' ? '#f0fdf4' : factor.impact === 'negative' ? '#fef2f2' : '#fefce8'
                            return (
                                <div key={i} style={{ ...card, transition: 'border-color 0.15s' }}
                                     onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#a4c9ff')}
                                     onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#e0e3e5')}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                <h4 style={{ fontWeight: 700, fontSize: 15, color: '#001736', margin: 0 }}>{factor.name}</h4>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: ib, color: ic }}>
                                                    {factor.impact === 'positive' ? '↑' : factor.impact === 'negative' ? '↓' : '→'} {factor.impact}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 13, color: '#43474f', margin: 0 }}>{factor.reason}</p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <p style={{ fontWeight: 900, fontSize: 28, color: getScoreColor(factor.score), margin: 0, letterSpacing: '-1px' }}>{factor.score}</p>
                                            <p style={{ fontSize: 11, color: '#747780', margin: 0 }}>/ 100</p>
                                            <p style={{ fontSize: 11, color: '#0060ac', fontWeight: 600, margin: 0 }}>Weight: {(factor.weight * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <div style={{ height: 6, background: '#f2f4f6', borderRadius: 100, overflow: 'hidden' }}>
                                        <div style={{ width: `${factor.score}%`, height: '100%', background: getScoreColor(factor.score), borderRadius: 100, transition: 'width 0.7s ease' }}/>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ── TAB: Transactions ─────────────────────── */}
                {activeTab === 'transactions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', margin: 0 }}>
                                Bank Transactions
                                <span style={{ fontSize: 12, fontWeight: 400, color: '#747780', marginLeft: 10 }}>Last 90 days via Plaid</span>
                            </h3>
                            <div style={{ background: '#eef4ff', border: '1px solid #a4c9ff', padding: '6px 16px', borderRadius: 100 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#0060ac', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MSIcon name="account_balance" size={14} color="#0060ac"/>
                                    {application?.plaid_data_snapshot?.institution || 'Plaid Connected'}
                                </p>
                            </div>
                        </div>

                        {accounts && accounts.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(accounts.length, 3)}, 1fr)`, gap: 12 }}>
                                {accounts.map((acc: any, i: number) => (
                                    <div key={i} style={card}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{acc.name}</p>
                                        <p style={{ fontWeight: 900, fontSize: 24, color: '#0060ac', letterSpacing: '-1px', margin: 0 }}>₹{Number(acc.balance).toLocaleString('en-IN')}</p>
                                        <p style={{ fontSize: 11, color: '#747780', marginTop: 2, textTransform: 'capitalize' }}>{acc.account_type}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                            {/* Table header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 100px', gap: 12, padding: '12px 20px', background: '#f7f9fb', borderBottom: '1px solid #e0e3e5' }}>
                                {['Date', 'Merchant', 'Category', 'Amount'].map(h => (
                                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                                ))}
                            </div>
                            {(!transactions || transactions.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '48px' }}>
                                    <MSIcon name="account_balance" size={36} color="#c4c6d0"/>
                                    <p style={{ fontSize: 14, color: '#747780', marginTop: 12 }}>No transaction data available</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    {transactions.map((tx: any, i: number) => (
                                        <div key={i}
                                             style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 100px', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f7f9fb', transition: 'background 0.15s' }}
                                             onMouseEnter={e => (e.currentTarget.style.background = '#f7f9fb')}
                                             onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                                            <span style={{ fontSize: 12, color: '#43474f' }}>{tx.date}</span>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#001736', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.merchant || 'Unknown'}</span>
                                            <span style={{ fontSize: 11, background: '#eef4ff', color: '#0060ac', padding: '2px 10px', borderRadius: 100, fontWeight: 600, display: 'inline-block', height: 'fit-content' }}>{tx.category || 'Other'}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: tx.amount < 0 ? '#15803d' : '#ba1a1a' }}>
                                                {tx.amount < 0 ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB: Fraud ────────────────────────────── */}
                {activeTab === 'fraud' && (
                    <FraudAlertPanel
                        applicationId={application.id}
                        token={token!}
                        cachedRiskScore={application.fraud_risk_score}
                        cachedRiskLevel={application.fraud_risk_level}
                        cachedFlags={application.fraud_flags}
                    />
                )}

                {/* ── TAB: Decision ─────────────────────────── */}
                {activeTab === 'decision' && (
                    <div style={{ maxWidth: 720, margin: '0 auto' }}>
                        {alreadyDecided ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Status banner */}
                                <div style={{ borderRadius: 16, padding: '48px 36px', textAlign: 'center', background: application.status === 'repaid' ? '#eef4ff' : application.status === 'approved' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${application.status === 'repaid' ? '#a4c9ff' : application.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: application.status === 'repaid' ? '#0060ac' : application.status === 'approved' ? '#16a34a' : '#ba1a1a', marginBottom: 16 }}>
                                        <MSIcon name={application.status === 'repaid' ? 'workspace_premium' : application.status === 'approved' ? 'check_circle' : 'cancel'} size={32} color="white" fill={1}/>
                                    </div>
                                    <h2 style={{ fontWeight: 900, fontSize: 24, color: '#001736', marginBottom: 8, letterSpacing: '-0.5px' }}>
                                        {application.status === 'repaid' ? 'Loan Fully Repaid' : application.status === 'approved' ? 'Loan Approved' : 'Loan Rejected'}
                                    </h2>
                                    {application.status === 'repaid' && (
                                        <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100, marginBottom: 12, background: application.repaid_on_time ? '#f0fdf4' : '#fefce8', color: application.repaid_on_time ? '#15803d' : '#a16207' }}>
                                            {application.repaid_on_time ? 'Repaid On Time' : 'Repaid Late'}
                                        </span>
                                    )}
                                    {application.officer_notes && (
                                        <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', textAlign: 'left', marginTop: 16 }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Officer Notes</p>
                                            <p style={{ fontSize: 14, color: '#001736', lineHeight: 1.6 }}>{application.officer_notes}</p>
                                        </div>
                                    )}
                                    {application.stripe_payment_id && (
                                        <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', textAlign: 'left', marginTop: 12 }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Stripe Payment ID</p>
                                            <p style={{ fontSize: 13, color: '#001736', fontFamily: 'monospace', margin: 0 }}>{application.stripe_payment_id}</p>
                                            <p style={{ fontSize: 12, color: '#15803d', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <MSIcon name="check_circle" size={13} color="#15803d" fill={1}/> Funds disbursed via Stripe
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Mark repaid — approved loans only */}
                                {application.status === 'approved' && (
                                    <div style={{ background: '#eef4ff', border: '1px solid #a4c9ff', borderRadius: 12, padding: '24px' }}>
                                        <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <MSIcon name="payments" size={16} color="#0060ac"/>Mark Loan as Repaid
                                        </h3>
                                        <p style={{ fontSize: 13, color: '#43474f', marginBottom: 20, lineHeight: 1.6 }}>
                                            Once the borrower has completed repayment, mark it here. This will boost their credit score on their next application.
                                        </p>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={() => handleMarkRepaid(true)} disabled={deciding}
                                                    style={{ flex: 1, padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: deciding ? 'not-allowed' : 'pointer', opacity: deciding ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                {deciding ? <><Spinner/> Processing…</> : <><MSIcon name="check_circle" size={16} color="white" fill={1}/> Repaid On Time</>}
                                            </button>
                                            <button onClick={() => handleMarkRepaid(false)} disabled={deciding}
                                                    style={{ flex: 1, padding: '12px', background: '#d97706', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: deciding ? 'not-allowed' : 'pointer', opacity: deciding ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                {deciding ? '…' : <><MSIcon name="warning" size={16} color="white"/> Repaid Late</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={card}>
                                <h2 style={{ fontWeight: 900, fontSize: 22, color: '#001736', marginBottom: 6, letterSpacing: '-0.5px' }}>Make Your Decision</h2>
                                <p style={{ fontSize: 14, color: '#43474f', marginBottom: 24 }}>Review all tabs before deciding. Your decision is final and will notify the applicant.</p>

                                {/* Checklist warning */}
                                {(!agreementSigned || !guarantorOtpVerified) && (
                                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12 }}>
                                        <MSIcon name="warning" size={20} color="#a16207"/>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 13, color: '#a16207', margin: 0, marginBottom: 4 }}>Incomplete applicant checklist</p>
                                            <p style={{ fontSize: 12, color: '#a16207', margin: 0, lineHeight: 1.5 }}>
                                                {!agreementSigned && '· Loan agreement not yet signed. '}
                                                {!guarantorOtpVerified && '· Guarantor OTP not verified.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Quick summary */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                                    {[
                                        { label: 'Loan Amount',  value: `₹${Number(application.amount).toLocaleString('en-IN')}`, color: '#0060ac' },
                                        { label: 'Credit Score', value: application.credit_score || 'N/A', color: getScoreColor(application.credit_score || 0) },
                                        { label: 'Risk Level',   value: scoreData?.riskLevel || 'Unknown', color: '#001736' },
                                    ].map(k => (
                                        <div key={k.label} style={{ background: '#f7f9fb', borderRadius: 10, padding: '16px', textAlign: 'center', border: '1px solid #e0e3e5' }}>
                                            <p style={{ ...labelS, marginBottom: 6, display: 'block' }}>{k.label}</p>
                                            <p style={{ fontWeight: 900, fontSize: 20, color: k.color, margin: 0, letterSpacing: '-0.5px' }}>{k.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Decision buttons */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                                    {[
                                        { val: 'approve' as const, icon: 'check_circle', label: 'Approve', desc: 'Funds disbursed via Stripe instantly', activeColor: '#16a34a', activeBg: '#f0fdf4', activeBorder: '#bbf7d0' },
                                        { val: 'reject'  as const, icon: 'cancel',       label: 'Reject',  desc: 'Applicant notified with your notes',   activeColor: '#ba1a1a', activeBg: '#fef2f2', activeBorder: '#fecaca' },
                                    ].map(opt => (
                                        <button key={opt.val} onClick={() => setDecision(opt.val)}
                                                style={{ padding: '24px 20px', borderRadius: 10, border: `2px solid ${decision === opt.val ? opt.activeBorder : '#e0e3e5'}`, background: decision === opt.val ? opt.activeBg : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                                                <MSIcon name={opt.icon} size={36} color={decision === opt.val ? opt.activeColor : '#c4c6d0'} fill={decision === opt.val ? 1 : 0}/>
                                            </div>
                                            <p style={{ fontWeight: 800, fontSize: 18, color: decision === opt.val ? opt.activeColor : '#43474f', margin: 0, marginBottom: 4 }}>{opt.label}</p>
                                            <p style={{ fontSize: 12, color: decision === opt.val ? opt.activeColor : '#747780', margin: 0, opacity: 0.8 }}>{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Notes */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ ...labelS, display: 'block', marginBottom: 8 }}>
                                        Officer Notes <span style={{ color: '#ba1a1a' }}>*</span>
                                    </label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                              placeholder="Provide clear reasoning for your decision. This will be shown to the applicant."
                                              rows={5}
                                              style={{ width: '100%', background: '#f7f9fb', border: '1.5px solid #e0e3e5', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#191c1e', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Public Sans, Inter, sans-serif', transition: 'all 0.2s' }}
                                              onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                              onBlur={e => { e.target.style.background = '#f7f9fb'; e.target.style.borderColor = '#e0e3e5' }}/>
                                </div>

                                {error && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <MSIcon name="warning" size={14} color="#dc2626"/> {error}
                                    </div>
                                )}

                                <button onClick={handleDecision} disabled={deciding || !decision}
                                        style={{ width: '100%', padding: '15px', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: deciding || !decision ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                            background: decision === 'approve' ? '#16a34a' : decision === 'reject' ? '#ba1a1a' : '#e0e3e5',
                                            color: decision ? 'white' : '#747780',
                                            opacity: deciding ? 0.7 : 1
                                        }}>
                                    {deciding ? (
                                        <><Spinner/> Processing…</>
                                    ) : decision === 'approve' ? (
                                        <><MSIcon name="check_circle" size={18} color="white" fill={1}/> Confirm Approval &amp; Disburse Funds</>
                                    ) : decision === 'reject' ? (
                                        <><MSIcon name="cancel" size={18} color="white" fill={1}/> Confirm Rejection</>
                                    ) : (
                                        'Select a decision above'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
const REQUIRED_DOCS = [
    { type: 'aadhaar_front',  label: 'Aadhaar Card (Front)',        icon: 'badge' },
    { type: 'aadhaar_back',   label: 'Aadhaar Card (Back)',         icon: 'badge' },
    { type: 'pan_card',       label: 'PAN Card',                    icon: 'credit_card' },
    { type: 'salary_slip',    label: 'Salary Slip',                 icon: 'receipt_long' },
    { type: 'bank_statement', label: 'Bank Statement',              icon: 'account_balance_wallet' },
    { type: 'address_proof',  label: 'Address Proof',               icon: 'home' },
    { type: 'photo',          label: 'Passport Photo',              icon: 'portrait' },
]

const DOC_ICON: Record<string, string> = {
    aadhaar_front:  'badge',
    aadhaar_back:   'badge',
    pan_card:       'credit_card',
    salary_slip:    'receipt_long',
    bank_statement: 'account_balance_wallet',
    itr:            'description',
    address_proof:  'home',
    photo:          'portrait',
}

function DocumentRow({ doc }: { doc: any }) {
    const [url, setUrl]         = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')
    const [previewing, setPreviewing] = useState(false)

    const isImage = doc.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    const isPDF   = doc.file_name?.match(/\.pdf$/i)

    const getSignedUrl = async () => {
        if (url) return url
        setLoading(true); setError('')
        try {
            const { data, error: err } = await supabase.storage
                .from('loan-documents')
                .createSignedUrl(doc.file_path, 300) // 5 min expiry
            if (err) throw err
            setUrl(data.signedUrl)
            return data.signedUrl
        } catch (e: any) {
            setError('Failed to load document')
            return null
        } finally { setLoading(false) }
    }

    const handleView = async () => {
        const signedUrl = await getSignedUrl()
        if (!signedUrl) return
        if (isImage) {
            setPreviewing(true)
        } else {
            window.open(signedUrl, '_blank')
        }
    }

    const handleDownload = async () => {
        const signedUrl = await getSignedUrl()
        if (!signedUrl) return
        const a = document.createElement('a')
        a.href     = signedUrl
        a.download = doc.file_name
        a.click()
    }

    const formatSize = (bytes: number) => {
        if (!bytes) return ''
        if (bytes < 1024)        return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const docLabel = REQUIRED_DOCS.find(d => d.type === doc.document_type)?.label
        || doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    const docIcon  = DOC_ICON[doc.document_type] || 'description'

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: '#f7f9fb', border: '1px solid #e0e3e5', transition: 'background 0.15s' }}
                 onMouseEnter={e => (e.currentTarget.style.background = '#eef4ff')}
                 onMouseLeave={e => (e.currentTarget.style.background = '#f7f9fb')}>

                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MSIcon name={docIcon} size={18} color="#0060ac"/>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docLabel}
                    </p>
                    <p style={{ fontSize: 11, color: '#747780', margin: 0 }}>
                        {doc.file_name}
                        {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ''}
                        {isImage ? ' · Image' : isPDF ? ' · PDF' : ''}
                    </p>
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <MSIcon name="check_circle" size={13} color="#15803d" fill={1}/>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Uploaded</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={handleView} disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#0060ac', color: 'white', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.15s' }}
                            onMouseEnter={e => !loading && (e.currentTarget.style.background = '#004d8a')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#0060ac')}>
                        {loading ? (
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
                                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
                            </svg>
                        ) : (
                            <MSIcon name={isImage ? 'visibility' : 'open_in_new'} size={12} color="white"/>
                        )}
                        {loading ? 'Loading…' : 'View'}
                    </button>
                    <button onClick={handleDownload} disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#f2f4f6', color: '#43474f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = '#e0e3e5')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#f2f4f6')}>
                        <MSIcon name="download" size={12} color="#43474f"/>
                    </button>
                </div>

                {error && <span style={{ fontSize: 11, color: '#ba1a1a' }}>{error}</span>}
            </div>

            {/* Inline image preview modal */}
            {previewing && url && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
                     onClick={() => setPreviewing(false)}>
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
                         onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPreviewing(false)}
                                style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                            <MSIcon name="close" size={18} color="#001736"/>
                        </button>
                        <img src={url} alt={docLabel}
                             style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}/>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 10 }}>
                            <a href={url} download={doc.file_name}
                               style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'white', color: '#001736', textDecoration: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                                <MSIcon name="download" size={14} color="#001736"/> Download
                            </a>
                            <a href={url} target="_blank" rel="noreferrer"
                               style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#0060ac', color: 'white', textDecoration: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                                <MSIcon name="open_in_new" size={14} color="white"/> Open Full
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
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