import { useNavigate } from 'react-router-dom'

export default function GetStartedPage() {
    const navigate = useNavigate()

    return (
        <div className="page-wrapper flex items-center justify-center p-8">
            <div className="w-full max-w-4xl">

                {/* Brand */}
                <div className="flex items-center justify-center gap-4 mb-14">
                    <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center">
                        <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                            <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                            <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                            <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                        </svg>
                    </div>
                    <span className="font-display font-bold text-purple-900 text-3xl tracking-tight">Nexus</span>
                </div>

                {/* Heading */}
                <div className="text-center mb-14">
                    <h1 className="font-display font-bold text-6xl text-gray-900 tracking-tight mb-4">
                        Who are you?
                    </h1>
                    <p className="text-gray-400 text-xl">
                        Choose your role to get started with the right experience
                    </p>
                </div>

                {/* Role cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Applicant card */}
                    <button onClick={() => navigate('/signup')}
                            className="group bg-white rounded-3xl p-12 border-2 border-purple-100 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300 text-left">
                        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                            👤
                        </div>
                        <h2 className="font-display font-bold text-4xl text-gray-900 mb-3">Applicant</h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            Apply for personal, home, education or business loans.
                            Our AI engine gives everyone a fair credit score — even without a credit history.
                        </p>
                        <div className="space-y-3 mb-10">
                            {[
                                'Connect your bank securely via Plaid',
                                'Get an AI-powered credit score instantly',
                                'Apply for loans in minutes',
                                'Track real-time application status',
                            ].map(f => (
                                <div key={f} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <span className="text-gray-600 text-base">{f}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-3">
                                <span className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
                                    🌟 Cold Start Supported
                                </span>
                            </div>
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </button>

                    {/* Officer card */}
                    <button onClick={() => navigate('/officer/login')}
                            className="group bg-white rounded-3xl p-12 border-2 border-purple-100 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300 text-left">
                        <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform duration-300">
                            🏦
                        </div>
                        <h2 className="font-display font-bold text-4xl text-gray-900 mb-3">Loan Officer</h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            Review and manage loan applications with full AI credit reports,
                            bank transaction analysis and real-time decision tools.
                        </p>
                        <div className="space-y-3 mb-10">
                            {[
                                'View all applications in real-time',
                                'Access full AI credit score breakdowns',
                                'Analyze Plaid bank transactions',
                                'Approve or reject with instant notifications',
                            ].map(f => (
                                <div key={f} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <span className="text-gray-600 text-base">{f}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
                                🔐 Secured Access
                            </span>
                            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white group-hover:bg-purple-700 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4 10h12M12 6l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Already have account */}
                <div className="text-center mt-10">
                    <p className="text-gray-400 text-base">
                        Already have an account?{' '}
                        <button onClick={() => navigate('/login')}
                                className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                            Sign in as Applicant
                        </button>
                        {' '}or{' '}
                        <button onClick={() => navigate('/officer/login')}
                                className="text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                            Sign in as Officer
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}