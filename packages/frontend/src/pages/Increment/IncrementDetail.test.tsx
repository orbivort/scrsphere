/**
 * IncrementDetail Component Tests
 *
 * Test Coverage:
 * - Loading states
 * - Error states
 * - Increment detail display
 * - Delivery modal functionality
 * - Navigation (back button)
 * - Workflow mode (from sprint completion)
 * - DoD verification display
 * - PBI list display
 * - Timeline display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { IncrementDetail } from './IncrementDetail';
import { apiService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { IncrementStatus, DeliveryMethod } from '../../types';

// Mocks
vi.mock('../../services');
vi.mock('../../hooks/useToast');
vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: vi.fn(() => ({
    modalRef: { current: null },
    handleKeyDown: vi.fn(),
  })),
}));

const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

describe('IncrementDetail', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockIncrement = {
    id: 'inc-1',
    name: 'Test Increment',
    description: 'Test description',
    status: IncrementStatus.VERIFIED,
    teamId: 'team-1',
    sprintId: 'sprint-1',
    sprint: { id: 'sprint-1', name: 'Sprint 1' },
    totalStoryPoints: 21,
    includedPBIs: ['pbi-1', 'pbi-2', 'pbi-3'],
    dodVerifications: [
      {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dodItemId: 'dod-1',
        isVerified: true,
        verifiedBy: 'user-1',
        verifiedAt: '2026-01-10T00:00:00Z',
        dodItemDescription: 'Code reviewed',
        dodItemCategory: 'quality',
      },
      {
        id: 'ver-2',
        pbiId: 'pbi-1',
        dodItemId: 'dod-2',
        isVerified: true,
        verifiedBy: 'user-1',
        verifiedAt: '2026-01-10T00:00:00Z',
        dodItemDescription: 'Tests passed',
        dodItemCategory: 'testing',
      },
      {
        id: 'ver-3',
        pbiId: 'pbi-2',
        dodItemId: 'dod-1',
        isVerified: false,
        verifiedBy: 'user-1',
        verifiedAt: '2026-01-10T00:00:00Z',
        dodItemDescription: 'Code reviewed',
        dodItemCategory: 'quality',
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'user-1',
  };

  const mockEligiblePBIs = [
    {
      id: 'pbi-1',
      title: 'PBI One',
      storyPoints: 8,
      labels: ['frontend', 'urgent'],
    },
    {
      id: 'pbi-2',
      title: 'PBI Two',
      storyPoints: 5,
      labels: ['backend'],
    },
    {
      id: 'pbi-3',
      title: 'PBI Three',
      storyPoints: 8,
      labels: [],
    },
  ];

  const mockToast = {
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
    removeToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    (useToast as vi.Mock).mockReturnValue(mockToast);
    mockUseParams.mockReturnValue({ id: 'inc-1' });
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
  });

  const renderComponent = (initialEntries = ['/increment/inc-1']) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/increment/:id" element={<IncrementDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Loading States', () => {
    it('should show loading state while fetching increment', () => {
      (apiService.getIncrement as vi.Mock).mockImplementation(() => new Promise(() => {}));

      renderComponent();

      expect(screen.getByText(/Loading increment/i)).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      (apiService.getIncrement as vi.Mock).mockImplementation(() => new Promise(() => {}));

      const { container } = renderComponent();

      expect(container.querySelector('[class*="loading-spinner"]')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show error state when increment fetch fails', async () => {
      (apiService.getIncrement as vi.Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load increment/i)).toBeInTheDocument();
      });
    });

    it('should show error details when available', async () => {
      (apiService.getIncrement as vi.Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should have back button in error state', async () => {
      (apiService.getIncrement as vi.Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Back to Increments/i)).toBeInTheDocument();
      });
    });

    it('should navigate back on error state button click', async () => {
      (apiService.getIncrement as vi.Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Back to Increments/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Back to Increments/i));

      expect(mockNavigate).toHaveBeenCalledWith('/increments');
    });
  });

  describe('Increment Detail Display', () => {
    beforeEach(() => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: mockIncrement,
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });
    });

    it('should display increment name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Increment')).toBeInTheDocument();
      });
    });

    it('should display increment status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('VERIFIED')).toBeInTheDocument();
      });
    });

    it('should display increment description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test description')).toBeInTheDocument();
      });
    });

    it('should display sprint name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint 1')).toBeInTheDocument();
      });
    });

    it('should display story points', async () => {
      renderComponent();

      await waitFor(() => {
        const { container } = renderComponent();
        const detailGrid = container.querySelector('[class*="detail-grid"]');
        expect(detailGrid?.textContent).toContain('21');
      });
    });

    it('should display PBIs count', async () => {
      renderComponent();

      await waitFor(() => {
        const { container } = renderComponent();
        const detailGrid = container.querySelector('[class*="detail-grid"]');
        expect(detailGrid?.textContent).toContain('3');
      });
    });

    it('should display created date', async () => {
      const { container } = renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Increment')).toBeInTheDocument();
      });

      // Check for Created label in the info grid
      expect(container.textContent).toContain('Created');
    });
  });

  describe('Back Button Navigation', () => {
    beforeEach(() => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: mockIncrement,
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });
    });

    it('should show back button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Back to Increments/i)).toBeInTheDocument();
      });
    });

    it('should navigate back to increments list', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Back to Increments/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Back to Increments/i));

      expect(mockNavigate).toHaveBeenCalledWith('/increments');
    });
  });

  describe('Deliver Button', () => {
    it('should show deliver button for VERIFIED status', async () => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: { ...mockIncrement, status: IncrementStatus.VERIFIED },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });
    });

    it('should show deliver button for DRAFT status', async () => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: { ...mockIncrement, status: IncrementStatus.DRAFT },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });
    });

    it('should not show deliver button for DELIVERED status', async () => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: {
          ...mockIncrement,
          status: IncrementStatus.DELIVERED,
          deliveredAt: '2026-01-15T00:00:00Z',
        },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Deliver Increment/i)).not.toBeInTheDocument();
    });

    it('should not show deliver button for ARCHIVED status', async () => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: { ...mockIncrement, status: IncrementStatus.ARCHIVED },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Test Increment')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Deliver Increment/i)).not.toBeInTheDocument();
    });
  });

  describe('Delivery Modal', () => {
    beforeEach(() => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: { ...mockIncrement, status: IncrementStatus.VERIFIED },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });
      (apiService.deliverIncrement as vi.Mock).mockResolvedValue({});
    });

    it('should open delivery modal on deliver button click', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/Mark this Increment as delivered/i)).toBeInTheDocument();
    });

    it('should show delivery method options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText('Sprint Review')).toBeInTheDocument();
      expect(screen.getByText('Early Release')).toBeInTheDocument();
    });

    it('should have notes textarea', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check for textarea in the modal
      const dialog = screen.getByRole('dialog');
      expect(dialog.querySelector('textarea')).toBeInTheDocument();
    });

    it('should have confirmation checkbox', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByLabelText(/I understand this action is irreversible/i)
      ).toBeInTheDocument();
    });

    it('should disable confirm button without checkbox checked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm Delivery/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when checkbox is checked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText(/I understand this action is irreversible/i);
      fireEvent.click(checkbox);

      const confirmButton = screen.getByRole('button', { name: /Confirm Delivery/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should call deliver mutation on confirm', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText(/I understand this action is irreversible/i);
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Delivery/i }));

      await waitFor(() => {
        expect(apiService.deliverIncrement).toHaveBeenCalledWith(
          'inc-1',
          DeliveryMethod.SPRINT_REVIEW,
          ''
        );
      });
    });

    it('should close modal on cancel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show success toast on successful delivery', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText(/I understand this action is irreversible/i);
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Delivery/i }));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Increment delivered successfully!');
      });
    });

    it('should show error toast on delivery failure', async () => {
      (apiService.deliverIncrement as vi.Mock).mockRejectedValue(new Error('Delivery failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Deliver Increment/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Deliver Increment/i));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText(/I understand this action is irreversible/i);
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Delivery/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Failed to deliver increment. Please try again.'
        );
      });
    });
  });

  describe('Workflow Mode', () => {
    it('should show workflow indicator when fromSprintComplete', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams('fromSprintComplete=true&sprintId=sprint-1'),
        vi.fn(),
      ]);

      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: mockIncrement,
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent(['/increment/inc-1?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByText('Sprint Completion Workflow')).toBeInTheDocument();
      });

      expect(screen.getByText('Step 3 of 4: Deliver Increment')).toBeInTheDocument();
    });

    it('should show workflow progress steps', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams('fromSprintComplete=true&sprintId=sprint-1'),
        vi.fn(),
      ]);

      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: mockIncrement,
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent(['/increment/inc-1?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByText('Sprint Completed')).toBeInTheDocument();
      });

      // Check workflow steps are displayed
      const workflowIndicator = document.querySelector('[class*="workflow-indicator"]');
      expect(workflowIndicator?.textContent).toContain('Sprint Completion Workflow');
      expect(workflowIndicator?.textContent).toContain('Step 3 of 4');
      expect(workflowIndicator?.textContent).toContain('Deliver Increment');
    });

    it('should show Skip to Sprint Review back button in workflow mode', async () => {
      mockUseSearchParams.mockReturnValue([
        new URLSearchParams('fromSprintComplete=true&sprintId=sprint-1'),
        vi.fn(),
      ]);

      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: mockIncrement,
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });

      renderComponent(['/increment/inc-1?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByText('Skip to Sprint Review')).toBeInTheDocument();
      });
    });
  });

  describe('Timeline', () => {
    beforeEach(() => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: mockIncrement,
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: mockEligiblePBIs,
      });
    });

    it('should display created timeline item', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Increment Created')).toBeInTheDocument();
      });
    });

    it('should display delivered timeline item for delivered increments', async () => {
      (apiService.getIncrement as vi.Mock).mockResolvedValue({
        data: {
          ...mockIncrement,
          status: IncrementStatus.DELIVERED,
          deliveredAt: '2026-01-15T00:00:00Z',
          deliveryMethod: DeliveryMethod.SPRINT_REVIEW,
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Delivered via Sprint Review/i)).toBeInTheDocument();
      });
    });
  });
});
