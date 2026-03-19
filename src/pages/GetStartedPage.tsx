// import { useNavigate } from 'react-router-dom'
//
// export default function GetStartedPage() {
//     const navigate = useNavigate()
//
//     return (
//         <div className="page-wrapper flex items-center justify-center p-8">
//             <div className="w-full max-w-4xl">
//
//                 {/* Brand */}
//                 <div className="flex items-center justify-center gap-4 mb-14">
//                     <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
//                         <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
//                             <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
//                             <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                             <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
//                             <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
//                         </svg>
//                     </div>
//                     <span className="font-display font-bold text-purple-900 text-3xl tracking-tight">Nexus</span>
//                 </div>
//
//                 {/* Heading */}
//                 <div className="text-center mb-14">
//                     <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-4">
//                         Who are you?
//                     </h1>
//                     <p className="text-gray-400 text-xl">
//                         Choose your role to get started with the right experience
//                     </p>
//                 </div>
//
//                 {/* Role cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//
//                     {/* Applicant card */}
//                     <button onClick={() => navigate('/signup')}
//                             className="group bg-white rounded-3xl p-12 border-2 border-purple-100 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300 text-left">
//                         <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
//                             👤
//                         </div>
//                         <h2 className="font-display font-bold text-4xl text-gray-900 mb-3">Applicant</h2>
//                         <p className="text-gray-400 text-lg leading-relaxed mb-8">
//                             Apply for personal, home, education or business loans.
//                             Our AI engine gives everyone a fair credit score — even without a credit history.
//                         </p>
//                         <div className="space-y-3 mb-10">
//                             {[
//                                 'Connect your bank securely via Plaid',
//                                 'Get an AI-powered credit score instantly',
//                                 'Apply for loans in minutes',
//                                 'Track real-time application status',
//                             ].map(f => (
//                                 <div key={f} className="flex items-center gap-3">
//                                     <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
//                                         <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                                             <path d="M2 6l3 3 5-5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//                                         </svg>
//                                     </div>
//                                     <span className="text-gray-600 text-base">{f}</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <div className="flex items-center justify-between">
//                             <div className="flex gap-3">
//                                 <span className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
//                                     🌟 Cold Start Supported
//                                 </span>
//                             </div>
//                             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
//                                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//                                     <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
//                                 </svg>
//                             </div>
//                         </div>
//                     </button>
//
//                     {/* Officer card */}
//                     <button onClick={() => navigate('/officer/login')}
//                             className="group bg-white rounded-3xl p-12 border-2 border-purple-100 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300 text-left">
//                         <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
//                             🏦
//                         </div>
//                         <h2 className="font-display font-bold text-4xl text-gray-900 mb-3">Loan Officer</h2>
//                         <p className="text-gray-400 text-lg leading-relaxed mb-8">
//                             Review and manage loan applications with full AI credit reports,
//                             bank transaction analysis and real-time decision tools.
//                         </p>
//                         <div className="space-y-3 mb-10">
//                             {[
//                                 'View all applications in real-time',
//                                 'Access full AI credit score breakdowns',
//                                 'Analyze Plaid bank transactions',
//                                 'Approve or reject with instant notifications',
//                             ].map(f => (
//                                 <div key={f} className="flex items-center gap-3">
//                                     <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
//                                         <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//                                             <path d="M2 6l3 3 5-5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//                                         </svg>
//                                     </div>
//                                     <span className="text-gray-600 text-base">{f}</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <div className="flex items-center justify-between">
//                             <span className="text-sm bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
//                                 🔐 Secured Access
//                             </span>
//                             <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white group-hover:bg-purple-700 transition-colors">
//                                 <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//                                     <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
//                                 </svg>
//                             </div>
//                         </div>
//                     </button>
//                 </div>
//
//                 {/* Already have account */}
//                 <div className="text-center mt-10">
//                     <p className="text-gray-400 text-base">
//                         Already have an account?{' '}
//                         <button onClick={() => navigate('/login')}
//                                 className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
//                             Sign in as Applicant
//                         </button>
//                         {' '}or{' '}
//                         <button onClick={() => navigate('/officer/login')}
//                                 className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
//                             Sign in as Officer
//                         </button>
//                     </p>
//                 </div>
//             </div>
//         </div>
//     )
// }

