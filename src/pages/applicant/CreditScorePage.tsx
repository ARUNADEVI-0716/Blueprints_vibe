import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface ScoreFactor {
    name: string
    score: number
    weight: number
    impact: 'positive' | 'neutral' | 'negative'
    reason: string
    contribution: number
}

interface CreditScore {
    score: number
    grade: string
    isColdStart: boolean
    isReturningBorrower?: boolean
    repaymentBonus?: number
    maxScore: number
    factors: ScoreFactor[]
    recommendation: string
    riskLevel: string
    model?: string
    repaymentProbability?: number
}

interface HistoryPoint {
    score: number
    grade: string
    calculated_at: string
}

// ── Animated counter ──────────────────────────────────────────
function useAnimatedNumber(target: number, duration = 1200) {
    const [display, setDisplay] = useState(target)
    const rafRef   = useRef<number>(0)
    const fromRef  = useRef(target)

    useEffect(() => {
        const from  = fromRef.current
        fromRef.current = target
        const t0    = performance.now()
        const tick  = (now: number) => {
            const p    = Math.min((now - t0) / duration, 1)
            const ease = 1 - Math.pow(1 - p, 3)
            setDisplay(Math.round(from + (target - from) * ease))
            if (p < 1) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [target])

    return display
}

// ── Animated arc dial ─────────────────────────────────────────
function ScoreArc({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
    const ARC_LEN  = 283
    const target   = Math.max(0, Math.min(1, (score - 300) / (maxScore - 300))) * ARC_LEN
    const [dash, setDash] = useState(0)
    const curRef   = useRef(0)

    useEffect(() => {
        const from  = curRef.current
        const t0    = performance.now()
        let raf: number
        const tick  = (now: number) => {
            const p   = Math.min((now - t0) / 1200, 1)
            const val = from + (target - from) * (1 - Math.pow(1 - p, 3))
            curRef.current = val
            setDash(val)
            if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [target])

    const tipX = 20 + 90 * (1 - Math.cos(Math.PI * (dash / ARC_LEN)))
    const tipY = 120 - 90 * Math.sin(Math.PI * (dash / ARC_LEN))

    return (
        <svg width="220" height="130" viewBox="0 0 220 130">
            <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="#f3e8ff" strokeWidth="16" strokeLinecap="round"/>
            <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke={color} strokeWidth="16"
                  strokeLinecap="round" strokeDasharray={`${dash} ${ARC_LEN}`} style={{ transition: 'stroke 0.5s' }}/>
            {dash > 4 && <circle cx={tipX} cy={tipY} r="9" fill={color} opacity="0.22"/>}
            {dash > 4 && <circle cx={tipX} cy={tipY} r="5" fill={color}/>}
        </svg>
    )
}

// ── Score history chart — pure SVG, no libraries ──────────────
function ScoreHistoryChart({ history }: { history: HistoryPoint[] }) {
    const W = 560, H = 200
    const PAD = { top: 28, right: 16, bottom: 44, left: 48 }
    const iW  = W - PAD.left - PAD.right
    const iH  = H - PAD.top  - PAD.bottom

    if (history.length < 2) return null

    const scores = history.map(p => p.score)
    const minS   = Math.max(300, Math.min(...scores) - 40)
    const maxS   = Math.min(950, Math.max(...scores) + 40)

    const xS = (i: number) => PAD.left + (i / (history.length - 1)) * iW
    const yS = (s: number) => PAD.top  + iH - ((s - minS) / (maxS - minS)) * iH

    const pathD = history.map((p, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(p.score).toFixed(1)}`).join(' ')
    const areaD = `${pathD} L${xS(history.length - 1).toFixed(1)},${(PAD.top + iH).toFixed(1)} L${PAD.left},${(PAD.top + iH).toFixed(1)} Z`

    const yTicks = [300, 500, 600, 700, 800, 950].filter(t => t > minS - 10 && t < maxS + 10)

    const getC = (s: number) =>
        s >= 800 ? '#22c55e' : s >= 700 ? '#8b5cf6' : s >= 600 ? '#6366f1' : s >= 500 ? '#f59e0b' : '#ef4444'

    const pathRef = useRef<SVGPathElement>(null)
    useEffect(() => {
        const el = pathRef.current
        if (!el) return
        const len = el.getTotalLength()
        el.style.strokeDasharray  = `${len}`
        el.style.strokeDashoffset = `${len}`
        el.style.transition       = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)'
        requestAnimationFrame(() => { el.style.strokeDashoffset = '0' })
    }, [history.length])

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                </linearGradient>
            </defs>

            {/* Grid */}
            {yTicks.map(t => (
                <g key={t}>
                    <line x1={PAD.left} y1={yS(t)} x2={W - PAD.right} y2={yS(t)}
                          stroke="#ede9fe" strokeWidth="1" strokeDasharray="4 4"/>
                    <text x={PAD.left - 8} y={yS(t) + 4} textAnchor="end"
                          fontSize="11" fill="#c4b5fd" fontFamily="monospace">{t}</text>
                </g>
            ))}

            {/* Area + line */}
            <path d={areaD} fill="url(#sg)"/>
            <path ref={pathRef} d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>

            {/* Points */}
            {history.map((p, i) => {
                const cx     = xS(i)
                const cy     = yS(p.score)
                const isLast = i === history.length - 1
                const color  = getC(p.score)
                const label  = new Date(p.calculated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                    <g key={i}>
                        {isLast && (
                            <line x1={cx} y1={PAD.top} x2={cx} y2={PAD.top + iH}
                                  stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
                        )}
                        <circle cx={cx} cy={cy} r={isLast ? 7 : 5} fill={color} stroke="white" strokeWidth="2"/>
                        <text x={cx} y={cy - 13} textAnchor="middle"
                              fontSize={isLast ? 13 : 11} fontWeight={isLast ? '700' : '500'}
                              fill={color} fontFamily="sans-serif">{p.score}</text>
                        <text x={cx} y={PAD.top + iH + 16} textAnchor="middle"
                              fontSize="10" fill="#a78bfa" fontFamily="sans-serif">{label}</text>
                    </g>
                )
            })}

            {/* Overall delta label */}
            {(() => {
                const delta = history[history.length - 1].score - history[0].score
                return (
                    <text x={W / 2} y={PAD.top - 10} textAnchor="middle"
                          fontSize="12" fontWeight="700" fontFamily="sans-serif"
                          fill={delta >= 0 ? '#22c55e' : '#ef4444'}>
                        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} pts overall
                    </text>
                )
            })()}
        </svg>
    )
}

// ── Page ──────────────────────────────────────────────────────
export default function CreditScorePage() {
    const { session, user } = useAuth()
    const navigate = useNavigate()

    const [creditData, setCreditData]   = useState<CreditScore | null>(null)
    const [history, setHistory]         = useState<HistoryPoint[]>([])
    const [prevScore, setPrevScore]     = useState<number | null>(null)
    const [loading, setLoading]         = useState(true)
    const [recalculating, setRecalc]    = useState(false)
    const [error, setError]             = useState('')
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [timeSince, setTimeSince]     = useState('')
    const [justUpdated, setJustUpdated] = useState(false)
    const [mlOnline, setMlOnline]       = useState<boolean | null>(null)
    const [activeTab, setActiveTab]     = useState<'breakdown' | 'history'>('breakdown')

    const animatedScore = useAnimatedNumber(creditData?.score ?? 0)

    const fetchLatestScore = async () => {
        try {
            const res  = await fetch(`${BACKEND_URL}/api/credit/latest`, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            })
            const data = await res.json()
            if (data?.breakdown) {
                setPrevScore(creditData?.score ?? null)
                setCreditData(data.breakdown)
                setLastUpdated(new Date(data.calculated_at || Date.now()))
            }
        } catch { setError('Failed to load credit score') }
        finally  { setLoading(false) }
    }

    const fetchHistory = async () => {
        if (!user?.id) return
        const { data } = await supabase
            .from('credit_scores')
            .select('score, grade, calculated_at')
            .eq('user_id', user.id)
            .order('calculated_at', { ascending: true })
            .limit(20)
        if (data) setHistory(data as HistoryPoint[])
    }

    const handleRecalculate = async () => {
        setRecalc(true); setError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/credit/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setPrevScore(creditData?.score ?? null)
            setCreditData(data)
            setLastUpdated(new Date())
            setJustUpdated(true)
            setTimeout(() => setJustUpdated(false), 4000)
        } catch (err: any) {
            setError(err.message || 'Recalculation failed')
        } finally { setRecalc(false) }
    }

    // Time since ticker
    useEffect(() => {
        const tick = () => {
            if (!lastUpdated) return
            const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
            setTimeSince(s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`)
        }
        tick()
        const id = setInterval(tick, 10000)
        return () => clearInterval(id)
    }, [lastUpdated])

    // Init + realtime
    useEffect(() => {
        if (!user?.id) return
        fetchLatestScore()
        fetchHistory()

        // ML health check
        fetch(`${BACKEND_URL}/api/credit/ml-health`)
            .then(r => r.json()).then(d => setMlOnline(d.online)).catch(() => setMlOnline(false))

        // Auto-recalc if stale (>24h)
        fetch(`${BACKEND_URL}/api/credit/latest`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
            .then(r => r.json()).then(data => {
            const stale = !data?.calculated_at ||
                (Date.now() - new Date(data.calculated_at).getTime()) > 86400000
            if (stale) handleRecalculate()
        }).catch(() => {})

        // Realtime: new score row inserted
        const scoreCh = supabase
            .channel('score_live')
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public',
                table: 'credit_scores', filter: `user_id=eq.${user.id}`
            }, (payload) => {
                const row = payload.new as any
                if (!row?.breakdown) return
                setPrevScore(s => creditData?.score ?? s)
                setCreditData(row.breakdown)
                setLastUpdated(new Date(row.calculated_at || Date.now()))
                setJustUpdated(true)
                setTimeout(() => setJustUpdated(false), 4000)
                setHistory(prev => [...prev, {
                    score: row.score, grade: row.grade, calculated_at: row.calculated_at
                }])
            })
            .subscribe()

        // Realtime: loan repaid → auto recalculate score
        const loanCh = supabase
            .channel('loan_repaid_score')
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public',
                table: 'loan_applications', filter: `user_id=eq.${user.id}`
            }, (payload) => {
                if ((payload.new as any)?.status === 'repaid')
                    setTimeout(() => handleRecalculate(), 1500)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(scoreCh)
            supabase.removeChannel(loanCh)
        }
    }, [user?.id])

    const getScoreColor = (s: number) =>
        s >= 800 ? '#22c55e' : s >= 700 ? '#8b5cf6' : s >= 600 ? '#6366f1' : s >= 500 ? '#f59e0b' : '#ef4444'

    const getImpactColor = (impact: string) =>
        impact === 'positive' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
            impact === 'negative' ? 'text-red-500 bg-red-50 border-red-200' :
                'text-yellow-600 bg-yellow-50 border-yellow-200'

    const scoreDelta = prevScore != null && creditData ? creditData.score - prevScore : null

    if (loading) return (
        <div className="page-wrapper flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"/>
                <p className="text-xl text-purple-400 font-semibold">Loading your credit score…</p>
            </div>
        </div>
    )

    return (
        <div className="page-wrapper">
            {/* Navbar */}
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
                        <span className="text-base bg-purple-100 text-purple-600 px-4 py-1.5 rounded-full font-semibold ml-2">Credit Score</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${justUpdated ? 'bg-emerald-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`}/>
                            <span className="font-medium text-emerald-600">Live</span>
                            {timeSince && <span className="text-gray-300">· {timeSince}</span>}
                        </div>
                        <button onClick={() => navigate('/apply-loan')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base px-6 py-2.5 rounded-xl transition-colors">
                            Apply for Loan →
                        </button>
                        <button onClick={() => navigate('/dashboard')}
                                className="text-base text-gray-400 hover:text-purple-600 font-semibold transition-colors">
                            Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-10 py-14">

                {/* Banners */}
                {mlOnline === false && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-6 py-3 mb-6 flex items-center gap-3">
                        <span>⚠️</span>
                        <p className="text-yellow-700 text-sm font-medium">
                            XGBoost ML service offline — using rule-based fallback.
                            Run <code className="bg-yellow-100 px-1 rounded">uvicorn ml.main:app --port 8000</code> to enable ML.
                        </p>
                    </div>
                )}
                {mlOnline === true && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-3 mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                        <p className="text-emerald-700 text-sm font-medium">
                            XGBoost ML model active
                            {creditData?.repaymentProbability != null && (
                                <span className="ml-2">· Repayment probability: <strong>{(creditData.repaymentProbability * 100).toFixed(1)}%</strong></span>
                            )}
                        </p>
                    </div>
                )}

                {/* Score change flash */}
                {justUpdated && scoreDelta !== null && scoreDelta !== 0 && (
                    <div className={`rounded-2xl px-6 py-4 mb-6 flex items-center gap-3 font-semibold text-base ${
                        scoreDelta > 0
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                        {scoreDelta > 0 ? '📈' : '📉'}
                        Score {scoreDelta > 0 ? 'increased' : 'decreased'} by{' '}
                        <strong>{Math.abs(scoreDelta)} points</strong>
                        {scoreDelta > 0 ? ' — great improvement!' : ' — check factors below.'}
                    </div>
                )}

                {!creditData ? (
                    <div className="text-center py-20">
                        <div className="text-7xl mb-6">🏦</div>
                        <h2 className="font-display font-bold text-5xl text-gray-900 mb-4">No Credit Score Yet</h2>
                        <p className="text-gray-400 text-xl mb-10">Connect your bank to generate your score</p>
                        <button onClick={() => navigate('/connect-bank')} className="btn-primary"
                                style={{ width: 'auto', padding: '18px 40px', fontSize: '18px', borderRadius: '16px' }}>
                            Connect Bank →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header row */}
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
                            <div>
                                <p className="text-base font-bold text-purple-400 uppercase tracking-widest mb-2">Your Credit Profile</p>
                                <h1 className="font-display font-bold text-5xl text-gray-900 tracking-tight">Credit Score Report</h1>
                            </div>
                            <button onClick={handleRecalculate} disabled={recalculating}
                                    className="flex items-center gap-2 text-base text-purple-600 hover:text-purple-800 font-semibold border border-purple-200 hover:border-purple-400 px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                                {recalculating ? <><Spinner/> Recalculating…</> : '🔄 Recalculate'}
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-6 py-4 mb-6 text-sm">⚠️ {error}</div>
                        )}

                        <div className="grid lg:grid-cols-3 gap-8 mb-10">

                            {/* Score Card */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-3xl p-8 border border-purple-100 text-center sticky top-24"
                                     style={{ boxShadow: '0 4px 24px rgba(109,40,217,0.08)' }}>
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                                        {creditData.isColdStart && (
                                            <span className="bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">🌟 First-time</span>
                                        )}
                                        {creditData.isReturningBorrower && (
                                            <span className="bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full">🏆 Returning</span>
                                        )}
                                        {(creditData.repaymentBonus ?? 0) > 0 && (
                                            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">+{creditData.repaymentBonus} bonus pts</span>
                                        )}
                                    </div>

                                    {/* Arc */}
                                    <div className="relative inline-flex items-center justify-center mb-4">
                                        <ScoreArc score={creditData.score} maxScore={creditData.maxScore} color={getScoreColor(creditData.score)}/>
                                        <div className="absolute bottom-2 text-center">
                                            <p className="font-display font-bold text-6xl" style={{ color: getScoreColor(creditData.score) }}>
                                                {animatedScore}
                                            </p>
                                            <p className="text-gray-400 text-xs">out of {creditData.maxScore}</p>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-lg font-bold mb-1"
                                         style={{ background: `${getScoreColor(creditData.score)}15`, color: getScoreColor(creditData.score) }}>
                                        {creditData.grade}
                                    </div>
                                    <p className="text-gray-500 text-sm font-semibold mb-1">{creditData.riskLevel}</p>
                                    <p className="text-xs text-gray-300 mb-5">
                                        {creditData.model === 'XGBoost' ? '🤖 XGBoost ML' : '📐 Rule-based Engine'}
                                    </p>

                                    {/* Range legend */}
                                    <div className="space-y-1.5 text-left">
                                        {[
                                            { label: 'Excellent', range: '800–950', color: '#22c55e', min: 800, max: 951 },
                                            { label: 'Very Good', range: '700–799', color: '#8b5cf6', min: 700, max: 800 },
                                            { label: 'Good',      range: '600–699', color: '#6366f1', min: 600, max: 700 },
                                            { label: 'Fair',      range: '500–599', color: '#f59e0b', min: 500, max: 600 },
                                            { label: 'Poor',      range: '300–499', color: '#ef4444', min: 0,   max: 500 },
                                        ].map(r => (
                                            <div key={r.label} className={`flex items-center justify-between text-sm rounded-lg px-3 py-1.5 ${
                                                creditData.score >= r.min && creditData.score < r.max ? 'bg-purple-50' : ''
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }}/>
                                                    <span className="text-gray-600 font-medium">{r.label}</span>
                                                </div>
                                                <span className="text-gray-400 font-mono text-xs">{r.range}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel */}
                            <div className="lg:col-span-2 space-y-5">

                                {/* Tabs */}
                                <div className="flex gap-2">
                                    {(['breakdown', 'history'] as const).map(tab => (
                                        <button key={tab} onClick={() => setActiveTab(tab)}
                                                className={`px-6 py-2.5 rounded-xl text-base font-semibold transition-all ${
                                                    activeTab === tab
                                                        ? 'bg-purple-600 text-white shadow-md'
                                                        : 'bg-white border border-purple-100 text-gray-500 hover:border-purple-300'
                                                }`}>
                                            {tab === 'breakdown' ? '📊 Score Breakdown' : '📈 Score History'}
                                            {tab === 'history' && history.length > 0 && (
                                                <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {history.length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* ── BREAKDOWN ── */}
                                {activeTab === 'breakdown' && (
                                    <div className="space-y-4">
                                        <p className="text-gray-400 text-sm">{creditData.factors?.length} factors analysed</p>
                                        {creditData.factors?.map((f, i) => (
                                            <div key={i} className="bg-white rounded-2xl p-6 border border-purple-100 hover:border-purple-300 transition-all"
                                                 style={{ boxShadow: '0 2px 12px rgba(109,40,217,0.04)' }}>
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-800 text-lg">{f.name}</h3>
                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getImpactColor(f.impact)}`}>
                                                                {f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '→'} {f.impact}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-500 text-sm">{f.reason}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-display font-bold text-3xl" style={{ color: getScoreColor(f.score) }}>{f.score}</p>
                                                        <p className="text-gray-400 text-xs">/ 100</p>
                                                        <p className="text-purple-500 text-xs font-semibold">{(f.weight * 100).toFixed(0)}% weight</p>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 bg-purple-50 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{
                                                        width: `${f.score}%`,
                                                        background: getScoreColor(f.score),
                                                        transition: 'width 1s cubic-bezier(0.4,0,0.2,1)'
                                                    }}/>
                                                </div>
                                            </div>
                                        ))}
                                        {creditData.factors?.some(f => f.impact === 'negative') && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                                <p className="font-bold text-amber-800 text-sm mb-2">💡 How to improve your score</p>
                                                <ul className="space-y-1">
                                                    {creditData.factors.filter(f => f.impact === 'negative').map((f, i) => (
                                                        <li key={i} className="text-amber-700 text-sm flex gap-2">
                                                            <span>•</span>
                                                            <span>Improve <strong>{f.name}</strong> — {f.reason}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── HISTORY ── */}
                                {activeTab === 'history' && (
                                    <div className="space-y-5">
                                        {history.length < 2 ? (
                                            <div className="bg-white rounded-3xl p-12 border border-purple-100 text-center">
                                                <p className="text-4xl mb-4">📊</p>
                                                <p className="text-gray-500 text-lg font-semibold mb-2">Not enough history yet</p>
                                                <p className="text-gray-400 text-sm mb-6">
                                                    You need at least 2 score calculations to see a trend.
                                                    {history.length === 1 && <span className="block mt-1 text-purple-500">You have 1 so far — recalculate once more!</span>}
                                                </p>
                                                <button onClick={handleRecalculate} disabled={recalculating}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-6 py-3 rounded-xl disabled:opacity-50">
                                                    {recalculating ? 'Calculating…' : '🔄 Calculate Now'}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Chart */}
                                                <div className="bg-white rounded-3xl p-8 border border-purple-100"
                                                     style={{ boxShadow: '0 4px 20px rgba(109,40,217,0.06)' }}>
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div>
                                                            <h3 className="font-bold text-xl text-gray-800">Score Over Time</h3>
                                                            <p className="text-gray-400 text-sm mt-0.5">{history.length} calculations · last updated {timeSince}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400 mb-0.5">Overall change</p>
                                                            <p className={`text-2xl font-bold ${
                                                                history[history.length - 1].score >= history[0].score ? 'text-emerald-600' : 'text-red-500'
                                                            }`}>
                                                                {history[history.length - 1].score >= history[0].score ? '+' : ''}
                                                                {history[history.length - 1].score - history[0].score} pts
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ScoreHistoryChart history={history}/>
                                                </div>

                                                {/* History table */}
                                                <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden">
                                                    <div className="px-8 py-4 bg-purple-50 grid grid-cols-4 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                                        <div>#</div><div>Date &amp; Time</div><div>Score</div><div>Change</div>
                                                    </div>
                                                    {[...history].reverse().map((h, i, arr) => {
                                                        const next  = arr[i + 1]
                                                        const delta = next ? h.score - next.score : null
                                                        return (
                                                            <div key={i} className={`px-8 py-4 grid grid-cols-4 gap-4 items-center border-b border-purple-50 last:border-0 ${i === 0 ? 'bg-purple-50/30' : ''}`}>
                                                                <div className="text-gray-400 text-sm font-mono">#{history.length - i}</div>
                                                                <div>
                                                                    <p className="text-gray-700 text-sm font-medium">
                                                                        {new Date(h.calculated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                                    </p>
                                                                    <p className="text-gray-300 text-xs">
                                                                        {new Date(h.calculated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-lg" style={{ color: getScoreColor(h.score) }}>{h.score}</span>
                                                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{h.grade}</span>
                                                                </div>
                                                                <div>
                                                                    {delta !== null ? (
                                                                        <span className={`text-sm font-bold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                                            {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {delta !== 0 ? Math.abs(delta) : 'No change'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-full">baseline</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl p-10"
                             style={{ boxShadow: '0 8px 30px rgba(109,40,217,0.3)' }}>
                            <div className="flex items-start gap-6">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">💡</div>
                                <div className="flex-1">
                                    <h3 className="text-white font-display font-bold text-2xl mb-2">
                                        {creditData.model === 'XGBoost' ? 'XGBoost Recommendation' : 'AI Recommendation'}
                                    </h3>
                                    <p className="text-purple-100 text-lg leading-relaxed">{creditData.recommendation}</p>
                                    <div className="flex items-center gap-4 mt-6 flex-wrap">
                                        <button onClick={() => navigate('/apply-loan')}
                                                className="bg-white text-purple-700 font-bold text-base px-8 py-3.5 rounded-2xl hover:bg-purple-50 transition-colors">
                                            Apply for a Loan →
                                        </button>
                                        <button onClick={handleRecalculate} disabled={recalculating}
                                                className="bg-white/20 hover:bg-white/30 text-white font-semibold text-base px-6 py-3.5 rounded-2xl transition-colors disabled:opacity-50 flex items-center gap-2">
                                            {recalculating ? <><Spinner/> Updating…</> : '🔄 Refresh Score'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
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
