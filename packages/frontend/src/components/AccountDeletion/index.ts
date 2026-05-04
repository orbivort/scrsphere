export { DangerZone } from './DangerZone';
export { default as DangerZoneDefault } from './DangerZone';

export { ConfirmationInput } from './ConfirmationInput';
export { default as ConfirmationInputDefault } from './ConfirmationInput';

export { TeamImpactWarning } from './TeamImpactWarning';
export { default as TeamImpactWarningDefault } from './TeamImpactWarning';

export { DeleteAccountModal } from './DeleteAccountModal';
export { default as DeleteAccountModalDefault } from './DeleteAccountModal';

export { GracePeriodProgress } from './GracePeriodProgress';
export { default as GracePeriodProgressDefault } from './GracePeriodProgress';

export { DeletionRightsNotice } from './DeletionRightsNotice';
export { default as DeletionRightsNoticeDefault } from './DeletionRightsNotice';

export { ForceDeleteWarning } from './ForceDeleteWarning';
export { default as ForceDeleteWarningDefault } from './ForceDeleteWarning';

// Re-export TeamMembership type directly from auth.types
export type { TeamMembership } from '../../types/auth.types';
export type { PendingDeletion } from '../../types/auth.types';

// Component prop interfaces
export interface DangerZoneProps {
  onDeleteClick: () => void;
}

export interface ConfirmationInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  disabled?: boolean;
  requiredPhrase?: string;
  onSubmit?: () => void;
  id?: string;
}

export interface TeamImpactWarningProps {
  teams: import('../../types/auth.types').TeamMembership[];
  isBlocked: boolean;
}

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  teams: import('../../types/auth.types').TeamMembership[];
  isBlocked: boolean;
  onDelete: (confirmation: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
  pendingDeletion?: import('../../types/auth.types').PendingDeletion | null;
  onScheduleDeletion?: () => Promise<void>;
  onCancelDeletion?: () => Promise<void>;
  onForceDelete?: () => Promise<void>;
}

export interface GracePeriodProgressProps {
  pendingDeletion: import('../../types/auth.types').PendingDeletion;
}

export type DeletionRightsNoticeProps = Record<string, never>;

export interface ForceDeleteWarningProps {
  blockedTeams: import('../../types/auth.types').TeamMembership[];
}
