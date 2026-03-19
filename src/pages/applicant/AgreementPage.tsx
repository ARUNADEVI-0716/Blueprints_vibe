import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function AgreementPage() {
    const { session } = useAuth()
    const navigate      = useNavigate()
    const location      = useLocation()
    const applicationId = location.state?.applicationId || ''

    const [agreement, setAgreement] = useState<any>(null)
    const [loading, setLoading]     = useState(true)
    const [signing, setSigning]     = useState(false)
    const [signed, setSigned]       = useState(false)
    const [agreed, setAgreed]       = useState(false)
    const [error, setError]         = useState('')

    useEffect(() => {
        if (!applicationId) { navigate('/loan-status'); return }
        generateAgreement()
    }, [applicationId])

    const generateAgreement = async () => {
        setLoading(true)
        try {
            const res  = await fetch(`${BACKEND_URL}/api/agreement/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ applicationId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAgreement(data.agreement)
        } catch (err: any) {
            setError(err.message || 'Failed to generate agreement')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!agreement) return
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Loan Agreement — Nexus</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:48px}.header{text-align:center;border-bottom:2px solid #001736;padding-bottom:24px;margin-bottom:32px}.header h1{font-size:22px;font-weight:700;color:#001736;letter-spacing:2px;margin-bottom:6px}.header p{color:#6b7280;font-size:12px}.meta{display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;margin-top:10px}h2{font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;margin:24px 0 10px;border-left:3px solid #001736;padding-left:10px}table{width:100%;border-collapse:collapse;margin-bottom:8px}td{padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px}td:first-child{color:#6b7280;width:220px}td:last-child{font-weight:600}ol{margin-left:20px}ol li{margin-bottom:6px;font-size:12px;line-height:1.6;color:#374151}.signature{margin-top:48px;border-top:1px solid #e5e7eb;padding-top:24px;display:flex;justify-content:space-between}.sig-box{text-align:center}.sig-line{border-bottom:1px solid #374151;width:200px;margin:0 auto 6px;height:40px}.sig-label{font-size:11px;color:#6b7280}.footer{margin-top:40px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px}@media print{body{padding:24px}}</style></head><body><div class="header"><h1>LOAN AGREEMENT</h1><p>Nexus Financial Services Pvt. Ltd.</p><div class="meta"><span>Agreement ID: ${agreement.applicationId}</span><span>Date: ${new Date(agreement.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div></div><h2>Borrower Details</h2><table><tr><td>Full Name</td><td>${agreement.applicantName}</td></tr><tr><td>Email Address</td><td>${agreement.applicantEmail}</td></tr>${agreement.panNumber !== 'Not provided' ? `<tr><td>PAN Number</td><td>${agreement.panNumber}</td></tr>` : ''}<tr><td>Employment Type</td><td>${agreement.employmentType}</td></tr><tr><td>Monthly Income</td><td>₹${Number(agreement.monthlyIncome).toLocaleString('en-IN')}</td></tr></table><h2>Loan Terms</h2><table><tr><td>Principal Amount</td><td>₹${Number(agreement.loanAmount).toLocaleString('en-IN')}</td></tr><tr><td>Loan Purpose</td><td>${agreement.purpose}</td></tr><tr><td>Repayment Tenure</td><td>${agreement.tenure} months</td></tr><tr><td>Interest Rate (p.a.)</td><td>${agreement.interestRate}%</td></tr><tr><td>Monthly EMI</td><td>₹${Number(agreement.emi).toLocaleString('en-IN')}</td></tr><tr><td>Total Payable Amount</td><td>₹${Number(agreement.totalPayable).toLocaleString('en-IN')}</td></tr><tr><td>Credit Score at Application</td><td>${agreement.creditScore} (Grade: ${agreement.creditGrade})</td></tr></table>${agreement.guarantorName !== 'N/A' ? `<h2>Guarantor Details</h2><table><tr><td>Guarantor Name</td><td>${agreement.guarantorName}</td></tr><tr><td>Guarantor Mobile</td><td>${agreement.guarantorMobile}</td></tr></table>` : ''}<h2>Terms & Conditions</h2><ol><li>The borrower agrees to repay the loan in ${agreement.tenure} equal monthly instalments of ₹${Number(agreement.emi).toLocaleString('en-IN')} each.</li><li>Late payment will attract a penalty of 2% per month on the overdue amount.</li><li>The lender reserves the right to take legal action in case of default.</li><li>All information provided is true to the best of the borrower's knowledge.</li><li>This agreement is legally binding upon digital confirmation by the borrower.</li><li>Nexus reserves the right to report defaults to credit bureaus.</li></ol><div class="signature"><div class="sig-box"><div class="sig-line"></div><p class="sig-label">Borrower Signature<br/>${agreement.applicantName}</p></div><div class="sig-box"><div class="sig-line"></div><p class="sig-label">Authorized Signatory<br/>Nexus Financial Services</p></div></div><div class="footer"><p>This is a computer-generated document. Digitally signed on ${new Date().toLocaleDateString('en-IN')}.</p></div></body></html>`
        const win = window.open('', '_blank')
        if (!win) { alert('Allow popups to download the agreement'); return }
        win.document.write(html); win.document.close(); win.focus()
        setTimeout(() => { win.print(); win.close() }, 500)
    }

    const handleSign = async () => {
        if (!agreed) return
        setSigning(true)
        setError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/agreement/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ applicationId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await fetch(`${BACKEND_URL}/api/stripe/disburse-loan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId })
            })

            setSigned(true)
            setTimeout(() => navigate('/loan-status'), 2500)
        } catch (err: any) {
            setError(err.message || 'Failed to sign agreement. Please try again.')
        } finally {
            setSigning(false)
        }
    }

    // ── Loading ──
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    <p style={{ fontSize: 15, color: '#43474f', fontWeight: 600 }}>Generating your loan agreement…</p>
                </div>
            </div>
        )
    }

    // ── Error ──
    if (error && !agreement) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 20, color: '#001736', marginBottom: 8 }}>Could not generate agreement</p>
                    <p style={{ fontSize: 14, color: '#43474f', marginBottom: 24 }}>{error}</p>
                    <button onClick={() => navigate('/loan-status')}
                            style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                        ← Back to Loan Status
                    </button>
                </div>
            </div>
        )
    }

    // ── Signed ──
    if (signed) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif', padding: 24 }}>
                <div style={{ background: 'white', borderRadius: 20, padding: '64px 48px', textAlign: 'center', border: '1px solid #e0e3e5', maxWidth: 520 }}>
                    <div style={{ width: 80, height: 80, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h2 style={{ fontWeight: 900, fontSize: 32, color: '#001736', marginBottom: 8, letterSpacing: '-1px' }}>Agreement Signed!</h2>
                    <p style={{ fontSize: 15, color: '#43474f', marginBottom: 24 }}>Your loan funds are being disbursed. Redirecting…</p>
                    <div style={{ width: 36, height: 36, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

            {/* ── Navbar ── */}
            <nav style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Loan Approved — Sign Agreement
                        </span>
                    </div>
                    <button onClick={() => navigate('/loan-status')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>

                {/* Congrats banner */}
                <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                    <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div>
                        <h1 style={{ fontWeight: 900, fontSize: 24, color: 'white', marginBottom: 4 }}>Your loan has been approved!</h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Read the loan agreement carefully, confirm you agree, then sign to receive your funds.</p>
                    </div>
                </div>

                {agreement && (
                    <>
                        {/* Agreement document */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e3e5', overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                            {/* Doc header */}
                            <div style={{ background: '#f7f9fb', borderBottom: '1px solid #e0e3e5', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontWeight: 900, fontSize: 18, color: '#001736', margin: 0, marginBottom: 4 }}>LOAN AGREEMENT</p>
                                    <p style={{ fontSize: 13, color: '#747780', margin: 0 }}>Nexus Financial Services</p>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                                        <span style={{ fontSize: 12, color: '#c4c6d0' }}>ID: {agreement.applicationId?.slice(0, 8)}…</span>
                                        <span style={{ fontSize: 12, color: '#c4c6d0' }}>{new Date(agreement.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <button onClick={handleDownload}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Download PDF
                                </button>
                            </div>

                            {/* Doc body */}
                            <div style={{ padding: '24px 28px', maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
                                <p style={{ fontWeight: 700, fontFamily: 'sans-serif', color: '#001736', marginBottom: 8 }}>BORROWER DETAILS</p>
                                <p>Name: {agreement.applicantName}</p>
                                <p>Email: {agreement.applicantEmail}</p>
                                {agreement.panNumber !== 'Not provided' && <p>PAN: {agreement.panNumber}</p>}

                                <p style={{ fontWeight: 700, fontFamily: 'sans-serif', color: '#001736', margin: '16px 0 8px' }}>LOAN TERMS</p>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                    {[
                                        ['Principal Amount',     `₹${Number(agreement.loanAmount).toLocaleString('en-IN')}`],
                                        ['Loan Purpose',         agreement.purpose],
                                        ['Repayment Tenure',     `${agreement.tenure} months`],
                                        ['Interest Rate (p.a.)', `${agreement.interestRate}%`],
                                        ['Monthly EMI',          `₹${Number(agreement.emi).toLocaleString('en-IN')}`],
                                        ['Total Payable',        `₹${Number(agreement.totalPayable).toLocaleString('en-IN')}`],
                                        ['Credit Score',         `${agreement.creditScore} (Grade ${agreement.creditGrade})`],
                                    ].map(([k, v]) => (
                                        <tr key={k} style={{ borderBottom: '1px solid #f2f4f6' }}>
                                            <td style={{ padding: '6px 12px 6px 0', color: '#747780', fontSize: 12, width: 220, fontFamily: 'sans-serif' }}>{k}</td>
                                            <td style={{ padding: '6px 0', fontWeight: 700, fontSize: 12, fontFamily: 'sans-serif', color: '#001736' }}>{v}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                                {agreement.guarantorName !== 'N/A' && (
                                    <>
                                        <p style={{ fontWeight: 700, fontFamily: 'sans-serif', color: '#001736', margin: '16px 0 8px' }}>GUARANTOR</p>
                                        <p>Name: {agreement.guarantorName} | Mobile: {agreement.guarantorMobile}</p>
                                    </>
                                )}

                                <p style={{ fontWeight: 700, fontFamily: 'sans-serif', color: '#001736', margin: '16px 0 8px' }}>TERMS & CONDITIONS</p>
                                <ol style={{ marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {[
                                        `The borrower agrees to repay the loan in ${agreement.tenure} equal monthly instalments of ₹${Number(agreement.emi).toLocaleString('en-IN')} each.`,
                                        'Late payment will attract a penalty of 2% per month on the overdue amount.',
                                        'The lender reserves the right to take legal action in case of default.',
                                        'All information provided is true to the best of the borrower\'s knowledge.',
                                        'This agreement is legally binding upon digital confirmation by the borrower.',
                                        'Nexus reserves the right to report defaults to credit bureaus.',
                                    ].map((t, i) => <li key={i} style={{ fontSize: 12, fontFamily: 'sans-serif', color: '#374151' }}>{t}</li>)}
                                </ol>
                            </div>
                        </div>

                        {/* ── Sign section — no OTP, just checkbox + button ── */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '32px', border: '1.5px solid #a4c9ff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
                                <div style={{ width: 44, height: 44, background: '#eef4ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0060ac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: 20, color: '#001736', marginBottom: 6, margin: '0 0 6px' }}>Digital Signature</h2>
                                    <p style={{ fontSize: 14, color: '#43474f', margin: 0, lineHeight: 1.6 }}>
                                        Confirm you have read and understood all terms. Clicking <strong>Sign & Get Funds</strong> constitutes your legal digital signature.
                                    </p>
                                </div>
                            </div>

                            {/* Loan summary reminder */}
                            <div style={{ background: '#f7f9fb', border: '1px solid #e0e3e5', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                                {[
                                    { label: 'Loan Amount',  value: `₹${Number(agreement.loanAmount).toLocaleString('en-IN')}` },
                                    { label: 'Monthly EMI',  value: `₹${Number(agreement.emi).toLocaleString('en-IN')}` },
                                    { label: 'Total Payable', value: `₹${Number(agreement.totalPayable).toLocaleString('en-IN')}` },
                                ].map(item => (
                                    <div key={item.label} style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{item.label}</p>
                                        <p style={{ fontWeight: 900, fontSize: 18, color: '#001736', margin: 0 }}>{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Checkbox confirmation */}
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', marginBottom: 24, padding: '16px 20px', background: agreed ? '#f0fdf4' : '#f7f9fb', border: `1.5px solid ${agreed ? '#86efac' : '#e0e3e5'}`, borderRadius: 10, transition: 'all 0.2s' }}>
                                <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={e => setAgreed(e.target.checked)}
                                        style={{ width: 20, height: 20, accentColor: '#001736', cursor: 'pointer' }}
                                    />
                                </div>
                                <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>
                                    I, <strong style={{ color: '#001736' }}>{agreement.applicantName}</strong>, have read and fully understood the loan agreement. I agree to the repayment schedule of{' '}
                                    <strong style={{ color: '#001736' }}>₹{Number(agreement.emi).toLocaleString('en-IN')} per month for {agreement.tenure} months</strong> and confirm all information provided is accurate and true.
                                </span>
                            </label>

                            {/* Error */}
                            {error && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Sign button */}
                            <button
                                onClick={handleSign}
                                disabled={signing || !agreed}
                                style={{ width: '100%', padding: '16px 32px', background: agreed ? '#001736' : '#e0e3e5', color: agreed ? 'white' : '#747780', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: agreed && !signing ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: agreed ? '0 4px 16px rgba(0,23,54,0.25)' : 'none' }}
                                onMouseEnter={e => { if (agreed && !signing) e.currentTarget.style.background = '#002b5b' }}
                                onMouseLeave={e => { if (agreed && !signing) e.currentTarget.style.background = '#001736' }}
                            >
                                {signing ? (
                                    <><Spinner /> Signing Agreement…</>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            <polyline points="9 12 11 14 15 10"/>
                                        </svg>
                                        Sign &amp; Get Funds
                                    </>
                                )}
                            </button>

                            <p style={{ fontSize: 12, color: '#c4c6d0', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
                                By signing, you confirm you have read and agreed to all terms. This constitutes a legally binding digital signature.
                            </p>
                        </div>
                    </>
                )}
            </main>
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

