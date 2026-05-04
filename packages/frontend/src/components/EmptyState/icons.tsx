/**
 * EmptyState Icons
 *
 * Re-exports shared icon components with default size of 64 for EmptyState
 */

import React from 'react';

import {
  ArrowRightIcon as SharedArrowRightIcon,
  ClipboardListIcon as SharedClipboardListIcon,
  ErrorIcon as SharedErrorIcon,
  FlagIcon as SharedFlagIcon,
  GoalIcon as SharedGoalIcon,
  InboxIcon as SharedInboxIcon,
  RunningIcon as SharedRunningIcon,
  SearchIcon as SharedSearchIcon,
  SprintIcon as SharedSprintIcon,
  UsersIcon as SharedUsersIcon,
} from '@/components/common/Icons';

interface IconProps {
  size?: number;
  className?: string;
}

export const UsersIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedUsersIcon size={size} className={className} />
);

export const GoalIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedGoalIcon size={size} className={className} />
);

export const SprintIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedSprintIcon size={size} className={className} />
);

export const RunningIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedRunningIcon size={size} className={className} />
);

export const InboxIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedInboxIcon size={size} className={className} />
);

export const ErrorIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedErrorIcon size={size} className={className} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedSearchIcon size={size} className={className} />
);

export const FlagIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedFlagIcon size={size} className={className} />
);

export const ClipboardListIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <SharedClipboardListIcon size={size} className={className} />
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <SharedArrowRightIcon size={size} className={className} />
);
