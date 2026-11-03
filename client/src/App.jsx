import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { Navbar } from './components/ui/Navbar.jsx';
import { BottomBar } from './components/layout/BottomBar.jsx';
import { ProtectedRoute } from './components/ui/ProtectedRoute.jsx';

// Pages
import HomePage from './pages/public/HomePage.jsx';
import JobsListPage from './pages/public/JobsListPage.jsx';
import JobDetailPage from './pages/public/JobDetailPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';

// Applicant Pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard.jsx';
import ApplicationDetailPage from './pages/applicant/ApplicationDetailPage.jsx';
import ApplyPage from './pages/applicant/ApplyPage.jsx';
import ProfilePage from './pages/applicant/ProfilePage.jsx';
import SavedJobsPage from './pages/applicant/SavedJobsPage.jsx';

// Recruiter Pages
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage.jsx';
import JobFormPage from './pages/recruiter/JobFormPage.jsx';
import CompanyProfilePage from './pages/recruiter/CompanyProfilePage.jsx';
import RecruiterKanbanPage from './pages/recruiter/RecruiterKanbanPage.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-dvh flex flex-col bg-page text-text font-sans antialiased text-base pb-20 sm:pb-0">
            {/* Accessible Skip Link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-dark focus:text-white focus:outline-none focus:outline-3 focus:outline-focus rounded-sm font-bold shadow-flat"
            >
              Skip to main content
            </a>

            <Navbar />

            <main id="main-content" className="flex-1 flex flex-col">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/jobs" element={<JobsListPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/jobs/:id/apply" element={<ApplyPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Applicant Protected Routes */}
                <Route
                  path="/me/*"
                  element={
                    <ProtectedRoute roles={['applicant', 'admin']}>
                      <Routes>
                        <Route path="applications" element={<ApplicantDashboard />} />
                        <Route path="applications/:id" element={<ApplicationDetailPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="saved" element={<SavedJobsPage />} />
                        <Route path="*" element={<Navigate to="/me/applications" replace />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />

                {/* Recruiter Protected Routes */}
                <Route
                  path="/recruiter/*"
                  element={
                    <ProtectedRoute roles={['recruiter', 'admin']}>
                      <Routes>
                        <Route path="jobs" element={<RecruiterJobsPage />} />
                        <Route path="jobs/new" element={<JobFormPage />} />
                        <Route path="jobs/:id/edit" element={<JobFormPage />} />
                        <Route path="jobs/:id/board" element={<RecruiterKanbanPage />} />
                        <Route path="company" element={<CompanyProfilePage />} />
                        <Route path="*" element={<Navigate to="/recruiter/jobs" replace />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Routes>
                        <Route path="" element={<AdminDashboard />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                      </Routes>
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Official Government Portal Style Footer */}
            <footer className="bg-sand border-t-4 border-brand py-6 text-text">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-text gap-4 text-center sm:text-left">
                <p className="font-medium">
                  © 2026 Rozgaar (रोज़गार) • National Hyperlocal ATS Portal for SMBs.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 font-semibold text-text-muted">
                  <span>Official Portal</span>
                  <span>•</span>
                  <span>Accessibility First</span>
                  <span>•</span>
                  <span>GDPR & Privacy Compliant</span>
                </div>
              </div>
            </footer>

            {/* Mobile Fixed Bottom App Bar */}
            <BottomBar />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
