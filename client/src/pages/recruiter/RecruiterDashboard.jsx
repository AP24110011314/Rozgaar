import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { GlassButton } from '../../components/glass/GlassButton.jsx';

export function RecruiterDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8 text-left">
      {/* Header */}
      <div className="bg-sand border-b-2 border-brand p-4 sm:p-5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
            Employer Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {user?.company?.name || 'Your Company'} • Manage postings, review candidates, and invite team members.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link to="/recruiter/jobs/new" className="w-full sm:w-auto">
            <GlassButton variant="primary" className="w-full justify-center min-h-[44px]">
              <Plus className="w-4 h-4 mr-1.5" />
              Post New Job
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-surface border border-border rounded-md p-4 sm:p-6 flex items-center space-x-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center border border-border shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Jobs</p>
            <p className="text-2xl font-bold text-text mt-0.5">0</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-4 sm:p-6 flex items-center space-x-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-mint text-text flex items-center justify-center border border-border shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Candidates</p>
            <p className="text-2xl font-bold text-text mt-0.5">0</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-4 sm:p-6 flex items-center space-x-4 shadow-flat">
          <div className="w-12 h-12 rounded-sm bg-sand text-text flex items-center justify-center border border-border shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Team Members</p>
            <p className="text-2xl font-bold text-text mt-0.5">1</p>
          </div>
        </div>
      </div>

      {/* Pipeline Preview */}
      <div className="bg-surface border border-border rounded-md p-6 sm:p-8 text-center space-y-4 shadow-flat">
        <div className="w-14 h-14 rounded-sm bg-sand text-text flex items-center justify-center mx-auto border border-border">
          <Briefcase className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="text-base sm:text-lg font-bold text-text">No jobs posted yet</h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create your first job listing to start receiving local applicants and tracking them on the Kanban board.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/recruiter/jobs/new" className="inline-block w-full sm:w-auto">
            <GlassButton variant="primary" className="w-full sm:w-auto justify-center min-h-[44px]">
              Create a Job Post <ArrowRight className="w-4 h-4 ml-1.5" />
            </GlassButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
