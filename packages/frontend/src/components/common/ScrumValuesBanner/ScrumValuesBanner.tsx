// ScrumValuesBanner
// Subtle rotating banner that highlights one of the five Scrum Values with
// its definition to keep the team's attention on the values.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './ScrumValuesBanner.module.css';

const SCRUM_VALUES = ['COMMITMENT', 'FOCUS', 'OPENNESS', 'RESPECT', 'COURAGE'];

interface ScrumValuesBannerProps {
  /** Rotation interval in milliseconds. Defaults to 10000 (10s). */
  intervalMs?: number;
}

export const ScrumValuesBanner: React.FC<ScrumValuesBannerProps> = ({ intervalMs = 10000 }) => {
  const { t } = useTranslation('scrum-master-dashboard');
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SCRUM_VALUES.length);
        setVisible(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const value = SCRUM_VALUES[index];

  return (
    <aside
      className={`${styles.banner} ${visible ? styles.visible : styles.hidden}`}
      role="region"
      aria-label={t('scrumValuesBanner.rotating')}
    >
      <span className={styles.label}>{t('scrumValuesBanner.todayFocus')}</span>
      <span className={styles.name}>{t(`scrumValues.values.${value}.label` as never)}</span>
      <span className={styles.definition}>
        {t(`scrumValues.values.${value}.definition` as never)}
      </span>
    </aside>
  );
};

export default ScrumValuesBanner;
