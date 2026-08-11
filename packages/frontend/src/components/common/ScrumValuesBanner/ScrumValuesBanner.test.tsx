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
});
