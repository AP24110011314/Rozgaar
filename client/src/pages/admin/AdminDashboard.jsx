import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Building2,
  Flag,
  Briefcase,
  Search,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

export function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from query param (defaults to 'reports')
  const currentTab = searchParams.get('tab');
  const activeTab = ['reports', 'users', 'companies', 'jobs'].includes(currentTab) ? currentTab : 'reports';

  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Search and filter states
  const [reportsStatus, setReportsStatus] = useState('pending');
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [companiesSearch, setCompaniesSearch] = useState('');
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatus, setJobsStatus] = useState('');

  // Pagination states
  const [reportsPage, setReportsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);

  // Fetch Admin Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data?.data;
    },
    refetchInterval: 30000,
  });

  // Fetch Reports Queue
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports', reportsStatus, reportsPage],
    queryFn: async () => {
      const params = { page: reportsPage, limit: 10 };
      if (reportsStatus) params.status = reportsStatus;
      const res = await api.get('/admin/reports', { params });
      return res.data;
    },
    enabled: activeTab === 'reports',
  });

  // Fetch Users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', usersSearch, usersRole, usersPage],
    queryFn: async () => {
      const params = { page: usersPage, limit: 15 };
      if (usersSearch) params.q = usersSearch;
      if (usersRole) params.role = usersRole;
      const res = await api.get('/admin/users', { params });
      return res.data;
    },
    enabled: activeTab === 'users',
  });

  // Fetch Companies
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['admin-companies', companiesSearch, companiesPage],
    queryFn: async () => {
      const params = { page: companiesPage, limit: 15 };
      if (companiesSearch) params.q = companiesSearch;
      const res = await api.get('/admin/companies', { params });
      return res.data;
    },
    enabled: activeTab === 'companies',
  });

  // Fetch Jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs', jobsSearch, jobsStatus, jobsPage],
    queryFn: async () => {
      const params = { page: jobsPage, limit: 15 };
      if (jobsSearch) params.q = jobsSearch;
      if (jobsStatus) params.status = jobsStatus;
      const res = await api.get('/admin/jobs', { params });
      return res.data;
    },
    enabled: activeTab === 'jobs',
  });

  // Report resolution mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, closeJob }) => {
      const res = await api.patch(`/admin/reports/${id}`, { status, closeJob });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to update report');
    },
  });

  // User Deactivation mutation
  const toggleUserMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/admin/users/${id}/deactivate`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to update user status');
    },
  });

  const closeJobMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/admin/jobs/${id}/close`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const stats = statsData || {
    users: { total: 0, applicants: 0, recruiters: 0 },
    companies: { total: 0 },
    jobs: { open: 0, total: 0 },
    reports: { pending: 0 },
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 text-left overflow-x-hidden">
      {/* Header */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="p-2 rounded-sm bg-surface text-brand-dark border border-border shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-3xl font-bold text-text truncate">Admin Control Center</h1>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed break-words">
            Moderate job postings, review reported listings, oversee verified companies, and deactivate malicious accounts.
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <GlassBadge variant="indigo" size="md">
            System Administrator
          </GlassBadge>
        </div>
      </div>

      {/* Metrics Strip - 2x2 on mobile, 4 columns on desktop with zero overflow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-4 shadow-flat min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-sm bg-sand text-text flex items-center justify-center border border-border shrink-0">
            <Users className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Total Users</p>
            <p className="text-base sm:text-2xl font-bold text-text truncate">{stats.users.total}</p>
            <p className="text-[10px] text-text-muted truncate">
              {stats.users.applicants} seekers • {stats.users.recruiters} recruiters
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-4 shadow-flat min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-sm bg-sand text-text flex items-center justify-center border border-border shrink-0">
            <Building2 className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Companies</p>
            <p className="text-base sm:text-2xl font-bold text-text truncate">{stats.companies.total}</p>
            <p className="text-[10px] text-text-muted truncate">Registered SMBs</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-4 shadow-flat min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-sm bg-mint text-text flex items-center justify-center border border-border shrink-0">
            <Briefcase className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Open Jobs</p>
            <p className="text-base sm:text-2xl font-bold text-text truncate">{stats.jobs.open}</p>
            <p className="text-[10px] text-text-muted truncate">{stats.jobs.total} listings</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-3 sm:p-5 flex items-center space-x-2.5 sm:space-x-4 shadow-flat min-w-0 overflow-hidden">
          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center shrink-0 border ${
            stats.reports.pending > 0
              ? 'bg-error-bg text-error border-error'
              : 'bg-sand/30 text-text border-border'
          }`}>
            <Flag className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider truncate">Pending Reports</p>
            <p className={`text-base sm:text-2xl font-bold truncate ${stats.reports.pending > 0 ? 'text-error' : 'text-text'}`}>
              {stats.reports.pending}
            </p>
            <p className="text-[10px] text-text-muted truncate">Needs review</p>
          </div>
        </div>
      </div>

      {/* Tabs with Horizontal Scroll and Snap Points */}
      <div className="flex border-b border-divider space-x-4 sm:space-x-8 text-sm font-bold overflow-x-auto scrollbar-none snap-x snap-mandatory max-w-full pb-1">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 transition-colors relative flex items-center space-x-2 min-h-[44px] whitespace-nowrap cursor-pointer snap-start shrink-0 ${
            activeTab === 'reports'
              ? 'text-text border-b-2 border-brand-dark font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Reported Jobs Queue</span>
          {stats.reports.pending > 0 && (
            <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-bold bg-error text-white">
              {stats.reports.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors relative flex items-center space-x-2 min-h-[44px] whitespace-nowrap cursor-pointer snap-start shrink-0 ${
            activeTab === 'users'
              ? 'text-text border-b-2 border-brand-dark font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-3 transition-colors relative flex items-center space-x-2 min-h-[44px] whitespace-nowrap cursor-pointer snap-start shrink-0 ${
            activeTab === 'companies'
              ? 'text-text border-b-2 border-brand-dark font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Companies</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 transition-colors relative flex items-center space-x-2 min-h-[44px] whitespace-nowrap cursor-pointer snap-start shrink-0 ${
            activeTab === 'jobs'
              ? 'text-text border-b-2 border-brand-dark font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>All Job Postings</span>
        </button>
      </div>

      {/* TAB 1: REPORTED JOBS QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <select
                value={reportsStatus}
                onChange={(e) => {
                  setReportsStatus(e.target.value);
                  setReportsPage(1);
                }}
                className="glass-input cursor-pointer min-h-[44px]"
              >
                <option value="pending">Pending Review</option>
                <option value="action_taken">Action Taken (Closed)</option>
                <option value="dismissed">Dismissed</option>
                <option value="reviewed">Reviewed</option>
                <option value="">All Reports</option>
              </select>
            </div>
          </div>

          {reportsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2 text-text bg-surface border border-border rounded-md">
              <Loader2 className="w-8 h-8 animate-spin text-brand-dark" />
              <p className="text-xs">Loading reported queue...</p>
            </div>
          ) : (reportsData?.data || []).length === 0 ? (
            <div className="bg-surface border border-border rounded-md p-8 sm:p-12 text-center space-y-3 shadow-flat">
              <CheckCircle2 className="w-12 h-12 text-brand-dark mx-auto" />
              <h2 className="text-base font-bold text-text">Queue is Clear</h2>
              <p className="text-xs text-text-muted">No reports found matching status "{reportsStatus || 'all'}".</p>
            </div>
          ) : (
            <div className="space-y-4 w-full min-w-0">
              {(reportsData?.data || []).map((report) => (
                <div
                  key={report._id}
                  className="bg-surface border border-border rounded-md p-3.5 sm:p-5 space-y-3 sm:space-y-4 hover:border-brand-dark transition-all shadow-flat min-w-0 w-full overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 min-w-0 w-full">
                    <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <GlassBadge variant="danger" size="sm" className="uppercase tracking-wider text-[10px]">
                          {report.reason}
                        </GlassBadge>
                        <span className="text-xs font-semibold text-text-muted">
                          Reported on {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-text pt-1 break-words">
                        Listing: {report.job?.title || 'Unknown Job'}
                      </h3>
                      <p className="text-xs text-text-muted break-words">
                        Employer: {report.job?.company?.name || 'Local Company'} • Job Status:{' '}
                        <span className="font-bold text-text">{report.job?.status}</span>
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-divider">
                      {report.status === 'pending' && (
                        <>
                          <GlassButton
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              updateReportMutation.mutate({
                                id: report._id,
                                status: 'action_taken',
                                closeJob: true,
                              })
                            }
                            disabled={updateReportMutation.isPending}
                            className="min-h-[44px] flex-1 sm:flex-none justify-center"
                          >
                            Close Listing
                          </GlassButton>

                          <GlassButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              updateReportMutation.mutate({
                                id: report._id,
                                status: 'dismissed',
                                closeJob: false,
                              })
                            }
                            disabled={updateReportMutation.isPending}
                            className="min-h-[44px] flex-1 sm:flex-none justify-center"
                          >
                            Dismiss
                          </GlassButton>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Report Details and Reporter */}
                  <div className="p-3 sm:p-3.5 rounded-sm bg-sand/20 border border-border text-xs space-y-1.5 min-w-0 overflow-hidden">
                    {report.text && (
                      <p className="text-text italic break-words">"{report.text}"</p>
                    )}
                    <p className="text-[11px] text-text-muted break-all">
                      Reported by {report.reporter?.name} ({report.reporter?.email})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS MODERATION */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                placeholder="Search user name or email..."
                className="glass-input w-full pl-9 pr-3 text-xs min-h-[44px]"
              />
            </div>

            <select
              value={usersRole}
              onChange={(e) => {
                setUsersRole(e.target.value);
                setUsersPage(1);
              }}
              className="glass-input text-xs font-bold cursor-pointer min-h-[44px] w-full sm:w-auto"
            >
              <option value="">All Roles</option>
              <option value="applicant">Applicant</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="bg-surface border border-border rounded-md shadow-flat overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text min-w-[600px]">
                <thead className="bg-sand border-b border-border text-text uppercase font-bold">
                  <tr>
                    <th className="px-4 sm:px-5 py-3.5 sticky left-0 bg-sand z-10 shadow-[2px_0_4px_rgba(46,29,16,0.06)]">User</th>
                    <th className="px-4 sm:px-5 py-3.5">Role</th>
                    <th className="px-4 sm:px-5 py-3.5">Company</th>
                    <th className="px-4 sm:px-5 py-3.5">Status</th>
                    <th className="px-4 sm:px-5 py-3.5">Joined</th>
                    <th className="px-4 sm:px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {(usersData?.data || []).map((u) => (
                    <tr key={u._id} className="hover:bg-sand/20 transition-colors">
                      <td className="px-4 sm:px-5 py-3.5 sticky left-0 bg-surface z-10 shadow-[2px_0_4px_rgba(46,29,16,0.06)]">
                        <p className="font-bold text-text truncate max-w-[140px] sm:max-w-none">{u.name}</p>
                        <p className="text-[11px] text-text-muted truncate max-w-[140px] sm:max-w-none">{u.email}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <GlassBadge variant="neutral" size="sm" className="capitalize">
                          {u.role}
                        </GlassBadge>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-text">
                        {u.company?.name || '—'}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        {u.isActive ? (
                          <span className="inline-flex items-center text-text font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-brand-dark mr-1.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-error font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-error mr-1.5" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-text-muted">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        {u._id !== user?._id && (
                          <button
                            type="button"
                            onClick={() => toggleUserMutation.mutate(u._id)}
                            disabled={toggleUserMutation.isPending}
                            className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors min-h-[44px] cursor-pointer border ${
                              u.isActive
                                ? 'text-error hover:bg-error-bg border-error'
                                : 'text-text hover:bg-mint border-border bg-sand/30'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANIES DIRECTORY */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={companiesSearch}
              onChange={(e) => {
                setCompaniesSearch(e.target.value);
                setCompaniesPage(1);
              }}
              placeholder="Search company name..."
              className="glass-input w-full pl-9 pr-3 text-xs min-h-[44px]"
            />
          </div>

          <div className="bg-surface border border-border rounded-md shadow-flat overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text min-w-[600px]">
                <thead className="bg-sand border-b border-border text-text uppercase font-bold">
                  <tr>
                    <th className="px-4 sm:px-5 py-3.5 sticky left-0 bg-sand z-10 shadow-[2px_0_4px_rgba(46,29,16,0.06)]">Company</th>
                    <th className="px-4 sm:px-5 py-3.5">Owner</th>
                    <th className="px-4 sm:px-5 py-3.5">Location</th>
                    <th className="px-4 sm:px-5 py-3.5">Active Jobs</th>
                    <th className="px-4 sm:px-5 py-3.5">Team Size</th>
                    <th className="px-4 sm:px-5 py-3.5">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {(companiesData?.data || []).map((c) => (
                    <tr key={c._id} className="hover:bg-sand/20 transition-colors">
                      <td className="px-4 sm:px-5 py-3.5 sticky left-0 bg-surface z-10 shadow-[2px_0_4px_rgba(46,29,16,0.06)]">
                        <p className="font-bold text-text truncate max-w-[140px] sm:max-w-none">{c.name}</p>
                        <p className="text-[11px] text-text-muted">/{c.slug}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <p className="font-bold text-text truncate max-w-[140px] sm:max-w-none">{c.owner?.name}</p>
                        <p className="text-[11px] text-text-muted truncate max-w-[140px] sm:max-w-none">{c.owner?.email}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-text">
                        {c.location?.city ? `${c.location.city}, ${c.location.state}` : 'Unlisted'}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="font-bold text-text">{c.jobCount}</span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="font-medium text-text">{c.memberCount} members</span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-text-muted">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALL JOBS */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={jobsSearch}
                onChange={(e) => {
                  setJobsSearch(e.target.value);
                  setJobsPage(1);
                }}
                placeholder="Search job title..."
                className="glass-input w-full pl-9 pr-3 text-xs min-h-[44px]"
              />
            </div>

            <select
              value={jobsStatus}
              onChange={(e) => {
                setJobsStatus(e.target.value);
                setJobsPage(1);
              }}
              className="glass-input text-xs font-bold cursor-pointer min-h-[44px] w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="bg-surface border border-border rounded-md shadow-flat overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text min-w-[600px]">
                <thead className="bg-sand border-b border-border text-text uppercase font-bold">
                  <tr>
                    <th className="px-4 sm:px-5 py-3.5 sticky left-0 bg-sand z-10 shadow-[2px_0_4px_rgba(46,29,16,0.06)]">Job Title</th>
                    <th className="px-4 sm:px-5 py-3.5">Company</th>
                    <th className="px-4 sm:px-5 py-3.5">Type</th>
                    <th className="px-4 sm:px-5 py-3.5">Applications</th>
                    <th className="px-4 sm:px-5 py-3.5">Status</th>
                    <th className="px-4 sm:px-5 py-3.5 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {(jobsData?.data || []).map((j) => (
                    <tr key={j._id} className="hover:bg-sand/20 transition-colors">
                      <td className="px-4 sm:px-5 py-3.5 font-bold text-text sticky left-0 bg-surface z-10 shadow-[2px_0_4px_rgba(46,29,16,0.06)]">
                        <Link to={`/jobs/${j._id}`} target="_blank" className="hover:text-brand-dark flex items-center min-h-[44px] underline truncate max-w-[140px] sm:max-w-none">
                          {j.title} <ExternalLink className="w-3 h-3 ml-1 text-text-muted shrink-0" />
                        </Link>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-text">
                        {j.company?.name || 'Local Company'}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 capitalize">
                        {j.employmentType} {j.remote && '(Remote)'}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 font-bold text-text">
                        {j.applicationCount || 0}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5">
                        <GlassBadge
                          variant={
                            j.status === 'open' ? 'success' : j.status === 'draft' ? 'warning' : 'neutral'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {j.status}
                        </GlassBadge>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        {j.status !== 'closed' && (
                          <button
                            type="button"
                            onClick={() => closeJobMutation.mutate(j._id)}
                            disabled={closeJobMutation.isPending}
                            className="px-3 py-1.5 rounded-sm text-xs font-bold text-error hover:bg-error-bg border border-error transition-colors min-h-[44px] cursor-pointer"
                          >
                            Close Job
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
