import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  Check,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  LogOut,
  Mail,
  Megaphone,
  Plus,
  Search,
  Send,
  Settings,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ALLOWED_ADMIN_TRANSITIONS,
  PORTFOLIO_CATEGORIES,
  PRICING_FILTERS,
} from '../../data/defaultCatalog';
import {
  adminDeleteReview,
  adminModerateReview,
  adminUpdateContactStatus,
  adminUpdateProjectStatus,
  deleteBanner,
  deletePortfolioItem,
  deleteService,
  formatStudioDate,
  saveBanner,
  savePortfolioItem,
  saveService,
  saveSiteSettings,
  sendProjectMessage,
  subscribeAllContacts,
  subscribeAllCustomers,
  subscribeAllProjects,
  subscribeAllReviews,
  subscribeBanners,
  subscribePortfolio,
  subscribeProjectMessages,
  subscribeServices,
} from '../../services/studioService';
import {
  ContactMessage,
  CustomerReview,
  EditingProject,
  EditingService,
  PortfolioItem,
  PricingType,
  ProjectMessage,
  ProjectStatus,
  PromoBanner,
  ServiceCategory,
  SiteSettings,
  UserProfile,
} from '../../types/studio';
import { ProtectedMedia } from '../../components/common/ProtectedMedia';
import { FileDropzone } from '../../components/common/FileDropzone';
import { AdminAnalyticsView } from '../../components/admin/AdminAnalyticsView';

interface AdminDashboardPageProps {
  settings: SiteSettings;
}

