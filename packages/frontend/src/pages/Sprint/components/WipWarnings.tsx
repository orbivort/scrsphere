import React from 'react';
import { useTranslation } from 'react-i18next';

import { AlertTriangleIcon } from '../../../components/common/Icons';
import type { WipWarning } from '../SprintBoard.types';
import styles from '../SprintBoard.module.css';

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
            column: t('taskStatus.inProgress'),
            current: warning.current,
            limit: warning.limit,
          })}
        </div>
      ))}
    </div>
  );
};
