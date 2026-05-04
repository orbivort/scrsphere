import React from 'react';

import { AlertTriangleIcon } from '../../../components/common/Icons';
import type { WipWarning } from '../SprintBoard.types';
import styles from '../SprintBoard.module.css';

export interface WipWarningsProps {
  warnings: WipWarning[];
}

export const WipWarnings: React.FC<WipWarningsProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className={styles['wip-warnings']} role="alert">
      {warnings.map((warning, i) => (
        <div key={i} className={styles['wip-warning']}>
          <AlertTriangleIcon size={14} aria-hidden="true" />
          WIP limit exceeded for In Progress: {warning.current}/{warning.limit} tasks
        </div>
      ))}
    </div>
  );
};
