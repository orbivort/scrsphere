import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen, renderWithProviders, initTestI18n } from '../../test-utils';

import type { TeamMembership } from '../../types/auth.types';

import { ForceDeleteWarning } from './ForceDeleteWarning';

vi.mock('./ForceDeleteWarning.module.css', () => ({
  default: {
    'force-delete-warning': 'force-delete-warning',
    'force-delete-warning-title': 'force-delete-warning-title',
    'force-delete-warning-text': 'force-delete-warning-text',
    'force-delete-impact': 'force-delete-impact',
    'force-delete-impact-title': 'force-delete-impact-title',
    'force-delete-impact-list': 'force-delete-impact-list',
    'force-delete-impact-item': 'force-delete-impact-item',
    'force-delete-teams': 'force-delete-teams',
    'force-delete-teams-title': 'force-delete-teams-title',
    'force-delete-teams-list': 'force-delete-teams-list',
    'force-delete-teams-item': 'force-delete-teams-item',
    'force-delete-teams-consequences': 'force-delete-teams-consequences',
  },
}));

beforeAll(async () => {
  await initTestI18n();
});

const mockBlockedTeams: TeamMembership[] = [
  { id: 'team-1', name: 'Team Alpha', role: 'PRODUCT_OWNER', isLastPO: true },
  { id: 'team-2', name: 'Team Beta', role: 'PRODUCT_OWNER', isLastPO: true },
];

describe('ForceDeleteWarning', () => {
  it('should render grace period complete title', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={mockBlockedTeams} />);
    expect(screen.getByText('Grace Period Complete')).toBeInTheDocument();
  });

  it('should mention permanent deletion', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={mockBlockedTeams} />);
    expect(screen.getByText(/permanently delete your account/)).toBeInTheDocument();
  });

  it('should list blocked teams', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={mockBlockedTeams} />);
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });

  it('should show NO Product Owner warning', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={mockBlockedTeams} />);
    expect(screen.getByText(/NO Product Owner/)).toBeInTheDocument();
  });

  it('should mention consequences for teams', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={mockBlockedTeams} />);
    expect(screen.getByText(/add or remove team members/)).toBeInTheDocument();
  });

  it('should say action cannot be undone', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={mockBlockedTeams} />);
    expect(screen.getByText(/CANNOT be undone/)).toBeInTheDocument();
  });

  it('should not show teams section when no blocked teams', () => {
    renderWithProviders(<ForceDeleteWarning blockedTeams={[]} />);
    expect(screen.queryByText(/NO Product Owner/)).not.toBeInTheDocument();
  });
});