import { useNavigate } from 'react-router-dom'

export default function GetStartedPage() {
    const navigate = useNavigate()

    return (
        <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Public Sans, Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
                <div style={{ width: 36, height: 36, background: '#001736', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                        <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                        <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
                        <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white"/>
                    </svg>
                </div>
                <span style={{ fontWeight: 900, fontSize: 22, color: '#001736', letterSpacing: '-0.5px' }}>Nexus</span>
            </div>

            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <h1 style={{ fontWeight: 900, fontSize: 'clamp(36px, 5vw, 56px)', color: '#001736', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.1 }}>
                    Who are you?
                </h1>
                <p style={{ fontSize: 17, color: '#43474f', maxWidth: 400, margin: '0 auto' }}>
                    Choose your role to get started with the right experience.
                </p>
            </div>

            {/* Role cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%', maxWidth: 860 }}>

                {/* Applicant */}
                <button
                    onClick={() => navigate('/signup')}
                    style={{ background: 'white', border: '1.5px solid #e0e3e5', borderRadius: 16, padding: '40px 36px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 0 }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#0060ac'
                        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,96,172,0.12)'
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e3e5'
                        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                    }}>

                    {/* Icon */}
                    <div style={{ width: 56, height: 56, background: '#eef4ff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24 }}>
                        👤
                    </div>

                    {/* Title */}
                    <h2 style={{ fontWeight: 900, fontSize: 26, color: '#001736', letterSpacing: '-0.5px', marginBottom: 10 }}>Applicant</h2>

                    {/* Description */}
                    <p style={{ fontSize: 14, color: '#43474f', lineHeight: 1.65, marginBottom: 28 }}>
                        Apply for personal, home, education or business loans. Our AI engine gives everyone a fair credit score — even without a credit history.
                    </p>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                        {[
                            'Connect your bank securely via Plaid',
                            'Get an AI-powered credit score instantly',
                            'Apply for loans in minutes',
                            'Track real-time application status',
                        ].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="#0060ac" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <span style={{ fontSize: 13, color: '#43474f' }}>{f}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, background: '#eef4ff', color: '#0060ac', padding: '6px 14px', borderRadius: 100 }}>
                            🌟 Cold Start Supported
                        </span>
                        <div style={{ width: 40, height: 40, background: '#001736', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </button>

                {/* Officer */}
                <button
                    onClick={() => navigate('/officer/login')}
                    style={{ background: '#001736', border: '1.5px solid #001736', borderRadius: 16, padding: '40px 36px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,23,54,0.3)'
                        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                    }}>

                    {/* Background orb */}
                    <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,96,172,0.25)', filter: 'blur(60px)', top: -40, right: -40, pointerEvents: 'none' }}/>

                    {/* Icon */}
                    <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24, position: 'relative', zIndex: 1 }}>
                        🏦
                    </div>

                    {/* Title */}
                    <h2 style={{ fontWeight: 900, fontSize: 26, color: 'white', letterSpacing: '-0.5px', marginBottom: 10, position: 'relative', zIndex: 1 }}>Loan Officer</h2>

                    {/* Description */}
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 28, position: 'relative', zIndex: 1 }}>
                        Review and manage loan applications with full AI credit reports, bank transaction analysis and real-time decision tools.
                    </p>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, position: 'relative', zIndex: 1 }}>
                        {[
                            'View all applications in real-time',
                            'Access full AI credit score breakdowns',
                            'Analyze Plaid bank transactions',
                            'Approve or reject with instant notifications',
                        ].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="#68abff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: 100 }}>
                            🔐 Secured Access
                        </span>
                        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </button>
            </div>

            {/* Already have account */}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
                <p style={{ fontSize: 14, color: '#43474f' }}>
                    Already have an account?{' '}
                    <button onClick={() => navigate('/login')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#0060ac', textDecoration: 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#001736')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#0060ac')}>
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    )
}