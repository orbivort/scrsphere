import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingState } from '../../../../components/common/Loading';
import { ToastContainer } from '../../../../components/common/ToastContainer';
import { apiService } from '../../../../services';
import { useTeamStore } from '../../../../store';
import { useToast } from '../../../../hooks/useToast';
import { queryKeys } from '../../../../hooks/queryKeys';
import { DEFAULT_DOR_ITEMS } from '../constants/defaults';
import type { DefinitionOfReady, DoRItem, ApiResponse } from '../../../../types';

import { DefinitionEditor } from './DefinitionEditor';
import { DOR_CATEGORIES, getCategoryColor } from './categories';
import styles from './DefinitionOfReadyPanel.module.css';

import { EditIcon, PlusIcon, RefreshCwIcon } from '@/components/common/Icons';

export function DefinitionOfReadyPanel(): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;
  const { toasts, success, error: showError, removeToast } = useToast();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse<DefinitionOfReady>>({
    queryKey: queryKeys.definitionOfReady.byTeam(teamId ?? ''),
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getDefinitionOfReady(teamId);
    },
    enabled: !!teamId,
  });

  const definition = response?.data;
  const items =
    definition?.items && definition.items.length > 0 ? definition.items : DEFAULT_DOR_ITEMS;

  const updateMutation = useMutation({
    mutationFn: (updatedItems: DoRItem[]) => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.updateDefinitionOfReady(teamId, updatedItems);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.definitionOfReady.byTeam(teamId ?? ''),
      });
      setIsEditing(false);
      success('Definition of Ready updated successfully');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update Definition of Ready';
      showError(message);
    },
  });

  const handleSave = async (updatedItems: DoRItem[]): Promise<void> => {
    await updateMutation.mutateAsync(updatedItems);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleConfigure = () => {
    setIsEditing(true);
  };

  if (!teamId) {
    return (
      <div className={styles.container}>
        <div className={styles['no-team']}>
          <p>Please select a team to view Definition of Ready.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingState variant="spinner" size="md" label="Loading Definition of Ready..." />
      </div>
    );
  }

  if (error && !response?.data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to load Definition of Ready</p>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={() => refetch()}
          >
            <RefreshCwIcon size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <DefinitionEditor
        definition={{
          items,
          version: definition?.version ?? 1,
          updatedAt: definition?.updatedAt ?? new Date().toISOString(),
        }}
        definitionType="DoR"
        categories={DOR_CATEGORIES}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
      />
    );
  }

  const sortedItems = [...items].sort((a, b) => a.order - b.order);
  const activeItems = sortedItems.filter((item) => item.isActive);
  const inactiveItems = sortedItems.filter((item) => !item.isActive);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isEmpty = items.length === 0 || (response?.data?.items.length ?? 0) === 0;

  if (isEmpty) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3 className={styles['empty-title']}>Definition of Ready</h3>
          <p className={styles['empty-text']}>
            No Definition of Ready configured for this team yet.
          </p>
          <p className={styles['empty-description']}>
            The Definition of Ready is a checklist of criteria that a user story must meet before it
            can be taken into a sprint.
          </p>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={handleConfigure}
          >
            <PlusIcon size={16} />
            Configure DoR
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles['header-left']}>
            <h3 className={styles['header-title']}>Definition of Ready</h3>
            <div className={styles['header-meta']}>
              <span className={styles['version-badge']}>v{definition?.version ?? 1}</span>
              {definition?.updatedAt && (
                <span className={styles['updated-date']}>
                  Last updated: {formatDate(definition.updatedAt)}
                </span>
              )}
            </div>
          </div>
          <div className={styles['header-right']}>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={handleConfigure}
            >
              <EditIcon size={16} />
              Edit DoR
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {activeItems.map((item, index) => {
            const category = DOR_CATEGORIES.find((c) => c.value === item.category);
            return (
              <div key={item.id} className={styles.item}>
                <span className={styles['item-order']}>{index + 1}</span>
                <span
                  className={styles['item-category']}
                  style={getCategoryColor(item.category ?? '', DOR_CATEGORIES)}
                >
                  {category?.icon} {category?.label}
                </span>
                <span className={styles['item-description']}>{item.description}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.counts}>
            <span className={styles['active-count']}>{activeItems.length} active items</span>
            {inactiveItems.length > 0 && (
              <span className={styles['inactive-count']}>{inactiveItems.length} inactive</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
