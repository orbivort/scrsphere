import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../services';
import { IncrementStatus } from '../../types';
import { useTeamContext } from '../../contexts/TeamContext';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';

import styles from './IncrementList.module.css';

import {
  ArchiveIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  FileTextIcon,
  PackageIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  SprintIcon,
  ZapIcon,
} from '@/components/common/Icons';

// Icons imported from shared library

export const IncrementList: React.FC = () => {
  const navigate = useNavigate();
  const { currentTeam } = useTeamContext();
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incrementsData, isLoading: isLoadingIncrements } = useQuery({
    queryKey: ['increments', currentTeam?.id],
    queryFn: () => {
      if (!currentTeam?.id) throw new Error('Team ID is required');
      return apiService.getIncrements(currentTeam.id);
    },
    enabled: !!currentTeam?.id,
  });

  const increments = incrementsData?.data ?? [];

  const filteredIncrements = increments.filter((increment) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' &&
        (increment.status === IncrementStatus.DRAFT ||
          increment.status === IncrementStatus.VERIFIED)) ||
      (filter === 'delivered' && increment.status === IncrementStatus.DELIVERED) ||
      (filter === 'archived' && increment.status === IncrementStatus.ARCHIVED);

    const matchesSearch =
      !searchQuery ||
      increment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      increment.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: increments.length,
    active: increments.filter(
      (i) => i.status === IncrementStatus.DRAFT || i.status === IncrementStatus.VERIFIED
    ).length,
    delivered: increments.filter((i) => i.status === IncrementStatus.DELIVERED).length,
    storyPoints: increments.reduce((sum, i) => sum + (i.totalStoryPoints || 0), 0),
  };

  const getStatusIcon = (status: IncrementStatus) => {
    switch (status) {
      case IncrementStatus.DELIVERED:
        return <CheckIcon size={12} strokeWidth={3} />;
      case IncrementStatus.ARCHIVED:
        return <ArchiveIcon size={12} />;
      default:
        return <FileTextIcon size={12} />;
    }
  };

  const getStatusLabel = (status: IncrementStatus) => {
    switch (status) {
      case IncrementStatus.DRAFT:
        return 'Draft';
      case IncrementStatus.VERIFIED:
        return 'Verified';
      case IncrementStatus.DELIVERED:
        return 'Delivered';
      case IncrementStatus.ARCHIVED:
        return 'Archived';
      default:
        return status;
    }
  };

  const getDeliveryMethodLabel = (method?: string) => {
    if (!method) return null;
    return method.toLowerCase() === 'sprint_review' ? 'Sprint Review' : 'Early Release';
  };

  const getDeliveryMethodIcon = (method?: string) => {
    if (!method) return null;
    return method.toLowerCase() === 'sprint_review' ? (
      <CheckCircleIcon size={12} />
    ) : (
      <ZapIcon size={12} />
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!currentTeam?.id) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (isLoadingIncrements) {
    return (
      <div className={styles['increment-list-page']}>
        <LoadingState variant="page" label="Loading increments..." />
      </div>
    );
  }

  return (
    <div className={styles['increment-list-page']}>
      <div className={styles['page-header']}>
        <div className={styles['header-left']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <PackageIcon size={28} aria-hidden="true" />
            </span>
            Increments
          </h1>
          <p className={styles['page-subtitle']}>
            Manage and track your product increments. Increments represent working, usable
            functionality that is ready for delivery to stakeholders.
          </p>
        </div>
        <div className={styles['header-actions']}>
          <button
            className={`${styles.btn} ${styles['btn-primary']}`}
            onClick={() => navigate('/increment/create')}
          >
            <PlusIcon size={16} />
            Create Increment
          </button>
        </div>
      </div>

      <div className={styles['stats-grid']}>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <PackageIcon size={48} strokeWidth={1.5} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{stats.total}</div>
            <div className={styles['stat-label']}>Total Increments</div>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <RocketIcon size={16} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{stats.active}</div>
            <div className={styles['stat-label']}>Active</div>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <CheckIcon size={16} strokeWidth={3} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{stats.delivered}</div>
            <div className={styles['stat-label']}>Delivered</div>
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-icon']}>
            <ZapIcon size={16} />
          </div>
          <div className={styles['stat-content']}>
            <div className={styles['stat-value']}>{stats.storyPoints}</div>
            <div className={styles['stat-label']}>Story Points</div>
          </div>
        </div>
      </div>

      <div className={styles['filters-bar']}>
        <div className={styles['search-box']}>
          <SearchIcon size={16} />
          <input
            type="text"
            className={styles['search-input']}
            placeholder="Search increments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search increments"
          />
          {searchQuery && (
            <button
              className={styles['clear-search']}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles['filter-tabs']}>
          <button
            className={`${styles['filter-tab']} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles['filter-tab']} ${filter === 'active' ? styles.active : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`${styles['filter-tab']} ${filter === 'delivered' ? styles.active : ''}`}
            onClick={() => setFilter('delivered')}
          >
            Delivered
          </button>
          <button
            className={`${styles['filter-tab']} ${filter === 'archived' ? styles.active : ''}`}
            onClick={() => setFilter('archived')}
          >
            Archived
          </button>
        </div>
      </div>

      <div className={styles['increments-grid']}>
        {filteredIncrements.length === 0 ? (
          <div className={styles['empty-state']}>
            <div className={styles['empty-illustration']}>
              <PackageIcon size={48} strokeWidth={1.5} />
            </div>
            <h3>No Increments found</h3>
            <p className={styles['empty-description']}>
              {searchQuery
                ? 'No Increments match your search criteria. Try adjusting your filters.'
                : "You haven't created any Increment yet. Get started by creating your first Increment."}
            </p>
            <div className={styles['empty-actions']}>
              <button
                className={`${styles.btn} ${styles['btn-primary']}`}
                onClick={() => navigate('/increment/create')}
              >
                <PlusIcon size={16} />
                Create Increment
              </button>
            </div>
          </div>
        ) : (
          filteredIncrements.map((increment) => (
            <div
              key={increment.id}
              className={styles['increment-card']}
              onClick={() => void navigate(`/increment/${increment.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  void navigate(`/increment/${increment.id}`);
                }
              }}
            >
              <div className={styles['card-sprint-indicator']} />
              <div className={styles['card-sprint-header']}>
                <span className={styles['sprint-badge']}>
                  <span className={styles['sprint-badge-icon']}>
                    <SprintIcon size={14} />
                  </span>
                  <span className={styles['sprint-badge-name']}>
                    {increment.sprint?.name ?? `SPRINT ${increment.sprintId}`}
                  </span>
                </span>
              </div>
              <div className={styles['card-header']}>
                <h3 className={styles['increment-name']}>{increment.name}</h3>
                <span
                  className={styles['status-badge']}
                  data-status={increment.status.toLowerCase()}
                >
                  <span>{getStatusIcon(increment.status)}</span>
                  <span>{getStatusLabel(increment.status)}</span>
                </span>
              </div>
              <p className={styles['increment-description']}>
                {increment.description ?? 'No description provided.'}
              </p>
              <div className={styles['card-stats']}>
                <div className={styles.stat}>
                  <span className={styles['stat-label']}>PBIs</span>
                  <span className={styles['stat-value']}>{increment.includedPBIs.length || 0}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles['stat-label']}>Points</span>
                  <span className={styles['stat-value']}>{increment.totalStoryPoints || 0}</span>
                </div>
              </div>
              <div className={styles['card-footer']}>
                <div className={styles.dates}>
                  <span>
                    <CalendarIcon size={12} />
                    Created {formatDate(increment.createdAt)}
                  </span>
                  {increment.deliveredAt && (
                    <span>
                      <CheckIcon size={12} strokeWidth={3} />
                      Delivered {formatDate(increment.deliveredAt)}
                    </span>
                  )}
                </div>
                {increment.deliveryMethod && (
                  <span className={styles['delivery-method']}>
                    {getDeliveryMethodIcon(increment.deliveryMethod)}
                    {getDeliveryMethodLabel(increment.deliveryMethod)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
