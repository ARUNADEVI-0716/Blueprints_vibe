import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface Doc {
    id: string
    document_type: string
    file_name: string
    file_path: string
    verified: boolean
    verified_by?: string
    verified_at?: string
    rejection_reason?: string
    created_at: string
}

interface ApplicationMeta {
    pan_number?: string
    aadhaar_number?: string
    guarantor_name?: string
    guarantor_mobile?: string
    guarantor_relation?: string
    guarantor_otp_verified?: boolean
    agreement_signed?: boolean
    agreement_signed_at?: string
}

export default function DocumentVerificationPanel({
                                                      applicationId,
                                                      token,
                                                      application: appProp,
                                                      documents: docsProp,
                                                      onRefresh,
                                                  }: {
    userId: string               // kept for call-site compatibility
    applicationId: string
    token: string
    application?: ApplicationMeta
    documents?: Doc[]
    onRefresh?: () => void
}) {
    const [documents, setDocuments]     = useState<Doc[]>(docsProp || [])
    const [application, setApplication] = useState<ApplicationMeta | null>(appProp || null)
    const [loading, setLoading]         = useState(!docsProp)
    const [rejectInput, setRejectInput] = useState<Record<string, string>>({})
    const [rejectingId, setRejectingId] = useState<string | null>(null)

    useEffect(() => {
        // If parent didn't pass docs down, fetch from the officer API.
        // Using the officer token means the service-role backend bypasses RLS —
        // this is what was broken before (panel was using anon Supabase client).
        if (!docsProp) fetchData()
    }, [applicationId])

    useEffect(() => { if (docsProp) setDocuments(docsProp) }, [docsProp])
    useEffect(() => { if (appProp)  setApplication(appProp) },  [appProp])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/applications/${applicationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to load application')
            const data = await res.json()
            setDocuments(data.documents || [])
            setApplication(data.application || null)
        } catch (err) {
            console.error('DocumentVerificationPanel:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (docId: string, verified: boolean) => {
        await fetch(`${BACKEND_URL}/api/officer/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ verified })
        })
        setDocuments(prev => prev.map(d =>
            d.id === docId ? { ...d, verified, rejection_reason: verified ? undefined : d.rejection_reason } : d
        ))
        onRefresh?.()
    }

    const handleReject = async (docId: string) => {
        const reason = rejectInput[docId]?.trim()
        if (!reason) return
        setRejectingId(docId)
        await fetch(`${BACKEND_URL}/api/officer/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ verified: false, rejectionReason: reason })
        })
        setDocuments(prev => prev.map(d =>
            d.id === docId ? { ...d, verified: false, rejection_reason: reason } : d
        ))
        setRejectInput(prev => { const n = { ...prev }; delete n[docId]; return n })
        setRejectingId(null)
        onRefresh?.()
    }

    const openDocument = async (filePath: string) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/officer/documents/signed-url-by-path`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ filePath })
            })
            const data = await res.json()
            if (data.signedUrl) window.open(data.signedUrl, '_blank')
            else alert('Could not load document.')
        } catch {
            alert('Failed to open document.')
        }
    }

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
                <p className="text-gray-400 mt-4 text-base">Loading documents…</p>
            </div>
        )
    }

    const verifiedCount = documents.filter(d => d.verified).length

    return (
        <div className="space-y-8">

            {/* Identity Numbers */}
            {application && (
                <div className="bg-white rounded-3xl p-8 border border-purple-100">
                    <h3 className="font-bold text-2xl text-gray-800 mb-6">🪪 Identity Numbers</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-purple-50 rounded-2xl p-5">
                            <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">PAN Number</p>
                            <p className="font-mono font-bold text-2xl text-gray-900">
                                {application.pan_number || <span className="text-gray-400 font-sans text-base font-normal">Not provided</span>}
                            </p>
                        </div>
                        <div className="bg-purple-50 rounded-2xl p-5">
                            <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">Aadhaar Number</p>
                            <p className="font-mono font-bold text-2xl text-gray-900">
                                {application.aadhaar_number
                                    ? `XXXX XXXX ${application.aadhaar_number.slice(-4)}`
                                    : <span className="text-gray-400 font-sans text-base font-normal">Not provided</span>}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Guarantor */}
            {application?.guarantor_name && (
                <div className="bg-white rounded-3xl p-8 border border-purple-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-2xl text-gray-800">👥 Guarantor Details</h3>
                        <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${
                            application.guarantor_otp_verified
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {application.guarantor_otp_verified ? '✅ OTP Verified' : '⏳ OTP Pending'}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { label: 'Name',     value: application.guarantor_name },
                            { label: 'Mobile',   value: application.guarantor_mobile },
                            { label: 'Relation', value: application.guarantor_relation || 'Not specified' },
                        ].map(item => (
                            <div key={item.label} className="bg-purple-50 rounded-2xl p-5">
                                <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">{item.label}</p>
                                <p className="font-bold text-xl text-gray-900">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Agreement */}
            {application && (
                <div className={`rounded-2xl px-6 py-4 flex items-center gap-4 border ${
                    application.agreement_signed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-yellow-50 border-yellow-200'
                }`}>
                    <span className="text-2xl">{application.agreement_signed ? '✍️' : '⏳'}</span>
                    <div>
                        <p className={`font-bold text-base ${application.agreement_signed ? 'text-emerald-800' : 'text-yellow-800'}`}>
                            {application.agreement_signed ? 'Loan Agreement Digitally Signed' : 'Agreement Not Yet Signed'}
                        </p>
                        {application.agreement_signed_at && (
                            <p className="text-emerald-600 text-sm">
                                Signed on {new Date(application.agreement_signed_at).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Documents list */}
            <div className="bg-white rounded-3xl p-8 border border-purple-100">
                <h3 className="font-bold text-2xl text-gray-800 mb-6">
                    📄 Uploaded Documents
                    <span className="text-base text-gray-400 font-normal ml-3">
                        {verifiedCount}/{documents.length} verified
                    </span>
                </h3>

                {documents.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-5xl mb-4">📭</p>
                        <p className="text-gray-400 text-xl font-semibold mb-2">No documents uploaded yet</p>
                        <p className="text-gray-300 text-sm">
                            The applicant hasn't submitted documents for this application yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {documents.map(doc => (
                            <div key={doc.id}
                                 className={`rounded-2xl border-2 transition-all p-6 ${
                                     doc.verified          ? 'border-emerald-200 bg-emerald-50'
                                         : doc.rejection_reason ? 'border-red-200 bg-red-50'
                                             : 'border-purple-100 bg-white'
                                 }`}>
                                <div className="flex items-start gap-6">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-lg text-gray-800 capitalize mb-1">
                                            {doc.document_type.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-gray-400 text-sm">{doc.file_name}</p>
                                        <p className="text-gray-300 text-xs mt-1">
                                            Uploaded {new Date(doc.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                        </p>
                                        {doc.verified && (
                                            <p className="text-emerald-600 text-sm font-semibold mt-2">
                                                ✅ Verified by {doc.verified_by}
                                                {doc.verified_at && ` · ${new Date(doc.verified_at).toLocaleDateString('en-IN')}`}
                                            </p>
                                        )}
                                        {doc.rejection_reason && (
                                            <p className="text-red-500 text-sm font-semibold mt-2">
                                                ❌ Rejected: {doc.rejection_reason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <button onClick={() => openDocument(doc.file_path)}
                                                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 transition-colors">
                                            👁 View
                                        </button>
                                        {!doc.verified ? (
                                            <button onClick={() => handleVerify(doc.id, true)}
                                                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-colors">
                                                ✅ Verify
                                            </button>
                                        ) : (
                                            <button onClick={() => handleVerify(doc.id, false)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                                                ↩ Unverify
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline reject input */}
                                {!doc.verified && (
                                    <div className="mt-4 flex gap-3">
                                        <input
                                            type="text"
                                            value={rejectInput[doc.id] || ''}
                                            onChange={e => setRejectInput(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                            placeholder="Rejection reason (e.g. blurry image, wrong document)…"
                                            className="flex-1 bg-white border border-red-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-red-400 placeholder:text-gray-300"
                                            onKeyDown={e => e.key === 'Enter' && rejectInput[doc.id]?.trim() && handleReject(doc.id)}
                                        />
                                        <button
                                            onClick={() => handleReject(doc.id)}
                                            disabled={!rejectInput[doc.id]?.trim() || rejectingId === doc.id}
                                            className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-40 transition-colors flex-shrink-0">
                                            {rejectingId === doc.id ? '…' : '❌ Reject'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// import { useState, useEffect } from 'react'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// interface Doc {
//     id: string
//     document_type: string
//     file_name: string
//     file_path: string
//     verified: boolean
//     verified_by?: string
//     verified_at?: string
//     rejection_reason?: string
//     created_at: string
// }
//
// interface ApplicationMeta {
//     pan_number?: string
//     aadhaar_number?: string
//     guarantor_name?: string
//     guarantor_mobile?: string
//     guarantor_relation?: string
//     guarantor_otp_verified?: boolean
//     agreement_signed?: boolean
//     agreement_signed_at?: string
// }
//
// export default function DocumentVerificationPanel({
//                                                       applicationId,
//                                                       token,
//                                                       application: appProp,
//                                                       documents: docsProp,
//                                                       onRefresh,
//                                                   }: {
//     userId: string               // kept for call-site compatibility
//     applicationId: string
//     token: string
//     application?: ApplicationMeta
//     documents?: Doc[]
//     onRefresh?: () => void
// }) {
//     const [documents, setDocuments]     = useState<Doc[]>(docsProp || [])
//     const [application, setApplication] = useState<ApplicationMeta | null>(appProp || null)
//     const [loading, setLoading]         = useState(true)
//     const [rejectInput, setRejectInput] = useState<Record<string, string>>({})
//     const [rejectingId, setRejectingId] = useState<string | null>(null)
//
//     useEffect(() => {
//         // Always fetch fresh from officer API — don't rely solely on parent props.
//         // This guarantees documents show even if the parent's data object
//         // doesn't include the documents field yet (e.g. old backend version).
//         fetchData()
//     }, [applicationId])
//
//     useEffect(() => {
//         if (docsProp && docsProp.length > 0) setDocuments(docsProp)
//     }, [docsProp])
//     useEffect(() => { if (appProp) setApplication(appProp) }, [appProp])
//
//     const fetchData = async () => {
//         setLoading(true)
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/officer/applications/${applicationId}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             })
//             if (!res.ok) throw new Error(`Officer API returned ${res.status}`)
//             const data = await res.json()
//
//             // Use documents from the API response
//             if (Array.isArray(data.documents)) {
//                 setDocuments(data.documents)
//             }
//             if (data.application) {
//                 setApplication(data.application)
//             }
//         } catch (err) {
//             console.error('DocumentVerificationPanel fetch error:', err)
//         } finally {
//             setLoading(false)
//         }
//     }
//
//     const handleVerify = async (docId: string, verified: boolean) => {
//         await fetch(`${BACKEND_URL}/api/officer/documents/${docId}`, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//             body: JSON.stringify({ verified })
//         })
//         setDocuments(prev => prev.map(d =>
//             d.id === docId ? { ...d, verified, rejection_reason: verified ? undefined : d.rejection_reason } : d
//         ))
//         onRefresh?.()
//     }
//
//     const handleReject = async (docId: string) => {
//         const reason = rejectInput[docId]?.trim()
//         if (!reason) return
//         setRejectingId(docId)
//         await fetch(`${BACKEND_URL}/api/officer/documents/${docId}`, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//             body: JSON.stringify({ verified: false, rejectionReason: reason })
//         })
//         setDocuments(prev => prev.map(d =>
//             d.id === docId ? { ...d, verified: false, rejection_reason: reason } : d
//         ))
//         setRejectInput(prev => { const n = { ...prev }; delete n[docId]; return n })
//         setRejectingId(null)
//         onRefresh?.()
//     }
//
//     const openDocument = async (filePath: string) => {
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/officer/documents/signed-url-by-path`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//                 body: JSON.stringify({ filePath })
//             })
//             const data = await res.json()
//             if (data.signedUrl) window.open(data.signedUrl, '_blank')
//             else alert('Could not load document.')
//         } catch {
//             alert('Failed to open document.')
//         }
//     }
//
//     if (loading) {
//         return (
//             <div className="text-center py-16">
//                 <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
//                 <p className="text-gray-400 mt-4 text-base">Loading documents…</p>
//             </div>
//         )
//     }
//
//     const verifiedCount = documents.filter(d => d.verified).length
//
//     return (
//         <div className="space-y-8">
//
//             {/* Identity Numbers */}
//             {application && (
//                 <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                     <h3 className="font-bold text-2xl text-gray-800 mb-6">🪪 Identity Numbers</h3>
//                     <div className="grid grid-cols-2 gap-6">
//                         <div className="bg-purple-50 rounded-2xl p-5">
//                             <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">PAN Number</p>
//                             <p className="font-mono font-bold text-2xl text-gray-900">
//                                 {application.pan_number || <span className="text-gray-400 font-sans text-base font-normal">Not provided</span>}
//                             </p>
//                         </div>
//                         <div className="bg-purple-50 rounded-2xl p-5">
//                             <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">Aadhaar Number</p>
//                             <p className="font-mono font-bold text-2xl text-gray-900">
//                                 {application.aadhaar_number
//                                     ? `XXXX XXXX ${application.aadhaar_number.slice(-4)}`
//                                     : <span className="text-gray-400 font-sans text-base font-normal">Not provided</span>}
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             )}
//
//             {/* Guarantor */}
//             {application?.guarantor_name && (
//                 <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                     <div className="flex items-center justify-between mb-6">
//                         <h3 className="font-bold text-2xl text-gray-800">👥 Guarantor Details</h3>
//                         <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${
//                             application.guarantor_otp_verified
//                                 ? 'bg-emerald-100 text-emerald-700'
//                                 : 'bg-yellow-100 text-yellow-700'
//                         }`}>
//                             {application.guarantor_otp_verified ? '✅ OTP Verified' : '⏳ OTP Pending'}
//                         </span>
//                     </div>
//                     <div className="grid grid-cols-3 gap-6">
//                         {[
//                             { label: 'Name',     value: application.guarantor_name },
//                             { label: 'Mobile',   value: application.guarantor_mobile },
//                             { label: 'Relation', value: application.guarantor_relation || 'Not specified' },
//                         ].map(item => (
//                             <div key={item.label} className="bg-purple-50 rounded-2xl p-5">
//                                 <p className="text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">{item.label}</p>
//                                 <p className="font-bold text-xl text-gray-900">{item.value}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}
//
//             {/* Agreement */}
//             {application && (
//                 <div className={`rounded-2xl px-6 py-4 flex items-center gap-4 border ${
//                     application.agreement_signed
//                         ? 'bg-emerald-50 border-emerald-200'
//                         : 'bg-yellow-50 border-yellow-200'
//                 }`}>
//                     <span className="text-2xl">{application.agreement_signed ? '✍️' : '⏳'}</span>
//                     <div>
//                         <p className={`font-bold text-base ${application.agreement_signed ? 'text-emerald-800' : 'text-yellow-800'}`}>
//                             {application.agreement_signed ? 'Loan Agreement Digitally Signed' : 'Agreement Not Yet Signed'}
//                         </p>
//                         {application.agreement_signed_at && (
//                             <p className="text-emerald-600 text-sm">
//                                 Signed on {new Date(application.agreement_signed_at).toLocaleString('en-IN')}
//                             </p>
//                         )}
//                     </div>
//                 </div>
//             )}
//
//             {/* Documents list */}
//             <div className="bg-white rounded-3xl p-8 border border-purple-100">
//                 <h3 className="font-bold text-2xl text-gray-800 mb-6">
//                     📄 Uploaded Documents
//                     <span className="text-base text-gray-400 font-normal ml-3">
//                         {verifiedCount}/{documents.length} verified
//                     </span>
//                 </h3>
//
//                 {documents.length === 0 ? (
//                     <div className="text-center py-12">
//                         <p className="text-5xl mb-4">📭</p>
//                         <p className="text-gray-400 text-xl font-semibold mb-2">No documents uploaded yet</p>
//                         <p className="text-gray-300 text-sm mb-6">
//                             The applicant hasn't submitted documents, or they were saved without a linked application ID.
//                         </p>
//                         <button
//                             onClick={fetchData}
//                             className="px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 transition-colors">
//                             🔄 Retry fetch
//                         </button>
//                         <p className="text-gray-300 text-xs mt-4">
//                             Application ID: {applicationId || 'missing'}
//                         </p>
//                     </div>
//                 ) : (
//                     <div className="space-y-4">
//                         {documents.map(doc => (
//                             <div key={doc.id}
//                                  className={`rounded-2xl border-2 transition-all p-6 ${
//                                      doc.verified          ? 'border-emerald-200 bg-emerald-50'
//                                          : doc.rejection_reason ? 'border-red-200 bg-red-50'
//                                              : 'border-purple-100 bg-white'
//                                  }`}>
//                                 <div className="flex items-start gap-6">
//                                     <div className="flex-1 min-w-0">
//                                         <p className="font-bold text-lg text-gray-800 capitalize mb-1">
//                                             {doc.document_type.replace(/_/g, ' ')}
//                                         </p>
//                                         <p className="text-gray-400 text-sm">{doc.file_name}</p>
//                                         <p className="text-gray-300 text-xs mt-1">
//                                             Uploaded {new Date(doc.created_at).toLocaleDateString('en-IN', {
//                                             day: 'numeric', month: 'short', year: 'numeric'
//                                         })}
//                                         </p>
//                                         {doc.verified && (
//                                             <p className="text-emerald-600 text-sm font-semibold mt-2">
//                                                 ✅ Verified by {doc.verified_by}
//                                                 {doc.verified_at && ` · ${new Date(doc.verified_at).toLocaleDateString('en-IN')}`}
//                                             </p>
//                                         )}
//                                         {doc.rejection_reason && (
//                                             <p className="text-red-500 text-sm font-semibold mt-2">
//                                                 ❌ Rejected: {doc.rejection_reason}
//                                             </p>
//                                         )}
//                                     </div>
//
//                                     <div className="flex items-center gap-3 flex-shrink-0">
//                                         <button onClick={() => openDocument(doc.file_path)}
//                                                 className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 transition-colors">
//                                             👁 View
//                                         </button>
//                                         {!doc.verified ? (
//                                             <button onClick={() => handleVerify(doc.id, true)}
//                                                     className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-colors">
//                                                 ✅ Verify
//                                             </button>
//                                         ) : (
//                                             <button onClick={() => handleVerify(doc.id, false)}
//                                                     className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
//                                                 ↩ Unverify
//                                             </button>
//                                         )}
//                                     </div>
//                                 </div>
//
//                                 {/* Inline reject input */}
//                                 {!doc.verified && (
//                                     <div className="mt-4 flex gap-3">
//                                         <input
//                                             type="text"
//                                             value={rejectInput[doc.id] || ''}
//                                             onChange={e => setRejectInput(prev => ({ ...prev, [doc.id]: e.target.value }))}
//                                             placeholder="Rejection reason (e.g. blurry image, wrong document)…"
//                                             className="flex-1 bg-white border border-red-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-red-400 placeholder:text-gray-300"
//                                             onKeyDown={e => e.key === 'Enter' && rejectInput[doc.id]?.trim() && handleReject(doc.id)}
//                                         />
//                                         <button
//                                             onClick={() => handleReject(doc.id)}
//                                             disabled={!rejectInput[doc.id]?.trim() || rejectingId === doc.id}
//                                             className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-40 transition-colors flex-shrink-0">
//                                             {rejectingId === doc.id ? '…' : '❌ Reject'}
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }
//
