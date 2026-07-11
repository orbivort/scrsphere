import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher/LanguageSwitcher';
import { useI18nStore } from '@/i18n/useI18nStore';
import { SUPPORTED_LOCALES, LOCALE_LABELS, DEFAULT_LOCALE } from '@scrumooth/shared';

// Mock CSS modules
vi.mock('@/components/common/LanguageSwitcher/LanguageSwitcher.module.css', () => ({
  default: {
    container: 'container',
    label: 'label',
    select: 'select',
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        language: 'Language',
        selectLanguage: 'Select language',
      };
      return translations[key] ?? key;
    },
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock the I18nProvider / i18n config
vi.mock('@/i18n/config', () => ({
  i18nInstance: {
    use: vi.fn(() => ({
      use: vi.fn(() => ({
        init: vi.fn(),
      })),
    })),
    init: vi.fn(),
    changeLanguage: vi.fn(),
  },
  initI18n: vi.fn(),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset i18n store to default locale
    useI18nStore.setState({ locale: DEFAULT_LOCALE });
  });

  describe('rendering', () => {
    it('should render all SUPPORTED_LOCALES as options', () => {
      render(<LanguageSwitcher />);

      const select = screen.getByTestId('language-select');
      expect(select).toBeInTheDocument();

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(SUPPORTED_LOCALES.length);

      for (const locale of SUPPORTED_LOCALES) {
        expect(screen.getByText(LOCALE_LABELS[locale])).toBeInTheDocument();
      }
    });

    it('should display LOCALE_LABELS for each locale', () => {
      render(<LanguageSwitcher />);

      for (const locale of SUPPORTED_LOCALES) {
        const option = screen.getByText(LOCALE_LABELS[locale]);
        expect(option).toBeInTheDocument();
        expect(option).toHaveAttribute('value', locale);
      }
    });

    it('should render with dropdown variant by default', () => {
      const { container } = render(<LanguageSwitcher />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute('data-variant')).toBe('dropdown');
    });

    it('should render with inline variant when specified', () => {
      const { container } = render(<LanguageSwitcher variant="inline" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute('data-variant')).toBe('inline');
    });

    it('should render a label for the select', () => {
      render(<LanguageSwitcher />);
      const label = screen.getByText('Language');
      expect(label).toBeInTheDocument();
    });

    it('should have accessible aria-label', () => {
      render(<LanguageSwitcher />);
      const select = screen.getByTestId('language-select');
      expect(select).toHaveAttribute('aria-label', 'Select language');
    });

    it('should show the current locale as selected value', () => {
      render(<LanguageSwitcher />);
      const select = screen.getByTestId('language-select') as HTMLSelectElement;
      expect(select.value).toBe(DEFAULT_LOCALE);
    });
  });

  describe('interaction', () => {
    it('should call setLocale on selection change', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const select = screen.getByTestId('language-select');
      await user.selectOptions(select, 'de');

      expect(useI18nStore.getState().locale).toBe('de');
    });

    it('should update store locale when selecting French', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const select = screen.getByTestId('language-select');
      await user.selectOptions(select, 'fr');

      expect(useI18nStore.getState().locale).toBe('fr');
    });

    it('should update store locale when selecting Spanish', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const select = screen.getByTestId('language-select');
      await user.selectOptions(select, 'es');

      expect(useI18nStore.getState().locale).toBe('es');
    });

    it('should update store locale when selecting Italian', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const select = screen.getByTestId('language-select');
      await user.selectOptions(select, 'it');

      expect(useI18nStore.getState().locale).toBe('it');
    });
  });
});
