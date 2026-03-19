// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
// import { supabase } from '@/lib/supabaseClient'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// type Step = 'details' | 'review' | 'submitting'
//
// export default function LoanApplicationPage() {
//     const { user, session } = useAuth()
//     const navigate = useNavigate()
//
//     const [step, setStep]           = useState<Step>('details')
//     const [loading, setLoading]     = useState(true)
//     const [error, setError]         = useState('')
//
//     // User profile data
//     const [isExistingUser, setIsExistingUser] = useState(false)
//     const [bankConnected, setBankConnected]   = useState(false)
//     const [creditScore, setCreditScore]       = useState<any>(null)
//     const [bankSummary, setBankSummary]       = useState<any>(null)
//
//     // Loan details
//     const [loanAmount, setLoanAmount]       = useState('')
//     const [loanPurpose, setLoanPurpose]     = useState('')
//     const [tenure, setTenure]               = useState('')
//     const [employment, setEmployment]       = useState('')
//     const [monthlyIncome, setMonthlyIncome] = useState('')
//     const [employer, setEmployer]           = useState('')
//     const [panNumber, setPanNumber]         = useState('')  // F3: PAN in employment
//     const [panError, setPanError]           = useState('')
//
//     const fullName = user?.user_metadata?.full_name ?? ''
//     const email    = user?.email ?? ''
//
//     useEffect(() => { initializePage() }, [])
//
//     const initializePage = async () => {
//         setLoading(true)
//         try {
//             const bankRes = await fetch(`${BACKEND_URL}/api/plaid/bank-summary`, {
//                 headers: { Authorization: `Bearer ${session?.access_token}` }
//             })
//             const bankData = await bankRes.json()
//             setBankConnected(bankData.connected)
//             setBankSummary(bankData)
//
//             const scoreRes = await fetch(`${BACKEND_URL}/api/credit/latest`, {
//                 headers: { Authorization: `Bearer ${session?.access_token}` }
//             })
//             const scoreData = await scoreRes.json()
//             if (scoreData?.breakdown) setCreditScore(scoreData.breakdown)
//
//             const { data: priorLoans } = await supabase
//                 .from('loan_applications').select('id')
//                 .eq('user_id', user?.id).eq('status', 'approved').limit(1)
//             setIsExistingUser((priorLoans?.length || 0) > 0)
//         } catch {
//             setError('Failed to load your profile')
//         } finally {
//             setLoading(false)
//         }
//     }
//
//     // F3 PAN validation
//     const validatePAN = (pan: string) => {
//         if (!pan) { setPanError(''); return true } // PAN optional in loan form, required in docs
//         const ok = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
//         setPanError(ok ? '' : 'Invalid PAN format. Example: ABCDE1234F')
//         return ok
//     }
//
//     // ── Submit application directly (agreement happens after officer approval) ──
//     const handleGoToAgreement = async () => {
//         setError('')
//         if (!loanAmount || !loanPurpose || !tenure || !employment || !monthlyIncome) {
//             setError('Please fill in all required fields'); return
//         }
//         if (panNumber && !validatePAN(panNumber.toUpperCase())) return
//
//         setStep('submitting')
//
//         try {
//             const { data: appData, error: insertError } = await supabase
//                 .from('loan_applications')
//                 .insert([{
//                     user_id: user?.id,
//                     email,
//                     full_name: fullName,
//                     amount: Number(loanAmount),
//                     purpose: loanPurpose,
//                     tenure: Number(tenure),
//                     employment_type: employment,
//                     monthly_income: Number(monthlyIncome),
//                     employer_name: employer,
//                     pan_number: panNumber.toUpperCase() || null,
//                     user_type: isExistingUser ? 'existing' : 'new',
//                     credit_score: creditScore?.score,
//                     score_breakdown: creditScore,
//                     plaid_data_snapshot: bankSummary,
//                     status: 'pending',
//                     agreement_signed: false,
//                 }])
//                 .select('id').single()
//
//             if (insertError) throw insertError
//
//             setTimeout(() => navigate('/upload-documents', { state: { applicationId: appData.id } }), 1500)
//         } catch (err: any) {
//             setError(err.message || 'Failed to submit application')
//             setStep('review')
//         }
//     }
//
//     const purposes = [
//         { label: 'Personal', icon: '👤' },
//         { label: 'Home',      icon: '🏠' },
//         { label: 'Education', icon: '🎓' },
//         { label: 'Business',  icon: '💼' },
//         { label: 'Medical',   icon: '🏥' },
//         { label: 'Vehicle',   icon: '🚗' },
//     ]
//
//     const employmentTypes = [
//         // Employed
//         { label: 'Salaried — Private',    icon: '🏢', group: 'Employed' },
//         { label: 'Salaried — Government', icon: '🏛️', group: 'Employed' },
//         { label: 'Armed Forces / Defence',icon: '🎖️', group: 'Employed' },
//         { label: 'Teacher / Professor',   icon: '📚', group: 'Employed' },
//         { label: 'Doctor / Medical',      icon: '🩺', group: 'Employed' },
//         // Self-employed / Business
//         { label: 'Self-Employed',         icon: '💼', group: 'Self-Employed' },
//         { label: 'Business Owner',        icon: '🏭', group: 'Self-Employed' },
//         { label: 'Freelancer',            icon: '💻', group: 'Self-Employed' },
//         { label: 'Consultant',            icon: '📊', group: 'Self-Employed' },
//         { label: 'Trader / Merchant',     icon: '🛒', group: 'Self-Employed' },
//         { label: 'Farmer / Agriculture',  icon: '🌾', group: 'Self-Employed' },
//         // Gig / Informal
//         { label: 'Gig Worker',            icon: '🛵', group: 'Gig / Informal' },
//         { label: 'Daily Wage Worker',     icon: '🔨', group: 'Gig / Informal' },
//         { label: 'Contract Worker',       icon: '📝', group: 'Gig / Informal' },
//         { label: 'Part-time Worker',      icon: '⏰', group: 'Gig / Informal' },
//         // Other
//         { label: 'Student',               icon: '🎓', group: 'Other' },
//         { label: 'Homemaker',             icon: '🏡', group: 'Other' },
//         { label: 'Retired / Pensioner',   icon: '👴', group: 'Other' },
//         { label: 'Unemployed',            icon: '🔍', group: 'Other' },
//         { label: 'Other',                 icon: '➕', group: 'Other' },
//     ]
//
//     const employmentGroups = ['Employed', 'Self-Employed', 'Gig / Informal', 'Other']
//
//     if (loading) {
//         return (
//             <div className="page-wrapper flex items-center justify-center">
//                 <div className="flex flex-col items-center gap-6">
//                     <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
//                     <p className="text-xl text-purple-400 font-semibold">Loading your profile…</p>
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
//                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
//                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
//                             </svg>
//                         </div>
//                         <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
//                         <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold ml-2">Loan Application</span>
//                     </div>
//                     <button onClick={() => navigate('/dashboard')} className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">← Dashboard</button>
//                 </div>
//             </nav>
//
//             <main className="max-w-5xl mx-auto px-10 py-14">
//                 <div className="mb-12">
//                     <div className="flex items-center gap-3 mb-4">
//                         <p className="text-base font-bold text-purple-400 uppercase tracking-widest">{isExistingUser ? 'Returning Applicant' : 'New Applicant'}</p>
//                         <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${isExistingUser ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
//                             {isExistingUser ? '✓ Existing Customer' : '🌟 Cold Start'}
//                         </span>
//                     </div>
//                     <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">Apply for a Loan</h1>
//                     <p className="text-gray-400 text-xl">{isExistingUser ? 'Welcome back! Your history is on file — just fill in the details.' : 'Your bank data has been analyzed. Complete the form below.'}</p>
//                 </div>
//
//                 {/* Steps indicator */}
//                 <div className="flex items-center gap-3 mb-10">
//                     {['Loan Details', 'Review', 'Submit'].map((s, i) => {
//                         const active = (step === 'details' && i === 0) || (step === 'review' && i === 1) || (step === 'submitting' && i === 2)
//                         const done   = (step === 'review' && i === 0) || (step === 'submitting' && i <= 1)
//                         return (
//                             <div key={s} className="flex items-center gap-3 flex-1">
//                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all ${active || done ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-300'}`}>
//                                     {done && !active ? '✓' : i + 1}
//                                 </div>
//                                 <span className="text-base font-semibold text-gray-600">{s}</span>
//                                 {i < 2 && <div className="flex-1 h-px bg-purple-100" />}
//                             </div>
//                         )
//                     })}
//                 </div>
//
//                 {!bankConnected && (
//                     <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8 mb-10 flex items-center justify-between gap-6">
//                         <div className="flex items-start gap-4">
//                             <span className="text-4xl">⚠️</span>
//                             <div>
//                                 <p className="font-bold text-yellow-800 text-xl mb-1">Bank Not Connected</p>
//                                 <p className="text-yellow-700 text-base">Connect your bank first for an AI credit score.</p>
//                             </div>
//                         </div>
//                         <button onClick={() => navigate('/connect-bank')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-base px-6 py-3 rounded-2xl transition-colors flex-shrink-0">Connect Bank →</button>
//                     </div>
//                 )}
//
//                 {creditScore && (
//                     <div className="bg-white rounded-3xl p-8 border border-purple-100 mb-10 flex items-center justify-between gap-6"
//                          style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.06)' }}>
//                         <div className="flex items-center gap-6">
//                             <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-bold text-3xl"
//                                  style={{ background: `${getScoreColor(creditScore.score)}15`, color: getScoreColor(creditScore.score) }}>
//                                 {creditScore.score}
//                             </div>
//                             <div>
//                                 <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-1">Credit Score</p>
//                                 <p className="font-display font-bold text-2xl text-gray-900">{creditScore.grade}</p>
//                                 <p className="text-base text-gray-400">{creditScore.riskLevel}</p>
//                             </div>
//                         </div>
//                         <button onClick={() => navigate('/credit-score')} className="text-purple-600 hover:text-purple-800 font-semibold text-base border border-purple-200 px-5 py-2.5 rounded-xl transition-all hover:border-purple-400">
//                             View Full Report →
//                         </button>
//                     </div>
//                 )}
//
//                 <div className="bg-white rounded-3xl p-12 border border-purple-100" style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.06)' }}>
//                     {error && (
//                         <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-base flex items-center gap-3">
//                             <span>⚠️</span> {error}
//                         </div>
//                     )}
//
//                     {/* ── Details step ── */}
//                     {step === 'details' && (
//                         <>
//                             <h2 className="font-display font-bold text-3xl text-gray-900 mb-2">Loan Details</h2>
//                             <p className="text-gray-400 text-lg mb-10">Tell us what you need</p>
//
//                             <div className="space-y-8">
//                                 {/* Amount + Tenure */}
//                                 <div className="grid grid-cols-2 gap-6">
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">Loan Amount (₹)</label>
//                                         <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)}
//                                                placeholder="e.g. 200000"
//                                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
//                                                style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                         {loanAmount && <p className="text-purple-500 text-sm mt-2 font-medium">₹{Number(loanAmount).toLocaleString('en-IN')}</p>}
//                                     </div>
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">Repayment Tenure</label>
//                                         <select value={tenure} onChange={e => setTenure(e.target.value)}
//                                                 className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-5 text-lg text-gray-800 outline-none transition-all focus:border-purple-400"
//                                                 style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}>
//                                             <option value="">Select tenure</option>
//                                             {[6, 12, 18, 24, 36, 48, 60].map(m => (
//                                                 <option key={m} value={m}>{m} months ({(m / 12).toFixed(1)} yrs)</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                 </div>
//
//                                 {/* Employment Type */}
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">
//                                         Employment Type
//                                     </label>
//                                     <div className="space-y-4">
//                                         {employmentGroups.map(group => (
//                                             <div key={group}>
//                                                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{group}</p>
//                                                 <div className="flex flex-wrap gap-2">
//                                                     {employmentTypes.filter(e => e.group === group).map(e => (
//                                                         <button key={e.label} type="button"
//                                                                 onClick={() => setEmployment(e.label)}
//                                                                 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
//                                                                     employment === e.label
//                                                                         ? 'border-purple-500 bg-purple-50 text-purple-700'
//                                                                         : 'border-purple-100 text-gray-600 hover:border-purple-300 hover:bg-purple-50/50'
//                                                                 }`}>
//                                                             <span>{e.icon}</span>
//                                                             <span>{e.label}</span>
//                                                         </button>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                     {employment && (
//                                         <p className="text-purple-600 text-sm mt-3 font-semibold">
//                                             ✓ Selected: {employment}
//                                         </p>
//                                     )}
//                                 </div>
//
//                                 {/* Purpose */}
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">Loan Purpose</label>
//                                     <div className="grid grid-cols-3 gap-4">
//                                         {purposes.map(p => (
//                                             <button key={p.label} type="button" onClick={() => setLoanPurpose(p.label)}
//                                                     className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${loanPurpose === p.label ? 'border-purple-500 bg-purple-50' : 'border-purple-100 hover:border-purple-300'}`}>
//                                                 <span className="text-3xl block mb-3">{p.icon}</span>
//                                                 <span className={`text-lg font-semibold ${loanPurpose === p.label ? 'text-purple-700' : 'text-gray-700'}`}>{p.label}</span>
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//
//
//
//                                 {/* Income + Employer + PAN (F3) */}
//                                 <div className="grid grid-cols-2 gap-6">
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">Monthly Income (₹)</label>
//                                         <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)}
//                                                placeholder="e.g. 50000"
//                                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
//                                                style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                     </div>
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-3 uppercase tracking-wide">Employer / Company</label>
//                                         <input type="text" value={employer} onChange={e => setEmployer(e.target.value)}
//                                                placeholder="e.g. Infosys Ltd"
//                                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-5 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
//                                                style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                     </div>
//                                 </div>
//
//                                 {/* F3 — PAN in employment section */}
//                                 <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
//                                     <h3 className="font-bold text-purple-800 text-lg mb-1">🔢 PAN Number (Employment Verification)</h3>
//                                     <p className="text-purple-500 text-sm mb-4">Your PAN is used to verify income and employment. Optional here — required in document upload.</p>
//                                     <input type="text" value={panNumber}
//                                            onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
//                                            placeholder="ABCDE1234F" maxLength={10}
//                                            className="w-full bg-white border border-purple-200 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest uppercase"
//                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                     {panError && <p className="text-red-500 text-sm mt-2">⚠️ {panError}</p>}
//                                     {panNumber.length === 10 && !panError && <p className="text-emerald-500 text-sm mt-2">✅ Valid PAN format</p>}
//                                 </div>
//                             </div>
//
//                             <div className="flex justify-end mt-10 pt-8 border-t border-purple-50">
//                                 <button onClick={() => {
//                                     if (!loanAmount || !loanPurpose || !tenure || !employment || !monthlyIncome) { setError('Please fill in all required fields'); return }
//                                     if (panNumber && !validatePAN(panNumber.toUpperCase())) return
//                                     setError(''); setStep('review')
//                                 }}
//                                         className="btn-primary"
//                                         style={{ width: 'auto', padding: '18px 48px', fontSize: '18px', borderRadius: '16px' }}>
//                                     Review Application →
//                                 </button>
//                             </div>
//                         </>
//                     )}
//
//                     {/* ── Review step ── */}
//                     {step === 'review' && (
//                         <>
//                             <h2 className="font-display font-bold text-3xl text-gray-900 mb-2">Review & Sign</h2>
//                             <p className="text-gray-400 text-lg mb-10">Confirm your details and submit. The officer will review and you'll sign the agreement only if approved.</p>
//
//                             <div className="space-y-6">
//                                 <ReviewBlock title="📋 Loan Details">
//                                     <ReviewRow label="Amount"  value={`₹${Number(loanAmount).toLocaleString('en-IN')}`} />
//                                     <ReviewRow label="Purpose" value={loanPurpose} />
//                                     <ReviewRow label="Tenure"  value={`${tenure} months`} />
//                                 </ReviewBlock>
//
//                                 <ReviewBlock title="💰 Financial Details">
//                                     <ReviewRow label="Employment"     value={employment} />
//                                     <ReviewRow label="Monthly Income" value={`₹${Number(monthlyIncome).toLocaleString('en-IN')}`} />
//                                     <ReviewRow label="Employer"       value={employer || 'N/A'} />
//                                     {panNumber && <ReviewRow label="PAN Number" value={panNumber.toUpperCase()} mono />}
//                                 </ReviewBlock>
//
//                                 {creditScore && (
//                                     <ReviewBlock title="📊 Credit Score">
//                                         <div className="flex items-center gap-6">
//                                             <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl"
//                                                  style={{ background: `${getScoreColor(creditScore.score)}20`, color: getScoreColor(creditScore.score) }}>
//                                                 {creditScore.score}
//                                             </div>
//                                             <div>
//                                                 <p className="text-xl font-bold text-gray-900">{creditScore.grade} · {creditScore.riskLevel}</p>
//                                                 <p className="text-gray-500 text-base mt-1">{creditScore.isColdStart ? '🌟 Cold Start Profile' : '✅ Existing Customer'}</p>
//                                             </div>
//                                         </div>
//                                     </ReviewBlock>
//                                 )}
//
//                                 {bankConnected && (
//                                     <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 flex items-center gap-4">
//                                         <span className="text-3xl">🏦</span>
//                                         <div>
//                                             <p className="font-bold text-emerald-800 text-lg">Bank Data Verified</p>
//                                             <p className="text-emerald-700 text-base">{bankSummary?.institution} · {bankSummary?.accounts?.length || 0} accounts · {bankSummary?.transactions?.length || 0} tx analyzed</p>
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//
//                             <div className="flex items-center justify-between mt-10 pt-8 border-t border-purple-50">
//                                 <button onClick={() => setStep('details')} className="flex items-center gap-2 text-lg text-purple-500 hover:text-purple-700 font-semibold border border-purple-200 px-6 py-4 rounded-2xl transition-all">
//                                     ← Edit Details
//                                 </button>
//                                 <button onClick={handleGoToAgreement}
//                                         className="btn-primary"
//                                         style={{ width: 'auto', padding: '18px 48px', fontSize: '18px', borderRadius: '16px' }}>
//                                     🚀 Submit Application
//                                 </button>
//                             </div>
//                         </>
//                     )}
//
//                     {/* ── Submitting ── */}
//                     {step === 'submitting' && (
//                         <div className="text-center py-16">
//                             <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto mb-8" />
//                             <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">Submitting Application…</h2>
//                             <p className="text-gray-400 text-xl">Redirecting you to upload your documents…</p>
//                         </div>
//                     )}
//                 </div>
//             </main>
//         </div>
//     )
// }
//
// // Small reusable review block
// function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
//     return (
//         <div className="bg-purple-50 rounded-2xl p-8 border border-purple-100">
//             <h3 className="font-bold text-purple-700 text-xl mb-6">{title}</h3>
//             {children}
//         </div>
//     )
// }
//
// function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
//     return (
//         <div className="flex items-center justify-between py-2 border-b border-purple-100 last:border-0">
//             <span className="text-gray-500 text-base">{label}</span>
//             <span className={`font-bold text-gray-900 text-lg ${mono ? 'font-mono tracking-widest' : ''}`}>{value}</span>
//         </div>
//     )
// }
//
// function getScoreColor(score: number) {
//     if (score >= 750) return '#22c55e'
//     if (score >= 650) return '#8b5cf6'
//     if (score >= 550) return '#f59e0b'
//     return '#ef4444'
// }
//
// function Spinner() {
//     return (
//         <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
//             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
//         </svg>
//     )
// }
//


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
type Step = 'details' | 'review' | 'submitting'

