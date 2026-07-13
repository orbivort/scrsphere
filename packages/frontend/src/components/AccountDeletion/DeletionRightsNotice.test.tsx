import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen, renderWithProviders, initTestI18n } from '../../test-utils';

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

beforeAll(async () => {
  await initTestI18n();
});

describe('DeletionRightsNotice', () => {
  it('should render Your Right to Erasure title', () => {
    renderWithProviders(<DeletionRightsNotice />);
    expect(screen.getByText(/Your Right to Erasure/)).toBeInTheDocument();
  });

  it('should mention right to delete account', () => {
    renderWithProviders(<DeletionRightsNotice />);
    expect(screen.getByText(/right to delete your account/)).toBeInTheDocument();
  });

  it('should mention 14-day grace period', () => {
    renderWithProviders(<DeletionRightsNotice />);
    expect(screen.getByText(/14-day grace period/)).toBeInTheDocument();
  });

  it('should mention team members will be notified', () => {
    renderWithProviders(<DeletionRightsNotice />);
    expect(screen.getByText(/Team members will be notified/)).toBeInTheDocument();
  });

  it('should mention cancellation option', () => {
    renderWithProviders(<DeletionRightsNotice />);
    expect(screen.getByText(/cancel the deletion at any time/)).toBeInTheDocument();
  });

  it('should mention permanent deletion after grace period', () => {
    renderWithProviders(<DeletionRightsNotice />);
    expect(screen.getByText(/permanently delete your account regardless/)).toBeInTheDocument();
  });
});
