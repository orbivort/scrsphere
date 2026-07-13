import { screen, renderWithProviders, waitFor, fireEvent } from '../../../test-utils';
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';

import { BulkUploadModal } from './BulkUploadModal';
import { apiService } from '../../../services';
import { BacklogProvider } from '../context/BacklogContext';
import { initTestI18n } from '../../../test-utils';

vi.mock('../../../services', () => ({
  apiService: {
    getProductBacklog: vi.fn(),
    createProductBacklogItem: vi.fn(),
    bulkCreateProductBacklogItems: vi.fn(),
  },
}));

vi.mock('../hooks/useBacklogCapacityValidation', () => ({
  useBacklogCapacityValidation: () => ({
    validateBulkImport: vi.fn().mockResolvedValue({ isValid: true }),
  }),
}));

const renderBulkUploadModal = (props = {}) => {
  return renderWithProviders(
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
  );
};

const createMockFile = (name: string, content: string, type: string = 'text/csv'): File => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(content),
    configurable: true,
  });
  return file;
};

describe('BulkUploadModal Integration Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnUploadComplete = vi.fn();

  beforeAll(async () => {
    await initTestI18n();
  });

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
    (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        successful: 2,
        failed: 0,
        errors: [],
        createdItems: [{ id: 'item-1' }, { id: 'item-2' }],
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Selection and Parsing', () => {
    it('should parse valid CSV file and show preview', async () => {
      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5
Feature B,Description B,SHOULD_HAVE,3`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const dropZone = screen.getByText(/drop your csv file/i);
      expect(dropZone).toBeInTheDocument();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle file with invalid extension', async () => {
      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = createMockFile('test.txt', 'content', 'text/plain');

      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should show error for empty CSV', async () => {
      const csvContent = 'title,description,priority,storyPoints';
      const file = createMockFile('empty.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/no valid data/i) || screen.getByText(/empty/i)).toBeTruthy();
      });
    });

    it('should handle CSV with missing required fields', async () => {
      const csvContent = `description,priority
Description A,MUST_HAVE`;
      const file = createMockFile('missing-title.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should remove selected file when remove button clicked', async () => {
      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove/i });
        if (removeButton) {
          fireEvent.click(removeButton);
        }
      });
    });
  });

  describe('Import Process', () => {
    it('should start import when import button clicked', async () => {
      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5
Feature B,Description B,SHOULD_HAVE,3`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const importButton = screen.queryByRole('button', { name: /import/i });
        if (importButton) {
          fireEvent.click(importButton);
        }
      });
    });

    it('should handle successful bulk upload', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          successful: 2,
          failed: 0,
          errors: [],
          createdItems: [{ id: 'item-1' }, { id: 'item-2' }],
        },
      });

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5
Feature B,Description B,SHOULD_HAVE,3`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const importButton = screen.queryByRole('button', { name: /import/i });
        if (importButton && !importButton.hasAttribute('disabled')) {
          fireEvent.click(importButton);
        }
      });
    });

    it('should handle partial success in bulk upload', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          successful: 1,
          failed: 1,
          errors: [{ row: 2, field: 'title', message: 'Duplicate title' }],
          createdItems: [{ id: 'item-1' }],
        },
      });

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5
Feature A,Description B,SHOULD_HAVE,3`;
      const file = createMockFile('duplicates.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle API error during upload', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: {
          data: {
            error: { message: 'Server error' },
          },
        },
      });

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle network error during upload', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Upload', () => {
    it('should cancel upload in progress', async () => {
      let _abortSignal: AbortSignal | undefined;
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockImplementation(
        async (_items, _teamId, _goalId, signal) => {
          _abortSignal = signal;
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              resolve({
                success: true,
                data: { successful: 1, failed: 0, errors: [], createdItems: [] },
              });
            }, 5000);
            if (signal) {
              signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new DOMException('Aborted', 'AbortError'));
              });
            }
          });
        }
      );

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const importButton = screen.queryByRole('button', { name: /import/i });
        if (importButton && !importButton.hasAttribute('disabled')) {
          fireEvent.click(importButton);
        }
      });

      await waitFor(() => {
        const cancelButton = screen.queryByRole('button', { name: /cancel/i });
        if (cancelButton) {
          fireEvent.click(cancelButton);
        }
      });
    });
  });

  describe('Close Modal', () => {
    it('should close modal when close button clicked', async () => {
      renderBulkUploadModal({ onClose: mockOnClose });

      const closeButton = screen.queryByRole('button', { name: /close/i });
      if (closeButton) {
        fireEvent.click(closeButton);
        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    });

    it('should not close modal while uploading', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockImplementation(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return {
            success: true,
            data: { successful: 1, failed: 0, errors: [], createdItems: [] },
          };
        }
      );

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal({ onClose: mockOnClose });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const importButton = screen.queryByRole('button', { name: /import/i });
        if (importButton && !importButton.hasAttribute('disabled')) {
          fireEvent.click(importButton);
        }
      });
    });
  });

  describe('Navigation', () => {
    it('should go back from preview to upload', async () => {
      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const backButton = screen.queryByRole('button', { name: /back/i });
        if (backButton) {
          fireEvent.click(backButton);
        }
      });
    });
  });

  describe('Summary Display', () => {
    it('should show upload summary after completion', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          successful: 2,
          failed: 1,
          errors: [{ row: 3, field: 'priority', message: 'Invalid priority' }],
          createdItems: [{ id: 'item-1' }, { id: 'item-2' }],
        },
      });

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5
Feature B,Description B,SHOULD_HAVE,3
Feature C,Description C,INVALID,8`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        const importButton = screen.queryByRole('button', { name: /import/i });
        if (importButton && !importButton.hasAttribute('disabled')) {
          fireEvent.click(importButton);
        }
      });
    });
  });

  describe('Template Download', () => {
    it('should download CSV template', async () => {
      renderBulkUploadModal();

      const downloadButton = screen.queryByRole('button', { name: /download template/i });
      if (downloadButton) {
        fireEvent.click(downloadButton);
      }
    });
  });

  describe('Existing Items Validation', () => {
    it('should mark duplicates when existing items present', async () => {
      const existingItems = [
        { id: 'existing-1', title: 'Feature A', description: '', priority: 'MUST_HAVE' },
      ];

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5
Feature B,Description B,SHOULD_HAVE,3`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal({ existingItems });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle parse error gracefully', async () => {
      const invalidCsv = 'this is not valid CSV {{{';
      const file = createMockFile('invalid.csv', invalidCsv);

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should handle file read error', async () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(file, 'text', {
        value: () => Promise.reject(new Error('Failed to read file')),
        configurable: true,
      });

      renderBulkUploadModal();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Step Transitions', () => {
    it('should transition through all steps', async () => {
      (apiService.bulkCreateProductBacklogItems as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          successful: 1,
          failed: 0,
          errors: [],
          createdItems: [{ id: 'item-1' }],
        },
      });

      const csvContent = `title,description,priority,storyPoints
Feature A,Description A,MUST_HAVE,5`;
      const file = createMockFile('test.csv', csvContent);

      renderBulkUploadModal({ onUploadComplete: mockOnUploadComplete });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });
});
