import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassBadge } from '../../components/glass/index.js';

export function ApplyPage() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch job details
  const {
    data: job,
    isLoading: jobLoading,
    isError: jobError,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data?.data;
    },
  });

  // Fetch applicant's profile to retrieve saved resumes
  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data?.data;
    },
    enabled: isAuthenticated && user?.role === 'applicant',
  });

  const resumes = profile?.resumes || [];

  // Auto-select default resume
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];
      setSelectedResumeId(defaultResume._id);
    }
  }, [resumes, selectedResumeId]);

  // Upload new resume handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 5 MB');
      return;
    }

    setUploadingResume(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/profile/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      const newResumes = res.data?.data || [];
      const uploaded = newResumes[newResumes.length - 1];
      if (uploaded) {
        setSelectedResumeId(uploaded._id);
      }
    } catch (err) {
      setUploadError(err.response?.data?.error?.message || 'Failed to upload resume file.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Submit application mutation
  const applyMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/jobs/${jobId}/applications`, payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      navigate(`/me/applications/${data._id}`);
    },
    onError: (err) => {
      if (err.response?.status === 409) {
        setApplyError('You have already submitted an application for this position.');
      } else {
        setApplyError(
          err.response?.data?.error?.message || 'Failed to submit application. Please check your inputs.'
        );
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setApplyError('');

    if (!selectedResumeId) {
      setApplyError('Please select or upload a resume to attach to your application.');
      return;
    }

    if (!consentGiven) {
      setApplyError('Please confirm your consent to share your application details.');
      return;
    }

    applyMutation.mutate({
      resumeId: selectedResumeId,
      coverNote: coverNote.trim(),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-surface border border-border rounded-md p-8 space-y-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text">Sign in to Apply</h2>
          <p className="text-sm text-text-muted">
            Create a free applicant account or log in to submit your verified profile directly to local employers.
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <Link to="/login" className="glass-btn-secondary text-sm px-5 py-2.5">
              Log in
            </Link>
            <Link to="/register" className="glass-btn-primary text-sm px-5 py-2.5">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (jobLoading || profileLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3 bg-surface border border-border rounded-md max-w-3xl mx-auto my-8">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-sm font-semibold text-text">Loading application details...</p>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="bg-surface border border-border rounded-md p-8 space-y-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-error-bg text-error flex items-center justify-center mx-auto border border-error">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text">Job Unavailable</h2>
          <p className="text-sm text-text-muted">
            This job listing is no longer accepting new applications.
          </p>
          <Link to="/jobs" className="glass-btn-secondary text-sm px-4 py-2">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6 text-left">
      {/* Back Link & Title Band */}
      <div className="bg-sand border-b-2 border-brand p-3.5 sm:p-4 rounded-md flex items-center justify-between">
        <Link
          to={`/jobs/${jobId}`}
          className="inline-flex items-center text-xs font-bold text-brand-dark hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to job listing
        </Link>
        <span className="text-xs text-text-muted">Official Application Form</span>
      </div>

      {/* Main Form Card */}
      <div className="bg-surface border border-border rounded-md p-4 sm:p-6 md:p-8 space-y-6 shadow-flat">
        {/* Header */}
        <div className="border-b border-divider pb-4 sm:pb-6 space-y-2">
          <GlassBadge variant="saffron">Application Submission</GlassBadge>
          <h1 className="text-xl sm:text-2xl font-bold text-text">{job.title}</h1>
          <p className="text-xs sm:text-sm font-medium text-text-muted flex items-center">
            <Building2 className="w-4 h-4 mr-1.5 text-brand shrink-0" />
            {job.company?.name} • {job.location?.city}, {job.location?.state}
          </p>
        </div>

        {applyError && (
          <div className="p-4 rounded-sm bg-error-bg border border-error text-xs font-semibold text-error flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{applyError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-text">
                Select Resume <span className="text-error">*</span>
              </label>
              <label className="text-xs font-bold text-brand-dark hover:underline cursor-pointer flex items-center">
                <Upload className="w-3.5 h-3.5 mr-1" />
                Upload New (PDF/DOCX)
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingResume}
                />
              </label>
            </div>

            {uploadError && (
              <p className="text-xs text-error font-medium">{uploadError}</p>
            )}

            {uploadingResume && (
              <div className="flex items-center space-x-2 p-3 rounded-sm bg-sand/30 border border-border text-xs text-text">
                <Loader2 className="w-4 h-4 text-brand-dark animate-spin" />
                <span>Uploading resume securely to storage...</span>
              </div>
            )}

            {resumes.length === 0 ? (
              <div className="p-6 rounded-sm border-2 border-dashed border-border bg-sand/10 text-center space-y-2">
                <FileText className="w-8 h-8 text-brand mx-auto" />
                <p className="text-xs font-medium text-text">
                  No resume on file. Please upload a PDF or DOCX file (max 5 MB).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((r) => (
                  <label
                    key={r._id}
                    className={`flex items-center justify-between p-3.5 rounded-sm border cursor-pointer transition-all ${
                      selectedResumeId === r._id
                        ? 'border-brand-dark bg-sand/40 font-bold'
                        : 'border-border bg-surface hover:bg-sand/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="selectedResume"
                        value={r._id}
                        checked={selectedResumeId === r._id}
                        onChange={() => setSelectedResumeId(r._id)}
                        className="text-brand-dark accent-brand-dark"
                      />
                      <div>
                        <p className="text-sm font-bold text-text">{r.filename}</p>
                        <p className="text-xs text-text-muted">
                          Uploaded {new Date(r.uploadedAt).toLocaleDateString()} • {(r.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    {r.isDefault && (
                      <GlassBadge variant="neutral" className="text-[10px]">
                        Default
                      </GlassBadge>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Cover Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text">
              Cover Note (Optional)
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              placeholder="Briefly introduce yourself and share why you are a great match for this local role..."
              className="glass-input w-full"
            />
            <p className="text-[10px] text-text-muted text-right">{coverNote.length} / 2000 characters</p>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="p-4 rounded-sm bg-sand/30 border border-border space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 rounded text-brand-dark accent-brand-dark shrink-0"
              />
              <span className="text-xs text-text leading-relaxed font-medium">
                I consent to sharing my profile, contact details, and attached resume with{' '}
                <strong className="text-text font-bold">{job.company?.name}</strong> for employment review.
                Under Rozgaar's anti-ghosting policy, recruiters must provide status updates.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-3">
            <Link to={`/jobs/${jobId}`} className="glass-btn-secondary text-sm px-5 py-2.5 min-h-[44px] flex items-center justify-center w-full sm:w-auto">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={applyMutation.isPending || !selectedResumeId || !consentGiven}
              className="glass-btn-primary text-sm px-6 py-2.5 min-h-[44px] flex items-center justify-center w-full sm:w-auto"
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyPage;
