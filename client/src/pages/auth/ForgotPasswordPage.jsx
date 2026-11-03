import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    setSuccessMessage('');
    try {
      const data = await forgotPassword(values.email);
      setSuccessMessage(data.message || 'If an account exists, a reset link has been dispatched.');
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Failed to request password reset');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-page">
      <GlassCard className="max-w-md w-full space-y-6 p-8 sm:p-10 bg-surface border-2 border-border rounded-lg shadow-flat">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-brand-dark text-white flex items-center justify-center border border-brand shadow-flat">
            <KeyRound className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm font-medium text-text-muted">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-md bg-mint border-2 border-mint-text text-mint-text space-y-3 font-medium">
            <div className="flex items-center space-x-2 text-base font-bold">
              <CheckCircle2 className="w-5 h-5 text-mint-text shrink-0" aria-hidden="true" />
              <span>Reset link dispatched</span>
            </div>
            <p className="text-sm leading-relaxed text-mint-text font-medium">
              {successMessage}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-bold text-brand-dark hover:underline min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-error-bg border-2 border-error flex items-start space-x-3 text-error text-sm font-bold"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-error" aria-hidden="true" />
                <span>{serverError}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-text">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                    errors.email ? 'border-error bg-error-bg' : 'border-border'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-error font-bold">{errors.email.message}</p>
                )}
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" aria-hidden="true" />
                  Sending email...
                </>
              ) : (
                'Send Reset Link'
              )}
            </GlassButton>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-bold text-brand-dark hover:underline min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}

export default ForgotPasswordPage;
