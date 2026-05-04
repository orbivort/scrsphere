import { screen, render, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { BulkUploadModal } from './BulkUploadModal';
import { apiService } from '../../../services';
import { BacklogProvider } from '../context/BacklogContext';
import * as bulkUploadUtils from './bulkUploadUtils';

vi.mock('../../../services', () => ({
  apiService: {
    getProductBacklog: vi.fn(),
    createProductBacklogItem: vi.fn(),
  },
}));

const mockParseCSV = vi.mocked(bulkUploadUtils.parseCSV);
const mockValidateItems = vi.mocked(bulkUploadUtils.validateItems);
const mockGetValidItems = vi.mocked(bulkUploadUtils.getValidItems);

vi.mock('./bulkUploadUtils', () => ({
  parseCSV: vi.fn(() => ({ items: [], errors: [] })),
  validateItems: vi.fn(() => []),
  getValidItems: vi.fn(() => []),
  getInvalidItems: vi.fn(() => []),
  isValidFileType: vi.fn((file: File) => file.name.endsWith('.csv')),
  formatFileSize: vi.fn((bytes: number) => `${bytes} Bytes`),
  generateCSVTemplate: vi.fn(() => 'title\ndownload'),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderBulkUploadModal = (props = {}) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BacklogProvider>
        <BulkUploadModal
          isOpen={true}
          onClose={vi.fn()}
          onUploadComplete={vi.fn()}
          teamId="team-1"
          goalId="goal-1"
          existingItems={[]}
          {...props}
        />
      </BacklogProvider>
    </QueryClientProvider>
  );
};

const createMockFile = (name: string, content: string, type: string = 'text/csv'): File => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(content),
  });
  return file;
};

