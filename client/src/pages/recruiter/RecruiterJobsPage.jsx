import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Users,
  Building2,
  ExternalLink,
  Edit3,
  Trash2,
  Columns3,
  Clock,
  MapPin,
  IndianRupee,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

export function RecruiterJobsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  // Fetch recruiter's company jobs
  const {
    data: jobsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/recruiter');
      return res.data?.data || [];
    },
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/jobs/${id}/status`, { status });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.response?.data?.error?.message || 'Failed to update job status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      setDeletingId(null);
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.response?.data?.error?.message || 'Failed to delete job');
      setDeletingId(null);
    },
  });

  const jobs = jobsData || [];
  const filteredJobs = statusFilter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === statusFilter);

  const totalOpen = jobs.filter((j) => j.status === 'open').length;
  const totalDraft = jobs.filter((j) => j.status === 'draft').length;
  const totalClosed = jobs.filter((j) => j.status === 'closed').length;
  const totalApplications = jobs.reduce((acc, j) => acc + (j.applicationCount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <GlassBadge variant="success" size="sm">Open</GlassBadge>;
      case 'draft':
        return <GlassBadge variant="warning" size="sm">Draft</GlassBadge>;
      case 'closed':
        return <GlassBadge variant="neutral" size="sm">Closed</GlassBadge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 text-left">
      {/* Header */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">Job Listings & Pipelines</h1>
            <GlassBadge variant="indigo" size="md">
              {jobs.length} total
            </GlassBadge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Manage your open postings, track candidates through Kanban boards, and hire top local talent.
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link to="/recruiter/company" className="w-full sm:w-auto">
            <GlassButton variant="secondary" size="md" className="w-full justify-center min-h-[44px]">
              <Building2 className="w-4 h-4 mr-1.5 text-brand" />
              Company Profile
            </GlassButton>
          </Link>
          <Link to="/recruiter/jobs/new" className="w-full sm:w-auto">
            <GlassButton variant="primary" size="md" className="w-full justify-center min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              Post New Job
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-3 shadow-flat">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-sm bg-mint text-text flex items-center justify-center border border-border shrink-0">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Open Jobs</p>
            <p className="text-lg sm:text-2xl font-bold text-text">{totalOpen}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-3 shadow-flat">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-sm bg-sand text-text flex items-center justify-center border border-border shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Drafts</p>
            <p className="text-lg sm:text-2xl font-bold text-text">{totalDraft}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-3 shadow-flat">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-sm bg-sand/30 text-text flex items-center justify-center border border-border shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Closed</p>
            <p className="text-lg sm:text-2xl font-bold text-text">{totalClosed}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-3 shadow-flat">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-sm bg-accent/40 text-text flex items-center justify-center border border-border shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Applications</p>
            <p className="text-lg sm:text-2xl font-bold text-text">{totalApplications}</p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-sm bg-error-bg border border-error text-error text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs / Filters */}
      <div className="flex border-b border-divider space-x-4 sm:space-x-6 text-sm font-bold overflow-x-auto">
        {[
          { key: 'all', label: `All (${jobs.length})` },
          { key: 'open', label: `Open (${totalOpen})` },
          { key: 'draft', label: `Draft (${totalDraft})` },
          { key: 'closed', label: `Closed (${totalClosed})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`pb-3 transition-colors relative whitespace-nowrap min-h-[44px] cursor-pointer ${
              statusFilter === tab.key
                ? 'text-text border-b-2 border-brand-dark font-bold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-text bg-surface border border-border rounded-md">
          <Loader2 className="w-8 h-8 animate-spin text-brand-dark" />
          <p className="text-sm font-medium">Loading your company's jobs...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-8 border border-error bg-error-bg text-center space-y-3 rounded-md">
          <AlertCircle className="w-8 h-8 text-error mx-auto" />
          <h2 className="text-base font-bold text-error">Unable to load job postings</h2>
          <p className="text-sm text-error max-w-md mx-auto">
            {error?.response?.data?.error?.message || 'An unexpected error occurred while fetching jobs.'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredJobs.length === 0 && (
        <div className="bg-surface border border-border rounded-md p-12 text-center space-y-4 shadow-flat">
          <div className="w-14 h-14 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-text">
              {statusFilter === 'all'
                ? 'No jobs created yet'
                : `No ${statusFilter} jobs found`}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Create your job listing to start receiving local applicants and tracking them on the Kanban pipeline.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/recruiter/jobs/new">
              <GlassButton variant="primary">
                <Plus className="w-4 h-4 mr-1.5" />
                Post a Job Now
              </GlassButton>
            </Link>
          </div>
        </div>
      )}

      {/* Job Cards List */}
      {!isLoading && !isError && filteredJobs.length > 0 && (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-surface border border-border rounded-md p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 hover:border-brand-dark transition-all shadow-flat"
            >
              {/* Job Info */}
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-text">{job.title}</h2>
                  {getStatusBadge(job.status)}
                  <GlassBadge variant="neutral" size="sm" className="capitalize">
                    {job.employmentType}
                  </GlassBadge>
                  {job.remote && (
                    <GlassBadge variant="indigo" size="sm">
                      Remote
                    </GlassBadge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-text font-medium">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    <span>
                      {job.location?.city ? `${job.location.city}, ${job.location.state || 'India'}` : 'Location unlisted'}
                    </span>
                  </div>

                  {job.salary?.min || job.salary?.max ? (
                    <div className="flex items-center space-x-1 text-text font-bold">
                      <IndianRupee className="w-3.5 h-3.5 text-brand" />
                      <span>
                        {job.salary.min ? `₹${job.salary.min.toLocaleString('en-IN')}` : ''}
                        {job.salary.min && job.salary.max ? ' - ' : ''}
                        {job.salary.max ? `₹${job.salary.max.toLocaleString('en-IN')}` : ''}
                        {' / ' + job.salary.period}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center space-x-1 text-text-muted">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Skills tags */}
                {job.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-sand/30 text-text border border-border"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons & Pipeline link */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-divider w-full lg:w-auto justify-between lg:justify-end">
                {/* Kanban Pipeline link */}
                <Link to={`/recruiter/jobs/${job._id}/board`} className="flex-1 sm:flex-initial">
                  <GlassButton variant="primary" size="sm" className="w-full sm:w-auto justify-center flex items-center min-h-[44px]">
                    <Columns3 className="w-4 h-4 mr-1.5" />
                    Pipeline
                    <span className="ml-1.5 px-2 py-0.5 rounded-sm bg-accent text-text text-[10px] font-bold border border-border">
                      {job.applicationCount || 0}
                    </span>
                  </GlassButton>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Switcher */}
                  <div className="relative inline-block text-left">
                    <select
                      value={job.status}
                      onChange={(e) =>
                        statusMutation.mutate({ id: job._id, status: e.target.value })
                      }
                      disabled={statusMutation.isPending}
                      aria-label={`Status for ${job.title}`}
                      className="min-h-[44px] appearance-none bg-surface border border-border text-text text-xs font-bold py-2 pl-3 pr-7 rounded-sm hover:bg-sand/30 focus:outline-none focus:ring-2 focus:ring-brand-dark cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <option value="open">Status: Open</option>
                      <option value="draft">Status: Draft</option>
                      <option value="closed">Status: Closed</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Edit */}
                  <Link
                    to={`/recruiter/jobs/${job._id}/edit`}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-border text-text hover:bg-sand transition-colors"
                    title="Edit Job Posting"
                    aria-label={`Edit ${job.title}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  {/* View on Public Portal */}
                  <Link
                    to={`/jobs/${job._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-border text-text hover:bg-sand transition-colors"
                    title="View Public Listing"
                    aria-label={`View public listing for ${job.title}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
                        deleteMutation.mutate(job._id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-error text-error hover:bg-error-bg transition-colors cursor-pointer"
                    title="Delete Job"
                    aria-label={`Delete ${job.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecruiterJobsPage;
