import React from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';

import styles from './LanguageSwitcher.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dropdown' }) => {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18nStore();

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    // Server-side locale persistence will be added when the API
    // supports locale updates in the profile endpoint
  };

  return (
    <div className={styles.container} data-variant={variant}>
      <label htmlFor="language-select" className={styles.label}>
        {t('language')}
      </label>
      <select
        id="language-select"
        className={styles.select}
        value={locale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        aria-label={t('selectLanguage')}
        data-testid="language-select"
      >
        {SUPPORTED_LOCALES.map((lng) => (
          <option key={lng} value={lng}>
            {LOCALE_LABELS[lng]}
          </option>
        ))}
      </select>
    </div>
  );
};
