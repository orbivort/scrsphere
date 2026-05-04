// Type definitions for Agile Scrum Tracker

export enum UserRole {
  ADMINISTRATOR = 'administrator',
  PRODUCT_OWNER = 'product_owner',
  SCRUM_MASTER = 'scrum_master',
  DEVELOPER = 'developer',
}

export enum ItemStatus {
  NEW = 'NEW',
  REFINED = 'REFINED',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum MoSCoWPriority {
  MUST_HAVE = 'MUST_HAVE',
  SHOULD_HAVE = 'SHOULD_HAVE',
  COULD_HAVE = 'COULD_HAVE',
  WONT_HAVE = 'WONT_HAVE',
}

export enum ValueEffortLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum SprintStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ImpedimentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  termsAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  user?: User;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
}

export interface ProductGoal {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  status:
    | 'new'
    | 'NEW'
    | 'active'
    | 'ACTIVE'
    | 'completed'
    | 'COMPLETED'
    | 'abandoned'
    | 'ABANDONED';
  targetDate?: string;
  successMetrics?: string;
  strategicAlignment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  workflowId: string;
  fromStateId: string | null;
  toStateId: string;
  changedBy: string;
  changeReason: string | null;
  changeNotes: string | null;
  transitionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  fromState?: {
    id: string;
    name: string;
    displayName: string;
    color: string | null;
    icon: string | null;
  } | null;
  toState?: {
    id: string;
    name: string;
    displayName: string;
    color: string | null;
    icon: string | null;
  };
  changer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface ProductBacklogItem {
  id: string;
  teamId: string;
  goalId?: string;
  title: string;
  description?: string;
  priority: MoSCoWPriority;
  businessValue?: number;
  effort?: ValueEffortLevel;
  storyPoints?: number;
  status: ItemStatus;
  labels: string[];
  acceptanceCriteria?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  goal?: ProductGoal;
  creator?: User;
}

export interface Task {
  id: string;
  sprintId: string;
  pbiId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  pbi?: ProductBacklogItem;
}

export interface Sprint {
  id: string;
  teamId: string;
  goalId?: string;
  name: string;
  startDate: string;
  endDate: string;
  sprintGoal?: string;
  status: SprintStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  items?: ProductBacklogItem[];
  tasks?: Task[];
}

export interface SprintBacklogItem {
  id: string;
  sprintId: string;
  pbiId: string;
  addedAt: string;
  pbi?: ProductBacklogItem;
}

export interface BacklogChange {
  id: string;
  sprintId: string;
  pbiId: string;
  pbiTitle?: string;
  changeType: 'ADDED' | 'REMOVED';
  reason?: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  createdAt?: string;
  taskAction?: 'delete' | 'return_to_backlog' | 'keep_in_sprint';
}

export interface Impediment {
  id: string;
  teamId: string;
  sprintId?: string;
  title: string;
  description: string;
  reportedById: string;
  ownerId?: string;
  status: ImpedimentStatus;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reportedBy?: User;
  owner?: User;
  sprint?: { id: string; name: string };
  dailyUpdateId?: string;
  dailyUpdate?: DailyUpdate;
}

export interface DailyUpdate {
  id: string;
  sprintId: string;
  userId: string;
  updateDate: string;
  yesterdayWork?: string;
  todayWork?: string;
  impediment?: string;
  createdAt: string;
  user?: User;
  impedimentRecord?: Impediment;
}

export interface DefinitionOfDone {
  id: string;
  teamId: string;
  items: DoDItem[];
  version: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface DoDItem {
  id: string;
  description: string;
  category?: string; // e.g., 'quality', 'documentation', 'testing'
  isActive: boolean;
  order: number;
}

export interface DoDChecklistVerification {
  id: string;
  pbiId: string;
  dodItemId: string;
  isVerified: boolean;
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
  dodItemDescription?: string;
  dodItemCategory?: string;
  verifierName?: string | null;
}

export interface DoRChecklistVerification {
  id: string;
  pbiId: string;
  dorItemId: string;
  isVerified: boolean;
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
  dorItemDescription?: string;
}

export interface DefinitionOfReady {
  id: string;
  teamId: string;
  items: DoRItem[];
  version: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface DoRItem {
  id: string;
  description: string;
  category?: string;
  isActive: boolean;
  order: number;
}

export interface DoRChecklistVerification {
  id: string;
  pbiId: string;
  dorItemId: string;
  isVerified: boolean;
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
}

// Increment Types - Based on Scrum Guide
export enum IncrementStatus {
  DRAFT = 'DRAFT',
  VERIFIED = 'VERIFIED',
  DELIVERED = 'DELIVERED',
  ARCHIVED = 'ARCHIVED',
}

export enum DeliveryMethod {
  SPRINT_REVIEW = 'sprint_review',
  EARLY_RELEASE = 'early_release',
}

export interface Increment {
  id: string;
  sprintId: string;
  teamId: string;
  name: string;
  description?: string;
  includedPBIs: string[];
  dodVerifications: DoDChecklistVerification[];
  totalStoryPoints: number;
  status: IncrementStatus;
  createdAt: string;
  deliveredAt?: string;
  deliveryMethod?: DeliveryMethod;
  notes?: string;
  createdBy: string;
  sprint?: Sprint;
  pbis?: ProductBacklogItem[];
}

// Sprint Review Types
export interface SprintReview {
  id: string;
  sprintId: string;
  teamId: string;
  incrementId: string;
  reviewDate: string;
  attendees: ReviewAttendee[];
  feedback: StakeholderFeedback[];
  backlogAdjustments: BacklogAdjustment[];
  summary?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  increment?: Increment;
  sprint?: Sprint;
}

export interface ReviewAttendee {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: string; // 'product_owner', 'scrum_master', 'developer', 'stakeholder'
  attended: boolean;
}

export interface StakeholderFeedback {
  id: string;
  reviewId: string;
  authorName: string;
  content: string;
  category: 'positive' | 'negative' | 'suggestion' | 'question';
  relatedPbiId?: string;
  actionRequired: boolean;
  actionTaken: boolean;
  ownerId?: string;
  owner?: User;
  createdAt: string;
}

export interface BacklogAdjustment {
  id: string;
  reviewId: string;
  pbiId?: string;
  action: 'add' | 'modify' | 'remove' | 'reorder' | 'split';
  description: string;
  reason: string;
  implemented: boolean;
  ownerId?: string;
  owner?: User;
  createdAt: string;
}

// Sprint Retrospective Types
export enum RetrospectiveCategory {
  WENT_WELL = 'WENT_WELL',
  DIDNT_GO_WELL = 'DIDNT_GO_WELL',
  IMPROVEMENT = 'IMPROVEMENT',
}

export enum RetrospectiveStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface SprintRetrospective {
  id: string;
  sprintId: string;
  teamId: string;
  retroDate: string;
  facilitatorId: string;
  status: RetrospectiveStatus;
  participants: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role: string;
  }>;
  attendees: RetroAttendee[];
  items: RetrospectiveItem[];
  actionItems: RetroActionItem[];
  summary?: string;
  dodEvolutionNotes?: string; // Notes about DoD changes
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  sprint?: Sprint;
}

export interface RetrospectiveItem {
  id: string;
  retrospectiveId: string;
  category: RetrospectiveCategory;
  content: string;
  authorId?: string; // Optional if anonymous
  authorName?: string;
  votes: number;
  votedBy: string[]; // User IDs
  order: number;
  createdAt: string;
}

export interface RetroActionItem {
  id: string;
  retrospectiveId: string;
  title: string;
  description?: string;
  ownerId: string;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  addedToSprintBacklog: boolean;
  relatedSprintId?: string; // Sprint where action item is added
  createdAt: string;
  completedAt?: string;
  owner?: User;
}

export interface RetroAttendee {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  role: string; // 'product_owner', 'scrum_master', 'developer', 'stakeholder'
  attended: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chart data types
export interface BurndownData {
  date: string;
  ideal: number;
  actual: number;
}

export interface VelocityData {
  sprintNumber: number;
  sprintName: string;
  planned: number;
  completed: number;
}

export interface TeamMetrics {
  averageVelocity: number;
  velocityTrend: number;
  successRate: number;
  successRateTrend: number;
  impediments: {
    resolved: number;
    total: number;
  };
  teamSatisfaction: {
    rating: number;
    trend: number;
  };
}

export interface SprintHistoryItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  plannedPoints: number;
  completedPoints: number;
  teamMembers: number;
  impediments: number;
}

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'negative';
  icon: string;
  title: string;
  description: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  termsAccepted: true;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionInfo {
  expiresAt: string;
  idleTimeoutMs: number;
  absoluteTimeoutMs: number;
  warningThresholdMs: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  sessionInfo: SessionInfo;
}

export interface ActiveSession {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}

// Sprint Configuration Types
export enum SprintDuration {
  TWO_WEEKS = '2weeks',
  FOUR_WEEKS = '4weeks',
}

export interface SprintConfiguration {
  id: string;
  teamId: string;
  duration: SprintDuration;
  year: number;
  sprintStartDay: number; // 0 = Sunday, 1 = Monday, etc.
  generatedAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface GeneratedSprint {
  id: string;
  teamId: string;
  name: string; // e.g., "Sprint-2601 (2026/1/5-2026/1/16)"
  sprintNumber: number; // 01, 02, etc.
  year: number;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  sprintGoal?: string;
  createdAt: string;
}

export interface SprintGenerationResult {
  success: boolean;
  generatedCount: number;
  sprints: GeneratedSprint[];
  message?: string;
}

// System Parameter Types
export interface SystemParameter {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedBy: string;
  updatedAt: string;
}

// Increment Analytics Types
export interface IncrementMetrics {
  totalIncrements: number;
  deliveredIncrements: number;
  averageDeliveryTime: number; // in days from creation to delivery
  averageStoryPoints: number;
  earlyReleases: number;
  sprintReviewDeliveries: number;
}

export interface IncrementTimelineItem {
  increment: Increment;
  sprint: Sprint;
  pbis: ProductBacklogItem[];
}

// DoD Compliance Types
export interface DoDComplianceReport {
  sprintId: string;
  totalPBIs: number;
  dodCompliantPBIs: number;
  pendingVerification: number;
  failedCompliance: number;
  complianceRate: number;
  pbiDetails: PBIComplianceDetail[];
}

export interface PBIComplianceDetail {
  pbiId: string;
  pbiTitle: string;
  status: ItemStatus;
  dodItemsTotal: number;
  dodItemsVerified: number;
  compliancePercentage: number;
  verifications: DoDChecklistVerification[];
}

export interface WorkflowState {
  id: string;
  workflowId: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  icon?: string;
  isFinal: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface StatusChangeHistoryItem {
  id: string;
  entityType: string;
  entityId: string;
  workflowId: string;
  fromStateId?: string;
  toStateId: string;
  changedBy: string;
  changeReason?: string;
  changeNotes?: string;
  transitionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  fromState?: WorkflowState;
  toState?: WorkflowState;
  changer?: User;
}

// Re-export auth types
export type { TeamMembership, DeletionEligibilityResult, PendingDeletion } from './auth.types';
