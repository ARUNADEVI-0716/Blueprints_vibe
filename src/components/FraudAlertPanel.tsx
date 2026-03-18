import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface FraudFlag {
    code: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    detail?: string
}

interface FraudResult {
    riskScore: number
    riskLevel: 'clean' | 'low' | 'medium' | 'high' | 'critical'
    flags: FraudFlag[]
    blocked: boolean
    recommendation: string
}

const SEVERITY_STYLES = {
    low:      { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   icon: 'ℹ️' },
    medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: '⚠️' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: '🚨' },
    critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',      icon: '🛑' },
}

const LEVEL_STYLES = {
    clean:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', label: '✅ Clean' },
    low:      { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    badge: 'bg-blue-100 text-blue-700',       label: 'ℹ️ Low Risk' },
    medium:   { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-800',  badge: 'bg-yellow-100 text-yellow-700',   label: '⚠️ Medium Risk' },
    high:     { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-800',  badge: 'bg-orange-100 text-orange-700',   label: '🚨 High Risk' },
    critical: { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     badge: 'bg-red-100 text-red-700',         label: '🛑 Critical' },
}

export default function FraudAlertPanel({
                                            applicationId,
                                            token,
                                            // If parent already has fraud data on the application object, pass it directly
                                            cachedRiskScore,
                                            cachedRiskLevel,
                                            cachedFlags,
                                        }: {
    applicationId: string
    token: string
    cachedRiskScore?: number
    cachedRiskLevel?: string
    cachedFlags?: FraudFlag[]
}) {
    const [result, setResult]   = useState<FraudResult | null>(
        cachedRiskLevel ? {
            riskScore: cachedRiskScore ?? 0,
            riskLevel: cachedRiskLevel as FraudResult['riskLevel'],
            flags: cachedFlags ?? [],
            blocked: (cachedRiskScore ?? 0) >= 80,
            recommendation: ''
        } : null
    )
    const [loading, setLoading] = useState(!cachedRiskLevel)
    const [error, setError]     = useState('')

    useEffect(() => {
        if (!cachedRiskLevel) runCheck()
    }, [applicationId])

    const runCheck = async () => {
        setLoading(true); setError('')
        try {
            const res = await fetch(`${BACKEND_URL}/api/fraud/report/${applicationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-purple-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin flex-shrink-0" />
                <p className="text-gray-400 text-base">Running fraud analysis…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-center justify-between gap-4">
                <div>
                    <p className="text-red-700 font-bold text-base">Fraud check failed</p>
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
                <button onClick={runCheck} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors flex-shrink-0">
                    🔄 Retry
                </button>
            </div>
        )
    }

    if (!result) return null

    const levelStyle = LEVEL_STYLES[result.riskLevel]

    return (
        <div className={`rounded-3xl border-2 overflow-hidden ${result.riskLevel === 'critical' || result.riskLevel === 'high' ? 'border-red-300' : result.riskLevel === 'medium' ? 'border-yellow-300' : 'border-purple-100'}`}>

            {/* Header */}
            <div className={`px-8 py-6 ${levelStyle.bg} border-b ${levelStyle.border} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-2xl text-gray-900">🔍 Fraud Risk Analysis</h3>
                            <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${levelStyle.badge}`}>
                                {levelStyle.label}
                            </span>
                            {result.blocked && (
                                <span className="text-sm font-bold px-4 py-1.5 rounded-full bg-red-600 text-white animate-pulse">
                                    🚫 BLOCKED
                                </span>
                            )}
                        </div>
                        <p className={`text-base ${levelStyle.text}`}>{result.recommendation}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Risk score meter */}
                    <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Risk Score</p>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center font-display font-bold text-2xl border-4"
                             style={{
                                 borderColor: result.riskScore >= 75 ? '#dc2626' : result.riskScore >= 45 ? '#ea580c' : result.riskScore >= 20 ? '#ca8a04' : '#16a34a',
                                 color:       result.riskScore >= 75 ? '#dc2626' : result.riskScore >= 45 ? '#ea580c' : result.riskScore >= 20 ? '#ca8a04' : '#16a34a',
                             }}>
                            {result.riskScore}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">/ 100</p>
                    </div>

                    <button onClick={runCheck}
                            className="px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors">
                        🔄 Re-run
                    </button>
                </div>
            </div>

            {/* Flags */}
            <div className="bg-white px-8 py-6">
                {result.flags.length === 0 ? (
                    <div className="flex items-center gap-3 py-4">
                        <span className="text-3xl">✅</span>
                        <div>
                            <p className="font-bold text-emerald-700 text-lg">No fraud indicators detected</p>
                            <p className="text-gray-400 text-sm">All checks passed. Application appears legitimate.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                            {result.flags.length} flag{result.flags.length > 1 ? 's' : ''} detected
                        </p>
                        {result.flags.map((flag, i) => {
                            const s = SEVERITY_STYLES[flag.severity]
                            return (
                                <div key={i} className={`rounded-2xl border p-5 ${s.bg} ${s.border}`}>
                                    <div className="flex items-start gap-4">
                                        <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <p className={`font-bold text-base ${s.text}`}>{flag.message}</p>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${s.badge}`}>
                                                    {flag.severity}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">{flag.code}</span>
                                            </div>
                                            {flag.detail && (
                                                <p className="text-sm text-gray-600 leading-relaxed">{flag.detail}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}