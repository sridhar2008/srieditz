import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ALLOWED_ADMIN_TRANSITIONS,
  DEFAULT_SITE_SETTINGS,
  INITIAL_BANNERS,
  INITIAL_PORTFOLIO,
  INITIAL_SERVICES,
} from '../data/defaultCatalog';
import {
  ContactMessage,
  CustomerReview,
  EditingProject,
  EditingService,
  PortfolioItem,
  ProjectHistoryEntry,
  ProjectMessage,
  ProjectStatus,
  PromoBanner,
  SiteSettings,
  StudioNotification,
  UserPrivateInfo,
  UserProfile,
} from '../types/studio';

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function makeProjectCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `SRI-${year}-${suffix}`;
}

// -----------------------------------------------------------------------------
// Seeding initial studio data (Admin only, idempotent)
// -----------------------------------------------------------------------------
export async function ensureStudioSeededByAdmin(): Promise<void> {
  try {
    const servicesSnap = await getDocs(collection(db, 'services'));
    if (servicesSnap.empty) {
      const batch = writeBatch(db);
      for (const svc of INITIAL_SERVICES) {
        batch.set(doc(db, 'services', svc.id), {
          ...svc,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    const portfolioSnap = await getDocs(collection(db, 'portfolio'));
    if (portfolioSnap.empty) {
      const batch = writeBatch(db);
      for (const item of INITIAL_PORTFOLIO) {
        batch.set(doc(db, 'portfolio', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    const bannerSnap = await getDocs(collection(db, 'banners'));
    if (bannerSnap.empty) {
      const batch = writeBatch(db);
      for (const banner of INITIAL_BANNERS) {
        batch.set(doc(db, 'banners', banner.id), {
          ...banner,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    const settingsRef = doc(db, 'settings', 'site_content');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        ...DEFAULT_SITE_SETTINGS,
        updatedAt: serverTimestamp(),
      });
    } else {
      const existing = settingsSnap.data() as Partial<SiteSettings>;
      if (
        existing.contactEmail === 'contact@srieditingstudio.example.com' ||
        existing.instagramLink === 'https://instagram.com/srieditingstudio' ||
        existing.whatsappLink === 'https://wa.me/919000000000' ||
        existing.youtubeLink === 'https://youtube.com/@srieditingstudio'
      ) {
        await updateDoc(settingsRef, {
          contactEmail: DEFAULT_SITE_SETTINGS.contactEmail,
          contactPhone: '',
          whatsappLink: '',
          instagramLink: DEFAULT_SITE_SETTINGS.instagramLink,
          youtubeLink: '',
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Studio initial seeding skipped or incomplete:', err);
  }
}

// -----------------------------------------------------------------------------
// Services & Pricing
// -----------------------------------------------------------------------------
export function subscribeServices(
  onData: (services: EditingService[]) => void,
  includeInactive = false
): Unsubscribe {
  const q = query(collection(db, 'services'), orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        const fallback = INITIAL_SERVICES.map((s) => ({ ...s })) as EditingService[];
        onData(includeInactive ? fallback : fallback.filter((s) => s.active));
        return;
      }
      const list = snap.docs.map((d) => d.data() as EditingService);
      onData(includeInactive ? list : list.filter((s) => s.active));
    },
    (err) => {
      console.warn('Services subscription fallback:', err.message);
      const fallback = INITIAL_SERVICES.map((s) => ({ ...s })) as EditingService[];
      onData(includeInactive ? fallback : fallback.filter((s) => s.active));
    }
  );
}

export async function saveService(
  service: Omit<EditingService, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const path = `services/${service.id}`;
  try {
    const clean = {
      id: service.id,
      slug: service.slug.slice(0, 128),
      title: service.title.slice(0, 140),
      category: service.category,
      description: service.description.slice(0, 1500),
      priceDisplay: service.priceDisplay.slice(0, 100),
      ...(typeof service.priceMin === 'number' && !Number.isNaN(service.priceMin) ? { priceMin: service.priceMin } : {}),
      ...(typeof service.priceMax === 'number' && !Number.isNaN(service.priceMax) ? { priceMax: service.priceMax } : {}),
      pricingType: service.pricingType,
      ...(service.promoText ? { promoText: service.promoText.slice(0, 200) } : {}),
      inclusions: service.inclusions.slice(0, 20).map((s) => s.slice(0, 140)),
      useCases: service.useCases.slice(0, 12).map((s) => s.slice(0, 120)),
      ...(service.imageUrl ? { imageUrl: service.imageUrl.slice(0, 500) } : {}),
      displayOrder: Number(service.displayOrder) || 1,
      active: Boolean(service.active),
      updatedAt: serverTimestamp(),
    };
    if (isNew) {
      await setDoc(doc(db, 'services', service.id), {
        ...clean,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'services', service.id), clean);
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
  }
}

// -----------------------------------------------------------------------------
// Site Settings & Banners
// -----------------------------------------------------------------------------
export function subscribeSiteSettings(onData: (settings: SiteSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings', 'site_content'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_SITE_SETTINGS);
        return;
      }
      const data = snap.data() as SiteSettings;
      const merged: SiteSettings = { ...DEFAULT_SITE_SETTINGS, ...data };
      if (merged.contactEmail === 'contact@srieditingstudio.example.com') {
        merged.contactEmail = DEFAULT_SITE_SETTINGS.contactEmail;
      }
      if (merged.instagramLink === 'https://instagram.com/srieditingstudio') {
        merged.instagramLink = DEFAULT_SITE_SETTINGS.instagramLink;
      }
      if (merged.contactPhone === '+91 90000 00000') merged.contactPhone = '';
      if (merged.whatsappLink === 'https://wa.me/919000000000') merged.whatsappLink = '';
      if (merged.youtubeLink === 'https://youtube.com/@srieditingstudio') merged.youtubeLink = '';
      onData(merged);
    },
    () => {
      onData(DEFAULT_SITE_SETTINGS);
    }
  );
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  try {
    const clean = {
      id: 'site_content',
      tagline: settings.tagline.slice(0, 140),
      heroDescription: settings.heroDescription.slice(0, 800),
      aboutIntro: settings.aboutIntro.slice(0, 1200),
      aboutEditing: (settings.aboutEditing || '').slice(0, 1000),
      aboutApproach: (settings.aboutApproach || '').slice(0, 1000),
      aboutServices: (settings.aboutServices || '').slice(0, 1000),
      aboutWorkflow: (settings.aboutWorkflow || '').slice(0, 1000),
      aboutCommitment: (settings.aboutCommitment || '').slice(0, 1000),
      contactEmail: (settings.contactEmail || '').slice(0, 160),
      contactPhone: (settings.contactPhone || '').slice(0, 40),
      whatsappLink: (settings.whatsappLink || '').slice(0, 300),
      instagramLink: (settings.instagramLink || '').slice(0, 300),
      youtubeLink: (settings.youtubeLink || '').slice(0, 300),
      contactText: (settings.contactText || '').slice(0, 500),
      footerText: (settings.footerText || '').slice(0, 300),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'settings', 'site_content'), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/site_content');
  }
}

export function subscribeBanners(
  onData: (banners: PromoBanner[]) => void,
  includeInactive = false
): Unsubscribe {
  const q = query(collection(db, 'banners'), orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        const list = INITIAL_BANNERS as PromoBanner[];
        onData(includeInactive ? list : list.filter((b) => b.active));
        return;
      }
      const list = snap.docs.map((d) => d.data() as PromoBanner);
      onData(includeInactive ? list : list.filter((b) => b.active));
    },
    () => {
      const list = INITIAL_BANNERS as PromoBanner[];
      onData(includeInactive ? list : list.filter((b) => b.active));
    }
  );
}

export async function saveBanner(banner: Omit<PromoBanner, 'updatedAt'>): Promise<void> {
  try {
    await setDoc(doc(db, 'banners', banner.id), {
      id: banner.id,
      title: banner.title.slice(0, 120),
      subtitle: (banner.subtitle || '').slice(0, 260),
      ctaLabel: (banner.ctaLabel || '').slice(0, 40),
      ctaLink: (banner.ctaLink || '').slice(0, 200),
      imageUrl: (banner.imageUrl || '').slice(0, 500),
      displayOrder: Number(banner.displayOrder) || 1,
      active: Boolean(banner.active),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `banners/${banner.id}`);
  }
}

export async function deleteBanner(bannerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'banners', bannerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `banners/${bannerId}`);
  }
}

// -----------------------------------------------------------------------------
// Portfolio
// -----------------------------------------------------------------------------
export function subscribePortfolio(
  onData: (items: PortfolioItem[]) => void,
  includeInactive = false
): Unsubscribe {
  const q = includeInactive
    ? query(collection(db, 'portfolio'), orderBy('displayOrder', 'asc'))
    : query(collection(db, 'portfolio'), where('active', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        const fallback = INITIAL_PORTFOLIO as PortfolioItem[];
        onData(includeInactive ? fallback : fallback.filter((p) => p.active));
        return;
      }
      const list = snap.docs
        .map((d) => d.data() as PortfolioItem)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      onData(list);
    },
    () => {
      const fallback = INITIAL_PORTFOLIO as PortfolioItem[];
      onData(includeInactive ? fallback : fallback.filter((p) => p.active));
    }
  );
}

export async function savePortfolioItem(
  item: Omit<PortfolioItem, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const path = `portfolio/${item.id}`;
  try {
    const payload = {
      id: item.id,
      title: item.title.slice(0, 140),
      description: item.description.slice(0, 1000),
      category: item.category.slice(0, 80),
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl.slice(0, 500),
      ...(item.thumbnailUrl ? { thumbnailUrl: item.thumbnailUrl.slice(0, 500) } : {}),
      featured: Boolean(item.featured),
      displayOrder: Number(item.displayOrder) || 1,
      active: Boolean(item.active),
      updatedAt: serverTimestamp(),
    };
    if (isNew) {
      await setDoc(doc(db, 'portfolio', item.id), { ...payload, createdAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, 'portfolio', item.id), payload);
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deletePortfolioItem(itemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'portfolio', itemId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `portfolio/${itemId}`);
  }
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------
export async function createNotification(input: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
}): Promise<void> {
  const id = makeId('notif');
  try {
    await setDoc(doc(db, 'notifications', id), {
      id,
      recipientId: input.recipientId.slice(0, 128),
      type: input.type.slice(0, 64),
      title: input.title.slice(0, 140),
      message: input.message.slice(0, 500),
      ...(input.projectId ? { projectId: input.projectId.slice(0, 128) } : {}),
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `notifications/${id}`);
  }
}

export function subscribeNotifications(
  recipientId: string,
  onData: (items: StudioNotification[]) => void
): Unsubscribe {
  const q = query(collection(db, 'notifications'), where('recipientId', '==', recipientId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as StudioNotification)
        .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllNotificationsRead(items: StudioNotification[]): Promise<void> {
  const unread = items.filter((n) => !n.read);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const n of unread) {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
  }
}

// -----------------------------------------------------------------------------
// Projects & Workflow Lifecycle
// -----------------------------------------------------------------------------
export async function submitProjectRequest(input: {
  projectId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  title: string;
  description: string;
  requirements?: string;
  preferredStyle?: string;
  deliveryFormat?: string;
  referenceLinks?: string[];
  attachmentUrls?: string[];
  notes?: string;
  contactPhone?: string;
  priceEstimate?: string;
}): Promise<EditingProject> {
  const id = input.projectId || makeId('proj');
  const projectCode = makeProjectCode();
  const payload = {
    id,
    projectCode,
    customerId: input.customerId,
    customerName: input.customerName.slice(0, 100),
    customerEmail: input.customerEmail.slice(0, 160),
    serviceId: input.serviceId.slice(0, 128),
    serviceTitle: input.serviceTitle.slice(0, 140),
    category: input.category.slice(0, 80),
    title: input.title.slice(0, 160),
    description: input.description.slice(0, 3000),
    requirements: (input.requirements || '').slice(0, 2000),
    preferredStyle: (input.preferredStyle || '').slice(0, 200),
    deliveryFormat: (input.deliveryFormat || '').slice(0, 120),
    referenceLinks: (input.referenceLinks || []).filter(Boolean).slice(0, 5).map((s) => s.slice(0, 400)),
    attachmentUrls: (input.attachmentUrls || []).filter(Boolean).slice(0, 10).map((s) => s.slice(0, 500)),
    fileCount: (input.attachmentUrls || []).length,
    notes: (input.notes || '').slice(0, 1500),
    contactPhone: (input.contactPhone || '').slice(0, 32),
    priceEstimate: (input.priceEstimate || '').slice(0, 100),
    status: 'Request Submitted' as ProjectStatus,
    revisionCount: 0,
    latestUpdate: 'Project request submitted and queued for studio review.',
    internalNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'projects', id), payload);

    const historyId = makeId('hist');
    await setDoc(doc(db, 'projects', id, 'history', historyId), {
      id: historyId,
      actorId: input.customerId,
      actorRole: 'customer',
      fromStatus: '',
      toStatus: 'Request Submitted',
      note: 'Project submitted by customer.',
      createdAt: serverTimestamp(),
    });

    await Promise.all([
      createNotification({
        recipientId: 'admin',
        type: 'project_submitted',
        title: `New Project Request · ${projectCode}`,
        message: `${input.customerName} submitted "${input.title}" (${input.serviceTitle}).`,
        projectId: id,
      }),
      createNotification({
        recipientId: input.customerId,
        type: 'project_submitted',
        title: `Request Received · ${projectCode}`,
        message: `Your project "${input.title}" has been received and is awaiting review.`,
        projectId: id,
      }),
    ]);

    return payload as unknown as EditingProject;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${id}`);
  }
}

export function subscribeCustomerProjects(
  customerId: string,
  onData: (projects: EditingProject[]) => void
): Unsubscribe {
  const q = query(collection(db, 'projects'), where('customerId', '==', customerId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as EditingProject)
        .sort((a, b) => getMillis(b.updatedAt) - getMillis(a.updatedAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    }
  );
}

export function subscribeAllProjects(onData: (projects: EditingProject[]) => void): Unsubscribe {
  const q = query(collection(db, 'projects'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as EditingProject)
        .sort((a, b) => getMillis(b.updatedAt) - getMillis(a.updatedAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    }
  );
}

export function subscribeProjectHistory(
  projectId: string,
  onData: (entries: ProjectHistoryEntry[]) => void
): Unsubscribe {
  const q = query(collection(db, 'projects', projectId, 'history'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as ProjectHistoryEntry)
        .sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/history`);
    }
  );
}

export function subscribeProjectMessages(
  projectId: string,
  onData: (msgs: ProjectMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, 'projects', projectId, 'messages'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as ProjectMessage)
        .sort((a, b) => getMillis(a.createdAt) - getMillis(b.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/messages`);
    }
  );
}

export async function sendProjectMessage(input: {
  projectId: string;
  projectCode: string;
  customerId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  body: string;
}): Promise<void> {
  const id = makeId('msg');
  try {
    await setDoc(doc(db, 'projects', input.projectId, 'messages', id), {
      id,
      senderId: input.senderId,
      senderName: input.senderName.slice(0, 100),
      senderRole: input.senderRole,
      body: input.body.slice(0, 2000),
      createdAt: serverTimestamp(),
    });

    await createNotification({
      recipientId: input.senderRole === 'admin' ? input.customerId : 'admin',
      type: 'project_message',
      title: `New Message · ${input.projectCode}`,
      message: `${input.senderName}: ${input.body.slice(0, 120)}`,
      projectId: input.projectId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${input.projectId}/messages/${id}`);
  }
}

export async function customerCancelProject(project: EditingProject): Promise<void> {
  if (!['Request Submitted', 'Reviewing', 'Waiting for Customer Information'].includes(project.status)) {
    throw new Error('This project can no longer be cancelled once editing has been accepted or started.');
  }
  try {
    await updateDoc(doc(db, 'projects', project.id), {
      status: 'Cancelled',
      latestUpdate: 'Cancelled by customer.',
      updatedAt: serverTimestamp(),
    });
    const historyId = makeId('hist');
    await setDoc(doc(db, 'projects', project.id, 'history', historyId), {
      id: historyId,
      actorId: project.customerId,
      actorRole: 'customer',
      fromStatus: project.status,
      toStatus: 'Cancelled',
      note: 'Project cancelled by customer.',
      createdAt: serverTimestamp(),
    });
    await createNotification({
      recipientId: 'admin',
      type: 'project_cancelled',
      title: `Project Cancelled · ${project.projectCode}`,
      message: `${project.customerName} cancelled "${project.title}".`,
      projectId: project.id,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
}

export async function customerRequestRevision(
  project: EditingProject,
  revisionNote: string
): Promise<void> {
  if (project.status !== 'Ready for Review') {
    throw new Error('Revisions can only be requested when the project is Ready for Review.');
  }
  const cleanNote = revisionNote.trim().slice(0, 500);
  if (cleanNote.length < 5) {
    throw new Error('Please describe the revision details clearly.');
  }
  try {
    await updateDoc(doc(db, 'projects', project.id), {
      status: 'Revision Requested',
      revisionCount: (project.revisionCount || 0) + 1,
      latestUpdate: `Revision requested: ${cleanNote}`,
      updatedAt: serverTimestamp(),
    });
    const historyId = makeId('hist');
    await setDoc(doc(db, 'projects', project.id, 'history', historyId), {
      id: historyId,
      actorId: project.customerId,
      actorRole: 'customer',
      fromStatus: project.status,
      toStatus: 'Revision Requested',
      note: cleanNote,
      createdAt: serverTimestamp(),
    });
    await createNotification({
      recipientId: 'admin',
      type: 'revision_requested',
      title: `Revision Requested · ${project.projectCode}`,
      message: `${project.customerName} requested a revision on "${project.title}".`,
      projectId: project.id,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
}

export async function customerAddProjectInfo(
  project: EditingProject,
  updates: { notes: string; attachmentUrls: string[]; referenceLinks: string[] }
): Promise<void> {
  if (!['Request Submitted', 'Waiting for Customer Information'].includes(project.status)) {
    throw new Error('Additional files or notes can only be added while pending review or waiting for info.');
  }
  try {
    await updateDoc(doc(db, 'projects', project.id), {
      notes: updates.notes.slice(0, 1500),
      attachmentUrls: updates.attachmentUrls.slice(0, 10),
      fileCount: updates.attachmentUrls.slice(0, 10).length,
      referenceLinks: updates.referenceLinks.slice(0, 5),
      updatedAt: serverTimestamp(),
    });
    await createNotification({
      recipientId: 'admin',
      type: 'files_added',
      title: `Project Info Updated · ${project.projectCode}`,
      message: `${project.customerName} updated notes or files on "${project.title}".`,
      projectId: project.id,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
}

export async function adminUpdateProjectStatus(input: {
  project: EditingProject;
  adminUid: string;
  nextStatus: ProjectStatus;
  updateNote: string;
  priceEstimate?: string;
  internalNotes?: string;
}): Promise<void> {
  const { project, adminUid, nextStatus, updateNote, priceEstimate, internalNotes } = input;
  const allowed = ALLOWED_ADMIN_TRANSITIONS[project.status] || [];
  if (nextStatus !== project.status && !allowed.includes(nextStatus)) {
    throw new Error(`Invalid workflow transition from "${project.status}" to "${nextStatus}".`);
  }
  try {
    const patch: Record<string, unknown> = {
      status: nextStatus,
      latestUpdate: (updateNote || `Status updated to ${nextStatus}.`).slice(0, 500),
      updatedAt: serverTimestamp(),
    };
    if (typeof priceEstimate === 'string') {
      patch.priceEstimate = priceEstimate.slice(0, 100);
    }
    if (typeof internalNotes === 'string') {
      patch.internalNotes = internalNotes.slice(0, 1500);
    }
    if (nextStatus === 'Completed') {
      patch.completedAt = new Date().toISOString();
    }

    await updateDoc(doc(db, 'projects', project.id), patch);

    if (nextStatus !== project.status || updateNote.trim()) {
      const historyId = makeId('hist');
      await setDoc(doc(db, 'projects', project.id, 'history', historyId), {
        id: historyId,
        actorId: adminUid,
        actorRole: 'admin',
        fromStatus: project.status,
        toStatus: nextStatus,
        note: (updateNote || `Status changed to ${nextStatus}`).slice(0, 600),
        createdAt: serverTimestamp(),
      });
    }

    await createNotification({
      recipientId: project.customerId,
      type: 'status_updated',
      title: `${project.projectCode} · ${nextStatus}`,
      message: updateNote || `Your project "${project.title}" is now ${nextStatus}.`,
      projectId: project.id,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
}

// -----------------------------------------------------------------------------
// Reviews & Admin Moderation / Replies
// -----------------------------------------------------------------------------
export function subscribeApprovedReviews(onData: (reviews: CustomerReview[]) => void): Unsubscribe {
  const q = query(collection(db, 'reviews'), where('moderationStatus', '==', 'approved'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as CustomerReview)
        .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
      onData(list);
    },
    (err) => {
      console.warn('Reviews read warning:', err.message);
      onData([]);
    }
  );
}

export function subscribeCustomerReviews(
  customerId: string,
  onData: (reviews: CustomerReview[]) => void
): Unsubscribe {
  const q = query(collection(db, 'reviews'), where('customerId', '==', customerId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as CustomerReview)
        .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'reviews');
    }
  );
}

export function subscribeAllReviews(onData: (reviews: CustomerReview[]) => void): Unsubscribe {
  const q = query(collection(db, 'reviews'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as CustomerReview)
        .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'reviews');
    }
  );
}

export async function submitCustomerReview(input: {
  customerId: string;
  displayName: string;
  projectId: string;
  category: string;
  rating: number;
  reviewText: string;
  photoUrls: string[];
}): Promise<void> {
  const id = makeId('rev');
  try {
    await setDoc(doc(db, 'reviews', id), {
      id,
      customerId: input.customerId,
      displayName: input.displayName.slice(0, 80),
      projectId: input.projectId,
      category: input.category.slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      reviewText: input.reviewText.slice(0, 1500),
      photoUrls: input.photoUrls.slice(0, 5),
      moderationStatus: 'pending',
      featured: false,
      adminReply: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await createNotification({
      recipientId: 'admin',
      type: 'review_submitted',
      title: 'New Customer Review Pending Moderation',
      message: `${input.displayName} submitted a ${input.rating}-star review for ${input.category}.`,
      projectId: input.projectId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reviews/${id}`);
  }
}

export async function adminModerateReview(
  review: CustomerReview,
  updates: {
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'hidden';
    featured: boolean;
    adminReply: string;
  }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reviews', review.id), {
      moderationStatus: updates.moderationStatus,
      featured: Boolean(updates.featured),
      adminReply: updates.adminReply.slice(0, 1000),
      adminReplyAt: updates.adminReply.trim() ? new Date().toISOString() : '',
      updatedAt: serverTimestamp(),
    });
    await createNotification({
      recipientId: review.customerId,
      type: 'review_moderated',
      title: `Review ${updates.moderationStatus === 'approved' ? 'Approved' : 'Updated'}`,
      message:
        updates.moderationStatus === 'approved'
          ? 'Thank you! Your review has been published on Sri Editing Studio.'
          : `Your review status was updated to ${updates.moderationStatus}.`,
      projectId: review.projectId,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `reviews/${review.id}`);
  }
}

export async function adminDeleteReview(reviewId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
  }
}

// -----------------------------------------------------------------------------
// Contacts & Users (Admin + Owner)
// -----------------------------------------------------------------------------
export async function submitContactInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  category: string;
  message: string;
}): Promise<void> {
  const id = makeId('msg');
  try {
    await setDoc(doc(db, 'contacts', id), {
      id,
      name: input.name.trim().slice(0, 100),
      email: input.email.trim().slice(0, 160),
      ...(input.phone ? { phone: input.phone.trim().slice(0, 32) } : {}),
      category: input.category.trim().slice(0, 80),
      message: input.message.trim().slice(0, 2000),
      status: 'new',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `contacts/${id}`);
  }
}

export function subscribeAllContacts(onData: (contacts: ContactMessage[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'contacts'),
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as ContactMessage)
        .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'contacts');
    }
  );
}

export async function adminUpdateContactStatus(
  contactId: string,
  status: 'new' | 'read' | 'replied'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'contacts', contactId), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `contacts/${contactId}`);
  }
}

export function subscribeAllCustomers(onData: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as UserProfile)
        .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  );
}

export async function getUserPrivateInfo(uid: string): Promise<UserPrivateInfo | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'info'));
    return snap.exists() ? (snap.data() as UserPrivateInfo) : null;
  } catch {
    return null;
  }
}

export async function updateUserProfileData(
  uid: string,
  profile: { displayName: string; phone?: string; preferredStyle?: string; bio?: string; email: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: profile.displayName.trim().slice(0, 100),
      updatedAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, 'users', uid, 'private', 'info'),
      {
        uid,
        email: profile.email.slice(0, 160),
        phone: (profile.phone || '').slice(0, 32),
        preferredStyle: (profile.preferredStyle || '').slice(0, 120),
        bio: (profile.bio || '').slice(0, 500),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export function getMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return Date.parse(ts) || 0;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    return ((ts as { seconds: number }).seconds || 0) * 1000;
  }
  return 0;
}

export function formatStudioDate(ts: unknown): string {
  const ms = getMillis(ts);
  if (!ms) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}
