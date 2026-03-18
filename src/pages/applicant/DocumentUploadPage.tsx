// // // import { useState, useRef } from 'react'
// // // import { useNavigate, useLocation } from 'react-router-dom'
// // // import { useAuth } from '@/context/AuthContext'
// // // import { supabase } from '@/lib/supabaseClient'
// // //
// // // interface Document {
// // //     type: string
// // //     label: string
// // //     description: string
// // //     required: boolean
// // //     icon: string
// // //     accept: string
// // // }
// // //
// // // interface UploadedFile {
// // //     file: File
// // //     preview?: string
// // //     path?: string
// // //     uploading?: boolean
// // //     uploaded?: boolean
// // //     error?: string
// // // }
// // //
// // // const DOCUMENTS: Document[] = [
// // //     // Identity
// // //     { type: 'aadhaar_front', label: 'Aadhaar Card (Front)', description: 'Front side of your Aadhaar card', required: true, icon: '🪪', accept: 'image/*,.pdf' },
// // //     { type: 'aadhaar_back', label: 'Aadhaar Card (Back)', description: 'Back side of your Aadhaar card', required: true, icon: '🪪', accept: 'image/*,.pdf' },
// // //     { type: 'pan_card', label: 'PAN Card', description: 'Your Permanent Account Number card', required: true, icon: '💳', accept: 'image/*,.pdf' },
// // //
// // //     // Income
// // //     { type: 'salary_slip', label: 'Salary Slip (Last 3 months)', description: 'Most recent 3 months salary slips', required: true, icon: '💰', accept: 'image/*,.pdf' },
// // //     { type: 'bank_statement', label: 'Bank Statement (6 months)', description: 'Last 6 months bank statement', required: true, icon: '🏦', accept: 'image/*,.pdf' },
// // //     { type: 'itr', label: 'ITR / Form 16', description: 'Income Tax Return for last 2 years', required: false, icon: '📊', accept: 'image/*,.pdf' },
// // //
// // //     // Address
// // //     { type: 'address_proof', label: 'Address Proof', description: 'Utility bill, rental agreement or passport', required: true, icon: '🏠', accept: 'image/*,.pdf' },
// // //
// // //     // Photo
// // //     { type: 'photo', label: 'Passport Size Photo', description: 'Recent passport size photograph', required: true, icon: '📷', accept: 'image/*' },
// // // ]
// // //
// // // export default function DocumentUploadPage() {
// // //     const { user, session } = useAuth()
// // //     const navigate = useNavigate()
// // //     const location = useLocation()
// // //     const applicationId = location.state?.applicationId || ''
// // //
// // //     const [uploads, setUploads] = useState<Record<string, UploadedFile>>({})
// // //     const [panNumber, setPanNumber] = useState('')
// // //     const [aadhaarNumber, setAadhaarNumber] = useState('')
// // //     const [guarantorName, setGuarantorName] = useState('')
// // //     const [guarantorMobile, setGuarantorMobile] = useState('')
// // //     const [guarantorRelation, setGuarantorRelation] = useState('')
// // //     const [submitting, setSubmitting] = useState(false)
// // //     const [error, setError] = useState('')
// // //     const [success, setSuccess] = useState(false)
// // //     const [panError, setPanError] = useState('')
// // //     const [aadhaarError, setAadhaarError] = useState('')
// // //
// // //     const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
// // //
// // //     const validatePAN = (pan: string) => {
// // //         const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
// // //         if (!pan) { setPanError('PAN number is required'); return false }
// // //         if (!panRegex.test(pan.toUpperCase())) {
// // //             setPanError('Invalid PAN format. Should be like ABCDE1234F')
// // //             return false
// // //         }
// // //         setPanError('')
// // //         return true
// // //     }
// // //
// // //     const validateAadhaar = (aadhaar: string) => {
// // //         const cleaned = aadhaar.replace(/\s/g, '')
// // //         if (!cleaned) { setAadhaarError('Aadhaar number is required'); return false }
// // //         if (!/^\d{12}$/.test(cleaned)) {
// // //             setAadhaarError('Aadhaar must be exactly 12 digits')
// // //             return false
// // //         }
// // //         setAadhaarError('')
// // //         return true
// // //     }
// // //
// // //     const handleFileSelect = async (docType: string, file: File) => {
// // //         // Validate file size (max 5MB)
// // //         if (file.size > 5 * 1024 * 1024) {
// // //             setUploads(prev => ({
// // //                 ...prev,
// // //                 [docType]: { file, error: 'File too large. Maximum 5MB allowed.' }
// // //             }))
// // //             return
// // //         }
// // //
// // //         // Preview for images
// // //         let preview = ''
// // //         if (file.type.startsWith('image/')) {
// // //             preview = URL.createObjectURL(file)
// // //         }
// // //
// // //         setUploads(prev => ({
// // //             ...prev,
// // //             [docType]: { file, preview, uploading: true }
// // //         }))
// // //
// // //         // Upload to Supabase Storage
// // //         try {
// // //             const filePath = `${user?.id}/${docType}_${Date.now()}_${file.name}`
// // //             const { error: uploadError } = await supabase.storage
// // //                 .from('loan-documents')
// // //                 .upload(filePath, file, { upsert: true })
// // //
// // //             if (uploadError) throw uploadError
// // //
// // //             // Save document record to DB
// // //             await supabase.from('loan_documents').upsert([{
// // //                 user_id: user?.id,
// // //                 loan_application_id: applicationId || null,
// // //                 document_type: docType,
// // //                 file_name: file.name,
// // //                 file_path: filePath,
// // //                 file_size: file.size,
// // //             }], { onConflict: 'user_id,document_type' })
// // //
// // //             setUploads(prev => ({
// // //                 ...prev,
// // //                 [docType]: { file, preview, path: filePath, uploading: false, uploaded: true }
// // //             }))
// // //         } catch (err: any) {
// // //             setUploads(prev => ({
// // //                 ...prev,
// // //                 [docType]: { file, preview, uploading: false, error: err.message }
// // //             }))
// // //         }
// // //     }
// // //
// // //     const getCompletionStatus = () => {
// // //         const required = DOCUMENTS.filter(d => d.required)
// // //         const uploaded = required.filter(d => uploads[d.type]?.uploaded)
// // //         return { total: required.length, uploaded: uploaded.length }
// // //     }
// // //
// // //     const handleSubmit = async () => {
// // //         setError('')
// // //
// // //         // Validate PAN and Aadhaar
// // //         const panValid = validatePAN(panNumber.toUpperCase())
// // //         const aadhaarValid = validateAadhaar(aadhaarNumber)
// // //         if (!panValid || !aadhaarValid) return
// // //
// // //         // Check required docs
// // //         const { total, uploaded } = getCompletionStatus()
// // //         if (uploaded < total) {
// // //             setError(`Please upload all required documents (${uploaded}/${total} uploaded)`)
// // //             return
// // //         }
// // //
// // //         // Check guarantor
// // //         if (!guarantorName || !guarantorMobile) {
// // //             setError('Guarantor information is required')
// // //             return
// // //         }
// // //
// // //         if (!/^\d{10}$/.test(guarantorMobile)) {
// // //             setError('Guarantor mobile must be 10 digits')
// // //             return
// // //         }
// // //
// // //         setSubmitting(true)
// // //
// // //         try {
// // //             // Update loan application with document info
// // //             if (applicationId) {
// // //                 await supabase
// // //                     .from('loan_applications')
// // //                     .update({
// // //                         pan_number: panNumber.toUpperCase(),
// // //                         aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
// // //                         guarantor_name: guarantorName,
// // //                         guarantor_mobile: guarantorMobile,
// // //                         guarantor_relation: guarantorRelation,
// // //                         documents_submitted: true,
// // //                         updated_at: new Date().toISOString()
// // //                     })
// // //                     .eq('id', applicationId)
// // //             } else {
// // //                 // Update user metadata
// // //                 await supabase.auth.updateUser({
// // //                     data: {
// // //                         pan_number: panNumber.toUpperCase(),
// // //                         aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
// // //                     }
// // //                 })
// // //             }
// // //
// // //             setSuccess(true)
// // //         } catch (err: any) {
// // //             setError(err.message || 'Submission failed')
// // //         } finally {
// // //             setSubmitting(false)
// // //         }
// // //     }
// // //
// // //     const { total, uploaded } = getCompletionStatus()
// // //     const progress = Math.round((uploaded / total) * 100)
// // //
// // //     if (success) {
// // //         return (
// // //             <div className="page-wrapper flex items-center justify-center p-8">
// // //                 <div className="w-full max-w-2xl bg-white rounded-3xl p-16 text-center border border-purple-100">
// // //                     <div className="text-7xl mb-8">✅</div>
// // //                     <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">
// // //                         Documents Submitted!
// // //                     </h2>
// // //                     <p className="text-gray-400 text-xl mb-10 leading-relaxed">
// // //                         Your documents are under review. Our officer will verify them within 24 hours.
// // //                     </p>
// // //                     <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-10">
// // //                         <p className="text-purple-700 text-base font-semibold">
// // //                             📱 Your guarantor <strong>{guarantorName}</strong> ({guarantorMobile}) will be contacted for verification.
// // //                         </p>
// // //                     </div>
// // //                     <button onClick={() => navigate('/loan-status')}
// // //                             className="btn-primary"
// // //                             style={{ padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
// // //                         Track Application Status →
// // //                     </button>
// // //                 </div>
// // //             </div>
// // //         )
// // //     }
// // //
// // //     return (
// // //         <div className="page-wrapper">
// // //             {/* Navbar */}
// // //             <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
// // //                 <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
// // //                     <div className="flex items-center gap-4">
// // //                         <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
// // //                             <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
// // //                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
// // //                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
// // //                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
// // //                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
// // //                             </svg>
// // //                         </div>
// // //                         <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
// // //                         <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold ml-2">
// // //                             Document Upload
// // //                         </span>
// // //                     </div>
// // //                     <div className="flex items-center gap-4">
// // //                         {/* Progress */}
// // //                         <div className="flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
// // //                             <div className="w-32 h-2 bg-purple-200 rounded-full overflow-hidden">
// // //                                 <div className="h-full bg-purple-600 rounded-full transition-all duration-500"
// // //                                      style={{ width: `${progress}%` }} />
// // //                             </div>
// // //                             <span className="text-base text-purple-700 font-semibold">{uploaded}/{total}</span>
// // //                         </div>
// // //                         <button onClick={() => navigate('/loan-status')}
// // //                                 className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">
// // //                             ← Back
// // //                         </button>
// // //                     </div>
// // //                 </div>
// // //             </nav>
// // //
// // //             <main className="max-w-6xl mx-auto px-10 py-14">
// // //
// // //                 {/* Header */}
// // //                 <div className="mb-12">
// // //                     <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">
// // //                         Step 2 of 3
// // //                     </p>
// // //                     <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">
// // //                         Upload Documents
// // //                     </h1>
// // //                     <p className="text-gray-400 text-xl">
// // //                         Upload clear photos or scanned copies. All documents are encrypted and stored securely.
// // //                     </p>
// // //                 </div>
// // //
// // //                 {error && (
// // //                     <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-base flex items-center gap-3">
// // //                         <span>⚠️</span> {error}
// // //                     </div>
// // //                 )}
// // //
// // //                 <div className="grid lg:grid-cols-3 gap-8">
// // //
// // //                     {/* Left — Documents */}
// // //                     <div className="lg:col-span-2 space-y-8">
// // //
// // //                         {/* PAN + Aadhaar Numbers */}
// // //                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
// // //                             <h2 className="font-bold text-2xl text-gray-800 mb-6">
// // //                                 🪪 Identity Numbers
// // //                             </h2>
// // //                             <div className="grid grid-cols-2 gap-6">
// // //                                 <div>
// // //                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
// // //                                         PAN Number *
// // //                                     </label>
// // //                                     <input
// // //                                         type="text"
// // //                                         value={panNumber}
// // //                                         onChange={e => {
// // //                                             setPanNumber(e.target.value.toUpperCase())
// // //                                             if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase())
// // //                                         }}
// // //                                         placeholder="ABCDE1234F"
// // //                                         maxLength={10}
// // //                                         className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest uppercase"
// // //                                         style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
// // //                                     />
// // //                                     {panError && <p className="text-red-500 text-sm mt-2">⚠️ {panError}</p>}
// // //                                     {panNumber.length === 10 && !panError && (
// // //                                         <p className="text-emerald-500 text-sm mt-2">✅ Valid PAN format</p>
// // //                                     )}
// // //                                 </div>
// // //                                 <div>
// // //                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
// // //                                         Aadhaar Number *
// // //                                     </label>
// // //                                     <input
// // //                                         type="text"
// // //                                         value={aadhaarNumber}
// // //                                         onChange={e => {
// // //                                             const val = e.target.value.replace(/\D/g, '').slice(0, 12)
// // //                                             const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ')
// // //                                             setAadhaarNumber(formatted)
// // //                                             if (val.length === 12) validateAadhaar(val)
// // //                                         }}
// // //                                         placeholder="1234 5678 9012"
// // //                                         maxLength={14}
// // //                                         className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest"
// // //                                         style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
// // //                                     />
// // //                                     {aadhaarError && <p className="text-red-500 text-sm mt-2">⚠️ {aadhaarError}</p>}
// // //                                     {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && (
// // //                                         <p className="text-emerald-500 text-sm mt-2">✅ Valid Aadhaar format</p>
// // //                                     )}
// // //                                 </div>
// // //                             </div>
// // //                         </div>
// // //
// // //                         {/* Document uploads */}
// // //                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
// // //                             <h2 className="font-bold text-2xl text-gray-800 mb-6">
// // //                                 📄 Required Documents
// // //                             </h2>
// // //                             <div className="grid grid-cols-2 gap-5">
// // //                                 {DOCUMENTS.map(doc => {
// // //                                     const upload = uploads[doc.type]
// // //                                     return (
// // //                                         <div key={doc.type}
// // //                                              className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
// // //                                                  upload?.uploaded
// // //                                                      ? 'border-emerald-400 bg-emerald-50'
// // //                                                      : upload?.error
// // //                                                          ? 'border-red-300 bg-red-50'
// // //                                                          : 'border-purple-100 bg-white hover:border-purple-300'
// // //                                              }`}>
// // //
// // //                                             <input
// // //                                                 ref={el => fileInputRefs.current[doc.type] = el}
// // //                                                 type="file"
// // //                                                 accept={doc.accept}
// // //                                                 className="hidden"
// // //                                                 onChange={e => {
// // //                                                     const file = e.target.files?.[0]
// // //                                                     if (file) handleFileSelect(doc.type, file)
// // //                                                 }}
// // //                                             />
// // //
// // //                                             <button
// // //                                                 onClick={() => fileInputRefs.current[doc.type]?.click()}
// // //                                                 className="w-full p-5 text-left"
// // //                                                 disabled={upload?.uploading}>
// // //
// // //                                                 {/* Preview for images */}
// // //                                                 {upload?.preview && (
// // //                                                     <img src={upload.preview} alt="preview"
// // //                                                          className="w-full h-24 object-cover rounded-xl mb-3" />
// // //                                                 )}
// // //
// // //                                                 <div className="flex items-start gap-3">
// // //                                                     <span className="text-2xl flex-shrink-0">{doc.icon}</span>
// // //                                                     <div className="min-w-0">
// // //                                                         <div className="flex items-center gap-2 mb-1">
// // //                                                             <p className="font-bold text-base text-gray-800 truncate">
// // //                                                                 {doc.label}
// // //                                                             </p>
// // //                                                             {doc.required && (
// // //                                                                 <span className="text-red-500 text-sm flex-shrink-0">*</span>
// // //                                                             )}
// // //                                                         </div>
// // //                                                         <p className="text-sm text-gray-400">{doc.description}</p>
// // //
// // //                                                         {upload?.uploading && (
// // //                                                             <p className="text-purple-600 text-sm mt-2 flex items-center gap-1">
// // //                                                                 <span className="animate-spin">⏳</span> Uploading…
// // //                                                             </p>
// // //                                                         )}
// // //                                                         {upload?.uploaded && (
// // //                                                             <p className="text-emerald-600 text-sm mt-2 font-semibold">
// // //                                                                 ✅ {upload.file.name}
// // //                                                             </p>
// // //                                                         )}
// // //                                                         {upload?.error && (
// // //                                                             <p className="text-red-500 text-sm mt-2">⚠️ {upload.error}</p>
// // //                                                         )}
// // //                                                         {!upload && (
// // //                                                             <p className="text-purple-500 text-sm mt-2 font-medium">
// // //                                                                 Click to upload →
// // //                                                             </p>
// // //                                                         )}
// // //                                                     </div>
// // //                                                 </div>
// // //                                             </button>
// // //                                         </div>
// // //                                     )
// // //                                 })}
// // //                             </div>
// // //                         </div>
// // //
// // //                         {/* Guarantor */}
// // //                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
// // //                             <h2 className="font-bold text-2xl text-gray-800 mb-2">
// // //                                 👥 Guarantor Information
// // //                             </h2>
// // //                             <p className="text-gray-400 text-base mb-6">
// // //                                 A guarantor is required for loan approval. They will be contacted for verification.
// // //                             </p>
// // //                             <div className="space-y-5">
// // //                                 <div className="grid grid-cols-2 gap-5">
// // //                                     <div>
// // //                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
// // //                                             Guarantor Full Name *
// // //                                         </label>
// // //                                         <input
// // //                                             type="text"
// // //                                             value={guarantorName}
// // //                                             onChange={e => setGuarantorName(e.target.value)}
// // //                                             placeholder="Full name of guarantor"
// // //                                             className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400"
// // //                                             style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
// // //                                         />
// // //                                     </div>
// // //                                     <div>
// // //                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
// // //                                             Guarantor Mobile *
// // //                                         </label>
// // //                                         <input
// // //                                             type="tel"
// // //                                             value={guarantorMobile}
// // //                                             onChange={e => setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
// // //                                             placeholder="10-digit mobile number"
// // //                                             maxLength={10}
// // //                                             className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono"
// // //                                             style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}
// // //                                         />
// // //                                         {guarantorMobile.length === 10 && (
// // //                                             <p className="text-emerald-500 text-sm mt-2">✅ Valid mobile number</p>
// // //                                         )}
// // //                                     </div>
// // //                                 </div>
// // //                                 <div>
// // //                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">
// // //                                         Relationship to Applicant
// // //                                     </label>
// // //                                     <div className="grid grid-cols-4 gap-3">
// // //                                         {['Parent', 'Spouse', 'Sibling', 'Friend', 'Employer', 'Relative', 'Business Partner', 'Other'].map(rel => (
// // //                                             <button
// // //                                                 key={rel}
// // //                                                 type="button"
// // //                                                 onClick={() => setGuarantorRelation(rel)}
// // //                                                 className={`p-3 rounded-xl border-2 text-base font-semibold transition-all ${
// // //                                                     guarantorRelation === rel
// // //                                                         ? 'border-purple-500 bg-purple-50 text-purple-700'
// // //                                                         : 'border-purple-100 text-gray-600 hover:border-purple-300'
// // //                                                 }`}>
// // //                                                 {rel}
// // //                                             </button>
// // //                                         ))}
// // //                                     </div>
// // //                                 </div>
// // //                             </div>
// // //                         </div>
// // //                     </div>
// // //
// // //                     {/* Right — Summary + Submit */}
// // //                     <div className="space-y-6">
// // //
// // //                         {/* Progress card */}
// // //                         <div className="bg-white rounded-3xl p-8 border border-purple-100 sticky top-24">
// // //                             <h3 className="font-bold text-xl text-gray-800 mb-6">Upload Progress</h3>
// // //
// // //                             <div className="mb-6">
// // //                                 <div className="flex items-center justify-between mb-2">
// // //                                     <span className="text-base text-gray-500 font-medium">Required documents</span>
// // //                                     <span className="font-bold text-purple-600">{uploaded}/{total}</span>
// // //                                 </div>
// // //                                 <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
// // //                                     <div className="h-full bg-purple-600 rounded-full transition-all duration-500"
// // //                                          style={{ width: `${progress}%` }} />
// // //                                 </div>
// // //                             </div>
// // //
// // //                             <div className="space-y-3 mb-8">
// // //                                 {DOCUMENTS.filter(d => d.required).map(doc => (
// // //                                     <div key={doc.type} className="flex items-center justify-between">
// // //                                         <span className="text-sm text-gray-600">{doc.icon} {doc.label.split('(')[0].trim()}</span>
// // //                                         <span className={`text-sm font-bold ${
// // //                                             uploads[doc.type]?.uploaded ? 'text-emerald-500' : 'text-gray-300'
// // //                                         }`}>
// // //                                             {uploads[doc.type]?.uploaded ? '✅' : '○'}
// // //                                         </span>
// // //                                     </div>
// // //                                 ))}
// // //                                 <div className="flex items-center justify-between pt-2 border-t border-purple-50">
// // //                                     <span className="text-sm text-gray-600">🔢 PAN Number</span>
// // //                                     <span className={`text-sm font-bold ${panNumber.length === 10 && !panError ? 'text-emerald-500' : 'text-gray-300'}`}>
// // //                                         {panNumber.length === 10 && !panError ? '✅' : '○'}
// // //                                     </span>
// // //                                 </div>
// // //                                 <div className="flex items-center justify-between">
// // //                                     <span className="text-sm text-gray-600">🪪 Aadhaar</span>
// // //                                     <span className={`text-sm font-bold ${aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError ? 'text-emerald-500' : 'text-gray-300'}`}>
// // //                                         {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError ? '✅' : '○'}
// // //                                     </span>
// // //                                 </div>
// // //                                 <div className="flex items-center justify-between">
// // //                                     <span className="text-sm text-gray-600">👥 Guarantor</span>
// // //                                     <span className={`text-sm font-bold ${guarantorName && guarantorMobile.length === 10 ? 'text-emerald-500' : 'text-gray-300'}`}>
// // //                                         {guarantorName && guarantorMobile.length === 10 ? '✅' : '○'}
// // //                                     </span>
// // //                                 </div>
// // //                             </div>
// // //
// // //                             {/* Security notice */}
// // //                             <div className="bg-purple-50 rounded-2xl p-4 mb-6">
// // //                                 <p className="text-purple-700 text-sm font-semibold mb-1">🔒 Secure Upload</p>
// // //                                 <p className="text-purple-600 text-xs leading-relaxed">
// // //                                     All documents are encrypted with AES-256 and stored in a private, access-controlled vault.
// // //                                 </p>
// // //                             </div>
// // //
// // //                             <button
// // //                                 onClick={handleSubmit}
// // //                                 disabled={submitting || uploaded < total}
// // //                                 className="btn-primary"
// // //                                 style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
// // //                                 {submitting
// // //                                     ? <span className="flex items-center gap-2"><Spinner /> Submitting…</span>
// // //                                     : uploaded < total
// // //                                         ? `Upload ${total - uploaded} more doc${total - uploaded > 1 ? 's' : ''}`
// // //                                         : '📤 Submit Documents'}
// // //                             </button>
// // //                         </div>
// // //                     </div>
// // //                 </div>
// // //             </main>
// // //         </div>
// // //     )
// // // }
// // //
// // // function Spinner() {
// // //     return (
// // //         <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
// // //             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
// // //             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
// // //         </svg>
// // //     )
// // // }
// //
// // import { useState, useRef } from 'react'
// // import { useNavigate, useLocation } from 'react-router-dom'
// // import { useAuth } from '@/context/AuthContext'
// // import { supabase } from '@/lib/supabaseClient'
// //
// // const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
// //
// // interface DocDef {
// //     type: string
// //     label: string
// //     description: string
// //     required: boolean
// //     icon: string
// //     accept: string
// // }
// //
// // interface UploadedFile {
// //     file: File
// //     preview?: string
// //     path?: string
// //     uploading?: boolean
// //     uploaded?: boolean
// //     error?: string
// // }
// //
// // const DOCUMENTS: DocDef[] = [
// //     { type: 'aadhaar_front',  label: 'Aadhaar Card (Front)',        description: 'Front side of your Aadhaar card',        required: true,  icon: '🪪', accept: 'image/*,.pdf' },
// //     { type: 'aadhaar_back',   label: 'Aadhaar Card (Back)',         description: 'Back side of your Aadhaar card',         required: true,  icon: '🪪', accept: 'image/*,.pdf' },
// //     { type: 'pan_card',       label: 'PAN Card',                    description: 'Your Permanent Account Number card',     required: true,  icon: '💳', accept: 'image/*,.pdf' },
// //     { type: 'salary_slip',    label: 'Salary Slip (Last 3 months)', description: 'Most recent 3 months salary slips',      required: true,  icon: '💰', accept: 'image/*,.pdf' },
// //     { type: 'bank_statement', label: 'Bank Statement (6 months)',   description: 'Last 6 months bank statement',           required: true,  icon: '🏦', accept: 'image/*,.pdf' },
// //     { type: 'itr',            label: 'ITR / Form 16',               description: 'Income Tax Return for last 2 years',     required: false, icon: '📊', accept: 'image/*,.pdf' },
// //     { type: 'address_proof',  label: 'Address Proof',               description: 'Utility bill, rental agreement or passport', required: true, icon: '🏠', accept: 'image/*,.pdf' },
// //     { type: 'photo',          label: 'Passport Size Photo',         description: 'Recent passport size photograph',        required: true,  icon: '📷', accept: 'image/*' },
// // ]
// //
// // export default function DocumentUploadPage() {
// //     const { user, session } = useAuth()
// //     const navigate = useNavigate()
// //     const location = useLocation()
// //     const applicationId = location.state?.applicationId || ''
// //
// //     // Uploads
// //     const [uploads, setUploads]           = useState<Record<string, UploadedFile>>({})
// //     const fileInputRefs                    = useRef<Record<string, HTMLInputElement | null>>({})
// //
// //     // Identity
// //     const [panNumber, setPanNumber]       = useState('')
// //     const [aadhaarNumber, setAadhaarNumber] = useState('')
// //     const [panError, setPanError]         = useState('')
// //     const [aadhaarError, setAadhaarError] = useState('')
// //
// //     // Guarantor
// //     const [guarantorName, setGuarantorName]         = useState('')
// //     const [guarantorMobile, setGuarantorMobile]     = useState('')
// //     const [guarantorRelation, setGuarantorRelation] = useState('')
// //
// //     // Guarantor OTP
// //     const [otpSent, setOtpSent]           = useState(false)
// //     const [otpCode, setOtpCode]           = useState('')
// //     const [otpVerified, setOtpVerified]   = useState(false)
// //     const [otpLoading, setOtpLoading]     = useState(false)
// //     const [otpError, setOtpError]         = useState('')
// //     const [devOtp, setDevOtp]             = useState('')
// //     const [resendCountdown, setResendCountdown] = useState(0)
// //
// //     // Submit
// //     const [submitting, setSubmitting]     = useState(false)
// //     const [error, setError]               = useState('')
// //     const [success, setSuccess]           = useState(false)
// //
// //     // ── Validation ──────────────────────────────────────────────
// //     const validatePAN = (pan: string) => {
// //         const ok = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
// //         setPanError(pan ? (ok ? '' : 'Invalid PAN. Format: ABCDE1234F') : 'PAN is required')
// //         return ok && !!pan
// //     }
// //
// //     const validateAadhaar = (aadhaar: string) => {
// //         const cleaned = aadhaar.replace(/\s/g, '')
// //         const ok = /^\d{12}$/.test(cleaned)
// //         setAadhaarError(cleaned ? (ok ? '' : 'Aadhaar must be 12 digits') : 'Aadhaar is required')
// //         return ok && !!cleaned
// //     }
// //
// //     // ── File upload ─────────────────────────────────────────────
// //     const handleFileSelect = async (docType: string, file: File) => {
// //         if (file.size > 5 * 1024 * 1024) {
// //             setUploads(prev => ({ ...prev, [docType]: { file, error: 'Max 5 MB allowed.' } }))
// //             return
// //         }
// //         const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
// //         setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: true } }))
// //         try {
// //             const filePath = `${user?.id}/${docType}_${Date.now()}_${file.name}`
// //             const { error: uploadError } = await supabase.storage
// //                 .from('loan-documents').upload(filePath, file, { upsert: true })
// //             if (uploadError) throw uploadError
// //
// //             await supabase.from('loan_documents').upsert([{
// //                 user_id: user?.id,
// //                 loan_application_id: applicationId || null,
// //                 document_type: docType,
// //                 file_name: file.name,
// //                 file_path: filePath,
// //                 file_size: file.size,
// //             }], { onConflict: 'user_id,document_type' })
// //
// //             setUploads(prev => ({ ...prev, [docType]: { file, preview, path: filePath, uploading: false, uploaded: true } }))
// //         } catch (err: any) {
// //             setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: false, error: err.message } }))
// //         }
// //     }
// //
// //     // ── Guarantor OTP ────────────────────────────────────────────
// //     const handleSendOTP = async () => {
// //         if (!/^\d{10}$/.test(guarantorMobile)) { setOtpError('Enter a valid 10-digit mobile number first'); return }
// //         if (!guarantorName.trim()) { setOtpError('Enter guarantor name first'); return }
// //         setOtpLoading(true); setOtpError('')
// //         try {
// //             const res = await fetch(`${BACKEND_URL}/api/guarantor/send-otp`, {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
// //                 body: JSON.stringify({ guarantorMobile, applicationId })
// //             })
// //             const data = await res.json()
// //             if (!res.ok) throw new Error(data.error)
// //             setOtpSent(true)
// //             if (data.dev_otp) setDevOtp(data.dev_otp)
// //             // Resend countdown: 60s
// //             setResendCountdown(60)
// //             const timer = setInterval(() => {
// //                 setResendCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
// //             }, 1000)
// //         } catch (err: any) {
// //             setOtpError(err.message)
// //         } finally {
// //             setOtpLoading(false)
// //         }
// //     }
// //
// //     const handleVerifyOTP = async () => {
// //         if (otpCode.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
// //         setOtpLoading(true); setOtpError('')
// //         try {
// //             const res = await fetch(`${BACKEND_URL}/api/guarantor/verify-otp`, {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
// //                 body: JSON.stringify({ otp: otpCode, applicationId, guarantorMobile })
// //             })
// //             const data = await res.json()
// //             if (!res.ok) throw new Error(data.error)
// //             setOtpVerified(true)
// //             setOtpError('')
// //         } catch (err: any) {
// //             setOtpError(err.message)
// //         } finally {
// //             setOtpLoading(false)
// //         }
// //     }
// //
// //     // ── Progress ─────────────────────────────────────────────────
// //     const required = DOCUMENTS.filter(d => d.required)
// //     const uploadedCount = required.filter(d => uploads[d.type]?.uploaded).length
// //     const progress = Math.round((uploadedCount / required.length) * 100)
// //
// //     const allReady =
// //         uploadedCount >= required.length &&
// //         panNumber.length === 10 && !panError &&
// //         aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError &&
// //         guarantorName.trim() && guarantorMobile.length === 10 &&
// //         otpVerified
// //
// //     // ── Submit ───────────────────────────────────────────────────
// //     const handleSubmit = async () => {
// //         setError('')
// //         if (!validatePAN(panNumber.toUpperCase())) return
// //         if (!validateAadhaar(aadhaarNumber)) return
// //         if (uploadedCount < required.length) { setError(`Upload all required documents (${uploadedCount}/${required.length})`); return }
// //         if (!guarantorName || !guarantorMobile) { setError('Guarantor information is required'); return }
// //         if (!otpVerified) { setError('Please verify guarantor OTP before submitting'); return }
// //
// //         setSubmitting(true)
// //         try {
// //             if (applicationId) {
// //                 await supabase.from('loan_applications').update({
// //                     pan_number: panNumber.toUpperCase(),
// //                     aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
// //                     guarantor_name: guarantorName,
// //                     guarantor_mobile: guarantorMobile,
// //                     guarantor_relation: guarantorRelation,
// //                     guarantor_otp_verified: true,
// //                     documents_submitted: true,
// //                     updated_at: new Date().toISOString()
// //                 }).eq('id', applicationId)
// //             } else {
// //                 await supabase.auth.updateUser({
// //                     data: { pan_number: panNumber.toUpperCase(), aadhaar_number: aadhaarNumber.replace(/\s/g, '') }
// //                 })
// //             }
// //             setSuccess(true)
// //         } catch (err: any) {
// //             setError(err.message || 'Submission failed')
// //         } finally {
// //             setSubmitting(false)
// //         }
// //     }
// //
// //     // ── Success screen ───────────────────────────────────────────
// //     if (success) {
// //         return (
// //             <div className="page-wrapper flex items-center justify-center p-8">
// //                 <div className="w-full max-w-2xl bg-white rounded-3xl p-16 text-center border border-purple-100">
// //                     <div className="text-7xl mb-8">✅</div>
// //                     <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">Documents Submitted!</h2>
// //                     <p className="text-gray-400 text-xl mb-10 leading-relaxed">
// //                         Your documents are under review. Our officer will verify them within 24 hours.
// //                     </p>
// //                     <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-10">
// //                         <p className="text-emerald-700 text-base font-semibold">
// //                             📱 Guarantor <strong>{guarantorName}</strong> ({guarantorMobile}) has been verified via OTP. ✅
// //                         </p>
// //                     </div>
// //                     <button onClick={() => navigate('/loan-status', { state: { applicationId } })}
// //                             className="btn-primary"
// //                             style={{ padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
// //                         Track Application Status →
// //                     </button>
// //                 </div>
// //             </div>
// //         )
// //     }
// //
// //     return (
// //         <div className="page-wrapper">
// //             {/* Navbar */}
// //             <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
// //                 <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '72px' }}>
// //                     <div className="flex items-center gap-4">
// //                         <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
// //                             <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
// //                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
// //                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
// //                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
// //                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
// //                             </svg>
// //                         </div>
// //                         <span className="font-display font-bold text-purple-900 text-2xl tracking-tight">Nexus</span>
// //                         <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold ml-2">Document Upload</span>
// //                     </div>
// //                     <div className="flex items-center gap-4">
// //                         <div className="flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
// //                             <div className="w-32 h-2 bg-purple-200 rounded-full overflow-hidden">
// //                                 <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
// //                             </div>
// //                             <span className="text-base text-purple-700 font-semibold">{uploadedCount}/{required.length}</span>
// //                         </div>
// //                         <button onClick={() => navigate(-1)} className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">← Back</button>
// //                     </div>
// //                 </div>
// //             </nav>
// //
// //             <main className="max-w-6xl mx-auto px-10 py-14">
// //                 <div className="mb-12">
// //                     <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Step 2 of 3</p>
// //                     <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">Upload Documents</h1>
// //                     <p className="text-gray-400 text-xl">Upload clear photos or scanned copies. All documents are encrypted and stored securely.</p>
// //                 </div>
// //
// //                 {error && (
// //                     <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-base flex items-center gap-3">
// //                         <span>⚠️</span> {error}
// //                     </div>
// //                 )}
// //
// //                 <div className="grid lg:grid-cols-3 gap-8">
// //                     <div className="lg:col-span-2 space-y-8">
// //
// //                         {/* ── Identity Numbers ── */}
// //                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
// //                             <h2 className="font-bold text-2xl text-gray-800 mb-6">🪪 Identity Numbers</h2>
// //                             <div className="grid grid-cols-2 gap-6">
// //                                 <div>
// //                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">PAN Number *</label>
// //                                     <input type="text" value={panNumber}
// //                                            onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
// //                                            placeholder="ABCDE1234F" maxLength={10}
// //                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest uppercase"
// //                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
// //                                     {panError && <p className="text-red-500 text-sm mt-2">⚠️ {panError}</p>}
// //                                     {panNumber.length === 10 && !panError && <p className="text-emerald-500 text-sm mt-2">✅ Valid PAN</p>}
// //                                 </div>
// //                                 <div>
// //                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Aadhaar Number *</label>
// //                                     <input type="text" value={aadhaarNumber}
// //                                            onChange={e => {
// //                                                const val = e.target.value.replace(/\D/g, '').slice(0, 12)
// //                                                setAadhaarNumber(val.replace(/(\d{4})(?=\d)/g, '$1 '))
// //                                                if (val.length === 12) validateAadhaar(val)
// //                                            }}
// //                                            placeholder="1234 5678 9012" maxLength={14}
// //                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest"
// //                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
// //                                     {aadhaarError && <p className="text-red-500 text-sm mt-2">⚠️ {aadhaarError}</p>}
// //                                     {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && <p className="text-emerald-500 text-sm mt-2">✅ Valid Aadhaar</p>}
// //                                 </div>
// //                             </div>
// //                         </div>
// //
// //                         {/* ── Document Uploads ── */}
// //                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
// //                             <h2 className="font-bold text-2xl text-gray-800 mb-2">📄 Required Documents</h2>
// //                             <p className="text-gray-400 text-sm mb-6">
// //                                 {uploadedCount < required.length
// //                                     ? `${required.length - uploadedCount} required document${required.length - uploadedCount > 1 ? 's' : ''} remaining`
// //                                     : '✅ All required documents uploaded'}
// //                             </p>
// //                             <div className="grid grid-cols-2 gap-5">
// //                                 {DOCUMENTS.map(doc => {
// //                                     const upload = uploads[doc.type]
// //                                     return (
// //                                         <div key={doc.type}
// //                                              className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
// //                                                  upload?.uploaded ? 'border-emerald-400 bg-emerald-50'
// //                                                      : upload?.error ? 'border-red-300 bg-red-50'
// //                                                          : 'border-purple-100 bg-white hover:border-purple-300'
// //                                              }`}>
// //                                             <input ref={el => fileInputRefs.current[doc.type] = el}
// //                                                    type="file" accept={doc.accept} className="hidden"
// //                                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(doc.type, f) }} />
// //                                             <button onClick={() => fileInputRefs.current[doc.type]?.click()}
// //                                                     className="w-full p-5 text-left" disabled={upload?.uploading}>
// //                                                 {upload?.preview && (
// //                                                     <img src={upload.preview} alt="preview" className="w-full h-24 object-cover rounded-xl mb-3" />
// //                                                 )}
// //                                                 <div className="flex items-start gap-3">
// //                                                     <span className="text-2xl flex-shrink-0">{doc.icon}</span>
// //                                                     <div className="min-w-0">
// //                                                         <div className="flex items-center gap-2 mb-1">
// //                                                             <p className="font-bold text-base text-gray-800 truncate">{doc.label}</p>
// //                                                             {doc.required && <span className="text-red-500 text-sm flex-shrink-0">*</span>}
// //                                                         </div>
// //                                                         <p className="text-sm text-gray-400">{doc.description}</p>
// //                                                         {upload?.uploading && <p className="text-purple-600 text-sm mt-2">⏳ Uploading…</p>}
// //                                                         {upload?.uploaded && <p className="text-emerald-600 text-sm mt-2 font-semibold">✅ {upload.file.name}</p>}
// //                                                         {upload?.error && <p className="text-red-500 text-sm mt-2">⚠️ {upload.error}</p>}
// //                                                         {!upload && <p className="text-purple-500 text-sm mt-2 font-medium">Click to upload →</p>}
// //                                                     </div>
// //                                                 </div>
// //                                             </button>
// //                                         </div>
// //                                     )
// //                                 })}
// //                             </div>
// //                         </div>
// //
// //                         {/* ── Guarantor + OTP ── */}
// //                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
// //                             <h2 className="font-bold text-2xl text-gray-800 mb-2">👥 Guarantor Verification</h2>
// //                             <p className="text-gray-400 text-base mb-6">
// //                                 A guarantor is required. We will verify their mobile number via OTP before submission.
// //                             </p>
// //
// //                             <div className="space-y-5">
// //                                 <div className="grid grid-cols-2 gap-5">
// //                                     <div>
// //                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Full Name *</label>
// //                                         <input type="text" value={guarantorName} onChange={e => setGuarantorName(e.target.value)}
// //                                                placeholder="Full name" disabled={otpVerified}
// //                                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
// //                                                style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
// //                                     </div>
// //                                     <div>
// //                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Mobile *</label>
// //                                         <div className="flex gap-2">
// //                                             <input type="tel" value={guarantorMobile}
// //                                                    onChange={e => { setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtpVerified(false) }}
// //                                                    placeholder="10-digit number" maxLength={10} disabled={otpVerified}
// //                                                    className="flex-1 bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono disabled:bg-gray-50 disabled:text-gray-400"
// //                                                    style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
// //                                             {!otpVerified && (
// //                                                 <button onClick={handleSendOTP} disabled={otpLoading || guarantorMobile.length !== 10 || resendCountdown > 0}
// //                                                         className="px-5 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all whitespace-nowrap text-base flex-shrink-0">
// //                                                     {otpLoading ? <Spinner /> : otpSent ? (resendCountdown > 0 ? `${resendCountdown}s` : 'Resend') : 'Send OTP'}
// //                                                 </button>
// //                                             )}
// //                                         </div>
// //                                         {otpVerified && <p className="text-emerald-500 text-sm mt-2 font-semibold">✅ Guarantor verified via OTP</p>}
// //                                     </div>
// //                                 </div>
// //
// //                                 {/* OTP input — shown after send */}
// //                                 {otpSent && !otpVerified && (
// //                                     <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
// //                                         <p className="text-purple-700 font-semibold text-base mb-1">
// //                                             📱 OTP sent to +91{guarantorMobile.slice(0, 2)}XXXXXXXX{guarantorMobile.slice(-2)}
// //                                         </p>
// //                                         <p className="text-purple-500 text-sm mb-4">Ask your guarantor to share the 6-digit code</p>
// //                                         {devOtp && (
// //                                             <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-4 inline-flex items-center gap-2">
// //                                                 <span className="text-amber-700 text-sm font-mono font-bold">🧪 Dev OTP: {devOtp}</span>
// //                                             </div>
// //                                         )}
// //                                         <div className="flex gap-3">
// //                                             <input type="text" inputMode="numeric" maxLength={6} value={otpCode}
// //                                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
// //                                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
// //                                                    placeholder="000000"
// //                                                    className="flex-1 text-center text-3xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-5 py-4 outline-none focus:border-purple-500"
// //                                                    style={{ letterSpacing: '0.4em' }} />
// //                                             <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6}
// //                                                     className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all text-base">
// //                                                 {otpLoading ? <Spinner /> : '✅ Verify'}
// //                                             </button>
// //                                         </div>
// //                                         {otpError && <p className="text-red-500 text-sm mt-3">⚠️ {otpError}</p>}
// //                                     </div>
// //                                 )}
// //
// //                                 {otpVerified && (
// //                                     <div className="bg-emerald-50 border border-emerald-300 rounded-2xl px-6 py-4 flex items-center gap-3">
// //                                         <span className="text-2xl">✅</span>
// //                                         <div>
// //                                             <p className="text-emerald-800 font-bold text-base">Guarantor mobile verified!</p>
// //                                             <p className="text-emerald-600 text-sm">+91{guarantorMobile} has been verified via OTP for this application.</p>
// //                                         </div>
// //                                     </div>
// //                                 )}
// //
// //                                 {/* Relationship */}
// //                                 <div>
// //                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Relationship to Applicant</label>
// //                                     <div className="grid grid-cols-4 gap-3">
// //                                         {['Parent', 'Spouse', 'Sibling', 'Friend', 'Employer', 'Relative', 'Business Partner', 'Other'].map(rel => (
// //                                             <button key={rel} type="button" onClick={() => setGuarantorRelation(rel)}
// //                                                     className={`p-3 rounded-xl border-2 text-base font-semibold transition-all ${
// //                                                         guarantorRelation === rel
// //                                                             ? 'border-purple-500 bg-purple-50 text-purple-700'
// //                                                             : 'border-purple-100 text-gray-600 hover:border-purple-300'
// //                                                     }`}>
// //                                                 {rel}
// //                                             </button>
// //                                         ))}
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                         </div>
// //                     </div>
// //
// //                     {/* ── Right sidebar: checklist + submit ── */}
// //                     <div className="space-y-6">
// //                         <div className="bg-white rounded-3xl p-8 border border-purple-100 sticky top-24">
// //                             <h3 className="font-bold text-xl text-gray-800 mb-6">Submission Checklist</h3>
// //
// //                             {/* Progress bar */}
// //                             <div className="mb-6">
// //                                 <div className="flex items-center justify-between mb-2">
// //                                     <span className="text-base text-gray-500 font-medium">Documents</span>
// //                                     <span className="font-bold text-purple-600">{uploadedCount}/{required.length}</span>
// //                                 </div>
// //                                 <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
// //                                     <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
// //                                 </div>
// //                             </div>
// //
// //                             {/* Doc checklist */}
// //                             <div className="space-y-2.5 mb-6">
// //                                 {DOCUMENTS.filter(d => d.required).map(doc => (
// //                                     <div key={doc.type} className="flex items-center justify-between">
// //                                         <span className="text-sm text-gray-600">{doc.icon} {doc.label.split('(')[0].trim()}</span>
// //                                         <span className={`text-sm font-bold ${uploads[doc.type]?.uploaded ? 'text-emerald-500' : 'text-gray-300'}`}>
// //                                             {uploads[doc.type]?.uploaded ? '✅' : '○'}
// //                                         </span>
// //                                     </div>
// //                                 ))}
// //                             </div>
// //
// //                             {/* Identity + Guarantor checklist */}
// //                             <div className="space-y-2.5 mb-8 pt-4 border-t border-purple-50">
// //                                 <CheckItem label="🔢 PAN Number"    done={panNumber.length === 10 && !panError} />
// //                                 <CheckItem label="🪪 Aadhaar"       done={aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError} />
// //                                 <CheckItem label="👤 Guarantor info" done={!!guarantorName && guarantorMobile.length === 10} />
// //                                 <CheckItem label="📱 Guarantor OTP" done={otpVerified} highlight />
// //                             </div>
// //
// //                             <div className="bg-purple-50 rounded-2xl p-4 mb-6">
// //                                 <p className="text-purple-700 text-sm font-semibold mb-1">🔒 Secure Upload</p>
// //                                 <p className="text-purple-600 text-xs leading-relaxed">
// //                                     All documents are encrypted with AES-256 and stored in a private vault.
// //                                 </p>
// //                             </div>
// //
// //                             <button onClick={handleSubmit} disabled={submitting || !allReady}
// //                                     className="btn-primary"
// //                                     style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
// //                                 {submitting
// //                                     ? <span className="flex items-center gap-2"><Spinner /> Submitting…</span>
// //                                     : !otpVerified
// //                                         ? '🔒 Verify OTP First'
// //                                         : uploadedCount < required.length
// //                                             ? `Upload ${required.length - uploadedCount} more`
// //                                             : '📤 Submit Documents'}
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </main>
// //         </div>
// //     )
// // }
// //
// // function CheckItem({ label, done, highlight }: { label: string; done: boolean; highlight?: boolean }) {
// //     return (
// //         <div className="flex items-center justify-between">
// //             <span className={`text-sm ${highlight && !done ? 'text-purple-600 font-semibold' : 'text-gray-600'}`}>{label}</span>
// //             <span className={`text-sm font-bold ${done ? 'text-emerald-500' : highlight ? 'text-purple-400' : 'text-gray-300'}`}>
// //                 {done ? '✅' : highlight ? '⟳' : '○'}
// //             </span>
// //         </div>
// //     )
// // }
// //
// // function Spinner() {
// //     return (
// //         <svg width="18" height="18" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
// //             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
// //             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
// //         </svg>
// //     )
// // }
//
// import { useState, useRef } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
// import { supabase } from '@/lib/supabaseClient'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// interface DocDef {
//     type: string
//     label: string
//     description: string
//     required: boolean
//     icon: string
//     accept: string
// }
//
// interface UploadedFile {
//     file: File
//     preview?: string
//     path?: string
//     uploading?: boolean
//     uploaded?: boolean
//     error?: string
// }
//
// const DOCUMENTS: DocDef[] = [
//     { type: 'aadhaar_front',  label: 'Aadhaar Card (Front)',        description: 'Front side of your Aadhaar card',        required: true,  icon: '🪪', accept: 'image/*,.pdf' },
//     { type: 'aadhaar_back',   label: 'Aadhaar Card (Back)',         description: 'Back side of your Aadhaar card',         required: true,  icon: '🪪', accept: 'image/*,.pdf' },
//     { type: 'pan_card',       label: 'PAN Card',                    description: 'Your Permanent Account Number card',     required: true,  icon: '💳', accept: 'image/*,.pdf' },
//     { type: 'salary_slip',    label: 'Salary Slip (Last 3 months)', description: 'Most recent 3 months salary slips',      required: true,  icon: '💰', accept: 'image/*,.pdf' },
//     { type: 'bank_statement', label: 'Bank Statement (6 months)',   description: 'Last 6 months bank statement',           required: true,  icon: '🏦', accept: 'image/*,.pdf' },
//     { type: 'itr',            label: 'ITR / Form 16',               description: 'Income Tax Return for last 2 years',     required: false, icon: '📊', accept: 'image/*,.pdf' },
//     { type: 'address_proof',  label: 'Address Proof',               description: 'Utility bill, rental agreement or passport', required: true, icon: '🏠', accept: 'image/*,.pdf' },
//     { type: 'photo',          label: 'Passport Size Photo',         description: 'Recent passport size photograph',        required: true,  icon: '📷', accept: 'image/*' },
// ]
//
// export default function DocumentUploadPage() {
//     const { user, session } = useAuth()
//     const navigate = useNavigate()
//     const location = useLocation()
//     const applicationId = location.state?.applicationId || ''
//
//     // Uploads
//     const [uploads, setUploads]           = useState<Record<string, UploadedFile>>({})
//     const fileInputRefs                    = useRef<Record<string, HTMLInputElement | null>>({})
//
//     // Identity
//     const [panNumber, setPanNumber]       = useState('')
//     const [aadhaarNumber, setAadhaarNumber] = useState('')
//     const [panError, setPanError]         = useState('')
//     const [aadhaarError, setAadhaarError] = useState('')
//
//     // Guarantor
//     const [guarantorName, setGuarantorName]         = useState('')
//     const [guarantorMobile, setGuarantorMobile]     = useState('')
//     const [guarantorRelation, setGuarantorRelation] = useState('')
//
//     // Guarantor OTP
//     const [otpSent, setOtpSent]           = useState(false)
//     const [otpCode, setOtpCode]           = useState('')
//     const [otpVerified, setOtpVerified]   = useState(false)
//     const [otpLoading, setOtpLoading]     = useState(false)
//     const [otpError, setOtpError]         = useState('')
//     // dev_otp is intentionally NOT stored in state — logged to console only
//     const [resendCountdown, setResendCountdown] = useState(0)
//
//     // Submit
//     const [submitting, setSubmitting]     = useState(false)
//     const [error, setError]               = useState('')
//     const [success, setSuccess]           = useState(false)
//
//     // ── Validation ──────────────────────────────────────────────
//     const validatePAN = (pan: string) => {
//         const ok = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
//         setPanError(pan ? (ok ? '' : 'Invalid PAN. Format: ABCDE1234F') : 'PAN is required')
//         return ok && !!pan
//     }
//
//     const validateAadhaar = (aadhaar: string) => {
//         const cleaned = aadhaar.replace(/\s/g, '')
//         const ok = /^\d{12}$/.test(cleaned)
//         setAadhaarError(cleaned ? (ok ? '' : 'Aadhaar must be 12 digits') : 'Aadhaar is required')
//         return ok && !!cleaned
//     }
//
//     // ── File upload ─────────────────────────────────────────────
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
//             await supabase.from('loan_documents').upsert([{
//                 user_id: user?.id,
//                 loan_application_id: applicationId || null,
//                 document_type: docType,
//                 file_name: file.name,
//                 file_path: filePath,
//                 file_size: file.size,
//             }], { onConflict: 'user_id,document_type' })
//
//             setUploads(prev => ({ ...prev, [docType]: { file, preview, path: filePath, uploading: false, uploaded: true } }))
//         } catch (err: any) {
//             setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: false, error: err.message } }))
//         }
//     }
//
//     // ── Guarantor OTP ────────────────────────────────────────────
//     const handleSendOTP = async () => {
//         if (!/^\d{10}$/.test(guarantorMobile)) { setOtpError('Enter a valid 10-digit mobile number first'); return }
//         if (!guarantorName.trim()) { setOtpError('Enter guarantor name first'); return }
//         setOtpLoading(true); setOtpError('')
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/guarantor/send-otp`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
//                 body: JSON.stringify({ guarantorMobile, applicationId })
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setOtpSent(true)
//             if (data.dev_otp) console.log(`%c[DEV] Guarantor OTP: ${data.dev_otp}`, 'color: orange; font-weight: bold')
//             // Resend countdown: 60s
//             setResendCountdown(60)
//             const timer = setInterval(() => {
//                 setResendCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
//             }, 1000)
//         } catch (err: any) {
//             setOtpError(err.message)
//         } finally {
//             setOtpLoading(false)
//         }
//     }
//
//     const handleVerifyOTP = async () => {
//         if (otpCode.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
//         setOtpLoading(true); setOtpError('')
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/guarantor/verify-otp`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
//                 body: JSON.stringify({ otp: otpCode, applicationId, guarantorMobile })
//             })
//             const data = await res.json()
//             if (!res.ok) throw new Error(data.error)
//             setOtpVerified(true)
//             setOtpError('')
//         } catch (err: any) {
//             setOtpError(err.message)
//         } finally {
//             setOtpLoading(false)
//         }
//     }
//
//     // ── Progress ─────────────────────────────────────────────────
//     const required = DOCUMENTS.filter(d => d.required)
//     const uploadedCount = required.filter(d => uploads[d.type]?.uploaded).length
//     const progress = Math.round((uploadedCount / required.length) * 100)
//
//     const allReady =
//         uploadedCount >= required.length &&
//         panNumber.length === 10 && !panError &&
//         aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError &&
//         guarantorName.trim() && guarantorMobile.length === 10 &&
//         otpVerified
//
//     // ── Submit ───────────────────────────────────────────────────
//     const handleSubmit = async () => {
//         setError('')
//         if (!validatePAN(panNumber.toUpperCase())) return
//         if (!validateAadhaar(aadhaarNumber)) return
//         if (uploadedCount < required.length) { setError(`Upload all required documents (${uploadedCount}/${required.length})`); return }
//         if (!guarantorName || !guarantorMobile) { setError('Guarantor information is required'); return }
//         if (!otpVerified) { setError('Please verify guarantor OTP before submitting'); return }
//
//         setSubmitting(true)
//         try {
//             if (applicationId) {
//                 await supabase.from('loan_applications').update({
//                     pan_number: panNumber.toUpperCase(),
//                     aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
//                     guarantor_name: guarantorName,
//                     guarantor_mobile: guarantorMobile,
//                     guarantor_relation: guarantorRelation,
//                     guarantor_otp_verified: true,
//                     documents_submitted: true,
//                     updated_at: new Date().toISOString()
//                 }).eq('id', applicationId)
//             } else {
//                 await supabase.auth.updateUser({
//                     data: { pan_number: panNumber.toUpperCase(), aadhaar_number: aadhaarNumber.replace(/\s/g, '') }
//                 })
//             }
//             setSuccess(true)
//         } catch (err: any) {
//             setError(err.message || 'Submission failed')
//         } finally {
//             setSubmitting(false)
//         }
//     }
//
//     // ── Success screen ───────────────────────────────────────────
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
//                             📱 Guarantor <strong>{guarantorName}</strong> ({guarantorMobile}) has been verified via OTP. ✅
//                         </p>
//                     </div>
//                     <button onClick={() => navigate('/loan-status', { state: { applicationId } })}
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
//                         <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold ml-2">Document Upload</span>
//                     </div>
//                     <div className="flex items-center gap-4">
//                         <div className="flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
//                             <div className="w-32 h-2 bg-purple-200 rounded-full overflow-hidden">
//                                 <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
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
//                         {/* ── Identity Numbers ── */}
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                             <h2 className="font-bold text-2xl text-gray-800 mb-6">🪪 Identity Numbers</h2>
//                             <div className="grid grid-cols-2 gap-6">
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">PAN Number *</label>
//                                     <input type="text" value={panNumber}
//                                            onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
//                                            placeholder="ABCDE1234F" maxLength={10}
//                                            className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest uppercase"
//                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
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
//                                            style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                     {aadhaarError && <p className="text-red-500 text-sm mt-2">⚠️ {aadhaarError}</p>}
//                                     {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && <p className="text-emerald-500 text-sm mt-2">✅ Valid Aadhaar</p>}
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* ── Document Uploads ── */}
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
//                                         <div key={doc.type}
//                                              className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
//                                                  upload?.uploaded ? 'border-emerald-400 bg-emerald-50'
//                                                      : upload?.error ? 'border-red-300 bg-red-50'
//                                                          : 'border-purple-100 bg-white hover:border-purple-300'
//                                              }`}>
//                                             <input ref={el => fileInputRefs.current[doc.type] = el}
//                                                    type="file" accept={doc.accept} className="hidden"
//                                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(doc.type, f) }} />
//                                             <button onClick={() => fileInputRefs.current[doc.type]?.click()}
//                                                     className="w-full p-5 text-left" disabled={upload?.uploading}>
//                                                 {upload?.preview && (
//                                                     <img src={upload.preview} alt="preview" className="w-full h-24 object-cover rounded-xl mb-3" />
//                                                 )}
//                                                 <div className="flex items-start gap-3">
//                                                     <span className="text-2xl flex-shrink-0">{doc.icon}</span>
//                                                     <div className="min-w-0">
//                                                         <div className="flex items-center gap-2 mb-1">
//                                                             <p className="font-bold text-base text-gray-800 truncate">{doc.label}</p>
//                                                             {doc.required && <span className="text-red-500 text-sm flex-shrink-0">*</span>}
//                                                         </div>
//                                                         <p className="text-sm text-gray-400">{doc.description}</p>
//                                                         {upload?.uploading && <p className="text-purple-600 text-sm mt-2">⏳ Uploading…</p>}
//                                                         {upload?.uploaded && <p className="text-emerald-600 text-sm mt-2 font-semibold">✅ {upload.file.name}</p>}
//                                                         {upload?.error && <p className="text-red-500 text-sm mt-2">⚠️ {upload.error}</p>}
//                                                         {!upload && <p className="text-purple-500 text-sm mt-2 font-medium">Click to upload →</p>}
//                                                     </div>
//                                                 </div>
//                                             </button>
//                                         </div>
//                                     )
//                                 })}
//                             </div>
//                         </div>
//
//                         {/* ── Guarantor + OTP ── */}
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                             <h2 className="font-bold text-2xl text-gray-800 mb-2">👥 Guarantor Verification</h2>
//                             <p className="text-gray-400 text-base mb-6">
//                                 A guarantor is required. We will verify their mobile number via OTP before submission.
//                             </p>
//
//                             <div className="space-y-5">
//                                 <div className="grid grid-cols-2 gap-5">
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Full Name *</label>
//                                         <input type="text" value={guarantorName} onChange={e => setGuarantorName(e.target.value)}
//                                                placeholder="Full name" disabled={otpVerified}
//                                                className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
//                                                style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                     </div>
//                                     <div>
//                                         <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Mobile *</label>
//                                         <div className="flex gap-2">
//                                             <input type="tel" value={guarantorMobile}
//                                                    onChange={e => { setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtpVerified(false) }}
//                                                    placeholder="10-digit number" maxLength={10} disabled={otpVerified}
//                                                    className="flex-1 bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono disabled:bg-gray-50 disabled:text-gray-400"
//                                                    style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }} />
//                                             {!otpVerified && (
//                                                 <button onClick={handleSendOTP} disabled={otpLoading || guarantorMobile.length !== 10 || resendCountdown > 0}
//                                                         className="px-5 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all whitespace-nowrap text-base flex-shrink-0">
//                                                     {otpLoading ? <Spinner /> : otpSent ? (resendCountdown > 0 ? `${resendCountdown}s` : 'Resend') : 'Send OTP'}
//                                                 </button>
//                                             )}
//                                         </div>
//                                         {otpVerified && <p className="text-emerald-500 text-sm mt-2 font-semibold">✅ Guarantor verified via OTP</p>}
//                                     </div>
//                                 </div>
//
//                                 {/* OTP input — shown after send */}
//                                 {otpSent && !otpVerified && (
//                                     <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
//                                         <p className="text-purple-700 font-semibold text-base mb-1">
//                                             📱 OTP sent to +91{guarantorMobile.slice(0, 2)}XXXXXXXX{guarantorMobile.slice(-2)}
//                                         </p>
//                                         <p className="text-purple-500 text-sm mb-4">Ask your guarantor to share the 6-digit code</p>
//
//                                         <div className="flex gap-3">
//                                             <input type="text" inputMode="numeric" maxLength={6} value={otpCode}
//                                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
//                                                    placeholder="000000"
//                                                    className="flex-1 text-center text-3xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-5 py-4 outline-none focus:border-purple-500"
//                                                    style={{ letterSpacing: '0.4em' }} />
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
//                                             <p className="text-emerald-600 text-sm">+91{guarantorMobile} has been verified via OTP for this application.</p>
//                                         </div>
//                                     </div>
//                                 )}
//
//                                 {/* Relationship */}
//                                 <div>
//                                     <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Relationship to Applicant</label>
//                                     <div className="grid grid-cols-4 gap-3">
//                                         {['Parent', 'Spouse', 'Sibling', 'Friend', 'Employer', 'Relative', 'Business Partner', 'Other'].map(rel => (
//                                             <button key={rel} type="button" onClick={() => setGuarantorRelation(rel)}
//                                                     className={`p-3 rounded-xl border-2 text-base font-semibold transition-all ${
//                                                         guarantorRelation === rel
//                                                             ? 'border-purple-500 bg-purple-50 text-purple-700'
//                                                             : 'border-purple-100 text-gray-600 hover:border-purple-300'
//                                                     }`}>
//                                                 {rel}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     {/* ── Right sidebar: checklist + submit ── */}
//                     <div className="space-y-6">
//                         <div className="bg-white rounded-3xl p-8 border border-purple-100 sticky top-24">
//                             <h3 className="font-bold text-xl text-gray-800 mb-6">Submission Checklist</h3>
//
//                             {/* Progress bar */}
//                             <div className="mb-6">
//                                 <div className="flex items-center justify-between mb-2">
//                                     <span className="text-base text-gray-500 font-medium">Documents</span>
//                                     <span className="font-bold text-purple-600">{uploadedCount}/{required.length}</span>
//                                 </div>
//                                 <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
//                                     <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
//                                 </div>
//                             </div>
//
//                             {/* Doc checklist */}
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
//
//                             {/* Identity + Guarantor checklist */}
//                             <div className="space-y-2.5 mb-8 pt-4 border-t border-purple-50">
//                                 <CheckItem label="🔢 PAN Number"    done={panNumber.length === 10 && !panError} />
//                                 <CheckItem label="🪪 Aadhaar"       done={aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError} />
//                                 <CheckItem label="👤 Guarantor info" done={!!guarantorName && guarantorMobile.length === 10} />
//                                 <CheckItem label="📱 Guarantor OTP" done={otpVerified} highlight />
//                             </div>
//
//                             <div className="bg-purple-50 rounded-2xl p-4 mb-6">
//                                 <p className="text-purple-700 text-sm font-semibold mb-1">🔒 Secure Upload</p>
//                                 <p className="text-purple-600 text-xs leading-relaxed">
//                                     All documents are encrypted with AES-256 and stored in a private vault.
//                                 </p>
//                             </div>
//
//                             <button onClick={handleSubmit} disabled={submitting || !allReady}
//                                     className="btn-primary"
//                                     style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
//                                 {submitting
//                                     ? <span className="flex items-center gap-2"><Spinner /> Submitting…</span>
//                                     : !otpVerified
//                                         ? '🔒 Verify OTP First'
//                                         : uploadedCount < required.length
//                                             ? `Upload ${required.length - uploadedCount} more`
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

