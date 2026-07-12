import React, { useEffect, useState, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getDirection, isSupportedLocale } from '@scrumooth/shared';

import { i18nInstance } from './config';
import { useI18nStore, syncLocaleFromUser } from './useI18nStore';

import { useAuthStore } from '@/store';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLocale }) => {
  const { locale, setLocale } = useI18nStore();
  const [isReady, setIsReady] = useState(i18nInstance.isInitialized);

  useEffect(() => {
    if (initialLocale && isSupportedLocale(initialLocale)) {
      setLocale(initialLocale);
    }
  }, [initialLocale, setLocale]);

  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (user?.locale) {
      syncLocaleFromUser(user.locale);
    }
  }, []);

  const handleLanguageChange = useCallback(async () => {
    try {
      // Change the language and wait for translations to load
      await i18nInstance.changeLanguage(locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = getDirection(locale);
      setIsReady(true);
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsReady(true);
    }
  }, [locale]);

  useEffect(() => {
    void handleLanguageChange();
  }, [handleLanguageChange]);

  // Listen for i18n ready state
  useEffect(() => {
    const handleInitialized = () => {
      if (i18nInstance.isInitialized) {
        setIsReady(true);
      }
    };

    i18nInstance.on('initialized', handleInitialized);
    return () => {
      i18nInstance.off('initialized', handleInitialized);
    };
  }, []);

  // Don't render children until i18n is ready
  if (!isReady) {
    return null;
  }

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
