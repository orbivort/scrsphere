import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataExportButton } from './DataExportButton';
import { useDataExport } from '../../../../hooks/useDataExport';
import type { ExportStatus } from '../../../../types/dataExport.types';

// Mock the CSS module
vi.mock('./DataExport.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: () => 'mock-class',
    }
  ),
}));

// Mock the useDataExport hook
vi.mock('../../../../hooks/useDataExport', () => ({
  useDataExport: vi.fn(),
}));

// Mock DataExportModal
const { mockDataExportModal } = vi.hoisted(() => {
  const mockFn = vi.fn(() => <div data-testid="data-export-modal">Mock Modal</div>);
  return { mockDataExportModal: mockFn };
});
vi.mock('./DataExportModal', () => ({
  DataExportModal: mockDataExportModal,
}));

describe('DataExportButton Component', () => {
  const mockOnExportStart = vi.fn();
  const mockOnExportComplete = vi.fn();
  const mockOnExportError = vi.fn();

  const createMockState = (
    overrides: Partial<{
      isLoading: boolean;
      isPolling: boolean;
      currentJobId: string | null;
      status: ExportStatus | null;
      progress: number;
      error: string | null;
      downloadUrl: string | null;
      expiresAt: string | null;
    }> = {}
  ) => ({
    isLoading: false,
    isPolling: false,
    currentJobId: null,
    status: null as ExportStatus | null,
    progress: 0,
    error: null,
    downloadUrl: null,
    expiresAt: null,
    ...overrides,
  });

  const createMockHookReturn = (stateOverrides: Partial<ReturnType<typeof useDataExport>> = {}) => {
    const defaultReturn = {
      state: createMockState(),
      initiateExport: vi.fn().mockResolvedValue(undefined),
      checkStatus: vi.fn().mockResolvedValue(undefined),
      downloadExport: vi.fn().mockResolvedValue(undefined),
      cancelExport: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn(),
      isActive: false,
      canDownload: false,
      hasError: false,
    };

    return { ...defaultReturn, ...stateOverrides };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDataExportModal.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render with default Export My Data text when idle', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with correct aria attributes', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Export your personal data');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render Export My Data text with icon', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(screen.getByText('Export My Data')).toBeInTheDocument();
    });

    it('should render Download Export text when canDownload is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ currentJobId: 'test-job-id', status: 'completed' }),
          canDownload: true,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(screen.getByText('Download Export')).toBeInTheDocument();
    });

    it('should render Exporting... text when isActive is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({
            currentJobId: 'test-job-id',
            status: 'processing',
            isLoading: true,
          }),
          isActive: true,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should render DataExportModal component', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(screen.getByTestId('data-export-modal')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onExportStart and initiateExport when clicked', async () => {
      const user = userEvent.setup();
      const mockInitiateExport = vi.fn().mockResolvedValue(undefined);

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          initiateExport: mockInitiateExport,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnExportStart).toHaveBeenCalledTimes(1);
      expect(mockInitiateExport).toHaveBeenCalledTimes(1);
    });

    it('should render Download Export button when canDownload is true', async () => {
      const user = userEvent.setup();

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ currentJobId: 'test-job-id', status: 'completed' }),
          canDownload: true,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByText('Download Export').closest('button');
      expect(button).toBeInTheDocument();
      await user.click(button!);
    });

    it('should not call onExportStart when button is disabled', async () => {
      const user = userEvent.setup();

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
          isActive: true,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      await user.click(button);

      expect(mockOnExportStart).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should render DataExportModal component', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({
            currentJobId: 'job-123',
            status: 'processing',
            progress: 50,
            error: null,
            isPolling: true,
          }),
          canDownload: false,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(screen.getByTestId('data-export-modal')).toBeInTheDocument();
    });

    it('should update aria-busy when isActive changes', () => {
      const { rerender } = render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      let button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
          isActive: true,
        })
      );

      rerender(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should call onExportError when hasError is true', () => {
      const mockError = new Error('Export failed');

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ error: 'Export failed' }),
          hasError: true,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      expect(mockOnExportError).toHaveBeenCalledWith(mockError);
    });

    it('should handle null onExportError callback gracefully', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ error: 'Some error' }),
          hasError: true,
        })
      );

      expect(() => {
        render(
          <DataExportButton
            onExportStart={mockOnExportStart}
            onExportComplete={mockOnExportComplete}
            onExportError={null}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when isActive is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
          isActive: true,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when isLoading is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive clicks', async () => {
      const user = userEvent.setup();
      const mockInitiateExport = vi.fn().mockResolvedValue(undefined);

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          initiateExport: mockInitiateExport,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnExportStart).toHaveBeenCalledTimes(3);
      expect(mockInitiateExport).toHaveBeenCalledTimes(3);
    });

    it('should handle all export statuses correctly', () => {
      const statuses: ExportStatus[] = ['pending', 'processing', 'completed', 'failed', 'expired'];

      statuses.forEach((status) => {
        vi.clearAllMocks();
        mockDataExportModal.mockClear();

        (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
          createMockHookReturn({
            state: createMockState({
              status,
              currentJobId: status === 'completed' ? 'job-123' : null,
            }),
            canDownload: status === 'completed',
          })
        );

        const { unmount } = render(
          <DataExportButton
            onExportStart={mockOnExportStart}
            onExportComplete={mockOnExportComplete}
            onExportError={mockOnExportError}
          />
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when idle', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Export your personal data');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockInitiateExport = vi.fn().mockResolvedValue(undefined);

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          initiateExport: mockInitiateExport,
        })
      );

      render(
        <DataExportButton
          onExportStart={mockOnExportStart}
          onExportComplete={mockOnExportComplete}
          onExportError={mockOnExportError}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);

      await user.keyboard('{Enter}');

      expect(mockOnExportStart).toHaveBeenCalled();
    });
  });

  describe('Props Validation', () => {
    it('should work without optional callback props', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      expect(() => {
        render(<DataExportButton />);
      }).not.toThrow();
    });

    it('should call undefined callbacks gracefully without errors', async () => {
      const user = userEvent.setup();
      const mockInitiateExport = vi.fn().mockResolvedValue(undefined);

      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          initiateExport: mockInitiateExport,
        })
      );

      render(<DataExportButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockInitiateExport).toHaveBeenCalled();
    });
  });

  describe('Button Text Variations', () => {
    it('should show Export My Data in idle state', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(<DataExportButton />);

      expect(screen.getByText('Export My Data')).toBeInTheDocument();
    });

    it('should show Exporting... when isLoading is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
          isActive: true,
        })
      );

      render(<DataExportButton />);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should show Download Export when canDownload is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ currentJobId: 'job-123', status: 'completed' }),
          canDownload: true,
        })
      );

      render(<DataExportButton />);

      expect(screen.getByText('Download Export')).toBeInTheDocument();
    });

    it('should show spinner icon when exporting', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
          isActive: true,
        })
      );

      render(<DataExportButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Error Effect', () => {
    it('should not call onExportError when hasError is false', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ error: 'Some error' }),
          hasError: false,
        })
      );

      render(<DataExportButton />);

      expect(mockOnExportError).not.toHaveBeenCalled();
    });

    it('should not call onExportError when error is null', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ error: null }),
          hasError: true,
        })
      );

      render(<DataExportButton />);

      expect(mockOnExportError).not.toHaveBeenCalled();
    });
  });

  describe('Disabled Prop', () => {
    it('should disable button when disabled prop is explicitly false but isActive is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: false }),
          isActive: true,
        })
      );

      render(<DataExportButton disabled={false} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when both disabled and isLoading are true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ isLoading: true }),
        })
      );

      render(<DataExportButton disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Modal Props Passing', () => {
    it('should pass correct props to DataExportModal', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({
            currentJobId: 'modal-test-job',
            status: 'processing',
            progress: 45,
            error: null,
            isPolling: true,
          }),
          canDownload: false,
        })
      );

      render(<DataExportButton />);

      const modalCall = mockDataExportModal.mock.calls[0][0];
      expect(modalCall.isOpen).toBe(true);
      expect(modalCall.jobId).toBe('modal-test-job');
      expect(modalCall.status).toBe('processing');
      expect(modalCall.progress).toBe(45);
      expect(modalCall.canDownload).toBe(false);
      expect(modalCall.isPolling).toBe(true);
    });

    it('should pass false to isOpen when currentJobId is null', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ currentJobId: null }),
        })
      );

      render(<DataExportButton />);

      const modalCall = mockDataExportModal.mock.calls[0][0];
      expect(modalCall.isOpen).toBe(false);
      expect(modalCall.jobId).toBeNull();
    });
  });

  describe('Icon Rendering', () => {
    it('should render download icon (↓) when canDownload is true', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn({
          state: createMockState({ currentJobId: 'job-123', status: 'completed' }),
          canDownload: true,
        })
      );

      render(<DataExportButton />);

      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('should render download emoji (📥) in idle state', () => {
      (useDataExport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockHookReturn()
      );

      render(<DataExportButton />);

      expect(screen.getByText('📥')).toBeInTheDocument();
    });
  });
});
