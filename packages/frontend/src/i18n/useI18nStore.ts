import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, type Locale, getLocaleCookieOptions } from '@scrumooth/shared';

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
        const opts = getLocaleCookieOptions('browser');
        const expires = new Date(Date.now() + opts.maxAge).toUTCString();
        document.cookie = `${opts.name}=${locale}; Expires=${expires}; Path=${opts.path}; SameSite=${opts.sameSite}${opts.secure ? '; Secure' : ''}`;
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
