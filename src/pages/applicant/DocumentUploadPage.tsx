// import { useState, useRef, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
// import { supabase } from '@/lib/supabaseClient'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// interface DocDef {
//     type: string; label: string; description: string
//     required: boolean; icon: string; accept: string
// }
// interface UploadedFile {
//     file: File; preview?: string; path?: string
//     uploading?: boolean; uploaded?: boolean; error?: string
// }
//
// const DOCUMENTS: DocDef[] = [
//     { type: 'aadhaar_front',  label: 'Aadhaar Card (Front)',        description: 'Front side of your Aadhaar card',            required: true,  icon: '🪪', accept: 'image/*,.pdf' },
//     { type: 'aadhaar_back',   label: 'Aadhaar Card (Back)',         description: 'Back side of your Aadhaar card',             required: true,  icon: '🪪', accept: 'image/*,.pdf' },
//     { type: 'pan_card',       label: 'PAN Card',                    description: 'Your Permanent Account Number card',         required: true,  icon: '💳', accept: 'image/*,.pdf' },
//     { type: 'salary_slip',    label: 'Salary Slip (Last 3 months)', description: 'Most recent 3 months salary slips',          required: true,  icon: '💰', accept: 'image/*,.pdf' },
//     { type: 'bank_statement', label: 'Bank Statement (6 months)',   description: 'Last 6 months bank statement',               required: true,  icon: '🏦', accept: 'image/*,.pdf' },
//     { type: 'itr',            label: 'ITR / Form 16',               description: 'Income Tax Return for last 2 years',         required: false, icon: '📊', accept: 'image/*,.pdf' },
//     { type: 'address_proof',  label: 'Address Proof',               description: 'Utility bill, rental agreement or passport', required: true,  icon: '🏠', accept: 'image/*,.pdf' },
//     { type: 'photo',          label: 'Passport Size Photo',         description: 'Recent passport size photograph',            required: true,  icon: '📷', accept: 'image/*' },
// ]
//
// export default function DocumentUploadPage() {
//     const { user, session } = useAuth()
//     const navigate          = useNavigate()
//     const location          = useLocation()
//     const appIdFromState    = location.state?.applicationId || ''
//
//     // ── FIX: always resolve a real applicationId ────────────────
//     // If applicant arrives here from the dashboard (no state), look up
//     // their latest non-draft application so documents get properly linked.
//     const [resolvedAppId, setResolvedAppId] = useState(appIdFromState)
//
//     useEffect(() => {
//         if (!appIdFromState && user?.id) {
//             supabase
//                 .from('loan_applications')
//                 .select('id')
//                 .eq('user_id', user.id)
//                 .not('status', 'eq', 'draft')
//                 .order('created_at', { ascending: false })
//                 .limit(1)
//                 .single()
//                 .then(({ data }) => { if (data?.id) setResolvedAppId(data.id) })
//         }
//     }, [user?.id])
//
//     const [uploads, setUploads]               = useState<Record<string, UploadedFile>>({})
//     const fileInputRefs                        = useRef<Record<string, HTMLInputElement | null>>({})
//     const [panNumber, setPanNumber]           = useState('')
//     const [aadhaarNumber, setAadhaarNumber]   = useState('')
//     const [panError, setPanError]             = useState('')
//     const [aadhaarError, setAadhaarError]     = useState('')
//     const [guarantorName, setGuarantorName]   = useState('')
//     const [guarantorMobile, setGuarantorMobile] = useState('')
//     const [guarantorRelation, setGuarantorRelation] = useState('')
//     const [otpSent, setOtpSent]               = useState(false)
//     const [otpCode, setOtpCode]               = useState('')
//     const [otpVerified, setOtpVerified]       = useState(false)
//     const [otpLoading, setOtpLoading]         = useState(false)
//     const [otpError, setOtpError]             = useState('')
//     const [resendCountdown, setResendCountdown] = useState(0)
//     const [submitting, setSubmitting]         = useState(false)
//     const [error, setError]                   = useState('')
//     const [success, setSuccess]               = useState(false)
//
//     const validatePAN = (pan: string) => {
//         const ok = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
//         setPanError(pan ? (ok ? '' : 'Invalid PAN. Format: ABCDE1234F') : 'PAN is required')
//         return ok && !!pan
//     }
//     const validateAadhaar = (aadhaar: string) => {
//         const cleaned = aadhaar.replace(/\s/g, '')
//         const ok = /^\d{12}$/.test(cleaned)
//         setAadhaarError(cleaned ? (ok ? '' : 'Aadhaar must be 12 digits') : 'Aadhaar is required')
//         return ok && !!cleaned
//     }
//
//     const handleFileSelect = async (docType: string, file: File) => {
//         if (file.size > 5 * 1024 * 1024) {
//             setUploads(prev => ({ ...prev, [docType]: { file, error: 'Max 5 MB allowed.' } }))
//             return
//         }
//         const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
//         setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: true } }))
//         try {
//             const filePath = `${user?.id}/${docType}_${Date.now()}_${file.name}`
//             const { error: uploadError } = await supabase.storage
//                 .from('loan-documents').upload(filePath, file, { upsert: true })
//             if (uploadError) throw uploadError
//
//             // ignoreDuplicates: false — ensures loan_application_id column gets
//             // updated even if a row already exists for this doc type
//             await supabase.from('loan_documents').upsert([{
//                 user_id:              user?.id,
//                 loan_application_id:  resolvedAppId || null,
//                 document_type:        docType,
//                 file_name:            file.name,
//                 file_path:            filePath,
//                 file_size:            file.size,
//             }], { onConflict: 'user_id,document_type', ignoreDuplicates: false })
//
//             setUploads(prev => ({ ...prev, [docType]: { file, preview, path: filePath, uploading: false, uploaded: true } }))
//         } catch (err: any) {
//             setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: false, error: err.message } }))
//         }
//     }
//
//     const handleSendOTP = async () => {
//         if (!/^\d{10}$/.test(guarantorMobile)) { setOtpError('Enter a valid 10-digit mobile number first'); return }
//         if (!guarantorName.trim()) { setOtpError('Enter guarantor name first'); return }
//         setOtpLoading(true); setOtpError('')
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/guarantor/send-otp`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
//                 body: JSON.stringify({ guarantorMobile, applicationId: resolvedAppId })
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setOtpSent(true)
//             // OTP never shown in UI — only in browser DevTools console
//             if (data.dev_otp) console.log(`%c[DEV] Guarantor OTP: ${data.dev_otp}`, 'color: orange; font-weight: bold')
//             setResendCountdown(60)
//             const timer = setInterval(() => {
//                 setResendCountdown(p => { if (p <= 1) { clearInterval(timer); return 0 } return p - 1 })
//             }, 1000)
//         } catch (err: any) {
//             setOtpError(err.message)
//         } finally { setOtpLoading(false) }
//     }
//
//     const handleVerifyOTP = async () => {
//         if (otpCode.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
//         setOtpLoading(true); setOtpError('')
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/guarantor/verify-otp`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
//                 body: JSON.stringify({ otp: otpCode, applicationId: resolvedAppId, guarantorMobile })
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setOtpVerified(true); setOtpError('')
//         } catch (err: any) {
//             setOtpError(err.message)
//         } finally { setOtpLoading(false) }
//     }
//
//     const required      = DOCUMENTS.filter(d => d.required)
//     const uploadedCount = required.filter(d => uploads[d.type]?.uploaded).length
//     const progress      = Math.round((uploadedCount / required.length) * 100)
//     const allReady      = uploadedCount >= required.length &&
//         panNumber.length === 10 && !panError &&
//         aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError &&
//         !!guarantorName.trim() && guarantorMobile.length === 10 && otpVerified
//
//     const handleSubmit = async () => {
//         setError('')
//         if (!validatePAN(panNumber.toUpperCase())) return
//         if (!validateAadhaar(aadhaarNumber)) return
//         if (uploadedCount < required.length) { setError(`Upload all required documents (${uploadedCount}/${required.length})`); return }
//         if (!guarantorName || !guarantorMobile) { setError('Guarantor information is required'); return }
//         if (!otpVerified) { setError('Please verify guarantor OTP before submitting'); return }
//         setSubmitting(true)
//         try {
//             if (resolvedAppId) {
//                 await supabase.from('loan_applications').update({
//                     pan_number:             panNumber.toUpperCase(),
//                     aadhaar_number:         aadhaarNumber.replace(/\s/g, ''),
//                     guarantor_name:         guarantorName,
//                     guarantor_mobile:       guarantorMobile,
//                     guarantor_relation:     guarantorRelation,
//                     guarantor_otp_verified: true,
//                     documents_submitted:    true,
//                     updated_at:             new Date().toISOString()
//                 }).eq('id', resolvedAppId)
//             }
//             // Always store in user metadata too as a fallback
//             await supabase.auth.updateUser({
//                 data: { pan_number: panNumber.toUpperCase(), aadhaar_number: aadhaarNumber.replace(/\s/g, '') }
//             })
//             setSuccess(true)
//         } catch (err: any) {
//             setError(err.message || 'Submission failed')
//         } finally { setSubmitting(false) }
//     }
//
//     if (success) {
//         return (
//             <div className="page-wrapper flex items-center justify-center p-8">
//                 <div className="w-full max-w-2xl bg-white rounded-3xl p-16 text-center border border-purple-100">
//                     <div className="text-7xl mb-8">✅</div>
//                     <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">Documents Submitted!</h2>
//                     <p className="text-gray-400 text-xl mb-10 leading-relaxed">
//                         Your documents are under review. Our officer will verify them within 24 hours.
//                     </p>
//                     <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-10">
//                         <p className="text-emerald-700 text-base font-semibold">
//                             📱 Guarantor <strong>{guarantorName}</strong> ({guarantorMobile}) verified via OTP ✅
//                         </p>
//                     </div>
//                     <button onClick={() => navigate('/loan-status', { state: { applicationId: resolvedAppId } })}
//                             className="btn-primary"
//                             style={{ padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
//                         Track Application Status →
//                     </button>
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
//                         <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold ml-2">Document Upload</span>
//                     </div>
//                     <div className="flex items-center gap-4">
//                         <div className="flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
//                             <div className="w-32 h-2 bg-purple-200 rounded-full overflow-hidden">
//                                 <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
//                             </div>
//                             <span className="text-base text-purple-700 font-semibold">{uploadedCount}/{required.length}</span>
//                         </div>
//                         <button onClick={() => navigate(-1)} className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">← Back</button>
//                     </div>
//                 </div>
//             </nav>
//
//             <main className="max-w-6xl mx-auto px-10 py-14">
//                 <div className="mb-12">
//                     <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Step 2 of 3</p>
//                     <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">Upload Documents</h1>
//                     <p className="text-gray-400 text-xl">Upload clear photos or scanned copies. All documents are encrypted and stored securely.</p>
//                     {!resolvedAppId && (
//                         <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 text-yellow-700 text-sm font-medium">
//                             ⚠️ No active application found.{' '}
//                             <button onClick={() => navigate('/apply-loan')} className="underline font-bold">Apply for a loan first</button>
//                             {' '}so your documents get linked correctly.
//                         </div>
//                     )}
//                 </div>
//
//                 {error && (
//                     <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-base flex items-center gap-3">
//                         <span>⚠️</span> {error}
//                     </div>
//                 )}
//
//                 <div className="grid lg:grid-cols-3 gap-8">
//                     <div className="lg:col-span-2 space-y-8">
//
//                         {/* Identity */}
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                             <h2 className="font-bold text-2xl text-gray-800 mb-6">🪪 Identity Numbers</h2>
//                             <div className="grid grid-cols-2 gap-6">
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">PAN Number *</label>
//                                     <input type="text" value={panNumber}
//                                            onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
//                                            placeholder="ABCDE1234F" maxLength={10}
//                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest uppercase"
//                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
//                                     {panError && <p className="text-red-500 text-sm mt-2">⚠️ {panError}</p>}
//                                     {panNumber.length === 10 && !panError && <p className="text-emerald-500 text-sm mt-2">✅ Valid PAN</p>}
//                                 </div>
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Aadhaar Number *</label>
//                                     <input type="text" value={aadhaarNumber}
//                                            onChange={e => {
//                                                const val = e.target.value.replace(/\D/g, '').slice(0, 12)
//                                                setAadhaarNumber(val.replace(/(\d{4})(?=\d)/g, '$1 '))
//                                                if (val.length === 12) validateAadhaar(val)
//                                            }}
//                                            placeholder="1234 5678 9012" maxLength={14}
//                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest"
//                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
//                                     {aadhaarError && <p className="text-red-500 text-sm mt-2">⚠️ {aadhaarError}</p>}
//                                     {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && <p className="text-emerald-500 text-sm mt-2">✅ Valid Aadhaar</p>}
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* Documents */}
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                             <h2 className="font-bold text-2xl text-gray-800 mb-2">📄 Required Documents</h2>
//                             <p className="text-gray-400 text-sm mb-6">
//                                 {uploadedCount < required.length
//                                     ? `${required.length - uploadedCount} required document${required.length - uploadedCount > 1 ? 's' : ''} remaining`
//                                     : '✅ All required documents uploaded'}
//                             </p>
//                             <div className="grid grid-cols-2 gap-5">
//                                 {DOCUMENTS.map(doc => {
//                                     const upload = uploads[doc.type]
//                                     return (
//                                         <div key={doc.type} className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
//                                             upload?.uploaded ? 'border-emerald-400 bg-emerald-50'
//                                                 : upload?.error  ? 'border-red-300 bg-red-50'
//                                                     : 'border-purple-100 bg-white hover:border-purple-300'}`}>
//                                             <input ref={el => fileInputRefs.current[doc.type] = el}
//                                                    type="file" accept={doc.accept} className="hidden"
//                                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(doc.type, f) }}/>
//                                             <button onClick={() => fileInputRefs.current[doc.type]?.click()}
//                                                     className="w-full p-5 text-left" disabled={upload?.uploading}>
//                                                 {upload?.preview && <img src={upload.preview} alt="preview" className="w-full h-24 object-cover rounded-xl mb-3"/>}
//                                                 <div className="flex items-start gap-3">
//                                                     <span className="text-2xl flex-shrink-0">{doc.icon}</span>
//                                                     <div className="min-w-0">
//                                                         <div className="flex items-center gap-2 mb-1">
//                                                             <p className="font-bold text-base text-gray-800 truncate">{doc.label}</p>
//                                                             {doc.required && <span className="text-red-500 text-sm flex-shrink-0">*</span>}
//                                                         </div>
//                                                         <p className="text-sm text-gray-400">{doc.description}</p>
//                                                         {upload?.uploading && <p className="text-purple-600 text-sm mt-2">⏳ Uploading…</p>}
//                                                         {upload?.uploaded  && <p className="text-emerald-600 text-sm mt-2 font-semibold">✅ {upload.file.name}</p>}
//                                                         {upload?.error     && <p className="text-red-500 text-sm mt-2">⚠️ {upload.error}</p>}
//                                                         {!upload           && <p className="text-purple-500 text-sm mt-2 font-medium">Click to upload →</p>}
//                                                     </div>
//                                                 </div>
//                                             </button>
//                                         </div>
//                                     )
//                                 })}
//                             </div>
//                         </div>
//
//                         {/* Guarantor */}
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                             <h2 className="font-bold text-2xl text-gray-800 mb-2">👥 Guarantor Verification</h2>
//                             <p className="text-gray-400 text-base mb-6">
//                                 A guarantor is required. We will verify their mobile number via OTP before submission.
//                             </p>
//                             <div className="space-y-5">
//                                 <div className="grid grid-cols-2 gap-5">
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Full Name *</label>
//                                         <input type="text" value={guarantorName} onChange={e => setGuarantorName(e.target.value)}
//                                                placeholder="Full name" disabled={otpVerified}
//                                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
//                                                style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
//                                     </div>
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Mobile *</label>
//                                         <div className="flex gap-2">
//                                             <input type="tel" value={guarantorMobile}
//                                                    onChange={e => { setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtpVerified(false) }}
//                                                    placeholder="10-digit number" maxLength={10} disabled={otpVerified}
//                                                    className="flex-1 bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono disabled:bg-gray-50 disabled:text-gray-400"
//                                                    style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
//                                             {!otpVerified && (
//                                                 <button onClick={handleSendOTP}
//                                                         disabled={otpLoading || guarantorMobile.length !== 10 || resendCountdown > 0}
//                                                         className="px-5 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all whitespace-nowrap text-base flex-shrink-0">
//                                                     {otpLoading ? <Spinner /> : otpSent ? (resendCountdown > 0 ? `${resendCountdown}s` : 'Resend') : 'Send OTP'}
//                                                 </button>
//                                             )}
//                                         </div>
//                                         {otpVerified && <p className="text-emerald-500 text-sm mt-2 font-semibold">✅ Guarantor verified via OTP</p>}
//                                     </div>
//                                 </div>
//
//                                 {otpSent && !otpVerified && (
//                                     <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
//                                         <p className="text-purple-700 font-semibold text-base mb-1">
//                                             📱 OTP sent to +91{guarantorMobile.slice(0, 2)}XXXXXXXX{guarantorMobile.slice(-2)}
//                                         </p>
//                                         <p className="text-purple-500 text-sm mb-4">Ask your guarantor to share the 6-digit code from the SMS</p>
//                                         <div className="flex gap-3">
//                                             <input type="text" inputMode="numeric" maxLength={6} value={otpCode}
//                                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
//                                                    placeholder="000000"
//                                                    className="flex-1 text-center text-3xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-5 py-4 outline-none focus:border-purple-500"
//                                                    style={{ letterSpacing: '0.4em' }}/>
//                                             <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6}
//                                                     className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all text-base">
//                                                 {otpLoading ? <Spinner /> : '✅ Verify'}
//                                             </button>
//                                         </div>
//                                         {otpError && <p className="text-red-500 text-sm mt-3">⚠️ {otpError}</p>}
//                                     </div>
//                                 )}
//
//                                 {otpVerified && (
//                                     <div className="bg-emerald-50 border border-emerald-300 rounded-2xl px-6 py-4 flex items-center gap-3">
//                                         <span className="text-2xl">✅</span>
//                                         <div>
//                                             <p className="text-emerald-800 font-bold text-base">Guarantor mobile verified!</p>
//                                             <p className="text-emerald-600 text-sm">+91{guarantorMobile} verified via OTP for this application.</p>
//                                         </div>
//                                     </div>
//                                 )}
//
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Relationship to Applicant</label>
//                                     <div className="grid grid-cols-4 gap-3">
//                                         {['Parent', 'Spouse', 'Sibling', 'Friend', 'Employer', 'Relative', 'Business Partner', 'Other'].map(rel => (
//                                             <button key={rel} type="button" onClick={() => setGuarantorRelation(rel)}
//                                                     className={`p-3 rounded-xl border-2 text-base font-semibold transition-all ${
//                                                         guarantorRelation === rel ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-purple-100 text-gray-600 hover:border-purple-300'}`}>
//                                                 {rel}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* Sidebar */}
//                     <div className="space-y-6">
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100 sticky top-24">
//                             <h3 className="font-bold text-xl text-gray-800 mb-6">Submission Checklist</h3>
//                             <div className="mb-6">
//                                 <div className="flex items-center justify-between mb-2">
//                                     <span className="text-base text-gray-500 font-medium">Documents</span>
//                                     <span className="font-bold text-purple-600">{uploadedCount}/{required.length}</span>
//                                 </div>
//                                 <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
//                                     <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
//                                 </div>
//                             </div>
//                             <div className="space-y-2.5 mb-6">
//                                 {DOCUMENTS.filter(d => d.required).map(doc => (
//                                     <div key={doc.type} className="flex items-center justify-between">
//                                         <span className="text-sm text-gray-600">{doc.icon} {doc.label.split('(')[0].trim()}</span>
//                                         <span className={`text-sm font-bold ${uploads[doc.type]?.uploaded ? 'text-emerald-500' : 'text-gray-300'}`}>
//                                             {uploads[doc.type]?.uploaded ? '✅' : '○'}
//                                         </span>
//                                     </div>
//                                 ))}
//                             </div>
//                             <div className="space-y-2.5 mb-8 pt-4 border-t border-purple-50">
//                                 <CheckItem label="🔢 PAN Number"     done={panNumber.length === 10 && !panError} />
//                                 <CheckItem label="🪪 Aadhaar"        done={aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError} />
//                                 <CheckItem label="👤 Guarantor info" done={!!guarantorName && guarantorMobile.length === 10} />
//                                 <CheckItem label="📱 Guarantor OTP"  done={otpVerified} highlight />
//                                 <CheckItem label="🔗 Linked to app"  done={!!resolvedAppId} />
//                             </div>
//                             <div className="bg-purple-50 rounded-2xl p-4 mb-6">
//                                 <p className="text-purple-700 text-sm font-semibold mb-1">🔒 Secure Upload</p>
//                                 <p className="text-purple-600 text-xs leading-relaxed">All documents are encrypted with AES-256 and stored in a private vault.</p>
//                             </div>
//                             <button onClick={handleSubmit} disabled={submitting || !allReady} className="btn-primary"
//                                     style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
//                                 {submitting          ? <span className="flex items-center gap-2"><Spinner /> Submitting…</span>
//                                     : !otpVerified       ? '🔒 Verify OTP First'
//                                         : uploadedCount < required.length ? `Upload ${required.length - uploadedCount} more`
//                                             : '📤 Submit Documents'}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </main>
//         </div>
//     )
// }
//
// function CheckItem({ label, done, highlight }: { label: string; done: boolean; highlight?: boolean }) {
//     return (
//         <div className="flex items-center justify-between">
//             <span className={`text-sm ${highlight && !done ? 'text-purple-600 font-semibold' : 'text-gray-600'}`}>{label}</span>
//             <span className={`text-sm font-bold ${done ? 'text-emerald-500' : highlight ? 'text-purple-400' : 'text-gray-300'}`}>
//                 {done ? '✅' : highlight ? '⟳' : '○'}
//             </span>
//         </div>
//     )
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

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface DocDef { type: string; label: string; description: string; required: boolean; icon: string; accept: string }
interface UploadedFile { file: File; preview?: string; path?: string; uploading?: boolean; uploaded?: boolean; error?: string }

