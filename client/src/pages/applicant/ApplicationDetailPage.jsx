import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  ExternalLink,
  MessageSquareQuote,
} from 'lucide-react';
import api from '../../api/axios.js';
import {
  GlassBadge,
  GlassButton,
  GlassModal,
} from '../../components/glass/index.js';

export function ApplicationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [downloadingResume, setDownloadingResume] = useState(false);

  // Live polling every 30 seconds
  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const res = await api.get(`/applications/${id}`);
      return res.data?.data;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/applications/${id}/withdraw`);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['application', id], data);
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setWithdrawModalOpen(false);
    },
    onError: (err) => {
      setWithdrawError(
        err.response?.data?.error?.message || 'Failed to withdraw application.'
      );
    },
  });

  // Resume download handler
  const handleDownloadResume = async () => {
    try {
      setDownloadingResume(true);
      const res = await api.get(`/applications/${id}/resume-url`);
      const { downloadUrl } = res.data?.data || {};
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert(
        'Could not generate download URL: ' +
          (err.response?.data?.error?.message || err.message)
      );
    } finally {
      setDownloadingResume(false);
    }
  };

  const getStageDisplay = (stage) => {
    switch (stage) {
      case 'applied':
        return {
          title: 'Application Submitted',
          description: 'Your application has been received and added to the hiring manager queue.',
          badgeVariant: 'indigo',
        };
      case 'reviewing':
        return {
          title: 'Under Review',
          description: 'The recruiting team is actively reviewing your resume and credentials.',
          badgeVariant: 'warning',
        };
      case 'interviewing':
        return {
          title: 'Interview Stage',
          description: 'You have been selected for interviews or practical assessments.',
          badgeVariant: 'saffron',
        };
      case 'offered':
        return {
          title: 'Job Offer Extended',
          description: 'Congratulations! An offer has been extended by the employer.',
          badgeVariant: 'success',
        };
      case 'hired':
        return {
          title: 'Hired',
          description: 'You have successfully joined the team. Best of luck in your new role!',
          badgeVariant: 'success',
        };
      case 'rejected':
        return {
          title: 'Application Not Selected',
          description: 'The employer has decided to pursue other candidates for this opening.',
          badgeVariant: 'neutral',
        };
      case 'withdrawn':
        return {
          title: 'Application Withdrawn',
          description: 'You withdrew this application from consideration.',
          badgeVariant: 'neutral',
        };
      default:
        return {
          title: stage,
          description: '',
          badgeVariant: 'neutral',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3 bg-surface border border-border rounded-md max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-sm font-semibold text-text">Loading application timeline...</p>
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-surface border border-border rounded-md p-8 space-y-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-error-bg text-error flex items-center justify-center mx-auto border border-error">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text">Application Not Found</h2>
          <p className="text-sm text-text-muted">
            {error?.message || 'Could not retrieve this application record.'}
          </p>
          <Link to="/me/applications" className="glass-btn-secondary text-sm px-4 py-2">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentDisplay = getStageDisplay(application.stage);
  const stageHistory = application.stageHistory || [];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
      {/* Back Link & Title Band */}
      <div className="bg-sand border-b-2 border-brand p-3.5 sm:p-4 rounded-md flex items-center justify-between">
        <Link
          to="/me/applications"
          className="inline-flex items-center text-xs font-bold text-brand-dark hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Applications
        </Link>
        <span className="text-xs text-text-muted">Application Timeline</span>
      </div>

      {/* Header Card */}
      <div className="bg-surface border border-border rounded-md p-4 sm:p-6 md:p-8 space-y-6 shadow-flat">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-divider">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge variant={currentDisplay.badgeVariant}>
                {application.stage}
              </GlassBadge>
              {application.job?.employmentType && (
                <GlassBadge variant="neutral" className="capitalize">
                  {application.job.employmentType}
                </GlassBadge>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
              {application.job?.title || 'Position'}
            </h1>

            <p className="text-xs sm:text-sm font-medium text-text-muted flex items-center">
              <Building2 className="w-4 h-4 mr-1.5 text-brand shrink-0" />
              {application.company?.name || 'Local Company'} • Applied on{' '}
              {new Date(application.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            {application.stage !== 'withdrawn' && application.stage !== 'hired' && (
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                className="px-4 py-2 rounded-sm text-xs font-bold text-error bg-error-bg border border-error hover:bg-error hover:text-white min-h-[44px] transition-all cursor-pointer w-full sm:w-auto text-center"
              >
                Withdraw Application
              </button>
            )}
            <Link
              to={`/jobs/${application.job?._id || application.job}`}
              className="glass-btn-secondary text-xs px-4 py-2 min-h-[44px] flex items-center justify-center w-full sm:w-auto"
            >
              View Listing <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>

        {/* Live Timeline Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-brand-dark" /> Live Hiring Timeline
            </h2>
            <span className="text-[11px] text-text-muted font-mono">
              Anti-ghosting tracking active
            </span>
          </div>

          {/* Vertical Timeline */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {stageHistory.map((historyItem, idx) => {
              const isLast = idx === stageHistory.length - 1;
              const display = getStageDisplay(historyItem.stage);

              return (
                <div key={idx} className="relative">
                  {/* Circle Node */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isLast
                        ? 'bg-brand-dark ring-2 ring-brand'
                        : 'bg-brand'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Step Card Content */}
                  <div className="bg-sand/20 border border-border p-4 rounded-sm space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-sm font-bold text-text flex items-center">
                        {display.title}
                        {isLast && (
                          <span className="ml-2 px-2 py-0.5 rounded-sm bg-accent text-text text-[10px] font-bold border border-border">
                            Current Stage
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-text-muted font-mono">
                        {new Date(historyItem.at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">
                      {display.description}
                    </p>

                    {historyItem.message && (
                      <div className="mt-2 p-3 rounded-sm bg-mint border border-border text-xs text-text flex items-start space-x-2">
                        <MessageSquareQuote className="w-4 h-4 shrink-0 text-brand-dark mt-0.5" />
                        <div>
                          <p className="font-bold">Recruiter Message:</p>
                          <p className="mt-0.5">{historyItem.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Application Details Grid */}
        <div className="pt-6 border-t border-divider grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-sand/20 border border-border p-4 rounded-sm space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Attached Resume
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-brand-dark shrink-0" />
                <span className="text-xs font-bold text-text truncate">
                  {application.resume?.filename || 'Resume.pdf'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadResume}
                disabled={downloadingResume}
                className="text-xs font-bold text-brand-dark hover:underline flex items-center shrink-0 cursor-pointer min-h-[44px]"
              >
                {downloadingResume ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                Download
              </button>
            </div>
          </div>

          <div className="bg-sand/20 border border-border p-4 rounded-sm space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Candidate Cover Note
            </p>
            <p className="text-xs text-text line-clamp-3 leading-relaxed">
              {application.coverNote || 'No cover note submitted with this application.'}
            </p>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      <GlassModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Withdraw Application"
      >
        <div className="space-y-4">
          {withdrawError && (
            <div className="p-3 rounded-sm bg-error-bg border border-error text-xs text-error">
              {withdrawError}
            </div>
          )}

          <p className="text-sm text-text leading-relaxed">
            Are you sure you want to withdraw your application for{' '}
            <strong className="text-text font-bold">{application.job?.title}</strong>?
            This action will notify the employer and cannot be undone.
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t border-divider">
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              className="glass-btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
              className="glass-btn-danger text-xs px-4 py-2"
            >
              {withdrawMutation.isPending ? 'Withdrawing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export default ApplicationDetailPage;
