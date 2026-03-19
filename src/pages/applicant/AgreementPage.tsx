// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// export default function AgreementPage() {
//     const { session } = useAuth()
//     const navigate      = useNavigate()
//     const location      = useLocation()
//     const applicationId = location.state?.applicationId || ''
//
//     const [agreement, setAgreement] = useState<any>(null)
//     const [loading, setLoading]     = useState(true)
//     const [otp, setOtp]             = useState('')
//     const [otpError, setOtpError]   = useState('')
//     const [signing, setSigning]     = useState(false)
//     const [signed, setSigned]       = useState(false)
//     const [error, setError]         = useState('')
//
//     useEffect(() => {
//         if (!applicationId) { navigate('/loan-status'); return }
//         generateAgreement()
//     }, [applicationId])
//
//     const generateAgreement = async () => {
//         setLoading(true)
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/agreement/generate`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
//                 body: JSON.stringify({ applicationId })
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setAgreement(data.agreement)
//             if (data.dev_otp) console.log(`%c[DEV] Agreement OTP: ${data.dev_otp}`, 'color: orange; font-weight: bold')
//         } catch (err: any) {
//             setError(err.message || 'Failed to generate agreement')
//         } finally {
//             setLoading(false)
//         }
//     }
//
//     // ── Download PDF via browser print ───────────────────────
//     const handleDownload = () => {
//         if (!agreement) return
//
//         const html = `<!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8"/>
// <title>Loan Agreement — Nexus</title>
// <style>
//   * { margin:0; padding:0; box-sizing:border-box; }
//   body { font-family: 'Segoe UI', Arial, sans-serif; font-size:13px; color:#1a1a2e; background:#fff; padding:48px; }
//   .header { text-align:center; border-bottom:2px solid #7c3aed; padding-bottom:24px; margin-bottom:32px; }
//   .header h1 { font-size:22px; font-weight:700; color:#7c3aed; letter-spacing:2px; margin-bottom:6px; }
//   .header p { color:#6b7280; font-size:12px; }
//   .meta { display:flex; justify-content:space-between; font-size:11px; color:#9ca3af; margin-top:10px; }
//   h2 { font-size:13px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:1px; margin:24px 0 10px; border-left:3px solid #7c3aed; padding-left:10px; }
//   table { width:100%; border-collapse:collapse; margin-bottom:8px; }
//   td { padding:7px 12px; border-bottom:1px solid #f3f4f6; font-size:12px; }
//   td:first-child { color:#6b7280; width:220px; }
//   td:last-child { font-weight:600; }
//   ol { margin-left:20px; }
//   ol li { margin-bottom:6px; font-size:12px; line-height:1.6; color:#374151; }
//   .signature { margin-top:48px; border-top:1px solid #e5e7eb; padding-top:24px; display:flex; justify-content:space-between; }
//   .sig-box { text-align:center; }
//   .sig-line { border-bottom:1px solid #374151; width:200px; margin:0 auto 6px; height:40px; }
//   .sig-label { font-size:11px; color:#6b7280; }
//   .footer { margin-top:40px; text-align:center; font-size:10px; color:#9ca3af; border-top:1px solid #f3f4f6; padding-top:16px; }
//   @media print { body { padding:24px; } }
// </style>
// </head>
// <body>
// <div class="header">
//   <h1>LOAN AGREEMENT</h1>
//   <p>Nexus Financial Services Pvt. Ltd.</p>
//   <div class="meta">
//     <span>Agreement ID: ${agreement.applicationId}</span>
//     <span>Date: ${new Date(agreement.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
//   </div>
// </div>
//
// <h2>Borrower Details</h2>
// <table>
//   <tr><td>Full Name</td><td>${agreement.applicantName}</td></tr>
//   <tr><td>Email Address</td><td>${agreement.applicantEmail}</td></tr>
//   ${agreement.panNumber !== 'Not provided' ? `<tr><td>PAN Number</td><td>${agreement.panNumber}</td></tr>` : ''}
//   <tr><td>Employment Type</td><td>${agreement.employmentType}</td></tr>
//   <tr><td>Monthly Income</td><td>₹${Number(agreement.monthlyIncome).toLocaleString('en-IN')}</td></tr>
// </table>
//
// <h2>Loan Terms</h2>
// <table>
//   <tr><td>Principal Amount</td><td>₹${Number(agreement.loanAmount).toLocaleString('en-IN')}</td></tr>
//   <tr><td>Loan Purpose</td><td>${agreement.purpose}</td></tr>
//   <tr><td>Repayment Tenure</td><td>${agreement.tenure} months</td></tr>
//   <tr><td>Interest Rate (p.a.)</td><td>${agreement.interestRate}%</td></tr>
//   <tr><td>Monthly EMI</td><td>₹${Number(agreement.emi).toLocaleString('en-IN')}</td></tr>
//   <tr><td>Total Payable Amount</td><td>₹${Number(agreement.totalPayable).toLocaleString('en-IN')}</td></tr>
//   <tr><td>Total Interest Payable</td><td>₹${Number(agreement.totalPayable - agreement.loanAmount).toLocaleString('en-IN')}</td></tr>
//   <tr><td>Credit Score at Application</td><td>${agreement.creditScore} (Grade: ${agreement.creditGrade})</td></tr>
// </table>
//
// ${agreement.guarantorName !== 'N/A' ? `
// <h2>Guarantor Details</h2>
// <table>
//   <tr><td>Guarantor Name</td><td>${agreement.guarantorName}</td></tr>
//   <tr><td>Guarantor Mobile</td><td>${agreement.guarantorMobile}</td></tr>
// </table>` : ''}
//
// <h2>Terms & Conditions</h2>
// <ol>
//   <li>The borrower agrees to repay the loan in ${agreement.tenure} equal monthly instalments of ₹${Number(agreement.emi).toLocaleString('en-IN')} each, on or before the due date.</li>
//   <li>Interest is calculated on a reducing balance basis at ${agreement.interestRate}% per annum.</li>
//   <li>Late payment will attract a penalty of 2% per month on the overdue amount.</li>
//   <li>The lender (Nexus Financial Services) reserves the right to take legal action in case of default or non-payment.</li>
//   <li>All information provided by the borrower is true and accurate to the best of their knowledge. False information may result in immediate loan recall.</li>
//   <li>This agreement becomes legally binding upon OTP verification (digital signature) by the borrower.</li>
//   <li>Nexus reserves the right to report loan defaults to credit bureaus, which may impact the borrower's credit history.</li>
//   <li>The borrower authorizes Nexus to contact the guarantor for verification and recovery purposes.</li>
//   <li>Prepayment is permitted; contact your loan officer to arrange bulk settlement.</li>
//   <li>Disputes shall be subject to the jurisdiction of courts in India.</li>
// </ol>
//
// <div class="signature">
//   <div class="sig-box">
//     <div class="sig-line"></div>
//     <p class="sig-label">Borrower Signature<br/>${agreement.applicantName}</p>
//   </div>
//   <div class="sig-box">
//     <div class="sig-line"></div>
//     <p class="sig-label">Authorized Signatory<br/>Nexus Financial Services</p>
//   </div>
// </div>
//
// <div class="footer">
//   <p>This is a computer-generated document. Digital signature verified via OTP on ${new Date().toLocaleDateString('en-IN')}.</p>
//   <p style="margin-top:4px">Nexus Financial Services Pvt. Ltd. — nexus.finance | support@nexus.finance</p>
// </div>
// </body>
// </html>`
//
//         const win = window.open('', '_blank')
//         if (!win) { alert('Allow popups to download the agreement'); return }
//         win.document.write(html)
//         win.document.close()
//         win.focus()
//         setTimeout(() => {
//             win.print()
//             win.close()
//         }, 500)
//     }
//
//     const handleSign = async () => {
//         if (otp.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
//         setSigning(true); setOtpError('')
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/agreement/sign`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
//                 body: JSON.stringify({ otp, applicationId })
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//
//             // Trigger Stripe disbursement now that agreement is signed
//             await fetch(`${BACKEND_URL}/api/stripe/disburse-loan`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ applicationId })
//             })
//
//             setSigned(true)
//             setTimeout(() => navigate('/loan-status'), 2500)
//         } catch (err: any) {
//             setOtpError(err.message)
//         } finally {
//             setSigning(false)
//         }
//     }
//
//     if (loading) {
//         return (
//             <div className="page-wrapper flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-6">
//                     <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
//                     <p className="text-xl text-purple-400 font-semibold">Generating your loan agreement…</p>
//                 </div>
//             </div>
//         )
//     }
//
//     if (error) {
//         return (
//             <div className="page-wrapper flex items-center justify-center p-8">
//                 <div className="text-center">
//                     <p className="text-5xl mb-4">⚠️</p>
//                     <p className="text-2xl font-bold text-gray-800 mb-2">Could not generate agreement</p>
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
//     if (signed) {
//         return (
//             <div className="page-wrapper flex items-center justify-center p-8">
//                 <div className="w-full max-w-2xl bg-white rounded-3xl p-16 text-center border border-purple-100">
//                     <div className="text-7xl mb-8">🎉</div>
//                     <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">Agreement Signed!</h2>
//                     <p className="text-gray-400 text-xl mb-6">Your loan funds are being disbursed. Redirecting…</p>
//                     <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
//                 </div>
//             </div>
//         )
//     }
//
//     return (
//         <div className="page-wrapper">
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
//                         <span className="text-base bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-semibold ml-2">
//                             ✅ Loan Approved — Sign Agreement
//                         </span>
//                     </div>
//                     <button onClick={() => navigate('/loan-status')}
//                             className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">
//                         ← Back
//                     </button>
//                 </div>
//             </nav>
//
//             <main className="max-w-4xl mx-auto px-10 py-14">
//
//                 {/* Congratulations banner */}
//                 <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-8 mb-10 flex items-center gap-6"
//                      style={{ boxShadow: '0 8px 30px rgba(34,197,94,0.3)' }}>
//                     <div className="text-5xl">🎉</div>
//                     <div>
//                         <h1 className="font-display font-bold text-3xl text-white mb-1">
//                             Your loan has been approved!
//                         </h1>
//                         <p className="text-emerald-100 text-lg">
//                             Read the loan agreement carefully and sign with your OTP to receive your funds.
//                         </p>
//                     </div>
//                 </div>
//
//                 {agreement && (
//                     <>
//                         {/* Agreement document */}
//                         <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden mb-8"
//                              style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.06)' }}>
//
//                             {/* Header with download button */}
//                             <div className="bg-purple-50 border-b border-purple-100 px-10 py-6 flex items-center justify-between">
//                                 <div className="text-center flex-1">
//                                     <p className="font-display font-bold text-2xl text-gray-900">LOAN AGREEMENT</p>
//                                     <p className="text-gray-500 text-base mt-1">Nexus Financial Services</p>
//                                     <div className="flex items-center justify-center gap-6 mt-2 text-sm text-gray-400">
//                                         <span>ID: {agreement.applicationId?.slice(0, 8)}…</span>
//                                         <span>{new Date(agreement.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
//                                     </div>
//                                 </div>
//                                 <button
//                                     onClick={handleDownload}
//                                     className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-colors flex-shrink-0 ml-6">
//                                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                                         <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//                                     </svg>
//                                     Download PDF
//                                 </button>
//                             </div>
//
//                             {/* Agreement body */}
//                             <div className="px-10 py-8 max-h-96 overflow-y-auto font-mono text-sm leading-relaxed text-gray-700 space-y-4">
//                                 <div>
//                                     <p className="font-bold text-gray-900 not-italic font-sans">BORROWER DETAILS</p>
//                                     <p>Name: {agreement.applicantName}</p>
//                                     <p>Email: {agreement.applicantEmail}</p>
//                                     {agreement.panNumber !== 'Not provided' && <p>PAN: {agreement.panNumber}</p>}
//                                 </div>
//
//                                 <div>
//                                     <p className="font-bold text-gray-900 not-italic font-sans mt-4">LOAN TERMS</p>
//                                     <table className="w-full mt-2">
//                                         <tbody>
//                                         {[
//                                             ['Principal Amount',        `₹${Number(agreement.loanAmount).toLocaleString('en-IN')}`],
//                                             ['Loan Purpose',            agreement.purpose],
//                                             ['Repayment Tenure',        `${agreement.tenure} months`],
//                                             ['Interest Rate (p.a.)',    `${agreement.interestRate}%`],
//                                             ['Monthly EMI',             `₹${Number(agreement.emi).toLocaleString('en-IN')}`],
//                                             ['Total Payable',           `₹${Number(agreement.totalPayable).toLocaleString('en-IN')}`],
//                                             ['Employment Type',         agreement.employmentType],
//                                             ['Declared Monthly Income', `₹${Number(agreement.monthlyIncome).toLocaleString('en-IN')}`],
//                                             ['Credit Score',            `${agreement.creditScore} (Grade ${agreement.creditGrade})`],
//                                         ].map(([k, v]) => (
//                                             <tr key={k} className="border-b border-gray-100">
//                                                 <td className="py-1.5 pr-6 text-gray-400 font-sans text-xs w-56">{k}</td>
//                                                 <td className="py-1.5 font-bold font-sans text-gray-800 text-xs">{v}</td>
//                                             </tr>
//                                         ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//
//                                 {agreement.guarantorName !== 'N/A' && (
//                                     <div>
//                                         <p className="font-bold text-gray-900 not-italic font-sans mt-4">GUARANTOR</p>
//                                         <p>Name: {agreement.guarantorName} &nbsp;|&nbsp; Mobile: {agreement.guarantorMobile}</p>
//                                     </div>
//                                 )}
//
//                                 <div>
//                                     <p className="font-bold text-gray-900 not-italic font-sans mt-4">TERMS & CONDITIONS</p>
//                                     <ol className="list-decimal list-inside space-y-1 text-gray-600 text-xs mt-2 font-sans">
//                                         <li>The borrower agrees to repay the loan in {agreement.tenure} equal monthly instalments of ₹{Number(agreement.emi).toLocaleString('en-IN')} each.</li>
//                                         <li>Late payment will attract a penalty of 2% per month on the overdue amount.</li>
//                                         <li>The lender reserves the right to take legal action in case of default.</li>
//                                         <li>All information provided is true to the best of the borrower's knowledge.</li>
//                                         <li>This agreement is legally binding upon OTP verification by the borrower.</li>
//                                         <li>Nexus reserves the right to report defaults to credit bureaus.</li>
//                                     </ol>
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* OTP signing */}
//                         <div className="bg-white rounded-3xl p-10 border-2 border-purple-200"
//                              style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.08)' }}>
//                             <div className="flex items-start gap-4 mb-8">
//                                 <span className="text-4xl">🔐</span>
//                                 <div>
//                                     <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">
//                                         Sign with OTP
//                                     </h2>
//                                     <p className="text-gray-400 text-base">
//                                         An OTP has been sent to your registered email{' '}
//                                         <strong className="text-purple-600">{agreement.applicantEmail}</strong>.
//                                         Enter it below to digitally sign and receive your funds.
//                                     </p>
//                                 </div>
//                             </div>
//
//                             <div className="flex gap-5 items-start">
//                                 <div className="flex-1">
//                                     <input
//                                         type="text" inputMode="numeric" maxLength={6}
//                                         value={otp}
//                                         onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                                         onKeyDown={e => e.key === 'Enter' && handleSign()}
//                                         placeholder="000000"
//                                         autoFocus
//                                         className="w-full text-center text-5xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-6 py-6 outline-none focus:border-purple-500 transition-colors"
//                                         style={{ letterSpacing: '0.5em' }}
//                                     />
//                                     {otpError && (
//                                         <p className="text-red-500 text-sm mt-3 text-center">⚠️ {otpError}</p>
//                                     )}
//                                 </div>
//                                 <button
//                                     onClick={handleSign}
//                                     disabled={signing || otp.length !== 6}
//                                     className="btn-primary flex-shrink-0"
//                                     style={{ width: 'auto', padding: '22px 40px', fontSize: '18px', borderRadius: '16px' }}>
//                                     {signing
//                                         ? <span className="flex items-center gap-2"><Spinner /> Signing…</span>
//                                         : '✍️ Sign & Get Funds'}
//                                 </button>
//                             </div>
//
//                             <p className="text-gray-400 text-xs mt-5 text-center leading-relaxed">
//                                 By entering the OTP, you confirm you have read and agreed to all terms.
//                                 This constitutes a legally binding digital signature. Your IP and timestamp will be recorded.
//                             </p>
//                         </div>
//                     </>
//                 )}
//             </main>
//         </div>
//     )
// }
//
// function Spinner() {
//     return (
//         <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
//             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
//                     strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
//         </svg>
//     )
// }
//
//


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
    const [otp, setOtp]             = useState('')
    const [otpError, setOtpError]   = useState('')
    const [signing, setSigning]     = useState(false)
    const [signed, setSigned]       = useState(false)
    const [error, setError]         = useState('')

    useEffect(() => {
        if (!applicationId) { navigate('/loan-status'); return }
        generateAgreement()
    }, [applicationId])

    const generateAgreement = async () => {
        setLoading(true)
        try {
            const res  = await fetch(`${BACKEND_URL}/api/agreement/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ applicationId }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAgreement(data.agreement)
            if (data.dev_otp) console.log(`%c[DEV] Agreement OTP: ${data.dev_otp}`, 'color: orange; font-weight: bold')
        } catch (err: any) { setError(err.message || 'Failed to generate agreement') }
        finally { setLoading(false) }
    }

    const handleDownload = () => {
        if (!agreement) return
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Loan Agreement — Nexus</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:48px}.header{text-align:center;border-bottom:2px solid #001736;padding-bottom:24px;margin-bottom:32px}.header h1{font-size:22px;font-weight:700;color:#001736;letter-spacing:2px;margin-bottom:6px}.header p{color:#6b7280;font-size:12px}.meta{display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;margin-top:10px}h2{font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:1px;margin:24px 0 10px;border-left:3px solid #001736;padding-left:10px}table{width:100%;border-collapse:collapse;margin-bottom:8px}td{padding:7px 12px;border-bottom:1px solid #f3f4f6;font-size:12px}td:first-child{color:#6b7280;width:220px}td:last-child{font-weight:600}ol{margin-left:20px}ol li{margin-bottom:6px;font-size:12px;line-height:1.6;color:#374151}.signature{margin-top:48px;border-top:1px solid #e5e7eb;padding-top:24px;display:flex;justify-content:space-between}.sig-box{text-align:center}.sig-line{border-bottom:1px solid #374151;width:200px;margin:0 auto 6px;height:40px}.sig-label{font-size:11px;color:#6b7280}.footer{margin-top:40px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px}@media print{body{padding:24px}}</style></head><body><div class="header"><h1>LOAN AGREEMENT</h1><p>Nexus Financial Services Pvt. Ltd.</p><div class="meta"><span>Agreement ID: ${agreement.applicationId}</span><span>Date: ${new Date(agreement.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div></div><h2>Borrower Details</h2><table><tr><td>Full Name</td><td>${agreement.applicantName}</td></tr><tr><td>Email Address</td><td>${agreement.applicantEmail}</td></tr>${agreement.panNumber !== 'Not provided' ? `<tr><td>PAN Number</td><td>${agreement.panNumber}</td></tr>` : ''}<tr><td>Employment Type</td><td>${agreement.employmentType}</td></tr><tr><td>Monthly Income</td><td>₹${Number(agreement.monthlyIncome).toLocaleString('en-IN')}</td></tr></table><h2>Loan Terms</h2><table><tr><td>Principal Amount</td><td>₹${Number(agreement.loanAmount).toLocaleString('en-IN')}</td></tr><tr><td>Loan Purpose</td><td>${agreement.purpose}</td></tr><tr><td>Repayment Tenure</td><td>${agreement.tenure} months</td></tr><tr><td>Interest Rate (p.a.)</td><td>${agreement.interestRate}%</td></tr><tr><td>Monthly EMI</td><td>₹${Number(agreement.emi).toLocaleString('en-IN')}</td></tr><tr><td>Total Payable Amount</td><td>₹${Number(agreement.totalPayable).toLocaleString('en-IN')}</td></tr><tr><td>Credit Score at Application</td><td>${agreement.creditScore} (Grade: ${agreement.creditGrade})</td></tr></table>${agreement.guarantorName !== 'N/A' ? `<h2>Guarantor Details</h2><table><tr><td>Guarantor Name</td><td>${agreement.guarantorName}</td></tr><tr><td>Guarantor Mobile</td><td>${agreement.guarantorMobile}</td></tr></table>` : ''}<h2>Terms & Conditions</h2><ol><li>The borrower agrees to repay the loan in ${agreement.tenure} equal monthly instalments of ₹${Number(agreement.emi).toLocaleString('en-IN')} each.</li><li>Late payment will attract a penalty of 2% per month on the overdue amount.</li><li>The lender reserves the right to take legal action in case of default.</li><li>All information provided is true to the best of the borrower's knowledge.</li><li>This agreement is legally binding upon OTP verification by the borrower.</li><li>Nexus reserves the right to report defaults to credit bureaus.</li></ol><div class="signature"><div class="sig-box"><div class="sig-line"></div><p class="sig-label">Borrower Signature<br/>${agreement.applicantName}</p></div><div class="sig-box"><div class="sig-line"></div><p class="sig-label">Authorized Signatory<br/>Nexus Financial Services</p></div></div><div class="footer"><p>This is a computer-generated document. Digital signature verified via OTP on ${new Date().toLocaleDateString('en-IN')}.</p></div></body></html>`
        const win = window.open('', '_blank')
        if (!win) { alert('Allow popups to download the agreement'); return }
        win.document.write(html); win.document.close(); win.focus()
        setTimeout(() => { win.print(); win.close() }, 500)
    }

    const handleSign = async () => {
        if (otp.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
        setSigning(true); setOtpError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/agreement/sign`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ otp, applicationId }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            await fetch(`${BACKEND_URL}/api/stripe/disburse-loan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId }) })
            setSigned(true)
            setTimeout(() => navigate('/loan-status'), 2500)
        } catch (err: any) { setOtpError(err.message) }
        finally { setSigning(false) }
    }

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

    if (error) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
                    <p style={{ fontWeight: 700, fontSize: 20, color: '#001736', marginBottom: 8 }}>Could not generate agreement</p>
                    <p style={{ fontSize: 14, color: '#43474f', marginBottom: 24 }}>{error}</p>
                    <button onClick={() => navigate('/loan-status')} style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Back to Loan Status</button>
                </div>
            </div>
        )
    }

    if (signed) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif', padding: 24 }}>
                <div style={{ background: 'white', borderRadius: 20, padding: '64px 48px', textAlign: 'center', border: '1px solid #e0e3e5', maxWidth: 520 }}>
                    <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
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

            {/* Navbar */}
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: 100 }}>✅ Loan Approved — Sign Agreement</span>
                    </div>
                    <button onClick={() => navigate('/loan-status')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f' }}>← Back</button>
                </div>
            </nav>

            <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px' }}>

                {/* Congrats banner */}
                <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
                    <span style={{ fontSize: 36, flexShrink: 0 }}>🎉</span>
                    <div>
                        <h1 style={{ fontWeight: 900, fontSize: 24, color: 'white', marginBottom: 4 }}>Your loan has been approved!</h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Read the loan agreement carefully and sign with your OTP to receive your funds.</p>
                    </div>
                </div>

                {agreement && (
                    <>
                        {/* Agreement document */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e0e3e5', overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
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
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Download PDF
                                </button>
                            </div>

                            <div style={{ padding: '24px 28px', maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
                                <p style={{ fontWeight: 700, fontFamily: 'sans-serif', color: '#001736', marginBottom: 8 }}>BORROWER DETAILS</p>
                                <p>Name: {agreement.applicantName}</p>
                                <p>Email: {agreement.applicantEmail}</p>
                                {agreement.panNumber !== 'Not provided' && <p>PAN: {agreement.panNumber}</p>}

                                <p style={{ fontWeight: 700, fontFamily: 'sans-serif', color: '#001736', margin: '16px 0 8px' }}>LOAN TERMS</p>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                    {[
                                        ['Principal Amount',        `₹${Number(agreement.loanAmount).toLocaleString('en-IN')}`],
                                        ['Loan Purpose',            agreement.purpose],
                                        ['Repayment Tenure',        `${agreement.tenure} months`],
                                        ['Interest Rate (p.a.)',    `${agreement.interestRate}%`],
                                        ['Monthly EMI',             `₹${Number(agreement.emi).toLocaleString('en-IN')}`],
                                        ['Total Payable',           `₹${Number(agreement.totalPayable).toLocaleString('en-IN')}`],
                                        ['Credit Score',            `${agreement.creditScore} (Grade ${agreement.creditGrade})`],
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
                                        'This agreement is legally binding upon OTP verification by the borrower.',
                                        'Nexus reserves the right to report defaults to credit bureaus.',
                                    ].map((t, i) => <li key={i} style={{ fontSize: 12, fontFamily: 'sans-serif', color: '#374151' }}>{t}</li>)}
                                </ol>
                            </div>
                        </div>

                        {/* OTP signing */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '32px', border: '1.5px solid #a4c9ff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                                <span style={{ fontSize: 32, flexShrink: 0 }}>🔐</span>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: 20, color: '#001736', marginBottom: 6 }}>Sign with OTP</h2>
                                    <p style={{ fontSize: 14, color: '#43474f' }}>
                                        An OTP has been sent to your registered email{' '}
                                        <strong style={{ color: '#0060ac' }}>{agreement.applicantEmail}</strong>.
                                        Enter it below to digitally sign and receive your funds.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <input type="text" inputMode="numeric" maxLength={6} value={otp}
                                           onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                           onKeyDown={e => e.key === 'Enter' && handleSign()}
                                           placeholder="000000" autoFocus
                                           style={{ width: '100%', textAlign: 'center', fontSize: 40, fontWeight: 900, letterSpacing: '0.5em', background: 'white', border: `2px solid ${otp.length === 6 ? '#0060ac' : '#e0e3e5'}`, borderRadius: 10, padding: '20px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', transition: 'border-color 0.2s' }}/>
                                    {otpError && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8, textAlign: 'center' }}>⚠️ {otpError}</p>}
                                </div>
                                <button onClick={handleSign} disabled={signing || otp.length !== 6}
                                        style={{ background: otp.length === 6 ? '#001736' : '#e0e3e5', color: otp.length === 6 ? 'white' : '#747780', border: 'none', borderRadius: 10, padding: '20px 32px', fontWeight: 800, fontSize: 16, cursor: otp.length === 6 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {signing ? <><Spinner/> Signing…</> : '✍️ Sign & Get Funds'}
                                </button>
                            </div>

                            <p style={{ fontSize: 12, color: '#c4c6d0', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
                                By entering the OTP, you confirm you have read and agreed to all terms. This constitutes a legally binding digital signature.
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