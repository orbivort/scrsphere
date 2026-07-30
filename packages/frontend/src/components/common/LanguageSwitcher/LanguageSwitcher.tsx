import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';

import styles from './LanguageSwitcher.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';
import { useAuthStore } from '@/store';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
}

/**
 * Returns locale codes sorted for display in the language switcher dropdown.
 *
 * Sort order: English (default locale) pinned first, followed by the remaining
 * locales sorted alphabetically by their native label (e.g. Deutsch, Español, …)
 */
function getDisplaySortedLocales(): Locale[] {
  const sorted = [...SUPPORTED_LOCALES].sort((a, b) =>
    LOCALE_LABELS[a].localeCompare(LOCALE_LABELS[b])
  );

  // Pin the default locale (English) to the front
  const defaultIndex = sorted.indexOf(DEFAULT_LOCALE);
  if (defaultIndex > 0) {
    sorted.splice(defaultIndex, 1);
    sorted.unshift(DEFAULT_LOCALE);
  }

  return sorted;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dropdown' }) => {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18nStore();
  const { user, updateProfile } = useAuthStore();

  const displayLocales = useMemo(() => getDisplaySortedLocales(), []);

  const handleChange = async (newLocale: Locale) => {
    setLocale(newLocale);

    if (user) {
      try {
        await updateProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          locale: newLocale,
        });
      } catch {
        // Local change remains; show warning toast
        console.warn('Failed to sync language preference to server');
      }
    }
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
        {displayLocales.map((lng) => (
          <option key={lng} value={lng}>
            {LOCALE_LABELS[lng]}
          </option>
        ))}
      </select>
    </div>
  );
};
