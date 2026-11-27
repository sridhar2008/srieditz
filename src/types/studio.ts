export type ServiceCategory =
  | 'Photo Editing'
  | 'Video Editing'
  | 'Mobile Editing'
  | 'PC Editing'
  | 'Social Media'
  | 'Wedding'
  | 'Festival'
  | 'Logo'
  | 'Custom Projects';

export type PricingType = 'range' | 'fixed' | 'starting' | 'custom';

export type ProjectStatus =
  | 'Request Submitted'
  | 'Reviewing'
  | 'Accepted'
  | 'Editing in Progress'
  | 'Ready for Review'
  | 'Waiting for Customer Information'
  | 'Revision Requested'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'admin';
  accountStatus: 'active' | 'suspended';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone?: string;
  preferredStyle?: string;
  bio?: string;
  updatedAt?: unknown;
}

export interface EditingService {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  description: string;
  priceDisplay: string;
  priceMin?: number;
  priceMax?: number;
  pricingType: PricingType;
  promoText?: string;
  inclusions: string[];
  useCases: string[];
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EditingProject {
  id: string;
  projectCode: string;
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
  fileCount: number;
  notes?: string;
  contactPhone?: string;
  priceEstimate?: string;
  status: ProjectStatus;
  revisionCount: number;
  latestUpdate?: string;
  internalNotes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  completedAt?: string;
}

export interface ProjectHistoryEntry {
  id: string;
  actorId: string;
  actorRole: 'customer' | 'admin';
  fromStatus?: string;
  toStatus: string;
  note: string;
  createdAt?: unknown;
}

export interface ProjectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  body: string;
  createdAt?: unknown;
}

export interface CustomerReview {
  id: string;
  customerId: string;
  displayName: string;
  projectId: string;
  category: string;
  rating: number;
  reviewText: string;
  photoUrls: string[];
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'hidden';
  featured: boolean;
  adminReply: string;
  adminReplyAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  featured: boolean;
  displayOrder: number;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudioNotification {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  read: boolean;
  createdAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt?: unknown;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaLink?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  updatedAt?: unknown;
}

export interface SiteSettings {
  id: string;
  tagline: string;
  heroDescription: string;
  aboutIntro: string;
  aboutEditing: string;
  aboutApproach: string;
  aboutServices: string;
  aboutWorkflow: string;
  aboutCommitment: string;
  contactEmail: string;
  contactPhone: string;
  whatsappLink: string;
  instagramLink: string;
  youtubeLink: string;
  contactText: string;
  footerText: string;
  updatedAt?: unknown;
}
