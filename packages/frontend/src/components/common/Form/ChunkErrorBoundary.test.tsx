import { screen, fireEvent, render, renderWithProviders, initTestI18n } from '../../../test-utils';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { I18nextProvider, type i18n as I18nType } from 'react-i18next';

import { ChunkErrorBoundary } from './ChunkErrorBoundary';

const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

describe('ChunkErrorBoundary', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    renderWithProviders(
      <ChunkErrorBoundary>
        <div>Test content</div>
      </ChunkErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays error UI for chunk loading errors', () => {
    const chunkError = new Error('Loading chunk 123 failed');

    renderWithProviders(
      <ChunkErrorBoundary>
        <ThrowError error={chunkError} />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText('Unable to load page')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();
  });

  it('reloads page on retry click', () => {
    const reloadMock = vi.fn();
    // Use vi.stubGlobal to mock window.location
    vi.stubGlobal('location', {
      ...window.location,
      reload: reloadMock,
    });

    const chunkError = new Error('Loading chunk failed');

    renderWithProviders(
      <ChunkErrorBoundary>
        <ThrowError error={chunkError} />
      </ChunkErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload'));
    expect(reloadMock).toHaveBeenCalled();

    // Clean up the stub
    vi.unstubAllGlobals();
  });

  it('renders custom fallback when provided', () => {
    const chunkError = new Error('Loading chunk failed');

    renderWithProviders(
      <ChunkErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowError error={chunkError} />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });

  it('does not catch non-chunk errors', () => {
    const normalError = new Error('Some other error');

    // This should throw because it's not a chunk error
    expect(() => {
      renderWithProviders(
        <ChunkErrorBoundary>
          <ThrowError error={normalError} />
        </ChunkErrorBoundary>
      );
    }).toThrow('Some other error');
  });

  it.each([
    ['Loading CSS chunk 456 failed', 'Loading CSS chunk'],
    ['Something went wrong', 'ChunkLoadError'],
    ['Failed to loadNamespace: common', 'loadNamespace'],
    ['i18next: cannot load the locale', 'i18next'],
  ])('displays error UI when the error matches %s', (message, name) => {
    const error = name === 'ChunkLoadError' ? new Error(message) : new Error(message);
    if (name === 'ChunkLoadError') {
      error.name = 'ChunkLoadError';
    }

    renderWithProviders(
      <ChunkErrorBoundary>
        <ThrowError error={error} />
      </ChunkErrorBoundary>
    );

    expect(screen.getByText('Unable to load page')).toBeInTheDocument();
  });

  describe('safeT fallback behavior', () => {
    const createFakeI18n = (t: I18nType['t']): I18nType =>
      ({
        t,
        getFixedT: () => t,
        hasLoadedNamespace: () => true,
        getResourceBundle: () => ({}),
        on: () => undefined,
        off: () => undefined,
        language: 'en',
        languages: ['en'],
        options: { supportedLngs: ['en'], fallbackLng: ['en'] },
        isInitialized: true,
        initializedLanguageOnce: true,
      }) as any as I18nType;

    it('uses hardcoded fallback when translation key is missing', () => {
      const missingKeyI18n = createFakeI18n(((key: string) => key) as I18nType['t']);

      render(
        <I18nextProvider i18n={missingKeyI18n}>
          <ChunkErrorBoundary>
            <ThrowError error={new Error('Loading chunk 123 failed')} />
          </ChunkErrorBoundary>
        </I18nextProvider>
      );

      expect(screen.getByText('Page failed to load')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('uses hardcoded fallback when translation throws', () => {
      const throwingI18n = createFakeI18n((() => {
        throw new Error('translation failed');
      }) as I18nType['t']);

      render(
        <I18nextProvider i18n={throwingI18n}>
          <ChunkErrorBoundary>
            <ThrowError error={new Error('Loading chunk 123 failed')} />
          </ChunkErrorBoundary>
        </I18nextProvider>
      );

      expect(screen.getByText('Page failed to load')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });
  });
});
