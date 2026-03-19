import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import OnboardingPage from '@/pages/OnboardingPage'
import ConnectBankPage from '@/pages/applicant/ConnectBankPage'
import CreditScorePage from '@/pages/applicant/CreditScorePage'
import LoanApplicationPage from '@/pages/applicant/LoanApplicationPage'
import LoanStatusPage from '@/pages/applicant/LoanStatusPage'
import DocumentUploadPage from '@/pages/applicant/DocumentUploadPage'
import RepaymentPage from '@/pages/applicant/RepaymentPage'
import AgreementPage from '@/pages/applicant/AgreementPage'
import GetStartedPage from '@/pages/GetStartedPage'
import OfficerLogin from '@/pages/officer/OfficerLogin'
import OfficerTOTPSetup from '@/pages/officer/OfficerTOTPSetup'
import OfficerTOTPVerify from '@/pages/officer/OfficerTOTPVerify'
import OfficerDashboard from '@/pages/officer/OfficerDashboard'
import ApplicationReview from '@/pages/officer/ApplicationReview'
import NexusChat from '@/components/NexusChat'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ── Landing ── */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/get-started" element={<GetStartedPage />} />

                    {/* ── Applicant Auth ── */}
                    {/* /signup redirects to /login — LoginPage handles both Sign In and Create Account tabs */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<Navigate to="/login" replace />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* ── Applicant Protected ── */}
                    <Route path="/onboarding" element={
                        <ProtectedRoute><OnboardingPage /></ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute><DashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/connect-bank" element={
                        <ProtectedRoute><ConnectBankPage /></ProtectedRoute>
                    } />
                    <Route path="/credit-score" element={
                        <ProtectedRoute><CreditScorePage /></ProtectedRoute>
                    } />
                    <Route path="/apply-loan" element={
                        <ProtectedRoute><LoanApplicationPage /></ProtectedRoute>
                    } />
                    <Route path="/upload-documents" element={
                        <ProtectedRoute><DocumentUploadPage /></ProtectedRoute>
                    } />
                    <Route path="/agreement" element={
                        <ProtectedRoute><AgreementPage /></ProtectedRoute>
                    } />
                    <Route path="/repayment" element={
                        <ProtectedRoute><RepaymentPage /></ProtectedRoute>
                    } />
                    <Route path="/loan-status" element={
                        <ProtectedRoute><LoanStatusPage /></ProtectedRoute>
                    } />

                    {/* ── Officer Auth ── */}
                    <Route path="/officer/login" element={<OfficerLogin />} />
                    <Route path="/officer/setup-2fa" element={<OfficerTOTPSetup />} />
                    <Route path="/officer/verify-2fa" element={<OfficerTOTPVerify />} />

                    {/* ── Officer Protected ── */}
                    <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                    <Route path="/officer/applications/:id" element={<ApplicationReview />} />

                    {/* ── Fallback ── */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <NexusChat />
            </BrowserRouter>
        </AuthProvider>
    )
}


