import '@testing-library/jest-dom';
import 'vi-axe/extend-expect';

// Extend Vitest expect with vi-axe matchers

// Mock import.meta.env for Vite - must be done before any imports
const globalImport = globalThis as { import?: { meta: { env: Record<string, string> } } };
if (typeof globalImport.import === 'undefined') {
  globalImport.import = { meta: { env: {} } };
}

Object.defineProperty(globalThis, 'import.meta', {
  value: {
    env: {
      VITE_USE_MOCK_API: 'true',
      VITE_API_BASE_URL: 'http://localhost:3000/api',
      VITE_LOG_LEVEL: 'debug',
      MODE: 'test',
      DEV: false,
      PROD: false,
      SSR: false,
      BASE_URL: '/',
    },
    hot: undefined,
  },
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

// Create live region element for screen reader announcements
const createLiveRegion = () => {
  const existing = document.getElementById('sr-announcer');
  if (existing) return existing;

  const liveRegion = document.createElement('div');
  liveRegion.id = 'sr-announcer';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  document.body.appendChild(liveRegion);
  return liveRegion;
};

// Mock LiveAnnouncer hooks
vi.mock('./components/LiveAnnouncer', () => ({
  useAnnouncement: () => ({
    announce: (message: string) => {
      const liveRegion = createLiveRegion();
      liveRegion.textContent = message;
    },
    announcer: null,
  }),
  useAnnounce: () => (message: string) => {
    const liveRegion = createLiveRegion();
    liveRegion.textContent = message;
  },
  AnnouncerProvider: ({ children }: { children: React.ReactNode }) => children,
  LiveAnnouncer: () => null,
}));
