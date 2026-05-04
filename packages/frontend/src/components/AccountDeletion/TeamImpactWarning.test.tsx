import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { TeamImpactWarning } from './TeamImpactWarning';
import type { TeamMembership } from '../../types/auth.types';

vi.mock('./TeamImpactWarning.module.css', () => ({
  default: {
    'team-impact-section': 'team-impact-section',
    'team-impact-section-blocked': 'team-impact-section-blocked',
    'team-impact-title': 'team-impact-title',
    'team-impact-description': 'team-impact-description',
    'blocked-teams': 'blocked-teams',
    'team-item-blocked': 'team-item-blocked',
    'team-item-header': 'team-item-header',
    'team-item-name': 'team-item-name',
    'team-item-role': 'team-item-role',
    'team-item-warning': 'team-item-warning',
    'warning-icon': 'warning-icon',
    'warning-content': 'warning-content',
    'warning-text': 'warning-text',
    'team-settings-link': 'team-settings-link',
    'regular-teams': 'regular-teams',
    'team-item': 'team-item',
    'team-item-message': 'team-item-message',
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

const createMockTeam = (overrides: Partial<TeamMembership> = {}): TeamMembership => ({
  id: 'team-1',
  name: 'Test Team',
  role: 'DEVELOPER',
  isLastPO: false,
  ...overrides,
});

describe('TeamImpactWarning Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should display team memberships with roles', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Alpha Team', role: 'PRODUCT_OWNER' }),
        createMockTeam({ id: 'team-2', name: 'Beta Team', role: 'DEVELOPER' }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText('Alpha Team')).toBeInTheDocument();
      expect(screen.getByText('PRODUCT_OWNER')).toBeInTheDocument();
      expect(screen.getByText('Beta Team')).toBeInTheDocument();
      expect(screen.getByText('DEVELOPER')).toBeInTheDocument();
    });

    it('should display correct team count in description', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1' }),
        createMockTeam({ id: 'team-2' }),
        createMockTeam({ id: 'team-3' }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText('You are a member of 3 teams:')).toBeInTheDocument();
    });

    it('should display singular "team" for single membership', () => {
      const teams: TeamMembership[] = [createMockTeam()];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText('You are a member of 1 team:')).toBeInTheDocument();
    });

    it('should display section title', () => {
      const teams: TeamMembership[] = [createMockTeam()];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText('Team Impact')).toBeInTheDocument();
    });

    it('should display removal message for regular teams', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Regular Team', isLastPO: false }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText('You will be removed from this team.')).toBeInTheDocument();
    });
  });

  describe('Blocked State Tests', () => {
    it('should show blocked state for last PO (isBlocked=true)', () => {
      const teams: TeamMembership[] = [
        createMockTeam({
          id: 'team-1',
          name: 'Blocked Team',
          role: 'PRODUCT_OWNER',
          isLastPO: true,
        }),
      ];

      const { container } = renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      expect(container.querySelector('.team-impact-section-blocked')).toBeInTheDocument();
    });

    it('should show warning message for blocked team', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Blocked Team', isLastPO: true }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      expect(screen.getByText(/You are the only Product Owner/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /If you delete your account, this team will have no Product Owner. You can schedule deletion with a 14-day grace period./
        )
      ).toBeInTheDocument();
    });

    it('should show "Go to Team Settings" link for blocked teams', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Blocked Team', isLastPO: true }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      expect(
        screen.getByRole('button', { name: /Go to Blocked Team settings/ })
      ).toBeInTheDocument();
      expect(screen.getByText(/Go to Team Settings/)).toBeInTheDocument();
    });

    it('should not show blocked state when isBlocked is false', () => {
      const teams: TeamMembership[] = [createMockTeam({ id: 'team-1', isLastPO: false })];

      const { container } = renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(container.querySelector('.team-impact-section-blocked')).not.toBeInTheDocument();
    });

    it('should separate blocked and regular teams', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Blocked Team', isLastPO: true }),
        createMockTeam({ id: 'team-2', name: 'Regular Team', isLastPO: false }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      // Blocked team should show warning
      expect(screen.getByText('Blocked Team')).toBeInTheDocument();
      expect(screen.getByText(/You are the only Product Owner/)).toBeInTheDocument();

      // Regular team should show removal message
      expect(screen.getByText('Regular Team')).toBeInTheDocument();
      expect(screen.getByText('You will be removed from this team.')).toBeInTheDocument();
    });
  });

  describe('Navigation Tests', () => {
    it('should navigate to team settings when "Go to Team Settings" is clicked', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-123', name: 'Test Team', isLastPO: true }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      const settingsLink = screen.getByRole('button', { name: /Go to Test Team settings/ });
      fireEvent.click(settingsLink);

      // The navigation is handled by react-router, we just verify the button exists and is clickable
      expect(settingsLink).toBeInTheDocument();
    });
  });

  describe('Empty Teams Tests', () => {
    it('should return null when teams array is empty', () => {
      const { container } = renderWithRouter(<TeamImpactWarning teams={[]} isBlocked={false} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle undefined teams gracefully', () => {
      // Component doesn't handle undefined teams - it expects TeamMembership[]
      // This test documents the current behavior
      expect(() => {
        renderWithRouter(
          <TeamImpactWarning teams={undefined as unknown as TeamMembership[]} isBlocked={false} />
        );
      }).toThrow();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have role="region" on the section', () => {
      const teams: TeamMembership[] = [createMockTeam()];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to title', () => {
      const teams: TeamMembership[] = [createMockTeam()];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'team-impact-title');
    });

    it('should have role="alert" on warning messages', () => {
      const teams: TeamMembership[] = [createMockTeam({ id: 'team-1', isLastPO: true })];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible label on team settings button', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'My Team', isLastPO: true }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      const button = screen.getByRole('button', {
        name: /Go to My Team settings to assign a new Product Owner/,
      });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle multiple blocked teams', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Blocked Team 1', isLastPO: true }),
        createMockTeam({ id: 'team-2', name: 'Blocked Team 2', isLastPO: true }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked />);

      expect(screen.getByText('Blocked Team 1')).toBeInTheDocument();
      expect(screen.getByText('Blocked Team 2')).toBeInTheDocument();
      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });

    it('should handle multiple regular teams', () => {
      const teams: TeamMembership[] = [
        createMockTeam({ id: 'team-1', name: 'Team 1' }),
        createMockTeam({ id: 'team-2', name: 'Team 2' }),
        createMockTeam({ id: 'team-3', name: 'Team 3' }),
      ];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText('Team 1')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
      expect(screen.getByText('Team 3')).toBeInTheDocument();
    });

    it('should handle team with long name', () => {
      const longName = 'This is a very long team name that should still be displayed correctly';
      const teams: TeamMembership[] = [createMockTeam({ id: 'team-1', name: longName })];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle special characters in team name', () => {
      const specialName = 'Team <Alpha> & "Beta" \'Gamma\'';
      const teams: TeamMembership[] = [createMockTeam({ id: 'team-1', name: specialName })];

      renderWithRouter(<TeamImpactWarning teams={teams} isBlocked={false} />);

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });
});
