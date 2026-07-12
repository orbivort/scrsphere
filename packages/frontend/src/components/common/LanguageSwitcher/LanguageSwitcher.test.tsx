import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguageSwitcher } from './LanguageSwitcher';

// Mock CSS modules
vi.mock('./LanguageSwitcher.module.css', () => ({
  default: {
    container: 'container',
    label: 'label',
    select: 'select',
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock useI18nStore
const mockSetLocale = vi.fn();
const mockUseI18nStore = vi.fn(() => ({
  locale: 'en',
  setLocale: mockSetLocale,
}));

vi.mock('@/i18n/useI18nStore', () => ({
  useI18nStore: () => mockUseI18nStore(),
}));

// Mock useAuthStore
const mockUpdateProfile = vi.fn();
const mockUseAuthStore = vi.fn(() => ({
  user: null,
  updateProfile: mockUpdateProfile,
}));

vi.mock('@/store', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock implementations
    mockUseI18nStore.mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
    });
    mockUseAuthStore.mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    });
  });

  it('renders the language select with current locale', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('en');
  });

  it('renders all supported locales as options', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    const options = select.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('calls setLocale when locale is changed and no user is authenticated', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    });

    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    await user.selectOptions(select, 'fr');

    expect(mockSetLocale).toHaveBeenCalledWith('fr');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('syncs locale to backend when user is authenticated', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      locale: 'en',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
    });
    mockUpdateProfile.mockResolvedValue(true);

    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    await user.selectOptions(select, 'de');

    expect(mockSetLocale).toHaveBeenCalledWith('de');
    // Allow async updateProfile to be called
    await vi.waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        locale: 'de',
      });
    });
  });

  it('handles updateProfile failure gracefully when authenticated', async () => {
    const user = userEvent.setup();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      locale: 'en',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      updateProfile: mockUpdateProfile,
    });
    mockUpdateProfile.mockRejectedValue(new Error('Network error'));

    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    await user.selectOptions(select, 'es');

    // Local change should still happen
    expect(mockSetLocale).toHaveBeenCalledWith('es');

    // Wait for the async catch block
    await vi.waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to sync language preference to server');
    });

    consoleWarnSpy.mockRestore();
  });

  it('does not call updateProfile when user is not authenticated', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    });

    render(<LanguageSwitcher />);

    const select = screen.getByTestId('language-select');
    await user.selectOptions(select, 'it');

    expect(mockSetLocale).toHaveBeenCalledWith('it');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('renders with dropdown variant by default', () => {
    render(<LanguageSwitcher />);

    const container = screen.getByTestId('language-select').closest('[data-variant]');
    expect(container).toHaveAttribute('data-variant', 'dropdown');
  });

  it('renders with inline variant when specified', () => {
    render(<LanguageSwitcher variant="inline" />);

    const container = screen.getByTestId('language-select').closest('[data-variant]');
    expect(container).toHaveAttribute('data-variant', 'inline');
  });
});
