import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Briefcase, User, Bell, LayoutDashboard, ShieldCheck, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios.js';

export function BottomBar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Fetch unread count for badge
  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getDashboardDestination = () => {
    if (!isAuthenticated || !user) return { path: '/login', label: 'Sign in', icon: User };
    if (user.role === 'recruiter') return { path: '/recruiter/jobs', label: 'Pipelines', icon: LayoutDashboard };
    if (user.role === 'admin') return { path: '/admin', label: 'Admin', icon: ShieldCheck };
    return { path: '/me/applications', label: 'Applications', icon: Briefcase };
  };

  const getProfileDestination = () => {
    if (!isAuthenticated || !user) return { path: '/register', label: 'Sign up', icon: User };
    if (user.role === 'recruiter') return { path: '/recruiter/company', label: 'Company', icon: User };
    return { path: '/me/profile', label: 'Profile', icon: User };
  };

  const dashboardItem = getDashboardDestination();
  const profileItem = getProfileDestination();

  return (
    <nav
      aria-label="Mobile Bottom App Bar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-sand border-t-2 border-brand shadow-[0_-2px_10px_rgba(46,29,16,0.15)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 h-16 items-center px-1">
        {/* 1. Find Jobs */}
        <Link
          to="/jobs"
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-sm transition-colors no-underline ${
            isActive('/jobs')
              ? 'bg-accent text-text font-bold'
              : 'text-text hover:bg-surface/50'
          }`}
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] font-bold mt-0.5 leading-tight">Find Jobs</span>
        </Link>

        {/* 2. Primary Role Dashboard (Applications / Kanban / Admin) */}
        <Link
          to={dashboardItem.path}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-sm transition-colors no-underline ${
            isActive(dashboardItem.path)
              ? 'bg-accent text-text font-bold'
              : 'text-text hover:bg-surface/50'
          }`}
        >
          <dashboardItem.icon className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] font-bold mt-0.5 leading-tight truncate max-w-full">
            {dashboardItem.label}
          </span>
        </Link>

        {/* 3. Saved Jobs (Applicant) or Quick Link */}
        {isAuthenticated && user?.role === 'applicant' ? (
          <Link
            to="/me/saved"
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-sm transition-colors no-underline ${
              isActive('/me/saved')
                ? 'bg-accent text-text font-bold'
                : 'text-text hover:bg-surface/50'
            }`}
          >
            <Bookmark className="w-5 h-5" aria-hidden="true" />
            <span className="text-[11px] font-bold mt-0.5 leading-tight">Saved</span>
          </Link>
        ) : (
          <Link
            to={isAuthenticated ? (user?.role === 'recruiter' ? '/recruiter/jobs/new' : '/jobs') : '/login'}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-sm transition-colors no-underline ${
              isActive(user?.role === 'recruiter' ? '/recruiter/jobs/new' : '/login')
                ? 'bg-accent text-text font-bold'
                : 'text-text hover:bg-surface/50'
            }`}
          >
            {user?.role === 'recruiter' ? (
              <>
                <Briefcase className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-bold mt-0.5 leading-tight">Post Job</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-bold mt-0.5 leading-tight">Alerts</span>
              </>
            )}
          </Link>
        )}

        {/* 4. Profile / Company / Auth */}
        <Link
          to={profileItem.path}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-sm transition-colors no-underline ${
            isActive(profileItem.path)
              ? 'bg-accent text-text font-bold'
              : 'text-text hover:bg-surface/50'
          }`}
        >
          <profileItem.icon className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] font-bold mt-0.5 leading-tight truncate max-w-full">
            {profileItem.label}
          </span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomBar;

