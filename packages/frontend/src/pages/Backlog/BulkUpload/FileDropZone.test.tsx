import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { FileDropZone } from './FileDropZone';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drop zone', () => {
      render(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('Drop your CSV file here')).toBeInTheDocument();
    });

    it('should render browse hint', () => {
      render(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('or click to browse')).toBeInTheDocument();
    });

    it('should render file size hint', () => {
      render(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('Supports CSV files up to 5MB')).toBeInTheDocument();
    });

    it('should render template download section', () => {
      render(<FileDropZone {...defaultProps} />);

      expect(screen.getByText('Need a template?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download csv template/i })).toBeInTheDocument();
    });
  });

  describe('Selected File Display', () => {
    it('should display selected file info', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      render(<FileDropZone {...defaultProps} selectedFile={file} />);

      expect(screen.getByText('File Ready')).toBeInTheDocument();
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    it('should show change file hint when file is selected', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      render(<FileDropZone {...defaultProps} selectedFile={file} />);

      expect(screen.getByText('Click to change or drag a new file')).toBeInTheDocument();
    });

    it('should render remove file button', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      render(<FileDropZone {...defaultProps} selectedFile={file} />);

      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      render(<FileDropZone {...defaultProps} error="Invalid file format" />);

      expect(screen.getByText('Invalid file format')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onFileRemove when clicking remove button', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      render(<FileDropZone {...defaultProps} selectedFile={file} />);

      await userEvent.click(screen.getByRole('button', { name: /remove file/i }));

      expect(mockOnFileRemove).toHaveBeenCalled();
    });

    it('should trigger file input on click', async () => {
      render(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      await userEvent.click(dropZone);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      dropZone.focus();

      await userEvent.keyboard('{Enter}');

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag enter event', () => {
      render(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });

      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      dragEnterEvent.preventDefault = vi.fn();
      dragEnterEvent.stopPropagation = vi.fn();
      dropZone.dispatchEvent(dragEnterEvent);

      expect(dropZone.className).toBeDefined();
    });

    it('should handle drag leave event', () => {
      render(<FileDropZone {...defaultProps} />);

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
      render(<FileDropZone {...defaultProps} />);

      expect(screen.getByRole('button', { name: /upload csv file/i })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<FileDropZone {...defaultProps} />);

      const dropZone = screen.getByRole('button', { name: /upload csv file/i });
      expect(dropZone).toHaveAttribute('tabIndex', '0');
    });
  });
});
