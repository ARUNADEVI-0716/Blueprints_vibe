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