const DOCUMENTS: DocDef[] = [
    { type: 'aadhaar_front',  label: 'Aadhaar Card (Front)',        description: 'Front side of your Aadhaar card',            required: true,  icon: '🪪', accept: 'image/*,.pdf' },
    { type: 'aadhaar_back',   label: 'Aadhaar Card (Back)',         description: 'Back side of your Aadhaar card',             required: true,  icon: '🪪', accept: 'image/*,.pdf' },
    { type: 'pan_card',       label: 'PAN Card',                    description: 'Your Permanent Account Number card',         required: true,  icon: '💳', accept: 'image/*,.pdf' },
    { type: 'salary_slip',    label: 'Salary Slip (Last 3 months)', description: 'Most recent 3 months salary slips',          required: true,  icon: '💰', accept: 'image/*,.pdf' },
    { type: 'bank_statement', label: 'Bank Statement (6 months)',   description: 'Last 6 months bank statement',               required: true,  icon: '🏦', accept: 'image/*,.pdf' },
    { type: 'itr',            label: 'ITR / Form 16',               description: 'Income Tax Return for last 2 years',         required: false, icon: '📊', accept: 'image/*,.pdf' },
    { type: 'address_proof',  label: 'Address Proof',               description: 'Utility bill, rental agreement or passport', required: true,  icon: '🏠', accept: 'image/*,.pdf' },
    { type: 'photo',          label: 'Passport Size Photo',         description: 'Recent passport size photograph',            required: true,  icon: '📷', accept: 'image/*' },
]

