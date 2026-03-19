// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { supabase } from '@/lib/supabaseClient'
//
// export default function LandingPage() {
//     const [stats, setStats] = useState({
//         totalLoans:     0,
//         totalDisbursed: 0,
//         approvalRate:   0,
//         activeUsers:    0,
//     })
//     const [statsLoading, setStatsLoading] = useState(true)
//     const [displayStats, setDisplayStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
//
//     // Fetch live platform stats from Supabase
//     const fetchStats = async () => {
//         try {
//             const { data: apps } = await supabase
//                 .from('loan_applications')
//                 .select('status, amount')
//                 .neq('status', 'draft')
//
//             if (!apps) return
//
//             const total    = apps.length
//             const approved = apps.filter(a => a.status === 'approved' || a.status === 'repaid').length
//             const rejected = apps.filter(a => a.status === 'rejected').length
//             const decided  = approved + rejected
//             const disbursed = apps
//                 .filter(a => a.status === 'approved' || a.status === 'repaid')
//                 .reduce((s, a) => s + (Number(a.amount) || 0), 0)
//
//             const { count: userCount } = await supabase
//                 .from('profiles')
//                 .select('id', { count: 'exact', head: true })
//
//             setStats({
//                 totalLoans:     total,
//                 totalDisbursed: disbursed,
//                 approvalRate:   decided > 0 ? Math.round((approved / decided) * 100) : 0,
//                 activeUsers:    userCount || 0,
//             })
//         } catch {
//             // Silent — landing page works without stats
//         } finally {
//             setStatsLoading(false)
//         }
//     }
//
//     // Animate numbers counting up
//     useEffect(() => {
//         if (statsLoading) return
//         const duration = 1500
//         const start    = performance.now()
//         const from     = displayStats
//
//         const tick = (now: number) => {
//             const p = Math.min((now - start) / duration, 1)
//             const ease = 1 - Math.pow(1 - p, 3)
//             setDisplayStats({
//                 totalLoans:     Math.round(from.totalLoans     + (stats.totalLoans     - from.totalLoans)     * ease),
//                 totalDisbursed: Math.round(from.totalDisbursed + (stats.totalDisbursed - from.totalDisbursed) * ease),
//                 approvalRate:   Math.round(from.approvalRate   + (stats.approvalRate   - from.approvalRate)   * ease),
//                 activeUsers:    Math.round(from.activeUsers    + (stats.activeUsers    - from.activeUsers)    * ease),
//             })
//             if (p < 1) requestAnimationFrame(tick)
//         }
//         requestAnimationFrame(tick)
//     }, [statsLoading, stats])
//
//     useEffect(() => {
//         fetchStats()
//
//         // Realtime: update stats when new applications come in
//         const channel = supabase
//             .channel('landing_stats')
//             .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' },
//                 () => fetchStats())
//             .subscribe()
//
//         return () => { supabase.removeChannel(channel) }
//     }, [])
//
//     const formatAmount = (n: number) => {
//         if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
//         if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
//         if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
//         return `₹${n}`
//     }
//
//     return (
//         <div style={{ minHeight: '100vh', width: '100vw', background: '#f0eeff' }}>
//
//             {/* Navbar */}
//             <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
//                 <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '80px' }}>
//                     <div className="flex items-center gap-4">
//                         <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
//                             <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
//                                 <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
//                                 <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
//                                 <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
//                                 <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
//                             </svg>
//                         </div>
//                         <span className="font-display font-bold text-purple-900 text-3xl tracking-tight">Nexus</span>
//                     </div>
//                     <div className="flex items-center gap-4">
//                         <Link to="/login"
//                               className="text-base text-gray-500 hover:text-purple-600 font-semibold transition-colors">
//                             Sign in
//                         </Link>
//                         <Link to="/get-started"
//                               className="text-base bg-purple-600 hover:bg-purple-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
//                               style={{ boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}>
//                             Get Started →
//                         </Link>
//                     </div>
//                 </div>
//             </nav>
//
//             <main className="max-w-6xl mx-auto px-10 pt-36 pb-28 text-center">
//
//                 {/* Live badge */}
//                 <div className="inline-flex items-center gap-3 bg-purple-100 border border-purple-200 text-purple-600 text-base font-bold px-8 py-3.5 rounded-full mb-14 tracking-widest uppercase">
//                     <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"/>
//                     AI-Powered Lending Platform
//                 </div>
//
//                 {/* Headline */}
//                 <h1 className="font-display font-bold tracking-tight mb-12">
//                     <span className="block text-7xl lg:text-9xl text-gray-900 mb-4">Smart Lending.</span>
//                     <span className="block text-7xl lg:text-9xl text-purple-600">Zero Guesswork.</span>
//                 </h1>
//
//                 <p className="text-gray-500 text-2xl leading-relaxed max-w-3xl mx-auto mb-16">
//                     Nexus uses real bank data and AI to deliver instant, fair loan
//                     decisions — no paperwork, no waiting, no hassle.
//                 </p>
//
//                 {/* CTA */}
//                 <div className="flex items-center justify-center gap-6 flex-wrap mb-24">
//                     <Link to="/get-started"
//                           className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-14 py-5 rounded-2xl transition-all hover:shadow-xl hover:shadow-purple-200">
//                         Apply for a Loan
//                     </Link>
//                     <Link to="/get-started"
//                           className="bg-white hover:bg-purple-50 text-purple-700 font-bold text-xl px-14 py-5 rounded-2xl border border-purple-200 transition-all">
//                         How it works ↓
//                     </Link>
//                 </div>
//
//                 {/* Live stats bar */}
//                 <div className="bg-white rounded-3xl border border-purple-100 p-8 mb-24 grid grid-cols-2 md:grid-cols-4 gap-6"
//                      style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.07)' }}>
//                     {[
//                         {
//                             label: 'Loans Processed',
//                             value: statsLoading ? '—' : displayStats.totalLoans.toLocaleString('en-IN'),
//                             sub:   'total applications',
//                             icon:  '📋'
//                         },
//                         {
//                             label: 'Amount Disbursed',
//                             value: statsLoading ? '—' : formatAmount(displayStats.totalDisbursed),
//                             sub:   'across all loans',
//                             icon:  '💰'
//                         },
//                         {
//                             label: 'Approval Rate',
//                             value: statsLoading ? '—' : `${displayStats.approvalRate}%`,
//                             sub:   'of decided applications',
//                             icon:  '✅'
//                         },
//                         {
//                             label: 'Active Users',
//                             value: statsLoading ? '—' : displayStats.activeUsers.toLocaleString('en-IN'),
//                             sub:   'registered borrowers',
//                             icon:  '👤'
//                         },
//                     ].map(s => (
//                         <div key={s.label} className="text-center">
//                             <p className="text-3xl mb-2">{s.icon}</p>
//                             <p className="font-display font-bold text-4xl text-purple-700 mb-1">
//                                 {s.value}
//                             </p>
//                             <p className="text-sm font-semibold text-gray-500">{s.label}</p>
//                             <p className="text-xs text-gray-300 mt-0.5">{s.sub}</p>
//                         </div>
//                     ))}
//                     <div className="col-span-2 md:col-span-4 flex items-center justify-center gap-2 pt-2 border-t border-purple-50 mt-2">
//                         <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
//                         <span className="text-xs text-gray-400 font-medium">Live data — updates in real time</span>
//                     </div>
//                 </div>
//             </main>
//
//             {/* Features */}
//             <section className="max-w-7xl mx-auto px-10 pb-36">
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                     {[
//                         { icon: '🏦', title: 'Bank-grade security',  desc: '256-bit TLS encryption. Read-only Plaid access. Your money never moves without your OTP.' },
//                         { icon: '⚡', title: 'AI-powered scoring',   desc: 'XGBoost ML model trained on repayment data. Transparent, explainable credit decisions.' },
//                         { icon: '🎯', title: 'Instant decisions',    desc: 'Credit analysis in seconds. Officer review within 24 hours. Funds disbursed via Stripe.' },
//                     ].map(f => (
//                         <div key={f.title}
//                              className="bg-white border border-purple-100 rounded-3xl p-10 flex items-start gap-6 hover:border-purple-300 transition-all hover:shadow-xl hover:shadow-purple-50">
//                             <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
//                                 {f.icon}
//                             </div>
//                             <div>
//                                 <p className="text-gray-800 font-bold text-2xl mb-3">{f.title}</p>
//                                 <p className="text-gray-400 text-lg leading-relaxed">{f.desc}</p>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </section>
//
//             {/* Footer */}
//             <footer className="border-t border-purple-100 py-10 bg-white">
//                 <p className="text-center text-base text-gray-400">© 2026 Nexus. All rights reserved.</p>
//             </footer>
//         </div>
//     )
// }
//
//
//

// import { useState, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { supabase } from '@/lib/supabaseClient'
//
// export default function LandingPage() {
//     const navigate = useNavigate()
//     const [stats, setStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
//     const [displayStats, setDisplayStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
//     const [statsLoading, setStatsLoading] = useState(true)
//
//     const fetchStats = async () => {
//         try {
//             const { data: apps } = await supabase
//                 .from('loan_applications')
//                 .select('status, amount')
//                 .neq('status', 'draft')
//
//             if (!apps) return
//
//             const total     = apps.length
//             const approved  = apps.filter(a => a.status === 'approved' || a.status === 'repaid').length
//             const rejected  = apps.filter(a => a.status === 'rejected').length
//             const decided   = approved + rejected
//             const disbursed = apps
//                 .filter(a => a.status === 'approved' || a.status === 'repaid')
//                 .reduce((s, a) => s + (Number(a.amount) || 0), 0)
//
//             const { count: userCount } = await supabase
//                 .from('profiles')
//                 .select('id', { count: 'exact', head: true })
//
//             setStats({
//                 totalLoans:     total,
//                 totalDisbursed: disbursed,
//                 approvalRate:   decided > 0 ? Math.round((approved / decided) * 100) : 0,
//                 activeUsers:    userCount || 0,
//             })
//         } catch {
//             // Silent
//         } finally {
//             setStatsLoading(false)
//         }
//     }
//
//     useEffect(() => {
//         if (statsLoading) return
//         const duration = 1800
//         const start    = performance.now()
//         const from     = { ...displayStats }
//
//         const tick = (now: number) => {
//             const p    = Math.min((now - start) / duration, 1)
//             const ease = 1 - Math.pow(1 - p, 3)
//             setDisplayStats({
//                 totalLoans:     Math.round(from.totalLoans     + (stats.totalLoans     - from.totalLoans)     * ease),
//                 totalDisbursed: Math.round(from.totalDisbursed + (stats.totalDisbursed - from.totalDisbursed) * ease),
//                 approvalRate:   Math.round(from.approvalRate   + (stats.approvalRate   - from.approvalRate)   * ease),
//                 activeUsers:    Math.round(from.activeUsers    + (stats.activeUsers    - from.activeUsers)    * ease),
//             })
//             if (p < 1) requestAnimationFrame(tick)
//         }
//         requestAnimationFrame(tick)
//     }, [statsLoading, stats])
//
//     useEffect(() => {
//         fetchStats()
//         const channel = supabase
//             .channel('landing_stats')
//             .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' }, () => fetchStats())
//             .subscribe()
//         return () => { supabase.removeChannel(channel) }
//     }, [])
//
//     const formatAmount = (n: number) => {
//         if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
//         if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
//         if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
//         return `₹${n}`
//     }
//
//     return (
//         <div className="bg-surface font-body text-on-surface" style={{ minHeight: '100vh' }}>
//
//             {/* ── Navbar ─────────────────────────────────────────── */}
//             <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
//                 <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
//                     <div className="flex items-center gap-2">
//                         <div style={{ width: 36, height: 36, background: '#000a1e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                             <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
//                                 <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
//                                 <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                 <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                 <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
//                             </svg>
//                         </div>
//                         <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#000a1e' }}>Nexus</span>
//                     </div>
//
//                     <div className="hidden md:flex items-center gap-8">
//                         {['Solutions', 'Security', 'Compliance'].map(item => (
//                             <a key={item} href="#"
//                                className="text-slate-600 hover:text-slate-950 transition-colors font-semibold"
//                                style={{ fontSize: 15, textDecoration: 'none' }}>
//                                 {item}
//                             </a>
//                         ))}
//                     </div>
//
//                     <div className="flex items-center gap-3">
//                         <Link to="/login"
//                               style={{ fontSize: 15, color: '#4b5563', fontWeight: 600, textDecoration: 'none', padding: '8px 16px' }}>
//                             Sign in
//                         </Link>
//                         <button
//                             onClick={() => navigate('/get-started')}
//                             style={{ background: '#000a1e', color: 'white', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
//                             onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
//                             onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
//                             Get Started
//                         </button>
//                     </div>
//                 </div>
//             </nav>
//
//             <main style={{ paddingTop: 96 }}>
//
//                 {/* ── Hero ───────────────────────────────────────── */}
//                 <section className="relative px-6 max-w-7xl mx-auto" style={{ padding: '80px 24px 80px' }}>
//                     <div className="grid items-center gap-12" style={{ gridTemplateColumns: '1fr 1fr' }}>
//
//                         {/* Left */}
//                         <div>
//                             <h1 style={{ fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24, fontSize: 'clamp(42px, 6vw, 80px)', color: '#000a1e' }}>
//                                 Credit for Everyone.{' '}
//                                 <span style={{ color: '#0058be' }}>Powered by AI.</span>
//                             </h1>
//                             <p style={{ color: '#44474e', fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
//                                 Nexus analyses your real bank data to deliver instant, fair loan decisions —
//                                 no paperwork, no bias, no waiting.
//                             </p>
//                             <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
//                                 <button
//                                     onClick={() => navigate('/get-started')}
//                                     style={{ background: '#0058be', color: 'white', padding: '16px 32px', borderRadius: 12, fontWeight: 700, fontSize: 17, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,88,190,0.3)', transition: 'all 0.2s' }}
//                                     onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
//                                     onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
//                                     Apply for a Loan
//                                 </button>
//                                 <button
//                                     onClick={() => navigate('/get-started')}
//                                     style={{ background: 'white', color: '#000a1e', padding: '16px 32px', borderRadius: 12, fontWeight: 700, fontSize: 17, border: '1.5px solid #e0e3e5', cursor: 'pointer', transition: 'all 0.2s' }}
//                                     onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
//                                     onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
//                                     How it works
//                                 </button>
//                             </div>
//                         </div>
//
//                         {/* Right — dashboard mockup */}
//                         <div style={{ background: '#002147', borderRadius: 24, padding: 32, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
//                             <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}/>
//                             <div style={{ background: 'white', padding: 24, borderRadius: 16, width: '100%', maxWidth: 320, boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
//                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
//                                     <span style={{ fontSize: 12, fontWeight: 700, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Credit Analysis</span>
//                                     <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }}/>
//                                 </div>
//                                 <div style={{ marginBottom: 20 }}>
//                                     <div style={{ fontSize: 13, color: '#74777f', marginBottom: 6 }}>Credit Score</div>
//                                     <div style={{ fontSize: 42, fontWeight: 900, color: '#0058be', letterSpacing: '-1px' }}>847</div>
//                                     <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>↑ Excellent</div>
//                                 </div>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                                     {[
//                                         { label: 'Income Signals', pct: 85, color: '#0058be' },
//                                         { label: 'Savings Rate',   pct: 72, color: '#059669' },
//                                         { label: 'Repayment',      pct: 95, color: '#7c3aed' },
//                                     ].map(f => (
//                                         <div key={f.label}>
//                                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
//                                                 <span style={{ fontSize: 12, color: '#44474e' }}>{f.label}</span>
//                                                 <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{f.pct}%</span>
//                                             </div>
//                                             <div style={{ height: 6, background: '#f2f4f6', borderRadius: 100, overflow: 'hidden' }}>
//                                                 <div style={{ width: `${f.pct}%`, height: '100%', background: f.color, borderRadius: 100 }}/>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                                 <div style={{ marginTop: 20, background: '#002147', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                     <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>Loan Approved</span>
//                                     <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>₹5,00,000</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </section>
//
//                 {/* ── Live Stats ─────────────────────────────────── */}
//                 <section style={{ background: '#f2f4f6', padding: '64px 24px' }}>
//                     <div className="max-w-7xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
//                         {[
//                             { label: 'Loans Processed',  value: statsLoading ? '—' : displayStats.totalLoans.toLocaleString('en-IN'),  sub: 'total applications' },
//                             { label: 'Amount Disbursed', value: statsLoading ? '—' : formatAmount(displayStats.totalDisbursed),         sub: 'across all loans' },
//                             { label: 'Approval Rate',    value: statsLoading ? '—' : `${displayStats.approvalRate}%`,                  sub: 'of decided applications' },
//                             { label: 'Active Users',     value: statsLoading ? '—' : displayStats.activeUsers.toLocaleString('en-IN'), sub: 'registered borrowers' },
//                         ].map(s => (
//                             <div key={s.label} style={{ borderLeft: '4px solid #0058be', paddingLeft: 24 }}>
//                                 <p style={{ fontSize: 40, fontWeight: 900, color: '#000a1e', letterSpacing: '-1px', marginBottom: 4 }}>{s.value}</p>
//                                 <p style={{ fontSize: 11, fontWeight: 700, color: '#74777f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
//                                 <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{s.sub}</p>
//                             </div>
//                         ))}
//                     </div>
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
//                         <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
//                         <span style={{ fontSize: 13, color: '#74777f', fontWeight: 500 }}>Live data — updates in real time</span>
//                     </div>
//                 </section>
//
//                 {/* ── How it works ───────────────────────────────── */}
//                 <section style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
//                     <h2 style={{ fontSize: 32, fontWeight: 800, color: '#000a1e', marginBottom: 64, letterSpacing: '-0.5px' }}>How it works</h2>
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
//                         {[
//                             { step: '01', icon: '🏦', title: 'Connect Bank',   desc: 'Securely link your bank via Plaid. Read-only access. No credentials stored.' },
//                             { step: '02', icon: '🤖', title: 'Get AI Score',   desc: 'XGBoost model analyses 13 financial signals to generate your credit score instantly.' },
//                             { step: '03', icon: '📋', title: 'Apply for Loan', desc: 'Fill your application in minutes. Upload KYC docs and verify your guarantor via OTP.' },
//                             { step: '04', icon: '💸', title: 'Receive Funds',  desc: 'Officer reviews and approves. Funds disbursed via Stripe instantly upon signing.' },
//                         ].map(s => (
//                             <div key={s.step}
//                                  style={{ background: 'white', border: '1px solid #e0e3e5', borderRadius: 16, padding: 32, transition: 'all 0.2s', cursor: 'default', position: 'relative', overflow: 'hidden' }}
//                                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)' }}
//                                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
//                                 <div style={{ fontSize: 48, fontWeight: 900, color: '#f2f4f6', position: 'absolute', top: 16, right: 20, lineHeight: 1 }}>{s.step}</div>
//                                 <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
//                                 <h3 style={{ fontSize: 18, fontWeight: 700, color: '#000a1e', marginBottom: 10 }}>{s.title}</h3>
//                                 <p style={{ fontSize: 14, color: '#44474e', lineHeight: 1.6 }}>{s.desc}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </section>
//
//                 {/* ── Bento Features ─────────────────────────────── */}
//                 <section style={{ padding: '0 24px 96px', maxWidth: 1200, margin: '0 auto' }}>
//                     <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto auto', gap: 24 }}>
//
//                         {/* Main large card */}
//                         <div style={{ background: '#002147', color: 'white', padding: 48, borderRadius: 20, gridRow: 'span 2', position: 'relative', overflow: 'hidden' }}>
//                             <div style={{ position: 'absolute', right: -80, bottom: -80, width: 320, height: 320, background: 'rgba(0,88,190,0.3)', borderRadius: '50%', filter: 'blur(60px)' }}/>
//                             <div style={{ position: 'relative', zIndex: 1 }}>
//                                 <span style={{ background: '#0058be', color: 'white', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-block', marginBottom: 24 }}>Core Engine</span>
//                                 <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.5px', lineHeight: 1.2 }}>XGBoost AI<br/>Credit Scoring</h2>
//                                 <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 36, maxWidth: 400 }}>
//                                     Our ML model analyses 13 financial signals — transaction consistency, savings rate, income patterns, employment stability — to give every applicant a fair score between 300–950. Cold-start users supported.
//                                 </p>
//                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
//                                     {[
//                                         { val: '13', label: 'Financial Signals' },
//                                         { val: '300-950', label: 'Score Range' },
//                                         { val: '< 2s', label: 'Analysis Time' },
//                                         { val: '100%', label: 'Explainable' },
//                                     ].map(m => (
//                                         <div key={m.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px' }}>
//                                             <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{m.val}</p>
//                                             <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{m.label}</p>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//
//                         {/* Small cards */}
//                         {[
//                             { icon: '🛡️', title: 'Fraud Shield',       desc: '11-point fraud engine — PAN duplicates, income mismatches, synthetic transaction detection.' },
//                             { icon: '⚡', title: 'Instant Disbursement', desc: 'Stripe PaymentIntents disburse funds the moment an officer approves. No delays.' },
//                             { icon: '🔒', title: 'Bank-grade Security',  desc: 'RLS on every table. TOTP 2FA for officers. JWT auth. Signed document URLs.' },
//                             { icon: '📊', title: 'EMI Repayment',        desc: 'Amortisation schedule with auto credit score recalculation on full repayment.' },
//                         ].map(f => (
//                             <div key={f.title}
//                                  style={{ background: 'white', border: '1px solid #e0e3e5', borderRadius: 16, padding: 28, transition: 'all 0.2s' }}
//                                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#adc6ff'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,88,190,0.08)' }}
//                                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e0e3e5'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
//                                 <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
//                                 <h3 style={{ fontSize: 16, fontWeight: 700, color: '#000a1e', marginBottom: 8 }}>{f.title}</h3>
//                                 <p style={{ fontSize: 13, color: '#44474e', lineHeight: 1.6 }}>{f.desc}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </section>
//
//                 {/* ── Trust Badges ───────────────────────────────── */}
//                 <section style={{ borderTop: '1px solid #e0e3e5', borderBottom: '1px solid #e0e3e5', padding: '48px 24px' }}>
//                     <div className="max-w-7xl mx-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, opacity: 0.6, filter: 'grayscale(1)', transition: 'all 0.5s' }}
//                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; (e.currentTarget as HTMLDivElement).style.filter = 'grayscale(0)' }}
//                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.6'; (e.currentTarget as HTMLDivElement).style.filter = 'grayscale(1)' }}>
//                         {[
//                             { badge: 'SOC2',  label: 'Compliant' },
//                             { badge: 'PCI',   label: 'Level 1 Service' },
//                             { badge: 'ISO',   label: '27001 Certified' },
//                             { badge: 'GDPR',  label: 'Ready' },
//                             { badge: 'DPDP',  label: 'India Compliant' },
//                         ].map(t => (
//                             <div key={t.badge} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                                 <div style={{ width: 48, height: 48, border: '2px solid #000a1e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>{t.badge}</div>
//                                 <span style={{ fontWeight: 700, color: '#000a1e', letterSpacing: '-0.3px' }}>{t.label}</span>
//                             </div>
//                         ))}
//                     </div>
//                 </section>
//
//                 {/* ── CTA Banner ─────────────────────────────────── */}
//                 <section style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
//                     <div style={{ background: '#000a1e', borderRadius: 24, padding: '72px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
//                         <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'rgba(0,88,190,0.3)', borderRadius: '50%', filter: 'blur(80px)' }}/>
//                         <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, background: 'rgba(0,88,190,0.2)', borderRadius: '50%', filter: 'blur(80px)' }}/>
//                         <div style={{ position: 'relative', zIndex: 1 }}>
//                             <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', color: 'white', marginBottom: 16, letterSpacing: '-1px' }}>
//                                 Ready to get your credit score?
//                             </h2>
//                             <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
//                                 Join thousands of borrowers who got fair loans through Nexus — regardless of their credit history.
//                             </p>
//                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
//                                 <button
//                                     onClick={() => navigate('/get-started')}
//                                     style={{ background: 'white', color: '#000a1e', fontWeight: 700, fontSize: 17, padding: '16px 36px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
//                                     onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
//                                     onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
//                                     Apply Now — It's Free
//                                 </button>
//                                 <button
//                                     onClick={() => navigate('/officer/login')}
//                                     style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: 17, padding: '16px 36px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
//                                     onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
//                                     onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
//                                     Officer Portal →
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </section>
//             </main>
//
//             {/* ── Footer ─────────────────────────────────────────── */}
//             <footer style={{ background: '#f7f9fb', borderTop: '1px solid #e0e3e5' }}>
//                 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
//                     <div>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
//                             <div style={{ width: 32, height: 32, background: '#000a1e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                 <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
//                                     <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
//                                     <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                     <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                     <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
//                                 </svg>
//                             </div>
//                             <span style={{ fontWeight: 800, fontSize: 16, color: '#000a1e' }}>Nexus</span>
//                         </div>
//                         <p style={{ fontSize: 14, color: '#74777f', lineHeight: 1.7, maxWidth: 280 }}>
//                             Engineering the future of credit infrastructure with AI-driven precision and architectural stability.
//                         </p>
//                     </div>
//
//                     {[
//                         { title: 'Product',  links: ['Solutions', 'Security', 'Compliance'] },
//                         { title: 'Legal',    links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy'] },
//                         { title: 'Support',  links: ['Contact Support', 'Help Center', 'API Docs'] },
//                     ].map(col => (
//                         <div key={col.title}>
//                             <h4 style={{ fontWeight: 700, fontSize: 15, color: '#000a1e', marginBottom: 24 }}>{col.title}</h4>
//                             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
//                                 {col.links.map(link => (
//                                     <li key={link}>
//                                         <a href="#"
//                                            style={{ fontSize: 14, color: '#74777f', textDecoration: 'none', transition: 'color 0.2s' }}
//                                            onMouseEnter={e => (e.currentTarget.style.color = '#0058be')}
//                                            onMouseLeave={e => (e.currentTarget.style.color = '#74777f')}>
//                                             {link}
//                                         </a>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     ))}
//                 </div>
//
//                 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', borderTop: '1px solid #e0e3e5' }}>
//                     <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
//                         © 2026 Nexus Financial Technologies. All rights reserved.
//                     </p>
//                 </div>
//             </footer>
//         </div>
//     )
// }




// import { Link, useNavigate } from 'react-router-dom'
// import { supabase } from '@/lib/supabaseClient'
// import { useState, useEffect, useRef } from 'react'
//
// export default function LandingPage() {
//     const navigate = useNavigate()
//     const canvasRef = useRef<HTMLCanvasElement>(null)
//     const [stats, setStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
//     const [displayStats, setDisplayStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
//     const [statsLoading, setStatsLoading] = useState(true)
//
//     // ── 3D particle animation ─────────────────────────────────
//     useEffect(() => {
//         const canvas = canvasRef.current
//         if (!canvas) return
//         const ctx = canvas.getContext('2d')
//         if (!ctx) return
//
//         let animId: number
//         let W = canvas.offsetWidth
//         let H = canvas.offsetHeight
//         canvas.width  = W
//         canvas.height = H
//
//         const resize = () => {
//             W = canvas.offsetWidth
//             H = canvas.offsetHeight
//             canvas.width  = W
//             canvas.height = H
//         }
//         window.addEventListener('resize', resize)
//
//         // Nodes
//         const NODE_COUNT = 80
//         type Node = { x: number; y: number; z: number; vx: number; vy: number; vz: number }
//         const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
//             x:  (Math.random() - 0.5) * 2,
//             y:  (Math.random() - 0.5) * 2,
//             z:  Math.random() * 2 - 1,
//             vx: (Math.random() - 0.5) * 0.001,
//             vy: (Math.random() - 0.5) * 0.001,
//             vz: (Math.random() - 0.5) * 0.001,
//         }))
//
//         const project = (x: number, y: number, z: number) => {
//             const fov   = 1.8
//             const scale = fov / (fov + z)
//             return {
//                 sx:    (x * scale * W * 0.4) + W / 2,
//                 sy:    (y * scale * H * 0.4) + H / 2,
//                 scale: scale
//             }
//         }
//
//         let t = 0
//         const draw = () => {
//             ctx.clearRect(0, 0, W, H)
//             t += 0.002
//
//             // Slow global rotation
//             nodes.forEach(n => {
//                 n.x += n.vx
//                 n.y += n.vy
//                 n.z += n.vz
//                 // Bounce
//                 if (Math.abs(n.x) > 1) n.vx *= -1
//                 if (Math.abs(n.y) > 1) n.vy *= -1
//                 if (Math.abs(n.z) > 1) n.vz *= -1
//                 // Gentle rotation
//                 const cos = Math.cos(t * 0.3)
//                 const sin = Math.sin(t * 0.3)
//                 const nx  = n.x * cos - n.z * sin
//                 const nz  = n.x * sin + n.z * cos
//                 n.x = nx
//                 n.z = nz
//             })
//
//             // Draw connections
//             for (let i = 0; i < nodes.length; i++) {
//                 for (let j = i + 1; j < nodes.length; j++) {
//                     const dx   = nodes[i].x - nodes[j].x
//                     const dy   = nodes[i].y - nodes[j].y
//                     const dz   = nodes[i].z - nodes[j].z
//                     const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
//                     if (dist < 0.55) {
//                         const a  = nodes[i]
//                         const b  = nodes[j]
//                         const pa = project(a.x, a.y, a.z)
//                         const pb = project(b.x, b.y, b.z)
//                         const opacity = (1 - dist / 0.55) * 0.25
//                         ctx.beginPath()
//                         ctx.moveTo(pa.sx, pa.sy)
//                         ctx.lineTo(pb.sx, pb.sy)
//                         ctx.strokeStyle = `rgba(100,160,255,${opacity})`
//                         ctx.lineWidth   = 0.8
//                         ctx.stroke()
//                     }
//                 }
//             }
//
//             // Draw nodes
//             nodes.forEach(n => {
//                 const p = project(n.x, n.y, n.z)
//                 const r = p.scale * 3
//                 const opacity = 0.3 + p.scale * 0.5
//                 ctx.beginPath()
//                 ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
//                 ctx.fillStyle = `rgba(130,180,255,${opacity})`
//                 ctx.fill()
//             })
//
//             animId = requestAnimationFrame(draw)
//         }
//
//         draw()
//         return () => {
//             cancelAnimationFrame(animId)
//             window.removeEventListener('resize', resize)
//         }
//     }, [])
//
//     const fetchStats = async () => {
//         try {
//             const { data: apps } = await supabase
//                 .from('loan_applications')
//                 .select('status, amount')
//                 .neq('status', 'draft')
//
//             if (!apps) return
//
//             const total     = apps.length
//             const approved  = apps.filter(a => a.status === 'approved' || a.status === 'repaid').length
//             const rejected  = apps.filter(a => a.status === 'rejected').length
//             const decided   = approved + rejected
//             const disbursed = apps
//                 .filter(a => a.status === 'approved' || a.status === 'repaid')
//                 .reduce((s, a) => s + (Number(a.amount) || 0), 0)
//
//             const { count: userCount } = await supabase
//                 .from('profiles')
//                 .select('id', { count: 'exact', head: true })
//
//             setStats({
//                 totalLoans:     total,
//                 totalDisbursed: disbursed,
//                 approvalRate:   decided > 0 ? Math.round((approved / decided) * 100) : 0,
//                 activeUsers:    userCount || 0,
//             })
//         } catch {
//             // Silent
//         } finally {
//             setStatsLoading(false)
//         }
//     }
//
//     useEffect(() => {
//         if (statsLoading) return
//         const duration = 1800
//         const start    = performance.now()
//         const from     = { ...displayStats }
//         const tick = (now: number) => {
//             const p    = Math.min((now - start) / duration, 1)
//             const ease = 1 - Math.pow(1 - p, 3)
//             setDisplayStats({
//                 totalLoans:     Math.round(from.totalLoans     + (stats.totalLoans     - from.totalLoans)     * ease),
//                 totalDisbursed: Math.round(from.totalDisbursed + (stats.totalDisbursed - from.totalDisbursed) * ease),
//                 approvalRate:   Math.round(from.approvalRate   + (stats.approvalRate   - from.approvalRate)   * ease),
//                 activeUsers:    Math.round(from.activeUsers    + (stats.activeUsers    - from.activeUsers)    * ease),
//             })
//             if (p < 1) requestAnimationFrame(tick)
//         }
//         requestAnimationFrame(tick)
//     }, [statsLoading, stats])
//
//     useEffect(() => {
//         fetchStats()
//         const channel = supabase
//             .channel('landing_stats')
//             .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' }, () => fetchStats())
//             .subscribe()
//         return () => { supabase.removeChannel(channel) }
//     }, [])
//
//     const formatAmount = (n: number) => {
//         if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
//         if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
//         if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
//         return `₹${n}`
//     }
//
//     return (
//         <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>
//
//             {/* ── Navbar ─────────────────────────────────────────── */}
//             <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5' }}>
//                 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                         <div style={{ width: 34, height: 34, background: '#001736', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                             <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
//                                 <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
//                                 <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                 <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                 <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
//                             </svg>
//                         </div>
//                         <span style={{ fontWeight: 900, fontSize: 20, color: '#001736', letterSpacing: '-0.5px' }}>Nexus</span>
//                     </div>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//                         <Link to="/login"
//                               style={{ fontSize: 15, color: '#43474f', fontWeight: 600, textDecoration: 'none', padding: '8px 16px' }}>
//                             Sign in
//                         </Link>
//                         <button onClick={() => navigate('/get-started')}
//                                 style={{ background: '#001736', color: 'white', padding: '10px 22px', borderRadius: 6, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
//                                 onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
//                                 onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
//                             Get Started
//                         </button>
//                     </div>
//                 </div>
//             </nav>
//
//             {/* ── Hero ───────────────────────────────────────────── */}
//             <header style={{ position: 'relative', background: '#001736', overflow: 'hidden', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
//
//                 {/* 3D Canvas background */}
//                 <canvas
//                     ref={canvasRef}
//                     style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6 }}
//                 />
//
//                 {/* Gradient overlay — fades canvas into background */}
//                 <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 50%, rgba(0,96,172,0.25) 0%, transparent 70%)' }}/>
//                 <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, #001736, transparent)' }}/>
//
//                 {/* Content */}
//                 <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '120px 24px', width: '100%' }}>
//                     <div style={{ maxWidth: 680 }}>
//
//                         {/* Badge */}
//                         <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '6px 18px', marginBottom: 36 }}>
//                             <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}/>
//                             <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
//                                 ⚡ Next-Gen Credit Platform
//                             </span>
//                         </div>
//
//                         {/* Headline */}
//                         <h1 style={{ fontWeight: 900, fontSize: 'clamp(44px, 6vw, 80px)', lineHeight: 1.06, letterSpacing: '-2.5px', color: 'white', marginBottom: 28 }}>
//                             Credit for<br/>Everyone.<br/>
//                             <span style={{ color: '#68abff' }}>Powered by AI.</span>
//                         </h1>
//
//                         {/* Subtext */}
//                         <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 48, maxWidth: 520 }}>
//                             Traditional scoring is broken. Nexus looks beyond the numbers to provide fair, instant credit access for everyone — even without a credit history.
//                         </p>
//
//                         {/* CTAs */}
//                         <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
//                             <button onClick={() => navigate('/get-started')}
//                                     style={{ background: 'white', color: '#001736', padding: '15px 32px', borderRadius: 8, fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
//                                     onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
//                                     onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
//                                 Apply for a Loan
//                             </button>
//                             <button onClick={() => navigate('/get-started')}
//                                     style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '15px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
//                                     onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
//                                     onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
//                                 How it works ↓
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//
//                 {/* Bottom fade into next section */}
//                 <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, #001736)' }}/>
//             </header>
//
//             {/* ── Live Stats ─────────────────────────────────────── */}
//             <section style={{ background: '#001736', padding: '0 24px 64px' }}>
//                 <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
//                     {[
//                         { label: 'Loans Processed',  value: statsLoading ? '—' : displayStats.totalLoans.toLocaleString('en-IN') },
//                         { label: 'Amount Disbursed', value: statsLoading ? '—' : formatAmount(displayStats.totalDisbursed) },
//                         { label: 'Approval Rate',    value: statsLoading ? '—' : `${displayStats.approvalRate}%` },
//                         { label: 'Active Users',     value: statsLoading ? '—' : displayStats.activeUsers.toLocaleString('en-IN') },
//                     ].map((s, i) => (
//                         <div key={s.label} style={{ textAlign: 'center', padding: '0 24px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
//                             <p style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-1px', marginBottom: 8 }}>{s.value}</p>
//                             <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
//                         </div>
//                     ))}
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1200, margin: '48px auto 0' }}>
//                     <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}/>
//                     <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Live data — updates in real time</span>
//                 </div>
//             </section>
//
//             {/* ── How it works ───────────────────────────────────── */}
//             <section style={{ background: '#f7f9fb', padding: '96px 24px' }}>
//                 <div style={{ maxWidth: 1200, margin: '0 auto' }}>
//                     <div style={{ textAlign: 'center', marginBottom: 72 }}>
//                         <h2 style={{ fontSize: 36, fontWeight: 900, color: '#001736', letterSpacing: '-1px', marginBottom: 16 }}>
//                             The Path to Access
//                         </h2>
//                         <div style={{ width: 48, height: 3, background: '#0060ac', borderRadius: 100, margin: '0 auto 20px' }}/>
//                         <p style={{ fontSize: 17, color: '#43474f' }}>Four simple steps to transform your financial future.</p>
//                     </div>
//
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
//                         {[
//                             { num: '1', title: 'Connect Bank',  desc: 'Securely link your bank via Plaid. Read-only access, nothing stored.' },
//                             { num: '2', title: 'AI Analysis',   desc: 'XGBoost model scores you across 13 financial signals in seconds.' },
//                             { num: '3', title: 'Apply',         desc: 'Submit your application, upload KYC, verify your guarantor via OTP.' },
//                             { num: '4', title: 'Get Funded',    desc: 'Officer approves, Stripe disburses funds instantly.' },
//                         ].map(s => (
//                             <div key={s.num} style={{ textAlign: 'center' }}>
//                                 <div style={{ width: 56, height: 56, background: '#eceef0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 20, fontWeight: 900, color: '#0060ac' }}>
//                                     {s.num}
//                                 </div>
//                                 <h4 style={{ fontWeight: 800, fontSize: 17, color: '#001736', marginBottom: 10 }}>{s.title}</h4>
//                                 <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.65 }}>{s.desc}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── CTA ────────────────────────────────────────────── */}
//             <section style={{ padding: '0 24px 80px', background: '#f7f9fb' }}>
//                 <div style={{ maxWidth: 1200, margin: '0 auto' }}>
//                     <div style={{ background: 'linear-gradient(135deg, #001736 0%, #0060ac 100%)', borderRadius: 20, padding: '72px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
//                         <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}/>
//                         <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}/>
//                         <div style={{ position: 'relative', zIndex: 1 }}>
//                             <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)', color: 'white', marginBottom: 14, letterSpacing: '-1px' }}>
//                                 Ready to unlock your financial potential?
//                             </h2>
//                             <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
//                                 Fair credit for everyone — even without a credit history.
//                             </p>
//                             <button onClick={() => navigate('/get-started')}
//                                     style={{ background: 'white', color: '#001736', fontWeight: 800, fontSize: 16, padding: '14px 36px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
//                                     onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
//                                     onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
//                                 Get Started — It's Free
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── Footer ─────────────────────────────────────────── */}
//             <footer style={{ background: '#f2f4f6', borderTop: '1px solid #e0e3e5' }}>
//                 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
//                     <div>
//                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
//                             <div style={{ width: 28, height: 28, background: '#001736', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                 <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
//                                     <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
//                                     <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                     <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
//                                     <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
//                                 </svg>
//                             </div>
//                             <span style={{ fontWeight: 900, fontSize: 16, color: '#001736' }}>Nexus</span>
//                         </div>
//                         <p style={{ fontSize: 13, color: '#43474f', lineHeight: 1.7, maxWidth: 260 }}>
//                             Pioneering fair financial services through AI-driven credit scoring.
//                         </p>
//                     </div>
//
//                     {[
//                         { title: 'Product', links: ['Personal Credit', 'Business Loans', 'API Docs'] },
//                         { title: 'Company', links: ['About Us', 'Careers', 'Press Kit'] },
//                         { title: 'Legal',   links: ['Privacy Policy', 'Terms of Service', 'Compliance'] },
//                     ].map(col => (
//                         <div key={col.title}>
//                             <h5 style={{ fontWeight: 800, fontSize: 11, color: '#001736', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>{col.title}</h5>
//                             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
//                                 {col.links.map(link => (
//                                     <li key={link}>
//                                         <a href="#"
//                                            style={{ fontSize: 14, color: '#43474f', textDecoration: 'none' }}
//                                            onMouseEnter={e => (e.currentTarget.style.color = '#001736')}
//                                            onMouseLeave={e => (e.currentTarget.style.color = '#43474f')}>
//                                             {link}
//                                         </a>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     ))}
//                 </div>
//
//                 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', borderTop: '1px solid #e0e3e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
//                     <p style={{ fontSize: 12, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
//                         © 2026 Nexus Financial Technologies. All rights reserved.
//                     </p>
//                     <Link to="/officer/login"
//                           style={{ fontSize: 12, color: '#c4c6d0', textDecoration: 'none' }}
//                           onMouseEnter={e => (e.currentTarget.style.color = '#747780')}
//                           onMouseLeave={e => (e.currentTarget.style.color = '#c4c6d0')}>
//                         Staff access
//                     </Link>
//                 </div>
//             </footer>
//         </div>
//     )
// }


