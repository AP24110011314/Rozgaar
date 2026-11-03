import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Briefcase, User, Bookmark, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function BottomBar() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Distinct, non-conflicting navigation items based on auth state
  const getNavItems = () => {
    if (!isAuthenticated || !user) {
      return [
        { path: '/jobs', label: 'Find Jobs', icon: Search },
        { path: '/me/saved', label: 'Saved', icon: Bookmark },
        { path: '/login', label: 'Sign in', icon: User },
        { path: '/register', label: 'Sign up', icon: Briefcase },
      ];
    }

    if (user.role === 'recruiter') {
      return [
        { path: '/jobs', label: 'Find Jobs', icon: Search },
        { path: '/recruiter/jobs', label: 'Pipelines', icon: LayoutDashboard },
        { path: '/recruiter/jobs/new', label: 'Post Job', icon: Briefcase },
        { path: '/recruiter/company', label: 'Company', icon: User },
      ];
    }

    if (user.role === 'admin') {
      return [
        { path: '/jobs', label: 'Find Jobs', icon: Search },
        { path: '/admin', label: 'Admin', icon: ShieldCheck },
        { path: '/me/applications', label: 'Applications', icon: Briefcase },
        { path: '/me/profile', label: 'Profile', icon: User },
      ];
    }

    // Default applicant role
    return [
      { path: '/jobs', label: 'Find Jobs', icon: Search },
      { path: '/me/applications', label: 'Applications', icon: Briefcase },
      { path: '/me/saved', label: 'Saved', icon: Bookmark },
      { path: '/me/profile', label: 'Profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      aria-label="Mobile Bottom App Bar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-sand border-t-2 border-brand shadow-[0_-2px_10px_rgba(46,29,16,0.15)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 h-16 items-center px-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-sm transition-colors no-underline ${
                active
                  ? 'bg-accent text-text font-bold'
                  : 'text-text hover:bg-surface/50'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-bold mt-0.5 leading-tight truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomBar;