export default function DocumentUploadPage() {
    const { user, session } = useAuth()
    const navigate          = useNavigate()
    const location          = useLocation()
    const appIdFromState    = location.state?.applicationId || ''
    const [resolvedAppId, setResolvedAppId] = useState(appIdFromState)

    useEffect(() => {
        if (!appIdFromState && user?.id) {
            supabase.from('loan_applications').select('id').eq('user_id', user.id).not('status', 'eq', 'draft').order('created_at', { ascending: false }).limit(1).single()
                .then(({ data }) => { if (data?.id) setResolvedAppId(data.id) })
        }
    }, [user?.id])

    const [uploads, setUploads]                   = useState<Record<string, UploadedFile>>({})
    const fileInputRefs                            = useRef<Record<string, HTMLInputElement | null>>({})
    const [panNumber, setPanNumber]               = useState('')
    const [aadhaarNumber, setAadhaarNumber]       = useState('')
    const [panError, setPanError]                 = useState('')
    const [aadhaarError, setAadhaarError]         = useState('')
    const [guarantorName, setGuarantorName]       = useState('')
    const [guarantorMobile, setGuarantorMobile]   = useState('')
    const [guarantorRelation, setGuarantorRelation] = useState('')
    const [otpSent, setOtpSent]                   = useState(false)
    const [otpCode, setOtpCode]                   = useState('')
    const [otpVerified, setOtpVerified]           = useState(false)
    const [otpLoading, setOtpLoading]             = useState(false)
    const [otpError, setOtpError]                 = useState('')
    const [resendCountdown, setResendCountdown]   = useState(0)
    const [submitting, setSubmitting]             = useState(false)
    const [error, setError]                       = useState('')
    const [success, setSuccess]                   = useState(false)

    const validatePAN = (pan: string) => {
        const ok = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
        setPanError(pan ? (ok ? '' : 'Invalid PAN. Format: ABCDE1234F') : 'PAN is required')
        return ok && !!pan
    }
    const validateAadhaar = (aadhaar: string) => {
        const cleaned = aadhaar.replace(/\s/g, '')
        const ok = /^\d{12}$/.test(cleaned)
        setAadhaarError(cleaned ? (ok ? '' : 'Aadhaar must be 12 digits') : 'Aadhaar is required')
        return ok && !!cleaned
    }

    const handleFileSelect = async (docType: string, file: File) => {
        if (file.size > 5 * 1024 * 1024) { setUploads(prev => ({ ...prev, [docType]: { file, error: 'Max 5 MB allowed.' } })); return }
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: true } }))
        try {
            const filePath = `${user?.id}/${docType}_${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage.from('loan-documents').upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError
            await supabase.from('loan_documents').upsert([{ user_id: user?.id, loan_application_id: resolvedAppId || null, document_type: docType, file_name: file.name, file_path: filePath, file_size: file.size }], { onConflict: 'user_id,document_type', ignoreDuplicates: false })
            setUploads(prev => ({ ...prev, [docType]: { file, preview, path: filePath, uploading: false, uploaded: true } }))
        } catch (err: any) { setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: false, error: err.message } })) }
    }

    const handleSendOTP = async () => {
        if (!/^\d{10}$/.test(guarantorMobile)) { setOtpError('Enter a valid 10-digit mobile number first'); return }
        if (!guarantorName.trim()) { setOtpError('Enter guarantor name first'); return }
        setOtpLoading(true); setOtpError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/guarantor/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ guarantorMobile, applicationId: resolvedAppId }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setOtpSent(true)
            if (data.dev_otp) console.log(`%c[DEV] Guarantor OTP: ${data.dev_otp}`, 'color: orange; font-weight: bold')
            setResendCountdown(60)
            const timer = setInterval(() => { setResendCountdown(p => { if (p <= 1) { clearInterval(timer); return 0 } return p - 1 }) }, 1000)
        } catch (err: any) { setOtpError(err.message) }
        finally { setOtpLoading(false) }
    }

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
        setOtpLoading(true); setOtpError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/guarantor/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ otp: otpCode, applicationId: resolvedAppId, guarantorMobile }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setOtpVerified(true); setOtpError('')
        } catch (err: any) { setOtpError(err.message) }
        finally { setOtpLoading(false) }
    }

    const required      = DOCUMENTS.filter(d => d.required)
    const uploadedCount = required.filter(d => uploads[d.type]?.uploaded).length
    const progress      = Math.round((uploadedCount / required.length) * 100)
    const allReady      = uploadedCount >= required.length && panNumber.length === 10 && !panError && aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && !!guarantorName.trim() && guarantorMobile.length === 10 && otpVerified

    const handleSubmit = async () => {
        setError('')
        if (!validatePAN(panNumber.toUpperCase())) return
        if (!validateAadhaar(aadhaarNumber)) return
        if (uploadedCount < required.length) { setError(`Upload all required documents (${uploadedCount}/${required.length})`); return }
        if (!guarantorName || !guarantorMobile) { setError('Guarantor information is required'); return }
        if (!otpVerified) { setError('Please verify guarantor OTP before submitting'); return }
        setSubmitting(true)
        try {
            if (resolvedAppId) {
                await supabase.from('loan_applications').update({ pan_number: panNumber.toUpperCase(), aadhaar_number: aadhaarNumber.replace(/\s/g, ''), guarantor_name: guarantorName, guarantor_mobile: guarantorMobile, guarantor_relation: guarantorRelation, guarantor_otp_verified: true, documents_submitted: true, updated_at: new Date().toISOString() }).eq('id', resolvedAppId)
            }
            await supabase.auth.updateUser({ data: { pan_number: panNumber.toUpperCase(), aadhaar_number: aadhaarNumber.replace(/\s/g, '') } })
            setSuccess(true)
        } catch (err: any) { setError(err.message || 'Submission failed') }
        finally { setSubmitting(false) }
    }

    const inputStyle = { width: '100%', padding: '12px 16px', background: '#f2f4f6', border: '1.5px solid transparent', borderRadius: 8, fontSize: 15, color: '#191c1e', outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.2s' }
    const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#43474f', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }

    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Public Sans, Inter, sans-serif', padding: 24 }}>
                <div style={{ background: 'white', borderRadius: 20, padding: '64px 48px', textAlign: 'center', border: '1px solid #e0e3e5', maxWidth: 560, width: '100%' }}>
                    <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
                    <h2 style={{ fontWeight: 900, fontSize: 32, color: '#001736', marginBottom: 8, letterSpacing: '-1px' }}>Documents Submitted!</h2>
                    <p style={{ fontSize: 15, color: '#43474f', lineHeight: 1.7, marginBottom: 24 }}>Your documents are under review. Our officer will verify them within 24 hours.</p>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 20px', marginBottom: 28 }}>
                        <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>📱 Guarantor <strong>{guarantorName}</strong> ({guarantorMobile}) verified via OTP ✅</p>
                    </div>
                    <button onClick={() => navigate('/loan-status', { state: { applicationId: resolvedAppId } })}
                            style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                        Track Application Status →
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* Navbar */}
            <nav style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#eef4ff', color: '#0060ac', padding: '4px 12px', borderRadius: 100 }}>Document Upload</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f2f4f6', borderRadius: 100, padding: '6px 16px' }}>
                            <div style={{ width: 80, height: 6, background: '#e0e3e5', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: '#0060ac', borderRadius: 100, transition: 'all 0.5s' }}/>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#001736' }}>{uploadedCount}/{required.length}</span>
                        </div>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f' }}>← Back</button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
                <div style={{ marginBottom: 32 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Step 2 of 3</p>
                    <h1 style={{ fontWeight: 900, fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#001736', letterSpacing: '-1px', marginBottom: 6 }}>Upload Documents</h1>
                    <p style={{ fontSize: 15, color: '#43474f' }}>Upload clear photos or scanned copies. All documents are encrypted and stored securely.</p>
                    {!resolvedAppId && (
                        <div style={{ marginTop: 12, background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#a16207' }}>
                            ⚠️ No active application found.{' '}
                            <button onClick={() => navigate('/apply-loan')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0060ac', fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}>Apply for a loan first</button>
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 24, fontSize: 14 }}>⚠️ {error}</div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

                    {/* Left */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Identity numbers */}
                        <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#001736', marginBottom: 20 }}>🪪 Identity Numbers</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label style={labelStyle}>PAN Number *</label>
                                    <input type="text" value={panNumber}
                                           onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
                                           placeholder="ABCDE1234F" maxLength={10}
                                           style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                                           onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                           onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                    {panError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>⚠️ {panError}</p>}
                                    {panNumber.length === 10 && !panError && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6 }}>✅ Valid PAN</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Aadhaar Number *</label>
                                    <input type="text" value={aadhaarNumber}
                                           onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 12); setAadhaarNumber(val.replace(/(\d{4})(?=\d)/g, '$1 ')); if (val.length === 12) validateAadhaar(val) }}
                                           placeholder="1234 5678 9012" maxLength={14}
                                           style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em' }}
                                           onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' }}
                                           onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                    {aadhaarError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>⚠️ {aadhaarError}</p>}
                                    {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6 }}>✅ Valid Aadhaar</p>}
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#001736', marginBottom: 6 }}>📄 Required Documents</h2>
                            <p style={{ fontSize: 13, color: '#747780', marginBottom: 20 }}>
                                {uploadedCount < required.length ? `${required.length - uploadedCount} required document${required.length - uploadedCount > 1 ? 's' : ''} remaining` : '✅ All required documents uploaded'}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {DOCUMENTS.map(doc => {
                                    const upload = uploads[doc.type]
                                    return (
                                        <div key={doc.type} style={{ borderRadius: 10, border: `1.5px solid ${upload?.uploaded ? '#bbf7d0' : upload?.error ? '#fecaca' : '#e0e3e5'}`, background: upload?.uploaded ? '#f0fdf4' : upload?.error ? '#fef2f2' : 'white', overflow: 'hidden', transition: 'all 0.2s' }}>
                                            <input ref={el => fileInputRefs.current[doc.type] = el} type="file" accept={doc.accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(doc.type, f) }}/>
                                            <button onClick={() => fileInputRefs.current[doc.type]?.click()} disabled={upload?.uploading}
                                                    style={{ width: '100%', padding: '16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                {upload?.preview && <img src={upload.preview} alt="preview" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}/>}
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                    <span style={{ fontSize: 20, flexShrink: 0 }}>{doc.icon}</span>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                                            <p style={{ fontWeight: 700, fontSize: 13, color: '#001736', margin: 0 }}>{doc.label}</p>
                                                            {doc.required && <span style={{ color: '#ef4444', fontSize: 12 }}>*</span>}
                                                        </div>
                                                        <p style={{ fontSize: 11, color: '#747780', margin: 0 }}>{doc.description}</p>
                                                        {upload?.uploading && <p style={{ fontSize: 11, color: '#0060ac', marginTop: 4 }}>⏳ Uploading…</p>}
                                                        {upload?.uploaded  && <p style={{ fontSize: 11, color: '#15803d', marginTop: 4, fontWeight: 600 }}>✅ {upload.file.name}</p>}
                                                        {upload?.error     && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>⚠️ {upload.error}</p>}
                                                        {!upload           && <p style={{ fontSize: 11, color: '#0060ac', marginTop: 4, fontWeight: 600 }}>Click to upload →</p>}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Guarantor */}
                        <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                            <h2 style={{ fontWeight: 800, fontSize: 16, color: '#001736', marginBottom: 6 }}>👥 Guarantor Verification</h2>
                            <p style={{ fontSize: 13, color: '#747780', marginBottom: 20 }}>A guarantor is required. We will verify their mobile number via OTP before submission.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={labelStyle}>Guarantor Full Name *</label>
                                        <input type="text" value={guarantorName} onChange={e => setGuarantorName(e.target.value)} placeholder="Full name" disabled={otpVerified}
                                               style={{ ...inputStyle, opacity: otpVerified ? 0.6 : 1 }}
                                               onFocus={e => { if (!otpVerified) { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' } }}
                                               onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Guarantor Mobile *</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input type="tel" value={guarantorMobile}
                                                   onChange={e => { setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtpVerified(false) }}
                                                   placeholder="10-digit" maxLength={10} disabled={otpVerified}
                                                   style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', opacity: otpVerified ? 0.6 : 1 }}
                                                   onFocus={e => { if (!otpVerified) { e.target.style.background = 'white'; e.target.style.borderColor = '#0060ac' } }}
                                                   onBlur={e => { e.target.style.background = '#f2f4f6'; e.target.style.borderColor = 'transparent' }}/>
                                            {!otpVerified && (
                                                <button onClick={handleSendOTP} disabled={otpLoading || guarantorMobile.length !== 10 || resendCountdown > 0}
                                                        style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: (otpLoading || guarantorMobile.length !== 10 || resendCountdown > 0) ? 0.5 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    {otpLoading ? <Spinner/> : otpSent ? (resendCountdown > 0 ? `${resendCountdown}s` : 'Resend') : 'Send OTP'}
                                                </button>
                                            )}
                                        </div>
                                        {otpVerified && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6, fontWeight: 600 }}>✅ Guarantor verified via OTP</p>}
                                    </div>
                                </div>

                                {otpSent && !otpVerified && (
                                    <div style={{ background: '#eef4ff', border: '1px solid #a4c9ff', borderRadius: 10, padding: '16px 20px' }}>
                                        <p style={{ fontSize: 13, color: '#0060ac', fontWeight: 600, marginBottom: 4 }}>
                                            📱 OTP sent to +91{guarantorMobile.slice(0, 2)}XXXXXXXX{guarantorMobile.slice(-2)}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#43474f', marginBottom: 12 }}>Ask your guarantor to share the 6-digit code from the SMS</p>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <input type="text" inputMode="numeric" maxLength={6} value={otpCode}
                                                   onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                   onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                                                   placeholder="000000"
                                                   style={{ flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: '0.4em', background: 'white', border: '1.5px solid #a4c9ff', borderRadius: 8, padding: '12px', outline: 'none', fontFamily: 'monospace' }}/>
                                            <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6}
                                                    style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '0 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (otpLoading || otpCode.length !== 6) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {otpLoading ? <Spinner/> : '✅ Verify'}
                                            </button>
                                        </div>
                                        {otpError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>⚠️ {otpError}</p>}
                                    </div>
                                )}

                                {otpVerified && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 20px', display: 'flex', gap: 12 }}>
                                        <span style={{ fontSize: 20 }}>✅</span>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 14, color: '#15803d', margin: 0 }}>Guarantor mobile verified!</p>
                                            <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>+91{guarantorMobile} verified via OTP for this application.</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={labelStyle}>Relationship to Applicant</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {['Parent', 'Spouse', 'Sibling', 'Friend', 'Employer', 'Relative', 'Business Partner', 'Other'].map(rel => (
                                            <button key={rel} type="button" onClick={() => setGuarantorRelation(rel)}
                                                    style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${guarantorRelation === rel ? '#0060ac' : '#e0e3e5'}`, background: guarantorRelation === rel ? '#eef4ff' : 'white', color: guarantorRelation === rel ? '#0060ac' : '#43474f', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                                                {rel}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div>
                        <div style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #e0e3e5', position: 'sticky', top: 80 }}>
                            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#001736', marginBottom: 16 }}>Checklist</h3>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: '#747780' }}>Documents</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0060ac' }}>{uploadedCount}/{required.length}</span>
                                </div>
                                <div style={{ height: 6, background: '#f2f4f6', borderRadius: 100, overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: '#0060ac', borderRadius: 100, transition: 'all 0.5s' }}/>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                {DOCUMENTS.filter(d => d.required).map(doc => (
                                    <div key={doc.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: '#43474f' }}>{doc.icon} {doc.label.split('(')[0].trim()}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: uploads[doc.type]?.uploaded ? '#22c55e' : '#c4c6d0' }}>
                                            {uploads[doc.type]?.uploaded ? '✅' : '○'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, paddingTop: 12, borderTop: '1px solid #f2f4f6' }}>
                                {[
                                    { label: '🔢 PAN Number',     done: panNumber.length === 10 && !panError },
                                    { label: '🪪 Aadhaar',        done: aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError },
                                    { label: '👤 Guarantor info', done: !!guarantorName && guarantorMobile.length === 10 },
                                    { label: '📱 Guarantor OTP',  done: otpVerified, highlight: true },
                                    { label: '🔗 Linked to app',  done: !!resolvedAppId },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: item.highlight && !item.done ? '#0060ac' : '#43474f', fontWeight: item.highlight && !item.done ? 700 : 400 }}>{item.label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: item.done ? '#22c55e' : item.highlight ? '#0060ac' : '#c4c6d0' }}>
                                            {item.done ? '✅' : item.highlight ? '⟳' : '○'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ background: '#eef4ff', borderRadius: 8, padding: '12px', marginBottom: 16 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#0060ac', marginBottom: 2 }}>🔒 Secure Upload</p>
                                <p style={{ fontSize: 11, color: '#0060ac', lineHeight: 1.5 }}>All documents are encrypted with AES-256 and stored in a private vault.</p>
                            </div>

                            <button onClick={handleSubmit} disabled={submitting || !allReady}
                                    style={{ width: '100%', padding: '13px', background: allReady ? '#001736' : '#e0e3e5', color: allReady ? 'white' : '#747780', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: allReady ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {submitting          ? <><Spinner/> Submitting…</>
                                    : !otpVerified       ? '🔒 Verify OTP First'
                                        : uploadedCount < required.length ? `Upload ${required.length - uploadedCount} more`
                                            : '📤 Submit Documents'}
                            </button>
                        </div>
                    </div>
                </div>
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