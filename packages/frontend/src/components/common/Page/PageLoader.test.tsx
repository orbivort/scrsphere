import { describe, it, expect, beforeAll } from 'vitest';
import { screen, renderWithProviders, initTestI18n } from '../../../test-utils';

import { PageLoader } from './PageLoader';

describe('PageLoader', () => {
  beforeAll(async () => {
    await initTestI18n();
  });
  it('renders with default message', () => {
    renderWithProviders(<PageLoader />);
    // Message appears in both LoadingSpinner (visually hidden) and paragraph
    const messageElements = screen.getAllByText('Loading...');
    expect(messageElements.length).toBe(2);
    // Verify the visible paragraph contains the message
    expect(screen.getByRole('status').querySelector('p')).toHaveTextContent('Loading...');
  });

  it('renders with custom message', () => {
    renderWithProviders(<PageLoader message="Loading dashboard..." />);
    // Message appears in both LoadingSpinner (visually hidden) and paragraph
    const messageElements = screen.getAllByText('Loading dashboard...');
    expect(messageElements.length).toBe(2);
    // Verify the visible paragraph contains the message
    expect(screen.getByRole('status').querySelector('p')).toHaveTextContent('Loading dashboard...');
  });

  it('has correct accessibility attributes', () => {
    renderWithProviders(<PageLoader />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('renders LoadingSpinner with correct label', () => {
    renderWithProviders(<PageLoader message="Loading reports..." />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Loading reports...');
  });
});
