import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LogOut, Menu, X, ChevronDown, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NotificationBell } from './NotificationBell.jsx';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'recruiter') return '/recruiter/jobs';
    if (user.role === 'admin') return '/admin';
    return '/me/applications';
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile drawer and focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          menuButtonRef.current?.focus();
        }
        if (userDropdownOpen) {
          setUserDropdownOpen(false);
        }
      }
    };

    if (mobileMenuOpen || userDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, userDropdownOpen]);

  // Trap focus inside the mobile drawer when opened
  useEffect(() => {
    if (!mobileMenuOpen || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };

    const drawerNode = drawerRef.current;
    drawerNode.addEventListener('keydown', handleTabKey);
    return () => drawerNode.removeEventListener('keydown', handleTabKey);
  }, [mobileMenuOpen]);

  const navLinkClasses = (path) => `
    px-3.5 py-2 text-base font-bold text-text hover:underline transition-all
    focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus
    min-h-[44px] flex items-center border-b-3
    ${isActive(path) ? 'border-brand-dark font-extrabold' : 'border-transparent'}
  `;

  return (
    <header className="sticky top-0 z-40 bg-sand border-b-4 border-brand text-text pt-[env(safe-area-inset-top,0px)]">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-dark focus:text-white focus:outline-none focus:outline-3 focus:outline-focus rounded-sm font-bold shadow-flat"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-3 text-text no-underline focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus rounded-sm p-1"
            >
              <div className="w-10 h-10 rounded-md bg-brand-dark flex items-center justify-center text-white font-bold border border-brand shrink-0">
                <Briefcase className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-extrabold tracking-tight text-text leading-none">
                  रोज़गार <span className="text-brand-dark">Rozgaar</span>
                </span>
                <span className="text-xs text-text-muted tracking-wider uppercase font-bold mt-0.5">
                  Official ATS Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1 pl-4">
              <Link to="/jobs" className={navLinkClasses('/jobs')}>
                Find Jobs
              </Link>

              {isAuthenticated && user?.role === 'applicant' && (
                <>
                  <Link to="/me/applications" className={navLinkClasses('/me/applications')}>
                    My Applications
                  </Link>
                  <Link to="/me/profile" className={navLinkClasses('/me/profile')}>
                    Profile & Resumes
                  </Link>
                  <Link to="/me/saved" className={navLinkClasses('/me/saved')}>
                    Saved Jobs
                  </Link>
                </>
              )}

              {isAuthenticated && user?.role === 'recruiter' && (
                <>
                  <Link to="/recruiter/jobs" className={navLinkClasses('/recruiter/jobs')}>
                    Jobs & Pipelines
                  </Link>
                  <Link to="/recruiter/company" className={navLinkClasses('/recruiter/company')}>
                    Company Profile
                  </Link>
                </>
              )}

              {isAuthenticated && user?.role === 'admin' && (
                <Link to="/admin" className={navLinkClasses('/admin')}>
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>

          {/* Right side controls (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <NotificationBell />

                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2.5 px-3 py-1.5 rounded-md bg-surface border border-border text-text hover:border-brand-dark transition-all focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus min-h-[44px] cursor-pointer"
                    aria-expanded={userDropdownOpen}
                    aria-label="User account menu"
                  >
                    <div className="w-7 h-7 rounded-sm bg-brand-dark text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold max-w-[120px] truncate text-text">{user.name}</span>
                    <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-sm bg-sand text-text border border-border">
                      {user.role}
                    </span>
                    <ChevronDown className="w-4 h-4 text-text-muted" aria-hidden="true" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-surface border-2 border-border rounded-md p-2 shadow-flat z-50 text-left">
                      <div className="px-3 py-2 border-b border-divider mb-1">
                        <p className="text-sm font-bold text-text truncate">{user.name}</p>
                        <p className="text-xs text-text-muted truncate">{user.email}</p>
                      </div>

                      <Link
                        to={getDashboardLink()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-3 py-2 text-sm font-bold text-text hover:bg-sand rounded-sm"
                      >
                        Dashboard
                      </Link>

                      {user.role === 'applicant' && (
                        <Link
                          to="/me/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-3 py-2 text-sm font-bold text-text hover:bg-sand rounded-sm"
                        >
                          Profile & Resumes
                        </Link>
                      )}

                      <div className="pt-1 border-t border-divider mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2 text-sm font-bold text-error hover:bg-error-bg rounded-sm cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-base font-bold text-text hover:underline focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus min-h-[44px] flex items-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-dark text-white hover:bg-brand-darker font-bold text-base px-5 py-2 rounded-md min-h-[44px] flex items-center no-underline border border-brand-dark shadow-flat focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger & notification bell */}
          <div className="flex items-center space-x-2 md:hidden">
            {isAuthenticated && <NotificationBell />}
            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-md bg-surface border-2 border-border text-text hover:bg-sand min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-panel"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-text" aria-hidden="true" /> : <Menu className="w-6 h-6 text-text" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-In Navigation Panel for Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-overlay transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Drawer */}
          <div
            id="mobile-nav-panel"
            ref={drawerRef}
            className="relative w-4/5 max-w-sm h-full bg-sand border-l-2 border-brand p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto text-left"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-brand">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-sm bg-brand-dark flex items-center justify-center text-white">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-lg text-text">Rozgaar Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-sm bg-surface border border-border text-text min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation Links" className="py-4 space-y-1.5">
                <Link
                  to="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                    isActive('/jobs') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                  }`}
                >
                  Find Verified Jobs
                </Link>

                {isAuthenticated ? (
                  <>
                    {user.role === 'applicant' && (
                      <>
                        <Link
                          to="/me/applications"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                            isActive('/me/applications') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                          }`}
                        >
                          My Applications
                        </Link>
                        <Link
                          to="/me/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                            isActive('/me/profile') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                          }`}
                        >
                          Profile & Resumes
                        </Link>
                        <Link
                          to="/me/saved"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                            isActive('/me/saved') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                          }`}
                        >
                          Saved Jobs
                        </Link>
                      </>
                    )}

                    {user.role === 'recruiter' && (
                      <>
                        <Link
                          to="/recruiter/jobs"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                            isActive('/recruiter/jobs') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                          }`}
                        >
                          Job Listings & Pipelines
                        </Link>
                        <Link
                          to="/recruiter/company"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                            isActive('/recruiter/company') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                          }`}
                        >
                          Company Profile
                        </Link>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-3.5 py-3 rounded-md text-base font-bold text-text min-h-[44px] flex items-center ${
                          isActive('/admin') ? 'bg-surface border-l-4 border-brand-dark font-extrabold' : 'hover:bg-surface/60'
                        }`}
                      >
                        Admin Moderation Portal
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="pt-4 border-t border-brand space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3 rounded-md bg-surface border-2 border-border text-base font-bold text-text min-h-[44px] flex items-center justify-center no-underline"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-3 rounded-md bg-brand-dark text-white border border-brand-dark text-base font-bold min-h-[44px] flex items-center justify-center no-underline shadow-flat"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </nav>
            </div>

            {/* Drawer Footer with Authenticated User Status */}
            {isAuthenticated && (
              <div className="pt-4 border-t-2 border-brand space-y-3">
                <div className="bg-surface p-3 rounded-md border border-border">
                  <p className="font-bold text-text truncate">{user.name}</p>
                  <p className="text-xs text-text-muted truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-sm bg-sand text-text font-bold text-[10px] uppercase border border-border">
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-md text-sm font-bold text-error bg-error-bg border-2 border-error hover:bg-error hover:text-white min-h-[44px] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
