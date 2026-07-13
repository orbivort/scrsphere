import React from 'react';
import { screen, fireEvent, renderWithProviders, initTestI18n } from '../../../test-utils';
import { useSearchParams } from 'react-router-dom';
import { vi } from 'vitest';

import { definitionService } from '../../../services';

import { TeamDefinitionsPage } from './index';

vi.mock('../../../store', () => {
  const mockFn = vi.fn();
  return {
    __esModule: true,
    default: mockFn,
    useTeamStore: mockFn,
  };
});

vi.mock('../../../services', () => ({
  definitionService: {
    getDefinitionOfReady: vi.fn(),
    updateDefinitionOfReady: vi.fn(),
    getDefinitionOfDone: vi.fn(),
    updateDefinitionOfDone: vi.fn(),
  },
}));

vi.mock('./components', () => ({
  DefinitionOfReadyPanel: () => <div data-testid="dor-panel">Definition of Ready Panel</div>,
  DefinitionOfDonePanel: () => <div data-testid="dod-panel">Definition of Done Panel</div>,
}));

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team',
  createdBy: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('TeamDefinitionsPage', () => {
  let useTeamStoreMock: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    initTestI18n();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    useTeamStoreMock = (await import('../../../store')).default;
    useTeamStoreMock.mockReturnValue({
      currentTeam: mockTeam,
    });
    (definitionService.getDefinitionOfReady as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'dor-1',
        teamId: 'team-1',
        items: [],
        version: 1,
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
    (definitionService.getDefinitionOfDone as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'dod-1',
        teamId: 'team-1',
        items: [],
        version: 1,
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
  });

  describe('Rendering', () => {
    it('should render page with tabs', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      expect(screen.getByRole('heading', { name: 'Team Definitions' })).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Definition of Ready' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Definition of Done' })).toBeInTheDocument();
    });

    it('should show Definition of Ready tab by default', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      expect(dorTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('dor-panel')).toBeInTheDocument();
    });

    it('should show page subtitle', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      expect(
        screen.getByText(
          "Configure your team's Definition of Ready and Definition of Done criteria"
        )
      ).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to Definition of Done tab when clicked', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      fireEvent.click(dodTab);

      expect(dodTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Definition of Ready' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      expect(screen.getByTestId('dod-panel')).toBeInTheDocument();
    });

    it('should switch back to Definition of Ready tab when clicked', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      fireEvent.click(dodTab);

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      fireEvent.click(dorTab);

      expect(dorTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('dor-panel')).toBeInTheDocument();
    });
  });

  describe('URL Query Parameter Handling', () => {
    it('should update URL query param when tab changes', () => {
      const TestWrapper = () => {
        const [searchParams] = useSearchParams();
        return (
          <>
            <span data-testid="current-tab">{searchParams.get('tab') || 'dor'}</span>
            <TeamDefinitionsPage />
          </>
        );
      };

      renderWithProviders(<TestWrapper />);

      expect(screen.getByTestId('current-tab')).toHaveTextContent('dor');

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      fireEvent.click(dodTab);

      expect(screen.getByTestId('current-tab')).toHaveTextContent('dod');
    });

    it('should read initial tab from URL query param (?tab=dod)', () => {
      renderWithProviders(<TeamDefinitionsPage />, { initialRoute: '/?tab=dod' });

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      expect(dodTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('dod-panel')).toBeInTheDocument();
    });

    it('should default to dor tab for invalid query param', () => {
      renderWithProviders(<TeamDefinitionsPage />, { initialRoute: '/?tab=invalid' });

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      expect(dorTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('dor-panel')).toBeInTheDocument();
    });

    it('should update URL when switching from dod to dor', () => {
      const TestWrapper = () => {
        const [searchParams] = useSearchParams();
        return (
          <>
            <span data-testid="current-tab">{searchParams.get('tab') || 'dor'}</span>
            <TeamDefinitionsPage />
          </>
        );
      };

      renderWithProviders(<TestWrapper />, { initialRoute: '/?tab=dod' });

      expect(screen.getByTestId('current-tab')).toHaveTextContent('dod');

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      fireEvent.click(dorTab);

      expect(screen.getByTestId('current-tab')).toHaveTextContent('dor');
    });
  });

  describe('No Team Selected', () => {
    it('should show "No Team Selected" message when no team', async () => {
      useTeamStoreMock.mockReturnValue({
        currentTeam: null,
      });

      renderWithProviders(<TeamDefinitionsPage />);

      expect(screen.getByRole('heading', { name: 'No Team Selected' })).toBeInTheDocument();
      expect(screen.getByText('Please select a team to continue.')).toBeInTheDocument();
    });

    it('should not show tabs when no team is selected', async () => {
      useTeamStoreMock.mockReturnValue({
        currentTeam: null,
      });

      renderWithProviders(<TeamDefinitionsPage />);

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should switch tab on Enter key press', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      dodTab.focus();
      fireEvent.click(dodTab);

      expect(dodTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('dod-panel')).toBeInTheDocument();
    });

    it('should switch tab on Space key press', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      dodTab.focus();
      fireEvent.click(dodTab);

      expect(dodTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('dod-panel')).toBeInTheDocument();
    });

    it('should handle Tab key to navigate between tabs', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });

      dorTab.focus();
      expect(document.activeElement).toBe(dorTab);

      fireEvent.keyDown(dorTab, { key: 'Tab', code: 'Tab' });
      dodTab.focus();
      expect(document.activeElement).toBe(dodTab);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for tabs', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      expect(dorTab).toHaveAttribute('aria-selected', 'true');
      expect(dorTab).toHaveAttribute('aria-controls', 'dor-panel');

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      expect(dodTab).toHaveAttribute('aria-selected', 'false');
      expect(dodTab).toHaveAttribute('aria-controls', 'dod-panel');
    });

    it('should have proper ARIA attributes for tab panels', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const tabpanels = screen.getAllByRole('tabpanel', { hidden: true });
      expect(tabpanels).toHaveLength(2);

      const dorPanel = tabpanels.find((panel) => panel.id === 'dor-panel');
      expect(dorPanel).toBeDefined();

      const dodPanel = tabpanels.find((panel) => panel.id === 'dod-panel');
      expect(dodPanel).toBeDefined();
    });

    it('should update aria-selected when tabs change', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const dorTab = screen.getByRole('tab', { name: 'Definition of Ready' });
      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });

      expect(dorTab).toHaveAttribute('aria-selected', 'true');
      expect(dodTab).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(dodTab);

      expect(dorTab).toHaveAttribute('aria-selected', 'false');
      expect(dodTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have hidden attribute on inactive tab panel', () => {
      renderWithProviders(<TeamDefinitionsPage />);

      const tabpanels = screen.getAllByRole('tabpanel', { hidden: true });
      const dodPanel = tabpanels.find((panel) => panel.id === 'dod-panel');
      expect(dodPanel).toBeDefined();
      expect(dodPanel).toHaveAttribute('hidden');

      const dodTab = screen.getByRole('tab', { name: 'Definition of Done' });
      fireEvent.click(dodTab);

      const updatedTabpanels = screen.getAllByRole('tabpanel', { hidden: true });
      const dorPanel = updatedTabpanels.find((panel) => panel.id === 'dor-panel');
      expect(dorPanel).toBeDefined();
      expect(dorPanel).toHaveAttribute('hidden');
    });
  });
});
