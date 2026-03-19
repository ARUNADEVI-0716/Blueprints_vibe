import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { CreditScorePageSkeleton } from '@/components/Skeleton'

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

function useAnimatedNumber(target: number, duration = 1200) {
    const [display, setDisplay] = useState(target)
    const rafRef  = useRef<number>(0)
    const fromRef = useRef(target)
    useEffect(() => {
        const from = fromRef.current
        fromRef.current = target
        const t0   = performance.now()
        const tick = (now: number) => {
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

function ScoreArc({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
    const ARC_LEN = 283
    const target  = Math.max(0, Math.min(1, (score - 300) / (maxScore - 300))) * ARC_LEN
    const [dash, setDash] = useState(0)
    const curRef  = useRef(0)
    useEffect(() => {
        const from = curRef.current
        const t0   = performance.now()
        let raf: number
        const tick = (now: number) => {
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
            <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke="#e0e3e5" strokeWidth="16" strokeLinecap="round"/>
            <path d="M 20 120 A 90 90 0 0 1 200 120" fill="none" stroke={color} strokeWidth="16"
                  strokeLinecap="round" strokeDasharray={`${dash} ${ARC_LEN}`} style={{ transition: 'stroke 0.5s' }}/>
            {dash > 4 && <circle cx={tipX} cy={tipY} r="9" fill={color} opacity="0.22"/>}
            {dash > 4 && <circle cx={tipX} cy={tipY} r="5" fill={color}/>}
        </svg>
    )
}

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
    const getC   = (s: number) =>
        s >= 800 ? '#22c55e' : s >= 700 ? '#0060ac' : s >= 600 ? '#0060ac' : s >= 500 ? '#f59e0b' : '#ef4444'
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
                    <stop offset="0%"   stopColor="#0060ac" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#0060ac" stopOpacity="0"/>
                </linearGradient>
            </defs>
            {yTicks.map(t => (
                <g key={t}>
                    <line x1={PAD.left} y1={yS(t)} x2={W - PAD.right} y2={yS(t)} stroke="#e0e3e5" strokeWidth="1" strokeDasharray="4 4"/>
                    <text x={PAD.left - 8} y={yS(t) + 4} textAnchor="end" fontSize="11" fill="#c4c6d0" fontFamily="monospace">{t}</text>
                </g>
            ))}
            <path d={areaD} fill="url(#sg)"/>
            <path ref={pathRef} d={pathD} fill="none" stroke="#0060ac" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {history.map((p, i) => {
                const cx     = xS(i)
                const cy     = yS(p.score)
                const isLast = i === history.length - 1
                const color  = getC(p.score)
                const label  = new Date(p.calculated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                    <g key={i}>
                        {isLast && <line x1={cx} y1={PAD.top} x2={cx} y2={PAD.top + iH} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>}
                        <circle cx={cx} cy={cy} r={isLast ? 7 : 5} fill={color} stroke="white" strokeWidth="2"/>
                        <text x={cx} y={cy - 13} textAnchor="middle" fontSize={isLast ? 13 : 11} fontWeight={isLast ? '700' : '500'} fill={color} fontFamily="sans-serif">{p.score}</text>
                        <text x={cx} y={PAD.top + iH + 16} textAnchor="middle" fontSize="10" fill="#747780" fontFamily="sans-serif">{label}</text>
                    </g>
                )
            })}
            {(() => {
                const delta = history[history.length - 1].score - history[0].score
                return (
                    <text x={W / 2} y={PAD.top - 10} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="sans-serif" fill={delta >= 0 ? '#22c55e' : '#ef4444'}>
                        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} pts overall
                    </text>
                )
            })()}
        </svg>
    )
}

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
            const res  = await fetch(`${BACKEND_URL}/api/credit/latest`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
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
        const { data } = await supabase.from('credit_scores').select('score, grade, calculated_at').eq('user_id', user.id).order('calculated_at', { ascending: true }).limit(20)
        if (data) setHistory(data as HistoryPoint[])
    }

    const handleRecalculate = async () => {
        setRecalc(true); setError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/credit/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` } })
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

    useEffect(() => {
        if (!user?.id) return
        fetchLatestScore()
        fetchHistory()
        fetch(`${BACKEND_URL}/api/credit/ml-health`).then(r => r.json()).then(d => setMlOnline(d.online)).catch(() => setMlOnline(false))
        fetch(`${BACKEND_URL}/api/credit/latest`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
            .then(r => r.json()).then(data => {
            const stale = !data?.calculated_at || (Date.now() - new Date(data.calculated_at).getTime()) > 86400000
            if (stale) handleRecalculate()
        }).catch(() => {})
        const scoreCh = supabase.channel('score_live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credit_scores', filter: `user_id=eq.${user.id}` }, (payload) => {
                const row = payload.new as any
                if (!row?.breakdown) return
                setPrevScore(s => creditData?.score ?? s)
                setCreditData(row.breakdown)
                setLastUpdated(new Date(row.calculated_at || Date.now()))
                setJustUpdated(true)
                setTimeout(() => setJustUpdated(false), 4000)
                setHistory(prev => [...prev, { score: row.score, grade: row.grade, calculated_at: row.calculated_at }])
            }).subscribe()
        const loanCh = supabase.channel('loan_repaid_score')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loan_applications', filter: `user_id=eq.${user.id}` }, (payload) => {
                if ((payload.new as any)?.status === 'repaid') setTimeout(() => handleRecalculate(), 1500)
            }).subscribe()
        return () => { supabase.removeChannel(scoreCh); supabase.removeChannel(loanCh) }
    }, [user?.id])

    const getScoreColor = (s: number) =>
        s >= 800 ? '#22c55e' : s >= 700 ? '#0060ac' : s >= 600 ? '#0060ac' : s >= 500 ? '#f59e0b' : '#ef4444'

    const scoreDelta = prevScore != null && creditData ? creditData.score - prevScore : null

    if (loading) return <CreditScorePageSkeleton />

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif' }}>

            {/* ── Navbar ─────────────────────────────────────────── */}
            <nav style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e0e3e5', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#eef4ff', color: '#0060ac', padding: '4px 12px', borderRadius: 100 }}>Credit Score</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
                            <div style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%' }}/>
                            Live
                            {timeSince && <span style={{ color: '#c4c6d0', fontWeight: 400 }}>· {timeSince}</span>}
                        </div>
                        <button onClick={() => navigate('/apply-loan')}
                                style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                            Apply for Loan →
                        </button>
                        <button onClick={() => navigate('/dashboard')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#43474f' }}>
                            Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

                {/* Banners */}
                {mlOnline === false && (
                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 10, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>⚠️</span>
                        <p style={{ fontSize: 13, color: '#a16207', margin: 0 }}>
                            XGBoost ML service offline — using rule-based fallback. Run <code style={{ background: '#fef9c3', padding: '1px 6px', borderRadius: 4 }}>uvicorn ml.main:app --port 8000</code> to enable ML.
                        </p>
                    </div>
                )}
                {mlOnline === true && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%' }}/>
                        <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
                            XGBoost ML model active
                            {creditData?.repaymentProbability != null && (
                                <span> · Repayment probability: <strong>{(creditData.repaymentProbability * 100).toFixed(1)}%</strong></span>
                            )}
                        </p>
                    </div>
                )}

                {/* Score change flash */}
                {justUpdated && scoreDelta !== null && scoreDelta !== 0 && (
                    <div style={{ background: scoreDelta > 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scoreDelta > 0 ? '#bbf7d0' : '#fecaca'}`, color: scoreDelta > 0 ? '#15803d' : '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                        {scoreDelta > 0 ? '📈' : '📉'}
                        Score {scoreDelta > 0 ? 'increased' : 'decreased'} by <strong>{Math.abs(scoreDelta)} points</strong>
                        {scoreDelta > 0 ? ' — great improvement!' : ' — check factors below.'}
                    </div>
                )}

                {!creditData ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: 56, marginBottom: 24 }}>🏦</div>
                        <h2 style={{ fontWeight: 900, fontSize: 36, color: '#001736', marginBottom: 12 }}>No Credit Score Yet</h2>
                        <p style={{ fontSize: 16, color: '#43474f', marginBottom: 32 }}>Connect your bank to generate your score</p>
                        <button onClick={() => navigate('/connect-bank')}
                                style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 10, padding: '14px 36px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                            Connect Bank →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#0060ac', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Credit Profile</p>
                                <h1 style={{ fontWeight: 900, fontSize: 'clamp(24px, 3vw, 36px)', color: '#001736', letterSpacing: '-1px', margin: 0 }}>Credit Score Report</h1>
                            </div>
                            <button onClick={handleRecalculate} disabled={recalculating}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0060ac', border: '1.5px solid #c4c6d0', background: 'white', borderRadius: 10, padding: '10px 20px', cursor: recalculating ? 'not-allowed' : 'pointer', opacity: recalculating ? 0.6 : 1, transition: 'all 0.2s' }}>
                                {recalculating ? <><Spinner/> Recalculating…</> : '🔄 Recalculate'}
                            </button>
                        </div>

                        {error && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 20px', marginBottom: 20, fontSize: 14 }}>⚠️ {error}</div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginBottom: 24 }}>

                            {/* Score Card */}
                            <div style={{ background: 'white', borderRadius: 16, padding: '28px 20px', border: '1px solid #e0e3e5', textAlign: 'center', position: 'sticky', top: 80, alignSelf: 'start', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                                    {creditData.isColdStart && (
                                        <span style={{ background: '#eef4ff', color: '#0060ac', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>🌟 First-time</span>
                                    )}
                                    {creditData.isReturningBorrower && (
                                        <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>🏆 Returning</span>
                                    )}
                                    {(creditData.repaymentBonus ?? 0) > 0 && (
                                        <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>+{creditData.repaymentBonus} bonus</span>
                                    )}
                                </div>

                                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <ScoreArc score={creditData.score} maxScore={creditData.maxScore} color={getScoreColor(creditData.score)}/>
                                    <div style={{ position: 'absolute', bottom: 8, textAlign: 'center' }}>
                                        <p style={{ fontWeight: 900, fontSize: 48, color: getScoreColor(creditData.score), margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>{animatedScore}</p>
                                        <p style={{ fontSize: 11, color: '#747780', margin: 0 }}>out of {creditData.maxScore}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'inline-block', background: `${getScoreColor(creditData.score)}15`, color: getScoreColor(creditData.score), padding: '6px 18px', borderRadius: 100, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                                    {creditData.grade}
                                </div>
                                <p style={{ fontSize: 13, color: '#43474f', fontWeight: 600, marginBottom: 4 }}>{creditData.riskLevel}</p>
                                <p style={{ fontSize: 11, color: '#c4c6d0', marginBottom: 20 }}>
                                    {creditData.model === 'XGBoost' ? '🤖 XGBoost ML' : '📐 Rule-based'}
                                </p>

                                {/* Range legend */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                                    {[
                                        { label: 'Excellent', range: '800–950', color: '#22c55e', min: 800, max: 951 },
                                        { label: 'Very Good', range: '700–799', color: '#0060ac', min: 700, max: 800 },
                                        { label: 'Good',      range: '600–699', color: '#0060ac', min: 600, max: 700 },
                                        { label: 'Fair',      range: '500–599', color: '#f59e0b', min: 500, max: 600 },
                                        { label: 'Poor',      range: '300–499', color: '#ef4444', min: 0,   max: 500 },
                                    ].map(r => (
                                        <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: creditData.score >= r.min && creditData.score < r.max ? '#f2f4f6' : 'transparent' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }}/>
                                                <span style={{ fontSize: 12, color: '#43474f', fontWeight: 500 }}>{r.label}</span>
                                            </div>
                                            <span style={{ fontSize: 11, color: '#747780', fontFamily: 'monospace' }}>{r.range}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Panel */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Tabs */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(['breakdown', 'history'] as const).map(tab => (
                                        <button key={tab} onClick={() => setActiveTab(tab)}
                                                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                                                    background: activeTab === tab ? '#001736' : 'white',
                                                    color: activeTab === tab ? 'white' : '#43474f',
                                                    boxShadow: activeTab === tab ? 'none' : '0 1px 4px rgba(0,0,0,0.06)'
                                                }}>
                                            {tab === 'breakdown' ? '📊 Score Breakdown' : '📈 Score History'}
                                            {tab === 'history' && history.length > 0 && (
                                                <span style={{ marginLeft: 8, background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#eef4ff', color: activeTab === tab ? 'white' : '#0060ac', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                                                    {history.length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Breakdown */}
                                {activeTab === 'breakdown' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <p style={{ fontSize: 12, color: '#747780', margin: 0 }}>{creditData.factors?.length} factors analysed</p>
                                        {creditData.factors?.map((f, i) => (
                                            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '20px', border: '1px solid #e0e3e5', transition: 'all 0.2s' }}
                                                 onMouseEnter={e => (e.currentTarget.style.borderColor = '#a4c9ff')}
                                                 onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e3e5')}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#001736', margin: 0 }}>{f.name}</h3>
                                                            <span style={{
                                                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                                                                background: f.impact === 'positive' ? '#f0fdf4' : f.impact === 'negative' ? '#fef2f2' : '#fefce8',
                                                                color: f.impact === 'positive' ? '#15803d' : f.impact === 'negative' ? '#dc2626' : '#a16207'
                                                            }}>
                                                                {f.impact === 'positive' ? '↑' : f.impact === 'negative' ? '↓' : '→'} {f.impact}
                                                            </span>
                                                        </div>
                                                        <p style={{ fontSize: 12, color: '#43474f', margin: 0 }}>{f.reason}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <p style={{ fontWeight: 900, fontSize: 28, color: getScoreColor(f.score), margin: 0, letterSpacing: '-1px' }}>{f.score}</p>
                                                        <p style={{ fontSize: 11, color: '#747780', margin: 0 }}>/ 100</p>
                                                        <p style={{ fontSize: 11, color: '#0060ac', fontWeight: 600, margin: 0 }}>{(f.weight * 100).toFixed(0)}% weight</p>
                                                    </div>
                                                </div>
                                                <div style={{ height: 6, background: '#f2f4f6', borderRadius: 100, overflow: 'hidden' }}>
                                                    <div style={{ width: `${f.score}%`, height: '100%', background: getScoreColor(f.score), borderRadius: 100, transition: 'width 1s ease' }}/>
                                                </div>
                                            </div>
                                        ))}
                                        {creditData.factors?.some(f => f.impact === 'negative') && (
                                            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 12, padding: '16px 20px' }}>
                                                <p style={{ fontWeight: 700, color: '#a16207', fontSize: 13, marginBottom: 8 }}>💡 How to improve your score</p>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {creditData.factors.filter(f => f.impact === 'negative').map((f, i) => (
                                                        <li key={i} style={{ fontSize: 13, color: '#92400e', display: 'flex', gap: 8 }}>
                                                            <span>•</span><span>Improve <strong>{f.name}</strong> — {f.reason}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* History */}
                                {activeTab === 'history' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {history.length < 2 ? (
                                            <div style={{ background: 'white', borderRadius: 12, padding: '48px', textAlign: 'center', border: '1px solid #e0e3e5' }}>
                                                <p style={{ fontSize: 32, marginBottom: 12 }}>📊</p>
                                                <p style={{ fontWeight: 700, fontSize: 16, color: '#43474f', marginBottom: 6 }}>Not enough history yet</p>
                                                <p style={{ fontSize: 13, color: '#747780', marginBottom: 20 }}>
                                                    You need at least 2 calculations to see a trend.
                                                    {history.length === 1 && <span style={{ display: 'block', color: '#0060ac', marginTop: 4 }}>You have 1 so far — recalculate once more!</span>}
                                                </p>
                                                <button onClick={handleRecalculate} disabled={recalculating}
                                                        style={{ background: '#001736', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: recalculating ? 0.6 : 1 }}>
                                                    {recalculating ? 'Calculating…' : '🔄 Calculate Now'}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ background: 'white', borderRadius: 12, padding: '24px', border: '1px solid #e0e3e5' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                                        <div>
                                                            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#001736', margin: 0, marginBottom: 4 }}>Score Over Time</h3>
                                                            <p style={{ fontSize: 12, color: '#747780', margin: 0 }}>{history.length} calculations · {timeSince}</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ fontSize: 11, color: '#747780', margin: 0 }}>Overall change</p>
                                                            <p style={{ fontWeight: 800, fontSize: 22, margin: 0, color: history[history.length - 1].score >= history[0].score ? '#22c55e' : '#ef4444' }}>
                                                                {history[history.length - 1].score >= history[0].score ? '+' : ''}{history[history.length - 1].score - history[0].score} pts
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ScoreHistoryChart history={history}/>
                                                </div>

                                                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e3e5' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '12px 24px', background: '#f2f4f6', fontSize: 10, fontWeight: 700, color: '#747780', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                        <div>#</div><div>Date</div><div>Score</div><div>Change</div>
                                                    </div>
                                                    {[...history].reverse().map((h, i, arr) => {
                                                        const next  = arr[i + 1]
                                                        const delta = next ? h.score - next.score : null
                                                        return (
                                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '14px 24px', alignItems: 'center', borderBottom: '1px solid #f2f4f6', background: i === 0 ? '#f7f9fb' : 'white' }}>
                                                                <div style={{ fontSize: 12, color: '#747780', fontFamily: 'monospace' }}>#{history.length - i}</div>
                                                                <div>
                                                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#001736', margin: 0 }}>{new Date(h.calculated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                                                                    <p style={{ fontSize: 11, color: '#c4c6d0', margin: 0 }}>{new Date(h.calculated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span style={{ fontWeight: 800, fontSize: 18, color: getScoreColor(h.score) }}>{h.score}</span>
                                                                    <span style={{ fontSize: 11, color: '#747780', background: '#f2f4f6', padding: '2px 8px', borderRadius: 100 }}>{h.grade}</span>
                                                                </div>
                                                                <div>
                                                                    {delta !== null ? (
                                                                        <span style={{ fontSize: 13, fontWeight: 700, color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#747780' }}>
                                                                            {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {delta !== 0 ? Math.abs(delta) : 'No change'}
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ fontSize: 11, color: '#c4c6d0', background: '#f2f4f6', padding: '3px 10px', borderRadius: 100 }}>baseline</span>
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
                        <div style={{ background: 'linear-gradient(135deg, #001736 0%, #002b5b 100%)', borderRadius: 16, padding: '40px 48px', display: 'flex', alignItems: 'flex-start', gap: 24, boxShadow: '0 8px 30px rgba(0,23,54,0.25)' }}>
                            <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💡</div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 8 }}>
                                    {creditData.model === 'XGBoost' ? 'XGBoost Recommendation' : 'AI Recommendation'}
                                </h3>
                                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24 }}>{creditData.recommendation}</p>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button onClick={() => navigate('/apply-loan')}
                                            style={{ background: 'white', color: '#001736', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                                        Apply for a Loan →
                                    </button>
                                    <button onClick={handleRecalculate} disabled={recalculating}
                                            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: recalculating ? 0.6 : 1 }}>
                                        {recalculating ? <><Spinner/> Updating…</> : '🔄 Refresh Score'}
                                    </button>
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
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}