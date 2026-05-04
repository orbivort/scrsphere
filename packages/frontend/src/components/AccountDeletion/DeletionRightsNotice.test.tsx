import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { DeletionRightsNotice } from './DeletionRightsNotice';

vi.mock('./DeletionRightsNotice.module.css', () => ({
  default: {
    'deletion-rights-notice': 'deletion-rights-notice',
    'deletion-rights-title': 'deletion-rights-title',
    'deletion-rights-text': 'deletion-rights-text',
    'deletion-rights-list': 'deletion-rights-list',
    'deletion-rights-list-item': 'deletion-rights-list-item',
    'deletion-rights-after': 'deletion-rights-after',
  },
}));

describe('DeletionRightsNotice', () => {
  it('should render Your Right to Erasure title', () => {
    render(<DeletionRightsNotice />);
    expect(screen.getByText(/Your Right to Erasure/)).toBeInTheDocument();
  });

  it('should mention right to delete account', () => {
    render(<DeletionRightsNotice />);
    expect(screen.getByText(/right to delete your account/)).toBeInTheDocument();
  });

  it('should mention 14-day grace period', () => {
    render(<DeletionRightsNotice />);
    expect(screen.getByText(/14-day grace period/)).toBeInTheDocument();
  });

  it('should mention team members will be notified', () => {
    render(<DeletionRightsNotice />);
    expect(screen.getByText(/Team members will be notified/)).toBeInTheDocument();
  });

  it('should mention cancellation option', () => {
    render(<DeletionRightsNotice />);
    expect(screen.getByText(/cancel the deletion at any time/)).toBeInTheDocument();
  });

  it('should mention permanent deletion after grace period', () => {
    render(<DeletionRightsNotice />);
    expect(screen.getByText(/permanently delete your account regardless/)).toBeInTheDocument();
  });
});
