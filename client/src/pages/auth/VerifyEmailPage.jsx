import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();

  const [status, setStatus] = useState('pending'); // 'pending', 'verifying', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const executeVerification = async (verifyToken) => {
    setStatus('verifying');
    setErrorMessage('');
    try {
      await verifyEmail(verifyToken);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err.response?.data?.error?.message || 'Invalid or expired email verification link.'
      );
    }
  };

  useEffect(() => {
    if (token) {
      executeVerification(token);
    }
  }, [token]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-page">
      <GlassCard className="max-w-md w-full space-y-6 p-8 sm:p-10 bg-surface border-2 border-border rounded-lg shadow-flat text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-brand-dark animate-spin mx-auto" aria-hidden="true" />
            <h1 className="text-xl font-bold text-text">Verifying your email...</h1>
            <p className="text-sm font-medium text-text-muted">Please wait while we confirm your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-mint text-mint-text rounded-md flex items-center justify-center mx-auto border-2 border-mint-text shadow-flat">
              <CheckCircle2 className="w-8 h-8 text-mint-text" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-text">Email Verified!</h1>
            <p className="text-sm font-medium text-text leading-relaxed">
              Your email address has been successfully verified. You now have full access to apply for jobs and manage pipelines.
            </p>
            <div className="pt-4">
              <Link to="/me/applications">
                <GlassButton variant="primary">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </GlassButton>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-error-bg text-error rounded-md flex items-center justify-center mx-auto border-2 border-error shadow-flat">
              <AlertCircle className="w-8 h-8 text-error" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-text">Verification Failed</h1>
            <p className="text-sm font-bold text-error bg-error-bg p-3.5 rounded-md border-2 border-error">
              {errorMessage}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-bold text-brand-dark hover:underline min-h-[44px]"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {status === 'pending' && !token && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-sand text-text rounded-md flex items-center justify-center mx-auto border-2 border-border shadow-flat">
              <MailCheck className="w-8 h-8 text-text" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-text">Check Your Email</h1>
            <p className="text-sm font-medium text-text-muted leading-relaxed">
              We sent a verification link to your email address. Please open the link in your email to verify your account.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-bold text-brand-dark hover:underline min-h-[44px]"
              >
                Back to Sign in
              </Link>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default VerifyEmailPage;