type AdminSection =
  | 'overview'
  | 'projects'
  | 'services'
  | 'portfolio'
  | 'reviews'
  | 'banners'
  | 'customers'
  | 'contacts'
  | 'content';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ settings }) => {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<AdminSection>('overview');

  const [projects, setProjects] = useState<EditingProject[]>([]);
  const [services, setServices] = useState<EditingService[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  // Project Management state
  const [projSearch, setProjSearch] = useState('');
  const [projStatusFilter, setProjStatusFilter] = useState<string>('All');
  const [selectedProjId, setSelectedProjId] = useState<string>('');
  const [nextStatus, setNextStatus] = useState<ProjectStatus>('Reviewing');
  const [statusNote, setStatusNote] = useState('');
  const [priceEstimateInput, setPriceEstimateInput] = useState('');
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [projMessages, setProjMessages] = useState<ProjectMessage[]>([]);
  const [adminMsgInput, setAdminMsgInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Service Form state
  const [editingService, setEditingService] = useState<Omit<EditingService, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewService, setIsNewService] = useState(false);

  // Portfolio Form state
  const [portTitle, setPortTitle] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portCategory, setPortCategory] = useState<string>(PORTFOLIO_CATEGORIES[1]);
  const [portMediaType, setPortMediaType] = useState<'image' | 'video'>('image');
  const [portUrls, setPortUrls] = useState<string[]>([]);
  const [portManualUrl, setPortManualUrl] = useState('');
  const [portFeatured, setPortFeatured] = useState(true);

  // Banner Form state
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCtaLabel, setBannerCtaLabel] = useState('Request an Edit');
  const [bannerCtaLink, setBannerCtaLink] = useState('/request-edit');
  const [bannerImageUrls, setBannerImageUrls] = useState<string[]>([]);

  // Review Reply draft map
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Site settings draft
  const [siteDraft, setSiteDraft] = useState<SiteSettings>(settings);

  useEffect(() => {
    setSiteDraft(settings);
  }, [settings]);

  useEffect(() => {
    const unsubs = [
      subscribeAllProjects((list) => {
        setProjects(list);
        if (list.length > 0 && !selectedProjId) setSelectedProjId(list[0].id);
      }),
      subscribeServices(setServices, true),
      subscribePortfolio(setPortfolio, true),
      subscribeAllReviews(setReviews),
      subscribeBanners(setBanners, true),
      subscribeAllCustomers(setCustomers),
      subscribeAllContacts(setContacts),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjId) || null,
    [projects, selectedProjId]
  );

  useEffect(() => {
    if (!selectedProject) {
      setProjMessages([]);
      return;
    }
    const allowed = ALLOWED_ADMIN_TRANSITIONS[selectedProject.status] || [];
    setNextStatus(allowed[0] || selectedProject.status);
    setPriceEstimateInput(selectedProject.priceEstimate || '');
    setInternalNotesInput(selectedProject.internalNotes || '');
    setStatusNote('');
    const unsub = subscribeProjectMessages(selectedProject.id, setProjMessages);
    return () => unsub();
  }, [selectedProject?.id, selectedProject?.status]);

  const filteredProjects = useMemo(() => {
    const q = projSearch.trim().toLowerCase();
    return projects.filter((p) => {
      const matchStatus = projStatusFilter === 'All' || p.status === projStatusFilter;
      const matchQ =
        !q ||
        p.projectCode.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.serviceTitle.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  }, [projects, projSearch, projStatusFilter]);

  const notifySaved = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;
    try {
      await adminUpdateProjectStatus({
        project: selectedProject,
        adminUid: user.uid,
        nextStatus,
        updateNote: statusNote,
        priceEstimate: priceEstimateInput,
        internalNotes: internalNotesInput,
      });
      setStatusNote('');
      notifySaved(`Project ${selectedProject.projectCode} updated to "${nextStatus}".`);
    } catch (err) {
      notifySaved(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject || !adminMsgInput.trim()) return;
    await sendProjectMessage({
      projectId: selectedProject.id,
      projectCode: selectedProject.projectCode,
      customerId: selectedProject.customerId,
      senderId: user.uid,
      senderName: 'SRI EDITING STUDIO',
      senderRole: 'admin',
      body: adminMsgInput.trim(),
    });
    setAdminMsgInput('');
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    await saveService(editingService, isNewService);
    setEditingService(null);
    notifySaved('Service catalog saved.');
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    const mediaUrl = portUrls[0] || portManualUrl.trim();
    if (!mediaUrl || !portTitle.trim()) return;
    await savePortfolioItem(
      {
        id: `port_${Date.now()}`,
        title: portTitle.trim(),
        description: portDesc.trim() || 'Curated studio project.',
        category: portCategory,
        mediaType: portMediaType,
        mediaUrl,
        thumbnailUrl: mediaUrl,
        featured: portFeatured,
        displayOrder: portfolio.length + 1,
        active: true,
      },
      true
    );
    setPortTitle('');
    setPortDesc('');
    setPortUrls([]);
    setPortManualUrl('');
    notifySaved('Portfolio item published.');
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) return;
    await saveBanner({
      id: `banner_${Date.now()}`,
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      ctaLabel: bannerCtaLabel.trim(),
      ctaLink: bannerCtaLink.trim(),
      imageUrl: bannerImageUrls[0] || undefined,
      displayOrder: banners.length + 1,
      active: true,
    });
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImageUrls([]);
    notifySaved('Promotional banner saved.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSiteSettings(siteDraft);
    notifySaved('Website content & contact details updated.');
  };

  const navItems: Array<{ id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Analytics', icon: BarChart3 },
    { id: 'projects', label: `Projects (${projects.length})`, icon: FolderKanban },
    { id: 'services', label: `Services (${services.length})`, icon: Layers },
    { id: 'portfolio', label: `Portfolio (${portfolio.length})`, icon: ImageIcon },
    { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
    { id: 'banners', label: 'Banners', icon: Megaphone },
    { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
    { id: 'contacts', label: `Contacts (${contacts.length})`, icon: Mail },
    { id: 'content', label: 'Site Content', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <p className="text-xs font-medium text-[#D4AF37]">
            Authorized Studio Administration{user?.email ? ` · ${user.email}` : ''}
          </p>
          <h1 className="text-3xl font-display font-semibold text-white">
            SRI EDITING STUDIO Console
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {feedbackMsg && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg"
            >
              {feedbackMsg}
            </motion.span>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-200 hover:border-[#D4AF37] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Admin Logout
          </button>
        </div>
      </div>

      {/* Section Selector */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-800/80 pb-3">
        {navItems.map((item) => {
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive ? 'text-black font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="adminTabActiveBg"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 rounded-lg bg-[#D4AF37]"
                />
              )}
              <item.icon className="relative z-10 w-3.5 h-3.5" />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
      {/* 1. ANALYTICS OVERVIEW */}
      {section === 'overview' && (
        <AdminAnalyticsView
          projects={projects}
          customers={customers}
          reviews={reviews}
          contacts={contacts}
        />
      )}

      {/* 2. PROJECT MANAGEMENT */}
      {section === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                  placeholder="Search ID, title, customer..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                />
              </div>
              <select
                value={projStatusFilter}
                onChange={(e) => setProjStatusFilter(e.target.value)}
                className="px-2.5 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
              >
                <option value="All">All Statuses</option>
                {Object.keys(ALLOWED_ADMIN_TRANSITIONS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="rounded-xl bg-[#101014] border border-zinc-800 p-6 text-center text-xs text-zinc-500">
                  No project requests found.
                </div>
              ) : (
                filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjId(p.id)}
                    className={`w-full text-left rounded-xl p-4 border transition-colors cursor-pointer space-y-1.5 ${
                      selectedProject?.id === p.id
                        ? 'bg-[#15151b] border-[#D4AF37]'
                        : 'bg-[#101014] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-tabular text-[#D4AF37] font-semibold">{p.projectCode}</span>
                      <span className="text-zinc-300">{p.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                    <p className="text-xs text-zinc-400">
                      {p.customerName} · {p.serviceTitle}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            {!selectedProject ? (
              <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center text-sm text-zinc-500">
                Select a project request to review files, update workflow state, and communicate with the client.
              </div>
            ) : (
              <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <p className="text-xs font-mono-tabular text-[#D4AF37]">{selectedProject.projectCode}</p>
                    <h2 className="text-2xl font-display font-semibold text-white">{selectedProject.title}</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Client: {selectedProject.customerName} ({selectedProject.customerEmail})
                      {selectedProject.contactPhone ? ` · ${selectedProject.contactPhone}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-white px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700">
                    {selectedProject.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-zinc-300">
                  <p><strong className="text-white">Service:</strong> {selectedProject.serviceTitle}</p>
                  <p><strong className="text-white">Description:</strong> {selectedProject.description}</p>
                  {selectedProject.requirements && <p><strong className="text-white">Requirements:</strong> {selectedProject.requirements}</p>}
                  {selectedProject.preferredStyle && <p><strong className="text-white">Preferred Style:</strong> {selectedProject.preferredStyle}</p>}
                  {selectedProject.deliveryFormat && <p><strong className="text-white">Delivery Format:</strong> {selectedProject.deliveryFormat}</p>}
                  {selectedProject.referenceLinks && selectedProject.referenceLinks.length > 0 && (
                    <p>
                      <strong className="text-white">Reference Links:</strong>{' '}
                      {selectedProject.referenceLinks.join(', ')}
                    </p>
                  )}
                </div>

                {selectedProject.attachmentUrls && selectedProject.attachmentUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-300">Customer Project Uploads</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedProject.attachmentUrls.map((url, idx) => (
                        <ProtectedMedia
                          key={`${url}_${idx}`}
                          url={url}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-zinc-800"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => void handleUpdateProject(e)} className="rounded-xl bg-[#09090c] border border-zinc-800 p-4 space-y-4">
                  <h3 className="text-xs font-semibold text-[#D4AF37]">Workflow Transition & Studio Notes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Next Status</label>
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value as ProjectStatus)}
                        className="w-full px-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                      >
                        <option value={selectedProject.status}>{selectedProject.status} (Keep Current)</option>
                        {(ALLOWED_ADMIN_TRANSITIONS[selectedProject.status] || []).map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Price Estimate</label>
                      <input
                        type="text"
                        value={priceEstimateInput}
                        onChange={(e) => setPriceEstimateInput(e.target.value)}
                        placeholder="e.g., ₹250 confirmed"
                        className="w-full px-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Customer Update Message</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Visible to customer in their project timeline..."
                      className="w-full px-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Admin Internal Notes (Private)</label>
                    <textarea
                      rows={2}
                      value={internalNotesInput}
                      onChange={(e) => setInternalNotesInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#101014] border border-zinc-800 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] cursor-pointer"
                  >
                    Save Project Update
                  </button>
                </form>

                {/* Project Messages */}
                <div className="space-y-2 border-t border-zinc-800 pt-4">
                  <p className="text-xs font-semibold text-zinc-300">Client Communication Thread</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {projMessages.map((m) => (
                      <div key={m.id} className="rounded-lg bg-[#09090c] border border-zinc-800 p-2.5 text-xs">
                        <span className="font-semibold text-[#D4AF37]">{m.senderName}: </span>
                        <span className="text-zinc-200">{m.body}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(e) => void handleAdminMessage(e)} className="flex gap-2">
                    <input
                      type="text"
                      value={adminMsgInput}
                      onChange={(e) => setAdminMsgInput(e.target.value)}
                      placeholder="Reply to customer..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg bg-zinc-800 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
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

      {/* 3. SERVICE & PRICING MANAGEMENT */}
      {section === 'services' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-white">Services & Pricing Catalog</h2>
            <button
              type="button"
              onClick={() => {
                setIsNewService(true);
                setEditingService({
                  id: `svc_${Date.now()}`,
                  slug: `service-${Date.now()}`,
                  title: '',
                  category: 'Photo Editing',
                  description: '',
                  priceDisplay: '',
                  pricingType: 'fixed',
                  promoText: '',
                  inclusions: ['Color correction'],
                  useCases: ['Personal Projects'],
                  displayOrder: services.length + 1,
                  active: true,
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>

          {editingService && (
            <form onSubmit={(e) => void handleSaveService(e)} className="rounded-2xl bg-[#101014] border border-[#D4AF37]/50 p-6 space-y-4">
              <h3 className="text-base font-semibold text-white">
                {isNewService ? 'New Service' : `Edit ${editingService.title}`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Service Title"
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                />
                <select
                  value={editingService.category}
                  onChange={(e) => setEditingService({ ...editingService, category: e.target.value as ServiceCategory })}
                  className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                >
                  {PRICING_FILTERS.filter((f) => f !== 'All Services').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Price Display (e.g., ₹150 per photo)"
                  value={editingService.priceDisplay}
                  onChange={(e) => setEditingService({ ...editingService, priceDisplay: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={editingService.pricingType}
                  onChange={(e) => setEditingService({ ...editingService, pricingType: e.target.value as PricingType })}
                  className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                >
                  <option value="range">Range</option>
                  <option value="fixed">Fixed</option>
                  <option value="starting">Starting</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="text"
                  placeholder="Promotional subtitle"
                  value={editingService.promoText || ''}
                  onChange={(e) => setEditingService({ ...editingService, promoText: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Display order"
                  value={editingService.displayOrder}
                  onChange={(e) => setEditingService({ ...editingService, displayOrder: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                />
              </div>

              <textarea
                rows={3}
                required
                placeholder="Description"
                value={editingService.description}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Inclusions (comma-separated)</label>
                  <input
                    type="text"
                    value={editingService.inclusions.join(', ')}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        inclusions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Use Cases (comma-separated)</label>
                  <input
                    type="text"
                    value={editingService.useCases.join(', ')}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        useCases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editingService.active}
                    onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                  />
                  Active on public catalog
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    className="px-4 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold cursor-pointer"
                  >
                    Save Service
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc) => (
              <div key={svc.id} className="rounded-xl bg-[#101014] border border-zinc-800 p-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{svc.category}</span>
                    <span>·</span>
                    <span>{svc.active ? 'Active' : 'Disabled'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{svc.title}</h3>
                  <p className="text-sm font-mono-tabular text-[#D4AF37]">{svc.priceDisplay}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewService(false);
                      setEditingService({ ...svc });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:border-[#D4AF37] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label="Delete service"
                    onClick={() => void deleteService(svc.id)}
                    className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PORTFOLIO MANAGEMENT */}
      {section === 'portfolio' && (
        <div className="space-y-8">
          <form onSubmit={(e) => void handleCreatePortfolio(e)} className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-white">Add Portfolio Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="Work Title"
                value={portTitle}
                onChange={(e) => setPortTitle(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
              <select
                value={portCategory}
                onChange={(e) => setPortCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              >
                {PORTFOLIO_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={portMediaType}
                onChange={(e) => setPortMediaType(e.target.value as 'image' | 'video')}
                className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <textarea
              rows={2}
              placeholder="Portfolio description..."
              value={portDesc}
              onChange={(e) => setPortDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
            />
            <FileDropzone
              scope="portfolio"
              maxFiles={1}
              uploadedUrls={portUrls}
              onUploaded={setPortUrls}
              helperText="Upload portfolio image or video (JPG, PNG, WEBP, MP4, MOV)"
            />
            <input
              type="text"
              placeholder="Or paste an asset URL directly"
              value={portManualUrl}
              onChange={(e) => setPortManualUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
            />
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={portFeatured}
                  onChange={(e) => setPortFeatured(e.target.checked)}
                />
                Feature on Homepage
              </label>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold cursor-pointer"
              >
                Publish Portfolio Item
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="rounded-xl bg-[#101014] border border-zinc-800 overflow-hidden">
                <ProtectedMedia url={item.mediaUrl} alt={item.title} className="w-full h-36 object-cover" />
                <div className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] text-[#D4AF37]">{item.category}</p>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete portfolio entry"
                    onClick={() => void deletePortfolioItem(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. REVIEW MODERATION & REPLIES */}
      {section === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center text-sm text-zinc-500">
              No customer reviews submitted yet.
            </div>
          ) : (
            reviews.map((rev) => {
              const draftReply = replyDrafts[rev.id] ?? rev.adminReply ?? '';
              return (
                <div key={rev.id} className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{rev.displayName}</p>
                      <p className="text-xs text-zinc-400">
                        {rev.category} · {rev.rating}/5 stars · Status: <span className="text-[#D4AF37] capitalize">{rev.moderationStatus}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['approved', 'rejected', 'hidden'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            void adminModerateReview(rev, {
                              moderationStatus: status,
                              featured: rev.featured,
                              adminReply: draftReply,
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer ${
                            rev.moderationStatus === status
                              ? 'bg-[#D4AF37] text-black font-semibold'
                              : 'border border-zinc-700 text-zinc-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          void adminModerateReview(rev, {
                            moderationStatus: rev.moderationStatus,
                            featured: !rev.featured,
                            adminReply: draftReply,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-200 cursor-pointer"
                      >
                        {rev.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        type="button"
                        aria-label="Delete review"
                        onClick={() => void adminDeleteReview(rev.id)}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300">{rev.reviewText}</p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={draftReply}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })}
                      placeholder="Write official Sri Editing Studio reply..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void adminModerateReview(rev, {
                          moderationStatus: rev.moderationStatus,
                          featured: rev.featured,
                          adminReply: draftReply,
                        })
                      }
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium cursor-pointer"
                    >
                      Save Reply
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. BANNERS */}
      {section === 'banners' && (
        <div className="space-y-6">
          <form onSubmit={(e) => void handleCreateBanner(e)} className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-white">Create Promotional Banner</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Banner Headline"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
              <input
                type="text"
                placeholder="CTA Label (e.g., Request an Edit)"
                value={bannerCtaLabel}
                onChange={(e) => setBannerCtaLabel(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <input
              type="text"
              placeholder="Banner subtitle or offer details"
              value={bannerSubtitle}
              onChange={(e) => setBannerSubtitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
            />
            <FileDropzone
              scope="banners"
              maxFiles={1}
              uploadedUrls={bannerImageUrls}
              onUploaded={setBannerImageUrls}
              helperText="Optional promotional banner image (JPG, PNG, WEBP)"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold cursor-pointer"
            >
              Add Banner
            </button>
          </form>

          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b.id} className="rounded-xl bg-[#101014] border border-zinc-800 p-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{b.title}</h3>
                  <p className="text-xs text-zinc-400">{b.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void saveBanner({ ...b, active: !b.active })}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-200 cursor-pointer"
                  >
                    {b.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete banner"
                    onClick={() => void deleteBanner(b.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CUSTOMERS */}
      {section === 'customers' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#101014] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                <th className="py-3.5 px-5 font-medium">Customer</th>
                <th className="py-3.5 px-5 font-medium">UID</th>
                <th className="py-3.5 px-5 font-medium">Status</th>
                <th className="py-3.5 px-5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-sm">
              {customers.map((c) => (
                <tr key={c.uid}>
                  <td className="py-3.5 px-5 font-medium text-white">{c.displayName}</td>
                  <td className="py-3.5 px-5 font-mono-tabular text-xs text-zinc-400">{c.uid}</td>
                  <td className="py-3.5 px-5 text-xs text-zinc-300 capitalize">{c.accountStatus}</td>
                  <td className="py-3.5 px-5 text-xs text-zinc-400 tabular-nums">{formatStudioDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. CONTACTS */}
      {section === 'contacts' && (
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center text-sm text-zinc-500">
              No contact form messages yet.
            </div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="rounded-xl bg-[#101014] border border-zinc-800 p-5 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {c.name} <span className="text-xs font-normal text-zinc-400">({c.email})</span>
                    </p>
                    <p className="text-xs text-[#D4AF37]">{c.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 capitalize">{c.status}</span>
                    {c.status !== 'replied' && (
                      <button
                        type="button"
                        onClick={() => void adminUpdateContactStatus(c.id, 'replied')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-700 text-xs text-zinc-200 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark Replied
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{c.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 9. WEBSITE CONTENT & SETTINGS */}
      {section === 'content' && (
        <form onSubmit={(e) => void handleSaveSettings(e)} className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-5">
          <h2 className="text-xl font-display font-semibold text-white">Website Content & Contact Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Studio Tagline</label>
              <input
                type="text"
                value={siteDraft.tagline}
                onChange={(e) => setSiteDraft({ ...siteDraft, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Public Contact Email</label>
              <input
                type="email"
                value={siteDraft.contactEmail}
                onChange={(e) => setSiteDraft({ ...siteDraft, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={siteDraft.contactPhone}
                onChange={(e) => setSiteDraft({ ...siteDraft, contactPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">WhatsApp Link</label>
              <input
                type="text"
                value={siteDraft.whatsappLink}
                onChange={(e) => setSiteDraft({ ...siteDraft, whatsappLink: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Instagram Link</label>
              <input
                type="text"
                value={siteDraft.instagramLink}
                onChange={(e) => setSiteDraft({ ...siteDraft, instagramLink: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">YouTube Link</label>
              <input
                type="text"
                value={siteDraft.youtubeLink}
                onChange={(e) => setSiteDraft({ ...siteDraft, youtubeLink: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Hero Description</label>
            <textarea
              rows={3}
              value={siteDraft.heroDescription}
              onChange={(e) => setSiteDraft({ ...siteDraft, heroDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">About Intro</label>
            <textarea
              rows={3}
              value={siteDraft.aboutIntro}
              onChange={(e) => setSiteDraft({ ...siteDraft, aboutIntro: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">About My Editing</label>
              <textarea
                rows={2}
                value={siteDraft.aboutEditing}
                onChange={(e) => setSiteDraft({ ...siteDraft, aboutEditing: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">My Creative Approach</label>
              <textarea
                rows={2}
                value={siteDraft.aboutApproach}
                onChange={(e) => setSiteDraft({ ...siteDraft, aboutApproach: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">My Workflow</label>
              <textarea
                rows={2}
                value={siteDraft.aboutWorkflow}
                onChange={(e) => setSiteDraft({ ...siteDraft, aboutWorkflow: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">My Commitment</label>
              <textarea
                rows={2}
                value={siteDraft.aboutCommitment}
                onChange={(e) => setSiteDraft({ ...siteDraft, aboutCommitment: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#09090c] border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] cursor-pointer"
          >
            Save Website Content
          </button>
        </form>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
