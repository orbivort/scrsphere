import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getDirection, isSupportedLocale } from '@scrumooth/shared';

import { i18nInstance } from './config';
import { useI18nStore } from './useI18nStore';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLocale }) => {
  const { locale, setLocale } = useI18nStore();

  useEffect(() => {
    if (initialLocale && isSupportedLocale(initialLocale)) {
      setLocale(initialLocale);
    }
  }, [initialLocale, setLocale]);

  useEffect(() => {
    void i18nInstance.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
