import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Building2, MapPin, IndianRupee, ArrowRight, Trash2, Loader2, Briefcase, Lock } from 'lucide-react';
import { api } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

export function SavedJobsPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedJobs = [], isLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved');
      return res.data.data;
    },
    enabled: !!isAuthenticated && user?.role === 'applicant',
  });

  const unsaveMutation = useMutation({
    mutationFn: async (jobId) => {
      const res = await api.delete(`/jobs/${jobId}/save`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
    },
  });

  // 1. Unauthenticated Guest State - Clear explanation with actions instead of abrupt redirect
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
        {/* Header */}
        <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text flex items-center">
              <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-brand" />
              Saved Jobs
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Jobs you bookmark for easy reference and quick application.
            </p>
          </div>
        </div>

        {/* Guest Informational Card */}
        <div className="bg-surface border border-border rounded-md p-8 sm:p-12 text-center space-y-4 shadow-flat max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-sm bg-sand text-brand-dark flex items-center justify-center mx-auto border border-border">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-text">Sign in to view your saved jobs</h2>
            <p className="text-sm text-text-muted">
              Bookmark verified jobs while browsing and access your saved positions anytime across all your devices.
            </p>
          </div>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" state={{ from: { pathname: '/saved' } }} className="w-full sm:w-auto">
              <GlassButton variant="primary" className="w-full justify-center">
                Sign in
              </GlassButton>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <GlassButton variant="secondary" className="w-full justify-center">
                Create an account
              </GlassButton>
            </Link>
          </div>
          <div className="pt-2">
            <Link to="/jobs" className="text-sm font-bold text-brand-dark hover:underline inline-flex items-center">
              Explore Verified Jobs <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Non-applicant State (e.g. Recruiter or Admin)
  if (user?.role === 'recruiter') {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
        <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md">
          <h1 className="text-xl sm:text-2xl font-bold text-text flex items-center">
            <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-brand" />
            Saved Jobs
          </h1>
        </div>
        <div className="bg-surface border border-border rounded-md p-8 sm:p-12 text-center space-y-4 shadow-flat max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-sm bg-sand text-brand-dark flex items-center justify-center mx-auto border border-border">
            <Briefcase className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text">Applicant Feature</h2>
          <p className="text-sm text-text-muted">
            Saving jobs is an applicant feature. As an employer, manage your postings and pipelines from your recruiter dashboard.
          </p>
          <div className="pt-2">
            <Link to="/recruiter/jobs">
              <GlassButton variant="primary">Go to Recruiter Dashboard</GlassButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4 bg-surface border border-border rounded-md max-w-7xl mx-auto my-8">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-sm font-medium text-text">Loading your saved jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
      {/* Header */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text flex items-center">
            <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-brand" />
            Saved Jobs
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Jobs you have bookmarked for easy reference and quick application.
          </p>
        </div>
        <GlassBadge variant="indigo" size="md" className="self-start sm:self-auto">
          {savedJobs.length} {savedJobs.length === 1 ? 'Job' : 'Jobs'} Saved
        </GlassBadge>
      </div>

      {/* Saved Jobs List */}
      {savedJobs.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-12 text-center space-y-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-text">No saved jobs yet</h2>
            <p className="text-sm text-text-muted mt-1">
              Explore local jobs and click the bookmark icon to save positions you want to apply for later.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/jobs">
              <GlassButton variant="primary">
                Explore Local Jobs <ArrowRight className="w-4 h-4 ml-1.5" />
              </GlassButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job) => (
            <div
              key={job._id}
              className="bg-surface border border-border rounded-md p-5 flex flex-col justify-between hover:border-brand-dark transition-all shadow-flat"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-text hover:text-brand-dark transition-colors">
                      <Link to={`/jobs/${job._id}`} className="underline">{job.title}</Link>
                    </h3>
                    <p className="text-xs font-medium text-text-muted flex items-center mt-1">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-brand" />
                      {job.company?.name || 'Local Employer'}
                    </p>
                  </div>
                  <button
                    onClick={() => unsaveMutation.mutate(job._id)}
                    disabled={unsaveMutation.isPending}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm text-text-muted hover:text-error hover:bg-error-bg transition-colors cursor-pointer"
                    title="Remove from saved jobs"
                    aria-label={`Remove ${job.title} from saved jobs`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-sand/30 border border-border text-text">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-brand" />
                    {job.location?.city ? `${job.location.city}, ${job.location.state}` : 'Local'}
                    {job.remote && ' (Remote)'}
                  </span>

                  {job.salary?.min && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-mint border border-border text-text font-bold">
                      <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                      {job.salary.min.toLocaleString()}
                      {job.salary.max ? ` - ${job.salary.max.toLocaleString()}` : '+'} /{job.salary.period}
                    </span>
                  )}

                  <GlassBadge variant="indigo" size="sm" className="capitalize">
                    {job.employmentType}
                  </GlassBadge>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-divider flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  Status: <strong className="capitalize text-text font-bold">{job.status}</strong>
                </span>
                <Link
                  to={`/jobs/${job._id}`}
                  className="inline-flex items-center text-xs font-bold text-brand-dark hover:underline min-h-[44px] px-2"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedJobsPage;
