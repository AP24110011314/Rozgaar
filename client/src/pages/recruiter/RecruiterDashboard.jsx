import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

export function RecruiterDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="bg-sand border-b-2 border-brand p-5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">
            Employer Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {user?.company?.name || 'Your Company'} • Manage postings, review candidates, and invite team members.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/recruiter/jobs/new">
            <GlassButton variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              Post New Job
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-surface border border-border rounded-md p-6 flex items-center space-x-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Jobs</p>
            <p className="text-2xl font-bold text-text mt-0.5">0</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-6 flex items-center space-x-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-mint text-text flex items-center justify-center border border-border">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Candidates</p>
            <p className="text-2xl font-bold text-text mt-0.5">0</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-6 flex items-center space-x-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center border border-border">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Team Members</p>
            <p className="text-2xl font-bold text-text mt-0.5">1</p>
          </div>
        </div>
      </div>

      {/* Pipeline Preview */}
      <div className="bg-surface border border-border rounded-md p-8 text-center space-y-4 shadow-flat">
        <div className="w-14 h-14 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
          <Briefcase className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-bold text-text">No jobs posted yet</h2>
          <p className="text-sm text-text-muted mt-1">
            Create your first job listing to start receiving local applicants and tracking them on the Kanban board.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/recruiter/jobs/new">
            <GlassButton variant="primary">
              Create a Job Post <ArrowRight className="w-4 h-4 ml-1.5" />
            </GlassButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
