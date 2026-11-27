import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FolderKanban,
  LogOut,
  MessageSquare,
  PlayCircle,
  Plus,
  RotateCcw,
  Send,
  Star,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STATUS_CUSTOMER_DETAILS } from '../../data/defaultCatalog';
import {
  customerAddProjectInfo,
  customerCancelProject,
  customerRequestRevision,
  formatStudioDate,
  formatStudioDateTime,
  getUserPrivateInfo,
  sendProjectMessage,
  subscribeCustomerProjects,
  subscribeCustomerReviews,
  subscribeProjectHistory,
  subscribeProjectMessages,
  updateUserProfileData,
} from '../../services/studioService';
import { ProtectedMedia } from '../../components/common/ProtectedMedia';
import { FileDropzone } from '../../components/common/FileDropzone';
import {
  CustomerReview,
  EditingProject,
  ProjectHistoryEntry,
  ProjectMessage,
  ProjectStatus,
} from '../../types/studio';

const WORKFLOW_STAGES: ProjectStatus[] = [
  'Request Submitted',
  'Reviewing',
  'Accepted',
  'Editing in Progress',
  'Ready for Review',
  'Completed',
];

function getWorkflowStageIndex(status: ProjectStatus): number {
  const direct = WORKFLOW_STAGES.indexOf(status);
  if (direct >= 0) return direct;
  if (status === 'Waiting for Customer Information') return 1;
  if (status === 'Revision Requested') return 3;
  return -1;
}

