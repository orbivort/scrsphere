export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  termsAcceptedAt?: string;
  marketingOptIn: boolean;
  marketingOptInAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  PRODUCT_OWNER = 'PRODUCT_OWNER',
  SCRUM_MASTER = 'SCRUM_MASTER',
  DEVELOPERS = 'DEVELOPERS',
}

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  teamId: string;
  smNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum SprintStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  status: BacklogItemStatus;
  priority: number;
  storyPoints?: number;
  teamId: string;
  sprintId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BacklogItemStatus {
  NEW = 'NEW',
  REFINED = 'REFINED',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  backlogItemId: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export interface DailyScrumBacklogAdjustment {
  id: string;
  sprintBacklogItemId: string;
  action: string;
  createdAt: string;
  sprintBacklogItem?: {
    id: string;
    pbiId: string;
    pbi?: {
      id: string;
      title: string;
    };
  } | null;
}

export interface DailyScrumParticipant {
  id: string;
  userId: string;
  userName?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * The structural focus the Developers choose for the Daily Scrum
 * (Scrum Guide: "the Developers can choose whatever structure and
 * techniques they want"). Persisted on the shared team record so
 * the whole team can see how the event is being run.
 */
export const DAILY_SCRUM_FOCUS_MODES = ['goal', 'backlog', 'impediment', 'pair'] as const;
export type DailyScrumFocusMode = (typeof DAILY_SCRUM_FOCUS_MODES)[number];

export interface DailyScrum {
  id: string;
  sprintId: string;
  scrumDate: string;
  progressNotes?: string | null;
  adaptationsNotes?: string | null;
  planForNextDay?: string | null;
  focusMode?: DailyScrumFocusMode | null;
  sprintGoal?: string | null;
  participants: DailyScrumParticipant[];
  backlogAdjustments: DailyScrumBacklogAdjustment[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyScrumParticipation {
  dailyScrum: DailyScrum | null;
  participants: DailyScrumParticipant[];
  nonParticipants: Array<{ userId: string; userName: string }>;
}

export interface DailyScrumBacklogAdjustmentInput {
  sprintBacklogItemId: string;
  action: string;
}

export * from './scrumGuideCompliance.js';