export default function LoanApplicationPage() {
    const { user, session } = useAuth()
    const navigate = useNavigate()
    const [step, setStep]           = useState<Step>('details')
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState('')
    const [isExistingUser, setIsExistingUser] = useState(false)
    const [bankConnected, setBankConnected]   = useState(false)
    const [creditScore, setCreditScore]       = useState<any>(null)
    const [bankSummary, setBankSummary]       = useState<any>(null)
    const [loanAmount, setLoanAmount]         = useState('')
    const [loanPurpose, setLoanPurpose]       = useState('')
    const [tenure, setTenure]                 = useState('')
    const [employment, setEmployment]         = useState('')
    const [monthlyIncome, setMonthlyIncome]   = useState('')
    const [employer, setEmployer]             = useState('')
    const [panNumber, setPanNumber]           = useState('')
    const [panError, setPanError]             = useState('')

    const fullName = user?.user_metadata?.full_name ?? ''
    const email    = user?.email ?? ''

    useEffect(() => { initializePage() }, [])

    const initializePage = async () => {
        setLoading(true)
        try {
            const bankRes  = await fetch(`${BACKEND_URL}/api/plaid/bank-summary`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
            const bankData = await bankRes.json()
            setBankConnected(bankData.connected)
            setBankSummary(bankData)
            const scoreRes  = await fetch(`${BACKEND_URL}/api/credit/latest`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
            const scoreData = await scoreRes.json()
            if (scoreData?.breakdown) setCreditScore(scoreData.breakdown)
            const { data: priorLoans } = await supabase.from('loan_applications').select('id').eq('user_id', user?.id).eq('status', 'approved').limit(1)
            setIsExistingUser((priorLoans?.length || 0) > 0)
        } catch { setError('Failed to load your profile') }
        finally  { setLoading(false) }
    }

    const validatePAN = (pan: string) => {
        if (!pan) { setPanError(''); return true }
        const ok = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
        setPanError(ok ? '' : 'Invalid PAN format. Example: ABCDE1234F')
        return ok
    }

    const handleGoToAgreement = async () => {
        setError('')
        if (!loanAmount || !loanPurpose || !tenure || !employment || !monthlyIncome) { setError('Please fill in all required fields'); return }
        if (panNumber && !validatePAN(panNumber.toUpperCase())) return
        setStep('submitting')
        try {
            const { data: appData, error: insertError } = await supabase
                .from('loan_applications')
                .insert([{ user_id: user?.id, email, full_name: fullName, amount: Number(loanAmount), purpose: loanPurpose, tenure: Number(tenure), employment_type: employment, monthly_income: Number(monthlyIncome), employer_name: employer, pan_number: panNumber.toUpperCase() || null, user_type: isExistingUser ? 'existing' : 'new', credit_score: creditScore?.score, score_breakdown: creditScore, plaid_data_snapshot: bankSummary, status: 'pending', agreement_signed: false }])
                .select('id').single()
            if (insertError) throw insertError
            setTimeout(() => navigate('/upload-documents', { state: { applicationId: appData.id } }), 1500)
        } catch (err: any) {
            setError(err.message || 'Failed to submit application')
            setStep('review')
        }
    }

    const purposes = [
        { label: 'Personal', icon: '👤' }, { label: 'Home', icon: '🏠' },
        { label: 'Education', icon: '🎓' }, { label: 'Business', icon: '💼' },
        { label: 'Medical', icon: '🏥' }, { label: 'Vehicle', icon: '🚗' },
    ]

    const employmentTypes = [
        { label: 'Salaried — Private',     icon: '🏢', group: 'Employed' },
        { label: 'Salaried — Government',  icon: '🏛️', group: 'Employed' },
        { label: 'Armed Forces / Defence', icon: '🎖️', group: 'Employed' },
        { label: 'Teacher / Professor',    icon: '📚', group: 'Employed' },
        { label: 'Doctor / Medical',       icon: '🩺', group: 'Employed' },
        { label: 'Self-Employed',          icon: '💼', group: 'Self-Employed' },
        { label: 'Business Owner',         icon: '🏭', group: 'Self-Employed' },
        { label: 'Freelancer',             icon: '💻', group: 'Self-Employed' },
        { label: 'Consultant',             icon: '📊', group: 'Self-Employed' },
        { label: 'Trader / Merchant',      icon: '🛒', group: 'Self-Employed' },
        { label: 'Farmer / Agriculture',   icon: '🌾', group: 'Self-Employed' },
        { label: 'Gig Worker',             icon: '🛵', group: 'Gig / Informal' },
        { label: 'Daily Wage Worker',      icon: '🔨', group: 'Gig / Informal' },
        { label: 'Contract Worker',        icon: '📝', group: 'Gig / Informal' },
        { label: 'Part-time Worker',       icon: '⏰', group: 'Gig / Informal' },
        { label: 'Student',                icon: '🎓', group: 'Other' },
        { label: 'Homemaker',              icon: '🏡', group: 'Other' },
        { label: 'Retired / Pensioner',    icon: '👴', group: 'Other' },
        { label: 'Unemployed',             icon: '🔍', group: 'Other' },
        { label: 'Other',                  icon: '➕', group: 'Other' },
    ]
    const employmentGroups = ['Employed', 'Self-Employed', 'Gig / Informal', 'Other']

    const getScoreColor = (score: number) => score >= 750 ? '#22c55e' : score >= 650 ? '#0060ac' : score >= 550 ? '#f59e0b' : '#ef4444'

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    <p style={{ fontSize: 15, color: '#43474f', fontWeight: 600 }}>Loading your profile…</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* ── Navbar ─────────────────────────────────────────── */}
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#eef4ff', color: '#0060ac', padding: '4px 12px', borderRadius: 100 }}>Loan Application</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ← Dashboard
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

                {/* Header */}
                <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                            {isExistingUser ? 'Returning Applicant' : 'New Applicant'}
                        </p>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: isExistingUser ? '#f0fdf4' : '#eef4ff', color: isExistingUser ? '#15803d' : '#0060ac' }}>
                            {isExistingUser ? '✓ Existing Customer' : '🌟 Cold Start'}
                        </span>
                    </div>
                    <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: '#001736', letterSpacing: '-1px', marginBottom: 8 }}>Apply for a Loan</h1>
                    <p style={{ fontSize: 15, color: '#43474f' }}>{isExistingUser ? 'Welcome back! Your history is on file — just fill in the details.' : 'Your bank data has been analyzed. Complete the form below.'}</p>
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    {['Loan Details', 'Review', 'Submit'].map((s, i) => {
                        const active = (step === 'details' && i === 0) || (step === 'review' && i === 1) || (step === 'submitting' && i === 2)
                        const done   = (step === 'review' && i === 0) || (step === 'submitting' && i <= 1)
                        return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: active || done ? '#001736' : '#eceef0', color: active || done ? 'white' : '#747780', flexShrink: 0 }}>
                                    {done && !active ? '✓' : i + 1}
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: active ? '#001736' : '#747780' }}>{s}</span>
                                {i < 2 && <div style={{ flex: 1, height: 1, background: '#e0e3e5' }}/>}
                            </div>
                        )
                    })}
                </div>

                {/* Bank warning */}
                {!bankConnected && (
                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 24 }}>⚠️</span>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 15, color: '#a16207', margin: 0, marginBottom: 2 }}>Bank Not Connected</p>
                                <p style={{ fontSize: 13, color: '#a16207', margin: 0 }}>Connect your bank first for an AI credit score.</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/connect-bank')}
                                style={{ background: '#a16207', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                            Connect Bank →
                        </button>
                    </div>
                )}

                {/* Credit score banner */}
                {creditScore && (
                    <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e0e3e5', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, background: `${getScoreColor(creditScore.score)}15`, color: getScoreColor(creditScore.score), flexShrink: 0 }}>
                                {creditScore.score}
                            </div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, marginBottom: 2 }}>Credit Score</p>
                                <p style={{ fontWeight: 800, fontSize: 16, color: '#001736', margin: 0 }}>{creditScore.grade}</p>
                                <p style={{ fontSize: 12, color: '#43474f', margin: 0 }}>{creditScore.riskLevel}</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/credit-score')}
                                style={{ background: 'none', border: '1.5px solid #e0e3e5', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#0060ac', cursor: 'pointer' }}>
                            View Full Report →
                        </button>
                    </div>
                )}

                {/* Main form card */}
                <div style={{ background: 'white', borderRadius: 16, padding: '40px', border: '1px solid #e0e3e5', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 28, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* ── Details ── */}
                    {step === 'details' && (
                        <>
                            <h2 style={{ fontWeight: 900, fontSize: 24, color: '#001736', marginBottom: 6 }}>Loan Details</h2>
                            <p style={{ fontSize: 14, color: '#43474f', marginBottom: 32 }}>Tell us what you need</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                                {/* Amount + Tenure */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Loan Amount (₹)</label>
                                        <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)}
                                               placeholder="e.g. 200000"
                                               style={{ width: '100%', padding: '13px 16px', background: '#f2f4f6', border: '1.5px solid transparent', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                               onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                               onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                        {loanAmount && <p style={{ fontSize: 12, color: '#0060ac', marginTop: 6, fontWeight: 600 }}>₹{Number(loanAmount).toLocaleString('en-IN')}</p>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Repayment Tenure</label>
                                        <select value={tenure} onChange={e => setTenure(e.target.value)}
                                                style={{ width: '100%', padding: '13px 16px', background: '#f2f4f6', border: '1.5px solid transparent', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', appearance: 'none' }}
                                                onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                                onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}>
                                            <option value="">Select tenure</option>
                                            {[6, 12, 18, 24, 36, 48, 60].map(m => (
                                                <option key={m} value={m}>{m} months ({(m / 12).toFixed(1)} yrs)</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Employment */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Employment Type</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {employmentGroups.map(group => (
                                            <div key={group}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: '#c4c6d0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{group}</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {employmentTypes.filter(e => e.group === group).map(e => (
                                                        <button key={e.label} type="button" onClick={() => setEmployment(e.label)}
                                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: employment === e.label ? '1.5px solid #0060ac' : '1.5px solid #e0e3e5', background: employment === e.label ? '#eef4ff' : 'white', color: employment === e.label ? '#0060ac' : '#43474f', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                                                            <span>{e.icon}</span><span>{e.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {employment && <p style={{ fontSize: 12, color: '#0060ac', marginTop: 8, fontWeight: 600 }}>✓ Selected: {employment}</p>}
                                </div>

                                {/* Purpose */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Loan Purpose</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                        {purposes.map(p => (
                                            <button key={p.label} type="button" onClick={() => setLoanPurpose(p.label)}
                                                    style={{ padding: '20px 16px', borderRadius: 12, border: loanPurpose === p.label ? '1.5px solid #0060ac' : '1.5px solid #e0e3e5', background: loanPurpose === p.label ? '#eef4ff' : 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{p.icon}</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: loanPurpose === p.label ? '#0060ac' : '#001736' }}>{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Income + Employer */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Monthly Income (₹)</label>
                                        <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)}
                                               placeholder="e.g. 50000"
                                               style={{ width: '100%', padding: '13px 16px', background: '#f2f4f6', border: '1.5px solid transparent', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                               onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                               onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Employer / Company</label>
                                        <input type="text" value={employer} onChange={e => setEmployer(e.target.value)}
                                               placeholder="e.g. Infosys Ltd"
                                               style={{ width: '100%', padding: '13px 16px', background: '#f2f4f6', border: '1.5px solid transparent', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                               onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                               onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                    </div>
                                </div>

                                {/* PAN */}
                                <div style={{ background: '#f7f9fb', borderRadius: 12, padding: '20px', border: '1px solid #e0e3e5' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: 14, color: '#001736', marginBottom: 4 }}>🔢 PAN Number (Employment Verification)</h3>
                                    <p style={{ fontSize: 12, color: '#747780', marginBottom: 12 }}>Optional here — required in document upload.</p>
                                    <input type="text" value={panNumber}
                                           onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
                                           placeholder="ABCDE1234F" maxLength={10}
                                           style={{ width: '100%', padding: '13px 16px', background: 'white', border: `1.5px solid ${panError ? '#fca5a5' : panNumber.length === 10 && !panError ? '#86efac' : '#e0e3e5'}`, borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase', transition: 'all 0.2s' }}/>
                                    {panError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>⚠️ {panError}</p>}
                                    {panNumber.length === 10 && !panError && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6 }}>✅ Valid PAN format</p>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 36, paddingTop: 28, borderTop: '1px solid #f2f4f6' }}>
                                <button onClick={() => {
                                    if (!loanAmount || !loanPurpose || !tenure || !employment || !monthlyIncome) { setError('Please fill in all required fields'); return }
                                    if (panNumber && !validatePAN(panNumber.toUpperCase())) return
                                    setError(''); setStep('review')
                                }}
                                        style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 10, padding: '14px 40px', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#002b5b')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#001736')}>
                                    Review Application →
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Review ── */}
                    {step === 'review' && (
                        <>
                            <h2 style={{ fontWeight: 900, fontSize: 24, color: '#001736', marginBottom: 6 }}>Review & Submit</h2>
                            <p style={{ fontSize: 14, color: '#43474f', marginBottom: 32 }}>Confirm your details. You'll sign the agreement only after officer approval.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <ReviewBlock title="📋 Loan Details">
                                    <ReviewRow label="Amount"  value={`₹${Number(loanAmount).toLocaleString('en-IN')}`}/>
                                    <ReviewRow label="Purpose" value={loanPurpose}/>
                                    <ReviewRow label="Tenure"  value={`${tenure} months`}/>
                                </ReviewBlock>
                                <ReviewBlock title="💰 Financial Details">
                                    <ReviewRow label="Employment"     value={employment}/>
                                    <ReviewRow label="Monthly Income" value={`₹${Number(monthlyIncome).toLocaleString('en-IN')}`}/>
                                    <ReviewRow label="Employer"       value={employer || 'N/A'}/>
                                    {panNumber && <ReviewRow label="PAN Number" value={panNumber} mono/>}
                                </ReviewBlock>
                                {creditScore && (
                                    <ReviewBlock title="📊 Credit Score">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, background: `${getScoreColor(creditScore.score)}15`, color: getScoreColor(creditScore.score) }}>
                                                {creditScore.score}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: 16, color: '#001736', margin: 0 }}>{creditScore.grade} · {creditScore.riskLevel}</p>
                                                <p style={{ fontSize: 13, color: '#43474f', margin: 0 }}>{creditScore.isColdStart ? '🌟 Cold Start Profile' : '✅ Existing Customer'}</p>
                                            </div>
                                        </div>
                                    </ReviewBlock>
                                )}
                                {bankConnected && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <span style={{ fontSize: 24 }}>🏦</span>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: '#15803d', margin: 0 }}>Bank Data Verified</p>
                                            <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>{bankSummary?.institution} · {bankSummary?.accounts?.length || 0} accounts · {bankSummary?.transactions?.length || 0} tx analyzed</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, paddingTop: 28, borderTop: '1px solid #f2f4f6' }}>
                                <button onClick={() => setStep('details')}
                                        style={{ background: 'none', border: '1.5px solid #e0e3e5', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#43474f', cursor: 'pointer' }}>
                                    ← Edit Details
                                </button>
                                <button onClick={handleGoToAgreement}
                                        style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 10, padding: '14px 40px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#002b5b')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#001736')}>
                                    🚀 Submit Application
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── Submitting ── */}
                    {step === 'submitting' && (
                        <div style={{ textAlign: 'center', padding: '64px 0' }}>
                            <div style={{ width: 48, height: 48, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }}/>
                            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                            <h2 style={{ fontWeight: 900, fontSize: 28, color: '#001736', marginBottom: 8 }}>Submitting Application…</h2>
                            <p style={{ fontSize: 15, color: '#43474f' }}>Redirecting you to upload your documents…</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: '#f7f9fb', borderRadius: 12, padding: '20px', border: '1px solid #e0e3e5' }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: '#001736', marginBottom: 16 }}>{title}</h3>
            {children}
        </div>
    )
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e0e3e5' }}>
            <span style={{ fontSize: 13, color: '#43474f' }}>{label}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#001736', fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '0.1em' : 'normal' }}>{value}</span>
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