import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function LandingPage() {
    const navigate = useNavigate()
    const meshRef = useRef<HTMLDivElement>(null)
    const [stats, setStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
    const [displayStats, setDisplayStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })
    const [statsLoading, setStatsLoading] = useState(true)

    // ── Mesh gradient animation ───────────────────────────────
    useEffect(() => {
        const el = meshRef.current
        if (!el) return
        let t = 0
        let animId: number
        const tick = () => {
            t += 0.003
            const x1 = 50 + 20 * Math.sin(t * 0.7)
            const y1 = 50 + 20 * Math.cos(t * 0.5)
            const x2 = 30 + 25 * Math.cos(t * 0.4)
            const y2 = 60 + 20 * Math.sin(t * 0.6)
            const x3 = 70 + 15 * Math.sin(t * 0.9)
            const y3 = 30 + 25 * Math.cos(t * 0.3)
            el.style.background = `
                radial-gradient(ellipse at ${x1}% ${y1}%, rgba(0,96,172,0.45) 0%, transparent 55%),
                radial-gradient(ellipse at ${x2}% ${y2}%, rgba(0,40,100,0.35) 0%, transparent 50%),
                radial-gradient(ellipse at ${x3}% ${y3}%, rgba(30,80,160,0.3) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(0,20,60,0.6) 0%, transparent 80%),
                #001736
            `
            animId = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(animId)
    }, [])

    // ── Fetch live stats ──────────────────────────────────────
    const fetchStats = async () => {
        try {
            const { data: apps } = await supabase
                .from('loan_applications')
                .select('status, amount')
                .neq('status', 'draft')

            if (!apps) return

            const total     = apps.length
            const approved  = apps.filter(a => a.status === 'approved' || a.status === 'repaid').length
            const rejected  = apps.filter(a => a.status === 'rejected').length
            const decided   = approved + rejected
            const disbursed = apps
                .filter(a => a.status === 'approved' || a.status === 'repaid')
                .reduce((s, a) => s + (Number(a.amount) || 0), 0)

            const { count: userCount } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })

            setStats({
                totalLoans:     total,
                totalDisbursed: disbursed,
                approvalRate:   decided > 0 ? Math.round((approved / decided) * 100) : 0,
                activeUsers:    userCount || 0,
            })
        } catch {
            // Silent
        } finally {
            setStatsLoading(false)
        }
    }

    // ── Counter animation ─────────────────────────────────────
    useEffect(() => {
        if (statsLoading) return
        const duration = 1800
        const start    = performance.now()
        const from     = { ...displayStats }
        const tick = (now: number) => {
            const p    = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            setDisplayStats({
                totalLoans:     Math.round(from.totalLoans     + (stats.totalLoans     - from.totalLoans)     * ease),
                totalDisbursed: Math.round(from.totalDisbursed + (stats.totalDisbursed - from.totalDisbursed) * ease),
                approvalRate:   Math.round(from.approvalRate   + (stats.approvalRate   - from.approvalRate)   * ease),
                activeUsers:    Math.round(from.activeUsers    + (stats.activeUsers    - from.activeUsers)    * ease),
            })
            if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }, [statsLoading, stats])

    useEffect(() => {
        fetchStats()
        const channel = supabase
            .channel('landing_stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' }, () => fetchStats())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const formatAmount = (n: number) => {
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
        if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`
        if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`
        return `₹${n}`
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* ── Navbar ─────────────────────────────────────────── */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 34, height: 34, background: '#001736', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                            </svg>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 20, color: '#001736', letterSpacing: '-0.5px' }}>Nexus</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link to="/login"
                              style={{ fontSize: 15, color: '#43474f', fontWeight: 600, textDecoration: 'none', padding: '8px 16px' }}>
                            Sign in
                        </Link>
                        <button onClick={() => navigate('/get-started')}
                                style={{ background: '#001736', color: 'white', padding: '10px 22px', borderRadius: 6, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ───────────────────────────────────────────── */}
            <header style={{ position: 'relative', overflow: 'hidden', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>

                {/* Mesh gradient background */}
                <div ref={meshRef} style={{ position: 'absolute', inset: 0, background: '#001736' }}/>

                {/* Noise texture overlay */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.03,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px'
                }}/>

                {/* Bottom fade */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to bottom, transparent, #001736)' }}/>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '120px 24px', width: '100%' }}>
                    <div style={{ maxWidth: 680 }}>

                        {/* Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 100, padding: '6px 18px', marginBottom: 36 }}>
                            <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}/>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Next-Gen Credit Platform
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 style={{ fontWeight: 900, fontSize: 'clamp(44px, 6vw, 80px)', lineHeight: 1.06, letterSpacing: '-2.5px', color: 'white', marginBottom: 28 }}>
                            Credit for<br/>Everyone.<br/>
                            <span style={{ color: '#68abff' }}>Powered by AI.</span>
                        </h1>

                        {/* Subtext */}
                        <p style={{ fontSize: 19, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 48, maxWidth: 520 }}>
                            Traditional scoring is broken. Nexus looks beyond the numbers to provide fair, instant credit access for everyone — even without a credit history.
                        </p>

                        {/* CTAs */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/get-started')}
                                    style={{ background: 'white', color: '#001736', padding: '15px 32px', borderRadius: 8, fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                                Apply for a Loan
                            </button>
                            <button onClick={() => navigate('/get-started')}
                                    style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '15px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16, border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
                                How it works ↓
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Live Stats ─────────────────────────────────────── */}
            <section style={{ background: '#001736', padding: '0 24px 64px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                    {[
                        { label: 'Loans Processed',  value: statsLoading ? '—' : displayStats.totalLoans.toLocaleString('en-IN') },
                        { label: 'Amount Disbursed', value: statsLoading ? '—' : formatAmount(displayStats.totalDisbursed) },
                        { label: 'Approval Rate',    value: statsLoading ? '—' : `${displayStats.approvalRate}%` },
                        { label: 'Active Users',     value: statsLoading ? '—' : displayStats.activeUsers.toLocaleString('en-IN') },
                    ].map((s, i) => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '0 24px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                            <p style={{ fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-1px', marginBottom: 8 }}>{s.value}</p>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', maxWidth: 1200, margin: '48px auto 0' }}>
                    <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}/>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Live data — updates in real time</span>
                </div>
            </section>

            {/* ── How it works ───────────────────────────────────── */}
            <section style={{ background: '#f7f9fb', padding: '96px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 72 }}>
                        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#001736', letterSpacing: '-1px', marginBottom: 16 }}>
                            The Path to Access
                        </h2>
                        <div style={{ width: 48, height: 3, background: '#0060ac', borderRadius: 100, margin: '0 auto 20px' }}/>
                        <p style={{ fontSize: 17, color: '#43474f' }}>Four simple steps to transform your financial future.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
                        {[
                            { num: '1', title: 'Connect Bank',  desc: 'Securely link your bank via Plaid. Read-only access, nothing stored.' },
                            { num: '2', title: 'AI Analysis',   desc: 'XGBoost model scores you across 13 financial signals in seconds.' },
                            { num: '3', title: 'Apply',         desc: 'Submit your application, upload KYC, verify your guarantor via OTP.' },
                            { num: '4', title: 'Get Funded',    desc: 'Officer approves, Stripe disburses funds instantly.' },
                        ].map(s => (
                            <div key={s.num} style={{ textAlign: 'center' }}>
                                <div style={{ width: 56, height: 56, background: '#eceef0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 20, fontWeight: 900, color: '#0060ac' }}>
                                    {s.num}
                                </div>
                                <h4 style={{ fontWeight: 800, fontSize: 17, color: '#001736', marginBottom: 10 }}>{s.title}</h4>
                                <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.65 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────── */}
            <section style={{ padding: '0 24px 80px', background: '#f7f9fb' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ background: 'linear-gradient(135deg, #001736 0%, #0060ac 100%)', borderRadius: 20, padding: '72px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}/>
                        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}/>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)', color: 'white', marginBottom: 14, letterSpacing: '-1px' }}>
                                Ready to unlock your financial potential?
                            </h2>
                            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
                                Fair credit for everyone — even without a credit history.
                            </p>
                            <button onClick={() => navigate('/get-started')}
                                    style={{ background: 'white', color: '#001736', fontWeight: 800, fontSize: 16, padding: '14px 36px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f2f4f6')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                                Get Started — It's Free
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer style={{ background: '#f2f4f6', borderTop: '1px solid #e0e3e5' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, background: '#001736', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                                    <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                    <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                    <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                                </svg>
                            </div>
                            <span style={{ fontWeight: 900, fontSize: 16, color: '#001736' }}>Nexus</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#43474f', lineHeight: 1.7, maxWidth: 260 }}>
                            Pioneering fair financial services through AI-driven credit scoring.
                        </p>
                    </div>

                    {[
                        { title: 'Product', links: ['Personal Credit', 'Business Loans', 'API Docs'] },
                        { title: 'Company', links: ['About Us', 'Careers', 'Press Kit'] },
                        { title: 'Legal',   links: ['Privacy Policy', 'Terms of Service', 'Compliance'] },
                    ].map(col => (
                        <div key={col.title}>
                            <h5 style={{ fontWeight: 800, fontSize: 11, color: '#001736', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>{col.title}</h5>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {col.links.map(link => (
                                    <li key={link}>
                                        <a href="#"
                                           style={{ fontSize: 14, color: '#43474f', textDecoration: 'none' }}
                                           onMouseEnter={e => (e.currentTarget.style.color = '#001736')}
                                           onMouseLeave={e => (e.currentTarget.style.color = '#43474f')}>
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', borderTop: '1px solid #e0e3e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ fontSize: 12, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        © 2026 Nexus Financial Technologies. All rights reserved.
                    </p>
                    <Link to="/officer/login"
                          style={{ fontSize: 12, color: '#c4c6d0', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#747780')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#c4c6d0')}>
                        Staff access
                    </Link>
                </div>
            </footer>
        </div>
    )
}