import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function LandingPage() {
    const [stats, setStats] = useState({
        totalLoans:     0,
        totalDisbursed: 0,
        approvalRate:   0,
        activeUsers:    0,
    })
    const [statsLoading, setStatsLoading] = useState(true)
    const [displayStats, setDisplayStats] = useState({ totalLoans: 0, totalDisbursed: 0, approvalRate: 0, activeUsers: 0 })

    // Fetch live platform stats from Supabase
    const fetchStats = async () => {
        try {
            const { data: apps } = await supabase
                .from('loan_applications')
                .select('status, amount')
                .neq('status', 'draft')

            if (!apps) return

            const total    = apps.length
            const approved = apps.filter(a => a.status === 'approved' || a.status === 'repaid').length
            const rejected = apps.filter(a => a.status === 'rejected').length
            const decided  = approved + rejected
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
            // Silent — landing page works without stats
        } finally {
            setStatsLoading(false)
        }
    }

    // Animate numbers counting up
    useEffect(() => {
        if (statsLoading) return
        const duration = 1500
        const start    = performance.now()
        const from     = displayStats

        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1)
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

        // Realtime: update stats when new applications come in
        const channel = supabase
            .channel('landing_stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_applications' },
                () => fetchStats())
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
        <div style={{ minHeight: '100vh', width: '100vw', background: '#f0eeff' }}>

            {/* Navbar */}
            <nav className="bg-white border-b border-purple-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-10 flex items-center justify-between" style={{ height: '80px' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
                            <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5"/>
                                <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
                            </svg>
                        </div>
                        <span className="font-display font-bold text-purple-900 text-3xl tracking-tight">Nexus</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login"
                              className="text-base text-gray-500 hover:text-purple-600 font-semibold transition-colors">
                            Sign in
                        </Link>
                        <Link to="/get-started"
                              className="text-base bg-purple-600 hover:bg-purple-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
                              style={{ boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}>
                            Get Started →
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-10 pt-36 pb-28 text-center">

                {/* Live badge */}
                <div className="inline-flex items-center gap-3 bg-purple-100 border border-purple-200 text-purple-600 text-base font-bold px-8 py-3.5 rounded-full mb-14 tracking-widest uppercase">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"/>
                    AI-Powered Lending Platform
                </div>

                {/* Headline */}
                <h1 className="font-display font-bold tracking-tight mb-12">
                    <span className="block text-7xl lg:text-9xl text-gray-900 mb-4">Smart Lending.</span>
                    <span className="block text-7xl lg:text-9xl text-purple-600">Zero Guesswork.</span>
                </h1>

                <p className="text-gray-500 text-2xl leading-relaxed max-w-3xl mx-auto mb-16">
                    Nexus uses real bank data and AI to deliver instant, fair loan
                    decisions — no paperwork, no waiting, no hassle.
                </p>

                {/* CTA */}
                <div className="flex items-center justify-center gap-6 flex-wrap mb-24">
                    <Link to="/get-started"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-14 py-5 rounded-2xl transition-all hover:shadow-xl hover:shadow-purple-200">
                        Apply for a Loan
                    </Link>
                    <Link to="/get-started"
                          className="bg-white hover:bg-purple-50 text-purple-700 font-bold text-xl px-14 py-5 rounded-2xl border border-purple-200 transition-all">
                        How it works ↓
                    </Link>
                </div>

                {/* Live stats bar */}
                <div className="bg-white rounded-3xl border border-purple-100 p-8 mb-24 grid grid-cols-2 md:grid-cols-4 gap-6"
                     style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.07)' }}>
                    {[
                        {
                            label: 'Loans Processed',
                            value: statsLoading ? '—' : displayStats.totalLoans.toLocaleString('en-IN'),
                            sub:   'total applications',
                            icon:  '📋'
                        },
                        {
                            label: 'Amount Disbursed',
                            value: statsLoading ? '—' : formatAmount(displayStats.totalDisbursed),
                            sub:   'across all loans',
                            icon:  '💰'
                        },
                        {
                            label: 'Approval Rate',
                            value: statsLoading ? '—' : `${displayStats.approvalRate}%`,
                            sub:   'of decided applications',
                            icon:  '✅'
                        },
                        {
                            label: 'Active Users',
                            value: statsLoading ? '—' : displayStats.activeUsers.toLocaleString('en-IN'),
                            sub:   'registered borrowers',
                            icon:  '👤'
                        },
                    ].map(s => (
                        <div key={s.label} className="text-center">
                            <p className="text-3xl mb-2">{s.icon}</p>
                            <p className="font-display font-bold text-4xl text-purple-700 mb-1">
                                {s.value}
                            </p>
                            <p className="text-sm font-semibold text-gray-500">{s.label}</p>
                            <p className="text-xs text-gray-300 mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                    <div className="col-span-2 md:col-span-4 flex items-center justify-center gap-2 pt-2 border-t border-purple-50 mt-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
                        <span className="text-xs text-gray-400 font-medium">Live data — updates in real time</span>
                    </div>
                </div>
            </main>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-10 pb-36">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: '🏦', title: 'Bank-grade security',  desc: '256-bit TLS encryption. Read-only Plaid access. Your money never moves without your OTP.' },
                        { icon: '⚡', title: 'AI-powered scoring',   desc: 'XGBoost ML model trained on repayment data. Transparent, explainable credit decisions.' },
                        { icon: '🎯', title: 'Instant decisions',    desc: 'Credit analysis in seconds. Officer review within 24 hours. Funds disbursed via Stripe.' },
                    ].map(f => (
                        <div key={f.title}
                             className="bg-white border border-purple-100 rounded-3xl p-10 flex items-start gap-6 hover:border-purple-300 transition-all hover:shadow-xl hover:shadow-purple-50">
                            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                                {f.icon}
                            </div>
                            <div>
                                <p className="text-gray-800 font-bold text-2xl mb-3">{f.title}</p>
                                <p className="text-gray-400 text-lg leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-purple-100 py-10 bg-white">
                <p className="text-center text-base text-gray-400">© 2026 Nexus. All rights reserved.</p>
            </footer>
        </div>
    )
}


