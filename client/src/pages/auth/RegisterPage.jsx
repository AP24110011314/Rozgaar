import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, UserCheck, Building2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

const registerSchema = z
  .object({
    role: z.enum(['applicant', 'recruiter']),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    companyName: z.string().trim().optional(),
    privacyConsent: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the privacy policy to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'recruiter') {
        return !!data.companyName && data.companyName.trim().length >= 2;
      }
      return true;
    },
    {
      message: 'Company name is required for recruiter accounts',
      path: ['companyName'],
    }
  );

export function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [selectedRole, setSelectedRole] = useState('applicant');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'applicant',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      privacyConsent: false,
    },
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const payload = {
        role: values.role,
        name: values.name,
        email: values.email,
        password: values.password,
        privacyConsent: values.privacyConsent,
        ...(values.role === 'recruiter' && values.companyName ? { companyName: values.companyName } : {}),
      };

      const user = await registerAuth(payload);
      if (user.role === 'recruiter') {
        navigate('/recruiter/jobs', { replace: true });
      } else {
        navigate('/me/applications', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please check your details.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-page">
      <GlassCard className="max-w-lg w-full space-y-8 p-8 sm:p-10 bg-surface border-2 border-border rounded-lg shadow-flat">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-md bg-brand-dark flex items-center justify-center text-white border border-brand shadow-flat">
            <Briefcase className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
            Create your Rozgaar Account
          </h1>
          <p className="mt-2 text-sm font-medium text-text-muted">
            Join the community-first hiring network for local businesses and candidates
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-sand border-2 border-border rounded-md">
          <button
            type="button"
            onClick={() => handleRoleChange('applicant')}
            className={`flex items-center justify-center min-h-[44px] py-2 px-3 rounded-sm text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
              selectedRole === 'applicant'
                ? 'bg-brand-dark text-white shadow-flat'
                : 'text-text hover:underline'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2" aria-hidden="true" />
            Job Seeker (प्रार्थी)
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('recruiter')}
            className={`flex items-center justify-center min-h-[44px] py-2 px-3 rounded-sm text-sm font-bold transition-all cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
              selectedRole === 'recruiter'
                ? 'bg-brand-dark text-white shadow-flat'
                : 'text-text hover:underline'
            }`}
          >
            <Building2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Employer (नियोक्ता)
          </button>
        </div>

        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-md bg-error-bg border-2 border-error flex items-start space-x-3 text-error text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-error" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <input type="hidden" {...register('role')} />

          <div>
            <label htmlFor="name" className="block text-sm font-bold text-text">
              Full Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                  errors.name ? 'border-error bg-error-bg' : 'border-border'
                }`}
                placeholder="e.g. Priya Sharma"
              />
              {errors.name && <p className="mt-1 text-xs text-error font-bold">{errors.name.message}</p>}
            </div>
          </div>

          {selectedRole === 'recruiter' && (
            <div>
              <label htmlFor="companyName" className="block text-sm font-bold text-text">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  type="text"
                  autoComplete="organization"
                  aria-invalid={!!errors.companyName}
                  {...register('companyName')}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                    errors.companyName ? 'border-error bg-error-bg' : 'border-border'
                  }`}
                  placeholder="e.g. Sunrise Diagnostics"
                />
                {errors.companyName && (
                  <p className="mt-1 text-xs text-error font-bold">{errors.companyName.message}</p>
                )}
              </div>
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
                placeholder="priya@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-error font-bold">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-text">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
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
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-text">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-md border-2 text-text placeholder-text-muted bg-surface focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus ${
                    errors.confirmPassword ? 'border-error bg-error-bg' : 'border-border'
                  }`}
                  placeholder="Repeat password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-error font-bold">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="p-3.5 rounded-md bg-sand border-2 border-border mt-2">
            <div className="flex items-start">
              <input
                id="privacyConsent"
                type="checkbox"
                aria-invalid={!!errors.privacyConsent}
                {...register('privacyConsent')}
                className="h-5 w-5 mt-0.5 accent-brand-dark rounded cursor-pointer"
              />
              <label htmlFor="privacyConsent" className="ml-2.5 block text-xs font-bold text-text leading-relaxed cursor-pointer">
                I agree to Rozgaar's privacy terms. I understand Rozgaar never requests or stores sensitive demographic fields (age, photo, gender, or marital status) and protects applicant privacy by design.
              </label>
            </div>
            {errors.privacyConsent && (
              <p className="mt-1.5 text-xs text-error font-bold pl-7.5">{errors.privacyConsent.message}</p>
            )}
          </div>

          <div className="pt-2">
            <GlassButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                <>
                  Create {selectedRole === 'recruiter' ? 'Employer' : 'Candidate'} Account
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </>
              )}
            </GlassButton>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-divider">
          <p className="text-sm font-medium text-text">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-dark hover:underline min-h-[44px] inline-flex items-center">
              Log in to your account
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default RegisterPage;
