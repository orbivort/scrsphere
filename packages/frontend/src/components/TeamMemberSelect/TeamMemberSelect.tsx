import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TeamMember } from '../../types';

import styles from './TeamMemberSelect.module.css';

interface TeamMemberSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  teamMembers: TeamMember[];
  label?: string;
  id?: string;
  error?: string;
}

export const TeamMemberSelect: React.FC<TeamMemberSelectProps> = ({
  value,
  onChange,
  disabled = false,
  teamMembers,
  label = 'Assign to',
  id = 'impediment-owner',
  error,
}) => {
  const { t } = useTranslation();

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'product_owner':
        return 'Product Owner';
      case 'scrum_master':
        return 'Scrum Master';
      case 'developers':
        return 'Developers';
      default:
        return role;
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className={styles['team-member-select']}
        value={value}
        onChange={(e) => {
          if (!disabled) {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">{t('unassigned')}</option>
        {teamMembers.map((member) => {
          const displayName =
            member.user?.firstName && member.user.lastName
              ? `${member.user.firstName} ${member.user.lastName}`
              : (member.user?.email ?? 'Unknown User');
          return (
            <option key={member.id} value={member.userId}>
              {displayName}
              {` (${getRoleLabel(member.role)})`}
            </option>
          );
        })}
      </select>
      {error && (
        <span id={`${id}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
