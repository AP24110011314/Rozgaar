import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  Shield,
} from 'lucide-react';
import { api } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

export function CompanyProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const companyId = user?.company?._id || user?.company;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [coordinates, setCoordinates] = useState([77.209, 28.6139]);

  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');

  // Fetch company
  const { data: company, isLoading } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: async () => {
      const res = await api.get(`/companies/${companyId}`);
      return res.data.data;
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setDescription(company.description || '');
      setWebsite(company.website || '');
      setCity(company.location?.city || '');
      setState(company.location?.state || '');
      if (company.location?.geo?.coordinates?.length === 2) {
        setCoordinates(company.location.geo.coordinates);
      }
    }
  }, [company]);

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await api.put(`/companies/${companyId}`, updatedData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      setFeedback({ type: 'success', message: 'Company profile updated successfully!' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to update company.',
      });
    },
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/companies/${companyId}/members`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      setShowInviteModal(false);
      setInviteEmail('');
      setFeedback({ type: 'success', message: 'Team member added to company!' });
    },
    onError: (err) => {
      setInviteError(err.response?.data?.error?.message || 'Failed to invite team member');
    },
  });

  const handleSaveCompany = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      description,
      website: website || '',
      location: {
        city,
        state,
        geo: {
          type: 'Point',
          coordinates,
        },
      },
    });
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setInviteError('');
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3 bg-surface border border-border rounded-md max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-sm font-semibold text-text">Loading company details...</p>
      </div>
    );
  }

  const members = company?.members || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header Strip */}
      <div className="bg-sand border-b-2 border-brand p-5 rounded-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-text">Company Profile & Team</h1>
        <p className="text-xs text-text-muted mt-1">
          Manage your organization's public branding, contact info, and team permissions.
        </p>
      </div>

      {feedback.message && (
        <div
          role="alert"
          className={`p-4 rounded-sm flex items-center space-x-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-mint text-text border border-border'
              : 'bg-error-bg text-error border border-error'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-brand-dark shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Company Profile Form */}
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 space-y-6 shadow-flat">
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-divider">
            <div className="w-10 h-10 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Company Details</h2>
              <p className="text-xs text-text-muted">Public profile shown to candidates on job listings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunrise Diagnostics"
                className="glass-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                Company Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://sunrisediag.in"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
              About Company (Description)
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell candidates about your business, values, and work culture..."
              className="glass-input w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="glass-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Delhi"
                className="glass-input w-full"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-divider flex justify-end">
            <GlassButton
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Company Details'}
            </GlassButton>
          </div>
        </form>
      </div>

      {/* 2. Team Members Section */}
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 space-y-6 shadow-flat">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-divider">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Team Members</h2>
              <p className="text-xs text-text-muted">Members of your team share the same job listings and Kanban pipeline.</p>
            </div>
          </div>
          <GlassButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 mr-1.5 text-brand" />
            Invite Member
          </GlassButton>
        </div>

        <div className="divide-y divide-divider">
          {members.map((member, idx) => (
            <div key={idx} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-sand text-text font-bold text-xs flex items-center justify-center uppercase border border-border">
                  {member.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-bold text-text">{member.user?.name || 'Team Member'}</p>
                  <p className="text-xs text-text-muted">{member.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <GlassBadge
                  variant={member.role === 'owner' ? 'saffron' : 'neutral'}
                  size="sm"
                  className="capitalize"
                >
                  {member.role === 'owner' ? (
                    <Crown className="w-3 h-3 mr-1 text-text" />
                  ) : (
                    <Shield className="w-3 h-3 mr-1 text-text" />
                  )}
                  {member.role}
                </GlassBadge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-6 space-y-4 shadow-flat">
            <h3 className="text-lg font-bold text-text">Invite Team Member</h3>
            <p className="text-xs text-text-muted">
              Enter the email of an existing Rozgaar user to grant them access to this company.
            </p>

            {inviteError && (
              <div className="p-3 rounded-sm bg-error-bg border border-error text-xs text-error">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="glass-input w-full cursor-pointer"
                >
                  <option value="member">Member (Can manage jobs & candidates)</option>
                  <option value="owner">Owner (Full admin rights)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? 'Inviting...' : 'Add Member'}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyProfilePage;
