import React, { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import styles from './TeamList.module.css';

import type { Team } from '@/types/teamManagement.types';
import { useI18nStore } from '@/i18n/useI18nStore';
import {
  EditIcon,
  TrashIcon,
  AlertCircleIcon,
  UsersIcon,
  CheckIcon,
  PlusIcon,
} from '@/components/common/Icons';

interface TeamListProps {
  teams: Team[];
  isLoading: boolean;
  error: Error | null;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  canEdit: boolean;
  canDelete: boolean;
  canEditTeam?: (team: Team) => boolean;
  canDeleteTeam?: (team: Team) => boolean;
  onRetry?: () => void;
  onCreateTeam?: (searchValue?: string) => void;
  onClearSearch?: () => void;
  search?: string;
  editingTeamId?: string | null;
  deletingTeamId?: string | null;
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  isLoading,
  error,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  canEditTeam,
  canDeleteTeam,
  onRetry,
  onCreateTeam,
  onClearSearch,
  search,
  editingTeamId,
  deletingTeamId,
}) => {
  const editButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const deleteButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const { t } = useTranslation('settings');
  const { locale } = useI18nStore();

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent, team: Team, index: number) => {
      const hasEditButton = canEdit && (!canEditTeam || canEditTeam(team));
      const hasDeleteButton = canDelete && (!canDeleteTeam || canDeleteTeam(team));
      const editButton = editButtonRefs.current[team.id];
      const deleteButton = deleteButtonRefs.current[team.id];

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          // Focus the first available action button
          if (hasEditButton && editButton) {
            editButton.focus();
          } else if (hasDeleteButton && deleteButton) {
            deleteButton.focus();
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          // Navigate from Edit to Delete button
          if (document.activeElement === editButton && hasDeleteButton && deleteButton) {
            deleteButton.focus();
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          // Navigate from Delete to Edit button
          if (document.activeElement === deleteButton && hasEditButton && editButton) {
            editButton.focus();
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          // Move focus to next card
          {
            const nextCard = document.querySelector<HTMLElement>(
              `[data-team-index="${index + 1}"]`
            );
            nextCard?.focus();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          // Move focus to previous card
          {
            const prevCard = document.querySelector<HTMLElement>(
              `[data-team-index="${index - 1}"]`
            );
            prevCard?.focus();
          }
          break;
      }
    },
    [canEdit, canDelete, canEditTeam, canDeleteTeam]
  );

  if (isLoading) {
    return (
      <div className={styles['team-list-loading']} role="status" aria-live="polite">
        <div className={styles['loading-spinner']} aria-hidden="true">
          <div className={styles['loading-spinner-circle']} />
        </div>
        <p>{t('teamList.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['team-list-error']} role="alert" aria-live="assertive">
        <span className={styles['error-icon']} aria-hidden="true">
          <AlertCircleIcon size={48} strokeWidth={1.5} />
        </span>
        <p>{t('teamList.error')}</p>
        {onRetry && (
          <button className={styles['button-primary']} onClick={onRetry} type="button">
            {t('teamList.retry')}
          </button>
        )}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className={styles['team-list-empty']} role="status" aria-live="polite">
        <div className={styles['empty-state-container']}>
          {/* Animated Illustration */}
          <div className={styles['empty-illustration']}>
            <div className={styles['illustration-bg']}>
              <div className={styles['illustration-circle-1']} />
              <div className={styles['illustration-circle-2']} />
              <div className={styles['illustration-circle-3']} />
            </div>
            <div className={styles['illustration-icon']}>
              <UsersIcon size={64} strokeWidth={1.5} />
            </div>
            <div className={styles['illustration-sparkles']}>
              <span className={styles['sparkle-1']} />
              <span className={styles['sparkle-2']} />
              <span className={styles['sparkle-3']} />
            </div>
          </div>

          {/* Content */}
          <div className={styles['empty-content']}>
            <h3 className={styles['empty-title']}>
              {search
                ? t('teamList.empty.searchNoResults', { search })
                : t('teamList.empty.defaultTitle')}
            </h3>

            <p className={styles['empty-description']}>
              {search
                ? t('teamList.empty.searchDescription')
                : t('teamList.empty.defaultDescription')}
            </p>

            {/* Benefits List */}
            {!search && (
              <ul className={styles['empty-benefits']}>
                <li className={styles['benefit-item']}>
                  <span className={styles['benefit-icon']}>
                    <CheckIcon size={16} />
                  </span>
                  <span>{t('teamList.empty.benefits.sprintPlanning')}</span>
                </li>
                <li className={styles['benefit-item']}>
                  <span className={styles['benefit-icon']}>
                    <CheckIcon size={16} />
                  </span>
                  <span>{t('teamList.empty.benefits.progressTracking')}</span>
                </li>
                <li className={styles['benefit-item']}>
                  <span className={styles['benefit-icon']}>
                    <CheckIcon size={16} />
                  </span>
                  <span>{t('teamList.empty.benefits.agileCeremonies')}</span>
                </li>
              </ul>
            )}

            {/* CTA Button */}
            {onCreateTeam && (
              <div className={styles['empty-actions']}>
                <button
                  className={styles['empty-cta-button']}
                  onClick={() => onCreateTeam(search)}
                  type="button"
                >
                  <span className={styles['cta-icon']}>
                    <PlusIcon size={20} />
                  </span>
                  <span>
                    {search
                      ? t('teamList.empty.createNewTeam')
                      : t('teamList.empty.createFirstTeam')}
                  </span>
                </button>

                {search && (
                  <button
                    className={styles['empty-secondary-action']}
                    onClick={onClearSearch}
                    type="button"
                  >
                    {t('teamList.empty.clearSearchBrowse')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Decorative Elements */}
          <div className={styles['empty-decoration']} aria-hidden="true">
            <div className={styles['decoration-dot-1']} />
            <div className={styles['decoration-dot-2']} />
            <div className={styles['decoration-dot-3']} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['team-list']} role="list" aria-label={t('teamList.ariaLabel')}>
      {teams.map((team, index) => (
        <article
          key={team.id}
          className={styles['team-card']}
          role="listitem"
          tabIndex={0}
          data-team-index={index}
          onKeyDown={(e) => handleCardKeyDown(e, team, index)}
          aria-label={t('teamList.card.cardAriaLabel', {
            name: team.name,
            count: team.memberCount ?? 0,
          })}
        >
          <div className={styles['team-card-header']}>
            <h3 className={styles['team-card-name']}>{team.name}</h3>
            <span className={styles['team-card-members']}>
              {team.maxSize !== undefined
                ? t('teamList.card.memberCountLimit', {
                    count: team.memberCount ?? 0,
                    max: team.maxSize,
                  })
                : t('teamList.card.memberCount', { count: team.memberCount ?? 0 })}
            </span>
          </div>

          {team.description && (
            <p className={styles['team-card-description']}>{team.description}</p>
          )}

          <div className={styles['team-card-meta']}>
            <span className={styles['team-card-creator']}>
              {t('teamList.card.createdBy', {
                firstName: team.creator?.firstName ?? '',
                lastName: team.creator?.lastName ?? '',
              })}
            </span>
            <span className={styles['team-card-date']}>
              {formatLocaleDate(team.createdAt, locale)}
            </span>
          </div>

          <div className={styles['team-card-actions']}>
            {canEdit && (!canEditTeam || canEditTeam(team)) && (
              <button
                ref={(el) => {
                  editButtonRefs.current[team.id] = el;
                }}
                className={`${styles['team-card-action']} ${styles['team-card-action-edit']}`}
                onClick={() => onEdit(team)}
                aria-label={t('teamList.card.editTeam', { name: team.name })}
                aria-busy={editingTeamId === team.id}
                disabled={editingTeamId === team.id || deletingTeamId === team.id}
                type="button"
              >
                {editingTeamId === team.id ? (
                  <>
                    <span className={styles['button-spinner']} aria-hidden="true" />
                    {t('teamList.card.loading')}
                  </>
                ) : (
                  <>
                    <EditIcon size={16} className={styles['button-icon']} />
                    {t('teamList.card.edit')}
                  </>
                )}
              </button>
            )}
            {canDelete && (!canDeleteTeam || canDeleteTeam(team)) && (
              <button
                ref={(el) => {
                  deleteButtonRefs.current[team.id] = el;
                }}
                className={`${styles['team-card-action']} ${styles['team-card-action-delete']}`}
                onClick={() => onDelete(team)}
                aria-label={t('teamList.card.deleteTeam', { name: team.name })}
                aria-busy={deletingTeamId === team.id}
                disabled={editingTeamId === team.id || deletingTeamId === team.id}
                type="button"
              >
                {deletingTeamId === team.id ? (
                  <>
                    <span className={styles['button-spinner']} aria-hidden="true" />
                    {t('teamList.card.deleting')}
                  </>
                ) : (
                  <>
                    <TrashIcon size={16} className={styles['button-icon']} />
                    {t('teamList.card.delete')}
                  </>
                )}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};
