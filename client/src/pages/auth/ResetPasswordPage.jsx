import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await resetPassword({
        token: values.token,
        password: values.password,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Invalid or expired reset token');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 bg-page">
      <GlassCard className="max-w-md w-full space-y-6 p-4 sm:p-8 md:p-10 bg-surface border-2 border-border rounded-lg shadow-flat">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-brand-dark text-white flex items-center justify-center border border-brand shadow-flat">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-text">
            Reset Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-medium text-text-muted">
            Enter your new secure password below
          </p>
        </div>

        {isSuccess ? (
          <div className="p-4 rounded-md bg-mint border-2 border-mint-text text-mint-text space-y-3 font-medium">
            <div className="flex items-center space-x-2 text-sm sm:text-base font-bold">
              <CheckCircle2 className="w-5 h-5 text-mint-text shrink-0" aria-hidden="true" />
              <span>Password Reset Successful!</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-mint-text font-medium">
              Your password has been updated. Redirecting you to sign in...
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-xs sm:text-sm font-bold text-brand-dark hover:underline min-h-[44px]"
              >
                Sign in now <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-error-bg border-2 border-error flex items-start space-x-3 text-error text-xs sm:text-sm font-bold"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-error" aria-hidden="true" />
                <span>{serverError}</span>
              </div>
            )}

            {!tokenFromUrl && (
              <div>
                <label htmlFor="token" className="block text-xs sm:text-sm font-bold text-text">
                  Reset Token
                </label>
                <div className="mt-1">
                  <input
                    id="token"
                    type="text"
                    aria-invalid={!!errors.token}
                    {...register('token')}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-base text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                      errors.token ? 'border-error bg-error-bg' : 'border-border'
                    }`}
                    placeholder="Paste the reset token from your email"
                  />
                  {errors.token && (
                    <p className="mt-1 text-xs text-error font-bold">{errors.token.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-text">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-base text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                    errors.password ? 'border-error bg-error-bg' : 'border-border'
                  }`}
                  placeholder="Min 8 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-error font-bold">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-bold text-text">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-base text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                    errors.confirmPassword ? 'border-error bg-error-bg' : 'border-border'
                  }`}
                  placeholder="Repeat new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-error font-bold">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" aria-hidden="true" />
                  Updating password...
                </>
              ) : (
                'Set New Password'
              )}
            </GlassButton>
          </form>
        )}
      </GlassCard>
    </div>
  );
}

export default ResetPasswordPage;
