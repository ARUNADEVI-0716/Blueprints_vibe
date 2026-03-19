import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

function MSIcon({ name, size = 20, color, fill = 0 }: { name: string; size?: number; color?: string; fill?: number }) {
    return (
        <span className="material-symbols-outlined"
              style={{ fontSize: size, color, lineHeight: 1, fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`, verticalAlign: 'middle' }}>
            {name}
        </span>
    )
}

export default function OfficerTOTPVerify() {
    const navigate = useNavigate()
    const [code, setCode]           = useState('')
    const [loading, setLoading]     = useState(false)
    const [resetting, setResetting] = useState(false)
    const [error, setError]         = useState('')

    const officerEmail = localStorage.getItem('officer_email') || 'Officer'

    const handleVerify = async () => {
        if (code.length !== 6) { setError('Please enter the 6-digit code'); return }
        setLoading(true); setError('')

        try {
            const { data: factorsData } = await supabase.auth.mfa.listFactors()
            const totpFactor = factorsData?.totp?.find(f => f.status === 'verified')

            if (!totpFactor) { navigate('/officer/setup-2fa'); return }

            const { data: challenge, error: challengeError } =
                await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
            if (challengeError) throw challengeError

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challenge.id,
                code
            })

            if (verifyError) {
                setError('Invalid code. Please check your authenticator app.')
                setCode(''); setLoading(false); return
            }

            // Refresh session so the new AAL2 token is stored —
            // OfficerDashboard reads the session and will now pass the email check
            await supabase.auth.refreshSession()

            localStorage.setItem('officer_totp_verified', 'true')

            // 300ms delay lets AuthContext receive the refreshed session
            // via onAuthStateChange before OfficerDashboard's getSession() fires
            setTimeout(() => navigate('/officer/dashboard'), 800)

        } catch (err: any) {
            setError(err.message || 'Verification failed')
            setLoading(false)
        }
    }

    // Unenroll using the current AAL1 Supabase session — no backend API needed.
    // Then navigate to setup-2fa with forceResetup=true so enrollTOTP skips
    // the "verified factor exists → redirect to verify" guard.
    const handleResetTOTP = async () => {
        setResetting(true); setError('')
        try {
            const { data: factorsData } = await supabase.auth.mfa.listFactors()
            for (const factor of factorsData?.totp ?? []) {
                await supabase.auth.mfa.unenroll({ factorId: factor.id })
            }
            navigate('/officer/setup-2fa', { state: { forceResetup: true } })
        } catch (err: any) {
            setError(err.message || 'Failed to reset 2FA. Please contact your administrator.')
            setResetting(false)
        }
    }

    return (
        <div style={{ minHeight:'100vh', background:'#f7f9fb', fontFamily:'Public Sans, Inter, sans-serif', display:'flex', flexDirection:'column' }}>
            <style>{`
                .material-symbols-outlined { font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; vertical-align:middle; }
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>

            <header style={{ position:'fixed', top:0, width:'100%', zIndex:50, background:'rgba(255,255,255,0.9)', backdropFilter:'blur(16px)', borderBottom:'1px solid #e0e3e5', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <MSIcon name="shield_lock" size={20} color="#001736" fill={1}/>
                        <span style={{ fontWeight:900, fontSize:16, color:'#001736', letterSpacing:'-0.3px' }}>Nexus Officer Portal</span>
                    </div>
                    <span style={{ fontSize:12, color:'#747780', fontWeight:500 }}>Security Portal</span>
                </div>
            </header>

            <main style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px', gap:24, flexWrap:'wrap' }}>

                <div style={{ width:'100%', maxWidth:440, background:'white', borderRadius:14, border:'1px solid #e0e3e5', boxShadow:'0 8px 32px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                    <div style={{ height:4, background:'linear-gradient(90deg,#001736,#0060ac)' }}/>
                    <div style={{ padding:'36px 40px' }}>

                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
                            <div style={{ width:32, height:32, background:'#001736', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                                    <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                    <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                    <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontWeight:900, fontSize:16, color:'#001736', margin:0 }}>Nexus</p>
                                <span style={{ fontSize:11, fontWeight:700, background:'#eef4ff', color:'#0060ac', padding:'2px 8px', borderRadius:100 }}>Officer 2FA Verification</span>
                            </div>
                        </div>

                        <div style={{ textAlign:'center', marginBottom:24 }}>
                            <div style={{ width:56, height:56, borderRadius:'50%', background:'#f2f4f6', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                                <MSIcon name="passkey" size={28} color="#0060ac" fill={1}/>
                            </div>
                            <h1 style={{ fontWeight:900, fontSize:22, color:'#001736', letterSpacing:'-0.5px', marginBottom:6 }}>Two-Factor Auth</h1>
                            <p style={{ fontSize:14, color:'#43474f', lineHeight:1.6 }}>
                                Welcome back, <strong style={{ color:'#001736' }}>{officerEmail}</strong>
                                <br/>Enter the 6-digit code from your authenticator app
                            </p>
                        </div>

                        {error && (
                            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, display:'flex', gap:8, alignItems:'center' }}>
                                <MSIcon name="warning" size={14} color="#dc2626"/> {error}
                            </div>
                        )}

                        <div style={{ marginBottom:20 }}>
                            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#43474f', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
                                Authenticator Code
                            </label>
                            <div style={{ position:'relative' }}>
                                <input
                                    type="text" inputMode="numeric" maxLength={6}
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                    onKeyDown={e => e.key==='Enter' && handleVerify()}
                                    autoFocus
                                    style={{ width:'100%', height:72, textAlign:'center', fontSize:32, fontWeight:900, letterSpacing:'12px', fontFamily:'monospace', color:'#001736', background:'#f2f4f6', border:'2px solid #e0e3e5', borderRadius:12, outline:'none', boxSizing:'border-box', paddingLeft:12, transition:'all 0.2s', caretColor:'#0060ac' }}
                                    onFocus={e => { e.target.style.background='white'; e.target.style.borderColor='#0060ac'; e.target.style.boxShadow='0 0 0 3px rgba(0,96,172,0.12)' }}
                                    onBlur={e => { e.target.style.background='#f2f4f6'; e.target.style.borderColor='#e0e3e5'; e.target.style.boxShadow='none' }}
                                />
                                <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', display:'flex', gap:4 }}>
                                    {[0,1,2,3,4,5].map(i => (
                                        <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:code[i]?'#0060ac':'#e0e3e5', transition:'background 0.15s' }}/>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:10 }}>
                                <MSIcon name="schedule" size={13} color="#43474f"/>
                                <span style={{ fontSize:10, fontWeight:700, color:'#43474f', textTransform:'uppercase', letterSpacing:'0.1em' }}>Refreshes every 30 seconds</span>
                            </div>
                        </div>

                        <button
                            onClick={handleVerify} disabled={loading || code.length !== 6}
                            style={{ width:'100%', padding:'13px', background:code.length===6?'#001736':'#e0e3e5', color:code.length===6?'white':'#747780', border:'none', borderRadius:8, fontWeight:700, fontSize:15, cursor:loading||code.length!==6?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s', marginBottom:16 }}
                            onMouseEnter={e => code.length===6 && !loading && (e.currentTarget.style.background='#002b5b')}
                            onMouseLeave={e => (e.currentTarget.style.background=code.length===6?'#001736':'#e0e3e5')}
                        >
                            {loading ? <><Spinner/> Verifying…</> : <><MSIcon name="lock_open" size={16} color={code.length===6?'white':'#747780'}/> Verify &amp; Enter Dashboard</>}
                        </button>

                        <div style={{ paddingTop:16, borderTop:'1px solid #f2f4f6', display:'flex', flexDirection:'column', gap:10 }}>
                            <button
                                onClick={() => navigate('/officer/login')}
                                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#43474f', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'6px', borderRadius:8, transition:'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.color='#001736')}
                                onMouseLeave={e => (e.currentTarget.style.color='#43474f')}
                            >
                                <MSIcon name="arrow_back" size={14} color="currentColor"/> Back to Login
                            </button>
                            <button
                                onClick={handleResetTOTP} disabled={resetting}
                                style={{ background:'none', border:'none', cursor:resetting?'not-allowed':'pointer', fontSize:12, fontWeight:600, color:'#747780', textDecoration:'underline', padding:'4px', transition:'color 0.2s', opacity:resetting?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                                onMouseEnter={e => !resetting && (e.currentTarget.style.color='#ba1a1a')}
                                onMouseLeave={e => (e.currentTarget.style.color='#747780')}
                            >
                                {resetting ? <><Spinner/> Resetting…</> : 'Lost access to authenticator? Re-setup 2FA'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right info panel */}
                <div style={{ width:'100%', maxWidth:380, background:'linear-gradient(135deg,#001736 0%,#002b5b 60%,#0060ac 100%)', borderRadius:14, minHeight:520, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(0,96,172,0.3)', filter:'blur(60px)', top:-40, right:-40 }}/>
                    <div style={{ position:'absolute', width:150, height:150, borderRadius:'50%', background:'rgba(0,96,172,0.15)', filter:'blur(40px)', bottom:40, left:-30 }}/>
                    <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%', padding:'28px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:32, height:32, background:'rgba(255,255,255,0.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                                    <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                    <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                                    <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                                </svg>
                            </div>
                            <span style={{ fontWeight:700, fontSize:14, color:'white' }}>Secure Officer Access</span>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'24px 0', textAlign:'center' }}>
                            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                                <MSIcon name="security" size={40} color="rgba(255,255,255,0.8)" fill={1}/>
                            </div>
                            <h2 style={{ fontWeight:900, fontSize:24, color:'white', marginBottom:10, letterSpacing:'-0.5px' }}>Protected Access</h2>
                            <p style={{ fontSize:14, color:'rgba(255,255,255,0.6)', lineHeight:1.7, maxWidth:280 }}>
                                Your officer account is secured with two-factor authentication. Enter your authenticator code to proceed.
                            </p>
                        </div>
                        <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'18px 20px' }}>
                            <p style={{ fontWeight:700, fontSize:13, color:'white', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                                <MSIcon name="shield" size={15} color="#68abff" fill={1}/> Why 2FA for Officers?
                            </p>
                            {['Access to all applicant financial data','Ability to approve or reject loans','View sensitive credit score reports','Real-time Plaid bank transaction data'].map(reason => (
                                <div key={reason} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                                    <div style={{ width:18, height:18, background:'rgba(104,171,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        <MSIcon name="check" size={11} color="#68abff"/>
                                    </div>
                                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', margin:0 }}>{reason}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:16 }}>
                            {[{ icon:'verified_user', label:'SSL Secured' }, { icon:'account_balance', label:'Member FDIC' }].map(b => (
                                <div key={b.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                                    <MSIcon name={b.icon} size={13} color="rgba(255,255,255,0.35)" fill={1}/>
                                    <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer style={{ textAlign:'center', padding:'16px' }}>
                <p style={{ fontSize:11, color:'#c4c6d0' }}>© 2026 Nexus Financial Technologies. Officer Portal</p>
            </footer>
        </div>
    )
}

function Spinner() {
    return (
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ animation:'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
        </svg>
    )
}