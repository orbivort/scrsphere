import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { screen, waitFor, renderWithProviders, initTestI18n } from '../../test-utils';
import { QueryClient } from '@tanstack/react-query';

import { DailyScrum } from './DailyScrum';
import { useTeamStore, useAuthStore } from '../../store';
import { apiService } from '../../services';
import { UserRole } from '../../types';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

vi.mock('../../services', () => ({
  apiService: {
    getActiveSprint: vi.fn(),
    getSprintTasks: vi.fn(),
    getDailyUpdates: vi.fn(),
    getTeamMembersWithUpdates: vi.fn(),
    createDailyUpdate: vi.fn(),
    promoteToImpediment: vi.fn(),
    sendDailyUpdateReminder: vi.fn(),
    getProductGoals: vi.fn(),
  },
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    removeToast: vi.fn(),
  }),
  ToastContainer: () => <div data-testid="toast-container" />,
}));

vi.mock('../../components/TeamMemberSelect/TeamMemberSelect', () => ({
  TeamMemberSelect: () => <div data-testid="team-member-select" />,
}));

vi.mock('../../hooks/useFormDraft', () => ({
  useFormDraft: () => ({
    draft: null,
    hasDraft: false,
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
    showRestorePrompt: false,
    setShowRestorePrompt: vi.fn(),
    lastSavedAt: null,
  }),
}));

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: () => ({ modalRef: { current: null } }),
}));

vi.mock('../../components/common/Form/CharacterCounter', () => ({
  CharacterCounter: ({ id, current, max }: { id: string; current: number; max: number }) => (
    <span id={id}>
      {current} / {max}
    </span>
  ),
}));

vi.mock('../../components/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    type,
    disabled,
    loading,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }) => (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className || ''}`}
      data-variant={variant}
      data-loading={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

vi.mock('../../components/Skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('../../components/Icon', () => ({
  CheckCircleIcon: () => <span>✓</span>,
  ClockIcon: () => <span>⏰</span>,
  AlertTriangleIcon: () => <span>⚠️</span>,
  ChartIcon: () => <span>📊</span>,
}));

beforeAll(async () => {
  await initTestI18n();
});

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } });

const renderDailyScrum = (queryClient?: QueryClient) =>
  renderWithProviders(<DailyScrum />, {
    queryClient: queryClient || createTestQueryClient(),
    initialRoute: '/',
  });

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  slug: 'test-team',
  members: [
    {
      id: 'member-1',
      teamId: 'team-1',
      userId: 'user-1',
      role: UserRole.DEVELOPERS,
      user: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
    },
  ],
};

const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };

describe('scratch', () => {
  let mockUseTeamStore: ReturnType<typeof vi.fn>;
  let mockUseAuthStore: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    mockUseTeamStore = vi.mocked(useTeamStore);
    mockUseAuthStore = vi.mocked(useAuthStore);
    mockApiService = vi.mocked(apiService);

    mockUseTeamStore.mockReturnValue({ currentTeam: mockTeam });
    mockUseAuthStore.mockReturnValue({ user: mockUser });

    mockApiService.getActiveSprint.mockResolvedValue({
      success: true,
      data: {
        id: 'sprint-1',
        name: 'Sprint 1',
        sprintGoal: 'Goal',
        status: 'ACTIVE',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-30T00:00:00Z',
        teamId: 'team-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
    mockApiService.getSprintTasks.mockResolvedValue({ success: true, data: [] });
    mockApiService.getDailyUpdates.mockResolvedValue({ success: true, data: [] });
    mockApiService.getTeamMembersWithUpdates.mockResolvedValue({
      success: true,
      data: { submitted: [], pending: [] },
    });
    mockApiService.getProductGoals.mockResolvedValue({ success: true, data: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('observes auto-expand', async () => {
    renderDailyScrum();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /daily scrum/i })).toBeInTheDocument();
    });
    await new Promise((r) => setTimeout(r, 300));
    const btn = screen.queryByRole('button', { name: /submit update/i });
    const form = screen.queryByLabelText(/what did you do yesterday/i);

    console.log(`HAS_BUTTON=${btn !== null} HAS_FORM=${form !== null}`);
    expect(document.body).toBeTruthy();
  });
});
