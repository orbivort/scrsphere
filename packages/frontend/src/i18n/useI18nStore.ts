import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, type Locale } from '@scrumooth/shared';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => {
        set({ locale });
        // Sync locale to cookie so backend can read it on subsequent requests
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `scrumooth_locale=${locale}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`;
      },
    }),
    {
      name: 'scrumooth.locale',
      version: 0,
      migrate: (persistedState) => persistedState as I18nState,
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

export const syncLocaleFromUser = (userLocale: string) => {
  const store = useI18nStore.getState();
  if (store.locale !== userLocale) {
    store.setLocale(userLocale as Locale);
  }
};
