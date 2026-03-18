import { useAuth } from '@/context/AuthContext'
import OfficerDashboard from './officer/OfficerDashboard'
import ApplicantDashboard from './applicant/ApplicantDashboard'

export default function DashboardPage() {
    const { user } = useAuth()
    const role = user?.user_metadata?.role

    if (role === 'officer') return <OfficerDashboard />
    if (role === 'applicant') return <ApplicantDashboard />

    return (
        <div className="page-wrapper flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
                {/* Big purple logo */}
                <div className="w-24 h-24 bg-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-200">
                    <svg width="44" height="44" viewBox="0 0 20 20" fill="none">
                        <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
                        <rect x="11" y="2" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                        <rect x="2" y="11" width="7" height="7" rx="2" fill="white" opacity="0.5" />
                        <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
                    </svg>
                </div>

                {/* Brand name */}
                <p className="font-display font-bold text-5xl text-purple-900 tracking-tight">Nexus</p>

                {/* Spinner */}
                <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />

                {/* Text */}
                <div className="text-center">
                    <p className="text-3xl text-purple-700 font-bold mb-2">Loading your dashboard…</p>
                    <p className="text-lg text-purple-400">Please wait a moment</p>
                </div>
            </div>
        </div>
    )
}