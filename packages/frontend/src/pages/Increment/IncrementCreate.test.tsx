import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { IncrementCreate } from './IncrementCreate';
import { apiService } from './../../services';
import { useTeamContext } from './../../contexts/TeamContext';
import { useToast } from './../../hooks/useToast';
import { useAuthStore } from './../../store';
import { IncrementStatus, SprintStatus } from './../../types';

// Mocks
vi.mock('../../services');
vi.mock('../../contexts/TeamContext');
vi.mock('../../hooks/useToast');
vi.mock('../../store');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('IncrementCreate', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    (useTeamContext as vi.Mock).mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Test Team' },
    });
    (useToast as vi.Mock).mockReturnValue({
      toasts: [],
      success: vi.fn(),
      error: vi.fn(),
      removeToast: vi.fn(),
    });
    (useAuthStore as vi.Mock).mockReturnValue({
      user: { id: 'user-1' },
    });
    // Mock getIncrements to return empty array by default
    (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });
  });

  const renderComponent = (initialEntries = ['/increment/create']) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/increment/create" element={<IncrementCreate />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Sprint Selection', () => {
    it('should render sprint dropdown when not in workflow mode', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [
          { id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE },
          { id: 'sprint-2', name: 'Sprint 2', status: SprintStatus.COMPLETED },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Sprint 1 (active)')).toBeInTheDocument();
      expect(screen.getByText('Sprint 2 (completed)')).toBeInTheDocument();
    });

    it('should not render sprint dropdown in workflow mode', async () => {
      (apiService.getSprint as vi.Mock).mockResolvedValue({
        data: {
          id: 'sprint-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [],
      });

      renderComponent(['/increment/create?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.queryByLabelText(/sprint/i)).not.toBeInTheDocument();
      });
    });

    it('should filter sprints to only show ACTIVE and COMPLETED', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [
          { id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE },
          { id: 'sprint-2', name: 'Sprint 2', status: SprintStatus.COMPLETED },
          { id: 'sprint-3', name: 'Sprint 3', status: SprintStatus.PLANNED },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Sprint 1 (active)')).toBeInTheDocument();
      });

      expect(screen.getByText('Sprint 2 (completed)')).toBeInTheDocument();
      expect(screen.queryByText('Sprint 3 (planned)')).not.toBeInTheDocument();
    });

    it('should clear selected PBIs when sprint changes', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [
          { id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE },
          { id: 'sprint-2', name: 'Sprint 2', status: SprintStatus.ACTIVE },
        ],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockImplementation((sprintId: string) => {
        if (sprintId === 'sprint-1') {
          return Promise.resolve({
            data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
          });
        }
        return Promise.resolve({
          data: [{ id: 'pbi-2', title: 'PBI 2', storyPoints: 3 }],
        });
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      // Select first sprint
      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      await waitFor(() => {
        expect(screen.getByText('1 selected')).toBeInTheDocument();
      });

      // Change to second sprint
      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-2' },
      });

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeInTheDocument();
      });
    });
  });

  describe('PBI Filtering', () => {
    it('should show "Already in increment" badge for duplicated PBIs', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [
          {
            id: 'inc-1',
            includedPBIs: ['pbi-1'],
          },
        ],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [
          { id: 'pbi-1', title: 'PBI 1', storyPoints: 5 },
          { id: 'pbi-2', title: 'PBI 2', storyPoints: 3 },
        ],
      });

      renderComponent();

      // Select a sprint first
      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      await waitFor(() => {
        expect(screen.getByText('Already in an increment')).toBeInTheDocument();
      });
    });

    it('should disable checkbox for PBIs already in increments', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [{ id: 'inc-1', includedPBIs: ['pbi-1'] }],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      // Wait for PBIs to load first
      await waitFor(() => {
        expect(screen.getByText('PBI 1')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('should auto-select only non-duplicated PBIs', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({
        data: [{ id: 'inc-1', includedPBIs: ['pbi-1'] }],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [
          { id: 'pbi-1', title: 'PBI 1', storyPoints: 5 },
          { id: 'pbi-2', title: 'PBI 2', storyPoints: 3 },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      await waitFor(() => {
        // Should show 1 selected (only pbi-2)
        expect(screen.getByText('1 selected')).toBeInTheDocument();
      });
    });

    it('should handle Select All/Deselect All', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [
          { id: 'pbi-1', title: 'PBI 1', storyPoints: 5 },
          { id: 'pbi-2', title: 'PBI 2', storyPoints: 3 },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeInTheDocument();
      });

      // Click Deselect All
      fireEvent.click(screen.getByText('Deselect All'));

      await waitFor(() => {
        expect(screen.getByText('0 selected')).toBeInTheDocument();
      });

      // Click Select All
      fireEvent.click(screen.getByText('Select All'));

      await waitFor(() => {
        expect(screen.getByText('2 selected')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Auto-Delivery', () => {
    it('should auto-deliver increment in workflow mode', async () => {
      const mockToast = { toasts: [], success: vi.fn(), error: vi.fn(), removeToast: vi.fn() };
      (useToast as vi.Mock).mockReturnValue(mockToast);

      (apiService.getSprint as vi.Mock).mockResolvedValue({
        data: {
          id: 'sprint-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });
      (apiService.createIncrement as vi.Mock).mockResolvedValue({
        data: { id: 'inc-1' },
      });
      (apiService.deliverIncrement as vi.Mock).mockResolvedValue({});

      renderComponent(['/increment/create?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Increment' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create & continue/i }));

      await waitFor(() => {
        expect(apiService.createIncrement).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(apiService.deliverIncrement).toHaveBeenCalledWith(
          'inc-1',
          'sprint_review',
          'Delivered via sprint completion workflow'
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Increment delivered! Redirecting to Sprint Review...'
        );
      });
    });

    it('should handle delivery failure gracefully', async () => {
      const mockToast = { toasts: [], success: vi.fn(), error: vi.fn(), removeToast: vi.fn() };
      (useToast as vi.Mock).mockReturnValue(mockToast);

      (apiService.getSprint as vi.Mock).mockResolvedValue({
        data: {
          id: 'sprint-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });
      (apiService.createIncrement as vi.Mock).mockResolvedValue({
        data: { id: 'inc-1' },
      });
      (apiService.deliverIncrement as vi.Mock).mockRejectedValue(new Error('Delivery failed'));

      renderComponent(['/increment/create?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Increment' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create & continue/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Failed to deliver increment. You can deliver it manually from the increment details page.'
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/increment/inc-1?fromSprintComplete=true&sprintId=sprint-1'
      );
    });

    it('should show correct workflow step indicators', async () => {
      (apiService.getSprint as vi.Mock).mockResolvedValue({
        data: {
          id: 'sprint-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [],
      });

      renderComponent(['/increment/create?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 4: Create Increment')).toBeInTheDocument();
      });

      expect(screen.getByText('Sprint Completed')).toBeInTheDocument();
      expect(screen.getByText('Create Increment')).toBeInTheDocument();
      expect(screen.getByText('Deliver Increment')).toBeInTheDocument();
      expect(screen.getByText('Sprint Review')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create increment/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /create increment/i }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      expect(screen.getByText('Please select a sprint')).toBeInTheDocument();
      expect(screen.getByText('At least one PBI must be selected')).toBeInTheDocument();
    });

    it('should clear errors when user corrects them', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create increment/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /create increment/i }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Increment' },
      });

      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const mockToast = { toasts: [], success: vi.fn(), error: vi.fn(), removeToast: vi.fn() };
      (useToast as vi.Mock).mockReturnValue(mockToast);

      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });
      (apiService.createIncrement as vi.Mock).mockResolvedValue({
        data: { id: 'inc-1' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Increment' },
      });

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test description' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create increment/i }));

      await waitFor(() => {
        expect(apiService.createIncrement).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Increment',
            description: 'Test description',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            includedPBIs: ['pbi-1'],
            totalStoryPoints: 5,
            status: IncrementStatus.DRAFT,
            createdBy: 'user-1',
          })
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Increment created successfully!');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/increment/inc-1');
    });

    it('should handle API validation errors', async () => {
      const mockToast = { toasts: [], success: vi.fn(), error: vi.fn(), removeToast: vi.fn() };
      (useToast as vi.Mock).mockReturnValue(mockToast);

      (apiService.getSprints as vi.Mock).mockResolvedValue({
        data: [{ id: 'sprint-1', name: 'Sprint 1', status: SprintStatus.ACTIVE }],
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [{ id: 'pbi-1', title: 'PBI 1', storyPoints: 5 }],
      });
      (apiService.getIncrements as vi.Mock).mockResolvedValue({ data: [] });
      (apiService.createIncrement as vi.Mock).mockRejectedValue({
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Validation failed',
              details: [{ field: 'name', message: 'Name must be unique' }],
            },
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText(/sprint/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/sprint/i), {
        target: { value: 'sprint-1' },
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Increment' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create increment/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Validation failed: name: Name must be unique'
        );
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to increments list on cancel in standalone mode', async () => {
      (apiService.getSprints as vi.Mock).mockResolvedValue({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockNavigate).toHaveBeenCalledWith('/increments');
    });

    it('should navigate to sprint review on back in workflow mode', async () => {
      (apiService.getSprint as vi.Mock).mockResolvedValue({
        data: {
          id: 'sprint-1',
          name: 'Sprint 1',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        },
      });
      (apiService.getEligiblePBIsForIncrement as vi.Mock).mockResolvedValue({
        data: [],
      });

      renderComponent(['/increment/create?fromSprintComplete=true&sprintId=sprint-1']);

      await waitFor(() => {
        expect(screen.getByText('Skip to Sprint Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skip to Sprint Review'));

      expect(mockNavigate).toHaveBeenCalledWith('/sprint-review/sprint-1');
    });
  });
});
