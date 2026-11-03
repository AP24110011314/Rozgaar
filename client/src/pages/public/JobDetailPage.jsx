import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  Globe,
  Share2,
  Bookmark,
  BookmarkCheck,
  Flag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  GlassBadge,
  GlassModal,
} from '../../components/glass/index.js';

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportText, setReportText] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['jobDetail', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data.data;
    },
  });

  // Fetch applicant profile to check saved status
  const { data: profile } = useQuery({
    queryKey: ['applicantProfile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data;
    },
    enabled: isAuthenticated && user?.role === 'applicant',
  });

  const savedJobIds = (profile?.savedJobs || []).map((j) =>
    j._id ? j._id.toString() : j.toString()
  );
  const isSaved = savedJobIds.includes(id);

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.delete(`/jobs/${id}/save`);
      } else {
        await api.post(`/jobs/${id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  // Report job mutation
  const reportMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/jobs/${id}/report`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportText('');
      }, 2500);
    },
    onError: (err) => {
      setReportError(err.response?.data?.error?.message || 'Failed to submit report');
    },
  });

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    reportMutation.mutate({
      reason: reportReason,
      text: reportText.trim(),
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title || 'Job Listing on Rozgaar',
          text: `Check out this opening for ${job?.title} at ${job?.company?.name || 'Local Employer'}`,
          url: window.location.href,
        });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Job listing link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-sm font-semibold text-text">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-error mx-auto" />
        <h2 className="text-xl font-bold text-text">Job Posting Not Found</h2>
        <p className="text-sm text-text-muted">
          This listing may have been closed, deleted, or removed by administrators.
        </p>
        <Link to="/jobs" className="glass-btn-primary text-xs px-5 py-2.5 inline-block">
          Return to Job Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left pb-32 sm:pb-8">
      {/* Back Link & Header Band */}
      <div className="bg-sand border-b-2 border-brand p-4 rounded-md flex items-center justify-between">
        <Link
          to="/jobs"
          className="inline-flex items-center text-xs font-bold text-brand-dark hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Search Results
        </Link>
        <span className="text-xs text-text-muted hidden sm:inline">Job ID: {job._id?.slice(-8)}</span>
      </div>

      {/* Main Job Header Card */}
      <div className="bg-surface border border-border rounded-md p-5 sm:p-8 space-y-6 shadow-flat">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-divider">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge variant="indigo" className="capitalize">
                {job.employmentType}
              </GlassBadge>
              {job.remote && (
                <GlassBadge variant="saffron">Remote Position</GlassBadge>
              )}
              <GlassBadge
                variant={job.status === 'open' ? 'success' : 'neutral'}
                className="capitalize"
              >
                {job.status}
              </GlassBadge>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold text-text tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-text font-medium">
              <span className="flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-brand shrink-0" />
                {job.company?.name || 'Local Employer'}
              </span>

              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-brand shrink-0" />
                {job.location?.city ? `${job.location.city}, ${job.location.state}` : 'Local'}
              </span>

              {job.salary?.min && (
                <span className="flex items-center text-text font-bold">
                  <IndianRupee className="w-4 h-4 mr-0.5 shrink-0" />
                  {job.salary.min.toLocaleString('en-IN')}
                  {job.salary.max ? ` - ₹${job.salary.max.toLocaleString('en-IN')}` : '+'} /{job.salary.period}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Action buttons (Bookmark & Apply) */}
          <div className="hidden sm:flex items-center space-x-3 shrink-0">
            {isAuthenticated && user?.role === 'applicant' && (
              <button
                type="button"
                onClick={() => toggleBookmarkMutation.mutate()}
                className={`p-2.5 rounded-md border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  isSaved
                    ? 'border-brand-dark bg-sand text-brand-dark font-bold'
                    : 'border-border bg-surface text-text-muted hover:text-text hover:bg-sand/30'
                }`}
                title={isSaved ? 'Remove Bookmark' : 'Bookmark Job'}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5 text-brand-dark" /> : <Bookmark className="w-5 h-5" />}
              </button>
            )}

            {job.status === 'open' ? (
              isAuthenticated ? (
                user?.role === 'applicant' ? (
                  <Link
                    to={`/jobs/${id}/apply`}
                    className="glass-btn-primary px-6 py-2.5 text-sm"
                  >
                    Apply Now
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-sm bg-sand/40 border border-border text-text text-xs font-semibold">
                    Employer Account
                  </span>
                )
              ) : (
                <Link
                  to="/login"
                  state={{ from: `/jobs/${id}` }}
                  className="glass-btn-primary px-6 py-2.5 text-sm"
                >
                  Log in to Apply
                </Link>
              )
            ) : (
              <span className="px-4 py-2 rounded-sm bg-disabled-bg border border-border text-text-muted text-xs font-semibold">
                Applications Closed
              </span>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">
            Job Description & Responsibilities
          </h2>
          <div className="text-sm text-text leading-relaxed whitespace-pre-line bg-sand/10 p-4 rounded-md border border-divider">
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Candidate Requirements
            </h2>
            <ul className="space-y-2 text-sm text-text list-disc list-inside">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="leading-relaxed">
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills Chips */}
        {job.skills?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Target Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-sm text-xs font-bold bg-mint text-text border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom utility links: Share and Report */}
        <div className="pt-4 border-t border-divider flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center text-text-muted hover:text-text hover:underline min-h-[44px] cursor-pointer"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share listing
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center text-text-muted hover:text-error hover:underline transition-colors min-h-[44px] cursor-pointer"
          >
            <Flag className="w-4 h-4 mr-1.5" />
            Report this job
          </button>
        </div>
      </div>

      {/* Company Profile Card (stacks cleanly below description) */}
      {job.company && (
        <div className="bg-surface border border-border rounded-md p-5 sm:p-8 space-y-4 shadow-flat">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-sm bg-sand text-text flex items-center justify-center font-bold border border-border shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">{job.company.name}</h2>
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-dark hover:underline flex items-center mt-0.5"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  {job.company.website}
                </a>
              )}
            </div>
          </div>
          {job.company.description && (
            <p className="text-xs text-text-muted leading-relaxed">
              {job.company.description}
            </p>
          )}
        </div>
      )}

      {/* Mobile Sticky Apply Bar (Pinned above BottomBar) */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 p-3 bg-surface border-t-2 border-brand z-30 flex items-center justify-between shadow-2xl">
        <div className="truncate pr-3">
          <p className="text-xs font-bold text-text truncate">{job.title}</p>
          {job.salary?.min && (
            <p className="text-[11px] text-brand-dark font-bold">
              ₹{job.salary.min.toLocaleString('en-IN')}/{job.salary.period}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center space-x-2">
          {isAuthenticated && user?.role === 'applicant' && (
            <button
              type="button"
              onClick={() => toggleBookmarkMutation.mutate()}
              className="p-2 rounded-sm border border-border text-text min-h-[44px] min-w-[44px] flex items-center justify-center bg-sand/30"
              aria-label={isSaved ? 'Remove bookmark' : 'Bookmark job'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 text-brand-dark" /> : <Bookmark className="w-5 h-5" />}
            </button>
          )}

          {job.status === 'open' ? (
            isAuthenticated ? (
              user?.role === 'applicant' ? (
                <Link
                  to={`/jobs/${id}/apply`}
                  className="glass-btn-primary px-5 py-2 text-xs min-h-[44px]"
                >
                  Apply Now
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-sm bg-sand text-text text-xs font-bold">
                  Employer
                </span>
              )
            ) : (
              <Link
                to="/login"
                state={{ from: `/jobs/${id}` }}
                className="glass-btn-primary px-5 py-2 text-xs min-h-[44px]"
              >
                Log in to Apply
              </Link>
            )
          ) : (
            <span className="px-3 py-1.5 rounded-sm bg-disabled-bg text-text-muted text-xs font-bold">
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <GlassModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Job Listing"
      >
        {reportSuccess ? (
          <div className="p-4 rounded-sm bg-mint border border-border text-text flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-brand-dark shrink-0" />
            <span>Thank you. Your report has been submitted to moderators.</span>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            {reportError && (
              <div className="p-3 rounded-sm bg-error-bg border border-error text-xs text-error">
                {reportError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Reason for report
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="glass-input w-full cursor-pointer"
              >
                <option value="spam">Spam or Advertisements</option>
                <option value="misleading">Misleading Job Information or Salary</option>
                <option value="harassment">Offensive or Inappropriate Content</option>
                <option value="fraud">Fraudulent or Suspicious Activity</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Additional Details
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Provide additional context to help our moderation team review this listing..."
                className="glass-input w-full"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="glass-btn-secondary text-xs px-4 py-2 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reportMutation.isPending}
                className="glass-btn-danger text-xs px-4 py-2 min-h-[44px]"
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </GlassModal>
    </div>
  );
}

export default JobDetailPage;
