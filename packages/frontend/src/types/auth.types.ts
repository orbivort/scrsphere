/**
 * Authentication-related type definitions
 */

/**
 * Represents a user's team membership for account deletion eligibility checks
 */
export interface PendingDeletion {
  requestedAt: string;
  scheduledDeletionAt: string;
  gracePeriodDays: number;
}

export interface TeamMembership {
  id: string;
  name: string;
  role: string;
  isLastPO: boolean;
}

/**
 * Result of checking if a user is eligible for account deletion
 */
export interface DeletionEligibilityResult {
  canDelete: boolean;
  teams: TeamMembership[];
  blockedReason: string | null;
  pendingDeletion: PendingDeletion | null;
}
