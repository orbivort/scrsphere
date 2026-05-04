// User Types

export interface DeletionEligibilityResult {
  canDelete: boolean;
  teams: Array<{
    id: string;
    name: string;
    role: string;
    isLastPO: boolean;
  }>;
  blockedTeams: Array<{
    id: string;
    name: string;
  }>;
  blockedReason: string | null;
  pendingDeletion: {
    requestedAt: string;
    scheduledDeletionAt: string;
    gracePeriodDays: number;
  } | null;
}

export interface ScheduledDeletion {
  id: string;
  userId: string;
  requestedAt: Date;
  scheduledDeletionAt: Date;
  gracePeriodDays: number;
  status: 'PENDING' | 'CANCELLED' | 'EXECUTED' | 'EXPIRED';
  cancelledAt: Date | null;
  executedAt: Date | null;
  blockedTeamIds: string[];
  confirmationPhrase: string;
  forceConfirmed: boolean;
}
