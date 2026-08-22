import { screen, fireEvent, renderWithProviders, initTestI18n } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

import { FileDropZone } from './FileDropZone';
import { downloadTemplate } from './bulkUploadUtils';

vi.mock('./bulkUploadUtils', () => ({
  isValidFileType: vi.fn((file: File) => file.name.endsWith('.csv')),
  formatFileSize: vi.fn((bytes: number) => `${bytes} Bytes`),
  downloadTemplate: vi.fn(),
}));

describe('FileDropZone', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  const defaultProps = {
    onFileSelect: mockOnFileSelect,
    selectedFile: null,
    onFileRemove: mockOnFileRemove,
  };

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drop zone', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
    });

    it('should render browse hint', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('or click to browse')).toBeInTheDocument();
    });

    it('should render file size hint', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('Supports CSV files up to 5MB')).toBeInTheDocument();
    });

    it('should render template download section', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('Need a template?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download csv template/i })).toBeInTheDocument();
    });
  });

  describe('Selected File Display', () => {
    it('should display selected file info', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} selectedFile={file} />);

      expect(screen.getByText('File Ready')).toBeInTheDocument();
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    it('should show change file hint when file is selected', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} selectedFile={file} />);

      expect(screen.getByText('Click to change or drag a new file')).toBeInTheDocument();
    });

    it('should render remove file button', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} selectedFile={file} />);

      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      renderWithProviders(<FileDropZone {...defaultProps} error="Invalid file format" />);

      expect(screen.getByText('Invalid file format')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onFileRemove when clicking remove button', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} selectedFile={file} />);

      await userEvent.click(screen.getByRole('button', { name: /remove file/i }));

      expect(mockOnFileRemove).toHaveBeenCalled();
    });

    it('should trigger file input on click', async () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      await userEvent.click(dropZone);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      dropZone.focus();

      await userEvent.keyboard('{Enter}');

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag enter event', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      dragEnterEvent.preventDefault = vi.fn();
      dragEnterEvent.stopPropagation = vi.fn();
      dropZone.dispatchEvent(dragEnterEvent);

      expect(dropZone.className).toBeDefined();
    });

    it('should handle drag leave event', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      dragEnterEvent.preventDefault = vi.fn();
      dragEnterEvent.stopPropagation = vi.fn();
      dropZone.dispatchEvent(dragEnterEvent);

      const dragLeaveEvent = new Event('dragleave', { bubbles: true });
      dragLeaveEvent.preventDefault = vi.fn();
      dragLeaveEvent.stopPropagation = vi.fn();
      dropZone.dispatchEvent(dragLeaveEvent);

      expect(dropZone.className).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /upload csv file/i })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Drag Active State', () => {
    it('adds drag-active class on drag enter and removes it on drag leave', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      fireEvent.dragEnter(dropZone);
      expect(dropZone.className).toContain('drag-active');

      fireEvent.dragLeave(dropZone);
      expect(dropZone.className).not.toContain('drag-active');
    });

    it('calls preventDefault and stopPropagation on drag over', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });
      dragOverEvent.preventDefault = vi.fn();
      dragOverEvent.stopPropagation = vi.fn();
      dropZone.dispatchEvent(dragOverEvent);

      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
      expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Drop Validation', () => {
    it('selects a valid CSV file on drop', () => {
      const file = new File(['test'], 'valid.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it('alerts when dropping an invalid file type', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const file = new File(['test'], 'invalid.txt', { type: 'text/plain' });
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      expect(alertSpy).toHaveBeenCalledWith('Please upload a CSV file');
      expect(mockOnFileSelect).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('does nothing when dropping an empty file list', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      fireEvent.drop(dropZone, { dataTransfer: { files: [] } });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('File Input Handling', () => {
    it('selects a valid CSV file through the file input', () => {
      const file = new File(['test'], 'upload.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).not.toBeNull();

      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it('alerts when selecting an invalid file through the file input', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const file = new File(['test'], 'invalid.txt', { type: 'text/plain' });
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });

      expect(alertSpy).toHaveBeenCalledWith('Please upload a CSV file');
      expect(mockOnFileSelect).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('does nothing when the file input change has an empty file list', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [] } });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('does nothing when the file input change has no file list', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput as HTMLInputElement, { target: {} });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('opens the file dialog when pressing the Space key', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      dropZone.focus();
      fireEvent.keyDown(dropZone, { key: ' ' });

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not open the file dialog when pressing a non-activation key', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      dropZone.focus();
      fireEvent.keyDown(dropZone, { key: 'a' });

      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('opens the file dialog when clicking the drop zone with no file selected', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      fireEvent.click(dropZone);

      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not open the file dialog when a file is already selected', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      const file = new File(['test'], 'valid.csv', { type: 'text/csv' });
      renderWithProviders(<FileDropZone {...defaultProps} selectedFile={file} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      fireEvent.click(dropZone);

      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  describe('Template Download', () => {
    it('downloads the template with the current locale', () => {
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download csv template/i });
      fireEvent.click(downloadButton);

      expect(downloadTemplate).toHaveBeenCalledWith('en');
    });

    it('does not open the file dialog when downloading the template', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      renderWithProviders(<FileDropZone {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download csv template/i });
      fireEvent.click(downloadButton);

      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });
});
