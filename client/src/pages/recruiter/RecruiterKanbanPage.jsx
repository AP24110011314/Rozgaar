import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Briefcase,
  Users,
  Search,
  Star,
  Download,
  FileText,
  Clock,
  ArrowLeft,
  X,
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import api from '../../api/axios.js';
import { GlassButton } from '../../components/glass/GlassButton.jsx';
import { GlassBadge } from '../../components/glass/GlassBadge.jsx';

const COLUMNS = [
  { id: 'applied', title: 'Applied', topBorder: 'border-t-brand-dark', leftBorder: 'border-l-brand-dark' },
  { id: 'reviewing', title: 'Reviewing', topBorder: 'border-t-accent', leftBorder: 'border-l-accent' },
  { id: 'interviewing', title: 'Interviewing', topBorder: 'border-t-brand', leftBorder: 'border-l-brand' },
  { id: 'offered', title: 'Offered', topBorder: 'border-t-accent', leftBorder: 'border-l-accent' },
  { id: 'hired', title: 'Hired', topBorder: 'border-t-mint', leftBorder: 'border-l-mint' },
  { id: 'rejected', title: 'Rejected', topBorder: 'border-t-divider', leftBorder: 'border-l-divider' },
];

export function RecruiterKanbanPage() {
  const { id: jobId } = useParams();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Mobile Single-Column Active Stage
  const [mobileActiveStage, setMobileActiveStage] = useState('applied');

  // Candidate Drawer state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [downloadingResume, setDownloadingResume] = useState(false);

  // Message Modal state for Offer / Rejection feedback
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    applicationId: null,
    targetStage: null,
    beforeId: null,
    afterId: null,
    message: '',
  });

  // Fetch job details
  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data?.data;
    },
  });

  // Fetch all applications for this job
  const {
    data: applications,
    isLoading,
  } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}/applications`);
      return res.data?.data || [];
    },
  });

  // Stage Mutation
  const stageMutation = useMutation({
    mutationFn: async ({ applicationId, stage, message, beforeId, afterId }) => {
      const res = await api.patch(`/applications/${applicationId}/stage`, {
        stage,
        message,
        beforeId,
        afterId,
      });
      return res.data?.data;
    },
    onMutate: async ({ applicationId, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['job-applications', jobId] });
      const previousApps = queryClient.getQueryData(['job-applications', jobId]);

      if (previousApps) {
        const updated = previousApps.map((app) => {
          if (app._id === applicationId) {
            return { ...app, stage };
          }
          return app;
        });
        queryClient.setQueryData(['job-applications', jobId], updated);
      }

      return { previousApps };
    },
    onError: (err, variables, context) => {
      if (context?.previousApps) {
        queryClient.setQueryData(['job-applications', jobId], context.previousApps);
      }
      alert(err.response?.data?.error?.message || 'Failed to move candidate');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
    },
  });

  // Note Mutation
  const noteMutation = useMutation({
    mutationFn: async ({ applicationId, text }) => {
      const res = await api.post(`/applications/${applicationId}/notes`, { text });
      return res.data?.data;
    },
    onSuccess: (updatedApp) => {
      setSelectedCandidate(updatedApp);
      setNewNoteText('');
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to add internal note');
    },
  });

  // Rating Mutation
  const ratingMutation = useMutation({
    mutationFn: async ({ applicationId, rating }) => {
      const res = await api.patch(`/applications/${applicationId}/rating`, { rating });
      return res.data?.data;
    },
    onSuccess: (updatedApp) => {
      setSelectedCandidate(updatedApp);
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to update rating');
    },
  });

  // Download Resume
  const handleDownloadResume = async (applicationId) => {
    try {
      setDownloadingResume(true);
      const res = await api.get(`/applications/${applicationId}/resume-url`);
      const { downloadUrl } = res.data?.data || {};
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert(
        'Could not generate resume download URL: ' +
          (err.response?.data?.error?.message || err.message)
      );
    } finally {
      setDownloadingResume(false);
    }
  };

  // Group applications by stage with filters applied
  const columnItems = useMemo(() => {
    const map = {
      applied: [],
      reviewing: [],
      interviewing: [],
      offered: [],
      hired: [],
      rejected: [],
    };

    if (!applications) return map;

    applications.forEach((app) => {
      // 1. Text Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const candidateName = (app.applicant?.name || '').toLowerCase();
        const skills = (app.applicantProfile?.skills || []).map((s) => s.toLowerCase());
        const headline = (app.applicantProfile?.headline || '').toLowerCase();

        const matchesName = candidateName.includes(query);
        const matchesSkill = skills.some((s) => s.includes(query));
        const matchesHeadline = headline.includes(query);

        if (!matchesName && !matchesSkill && !matchesHeadline) return;
      }

      // 2. Rating Filter
      if (ratingFilter !== 'all') {
        if (ratingFilter === 'unrated') {
          if (app.rating) return;
        } else {
          if (app.rating !== Number(ratingFilter)) return;
        }
      }

      const targetCol = map[app.stage];
      if (targetCol) {
        targetCol.push(app);
      }
    });

    return map;
  }, [applications, searchTerm, ratingFilter]);

  // Drag and drop end handler (Desktop)
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const targetStage = destination.droppableId;
    const destItems = columnItems[targetStage] || [];

    const beforeId =
      destination.index > 0 ? destItems[destination.index - 1]?._id : null;
    const afterId =
      destination.index < destItems.length
        ? destItems[destination.index]?._id
        : null;

    if (targetStage === 'offered' || targetStage === 'rejected') {
      setMessageModal({
        isOpen: true,
        applicationId: draggableId,
        targetStage,
        beforeId,
        afterId,
        message: '',
      });
      return;
    }

    stageMutation.mutate({
      applicationId: draggableId,
      stage: targetStage,
      beforeId,
      afterId,
    });
  };

  // Keyboard / Accessible "Move to..." menu handler
  const handleMenuMove = (applicationId, currentStage, targetStage) => {
    if (currentStage === targetStage) return;

    if (targetStage === 'offered' || targetStage === 'rejected') {
      setMessageModal({
        isOpen: true,
        applicationId,
        targetStage,
        beforeId: null,
        afterId: null,
        message: '',
      });
      return;
    }

    stageMutation.mutate({
      applicationId,
      stage: targetStage,
    });
  };

  const handleMessageModalSubmit = (e) => {
    e.preventDefault();
    stageMutation.mutate({
      applicationId: messageModal.applicationId,
      stage: messageModal.targetStage,
      beforeId: messageModal.beforeId,
      afterId: messageModal.afterId,
      message: messageModal.message.trim(),
    });
    setMessageModal({
      isOpen: false,
      applicationId: null,
      targetStage: null,
      beforeId: null,
      afterId: null,
      message: '',
    });
  };

  const renderCandidateCardContent = (app, colBorder) => (
    <div
      onClick={() => setSelectedCandidate(app)}
      className={`p-4 rounded-sm border border-border border-l-4 ${colBorder} select-none cursor-pointer transition-all space-y-2 bg-surface hover:bg-sand/10 shadow-flat`}
    >
      {/* Card Top: Name & Move Menu */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-bold text-text truncate">
          {app.applicant?.name || 'Applicant'}
        </h2>

        {/* Accessible "Move to..." menu */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative group shrink-0"
        >
          <select
            value={app.stage}
            onChange={(e) =>
              handleMenuMove(app._id, app.stage, e.target.value)
            }
            className="text-xs font-bold text-text bg-sand/40 hover:bg-sand border border-border rounded-sm px-2 py-1.5 min-h-[38px] cursor-pointer focus:outline-none"
            title="Move candidate to column"
            aria-label={`Move ${app.applicant?.name || 'candidate'} to another stage`}
          >
            <option value="applied">Move: Applied</option>
            <option value="reviewing">Move: Reviewing</option>
            <option value="interviewing">Move: Interviewing</option>
            <option value="offered">Move: Offered</option>
            <option value="hired">Move: Hired</option>
            <option value="rejected">Move: Rejected</option>
          </select>
        </div>
      </div>

      {/* Headline or phone preview */}
      <p className="text-xs text-text-muted line-clamp-1">
        {app.applicantProfile?.headline ||
          app.applicantProfile?.location?.city ||
          app.applicant?.email}
      </p>

      {/* Skills tags */}
      {app.applicantProfile?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {app.applicantProfile.skills.slice(0, 3).map((s, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 bg-sand/40 text-text border border-border rounded-sm"
            >
              {s}
            </span>
          ))}
          {app.applicantProfile.skills.length > 3 && (
            <span className="text-[10px] text-text-muted self-center">
              +{app.applicantProfile.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Card Footer: Rating, Notes Count, Date */}
      <div className="pt-2 border-t border-divider flex items-center justify-between text-[11px] text-text-muted">
        <div className="flex items-center space-x-2">
          {app.rating ? (
            <span className="flex items-center text-text font-bold">
              <Star className="w-3.5 h-3.5 fill-accent text-accent mr-0.5" />
              {app.rating}
            </span>
          ) : (
            <span className="text-text-muted">Unrated</span>
          )}
          {app.notes?.length > 0 && (
            <span className="flex items-center text-brand-dark font-bold ml-1">
              <MessageSquare className="w-3 h-3 mr-0.5" />
              {app.notes.length}
            </span>
          )}
        </div>
        <span>{new Date(app.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100dvh-4.5rem)] flex flex-col overflow-hidden relative text-left">
      {/* Top Header / Navigation Strip */}
      <div className="bg-sand border-b-2 border-brand px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shrink-0 z-10">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <Link
            to="/recruiter/jobs"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-border text-text hover:bg-surface transition-colors shrink-0"
            title="Back to all jobs"
            aria-label="Back to all jobs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="truncate">
            <h1 className="text-base sm:text-lg font-bold text-text leading-tight truncate">
              {job?.title || 'Candidate Pipeline'}
            </h1>
            <p className="text-xs text-text-muted truncate">
              {job?.location?.city ? `${job.location.city} • ` : ''}
              {applications?.length || 0} candidate{applications?.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Search & Rating Filter Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate..."
              aria-label="Search candidates"
              className="pl-9 pr-3 py-1.5 min-h-[44px] rounded-sm border border-border text-base sm:text-xs w-full sm:w-64 bg-surface text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-dark"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            aria-label="Filter candidates by rating"
            className="px-2.5 py-1.5 min-h-[44px] rounded-sm border border-border text-xs font-bold text-text bg-surface focus:outline-none focus:ring-2 focus:ring-brand-dark cursor-pointer shrink-0"
          >
            <option value="all">All Stars</option>
            <option value="5">★ 5 Stars</option>
            <option value="4">★ 4 Stars</option>
            <option value="3">★ 3 Stars</option>
            <option value="2">★ 2 Stars</option>
            <option value="1">★ 1 Star</option>
            <option value="unrated">Unrated</option>
          </select>
        </div>
      </div>

      {/* MOBILE SINGLE-COLUMN TABBED VIEW (< 768px) */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden bg-page">
        {/* Horizontal Scroll Stage Tabs */}
        <div className="flex border-b-2 border-brand bg-sand px-3 py-2 space-x-2 overflow-x-auto scrollbar-none shrink-0 snap-x snap-mandatory">
          {COLUMNS.map((col) => {
            const count = (columnItems[col.id] || []).length;
            const isCurrent = mobileActiveStage === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setMobileActiveStage(col.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-sm text-xs font-bold whitespace-nowrap min-h-[44px] cursor-pointer snap-start transition-colors ${
                  isCurrent
                    ? 'bg-brand-dark text-white border border-brand-dark shadow-flat'
                    : 'bg-surface text-text border border-border hover:bg-sand/60'
                }`}
              >
                <span>{col.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isCurrent ? 'bg-mint text-text' : 'bg-sand text-text'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Single Column Candidate Cards Lane */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-text">
              <Loader2 className="w-7 h-7 animate-spin text-brand-dark" />
              <p className="text-xs font-semibold">Loading candidates...</p>
            </div>
          ) : (columnItems[mobileActiveStage] || []).length === 0 ? (
            <div className="p-8 text-center bg-surface border border-border rounded-md space-y-2 shadow-flat">
              <Users className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-sm font-bold text-text">No candidates in {mobileActiveStage}</p>
              <p className="text-xs text-text-muted">Use the "Move to..." dropdown on any candidate card to transfer them here.</p>
            </div>
          ) : (
            (columnItems[mobileActiveStage] || []).map((app) => {
              const col = COLUMNS.find((c) => c.id === mobileActiveStage) || COLUMNS[0];
              return (
                <div key={app._id}>
                  {renderCandidateCardContent(app, col.leftBorder)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DESKTOP MULTI-COLUMN KANBAN BOARD (>= 768px) */}
      <div className="hidden md:flex flex-1 overflow-x-auto p-4 sm:p-6 bg-page">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-3 text-text">
            <Loader2 className="w-8 h-8 animate-spin text-brand-dark" />
            <p className="text-sm font-semibold">Loading candidates board...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex space-x-4 h-full items-start min-w-[1240px]">
              {COLUMNS.map((col) => {
                const items = columnItems[col.id] || [];
                return (
                  <div
                    key={col.id}
                    className={`w-80 bg-surface rounded-md flex flex-col max-h-full shrink-0 border border-border border-t-4 ${col.topBorder} shadow-flat`}
                  >
                    {/* Column Header */}
                    <div className="bg-sand p-3 flex items-center justify-between border-b border-border rounded-t-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-text">
                        {col.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-sm bg-mint border border-border text-text font-bold text-xs">
                        {items.length}
                      </span>
                    </div>

                    {/* Droppable Card Lane */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto p-2 space-y-2.5 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-sand/30' : ''
                          }`}
                        >
                          {items.map((app, index) => (
                            <Draggable
                              key={app._id}
                              draggableId={app._id}
                              index={index}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={dragSnapshot.isDragging ? 'opacity-70' : ''}
                                >
                                  {renderCandidateCardContent(app, col.leftBorder)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Candidate Slide-over Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-overlay flex justify-end">
          <div className="w-full sm:max-w-lg bg-surface h-full shadow-flat flex flex-col justify-between overflow-y-auto border-l-2 border-border text-left">
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-divider flex items-start justify-between bg-sand">
              <div>
                <GlassBadge variant="indigo" size="md">
                  Stage: {selectedCandidate.stage}
                </GlassBadge>
                <h2 className="text-lg sm:text-xl font-bold text-text mt-2">
                  {selectedCandidate.applicant?.name}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Applied for {job?.title} on{' '}
                  {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm text-text hover:bg-surface cursor-pointer"
                aria-label="Close candidate drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1">
              {/* Contact Information */}
              <div className="bg-sand/20 p-4 rounded-sm border border-border space-y-2 text-xs text-text">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span className="font-bold text-text truncate">
                    {selectedCandidate.applicant?.email}
                  </span>
                </div>
                {selectedCandidate.applicantProfile?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>{selectedCandidate.applicantProfile.phone}</span>
                  </div>
                )}
                {selectedCandidate.applicantProfile?.location?.city && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span>
                      {selectedCandidate.applicantProfile.location.city},{' '}
                      {selectedCandidate.applicantProfile.location.state}
                    </span>
                  </div>
                )}
              </div>

              {/* Rating Component */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Internal Rating (1 to 5)
                </span>
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        ratingMutation.mutate({
                          applicationId: selectedCandidate._id,
                          rating: star,
                        })
                      }
                      className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-border hover:text-accent transition-colors focus:outline-none cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          selectedCandidate.rating >= star
                            ? 'text-accent fill-accent'
                            : 'text-border'
                        }`}
                      />
                    </button>
                  ))}
                  {selectedCandidate.rating && (
                    <span className="text-xs font-bold text-text ml-2">
                      {selectedCandidate.rating} / 5
                    </span>
                  )}
                </div>
              </div>

              {/* Resume Download */}
              <div className="p-4 rounded-sm bg-sand/20 border border-border flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 truncate">
                  <FileText className="w-7 h-7 text-brand-dark shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-text truncate">
                      {selectedCandidate.resume?.filename}
                    </p>
                    <p className="text-[10px] text-text-muted">Verified snapshot at apply time</p>
                  </div>
                </div>

                <GlassButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadResume(selectedCandidate._id)}
                  disabled={downloadingResume}
                  className="shrink-0 min-h-[44px]"
                >
                  {downloadingResume ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1" />
                  )}
                  Resume
                </GlassButton>
              </div>

              {/* Cover Note */}
              {selectedCandidate.coverNote && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    Applicant Cover Note
                  </span>
                  <div className="p-3.5 rounded-sm bg-sand/20 border border-border text-xs text-text leading-relaxed italic whitespace-pre-line">
                    "{selectedCandidate.coverNote}"
                  </div>
                </div>
              )}

              {/* Internal Recruiter Notes */}
              <div className="space-y-3 pt-2 border-t border-divider">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text uppercase tracking-wider">
                    Internal Notes ({selectedCandidate.notes?.length || 0})
                  </span>
                  <span className="text-[10px] text-text-muted">Recruiters only</span>
                </div>

                {/* List existing notes */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(selectedCandidate.notes || []).map((note, idx) => (
                    <div key={idx} className="p-3 rounded-sm bg-sand/20 border border-border text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span className="font-bold text-text">
                          {note.author?.name || 'Recruiter'}
                        </span>
                        <span>{new Date(note.at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-text">{note.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add new note */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newNoteText.trim()) {
                          noteMutation.mutate({
                            applicationId: selectedCandidate._id,
                            text: newNoteText.trim(),
                          });
                        }
                      }
                    }}
                    placeholder="Add an internal note..."
                    className="glass-input flex-1 text-base min-h-[44px]"
                  />
                  <GlassButton
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={noteMutation.isPending || !newNoteText.trim()}
                    onClick={() =>
                      noteMutation.mutate({
                        applicationId: selectedCandidate._id,
                        text: newNoteText.trim(),
                      })
                    }
                    className="min-h-[44px]"
                  >
                    Add
                  </GlassButton>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-divider flex items-center justify-between bg-sand">
              <span className="text-xs text-text-muted font-bold">
                Rozgaar ATS • Pipeline
              </span>
              <GlassButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCandidate(null)}
                className="min-h-[44px]"
              >
                Close Drawer
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Stage Message Modal (Offered / Rejected) */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-md max-w-md w-full p-5 sm:p-6 shadow-flat space-y-4 text-left">
            <div>
              <h2 className="text-lg font-bold text-text">
                {messageModal.targetStage === 'offered'
                  ? 'Extend Job Offer'
                  : 'Update to Rejected'}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {messageModal.targetStage === 'offered'
                  ? 'Include salary or start-date notes for the candidate.'
                  : 'Add an optional constructive feedback message to help the candidate.'}
              </p>
            </div>

            <form onSubmit={handleMessageModalSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-text">
                  Message for Candidate (Optional)
                </label>
                <textarea
                  rows={4}
                  value={messageModal.message}
                  onChange={(e) =>
                    setMessageModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder={
                    messageModal.targetStage === 'offered'
                      ? 'e.g. We are thrilled to offer you the position with a starting date of Monday...'
                      : 'e.g. Thank you for taking the time to speak with us. While your skills in...'
                  }
                  className="glass-input w-full text-base min-h-[44px]"
                />
                <p className="text-[10px] text-text-muted">
                  This message is saved in the applicant's status timeline and sent via email.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setMessageModal({
                      isOpen: false,
                      applicationId: null,
                      targetStage: null,
                      beforeId: null,
                      afterId: null,
                      message: '',
                    })
                  }
                  className="min-h-[44px]"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={stageMutation.isPending}
                  className="min-h-[44px]"
                >
                  {stageMutation.isPending ? 'Updating...' : 'Confirm Stage Move'}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterKanbanPage;
