import React, { useEffect, useState, useRef, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import { getDirection, isSupportedLocale, normalizeLocale, type Locale } from '@scrumooth/shared';

import { i18nInstance } from './config';
import { useI18nStore, syncLocaleFromUser } from './useI18nStore';

import { useAuthStore } from '@/store';

/** Maximum time to wait for i18n initialization before showing an error (ms) */
const I18N_INIT_TIMEOUT_MS = 15_000;

interface I18nProviderProps {
  children: React.ReactNode;
}

type I18nState = 'loading' | 'ready' | 'error';

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const { locale } = useI18nStore();
  const [i18nState, setI18nState] = useState<I18nState>(
    i18nInstance.isInitialized ? 'ready' : 'loading'
  );
  // Tracks whether the initial i18next → Zustand sync has completed.
  // Without this, the changeLanguage effect fires on mount with the Zustand
  // default locale ('en') and overrides the i18next-detected browser language.
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const isChangingLanguage = useRef(false);

  // Wait for Zustand persist rehydration before syncing i18next → Zustand.
  // Without waiting, the async hydration overwrites our setState with the stale
  // persisted value. We subscribe to Zustand's onFinishHydration and also add
  // a fallback timeout in case the event never fires (e.g. storage unavailable).
  useEffect(() => {
    const syncDetectedLocale = () => {
      // i18next may report the raw detected language (e.g. 'de-DE' from
      // navigator.language) instead of the normalized code ('de'). We must
      // normalize before checking support because SUPPORTED_LOCALES only
      // contains base codes like 'de', not region tags like 'de-DE'.
      // Without this normalization, isSupportedLocale('de-DE') returns false,
      // setLocale is skipped, and the store stays at the default 'en' — which
      // then triggers changeLanguage('en') and overwrites the cookie.
      const rawLng = i18nInstance.language;
      const detectedLng = rawLng ? normalizeLocale(rawLng) : null;

      if (detectedLng && isSupportedLocale(detectedLng)) {
        const storeLocale = useI18nStore.getState().locale;
        if (detectedLng !== storeLocale) {
          // Use setLocale (not setState) so the scrumooth_locale cookie is
          // also updated — otherwise the cookie retains the stale default 'en'
          // and the next page load reads the wrong value from the cookie detector.
          useI18nStore.getState().setLocale(detectedLng as Locale);
        }
      }
      // Mark sync as done so the changeLanguage effect can fire. If setLocale
      // was called, locale is now the normalized base code (e.g. 'de'), and
      // the changeLanguage effect will call i18nInstance.changeLanguage('de'),
      // which also normalizes i18next's language and re-caches the cookie
      // with the correct value (overwriting the raw 'de-DE' that i18next's
      // LanguageDetector may have written during initialization).
      setInitialSyncDone(true);
    };

    // If already hydrated (e.g. synchronous storage), sync immediately
    if (useI18nStore.persist.hasHydrated()) {
      syncDetectedLocale();
      return;
    }

    let syncCompleted = false;

    // Subscribe to hydration completion
    const unsubFinishHydration = useI18nStore.persist.onFinishHydration(() => {
      if (!syncCompleted) {
        syncCompleted = true;
        syncDetectedLocale();
      }
    });

    // Fallback: if hydration doesn't complete within 300ms, proceed anyway.
    // This prevents the UI from being stuck if localStorage is unavailable
    // or the persist middleware fails to hydrate.
    const fallbackTimer = setTimeout(() => {
      if (!syncCompleted) {
        syncCompleted = true;
        syncDetectedLocale();
      }
    }, 300);

    return () => {
      unsubFinishHydration();
      clearTimeout(fallbackTimer);
    };
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
  // Skipped on initial render until the i18next-detected language has been
  // synced to Zustand — otherwise the default locale ('en') overrides the
  // browser-detected language before the sync effect can correct it.
  useEffect(() => {
    if (!initialSyncDone) return;
    if (isChangingLanguage.current) return;

    let cancelled = false;
    const changeLang = async () => {
      try {
        isChangingLanguage.current = true;
        await i18nInstance.changeLanguage(locale);
        if (!cancelled) {
          document.documentElement.lang = locale;
          document.documentElement.dir = getDirection(locale);
          setI18nState('ready');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to change language:', error);
          // Language change failed but i18n is still initialized — proceed with current locale
          setI18nState('ready');
        }
      } finally {
        isChangingLanguage.current = false;
      }
    };
    void changeLang();

    return () => {
      cancelled = true;
    };
  }, [locale, initialSyncDone]);

  // Listen for i18n ready state + timeout protection
  useEffect(() => {
    if (i18nInstance.isInitialized) {
      setI18nState('ready');
      return;
    }

    const handleInitialized = () => {
      setI18nState('ready');
    };

    // Timeout: if i18n doesn't initialize within the limit, show an error
    const timeoutId = setTimeout(() => {
      if (!i18nInstance.isInitialized) {
        console.error(
          `[i18n] Initialization timed out after ${I18N_INIT_TIMEOUT_MS}ms. ` +
            'This usually means locale files could not be loaded. ' +
            'Check your network connection and that /locales/ files are accessible.'
        );
        setI18nState('error');
      }
    }, I18N_INIT_TIMEOUT_MS);

    i18nInstance.on('initialized', handleInitialized);
    return () => {
      i18nInstance.off('initialized', handleInitialized);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleRetry = useCallback(() => {
    setI18nState('loading');
    // Re-trigger initialization
    void i18nInstance.reloadResources().then(() => {
      if (i18nInstance.isInitialized) {
        setI18nState('ready');
      } else {
        void i18nInstance.init(i18nInstance.options);
      }
    });
  }, []);

  // Don't render children until i18n is ready
  if (i18nState === 'loading') {
    return null;
  }

  if (i18nState === 'error') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: 'var(--color-background-page, #f9fafb)',
        }}
      >
        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-interactive-danger, #dc2626)',
              marginBottom: '1rem',
            }}
          >
            Unable to Load Translations
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--color-text-secondary, #6b7280)',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}
          >
            The application could not load its language resources. This may be caused by a network
            issue or a missing configuration. Please check your connection and try again.
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: 'var(--color-interactive-primary, #2563eb)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          {import.meta.env.DEV && (
            <details
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'var(--color-warning-100, #fef3c7)',
                borderRadius: '0.5rem',
                textAlign: 'left',
                fontSize: '0.75rem',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Developer Details</summary>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                {`i18n initialization timed out after ${I18N_INIT_TIMEOUT_MS}ms.\n`}
                {`i18n.isInitialized: ${String(i18nInstance.isInitialized)}\n`}
                {`i18n.language: ${i18nInstance.language || 'undefined'}\n`}
                {`Check: /locales/{lng}/{ns}.json files are served correctly.`}
              </p>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
