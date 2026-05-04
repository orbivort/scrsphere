import React, { useState } from 'react';

import type { TeamMember } from '../../types';
import { MailIcon, TrashIcon } from '../../components/common/Icons';

import { SendMessageModal } from './SendMessageModal';
import styles from './Team.module.css';

const ROLE_BADGE_CLASSES: Record<string, string> = {
  scrum_master: 'role-scrum-master',
  product_owner: 'role-product-owner',
  developer: 'role-developer',
  administrator: 'role-administrator',
};

const ROLE_NAMES: Record<string, string> = {
  scrum_master: 'Scrum Master',
  product_owner: 'Product Owner',
  developer: 'Developer',
  administrator: 'Administrator',
};

const getRoleBadgeClass = (role: string): string => {
  const normalizedRole = role.toLowerCase();
  const className = ROLE_BADGE_CLASSES[normalizedRole] || 'role-default';
  return styles[className] || '';
};

const formatRoleName = (role: string): string => {
  const normalizedRole = role.toLowerCase();
  return (
    ROLE_NAMES[normalizedRole] || role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

interface MemberCardProps {
  member: TeamMember;
  canRemove: boolean;
  onDelete: (member: TeamMember) => void;
  isDeleting: boolean;
  viewMode?: 'card' | 'list';
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  canRemove,
  onDelete,
  isDeleting,
  viewMode = 'card',
}) => {
  const [showMessageModal, setShowMessageModal] = useState(false);

  const user = member.user;
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User'
    : 'Unknown User';
  const email = user?.email || 'No email';
  const role = member.role || 'developer';
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      '?'
    : '?';

  const memberSince = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
  };

  const handleDelete = () => {
    onDelete(member);
  };

  if (viewMode === 'list') {
    return (
      <>
        <article
          className={styles['member-row']}
          role="listitem"
          aria-label={`Team member: ${displayName}`}
        >
          <div className={styles['member-row-avatar']} aria-hidden="true">
            {initials}
          </div>
          <div className={styles['member-row-info']}>
            <span className={styles['member-row-name']}>{displayName}</span>
            <span className={styles['member-row-email']}>{email}</span>
          </div>
          <span
            className={`${styles['role-badge']} ${styles['role-badge-compact']} ${getRoleBadgeClass(role)}`}
          >
            {formatRoleName(role)}
          </span>
          <span className={styles['member-row-joined']}>{memberSince}</span>
          <div className={styles['member-row-actions']}>
            <button
              type="button"
              className={styles['action-button']}
              onClick={handleSendMessage}
              aria-label={`Send message to ${displayName}`}
              title="Send message"
            >
              <MailIcon />
            </button>
            {canRemove && (
              <button
                type="button"
                className={`${styles['action-button']} ${styles.delete}`}
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label={`Remove ${displayName} from team`}
                title="Remove from team"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </article>

        {showMessageModal && user && (
          <SendMessageModal
            isOpen={showMessageModal}
            onClose={handleCloseMessageModal}
            recipientId={user.id}
            recipientName={displayName}
            recipientEmail={email}
          />
        )}
      </>
    );
  }

  return (
    <>
      <article
        className={styles['member-card']}
        role="listitem"
        aria-label={`Team member: ${displayName}`}
      >
        <div className={styles['member-avatar']} aria-hidden="true">
          {initials}
        </div>
        <div className={styles['member-info']}>
          <div className={styles['member-name']}>{displayName}</div>
          <div className={styles['member-email']}>{email}</div>
          <div className={styles['member-meta']}>
            <span className={`${styles['role-badge']} ${getRoleBadgeClass(role)}`}>
              {formatRoleName(role)}
            </span>
            <span className={styles['member-since']}>Member since {memberSince}</span>
          </div>
        </div>
        <div className={styles['member-actions']}>
          <button
            type="button"
            className={styles['action-button']}
            onClick={handleSendMessage}
            aria-label={`Send message to ${displayName}`}
            title="Send message"
          >
            <MailIcon />
          </button>
          {canRemove && (
            <button
              type="button"
              className={`${styles['action-button']} ${styles.delete}`}
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label={`Remove ${displayName} from team`}
              title="Remove from team"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </article>

      {showMessageModal && user && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={handleCloseMessageModal}
          recipientId={user.id}
          recipientName={displayName}
          recipientEmail={email}
        />
      )}
    </>
  );
};
