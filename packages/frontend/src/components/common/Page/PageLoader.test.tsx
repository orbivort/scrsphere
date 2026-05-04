import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PageLoader } from './PageLoader';

describe('PageLoader', () => {
  it('renders with default message', () => {
    render(<PageLoader />);
    // Message appears in both LoadingSpinner (visually hidden) and paragraph
    const messageElements = screen.getAllByText('Loading...');
    expect(messageElements.length).toBe(2);
    // Verify the visible paragraph contains the message
    expect(screen.getByRole('status').querySelector('p')).toHaveTextContent('Loading...');
  });

  it('renders with custom message', () => {
    render(<PageLoader message="Loading dashboard..." />);
    // Message appears in both LoadingSpinner (visually hidden) and paragraph
    const messageElements = screen.getAllByText('Loading dashboard...');
    expect(messageElements.length).toBe(2);
    // Verify the visible paragraph contains the message
    expect(screen.getByRole('status').querySelector('p')).toHaveTextContent('Loading dashboard...');
  });

  it('has correct accessibility attributes', () => {
    render(<PageLoader />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('renders LoadingSpinner with correct label', () => {
    render(<PageLoader message="Loading reports..." />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Loading reports...');
  });
});
