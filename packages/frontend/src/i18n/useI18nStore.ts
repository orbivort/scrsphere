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
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'scrumooth.locale',
      version: 0,
      migrate: (persistedState) => persistedState as I18nState,
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
