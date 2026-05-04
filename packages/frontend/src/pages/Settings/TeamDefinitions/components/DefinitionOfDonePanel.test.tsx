import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import { definitionService } from '../../../../services';
import { DefinitionOfDonePanel } from './DefinitionOfDonePanel';

vi.mock('../../../../store', () => {
  const mockFn = vi.fn();
  return {
    __esModule: true,
    default: mockFn,
    useTeamStore: mockFn,
  };
});

vi.mock('../../../../services', () => ({
  definitionService: {
    getDefinitionOfDone: vi.fn(),
    updateDefinitionOfDone: vi.fn(),
  },
}));

vi.mock('./DefinitionEditor', () => ({
  DefinitionEditor: () => <div data-testid="definition-editor">Definition Editor</div>,
}));

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>);
};

describe('DefinitionOfDonePanel', () => {
  let useTeamStoreMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    useTeamStoreMock = (await import('../../../../store')).default;
    useTeamStoreMock.mockReturnValue({
      currentTeam: mockTeam,
    });
  });

  it('should render loading state initially', () => {
    (definitionService.getDefinitionOfDone as vi.Mock).mockImplementation(
      () => new Promise(() => {})
    );
    renderWithProviders(<DefinitionOfDonePanel />);
    expect(screen.getByText(/Loading Definition of Done.../)).toBeInTheDocument();
  });

  it('should render error state when API fails', async () => {
    (definitionService.getDefinitionOfDone as vi.Mock).mockRejectedValue(new Error('Failed'));
    renderWithProviders(<DefinitionOfDonePanel />);
    expect(await screen.findByText('Failed to Load')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('should render empty state when no active items', async () => {
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
    renderWithProviders(<DefinitionOfDonePanel />);
    expect(await screen.findByText('No Active DoD Items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure DoD' })).toBeInTheDocument();
  });

  it('should render definition items when available', async () => {
    (definitionService.getDefinitionOfDone as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'dod-1',
        teamId: 'team-1',
        items: [
          {
            id: 'item-1',
            description: 'Test item 1',
            category: 'code-quality',
            isActive: true,
            order: 0,
          },
          {
            id: 'item-2',
            description: 'Test item 2',
            category: 'testing',
            isActive: true,
            order: 1,
          },
        ],
        version: 1,
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
    renderWithProviders(<DefinitionOfDonePanel />);
    expect(await screen.findByText('Test item 1')).toBeInTheDocument();
    expect(screen.getByText('Test item 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit DoD' })).toBeInTheDocument();
  });

  it('should switch to edit mode when edit button clicked', async () => {
    (definitionService.getDefinitionOfDone as vi.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 'dod-1',
        teamId: 'team-1',
        items: [
          {
            id: 'item-1',
            description: 'Test item',
            category: 'code-quality',
            isActive: true,
            order: 0,
          },
        ],
        version: 1,
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
    renderWithProviders(<DefinitionOfDonePanel />);
    const editButton = await screen.findByRole('button', { name: 'Edit DoD' });
    fireEvent.click(editButton);
    expect(screen.getByTestId('definition-editor')).toBeInTheDocument();
  });

  it('should show "No Team Selected" when no team', async () => {
    useTeamStoreMock.mockReturnValue({ currentTeam: null });
    renderWithProviders(<DefinitionOfDonePanel />);
    expect(
      await screen.findByText('Please select a team to view and manage the Definition of Done.')
    ).toBeInTheDocument();
  });
});
