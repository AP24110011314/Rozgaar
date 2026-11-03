import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  ArrowLeft,
  Compass,
  IndianRupee,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
} from 'lucide-react';
import api from '../../api/axios.js';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

export function JobFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [remote, setRemote] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('month');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [status, setStatus] = useState('open');
  const [customFields, setCustomFields] = useState([{ key: '', value: '' }]);

  const [formError, setFormError] = useState('');
  const [locating, setLocating] = useState(false);

  // Fetch job details if editing
  const { data: existingJob, isLoading: isFetching } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data?.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title || '');
      setDescription(existingJob.description || '');
      setEmploymentType(existingJob.employmentType || 'full-time');
      setRemote(Boolean(existingJob.remote));
      setCity(existingJob.location?.city || '');
      setState(existingJob.location?.state || '');
      if (existingJob.location?.geo?.coordinates) {
        setLng(String(existingJob.location.geo.coordinates[0]));
        setLat(String(existingJob.location.geo.coordinates[1]));
      }
      setSalaryMin(existingJob.salary?.min != null ? String(existingJob.salary.min) : '');
      setSalaryMax(existingJob.salary?.max != null ? String(existingJob.salary.max) : '');
      setSalaryPeriod(existingJob.salary?.period || 'month');
      setSalaryCurrency(existingJob.salary?.currency || 'INR');
      setSkills(existingJob.skills || []);
      setStatus(existingJob.status || 'open');

      if (existingJob.customFields && Object.keys(existingJob.customFields).length > 0) {
        setCustomFields(
          Object.entries(existingJob.customFields).map(([key, val]) => ({
            key,
            value: typeof val === 'object' ? JSON.stringify(val) : String(val),
          }))
        );
      }
    }
  }, [existingJob]);

  // GPS detection handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Skill management
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Custom fields management
  const handleCustomFieldChange = (index, field, val) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  // Submit mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEditing) {
        const res = await api.put(`/jobs/${id}`, payload);
        return res.data?.data;
      } else {
        const res = await api.post('/jobs', payload);
        return res.data?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      navigate('/recruiter/jobs');
    },
    onError: (err) => {
      setFormError(
        err.response?.data?.error?.message || 'Failed to save job. Please verify your inputs.'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Format customFields map
    const customFieldsMap = {};
    for (const item of customFields) {
      if (item.key.trim()) {
        customFieldsMap[item.key.trim()] = item.value.trim();
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      employmentType,
      remote,
      status,
      skills,
      customFields: customFieldsMap,
    };

    // Location
    if (city.trim() || state.trim() || (lat && lng)) {
      payload.location = {
        city: city.trim(),
        state: state.trim(),
      };
      if (lat !== '' && lng !== '') {
        payload.location.geo = {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        };
      }
    }

    // Salary
    if (salaryMin !== '' || salaryMax !== '') {
      payload.salary = {
        min: salaryMin !== '' ? Number(salaryMin) : null,
        max: salaryMax !== '' ? Number(salaryMax) : null,
        currency: salaryCurrency,
        period: salaryPeriod,
      };
    }

    saveMutation.mutate(payload);
  };

  if (isEditing && isFetching) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-surface border border-border rounded-md max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 animate-spin text-brand-dark" />
        <p className="text-sm font-semibold text-text">Loading job posting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
      {/* Top breadcrumb & strip */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md">
        <Link
          to="/recruiter/jobs"
          className="inline-flex items-center text-xs font-bold text-brand-dark hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to My Job Postings
        </Link>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text mt-1">
          {isEditing ? 'Edit Job Posting' : 'Post a New Job'}
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Reach skilled job seekers in your local area with a detailed, geo-tagged job description.
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-sm bg-error-bg border border-error text-error text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Job Details */}
        <div className="bg-surface border border-border rounded-md p-6 space-y-5 shadow-flat">
          <h2 className="text-base font-bold text-text border-b border-divider pb-3">
            Core Details
          </h2>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-text">
              Job Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Delivery Partner, Retail Store Manager, React Developer"
              className="glass-input w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="glass-input w-full capitalize cursor-pointer"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input w-full capitalize cursor-pointer"
              >
                <option value="open">Open (Accepting Applicants)</option>
                <option value="draft">Draft (Saved Privately)</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="remote-checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="h-4 w-4 text-brand-dark focus:ring-brand-dark rounded border-border cursor-pointer accent-brand-dark"
            />
            <label htmlFor="remote-checkbox" className="text-sm font-medium text-text cursor-pointer">
              This is a fully remote position
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-text">
              Job Description & Requirements <span className="text-error">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline daily responsibilities, qualifications, perks, shift details, and what makes working at your business great..."
              className="glass-input w-full"
            />
            <p className="text-xs text-text-muted">At least 10 characters.</p>
          </div>
        </div>

        {/* Location & GPS */}
        <div className="bg-surface border border-border rounded-md p-6 space-y-5 shadow-flat">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-divider pb-3">
            <div>
              <h2 className="text-base font-bold text-text">Job Location & Coordinates</h2>
              <p className="text-xs text-text-muted">
                Adding GPS coordinates powers Rozgaar's distance calculation for candidates nearby.
              </p>
            </div>
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDetectLocation}
              disabled={locating}
              className="self-start sm:self-auto"
            >
              <Compass className={`w-3.5 h-3.5 mr-1.5 text-brand ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Locating...' : 'Detect GPS'}
            </GlassButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Jaipur, Bengaluru, Pune"
                className="glass-input w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">State / Region</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Rajasthan, Karnataka, Maharashtra"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-muted uppercase">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 26.9124"
                className="glass-input w-full font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-text-muted uppercase">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. 75.7873"
                className="glass-input w-full font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="bg-surface border border-border rounded-md p-6 space-y-5 shadow-flat">
          <h2 className="text-base font-bold text-text border-b border-divider pb-3">
            Compensation (Optional)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">Minimum Pay (₹)</label>
              <input
                type="number"
                min="0"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g. 25000"
                className="glass-input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">Maximum Pay (₹)</label>
              <input
                type="number"
                min="0"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g. 40000"
                className="glass-input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-text">Payment Period</label>
              <select
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value)}
                className="glass-input w-full cursor-pointer"
              >
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
                <option value="hour">Per Hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div className="bg-surface border border-border rounded-md p-6 space-y-4 shadow-flat">
          <h2 className="text-base font-bold text-text border-b border-divider pb-3">
            Required Skills
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(e);
                }
              }}
              placeholder="e.g. Two-wheeler driving, Inventory, Customer handling"
              className="glass-input flex-1"
            />
            <GlassButton
              type="button"
              variant="secondary"
              onClick={handleAddSkill}
            >
              Add Skill
            </GlassButton>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill, index) => (
                <GlassBadge key={index} variant="indigo" size="md">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1.5 font-bold hover:underline focus:outline-none cursor-pointer"
                    aria-label={`Remove skill ${skill}`}
                  >
                    ×
                  </button>
                </GlassBadge>
              ))}
            </div>
          )}
        </div>

        {/* Flexible Custom Fields */}
        <div className="bg-surface border border-border rounded-md p-4 sm:p-6 space-y-4 shadow-flat">
          <div className="flex items-center justify-between border-b border-divider pb-3">
            <div>
              <h2 className="text-base font-bold text-text">Custom Attributes</h2>
              <p className="text-xs text-text-muted">
                Add business-specific tags like Shift Timings, Uniform Provided, Vehicle Requirements.
              </p>
            </div>
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCustomField}
              className="min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Field
            </GlassButton>
          </div>

          <div className="space-y-3">
            {customFields.map((cf, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={cf.key}
                  onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                  placeholder="Attribute name (e.g. Shift Timing)"
                  className="glass-input w-full sm:w-1/3 min-h-[44px]"
                />
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                  placeholder="Value (e.g. 9:00 AM - 6:00 PM, Mon-Sat)"
                  className="glass-input w-full sm:flex-1 min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(idx)}
                  className="self-end sm:self-auto p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-error rounded-sm hover:bg-error-bg cursor-pointer transition-colors"
                  title="Remove Attribute"
                  aria-label="Remove attribute"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-4 pt-4 border-t border-divider">
          <Link to="/recruiter/jobs" className="w-full sm:w-auto">
            <GlassButton variant="secondary" size="md" className="w-full justify-center min-h-[44px]">
              Cancel
            </GlassButton>
          </Link>
          <GlassButton
            type="submit"
            variant="primary"
            size="md"
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto justify-center min-h-[44px]"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Publish Job Listing'}
          </GlassButton>
        </div>
      </form>
    </div>
  );
}

export default JobFormPage;