interface DocDef {
    type: string; label: string; description: string
    required: boolean; icon: string; accept: string
}
interface UploadedFile {
    file: File; preview?: string; path?: string
    uploading?: boolean; uploaded?: boolean; error?: string
}

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

    // ── FIX: always resolve a real applicationId ────────────────
    // If applicant arrives here from the dashboard (no state), look up
    // their latest non-draft application so documents get properly linked.
    const [resolvedAppId, setResolvedAppId] = useState(appIdFromState)

    useEffect(() => {
        if (!appIdFromState && user?.id) {
            supabase
                .from('loan_applications')
                .select('id')
                .eq('user_id', user.id)
                .not('status', 'eq', 'draft')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
                .then(({ data }) => { if (data?.id) setResolvedAppId(data.id) })
        }
    }, [user?.id])

    const [uploads, setUploads]               = useState<Record<string, UploadedFile>>({})
    const fileInputRefs                        = useRef<Record<string, HTMLInputElement | null>>({})
    const [panNumber, setPanNumber]           = useState('')
    const [aadhaarNumber, setAadhaarNumber]   = useState('')
    const [panError, setPanError]             = useState('')
    const [aadhaarError, setAadhaarError]     = useState('')
    const [guarantorName, setGuarantorName]   = useState('')
    const [guarantorMobile, setGuarantorMobile] = useState('')
    const [guarantorRelation, setGuarantorRelation] = useState('')
    const [otpSent, setOtpSent]               = useState(false)
    const [otpCode, setOtpCode]               = useState('')
    const [otpVerified, setOtpVerified]       = useState(false)
    const [otpLoading, setOtpLoading]         = useState(false)
    const [otpError, setOtpError]             = useState('')
    const [resendCountdown, setResendCountdown] = useState(0)
    const [submitting, setSubmitting]         = useState(false)
    const [error, setError]                   = useState('')
    const [success, setSuccess]               = useState(false)

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
        if (file.size > 5 * 1024 * 1024) {
            setUploads(prev => ({ ...prev, [docType]: { file, error: 'Max 5 MB allowed.' } }))
            return
        }
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: true } }))
        try {
            const filePath = `${user?.id}/${docType}_${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
                .from('loan-documents').upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError

            // ignoreDuplicates: false — ensures loan_application_id column gets
            // updated even if a row already exists for this doc type
            await supabase.from('loan_documents').upsert([{
                user_id:              user?.id,
                loan_application_id:  resolvedAppId || null,
                document_type:        docType,
                file_name:            file.name,
                file_path:            filePath,
                file_size:            file.size,
            }], { onConflict: 'user_id,document_type', ignoreDuplicates: false })

            setUploads(prev => ({ ...prev, [docType]: { file, preview, path: filePath, uploading: false, uploaded: true } }))
        } catch (err: any) {
            setUploads(prev => ({ ...prev, [docType]: { file, preview, uploading: false, error: err.message } }))
        }
    }

    const handleSendOTP = async () => {
        if (!/^\d{10}$/.test(guarantorMobile)) { setOtpError('Enter a valid 10-digit mobile number first'); return }
        if (!guarantorName.trim()) { setOtpError('Enter guarantor name first'); return }
        setOtpLoading(true); setOtpError('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/guarantor/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ guarantorMobile, applicationId: resolvedAppId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setOtpSent(true)
            // OTP never shown in UI — only in browser DevTools console
            if (data.dev_otp) console.log(`%c[DEV] Guarantor OTP: ${data.dev_otp}`, 'color: orange; font-weight: bold')
            setResendCountdown(60)
            const timer = setInterval(() => {
                setResendCountdown(p => { if (p <= 1) { clearInterval(timer); return 0 } return p - 1 })
            }, 1000)
        } catch (err: any) {
            setOtpError(err.message)
        } finally { setOtpLoading(false) }
    }

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) { setOtpError('Enter the 6-digit OTP'); return }
        setOtpLoading(true); setOtpError('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/guarantor/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ otp: otpCode, applicationId: resolvedAppId, guarantorMobile })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setOtpVerified(true); setOtpError('')
        } catch (err: any) {
            setOtpError(err.message)
        } finally { setOtpLoading(false) }
    }

    const required      = DOCUMENTS.filter(d => d.required)
    const uploadedCount = required.filter(d => uploads[d.type]?.uploaded).length
    const progress      = Math.round((uploadedCount / required.length) * 100)
    const allReady      = uploadedCount >= required.length &&
        panNumber.length === 10 && !panError &&
        aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError &&
        !!guarantorName.trim() && guarantorMobile.length === 10 && otpVerified

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
                await supabase.from('loan_applications').update({
                    pan_number:             panNumber.toUpperCase(),
                    aadhaar_number:         aadhaarNumber.replace(/\s/g, ''),
                    guarantor_name:         guarantorName,
                    guarantor_mobile:       guarantorMobile,
                    guarantor_relation:     guarantorRelation,
                    guarantor_otp_verified: true,
                    documents_submitted:    true,
                    updated_at:             new Date().toISOString()
                }).eq('id', resolvedAppId)
            }
            // Always store in user metadata too as a fallback
            await supabase.auth.updateUser({
                data: { pan_number: panNumber.toUpperCase(), aadhaar_number: aadhaarNumber.replace(/\s/g, '') }
            })
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Submission failed')
        } finally { setSubmitting(false) }
    }

    if (success) {
        return (
            <div className="page-wrapper flex items-center justify-center p-8">
                <div className="w-full max-w-2xl bg-white rounded-3xl p-16 text-center border border-purple-100">
                    <div className="text-7xl mb-8">✅</div>
                    <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">Documents Submitted!</h2>
                    <p className="text-gray-400 text-xl mb-10 leading-relaxed">
                        Your documents are under review. Our officer will verify them within 24 hours.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-10">
                        <p className="text-emerald-700 text-base font-semibold">
                            📱 Guarantor <strong>{guarantorName}</strong> ({guarantorMobile}) verified via OTP ✅
                        </p>
                    </div>
                    <button onClick={() => navigate('/loan-status', { state: { applicationId: resolvedAppId } })}
                            className="btn-primary"
                            style={{ padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
                        Track Application Status →
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrapper">
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
                        <span className="text-base bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full font-semibold ml-2">Document Upload</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-purple-50 rounded-full px-5 py-2.5">
                            <div className="w-32 h-2 bg-purple-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
                            </div>
                            <span className="text-base text-purple-700 font-semibold">{uploadedCount}/{required.length}</span>
                        </div>
                        <button onClick={() => navigate(-1)} className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">← Back</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-10 py-14">
                <div className="mb-12">
                    <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-3">Step 2 of 3</p>
                    <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight mb-3">Upload Documents</h1>
                    <p className="text-gray-400 text-xl">Upload clear photos or scanned copies. All documents are encrypted and stored securely.</p>
                    {!resolvedAppId && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3 text-yellow-700 text-sm font-medium">
                            ⚠️ No active application found.{' '}
                            <button onClick={() => navigate('/apply-loan')} className="underline font-bold">Apply for a loan first</button>
                            {' '}so your documents get linked correctly.
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-8 text-base flex items-center gap-3">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">

                        {/* Identity */}
                        <div className="bg-white rounded-3xl p-8 border border-purple-100">
                            <h2 className="font-bold text-2xl text-gray-800 mb-6">🪪 Identity Numbers</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">PAN Number *</label>
                                    <input type="text" value={panNumber}
                                           onChange={e => { setPanNumber(e.target.value.toUpperCase()); if (e.target.value.length === 10) validatePAN(e.target.value.toUpperCase()) }}
                                           placeholder="ABCDE1234F" maxLength={10}
                                           className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest uppercase"
                                           style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
                                    {panError && <p className="text-red-500 text-sm mt-2">⚠️ {panError}</p>}
                                    {panNumber.length === 10 && !panError && <p className="text-emerald-500 text-sm mt-2">✅ Valid PAN</p>}
                                </div>
                                <div>
                                    <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Aadhaar Number *</label>
                                    <input type="text" value={aadhaarNumber}
                                           onChange={e => {
                                               const val = e.target.value.replace(/\D/g, '').slice(0, 12)
                                               setAadhaarNumber(val.replace(/(\d{4})(?=\d)/g, '$1 '))
                                               if (val.length === 12) validateAadhaar(val)
                                           }}
                                           placeholder="1234 5678 9012" maxLength={14}
                                           className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono tracking-widest"
                                           style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
                                    {aadhaarError && <p className="text-red-500 text-sm mt-2">⚠️ {aadhaarError}</p>}
                                    {aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError && <p className="text-emerald-500 text-sm mt-2">✅ Valid Aadhaar</p>}
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white rounded-3xl p-8 border border-purple-100">
                            <h2 className="font-bold text-2xl text-gray-800 mb-2">📄 Required Documents</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                {uploadedCount < required.length
                                    ? `${required.length - uploadedCount} required document${required.length - uploadedCount > 1 ? 's' : ''} remaining`
                                    : '✅ All required documents uploaded'}
                            </p>
                            <div className="grid grid-cols-2 gap-5">
                                {DOCUMENTS.map(doc => {
                                    const upload = uploads[doc.type]
                                    return (
                                        <div key={doc.type} className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                                            upload?.uploaded ? 'border-emerald-400 bg-emerald-50'
                                                : upload?.error  ? 'border-red-300 bg-red-50'
                                                    : 'border-purple-100 bg-white hover:border-purple-300'}`}>
                                            <input ref={el => fileInputRefs.current[doc.type] = el}
                                                   type="file" accept={doc.accept} className="hidden"
                                                   onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(doc.type, f) }}/>
                                            <button onClick={() => fileInputRefs.current[doc.type]?.click()}
                                                    className="w-full p-5 text-left" disabled={upload?.uploading}>
                                                {upload?.preview && <img src={upload.preview} alt="preview" className="w-full h-24 object-cover rounded-xl mb-3"/>}
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl flex-shrink-0">{doc.icon}</span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-bold text-base text-gray-800 truncate">{doc.label}</p>
                                                            {doc.required && <span className="text-red-500 text-sm flex-shrink-0">*</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-400">{doc.description}</p>
                                                        {upload?.uploading && <p className="text-purple-600 text-sm mt-2">⏳ Uploading…</p>}
                                                        {upload?.uploaded  && <p className="text-emerald-600 text-sm mt-2 font-semibold">✅ {upload.file.name}</p>}
                                                        {upload?.error     && <p className="text-red-500 text-sm mt-2">⚠️ {upload.error}</p>}
                                                        {!upload           && <p className="text-purple-500 text-sm mt-2 font-medium">Click to upload →</p>}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Guarantor */}
                        <div className="bg-white rounded-3xl p-8 border border-purple-100">
                            <h2 className="font-bold text-2xl text-gray-800 mb-2">👥 Guarantor Verification</h2>
                            <p className="text-gray-400 text-base mb-6">
                                A guarantor is required. We will verify their mobile number via OTP before submission.
                            </p>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Full Name *</label>
                                        <input type="text" value={guarantorName} onChange={e => setGuarantorName(e.target.value)}
                                               placeholder="Full name" disabled={otpVerified}
                                               className="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
                                               style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
                                    </div>
                                    <div>
                                        <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Guarantor Mobile *</label>
                                        <div className="flex gap-2">
                                            <input type="tel" value={guarantorMobile}
                                                   onChange={e => { setGuarantorMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtpVerified(false) }}
                                                   placeholder="10-digit number" maxLength={10} disabled={otpVerified}
                                                   className="flex-1 bg-white border border-purple-100 rounded-2xl px-5 py-4 text-lg text-gray-800 outline-none transition-all placeholder:text-gray-300 focus:border-purple-400 font-mono disabled:bg-gray-50 disabled:text-gray-400"
                                                   style={{ boxShadow: '0 1px 3px rgba(109,40,217,0.04)' }}/>
                                            {!otpVerified && (
                                                <button onClick={handleSendOTP}
                                                        disabled={otpLoading || guarantorMobile.length !== 10 || resendCountdown > 0}
                                                        className="px-5 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all whitespace-nowrap text-base flex-shrink-0">
                                                    {otpLoading ? <Spinner /> : otpSent ? (resendCountdown > 0 ? `${resendCountdown}s` : 'Resend') : 'Send OTP'}
                                                </button>
                                            )}
                                        </div>
                                        {otpVerified && <p className="text-emerald-500 text-sm mt-2 font-semibold">✅ Guarantor verified via OTP</p>}
                                    </div>
                                </div>

                                {otpSent && !otpVerified && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                                        <p className="text-purple-700 font-semibold text-base mb-1">
                                            📱 OTP sent to +91{guarantorMobile.slice(0, 2)}XXXXXXXX{guarantorMobile.slice(-2)}
                                        </p>
                                        <p className="text-purple-500 text-sm mb-4">Ask your guarantor to share the 6-digit code from the SMS</p>
                                        <div className="flex gap-3">
                                            <input type="text" inputMode="numeric" maxLength={6} value={otpCode}
                                                   onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                   onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                                                   placeholder="000000"
                                                   className="flex-1 text-center text-3xl font-bold tracking-widest bg-white border-2 border-purple-200 rounded-2xl px-5 py-4 outline-none focus:border-purple-500"
                                                   style={{ letterSpacing: '0.4em' }}/>
                                            <button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.length !== 6}
                                                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all text-base">
                                                {otpLoading ? <Spinner /> : '✅ Verify'}
                                            </button>
                                        </div>
                                        {otpError && <p className="text-red-500 text-sm mt-3">⚠️ {otpError}</p>}
                                    </div>
                                )}

                                {otpVerified && (
                                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl px-6 py-4 flex items-center gap-3">
                                        <span className="text-2xl">✅</span>
                                        <div>
                                            <p className="text-emerald-800 font-bold text-base">Guarantor mobile verified!</p>
                                            <p className="text-emerald-600 text-sm">+91{guarantorMobile} verified via OTP for this application.</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-base font-bold text-gray-500 mb-2.5 uppercase tracking-wide">Relationship to Applicant</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {['Parent', 'Spouse', 'Sibling', 'Friend', 'Employer', 'Relative', 'Business Partner', 'Other'].map(rel => (
                                            <button key={rel} type="button" onClick={() => setGuarantorRelation(rel)}
                                                    className={`p-3 rounded-xl border-2 text-base font-semibold transition-all ${
                                                        guarantorRelation === rel ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-purple-100 text-gray-600 hover:border-purple-300'}`}>
                                                {rel}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-purple-100 sticky top-24">
                            <h3 className="font-bold text-xl text-gray-800 mb-6">Submission Checklist</h3>
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-base text-gray-500 font-medium">Documents</span>
                                    <span className="font-bold text-purple-600">{uploadedCount}/{required.length}</span>
                                </div>
                                <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
                                </div>
                            </div>
                            <div className="space-y-2.5 mb-6">
                                {DOCUMENTS.filter(d => d.required).map(doc => (
                                    <div key={doc.type} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">{doc.icon} {doc.label.split('(')[0].trim()}</span>
                                        <span className={`text-sm font-bold ${uploads[doc.type]?.uploaded ? 'text-emerald-500' : 'text-gray-300'}`}>
                                            {uploads[doc.type]?.uploaded ? '✅' : '○'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2.5 mb-8 pt-4 border-t border-purple-50">
                                <CheckItem label="🔢 PAN Number"     done={panNumber.length === 10 && !panError} />
                                <CheckItem label="🪪 Aadhaar"        done={aadhaarNumber.replace(/\s/g, '').length === 12 && !aadhaarError} />
                                <CheckItem label="👤 Guarantor info" done={!!guarantorName && guarantorMobile.length === 10} />
                                <CheckItem label="📱 Guarantor OTP"  done={otpVerified} highlight />
                                <CheckItem label="🔗 Linked to app"  done={!!resolvedAppId} />
                            </div>
                            <div className="bg-purple-50 rounded-2xl p-4 mb-6">
                                <p className="text-purple-700 text-sm font-semibold mb-1">🔒 Secure Upload</p>
                                <p className="text-purple-600 text-xs leading-relaxed">All documents are encrypted with AES-256 and stored in a private vault.</p>
                            </div>
                            <button onClick={handleSubmit} disabled={submitting || !allReady} className="btn-primary"
                                    style={{ padding: '18px 28px', fontSize: '18px', borderRadius: '16px' }}>
                                {submitting          ? <span className="flex items-center gap-2"><Spinner /> Submitting…</span>
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

function CheckItem({ label, done, highlight }: { label: string; done: boolean; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm ${highlight && !done ? 'text-purple-600 font-semibold' : 'text-gray-600'}`}>{label}</span>
            <span className={`text-sm font-bold ${done ? 'text-emerald-500' : highlight ? 'text-purple-400' : 'text-gray-300'}`}>
                {done ? '✅' : highlight ? '⟳' : '○'}
            </span>
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