export const CustomerDashboardPage: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<EditingProject[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'revisions' | 'reviews' | 'profile'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(searchParams.get('project') || '');
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [extraFiles, setExtraFiles] = useState<string[]>([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Profile form state
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profStyle, setProfStyle] = useState('');
  const [profBio, setProfBio] = useState('');
  const [profSaved, setProfSaved] = useState(false);

  useEffect(() => {
    const paramProj = searchParams.get('project');
    if (paramProj) setSelectedProjectId(paramProj);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    const unsubProj = subscribeCustomerProjects(user.uid, (list) => {
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    });
    const unsubRev = subscribeCustomerReviews(user.uid, setReviews);
    getUserPrivateInfo(user.uid).then((priv) => {
      setProfName(profile?.displayName || user.displayName || '');
      setProfPhone(priv?.phone || '');
      setProfStyle(priv?.preferredStyle || '');
      setProfBio(priv?.bio || '');
    });
    return () => {
      unsubProj();
      unsubRev();
    };
  }, [user, profile]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) {
      setHistory([]);
      setMessages([]);
      return;
    }
    setExtraNotes(selectedProject.notes || '');
    setExtraFiles(selectedProject.attachmentUrls || []);
    const unsubHist = subscribeProjectHistory(selectedProject.id, setHistory);
    const unsubMsg = subscribeProjectMessages(selectedProject.id, setMessages);
    return () => {
      unsubHist();
      unsubMsg();
    };
  }, [selectedProject?.id]);

  const filteredProjects = useMemo(() => {
    if (activeTab === 'active') {
      return projects.filter((p) => !['Completed', 'Rejected', 'Cancelled'].includes(p.status));
    }
    if (activeTab === 'completed') {
      return projects.filter((p) => p.status === 'Completed');
    }
    if (activeTab === 'revisions') {
      return projects.filter((p) => p.status === 'Revision Requested' || p.revisionCount > 0);
    }
    return projects;
  }, [projects, activeTab]);

  const stats = useMemo(() => {
    const activeCount = projects.filter(
      (p) => !['Completed', 'Rejected', 'Cancelled'].includes(p.status)
    ).length;
    const completedCount = projects.filter((p) => p.status === 'Completed').length;
    const revisionCount = projects.reduce((sum, p) => sum + (p.revisionCount || 0), 0);
    return {
      total: projects.length,
      active: activeCount,
      completed: completedCount,
      revisions: revisionCount,
    };
  }, [projects]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject || !messageInput.trim()) return;
    setActionError('');
    try {
      await sendProjectMessage({
        projectId: selectedProject.id,
        projectCode: selectedProject.projectCode,
        customerId: selectedProject.customerId,
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || 'Client',
        senderRole: 'customer',
        body: messageInput.trim(),
      });
      setMessageInput('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  const handleRevisionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setActionError('');
    setActionSuccess('');
    try {
      await customerRequestRevision(selectedProject, revisionNote);
      setRevisionNote('');
      setActionSuccess('Revision request submitted to Sri Editing Studio.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to request revision.');
    }
  };

  const handleCancel = async () => {
    if (!selectedProject) return;
    setActionError('');
    setActionSuccess('');
    try {
      await customerCancelProject(selectedProject);
      setActionSuccess('Project cancelled.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cannot cancel this project.');
    }
  };

  const handleAddInfo = async () => {
    if (!selectedProject) return;
    setActionError('');
    setActionSuccess('');
    try {
      await customerAddProjectInfo(selectedProject, {
        notes: extraNotes,
        attachmentUrls: extraFiles,
        referenceLinks: selectedProject.referenceLinks || [],
      });
      setActionSuccess('Project notes and files updated.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update project.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfSaved(false);
    await updateUserProfileData(user.uid, {
      displayName: profName,
      phone: profPhone,
      preferredStyle: profStyle,
      bio: profBio,
      email: user.email || '',
    });
    setProfSaved(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <p className="text-xs font-medium text-[#D4AF37]">Customer Studio Workspace</p>
          <h1 className="text-3xl font-display font-semibold text-white">
            Welcome, {profile?.displayName || user?.displayName || 'Creator'}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/request-edit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Edit Request
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats.total, icon: FolderKanban },
          { label: 'Active Edits', value: stats.active, icon: Clock },
          { label: 'Completed Projects', value: stats.completed, icon: CheckCircle2 },
          { label: 'Revisions Requested', value: stats.revisions, icon: RotateCcw },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-[#101014] border border-zinc-800 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">{kpi.label}</p>
              <p className="mt-1 text-2xl font-mono-tabular font-semibold text-white">{kpi.value}</p>
            </div>
            <kpi.icon className="w-5 h-5 text-[#D4AF37]" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-3">
        {[
          { id: 'all', label: 'My Projects' },
          { id: 'active', label: 'Current Projects' },
          { id: 'completed', label: 'Completed' },
          { id: 'revisions', label: 'Revisions' },
          { id: 'reviews', label: 'Review History' },
          { id: 'profile', label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#D4AF37] text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reviews' ? (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center space-y-2">
              <p className="text-sm font-medium text-white">You have not submitted any reviews yet.</p>
              <p className="text-xs text-zinc-400">
                Once a project reaches Completed status, you can leave a verified review with photos.
              </p>
              <Link to="/reviews" className="inline-block mt-2 text-xs text-[#D4AF37] hover:underline">
                Go to Reviews Page →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-xl bg-[#101014] border border-zinc-800 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#D4AF37] font-medium">{rev.category}</span>
                    <span className="capitalize text-zinc-400">Status: {rev.moderationStatus}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= rev.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-300">{rev.reviewText}</p>
                  {rev.adminReply && (
                    <p className="text-xs text-zinc-400 border-t border-zinc-800 pt-2">
                      Studio reply: {rev.adminReply}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'profile' ? (
        <form
          onSubmit={(e) => void handleSaveProfile(e)}
          className="max-w-xl rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-white">
            <UserIcon className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-lg font-display font-semibold">Studio Profile</h2>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email (Auth Identity)</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Phone / WhatsApp</label>
            <input
              type="tel"
              value={profPhone}
              onChange={(e) => setProfPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Preferred Editing Style</label>
            <input
              type="text"
              value={profStyle}
              onChange={(e) => setProfStyle(e.target.value)}
              placeholder="e.g., Warm filmic wedding tones, clean minimal reels"
              className="w-full px-3.5 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Creator / Brand Bio</label>
            <textarea
              rows={3}
              value={profBio}
              onChange={(e) => setProfBio(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white"
            />
          </div>
          {profSaved && <p className="text-xs text-emerald-400">Profile saved securely.</p>}
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] cursor-pointer"
          >
            Save Profile
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Project List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-8 text-center space-y-3">
                <p className="text-sm font-medium text-white">No projects in this view yet.</p>
                <Link
                  to="/request-edit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold"
                >
                  Submit Your First Edit
                </Link>
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = proj.id === selectedProject?.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setSearchParams({ project: proj.id });
                    }}
                    className={`w-full text-left rounded-xl p-4 border transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#15151b] border-[#D4AF37]'
                        : 'bg-[#101014] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono-tabular text-[#D4AF37] font-semibold">
                        {proj.projectCode}
                      </span>
                      <span className="text-zinc-200 font-medium">{proj.status}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{proj.title}</h3>
                    {proj.latestUpdate && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{proj.latestUpdate}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{proj.serviceTitle}</span>
                      <span className="tabular-nums">{formatStudioDate(proj.updatedAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Project Details Pane */}
          <div className="lg:col-span-7">
            {!selectedProject ? (
              <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center text-sm text-zinc-400">
                Select a project from the list to inspect its editing progress, studio status details, and files.
              </div>
            ) : (
              <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono-tabular text-[#D4AF37] font-semibold">
                        {selectedProject.projectCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedProject.serviceTitle}</span>
                    </div>
                    <h2 className="mt-1 text-2xl font-display font-semibold text-white">
                      {selectedProject.title}
                    </h2>
                  </div>
                  <div className="text-left sm:text-right shrink-0 space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1 rounded-lg bg-[#16161d] border border-zinc-700">
                      {selectedProject.status === 'Completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : selectedProject.status === 'Editing in Progress' ? (
                        <PlayCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                      ) : selectedProject.status === 'Ready for Review' ? (
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                      ) : selectedProject.status === 'Rejected' || selectedProject.status === 'Cancelled' ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      )}
                      {selectedProject.status}
                    </span>
                    {selectedProject.priceEstimate && (
                      <span className="block text-xs font-mono-tabular text-[#D4AF37]">
                        Estimate: {selectedProject.priceEstimate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Editing Status Details & Workflow Stepper */}
                {(() => {
                  const detail = STATUS_CUSTOMER_DETAILS[selectedProject.status];
                  const stageIdx = getWorkflowStageIndex(selectedProject.status);
                  const isTerminalNegative =
                    selectedProject.status === 'Rejected' || selectedProject.status === 'Cancelled';
                  return (
                    <div className="rounded-xl bg-[#09090c] border border-zinc-800 p-4 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#D4AF37]">
                            Editing Status Detail · {detail.headline}
                          </p>
                          <p className="text-xs text-zinc-300 leading-relaxed">{detail.description}</p>
                        </div>
                        <span className="text-[11px] text-zinc-500 whitespace-nowrap tabular-nums">
                          Updated {formatStudioDateTime(selectedProject.updatedAt)}
                        </span>
                      </div>

                      {!isTerminalNegative ? (
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                          {WORKFLOW_STAGES.map((stage, idx) => {
                            const reached = stageIdx >= idx;
                            const isCurrent = stageIdx === idx;
                            return (
                              <div
                                key={stage}
                                className={`rounded-lg border p-2.5 space-y-1 transition-colors ${
                                  isCurrent
                                    ? 'bg-[#D4AF37]/12 border-[#D4AF37]/60'
                                    : reached
                                      ? 'bg-emerald-950/25 border-emerald-800/50'
                                      : 'bg-[#101014] border-zinc-800/80 opacity-65'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-mono-tabular text-zinc-400">0{idx + 1}</span>
                                  {reached && (
                                    <Check
                                      className={`w-3.5 h-3.5 ${
                                        isCurrent ? 'text-[#D4AF37]' : 'text-emerald-400'
                                      }`}
                                    />
                                  )}
                                </div>
                                <p
                                  className={`text-[11px] font-medium leading-tight ${
                                    isCurrent
                                      ? 'text-[#D4AF37]'
                                      : reached
                                        ? 'text-emerald-200'
                                        : 'text-zinc-400'
                                  }`}
                                >
                                  {stage === 'Editing in Progress'
                                    ? 'In Progress'
                                    : stage === 'Request Submitted'
                                      ? 'Submitted'
                                      : stage}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-red-950/25 border border-red-900/50 p-3 flex items-center gap-2 text-xs text-red-200">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Status: {selectedProject.status}</span>
                        </div>
                      )}

                      {selectedProject.latestUpdate && (
                        <div className="rounded-lg bg-[#14141a] border border-zinc-800 p-3 text-xs text-zinc-200 space-y-0.5">
                          <p className="text-[11px] font-semibold text-[#D4AF37]">Latest Note from Studio Admin</p>
                          <p className="leading-relaxed">{selectedProject.latestUpdate}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 pt-1 border-t border-zinc-800/80">
                        {selectedProject.preferredStyle && (
                          <span>Style: <strong className="text-zinc-200 font-medium">{selectedProject.preferredStyle}</strong></span>
                        )}
                        {selectedProject.deliveryFormat && (
                          <span>Delivery: <strong className="text-zinc-200 font-medium">{selectedProject.deliveryFormat}</strong></span>
                        )}
                        <span className="tabular-nums">Revisions: <strong className="text-zinc-200 font-medium">{selectedProject.revisionCount}</strong></span>
                      </div>
                    </div>
                  );
                })()}

                {actionError && <p className="text-xs text-red-400">{actionError}</p>}
                {actionSuccess && <p className="text-xs text-emerald-400">{actionSuccess}</p>}

                <div className="space-y-2 text-sm">
                  <p className="text-zinc-300 leading-relaxed">{selectedProject.description}</p>
                  {selectedProject.requirements && (
                    <p className="text-xs text-zinc-400">
                      <span className="text-zinc-300 font-medium">Requirements:</span> {selectedProject.requirements}
                    </p>
                  )}
                </div>

                {/* Private Uploaded Attachments */}
                {selectedProject.attachmentUrls && selectedProject.attachmentUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-300">Uploaded Project Files</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedProject.attachmentUrls.map((url, idx) => (
                        <ProtectedMedia
                          key={`${url}_${idx}`}
                          url={url}
                          alt={`Project file ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-zinc-800"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Workflow Actions */}
                {['Request Submitted', 'Waiting for Customer Information'].includes(selectedProject.status) && (
                  <div className="rounded-xl bg-[#0b0b0f] border border-zinc-800 p-4 space-y-3">
                    <p className="text-xs font-medium text-white">Add Notes or Upload Additional Files</p>
                    <textarea
                      rows={2}
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      placeholder="Add clarifications for our editor..."
                      className="w-full px-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                    />
                    <FileDropzone
                      scope={selectedProject.id}
                      maxFiles={8}
                      uploadedUrls={extraFiles}
                      onUploaded={setExtraFiles}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleAddInfo()}
                        className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] cursor-pointer"
                      >
                        Save Updates
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancel()}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-900/60 text-xs text-red-300 hover:bg-red-950/40 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Request
                      </button>
                    </div>
                  </div>
                )}

                {selectedProject.status === 'Ready for Review' && (
                  <form
                    onSubmit={(e) => void handleRevisionRequest(e)}
                    className="rounded-xl bg-[#0b0b0f] border border-[#D4AF37]/40 p-4 space-y-3"
                  >
                    <p className="text-xs font-semibold text-[#D4AF37]">
                      Your edit is Ready for Review — Need any refinements?
                    </p>
                    <textarea
                      rows={2}
                      required
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      placeholder="Specify timestamps, color tweaks, or text adjustments..."
                      className="w-full px-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] cursor-pointer"
                    >
                      Request Revision
                    </button>
                  </form>
                )}

                {selectedProject.status === 'Completed' && (
                  <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/50 p-4 flex items-center justify-between gap-4">
                    <p className="text-xs text-emerald-200">
                      This project is completed! You can now share a verified review with photos.
                    </p>
                    <Link
                      to="/reviews"
                      className="px-3.5 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold whitespace-nowrap"
                    >
                      Write a Review
                    </Link>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="space-y-3 border-t border-zinc-800 pt-4">
                  <h3 className="text-xs font-semibold text-zinc-300">Editing Status History</h3>
                  {history.length === 0 ? (
                    <p className="text-xs text-zinc-500">Status updates will appear here as your project progresses.</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((h) => (
                        <div
                          key={h.id}
                          className="rounded-lg bg-[#09090c] border border-zinc-800 p-3 flex items-start justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-white">
                                {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                              </span>
                              <span className="text-[11px] text-[#D4AF37]">
                                · {h.actorRole === 'admin' ? 'Studio Admin' : 'You'}
                              </span>
                            </div>
                            {h.note && <p className="text-zinc-300 leading-relaxed">{h.note}</p>}
                          </div>
                          <span className="text-[11px] text-zinc-500 whitespace-nowrap tabular-nums">
                            {formatStudioDateTime(h.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Communication Thread */}
                <div className="space-y-3 border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                    <span>Project Messages</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {messages.length === 0 ? (
                      <p className="text-xs text-zinc-500">No messages on this project yet.</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-lg p-3 text-xs ${
                            m.senderRole === 'admin'
                              ? 'bg-[#171612] border border-[#D4AF37]/30'
                              : 'bg-[#141419] border border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                            <span className="font-semibold text-white">
                              {m.senderName} {m.senderRole === 'admin' ? '(Studio Admin)' : ''}
                            </span>
                            <span className="tabular-nums">{formatStudioDate(m.createdAt)}</span>
                          </div>
                          <p className="text-zinc-200">{m.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={(e) => void handleSendMessage(e)} className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Send a note regarding this project..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
