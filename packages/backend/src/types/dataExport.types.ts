// Data Export Types for GDPR Article 20 Compliance

import type {
  User,
  TeamMember,
  DailyUpdate,
  Task,
  Impediment,
  RetrospectiveItem,
  RetroActionItem,
  RetroItemVote,
  Notification,
  RefreshToken,
  DoDChecklistVerification,
  DoRChecklistVerification,
  StakeholderFeedback,
  BacklogAdjustment,
  StatusChangeHistory,
} from '../generated/prisma/client';

// Export Job Status
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

// Export Job Interface
export interface ExportJob {
  id: string;
  userId: string;
  status: ExportStatus;
  filePath: string | null;
  fileSize: number | null;
  startedAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// GDPR Data Export Schema - Personal Data Only
// Note: Activity data (daily scrum updates, task assignments, etc.) is excluded
// as it represents business data rather than personal data under GDPR
export interface GDPRDataExport {
  exportMetadata: ExportMetadata;
  userProfile: UserProfileExport;
  teamMemberships: TeamMembershipExport[];
  sessionInformation: SessionExport[];
}

// Export Metadata
export interface ExportMetadata {
  version: string;
  exportedAt: string;
  userId: string;
  format: 'GDPR-PORTABLE-JSON';
  dataController: string;
  contactEmail: string;
  exportId: string;
}

// User Profile Export (without sensitive fields)
export interface UserProfileExport {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Team Membership Export
export interface TeamMembershipExport {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  joinedAt: string;
}

// Daily Update Export
export interface DailyUpdateExport {
  id: string;
  sprintId: string;
  sprintName: string;
  updateDate: string;
  yesterdayWork: string | null;
  todayWork: string | null;
  impediment: string | null;
  createdAt: string;
  updatedAt: string;
}

// Task Export
export interface TaskExport {
  id: string;
  sprintId: string;
  sprintName: string;
  pbiId: string;
  pbiTitle: string;
  title: string;
  description: string | null;
  status: string;
  estimatedHours: number | null;
  remainingHours: number | null;
  createdAt: string;
  updatedAt: string;
}

// Impediment Export
export interface ImpedimentExport {
  id: string;
  teamId: string;
  teamName: string;
  sprintId: string | null;
  title: string;
  description: string;
  status: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Retrospective Item Export
export interface RetrospectiveItemExport {
  id: string;
  retrospectiveId: string;
  category: string;
  content: string;
  votes: number;
  createdAt: string;
  updatedAt: string;
}

// Action Item Export
export interface ActionItemExport {
  id: string;
  retrospectiveId: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Vote Export
export interface VoteExport {
  id: string;
  retrospectiveItemId: string;
  itemContent: string;
  createdAt: string;
}

// DoD Verification Export
export interface DoDVerificationExport {
  id: string;
  pbiId: string;
  dodItemDescription: string;
  isVerified: boolean;
  verifiedAt: string;
  notes: string | null;
}

// DoR Verification Export
export interface DoRVerificationExport {
  id: string;
  pbiId: string;
  dorItemDescription: string;
  isVerified: boolean;
  verifiedAt: string;
  notes: string | null;
}

// Feedback Export
export interface FeedbackExport {
  id: string;
  reviewId: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Backlog Adjustment Export
export interface BacklogAdjustmentExport {
  id: string;
  reviewId: string;
  action: string;
  description: string;
  reason: string;
  implemented: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification Export
export interface NotificationExport {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// Session Export
export interface SessionExport {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

// Status Change Export
export interface StatusChangeExport {
  id: string;
  entityType: string;
  entityId: string;
  fromState: string | null;
  toState: string;
  changeReason: string | null;
  changeNotes: string | null;
  createdAt: string;
}

// Raw Data Collection (from database)
export interface UserDataCollection {
  user: User | null;
  teamMemberships: Array<TeamMember & { team: { id: string; name: string } }>;
  dailyUpdates: Array<DailyUpdate & { sprint: { id: string; name: string } }>;
  assignedTasks: Array<
    Task & { pbi: { id: string; title: string }; sprint: { id: string; name: string } }
  >;
  reportedImpediments: Array<Impediment & { team: { id: string; name: string } }>;
  ownedImpediments: Array<Impediment & { team: { id: string; name: string } }>;
  retrospectiveItems: RetrospectiveItem[];
  actionItems: RetroActionItem[];
  votes: Array<RetroItemVote & { retrospectiveItem: { id: string; content: string } }>;
  dodVerifications: Array<DoDChecklistVerification & { dodItem: { description: string } }>;
  dorVerifications: Array<DoRChecklistVerification & { dorItem: { description: string } }>;
  feedback: StakeholderFeedback[];
  backlogAdjustments: BacklogAdjustment[];
  notifications: Notification[];
  sessions: RefreshToken[];
  statusChanges: Array<
    StatusChangeHistory & { fromState: { name: string } | null; toState: { name: string } }
  >;
}

// Export Status Response
export interface ExportStatusResponse {
  jobId: string;
  status: ExportStatus;
  progress: number;
  fileSize: number | null;
  completedAt: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
}

// Export Initiation Response
export interface ExportInitiationResponse {
  jobId: string;
  status: ExportStatus;
  estimatedCompletionTime: string;
  message: string;
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  missingCategories: string[];
  errors: string[];
}

// Export File
export interface ExportFile {
  content: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

// Export Options
export interface ExportOptions {
  includeSessions?: boolean;
  includeNotifications?: boolean;
  dataCategories?: string[];
}

// Job Queue Item
export interface JobQueueItem {
  id: string;
  userId: string;
  status: ExportStatus;
  progress: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}
