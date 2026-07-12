import React, { useEffect, useState, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getDirection, isSupportedLocale, type Locale } from '@scrumooth/shared';

import { i18nInstance } from './config';
import { useI18nStore, syncLocaleFromUser } from './useI18nStore';

import { useAuthStore } from '@/store';

interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const { locale } = useI18nStore();
  const [isReady, setIsReady] = useState(i18nInstance.isInitialized);
  const isChangingLanguage = useRef(false);

  // On mount: sync Zustand store from i18next's detected language (run once)
  useEffect(() => {
    const detectedLng = i18nInstance.language;
    if (detectedLng && isSupportedLocale(detectedLng)) {
      const storeLocale = useI18nStore.getState().locale;
      if (detectedLng !== storeLocale) {
        // Update store without triggering the changeLanguage effect
        isChangingLanguage.current = true;
        useI18nStore.setState({ locale: detectedLng as Locale });
        isChangingLanguage.current = false;
      }
    }
  }, []);

  // Sync locale from authenticated user's stored preference (run once)
  // Only sync if there's no explicit persisted preference (first-time user)
  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (user?.locale && isSupportedLocale(user.locale)) {
      // Check if user has an explicit preference persisted in localStorage
      const persistedData = localStorage.getItem('scrumooth.locale');
      if (persistedData) {
        try {
          const parsed = JSON.parse(persistedData);
          // If persisted locale exists and differs from user.locale, respect persisted preference
          if (parsed?.state?.locale && parsed.state.locale !== user.locale) {
            return; // Don't override user's explicit choice
          }
        } catch {
          // Invalid data, proceed with sync
        }
      }
      syncLocaleFromUser(user.locale);
    }
  }, []);

  // Subscribe to auth store user changes for locale sync
  // Only sync on login (user becoming non-null), not on subsequent updates
  useEffect(() => {
    let previousUser = useAuthStore.getState().user;
    const unsubscribe = useAuthStore.subscribe((state) => {
      // Only sync when user transitions from null to having a value (login)
      // This prevents overriding explicit preference on page refresh
      if (!previousUser && state.user?.locale && isSupportedLocale(state.user.locale)) {
        // Check if user has an explicit preference persisted in localStorage
        const persistedData = localStorage.getItem('scrumooth.locale');
        if (persistedData) {
          try {
            const parsed = JSON.parse(persistedData);
            if (parsed?.state?.locale && parsed.state.locale !== state.user.locale) {
              previousUser = state.user;
              return; // Don't override user's explicit choice
            }
          } catch {
            // Invalid data, proceed with sync
          }
        }
        syncLocaleFromUser(state.user.locale);
      }
      previousUser = state.user;
    });
    return unsubscribe;
  }, []);

  // Change i18next language when store locale changes
  useEffect(() => {
    if (isChangingLanguage.current) return;

    let cancelled = false;
    const changeLang = async () => {
      try {
        isChangingLanguage.current = true;
        await i18nInstance.changeLanguage(locale);
        if (!cancelled) {
          document.documentElement.lang = locale;
          document.documentElement.dir = getDirection(locale);
          setIsReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to change language:', error);
          setIsReady(true);
        }
      } finally {
        isChangingLanguage.current = false;
      }
    };
    void changeLang();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Listen for i18n ready state
  useEffect(() => {
    if (i18nInstance.isInitialized) {
      setIsReady(true);
      return;
    }

    const handleInitialized = () => {
      setIsReady(true);
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
