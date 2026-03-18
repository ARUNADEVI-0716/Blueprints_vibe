import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import OnboardingPage from '@/pages/OnboardingPage'
import ConnectBankPage from '@/pages/applicant/ConnectBankPage'
import CreditScorePage from '@/pages/applicant/CreditScorePage'
import LoanApplicationPage from '@/pages/applicant/LoanApplicationPage'
import LoanStatusPage from '@/pages/applicant/LoanStatusPage'
import OfficerLogin from '@/pages/officer/OfficerLogin'
import OfficerDashboard from '@/pages/officer/OfficerDashboard'
import ApplicationReview from '@/pages/officer/ApplicationReview'
import GetStartedPage from '@/pages/GetStartedPage'
import OfficerTOTPSetup from '@/pages/officer/OfficerTOTPSetup'
import OfficerTOTPVerify from '@/pages/officer/OfficerTOTPVerify'
import DocumentUploadPage from '@/pages/applicant/DocumentUploadPage'
import RepaymentPage from '@/pages/applicant/RepaymentPage'
import AgreementPage from '@/pages/applicant/AgreementPage'
import NexusChat from '@/components/NexusChat'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Landing */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Officer — separate auth */}
                    <Route path="/officer/login" element={<OfficerLogin />} />
                    <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                    <Route path="/officer/applications/:id" element={<ApplicationReview />} />

                    {/* Applicant — protected */}
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
                    <Route path="/get-started" element={<GetStartedPage />} />
                    <Route path="/officer/setup-2fa" element={<OfficerTOTPSetup />} />
                    <Route path="/officer/verify-2fa" element={<OfficerTOTPVerify />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <NexusChat />
            </BrowserRouter>
        </AuthProvider>
    )
}