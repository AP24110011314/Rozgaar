import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      if (from !== '/') {
        navigate(from, { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/recruiter/jobs', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/me/applications', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 bg-page">
      <GlassCard className="max-w-md w-full space-y-6 sm:space-y-8 p-4 sm:p-8 md:p-10 bg-surface border-2 border-border rounded-lg shadow-flat">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-brand-dark flex items-center justify-center text-white border border-brand shadow-flat">
            <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-text">
            Welcome back to Rozgaar
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-medium text-text-muted">
            Sign in to access your jobs, applications, and pipelines
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-md bg-error-bg border-2 border-error flex items-start space-x-3 text-error text-xs sm:text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-error" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-text">
              Email address
            </label>
            <div className="mt-1.5">
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-base text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                  errors.email ? 'border-error bg-error-bg' : 'border-border'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error font-bold">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-text">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm font-bold text-brand-dark hover:underline min-h-[44px] flex items-center"
              >
                Forgot password?
              </Link>
            </div>
            <div className="mt-1">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-base text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                  errors.password ? 'border-error bg-error-bg' : 'border-border'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-error font-bold">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </>
              )}
            </GlassButton>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-divider">
          <p className="text-xs sm:text-sm font-medium text-text">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-dark hover:underline min-h-[44px] inline-flex items-center">
              Create an account
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default LoginPage;