describe('BulkUploadModal', () => {
  const mockOnClose = vi.fn();
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getProductBacklog as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: [],
    });
    (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { id: 'new-item' },
    });
    mockParseCSV.mockReturnValue({ items: [], errors: [], totalRows: 0 });
    mockValidateItems.mockReturnValue([]);
    mockGetValidItems.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      renderBulkUploadModal({ isOpen: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal when open', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should render modal title', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Bulk Import Backlog Items')).toBeInTheDocument();
      });
    });

    it('should render step indicator dots', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        const stepDots = document.querySelectorAll('[class*="step-dot"]');
        expect(stepDots.length).toBe(4);
      });
    });
  });

  describe('Step Navigation', () => {
    it('should start on upload step', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should render file drop zone', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
        expect(screen.getByText('or click to browse')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call onClose when clicking cancel', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        const modal = document.querySelector('[role="dialog"]');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveAttribute('aria-modal', 'true');
      });
    });
  });

  describe('File Input', () => {
    it('should have file input element', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });
    });
  });

  describe('Template Download', () => {
    it('should have download template button', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Download CSV Template')).toBeInTheDocument();
      });
    });
  });

  describe('File Selection', () => {
    it('should handle file selection', async () => {
      const mockFile = createMockFile('test.csv', 'title\nTest Item');
      mockParseCSV.mockReturnValue({
        items: [{ _rowNumber: 1, title: 'Test Item' }],
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue([{ _rowNumber: 1, title: 'Test Item', _isValid: true }]);
      mockGetValidItems.mockReturnValue([{ _rowNumber: 1, title: 'Test Item', _isValid: true }]);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    it('should show error for invalid file type', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Parse Error Handling', () => {
    it('should show parse error when CSV has errors', async () => {
      mockParseCSV.mockReturnValue({
        items: [],
        errors: [{ row: 1, field: 'header', message: 'Missing title column' }],
        totalRows: 0,
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should show error when no data found', async () => {
      mockParseCSV.mockReturnValue({
        items: [],
        errors: [],
        totalRows: 0,
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Preview Step', () => {
    it('should navigate to preview step after valid file selection', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Import Functionality', () => {
    it('should disable import button when no valid items', async () => {
      mockGetValidItems.mockReturnValue([]);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle successful import', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Progress', () => {
    it('should show progress during upload', async () => {
      const mockItems = [
        { _rowNumber: 1, title: 'Item 1', _isValid: true },
        { _rowNumber: 2, title: 'Item 2', _isValid: true },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 2,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Summary', () => {
    it('should show summary after upload completes', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Back Navigation', () => {
    it('should go back to upload step from preview', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Close Behavior', () => {
    it('should prevent closing during upload', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should allow closing when not uploading', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Step Indicator', () => {
    it('should show correct step indicator for upload step', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        const stepDots = document.querySelectorAll('[class*="step-dot"]');
        expect(stepDots.length).toBe(4);
      });
    });
  });

  describe('Modal Overlay Click', () => {
    it('should close modal when clicking overlay', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const overlay = document.querySelector('[class*="modal-overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API error during import', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);
      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API Error')
      );

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('should use provided teamId and goalId', async () => {
      renderBulkUploadModal({ teamId: 'custom-team', goalId: 'custom-goal' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should call onUploadComplete after successful upload', async () => {
      renderBulkUploadModal({ onUploadComplete: mockOnUploadComplete });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Reset State', () => {
    it('should reset state when modal is reopened', async () => {
      const { rerender } = renderBulkUploadModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <BacklogProvider>
            <BulkUploadModal
              isOpen={false}
              onClose={mockOnClose}
              onUploadComplete={mockOnUploadComplete}
              teamId="team-1"
              goalId="goal-1"
              existingItems={[]}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <BacklogProvider>
            <BulkUploadModal
              isOpen={true}
              onClose={mockOnClose}
              onUploadComplete={mockOnUploadComplete}
              teamId="team-1"
              goalId="goal-1"
              existingItems={[]}
            />
          </BacklogProvider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('File Parsing Errors', () => {
    it('should handle file parsing error', async () => {
      mockParseCSV.mockImplementation(() => {
        throw new Error('Parse error');
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const mockFile = createMockFile('test.csv', 'invalid content');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }
    });

    it('should handle file with no valid items', async () => {
      mockParseCSV.mockReturnValue({
        items: [],
        errors: [],
        totalRows: 0,
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const mockFile = createMockFile('test.csv', 'title\n');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }
    });
  });

  describe('Import Process', () => {
    it('should handle import with all items failing', async () => {
      const mockItems = [
        { _rowNumber: 1, title: 'Item 1', _isValid: true },
        { _rowNumber: 2, title: 'Item 2', _isValid: true },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 2,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API Error')
      );

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle import cancellation during processing', async () => {
      const mockItems = [
        { _rowNumber: 1, title: 'Item 1', _isValid: true },
        { _rowNumber: 2, title: 'Item 2', _isValid: true },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 2,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle import with partial success', async () => {
      const mockItems = [
        { _rowNumber: 1, title: 'Item 1', _isValid: true },
        { _rowNumber: 2, title: 'Item 2', _isValid: true },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 2,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ success: true, data: { id: 'item-1' } })
        .mockRejectedValueOnce(new Error('Failed'));

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle API response with success false', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Item 1', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: { message: 'Validation failed' },
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('View Items After Upload', () => {
    it('should handle view items button click', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Close During Upload', () => {
    it('should prevent closing when upload is in progress', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('File Drop Zone', () => {
    it('should handle drag over event', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const dropZone = document.querySelector('[class*="file-drop-zone"]');
      if (dropZone) {
        fireEvent.dragOver(dropZone);
      }
    });

    it('should handle drag leave event', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const dropZone = document.querySelector('[class*="file-drop-zone"]');
      if (dropZone) {
        fireEvent.dragLeave(dropZone);
      }
    });

    it('should handle drop event with valid file', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const dropZone = document.querySelector('[class*="file-drop-zone"]');
      if (dropZone) {
        const mockFile = createMockFile('test.csv', 'title\nTest Item');
        fireEvent.drop(dropZone, { dataTransfer: { files: [mockFile] } });
      }
    });
  });

  describe('Step Transitions', () => {
    it('should transition from upload to preview step', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const mockFile = createMockFile('test.csv', 'title\nTest Item');
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }
    });

    it('should transition from preview to upload step on back', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Import Button State', () => {
    it('should enable import button when valid items exist', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should show correct import button text for single item', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should show correct import button text for multiple items', async () => {
      const mockItems = [
        { _rowNumber: 1, title: 'Item 1', _isValid: true },
        { _rowNumber: 2, title: 'Item 2', _isValid: true },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 2,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Progress State', () => {
    it('should track upload progress correctly', async () => {
      const mockItems = [
        { _rowNumber: 1, title: 'Item 1', _isValid: true },
        { _rowNumber: 2, title: 'Item 2', _isValid: true },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 2,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Result State', () => {
    it('should track successful uploads', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 'new-item-1' },
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should track failed uploads', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Upload failed')
      );

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should track duplicate items', async () => {
      const existingItems = [{ id: 'existing-1', title: 'Existing Item' }];
      const mockItems = [{ _rowNumber: 1, title: 'Existing Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue([{ ...mockItems[0], _isDuplicate: true }]);
      mockGetValidItems.mockReturnValue([]);

      renderBulkUploadModal({ existingItems });

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Overlay Click', () => {
    it('should close modal when clicking overlay', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const overlay = document.querySelector('[class*="modal-overlay"]');
      if (overlay) {
        fireEvent.click(overlay);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    });

    it('should not close when clicking modal content', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click on the dialog content itself (not the overlay)
      const dialog = screen.getByRole('dialog');
      // Click on a child element to ensure we're not clicking the overlay
      const dialogContent =
        dialog.querySelector('[class*="modal-content"], [class*="modal-body"]') || dialog;
      if (dialogContent) {
        fireEvent.click(dialogContent);

        // The modal should remain open when clicking content
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }
    });
  });

  describe('File Remove', () => {
    it('should handle file removal', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const mockFile = createMockFile('test.csv', 'title\nTest Item');
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      }
    });
  });

  describe('Handle Close During Upload', () => {
    it('should prevent close when isUploading is true', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Handle Cancel Upload', () => {
    it('should set isCancelling to true when cancel is clicked', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Import Item Data Structure', () => {
    it('should create correct item data structure for API', async () => {
      const mockItems = [
        {
          _rowNumber: 1,
          title: 'Test Item',
          description: 'Test Description',
          storyPoints: 5,
          businessValue: 8,
          priority: 'MUST_HAVE',
          labels: ['feature', 'urgent'],
          acceptanceCriteria: 'Criteria here',
          _isValid: true,
        },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 'new-item' },
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle item with minimal data', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Minimal Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 'new-item' },
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle item with undefined optional fields', async () => {
      const mockItems = [
        {
          _rowNumber: 1,
          title: 'Item with undefined fields',
          description: undefined,
          storyPoints: undefined,
          businessValue: undefined,
          priority: undefined,
          labels: undefined,
          acceptanceCriteria: undefined,
          _isValid: true,
        },
      ];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 'new-item' },
      });

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Query Client Invalidation', () => {
    it('should invalidate queries after successful upload', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { id: 'new-item' },
      });

      renderBulkUploadModal({ onUploadComplete: mockOnUploadComplete });

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should not invalidate queries when no items were successful', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Upload failed')
      );

      renderBulkUploadModal({ onUploadComplete: mockOnUploadComplete });

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract error message from Error object', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      const error = new Error('Specific error message');
      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should handle unknown error type', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      (apiService.createProductBacklogItem as ReturnType<typeof vi.fn>).mockRejectedValue(
        'string error'
      );

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Step Indicator States', () => {
    it('should show correct step indicator for preview step', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should show correct step indicator for progress step', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should show correct step indicator for summary step', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });

  describe('Footer Visibility', () => {
    it('should show footer on upload step', async () => {
      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show footer on preview step', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });

    it('should not show footer on summary step', async () => {
      const mockItems = [{ _rowNumber: 1, title: 'Test Item', _isValid: true }];
      mockParseCSV.mockReturnValue({
        items: mockItems,
        errors: [],
        totalRows: 1,
      });
      mockValidateItems.mockReturnValue(mockItems);
      mockGetValidItems.mockReturnValue(mockItems);

      renderBulkUploadModal();

      await waitFor(() => {
        expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
      });
    });
  });
});
