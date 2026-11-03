import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  IndianRupee,
  Bookmark,
  BookmarkCheck,
  Filter,
  Crosshair,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';
import { api } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  GlassBadge,
} from '../../components/glass/index.js';

export function JobsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Filter state
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [remote, setRemote] = useState(searchParams.get('remote') === 'true');
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') || '');
  const [radiusKm, setRadiusKm] = useState(Number(searchParams.get('radiusKm')) || 25);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [coords, setCoords] = useState(null);

  // Mobile Bottom Sheet state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch applicant profile to check saved jobs
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

  // Fetch jobs
  const { data: searchResult, isLoading, refetch } = useQuery({
    queryKey: [
      'jobsList',
      q,
      city,
      type,
      remote,
      minSalary,
      radiusKm,
      sort,
      coords?.lat,
      coords?.lng,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      if (type) params.set('type', type);
      if (remote) params.set('remote', 'true');
      if (minSalary) params.set('minSalary', minSalary);
      if (sort) params.set('sort', sort);
      if (coords) {
        params.set('lat', coords.lat.toString());
        params.set('lng', coords.lng.toString());
        params.set('radiusKm', radiusKm.toString());
      }
      const res = await api.get(`/jobs?${params.toString()}`);
      return res.data;
    },
  });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (jobId) => {
      const isSaved = savedJobIds.includes(jobId);
      if (isSaved) {
        await api.delete(`/jobs/${jobId}/save`);
      } else {
        await api.post(`/jobs/${jobId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    if (type) params.set('type', type);
    if (remote) params.set('remote', 'true');
    if (minSalary) params.set('minSalary', minSalary);
    if (radiusKm) params.set('radiusKm', radiusKm.toString());
    if (sort) params.set('sort', sort);
    setSearchParams(params);
    refetch();
  };

  const handleUseGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setCity('');
          setSort('distance');
        },
        () => {
          alert('Could not access GPS location. Please ensure location services are enabled.');
        }
      );
    }
  };

  const handleClearLocation = () => {
    setCoords(null);
    setCity('');
    setSort('newest');
  };

  const jobs = searchResult?.data || [];
  const meta = searchResult?.meta || { total: 0 };

  const activeFiltersCount = (type ? 1 : 0) + (remote ? 1 : 0) + (minSalary ? 1 : 0) + (coords ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-left">
      {/* Title Strip */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md">
        <h1 className="text-xl sm:text-2xl font-bold text-text">Find Verified Local Jobs</h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Government-standard transparent hiring portal with distance radius and anti-ghosting guarantees.
        </p>
      </div>

      {/* Top Search Filter Panel */}
      <div className="bg-surface border border-border rounded-md p-4 sm:p-5 shadow-flat">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Keyword Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job title, keywords, or skills..."
                className="glass-input w-full pl-11 text-base min-h-[44px]"
              />
            </div>

            {/* City or GPS Input */}
            <div className="md:col-span-4 relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (coords) setCoords(null);
                }}
                placeholder={
                  coords
                    ? `GPS: ${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°`
                    : 'City or local area...'
                }
                className="glass-input w-full pl-11 pr-20 text-base min-h-[44px]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {coords ? (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="px-2 py-1 text-xs font-bold text-error hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUseGps}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-text bg-sand hover:bg-accent border border-border rounded-sm transition-colors cursor-pointer min-h-[32px]"
                    title="Use GPS Coordinates"
                  >
                    <Crosshair className="w-3.5 h-3.5 mr-1" />
                    GPS
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filter Sheet Trigger & Search Button */}
            <div className="md:col-span-3 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden flex-1 glass-btn-secondary text-sm font-bold flex items-center justify-center min-h-[44px] cursor-pointer"
                aria-label="Open filter options"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-brand-dark text-white rounded-full text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                type="submit"
                className="flex-1 md:flex-none md:w-full glass-btn-primary text-sm font-bold flex items-center justify-center min-h-[44px]"
              >
                Search
              </button>
            </div>
          </div>

          {/* Desktop Inline Filters Row */}
          <div className="hidden md:flex pt-3 border-t border-divider flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="glass-input text-xs py-1.5 px-3 min-h-[44px] cursor-pointer"
              >
                <option value="">All Employment Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>

              <label className="inline-flex items-center px-3 py-1.5 rounded-sm bg-sand/30 border border-border text-text font-medium cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(e) => setRemote(e.target.checked)}
                  className="rounded text-brand-dark mr-2 accent-brand-dark w-4 h-4"
                />
                Remote Only
              </label>

              {coords && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm bg-mint border border-border text-text font-medium min-h-[44px]">
                  <span>Radius:</span>
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="bg-transparent font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-text-muted">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="glass-input text-xs py-1.5 px-3 min-h-[44px] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                {coords && <option value="distance">Closest First</option>}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-text px-1">
        <p>
          Showing <strong className="text-text font-bold">{meta.total}</strong>{' '}
          {meta.total === 1 ? 'job opening' : 'job openings'}
          {coords && ` within ${radiusKm} km of your GPS location`}
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 space-y-3 bg-surface border border-border rounded-md">
          <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
          <p className="text-sm font-semibold text-text">
            Searching verified local jobs...
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-surface border border-border rounded-md p-8 sm:p-12 text-center space-y-4 shadow-flat">
          <div className="w-12 h-12 rounded-md bg-sand text-text flex items-center justify-center mx-auto border border-border">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-text">
              No jobs match your criteria
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Try broadening your keyword, expanding your search radius, or clearing employment filters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQ('');
              setCity('');
              setCoords(null);
              setType('');
              setRemote(false);
              refetch();
            }}
            className="glass-btn-secondary text-sm px-5 py-2.5 min-h-[44px]"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isSaved = savedJobIds.includes(job._id);

            return (
              <div
                key={job._id}
                className="bg-surface border border-border rounded-md p-4 sm:p-6 hover:border-brand-dark transition-all shadow-flat"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-text hover:text-brand-dark transition-colors">
                        <Link to={`/jobs/${job._id}`} className="underline">
                          {job.title}
                        </Link>
                      </h2>
                      {job.remote && (
                        <GlassBadge variant="indigo">Remote</GlassBadge>
                      )}
                      <GlassBadge variant="neutral" className="capitalize">
                        {job.employmentType}
                      </GlassBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-text font-medium">
                      <span className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1 text-text-muted shrink-0" />
                        {job.company?.name || 'Local Company'}
                      </span>

                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-text-muted shrink-0" />
                        {job.location?.city
                          ? `${job.location.city}, ${job.location.state}`
                          : 'Local'}
                        {typeof job.distanceMeters === 'number' && (
                          <strong className="ml-1 text-brand-dark font-bold">
                            ({(job.distanceMeters / 1000).toFixed(1)} km away)
                          </strong>
                        )}
                      </span>

                      {job.salary?.min && (
                        <span className="flex items-center text-text font-bold">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                          {job.salary.min.toLocaleString('en-IN')}
                          {job.salary.max
                            ? ` - ₹${job.salary.max.toLocaleString('en-IN')}`
                            : '+'} /{job.salary.period}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed pt-1">
                      {job.description}
                    </p>

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-sand/40 text-text border border-border"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-divider">
                    {isAuthenticated && user?.role === 'applicant' && (
                      <button
                        type="button"
                        onClick={() => toggleBookmarkMutation.mutate(job._id)}
                        className={`p-2.5 rounded-md border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                          isSaved
                            ? 'border-brand-dark bg-sand text-text font-bold'
                            : 'border-border bg-surface text-text-muted hover:text-text hover:bg-sand/30'
                        }`}
                        title={isSaved ? 'Remove from saved' : 'Save job'}
                        aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-5 h-5 text-brand-dark" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    <Link
                      to={`/jobs/${job._id}`}
                      className="glass-btn-primary text-xs px-4 py-2 min-h-[44px] flex-1 sm:flex-none text-center"
                    >
                      View & Apply <ArrowRight className="w-3.5 h-3.5 ml-1.5 inline" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Bottom Sheet Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-overlay"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="mobile-bottom-sheet p-5 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b-2 border-brand">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-dark" />
                <h3 className="text-base font-bold text-text">Search Filters</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 rounded-sm bg-sand/30 border border-border text-text min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Employment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="glass-input w-full"
              >
                <option value="">All Employment Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            {/* Remote Checkbox */}
            <div className="pt-1">
              <label className="flex items-center space-x-2.5 p-3 rounded-md bg-sand/30 border border-border cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(e) => setRemote(e.target.checked)}
                  className="rounded text-brand-dark accent-brand-dark w-5 h-5"
                />
                <span className="text-sm font-bold text-text">Remote Positions Only</span>
              </label>
            </div>

            {/* Distance Radius (GPS) */}
            {coords && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text uppercase tracking-wider">GPS Search Radius</label>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="glass-input w-full"
                >
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                  <option value={25}>Within 25 km</option>
                  <option value={50}>Within 50 km</option>
                  <option value={100}>Within 100 km</option>
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider">Sort Results</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="glass-input w-full"
              >
                <option value="newest">Newest First</option>
                {coords && <option value="distance">Closest to GPS Location</option>}
              </select>
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-divider flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setType('');
                  setRemote(false);
                  setSort('newest');
                }}
                className="glass-btn-outline flex-1 text-sm py-2.5"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileFilterOpen(false);
                  refetch();
                }}
                className="glass-btn-primary flex-1 text-sm py-2.5"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobsListPage;
