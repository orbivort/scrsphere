import React from 'react';
import { useTranslation } from 'react-i18next';

import { TaskStatus as TaskStatusEnum, type TaskStatus } from '../../../types';
import { AlertTriangleIcon } from '../../../components/common/Icons';
import type { WipWarning } from '../SprintBoard.types';
import styles from '../SprintBoard.module.css';

const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskStatus.todo',
  [TaskStatusEnum.IN_PROGRESS]: 'taskStatus.inProgress',
  [TaskStatusEnum.REVIEW]: 'taskStatus.review',
  [TaskStatusEnum.DONE]: 'taskStatus.done',
};

export interface WipWarningsProps {
  warnings: WipWarning[];
}

export const WipWarnings: React.FC<WipWarningsProps> = ({ warnings }) => {
  const { t } = useTranslation('sprint');

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className={styles['wip-warnings']} role="alert">
      {warnings.map((warning, i) => (
        <div key={i} className={styles['wip-warning']}>
          <AlertTriangleIcon size={14} aria-hidden="true" />
          {t('wipWarnings.limitExceeded', {
            column: t(STATUS_LABEL_KEYS[warning.column] as never),
            current: warning.current,
            limit: warning.limit,
          })}
        </div>
      ))}
    </div>
  );
};
