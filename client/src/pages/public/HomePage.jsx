import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard, GlassButton } from '../../components/glass/index.js';

export function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (city.trim()) params.set('city', city.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-page text-text">
      {/* Official Government Portal Hero Strip: Flat Sand Band */}
      <section className="bg-sand border-b-4 border-brand py-12 sm:py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="inline-flex items-center px-3.5 py-1 rounded-sm text-xs font-bold bg-surface border border-border text-text shadow-flat">
            Rozgaar • National Hyperlocal ATS Portal
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text leading-tight">
            Local hiring that solves <span className="text-brand-dark underline decoration-brand">candidate ghosting</span>.
          </h1>

          <p className="text-base sm:text-lg font-medium text-text max-w-2xl mx-auto leading-relaxed">
            Rozgaar (रोज़गार) is a lightweight, geo-aware Applicant Tracking System built for local businesses and job seekers.
            Apply once, track progress live on an interactive timeline, and manage candidates on a smooth Kanban pipeline.
          </p>

          {/* White Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-surface border-2 border-border p-2 sm:p-3 rounded-md max-w-2xl mx-auto shadow-flat flex flex-col sm:flex-row gap-2 mt-6 text-left"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, skills (e.g. Baker, React, Nurse)"
                className="w-full pl-10 pr-4 py-2 bg-transparent text-base text-text placeholder-text-muted focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="relative sm:w-52 border-t sm:border-t-0 sm:border-l border-divider pt-2 sm:pt-0 sm:pl-2">
              <MapPin className="w-5 h-5 text-text-muted absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City (e.g. Vijayawada)"
                className="w-full pl-10 sm:pl-11 pr-4 py-2 bg-transparent text-base text-text placeholder-text-muted focus:outline-none min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              className="bg-brand-dark text-white hover:bg-brand-darker font-bold text-base px-6 py-2.5 rounded-sm shrink-0 min-h-[44px] flex items-center justify-center cursor-pointer border border-brand-dark shadow-flat focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus"
            >
              <Search className="w-4 h-4 mr-1.5 text-white" aria-hidden="true" />
              Search
            </button>
          </form>

          {/* Quick CTA Links */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/jobs"
              className="w-full sm:w-auto bg-brand-dark text-white hover:bg-brand-darker font-bold px-6 py-3 rounded-md text-base no-underline border border-brand-dark shadow-flat inline-flex items-center justify-center min-h-[44px]"
            >
              <Search className="w-4 h-4 mr-2" aria-hidden="true" />
              Explore Local Jobs
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/register"
                className="w-full sm:w-auto bg-accent text-text hover:bg-accent-hover font-bold px-6 py-3 rounded-md text-base no-underline border border-accent shadow-flat inline-flex items-center justify-center min-h-[44px]"
              >
                Hire Local Talent
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to={user?.role === 'recruiter' ? '/recruiter/jobs' : '/me/applications'}
                className="w-full sm:w-auto bg-accent text-text hover:bg-accent-hover font-bold px-6 py-3 rounded-md text-base no-underline border border-accent shadow-flat inline-flex items-center justify-center min-h-[44px]"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center w-full">
        {/* Stats Strip on White Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-surface border-2 border-border p-5 rounded-md text-center shadow-flat">
            <p className="text-3xl font-extrabold text-brand-dark">80+</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">
              Active Local Jobs
            </p>
          </div>
          <div className="bg-surface border-2 border-border p-5 rounded-md text-center shadow-flat">
            <p className="text-3xl font-extrabold text-accent">16</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">
              SMB Businesses
            </p>
          </div>
          <div className="bg-surface border-2 border-border p-5 rounded-md text-center shadow-flat">
            <p className="text-3xl font-extrabold text-brand-dark">6</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">
              Indian Cities
            </p>
          </div>
          <div className="bg-surface border-2 border-border p-5 rounded-md text-center shadow-flat">
            <p className="text-3xl font-extrabold text-mint-text">0</p>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">
              Ghosting Policy
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left max-w-6xl mx-auto">
          <GlassCard className="p-7 border-2 border-border bg-surface">
            <div className="w-12 h-12 rounded-md bg-sand text-text flex items-center justify-center mb-5 border border-border">
              <MapPin className="w-6 h-6 text-brand-dark" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">
              Geo-Aware Proximity
            </h3>
            <p className="text-sm font-medium text-text leading-relaxed">
              Search by city, coordinates, or custom radius (default 25 km) using MongoDB 2dsphere geo-indexing. No daily long-distance commutes.
            </p>
          </GlassCard>

          <GlassCard className="p-7 border-2 border-border bg-surface">
            <div className="w-12 h-12 rounded-md bg-sand text-text flex items-center justify-center mb-5 border border-border">
              <Briefcase className="w-6 h-6 text-brand-dark" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">
              Optimistic Kanban
            </h3>
            <p className="text-sm font-medium text-text leading-relaxed">
              Drag candidates across stages with fractional positioning math, candidate drawer notes, ratings, and instant fallback rollback.
            </p>
          </GlassCard>

          <GlassCard className="p-7 border-2 border-border bg-surface">
            <div className="w-12 h-12 rounded-md bg-sand text-text flex items-center justify-center mb-5 border border-border">
              <ShieldCheck className="w-6 h-6 text-brand-dark" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">
              Zero Ghosting & Privacy
            </h3>
            <p className="text-sm font-medium text-text leading-relaxed">
              Transparent live status timeline with automated stage notifications. Zero demographic profiling (no age, photo, gender, or marital status).
            </p>
          </GlassCard>
        </div>

        {/* How It Works Section: 3 Numbered Steps */}
        <section className="mt-16 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-sm text-xs font-bold bg-sand border border-border text-text mb-2">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
              How Rozgaar Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-surface border-2 border-border p-6 rounded-md shadow-flat">
              <div className="text-3xl font-black text-brand-dark mb-2">01</div>
              <h3 className="text-base font-bold text-text mb-1.5">Discover Nearby SMBs</h3>
              <p className="text-sm font-medium text-text-muted leading-relaxed">
                Filter verified openings within 25 km of your neighborhood. Search by exact skills and salary ranges.
              </p>
            </div>

            <div className="bg-surface border-2 border-border p-6 rounded-md shadow-flat">
              <div className="text-3xl font-black text-brand-dark mb-2">02</div>
              <h3 className="text-base font-bold text-text mb-1.5">1-Click Local Application</h3>
              <p className="text-sm font-medium text-text-muted leading-relaxed">
                Submit your profile and uploaded PDF resume directly to business owners without intermediary agency fees.
              </p>
            </div>

            <div className="bg-surface border-2 border-border p-6 rounded-md shadow-flat">
              <div className="text-3xl font-black text-brand-dark mb-2">03</div>
              <h3 className="text-base font-bold text-text mb-1.5">Track Live Progress</h3>
              <p className="text-sm font-medium text-text-muted leading-relaxed">
                Receive live status alerts as your application moves through reviewing, interviewing, and offer stages.
              </p>
            </div>
          </div>
        </section>

        {/* For Employers Call to Action: Flat Sand Card */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-sand border-4 border-brand p-8 sm:p-12 rounded-md shadow-flat text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-text">
              Hiring for your local business?
            </h2>
            <p className="text-base font-medium text-text max-w-xl mx-auto leading-relaxed">
              Post verified openings in minutes, manage candidate stages with our visual Kanban board, and communicate directly with candidates.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="bg-brand-dark text-white hover:bg-brand-darker font-bold px-8 py-3.5 text-base rounded-md border border-brand-dark shadow-flat no-underline inline-flex items-center min-h-[44px]"
              >
                Register as Recruiter
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
