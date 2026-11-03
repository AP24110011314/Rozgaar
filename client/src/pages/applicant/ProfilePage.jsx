import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  FileText,
  MapPin,
  Link as LinkIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Star,
  Loader2,
  ShieldAlert,
  DownloadCloud,
  Crosshair,
} from 'lucide-react';
import { api } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassCard } from '../../components/glass/GlassCard.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Local state for profile form
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [coordinates, setCoordinates] = useState([77.209, 28.6139]); // [lng, lat]
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [links, setLinks] = useState([]);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // UI state
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [uploadError, setUploadError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);

  // Fetch applicant profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['applicantProfile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data;
    },
  });

  // Populate form state when profile is fetched
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setCity(profile.location?.city || '');
      setState(profile.location?.state || '');
      if (profile.location?.geo?.coordinates?.length === 2) {
        setCoordinates(profile.location.geo.coordinates);
      }
      setSkills(profile.skills || []);
      setLinks(profile.links || []);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await api.put('/profile', updatedData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
      setFeedbackMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000);
    },
    onError: (err) => {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update profile.',
      });
    },
  });

  // Upload resume mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/profile/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
      setUploadError('');
    },
    onError: (err) => {
      setUploadError(err.response?.data?.error?.message || 'Upload failed. File must be PDF or DOCX up to 5 MB.');
    },
  });

  // Set default resume mutation
  const setDefaultResumeMutation = useMutation({
    mutationFn: async (resumeId) => {
      const res = await api.patch(`/profile/resumes/${resumeId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
    },
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (resumeId) => {
      const res = await api.delete(`/profile/resumes/${resumeId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicantProfile'] });
      setResumeToDelete(null);
    },
  });

  // Export data handler
  const handleExportData = async () => {
    try {
      const res = await api.get('/profile/export');
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rozgaar-export-${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export data. Please try again.');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile');
      await logout();
      window.location.href = '/';
    } catch {
      alert('Failed to delete account. Please try again.');
    }
  };

  // GPS auto-detection
  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates([pos.coords.longitude, pos.coords.latitude]);
          setFeedbackMessage({
            type: 'success',
            text: `Coordinates detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          });
        },
        () => {
          setFeedbackMessage({ type: 'error', text: 'Could not access device location.' });
        }
      );
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      let formattedUrl = newLinkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      setLinks([...links, { label: newLinkLabel.trim(), url: formattedUrl }]);
      setNewLinkLabel('');
      setNewLinkUrl('');
    }
  };

  const handleRemoveLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size exceeds the 5 MB limit');
        return;
      }
      uploadResumeMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      headline,
      bio,
      phone,
      location: {
        city,
        state,
        country: 'India',
        geo: {
          type: 'Point',
          coordinates,
        },
      },
      skills,
      links,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4 bg-surface border border-border rounded-md max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-sm font-medium text-text">Loading your profile...</p>
      </div>
    );
  }

  const resumes = profile?.resumes || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Page Header Strip */}
      <div className="bg-sand border-b-2 border-brand p-5 rounded-md">
        <h1 className="text-2xl font-bold text-text">Applicant Profile & Resumes</h1>
        <p className="text-xs text-text-muted mt-1">
          Manage your personal details, portfolio links, and up to 3 verified resumes.
        </p>
      </div>

      {feedbackMessage.text && (
        <div
          role="alert"
          className={`p-4 rounded-sm flex items-center space-x-3 text-sm font-medium ${
            feedbackMessage.type === 'success'
              ? 'bg-mint text-text border border-border'
              : 'bg-error-bg text-error border border-error'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-brand-dark shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 1. Profile Details Form */}
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 space-y-6 shadow-flat">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-divider">
            <div className="w-10 h-10 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Personal Information</h2>
              <p className="text-xs text-text-muted">Basic contact and headline visible to employers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-sm border border-divider bg-disabled-bg text-text-muted text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-sm border border-divider bg-disabled-bg text-text-muted text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="headline" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Professional Headline
            </label>
            <input
              id="headline"
              type="text"
              maxLength={120}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Pharmacy Assistant | Experienced Retail Cashier"
              className="glass-input w-full"
            />
            <p className="text-[11px] text-text-muted mt-1 text-right">{headline.length}/120</p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              About You (Bio)
            </label>
            <textarea
              id="bio"
              rows={3}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Summarize your work experience, background, and what you're looking for..."
              className="glass-input w-full"
            />
            <p className="text-[11px] text-text-muted mt-1 text-right">{bio.length}/1000</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="glass-input w-full"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lucknow"
                className="glass-input w-full"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                State
              </label>
              <input
                id="state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Uttar Pradesh"
                className="glass-input w-full"
              />
            </div>
          </div>

          {/* Geo Location section */}
          <div className="p-4 rounded-sm bg-sand/30 border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-text">
              <MapPin className="w-4 h-4 text-brand shrink-0" />
              <span>
                Geo Coordinates: <strong className="font-bold text-text">{coordinates[1].toFixed(4)}° N, {coordinates[0].toFixed(4)}° E</strong> (Used for radius proximity matching)
              </span>
            </div>
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDetectLocation}
              className="self-start sm:self-auto"
            >
              <Crosshair className="w-3.5 h-3.5 mr-1.5" />
              Detect GPS
            </GlassButton>
          </div>

          {/* Skills Tag Management */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Key Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill) => (
                <GlassBadge key={skill} variant="indigo" size="md">
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
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Type a skill and click Add (e.g. Inventory Management)"
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
          </div>

          {/* Links section */}
          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              Portfolio / Professional Links
            </label>
            <div className="space-y-2 mb-3">
              {links.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-sm bg-sand/20 border border-border text-sm">
                  <div className="flex items-center space-x-2 truncate">
                    <LinkIcon className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="font-bold text-text">{link.label}:</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-dark underline truncate"
                    >
                      {link.url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="text-text-muted hover:text-error p-1 cursor-pointer transition-colors"
                    aria-label="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Label (e.g. Portfolio)"
                className="glass-input sm:col-span-2"
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://mywork.com"
                className="glass-input sm:col-span-2"
              />
              <GlassButton
                type="button"
                variant="secondary"
                onClick={handleAddLink}
                className="flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </GlassButton>
            </div>
          </div>

          <div className="pt-4 border-t border-divider flex justify-end">
            <GlassButton
              type="submit"
              variant="primary"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </GlassButton>
          </div>
        </form>
      </div>

      {/* 2. Resume Management Section */}
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 space-y-6 shadow-flat">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-divider">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Resume Management</h2>
              <p className="text-xs text-text-muted">Maximum 3 resumes. Magic-byte signature verified.</p>
            </div>
          </div>
          <GlassBadge variant="indigo" size="md">
            {resumes.length} of 3 uploaded
          </GlassBadge>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-sm bg-error-bg border border-error text-error text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {resumes.length < 3 ? (
          <label className="border-2 border-dashed border-border rounded-md p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer bg-sand/10 hover:bg-sand/30 transition-all text-center">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              disabled={uploadResumeMutation.isPending}
              className="hidden"
            />
            {uploadResumeMutation.isPending ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-brand-dark animate-spin mx-auto" />
                <p className="text-sm font-semibold text-text">Verifying and uploading resume...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-text">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-text-muted">
                  PDF or DOCX (Max 5 MB) • Verified via magic byte signature
                </p>
              </div>
            )}
          </label>
        ) : (
          <div className="p-4 rounded-sm bg-sand border border-border text-xs text-text font-medium">
            You have reached the maximum of 3 resumes. Delete an existing resume to upload a new one.
          </div>
        )}

        {/* Resumes List */}
        <div className="space-y-3">
          {resumes.map((resume) => (
            <div
              key={resume._id}
              className={`p-4 rounded-sm border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                resume.isDefault
                  ? 'border-brand-dark bg-sand/30'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-sm bg-sand text-text flex items-center justify-center shrink-0 border border-border">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-text truncate">{resume.filename}</p>
                    {resume.isDefault && (
                      <GlassBadge variant="success" size="sm">
                        Default
                      </GlassBadge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {(resume.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                {!resume.isDefault && (
                  <GlassButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setDefaultResumeMutation.mutate(resume._id)}
                  >
                    <Star className="w-3.5 h-3.5 mr-1" />
                    Set Default
                  </GlassButton>
                )}

                <a
                  href={resume.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-bold text-brand-dark bg-sand hover:bg-accent border border-border transition-colors min-h-[38px]"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download
                </a>

                <button
                  type="button"
                  onClick={() => setResumeToDelete(resume)}
                  className="inline-flex items-center p-2 rounded-sm text-error hover:bg-error-bg transition-colors cursor-pointer min-h-[38px] min-w-[38px] justify-center"
                  aria-label="Delete resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Privacy, Data Export & Deletion */}
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 space-y-4 shadow-flat">
        <div className="flex items-center space-x-3 pb-3 border-b border-divider">
          <div className="w-10 h-10 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Privacy & Data Rights</h2>
            <p className="text-xs text-text-muted">Download your data or request complete account erasure.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-sm font-bold text-text">Export All My Data</p>
            <p className="text-xs text-text-muted">Download a complete machine-readable JSON archive of your Rozgaar profile, resumes, and applications.</p>
          </div>
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleExportData}
            className="w-full sm:w-auto"
          >
            <DownloadCloud className="w-4 h-4 mr-2" />
            Export JSON
          </GlassButton>
        </div>

        <div className="pt-4 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-error">Delete Account & Erase Data</p>
            <p className="text-xs text-text-muted">Permanently removes your profile and resumes, and anonymizes your application history.</p>
          </div>
          <GlassButton
            type="button"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </GlassButton>
        </div>
      </div>

      {/* Confirmation Modal: Delete Resume */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-6 space-y-4 shadow-flat">
            <h3 className="text-lg font-bold text-text">Delete Resume</h3>
            <p className="text-sm text-text-muted">
              Are you sure you want to delete <strong className="font-bold text-text">{resumeToDelete.filename}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setResumeToDelete(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="button"
                variant="danger"
                onClick={() => deleteResumeMutation.mutate(resumeToDelete._id)}
                disabled={deleteResumeMutation.isPending}
              >
                {deleteResumeMutation.isPending ? 'Deleting...' : 'Delete'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Account */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div className="bg-surface border border-error rounded-md max-w-md w-full p-6 space-y-4 shadow-flat">
            <div className="w-12 h-12 rounded-sm bg-error-bg text-error flex items-center justify-center mx-auto border border-error">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text text-center">Permanently Delete Account?</h3>
            <p className="text-sm text-text-muted text-center leading-relaxed">
              This will permanently delete your applicant profile and resume files from Rozgaar storage. Any existing job applications will be anonymized.
            </p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-divider">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="button"
                variant="danger"
                onClick={handleDeleteAccount}
              >
                Yes, Delete My Account
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
