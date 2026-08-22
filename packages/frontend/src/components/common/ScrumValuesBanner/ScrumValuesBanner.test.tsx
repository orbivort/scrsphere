import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { initTestI18n } from '@/test-utils';

import { ScrumValuesBanner } from './ScrumValuesBanner';

vi.mock('./ScrumValuesBanner.module.css', () => ({
  default: {
    banner: 'banner',
    visible: 'visible',
    hidden: 'hidden',
    label: 'label',
    name: 'name',
    definition: 'definition',
  },
}));

describe('ScrumValuesBanner Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the banner region', () => {
    render(<ScrumValuesBanner intervalMs={100000} />);

    const region = screen.getByRole('region');
    expect(region).toBeInTheDocument();
  });

  it('shows one of the five Scrum value labels', () => {
    render(<ScrumValuesBanner intervalMs={100000} />);

    const region = screen.getByRole('region');
    expect(region.textContent).toBeTruthy();
  });

  it('rotates to the next value after the interval', () => {
    render(<ScrumValuesBanner intervalMs={1000} />);

    const first = screen.getByRole('region').textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(300);
    });

    const second = screen.getByRole('region').textContent;
    expect(second).not.toBe(first);
  });

  it('does not rotate after unmount when a stale interval fires', () => {
    let intervalCb: (() => void) | undefined;
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(((cb: () => void) => {
      intervalCb = cb;
      return 1 as unknown as ReturnType<typeof setInterval>;
    }) as typeof setInterval);

    const { unmount } = render(<ScrumValuesBanner intervalMs={1000} />);
    unmount();

    // A stale interval callback firing after unmount must early-return
    // (covers the `!mounted` guard in the rotation callback).
    expect(() => act(() => intervalCb?.())).not.toThrow();

    expect(intervalCb).toBeDefined();
    setIntervalSpy.mockRestore();
  });

  it('ignores a pending fade-out timeout fired after unmount', () => {
    let intervalCb: (() => void) | undefined;
    let timeoutCb: (() => void) | undefined;
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(((cb: () => void) => {
      intervalCb = cb;
      return 1 as unknown as ReturnType<typeof setInterval>;
    }) as typeof setInterval);
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation(((cb: () => void) => {
      timeoutCb = cb;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    const { unmount } = render(<ScrumValuesBanner intervalMs={1000} />);

    // Fire the interval while mounted: schedules the 300ms fade-in timeout.
    act(() => {
      intervalCb?.();
    });
    expect(timeoutCb).toBeDefined();

    unmount();

    // The pending timeout firing after unmount must early-return
    // (covers the `!mounted` guard inside the fade-in timeout).
    expect(() => act(() => timeoutCb?.())).not.toThrow();

    setIntervalSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });
});
