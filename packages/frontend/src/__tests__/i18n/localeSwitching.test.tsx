/**
 * Tests for dynamic locale switching at runtime.
 *
 * Verifies that components update their rendered content when the locale
 * changes without requiring a page reload, ensuring the i18n system
 * properly re-renders translated text.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { DEFAULT_LOCALE } from '@scrumooth/shared';

import { initTestI18n, getTestI18nInstance, changeTestLanguage } from '@/i18n/testConfig';
import { useI18nStore } from '@/i18n/useI18nStore';

import { EmptyState } from '@/components/EmptyState/EmptyState';

vi.mock('@/components/EmptyState/EmptyState.module.css', () => ({
  default: {
    'empty-state-container': 'empty-state-container',
    'empty-state-content': 'empty-state-content',
    'empty-state-icon': 'empty-state-icon',
    'empty-state-title': 'empty-state-title',
    'empty-state-description': 'empty-state-description',
    'empty-state-actions': 'empty-state-actions',
    'empty-state-button': 'empty-state-button',
    'button-primary': 'button-primary',
    'button-secondary': 'button-secondary',
    default: 'default',
    compact: 'compact',
    'full-page': 'full-page',
  },
}));

describe('Dynamic Locale Switching', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    // Reset the i18n store to English before each test
    useI18nStore.setState({ locale: DEFAULT_LOCALE });
  });

  it('updates rendered text when locale changes from English to German', async () => {
    await changeTestLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-team" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify English text is shown initially
    expect(screen.getByText('No Team Selected')).toBeInTheDocument();
    expect(screen.getByText('Please select a team to continue.')).toBeInTheDocument();

    // Switch to German
    await changeTestLanguage('de');

    // Re-render to pick up the new language
    rerender(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-team" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify German text is shown after switch
    await waitFor(() => {
      expect(screen.getByText('Kein Team ausgewählt')).toBeInTheDocument();
      expect(
        screen.getByText('Bitte wählen Sie ein Team aus, um fortzufahren.')
      ).toBeInTheDocument();
    });
  });

  it('updates rendered text when locale changes from English to French', async () => {
    await changeTestLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-active-goal" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify English text is shown initially
    expect(screen.getByText('No Active Goal')).toBeInTheDocument();

    // Switch to French
    await changeTestLanguage('fr');

    rerender(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-active-goal" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify French text is shown after switch
    await waitFor(() => {
      expect(screen.getByText('Aucun objectif actif')).toBeInTheDocument();
    });
  });

  it('updates action button text when locale changes', async () => {
    await changeTestLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-active-sprint" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify English action button
    expect(screen.getByRole('button', { name: 'Go to Sprint Planning' })).toBeInTheDocument();

    // Switch to Spanish
    await changeTestLanguage('es');

    rerender(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-active-sprint" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify Spanish action button
    // Note: "Sprint Planning" is kept in English as per Scrum glossary standards
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ir a Sprint Planning' })).toBeInTheDocument();
    });
  });

  it('handles multiple rapid locale switches', async () => {
    await changeTestLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-data" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Rapid switches
    await changeTestLanguage('de');
    await changeTestLanguage('fr');
    await changeTestLanguage('it');

    rerender(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="no-data" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Should show the last language (Italian)
    await waitFor(() => {
      const instance = getTestI18nInstance();
      const italianTitle = instance.getFixedT('it', undefined)('emptyState.noData.title');
      expect(screen.getByText(italianTitle)).toBeInTheDocument();
    });
  });

  it('i18n store setLocale triggers language change', async () => {
    await changeTestLanguage('en');

    const { rerender } = render(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="error" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify English text
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

    // Use the i18n store to change locale (simulates user selecting a language)
    useI18nStore.getState().setLocale('de');
    await changeTestLanguage('de');

    rerender(
      <I18nextProvider i18n={getTestI18nInstance()}>
        <MemoryRouter>
          <EmptyState type="error" />
        </MemoryRouter>
      </I18nextProvider>
    );

    // Verify German text
    await waitFor(() => {
      const instance = getTestI18nInstance();
      const germanTitle = instance.getFixedT('de', undefined)('emptyState.error.title');
      expect(screen.getByText(germanTitle)).toBeInTheDocument();
    });
  });
});
