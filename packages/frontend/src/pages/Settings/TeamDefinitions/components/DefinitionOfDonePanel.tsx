import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingState } from '../../../../components/common/Loading';
import { ToastContainer } from '../../../../components/common/ToastContainer';
import { definitionService } from '../../../../services';
import { useTeamStore } from '../../../../store';
import { useToast } from '../../../../hooks/useToast';
import { queryKeys } from '../../../../hooks/queryKeys';
import { DEFAULT_DOD_ITEMS } from '../constants/defaults';
import type { DefinitionOfDone, DoDItem, ApiResponse } from '../../../../types';

import { DefinitionEditor } from './DefinitionEditor';
import { DOD_CATEGORIES, getCategoryColor } from './categories';
import styles from './DefinitionOfDonePanel.module.css';

import { EditIcon, PlusIcon, RefreshCwIcon } from '@/components/common/Icons';

export function DefinitionOfDonePanel(): React.ReactElement {
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();
  const { currentTeam } = useTeamStore();
  const { toasts, success, error: showError, removeToast } = useToast();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse<DefinitionOfDone>>({
    queryKey: queryKeys.definitionOfDone.byTeam(currentTeam?.id || ''),
    queryFn: () => definitionService.getDefinitionOfDone(currentTeam!.id),
    enabled: !!currentTeam?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (items: DoDItem[]) =>
      definitionService.updateDefinitionOfDone(currentTeam!.id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.definitionOfDone.byTeam(currentTeam!.id),
      });
      setIsEditMode(false);
      success('Definition of Done updated successfully');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update Definition of Done';
      showError(message);
    },
  });

  const handleSave = async (items: DoDItem[]): Promise<void> => {
    await updateMutation.mutateAsync(items);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  if (!currentTeam) {
    return (
      <div className={styles.container}>
        <div className={styles['no-team']}>
          <div className={styles['no-team-icon']}>📋</div>
          <h2 className={styles['no-team-title']}>No Team Selected</h2>
          <p className={styles['no-team-text']}>
            Please select a team to view and manage the Definition of Done.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingState variant="spinner" size="md" label="Loading Definition of Done..." />
      </div>
    );
  }

  if (error && !response?.data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles['error-icon']}>⚠️</div>
          <h2 className={styles['error-title']}>Failed to Load</h2>
          <p>Unable to load Definition of Done. Using default items instead.</p>
          <button
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={() => refetch()}
          >
            <RefreshCwIcon size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const definition: DefinitionOfDone = response?.data || {
    id: 'default',
    teamId: currentTeam.id,
    items: DEFAULT_DOD_ITEMS,
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  const activeItems = definition.items
    .filter((item) => item.isActive)
    .sort((a, b) => a.order - b.order);

  const inactiveCount = definition.items.filter((item) => !item.isActive).length;

  if (isEditMode) {
    return (
      <div className={styles.container}>
        <DefinitionEditor
          definition={definition}
          definitionType="DoD"
          categories={DOD_CATEGORIES}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={updateMutation.isPending}
        />
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <div className={styles['empty-icon']}>📋</div>
          <h2 className={styles['empty-title']}>No Active DoD Items</h2>
          <p className={styles['empty-text']}>Configure your team's Definition of Done criteria.</p>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={() => setIsEditMode(true)}
          >
            <PlusIcon size={16} />
            Configure DoD
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles['header-left']}>
            <h3 className={styles['header-title']}>Definition of Done</h3>
            <div className={styles['version-info']}>
              <span className={styles['version-badge']}>v{definition.version}</span>
              <span className={styles['updated-info']}>
                Last updated: {formatDate(definition.updatedAt)}
              </span>
            </div>
          </div>
          <div className={styles['header-right']}>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={() => setIsEditMode(true)}
            >
              <EditIcon size={16} />
              Edit DoD
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {activeItems.map((item, index) => {
            const category = DOD_CATEGORIES.find((c) => c.value === item.category);
            const categoryStyle = getCategoryColor(item.category || '', DOD_CATEGORIES);

            return (
              <div key={item.id} className={styles.item}>
                <div className={styles['item-number']}>{index + 1}</div>
                <div
                  className={styles['item-category']}
                  style={categoryStyle}
                  title={category?.label || 'Uncategorized'}
                >
                  {category?.icon || '📌'}
                </div>
                <div className={styles['item-text']}>{item.description}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.counts}>
            <span className={styles['active-count']}>{activeItems.length} active items</span>
            {inactiveCount > 0 && (
              <span className={styles['inactive-count']}>{inactiveCount} inactive</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
