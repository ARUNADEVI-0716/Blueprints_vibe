// import { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '@/context/AuthContext'
//
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
//
// export default function ConnectBankPage() {
//     const { user, session } = useAuth()
//     const navigate = useNavigate()
//
//     const [loading, setLoading] = useState(false)
//     const [linkLoading, setLinkLoading] = useState(false)
//     const [connected, setConnected] = useState(false)
//     const [bankInfo, setBankInfo] = useState<{ institution: string; accounts: number; transactions: number } | null>(null)
//     const [error, setError] = useState('')
//     const [step, setStep] = useState<'intro' | 'connecting' | 'analyzing' | 'done'>('intro')
//
//     const fullName = user?.user_metadata?.full_name ?? ''
//     const isNewUser = !user?.user_metadata?.role
//
//     // Check if already connected
//     useEffect(() => {
//         checkBankConnection()
//     }, [])
//
//     const checkBankConnection = async () => {
//         try {
//             const res = await fetch(`${BACKEND_URL}/api/plaid/bank-summary`, {
//                 headers: { Authorization: `Bearer ${session?.access_token}` }
//             })
//             const data = await res.json()
//             if (data.connected) {
//                 setConnected(true)
//                 setBankInfo({
//                     institution: data.institution,
//                     accounts: data.accounts?.length || 0,
//                     transactions: data.transactions?.length || 0
//                 })
//             }
//         } catch {
//             // Not connected yet
//         }
//     }
//
//     const handleConnectBank = async () => {
//         setLinkLoading(true)
//         setError('')
//
//         try {
//             // Step 1 — Get link token from backend
//             const tokenRes = await fetch(`${BACKEND_URL}/api/plaid/create-link-token`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     Authorization: `Bearer ${session?.access_token}`
//                 }
//             })
//             const { link_token, error: tokenError } = await tokenRes.json()
//             if (tokenError) throw new Error(tokenError)
//
//             // Step 2 — Load Plaid Link script dynamically
//             await loadPlaidScript()
//
//             // Step 3 — Open Plaid Link
//             const handler = (window as any).Plaid.create({
//                 token: link_token,
//                 onSuccess: async (public_token: string, metadata: any) => {
//                     setStep('connecting')
//                     setLinkLoading(false)
//
//                     try {
//                         // Exchange token
//                         const exchangeRes = await fetch(`${BACKEND_URL}/api/plaid/exchange-token`, {
//                             method: 'POST',
//                             headers: {
//                                 'Content-Type': 'application/json',
//                                 Authorization: `Bearer ${session?.access_token}`
//                             },
//                             body: JSON.stringify({
//                                 public_token,
//                                 institution_name: metadata.institution?.name || 'Unknown Bank'
//                             })
//                         })
//
//                         const exchangeData = await exchangeRes.json()
//                         if (!exchangeData.success) throw new Error('Failed to connect bank')
//
//                         setStep('analyzing')
//
//                         // Calculate credit score
//                         await fetch(`${BACKEND_URL}/api/credit/calculate`, {
//                             method: 'POST',
//                             headers: {
//                                 'Content-Type': 'application/json',
//                                 Authorization: `Bearer ${session?.access_token}`
//                             }
//                         })
//
//                         // Simulate analysis time for UX
//                         await new Promise(r => setTimeout(r, 2000))
//
//                         setStep('done')
//                         setBankInfo({
//                             institution: metadata.institution?.name || 'Test Bank',
//                             accounts: exchangeData.accounts,
//                             transactions: exchangeData.transactions
//                         })
//                         setConnected(true)
//
//                     } catch (err: any) {
//                         setError(err.message)
//                         setStep('intro')
//                     }
//                 },
//                 onExit: (err: any) => {
//                     setLinkLoading(false)
//                     if (err) setError('Bank connection cancelled.')
//                 },
//                 onLoad: () => setLinkLoading(false),
//             })
//
//             handler.open()
//
//         } catch (err: any) {
//             setError(err.message || 'Failed to initialize bank connection')
//             setLinkLoading(false)
//         }
//     }
//
//     const loadPlaidScript = (): Promise<void> => {
//         return new Promise((resolve, reject) => {
//             if ((window as any).Plaid) { resolve(); return }
//             const script = document.createElement('script')
//             script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
//             script.onload = () => resolve()
//             script.onerror = () => reject(new Error('Failed to load Plaid'))
//             document.head.appendChild(script)
//         })
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
//                     </div>
//                     <button onClick={() => navigate('/dashboard')}
//                             className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors flex items-center gap-2">
//                         <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
//                             <path d="M8 2L4 6.5 8 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
//                         </svg>
//                         Back to Dashboard
//                     </button>
//                 </div>
//             </nav>
//
//             <main className="max-w-4xl mx-auto px-10 py-16">
//
//                 {/* ── STEP: Intro ── */}
//                 {step === 'intro' && !connected && (
//                     <>
//                         <div className="text-center mb-14">
//                             <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8">
//                                 🏦
//                             </div>
//                             <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-4">
//                                 {isNewUser ? 'Cold Start Assessment' : 'Bank Verification'}
//                             </p>
//                             <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-5">
//                                 Connect Your Bank
//                             </h1>
//                             <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
//                                 {isNewUser
//                                     ? "No credit history? No problem. We securely analyze your real banking data to build a fair credit profile — automatically."
//                                     : "Connect your bank so our AI can analyze your latest transactions and generate an updated credit score."}
//                             </p>
//                         </div>
//
//                         {/* Why we need this */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
//                             {[
//                                 { icon: '🔒', title: 'Bank-grade Security', desc: 'Powered by Plaid. Read-only access. We never store your credentials.' },
//                                 { icon: '🤖', title: 'AI Analysis', desc: 'Our engine analyzes spending patterns, income signals and transaction regularity.' },
//                                 { icon: '⚡', title: 'Instant Score', desc: 'Get your credit score calculated in under 10 seconds after connecting.' },
//                             ].map(f => (
//                                 <div key={f.title} className="bg-white rounded-3xl p-8 border border-purple-100 text-center hover:border-purple-300 transition-all">
//                                     <div className="text-4xl mb-4">{f.icon}</div>
//                                     <p className="font-bold text-gray-800 text-xl mb-2">{f.title}</p>
//                                     <p className="text-gray-400 text-base leading-relaxed">{f.desc}</p>
//                                 </div>
//                             ))}
//                         </div>
//
//                         {/* Cold start notice */}
//                         {isNewUser && (
//                             <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 mb-10 flex items-start gap-5">
//                                 <span className="text-4xl flex-shrink-0">🌟</span>
//                                 <div>
//                                     <p className="font-bold text-blue-800 text-xl mb-2">You're a Cold Start Applicant</p>
//                                     <p className="text-blue-600 text-lg leading-relaxed">
//                                         Our Credit-Vision engine is specifically designed for people without formal credit history.
//                                         Your bank transactions, balance patterns, and spending behavior will be used to generate
//                                         a fair and transparent credit score.
//                                     </p>
//                                 </div>
//                             </div>
//                         )}
//
//                         {error && (
//                             <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-lg rounded-2xl px-6 py-4 mb-8">
//                                 <span>⚠️</span> {error}
//                             </div>
//                         )}
//
//                         <div className="text-center">
//                             <button onClick={handleConnectBank} disabled={linkLoading}
//                                     className="btn-primary inline-flex items-center gap-3"
//                                     style={{ width: 'auto', padding: '20px 48px', fontSize: '20px', borderRadius: '18px' }}>
//                                 {linkLoading ? (
//                                     <><Spinner /> Initializing…</>
//                                 ) : (
//                                     <><span>🔗</span> Connect Bank Account</>
//                                 )}
//                             </button>
//                             <p className="text-gray-400 text-base mt-4">
//                                 Secured by Plaid · Read-only access · No credentials stored
//                             </p>
//                         </div>
//                     </>
//                 )}
//
//                 {/* ── STEP: Connecting ── */}
//                 {step === 'connecting' && (
//                     <div className="text-center py-20">
//                         <div className="w-24 h-24 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto mb-10" />
//                         <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">Connecting to your bank…</h2>
//                         <p className="text-gray-400 text-xl">Securely fetching your accounts and transactions</p>
//                     </div>
//                 )}
//
//                 {/* ── STEP: Analyzing ── */}
//                 {step === 'analyzing' && (
//                     <div className="text-center py-20">
//                         <div className="text-7xl mb-8 animate-pulse">🤖</div>
//                         <h2 className="font-display font-bold text-4xl text-gray-900 mb-4">AI Analysis in Progress…</h2>
//                         <p className="text-gray-400 text-xl mb-10">Our Credit-Vision engine is analyzing your financial profile</p>
//                         <div className="max-w-md mx-auto space-y-4">
//                             {[
//                                 'Analyzing transaction regularity…',
//                                 'Calculating income signals…',
//                                 'Evaluating spending patterns…',
//                                 'Generating credit score…',
//                             ].map((msg, i) => (
//                                 <div key={i} className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-purple-100 text-left">
//                                     <div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin flex-shrink-0" />
//                                     <span className="text-gray-600 text-base font-medium">{msg}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}
//
//                 {/* ── STEP: Done / Already Connected ── */}
//                 {(step === 'done' || connected) && bankInfo && (
//                     <div className="text-center">
//                         <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8">
//                             ✅
//                         </div>
//                         <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">Bank Connected!</h2>
//                         <p className="text-gray-400 text-xl mb-12">
//                             Your financial profile has been analyzed successfully
//                         </p>
//
//                         {/* Stats */}
//                         <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
//                             {[
//                                 { label: 'Institution', value: bankInfo.institution },
//                                 { label: 'Accounts Found', value: bankInfo.accounts.toString() },
//                                 { label: 'Transactions', value: bankInfo.transactions.toString() },
//                             ].map(s => (
//                                 <div key={s.label} className="bg-white rounded-2xl p-6 border border-purple-100">
//                                     <p className="text-3xl font-bold text-purple-600 mb-2">{s.value}</p>
//                                     <p className="text-gray-400 text-base font-medium">{s.label}</p>
//                                 </div>
//                             ))}
//                         </div>
//                         {/* Add this BEFORE the connect button in the intro step */}
//                         <div className="text-center mt-6">
//                             <p className="text-gray-400 text-base">
//                                 Don't have a bank account?{' '}
//                                 <button onClick={() => navigate('/alternative-signals')}
//                                         className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
//                                     Use alternative signals instead →
//                                 </button>
//                             </p>
//                         </div>
//                         <div className="flex items-center justify-center gap-4 flex-wrap">
//                             <button onClick={() => navigate('/credit-score')}
//                                     className="btn-primary inline-flex items-center gap-3"
//                                     style={{ width: 'auto', padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
//                                 View My Credit Score →
//                             </button>
//                             <button onClick={() => navigate('/apply-loan')}
//                                     className="bg-white hover:bg-purple-50 text-purple-700 font-bold text-lg px-10 py-4 rounded-2xl border border-purple-200 transition-all">
//                                 Apply for a Loan →
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//     )
// }
//
// function Spinner() {
//     return (
//         <svg width="20" height="20" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
//             <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
//             <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
//         </svg>
//     )
// }
//
//


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export default function ConnectBankPage() {
    const { user, session } = useAuth()
    const navigate = useNavigate()
    const [linkLoading, setLinkLoading] = useState(false)
    const [connected, setConnected]     = useState(false)
    const [bankInfo, setBankInfo]       = useState<{ institution: string; accounts: number; transactions: number } | null>(null)
    const [error, setError]             = useState('')
    const [step, setStep]               = useState<'intro' | 'connecting' | 'analyzing' | 'done'>('intro')
    const isNewUser = !user?.user_metadata?.role

    useEffect(() => { checkBankConnection() }, [])

    const checkBankConnection = async () => {
        try {
            const res  = await fetch(`${BACKEND_URL}/api/plaid/bank-summary`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
            const data = await res.json()
            if (data.connected) { setConnected(true); setBankInfo({ institution: data.institution, accounts: data.accounts?.length || 0, transactions: data.transactions?.length || 0 }) }
        } catch {}
    }

    const handleConnectBank = async () => {
        setLinkLoading(true); setError('')
        try {
            const tokenRes = await fetch(`${BACKEND_URL}/api/plaid/create-link-token`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` } })
            const { link_token, error: tokenError } = await tokenRes.json()
            if (tokenError) throw new Error(tokenError)
            await loadPlaidScript()
            const handler = (window as any).Plaid.create({
                token: link_token,
                onSuccess: async (public_token: string, metadata: any) => {
                    setStep('connecting'); setLinkLoading(false)
                    try {
                        const exchangeRes  = await fetch(`${BACKEND_URL}/api/plaid/exchange-token`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ public_token, institution_name: metadata.institution?.name || 'Unknown Bank' }) })
                        const exchangeData = await exchangeRes.json()
                        if (!exchangeData.success) throw new Error('Failed to connect bank')
                        setStep('analyzing')
                        await fetch(`${BACKEND_URL}/api/credit/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` } })
                        await new Promise(r => setTimeout(r, 2000))
                        setStep('done'); setBankInfo({ institution: metadata.institution?.name || 'Test Bank', accounts: exchangeData.accounts, transactions: exchangeData.transactions }); setConnected(true)
                    } catch (err: any) { setError(err.message); setStep('intro') }
                },
                onExit: (err: any) => { setLinkLoading(false); if (err) setError('Bank connection cancelled.') },
                onLoad: () => setLinkLoading(false),
            })
            handler.open()
        } catch (err: any) { setError(err.message || 'Failed to initialize bank connection'); setLinkLoading(false) }
    }

    const loadPlaidScript = (): Promise<void> => new Promise((resolve, reject) => {
        if ((window as any).Plaid) { resolve(); return }
        const script   = document.createElement('script')
        script.src     = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
        script.onload  = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Plaid'))
        document.head.appendChild(script)
    })

    const Navbar = () => (
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
                </div>
                <button onClick={() => navigate('/dashboard')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ← Back to Dashboard
                </button>
            </div>
        </nav>
    )

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>
            <Navbar/>

            <main style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px' }}>

                {/* Intro */}
                {step === 'intro' && !connected && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ width: 72, height: 72, background: '#eef4ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>🏦</div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                                {isNewUser ? 'Cold Start Assessment' : 'Bank Verification'}
                            </p>
                            <h1 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)', color: '#001736', letterSpacing: '-1.5px', marginBottom: 16 }}>Connect Your Bank</h1>
                            <p style={{ fontSize: 16, color: '#43474f', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
                                {isNewUser
                                    ? 'No credit history? No problem. We securely analyze your real banking data to build a fair credit profile.'
                                    : 'Connect your bank so our AI can analyze your latest transactions and generate an updated credit score.'}
                            </p>
                        </div>

                        {/* Features */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
                            {[
                                { icon: '🔒', title: 'Bank-grade Security', desc: 'Powered by Plaid. Read-only access. We never store your credentials.' },
                                { icon: '🤖', title: 'AI Analysis',         desc: 'Our engine analyzes spending patterns, income signals and transaction regularity.' },
                                { icon: '⚡', title: 'Instant Score',       desc: 'Get your credit score calculated in under 10 seconds after connecting.' },
                            ].map(f => (
                                <div key={f.title} style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #e0e3e5', textAlign: 'center', transition: 'all 0.2s' }}
                                     onMouseEnter={e => (e.currentTarget.style.borderColor = '#a4c9ff')}
                                     onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e3e5')}>
                                    <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                                    <p style={{ fontWeight: 700, fontSize: 14, color: '#001736', marginBottom: 6 }}>{f.title}</p>
                                    <p style={{ fontSize: 12, color: '#43474f', lineHeight: 1.6 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Cold start notice */}
                        {isNewUser && (
                            <div style={{ background: '#eef4ff', border: '1px solid #a4c9ff', borderRadius: 12, padding: '20px 24px', marginBottom: 32, display: 'flex', gap: 16 }}>
                                <span style={{ fontSize: 28, flexShrink: 0 }}>🌟</span>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 15, color: '#001736', marginBottom: 4 }}>You're a Cold Start Applicant</p>
                                    <p style={{ fontSize: 13, color: '#43474f', lineHeight: 1.6 }}>Our Credit-Vision engine is specifically designed for people without formal credit history. Your bank transactions, balance patterns, and spending behavior will be used to generate a fair and transparent credit score.</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 24, fontSize: 14 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                            <button onClick={handleConnectBank} disabled={linkLoading}
                                    style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 12, padding: '16px 40px', fontWeight: 800, fontSize: 16, cursor: linkLoading ? 'not-allowed' : 'pointer', opacity: linkLoading ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                                    onMouseEnter={e => !linkLoading && (e.currentTarget.style.background = '#002b5b')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '#001736')}>
                                {linkLoading ? <><Spinner/> Initializing…</> : <>🔗 Connect Bank Account</>}
                            </button>
                            <p style={{ fontSize: 12, color: '#c4c6d0', marginTop: 12 }}>Secured by Plaid · Read-only access · No credentials stored</p>
                        </div>
                    </>
                )}

                {/* Connecting */}
                {step === 'connecting' && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ width: 52, height: 52, border: '3px solid #e0e3e5', borderTopColor: '#001736', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }}/>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                        <h2 style={{ fontWeight: 900, fontSize: 28, color: '#001736', marginBottom: 8 }}>Connecting to your bank…</h2>
                        <p style={{ fontSize: 15, color: '#43474f' }}>Securely fetching your accounts and transactions</p>
                    </div>
                )}

                {/* Analyzing */}
                {step === 'analyzing' && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: 56, marginBottom: 24 }}>🤖</div>
                        <h2 style={{ fontWeight: 900, fontSize: 28, color: '#001736', marginBottom: 8 }}>AI Analysis in Progress…</h2>
                        <p style={{ fontSize: 15, color: '#43474f', marginBottom: 32 }}>Our Credit-Vision engine is analyzing your financial profile</p>
                        <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {['Analyzing transaction regularity…', 'Calculating income signals…', 'Evaluating spending patterns…', 'Generating credit score…'].map((msg, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 10, padding: '12px 16px', border: '1px solid #e0e3e5', textAlign: 'left' }}>
                                    <div style={{ width: 16, height: 16, border: '2px solid #0060ac', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}/>
                                    <span style={{ fontSize: 13, color: '#43474f' }}>{msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Done */}
                {(step === 'done' || connected) && bankInfo && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 72, height: 72, background: '#f0fdf4', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>✅</div>
                        <h2 style={{ fontWeight: 900, fontSize: 36, color: '#001736', marginBottom: 8, letterSpacing: '-1px' }}>Bank Connected!</h2>
                        <p style={{ fontSize: 15, color: '#43474f', marginBottom: 36 }}>Your financial profile has been analyzed successfully</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
                            {[
                                { label: 'Institution', value: bankInfo.institution },
                                { label: 'Accounts',    value: bankInfo.accounts.toString() },
                                { label: 'Transactions', value: bankInfo.transactions.toString() },
                            ].map(s => (
                                <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e0e3e5', textAlign: 'center' }}>
                                    <p style={{ fontWeight: 900, fontSize: 22, color: '#0060ac', marginBottom: 4 }}>{s.value}</p>
                                    <p style={{ fontSize: 12, color: '#747780' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/credit-score')}
                                    style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 10, padding: '13px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                                View My Credit Score →
                            </button>
                            <button onClick={() => navigate('/apply-loan')}
                                    style={{ background: 'white', color: '#001736', border: '1.5px solid #e0e3e5', borderRadius: 10, padding: '13px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                                Apply for a Loan →
                            </button>
                        </div>
                    </div>
                )}
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