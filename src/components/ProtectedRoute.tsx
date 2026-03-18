
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen bg-purple-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                    <p className="text-sm text-purple-400 font-medium">Loading…</p>
                </div>
            </div>
        )
    }


    if (!session) return <Navigate to="/login" replace />

    // Logged in but onboarding not done — redirect to onboarding
    // Skip this check if already on onboarding page
    // Don't redirect officer pages
    const isOfficerPage = location.pathname.startsWith('/officer')
    if (!isOfficerPage) {
        const onboardingDone = user?.user_metadata?.full_name
        if (!onboardingDone && location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />
        }
    }
    return <>{children}</>
}