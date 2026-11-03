import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Search,
  Calendar,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassBadge } from '../../components/glass/index.js';

export function ApplicantDashboard() {
  const { user } = useAuth();
  const [filterStage, setFilterStage] = useState('all');

  // Live polling every 30 seconds
  const {
    data: applications,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const res = await api.get('/applications/mine');
      return res.data?.data || [];
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const apps = applications || [];

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'applied':
        return <GlassBadge variant="indigo">Applied</GlassBadge>;
      case 'reviewing':
        return <GlassBadge variant="warning">Under Review</GlassBadge>;
      case 'interviewing':
        return <GlassBadge variant="saffron">Interviewing</GlassBadge>;
      case 'offered':
        return <GlassBadge variant="success">Offer Extended</GlassBadge>;
      case 'hired':
        return <GlassBadge variant="success">Hired</GlassBadge>;
      case 'rejected':
        return <GlassBadge variant="neutral">Not Selected</GlassBadge>;
      case 'withdrawn':
        return <GlassBadge variant="neutral">Withdrawn</GlassBadge>;
      default:
        return <GlassBadge variant="neutral">{stage}</GlassBadge>;
    }
  };

  const getDaysAgo = (dateStr) => {
    const diffTime = Math.abs(Date.now() - new Date(dateStr).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const totalApplied = apps.length;
  const inReview = apps.filter((a) => a.stage === 'reviewing').length;
  const interviews = apps.filter((a) => a.stage === 'interviewing').length;
  const offers = apps.filter((a) => a.stage === 'offered' || a.stage === 'hired').length;

  const filteredApps = apps.filter((a) => {
    if (filterStage === 'all') return true;
    return a.stage === filterStage;
  });

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-text break-words">
            Candidate Application Tracking
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Track your verified local job applications on our live anti-ghosting timeline.
          </p>
        </div>
        <Link to="/jobs" className="glass-btn-primary text-xs px-4 sm:px-5 py-2.5 flex items-center justify-center min-h-[44px] w-full sm:w-auto shrink-0">
          <Search className="w-4 h-4 mr-1.5" /> Explore More Jobs
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5 text-center shadow-flat min-w-0">
          <p className="text-xl sm:text-3xl font-extrabold text-brand-dark">
            {totalApplied}
          </p>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted mt-0.5 sm:mt-1 truncate">
            Total Applications
          </p>
        </div>

        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5 text-center shadow-flat min-w-0">
          <p className="text-xl sm:text-3xl font-extrabold text-text">
            {inReview}
          </p>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted mt-0.5 sm:mt-1 truncate">
            Under Review
          </p>
        </div>

        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5 text-center shadow-flat min-w-0">
          <p className="text-xl sm:text-3xl font-extrabold text-text">
            {interviews}
          </p>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted mt-0.5 sm:mt-1 truncate">
            Interviewing
          </p>
        </div>

        <div className="bg-surface border border-border rounded-md p-3.5 sm:p-5 text-center shadow-flat min-w-0">
          <p className="text-xl sm:text-3xl font-extrabold text-brand-dark">
            {offers}
          </p>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-muted mt-0.5 sm:mt-1 truncate">
            Offers & Hired
          </p>
        </div>
      </div>

      {/* Filter Tabs Row (Horizontal scroll with snap points on mobile) */}
      <div className="flex border-b border-divider pb-3 space-x-2 overflow-x-auto scrollbar-none snap-x snap-mandatory w-full max-w-full min-w-0">
        {['all', 'applied', 'reviewing', 'interviewing', 'offered', 'hired', 'rejected'].map((stage) => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage)}
            className={`px-3.5 py-2 rounded-sm text-xs font-bold transition-all capitalize min-h-[44px] cursor-pointer whitespace-nowrap snap-start shrink-0 ${
              filterStage === stage
                ? 'bg-brand-dark text-white border border-brand-dark'
                : 'bg-surface border border-border text-text hover:bg-sand'
            }`}
          >
            {stage === 'all' ? 'All Applications' : stage}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 space-y-3 bg-surface border border-border rounded-md w-full min-w-0">
          <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
          <p className="text-sm font-semibold text-text">
            Fetching application status...
          </p>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-md bg-error-bg border border-error text-error text-center space-y-2 w-full min-w-0">
          <AlertCircle className="w-6 h-6 mx-auto" />
          <p className="text-sm font-bold">Failed to load applications</p>
          <p className="text-xs">{error?.message || 'Server error'}</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-6 sm:p-12 text-center space-y-4 shadow-flat w-full min-w-0">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-text break-words">
            {filterStage === 'all' ? 'No applications submitted yet' : `No applications in ${filterStage} stage`}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
            Browse verified openings near you and submit your resume directly to local business owners.
          </p>
          <Link to="/jobs" className="glass-btn-primary text-xs px-6 py-2.5 inline-flex items-center min-h-[44px]">
            <Search className="w-4 h-4 mr-2" /> Browse Jobs Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 w-full min-w-0">
          {filteredApps.map((app) => (
            <div
              key={app._id}
              className="bg-surface border border-border rounded-md p-3.5 sm:p-6 hover:border-brand-dark transition-all shadow-flat w-full min-w-0 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-text hover:text-brand-dark transition-colors break-words min-w-0">
                      <Link to={`/me/applications/${app._id}`} className="underline break-words">
                        {app.job?.title || 'Job Opening'}
                      </Link>
                    </h2>
                    <div className="shrink-0">
                      {getStageBadge(app.stage)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2 sm:gap-x-3 text-xs text-text-muted min-w-0">
                    <span className="flex items-center text-text font-medium truncate max-w-full">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-brand shrink-0" />
                      <span className="truncate">{app.company?.name || 'Local Company'}</span>
                    </span>
                    <span className="text-text-muted shrink-0">•</span>
                    <span className="flex items-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-brand shrink-0" />
                      Applied {getDaysAgo(app.createdAt)}
                    </span>
                  </div>

                  {app.stageHistory && app.stageHistory.length > 0 && (
                    <div className="text-xs text-text-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-1 font-mono min-w-0">
                      <div className="flex items-center shrink-0">
                        <Clock className="w-3.5 h-3.5 mr-1 text-brand shrink-0" />
                        <span>Status:</span>
                        <strong className="ml-1 text-text capitalize">{app.stageHistory[app.stageHistory.length - 1]?.stage}</strong>
                      </div>
                      <span className="text-[11px] text-text-muted shrink-0">
                        ({new Date(app.stageHistory[app.stageHistory.length - 1]?.at).toLocaleDateString()})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-divider w-full sm:w-auto">
                  <Link
                    to={`/me/applications/${app._id}`}
                    className="glass-btn-secondary text-xs px-4 py-2 min-h-[44px] flex items-center w-full sm:w-auto justify-center shrink-0"
                  >
                    View Timeline <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApplicantDashboard;
