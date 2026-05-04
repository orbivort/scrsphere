import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { DataExportModal } from './DataExportModal';
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

describe('DataExportModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnDownload = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    jobId: 'test-job-id-12345',
    status: 'pending' as ExportStatus,
    progress: 0,
    error: null,
    canDownload: false,
    onDownload: mockOnDownload,
    isPolling: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
    const portal = document.getElementById('data-export-modal-portal');
    if (portal) {
      portal.remove();
    }
  });

  const renderModal = (props = defaultProps) => {
    return render(<DataExportModal {...props} />);
  };

  describe('Component Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderModal();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderModal({ ...defaultProps, isOpen: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal title', () => {
      renderModal();

      expect(screen.getByText('Data Export')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderModal();

      expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
    });

    it('should render modal header with title', () => {
      renderModal();

      const modalTitle = screen.getByRole('heading', { level: 2 });
      expect(modalTitle).toHaveTextContent('Data Export');
    });

    it('should render status icon for pending status', () => {
      renderModal({ ...defaultProps, status: 'pending' });

      expect(screen.getByText('⟳')).toBeInTheDocument();
    });

    it('should render status icon for completed status', () => {
      renderModal({ ...defaultProps, status: 'completed' });

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should render status icon for failed status', () => {
      renderModal({ ...defaultProps, status: 'failed' });

      expect(screen.getByText('✕')).toBeInTheDocument();
    });
  });

  describe('Status Messages', () => {
    it('should display "Preparing your data export..." for pending status', () => {
      renderModal({ ...defaultProps, status: 'pending' });

      expect(screen.getByText('Preparing your data export...')).toBeInTheDocument();
    });

    it('should display "Collecting and formatting your data..." for processing status', () => {
      renderModal({ ...defaultProps, status: 'processing' });

      expect(screen.getByText('Collecting and formatting your data...')).toBeInTheDocument();
    });

    it('should display "Your data export is ready!" for completed status', () => {
      renderModal({ ...defaultProps, status: 'completed' });

      expect(screen.getByText('Your data export is ready!')).toBeInTheDocument();
    });

    it('should display "Export failed. Please try again." for failed status', () => {
      renderModal({ ...defaultProps, status: 'failed' });

      expect(screen.getByText('Export failed. Please try again.')).toBeInTheDocument();
    });

    it('should display "Initializing export..." for null status', () => {
      renderModal({ ...defaultProps, status: null });

      expect(screen.getByText('Initializing export...')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar when status is pending', () => {
      renderModal({ ...defaultProps, status: 'pending', isPolling: false });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should not render progress bar for completed status without polling', () => {
      renderModal({ ...defaultProps, status: 'completed', isPolling: false });

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      renderModal({ ...defaultProps, progress: 50 });

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should have correct aria attributes on progress bar', () => {
      renderModal({ ...defaultProps, progress: 60 });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Export progress');
    });
  });

  describe('Job ID Display', () => {
    it('should render job ID when jobId is provided', () => {
      renderModal({ ...defaultProps, jobId: 'abc123def456' });

      expect(screen.getByText('Job ID:')).toBeInTheDocument();
      expect(screen.getByText('abc123de...')).toBeInTheDocument();
    });

    it('should not render job ID when jobId is null', () => {
      renderModal({ ...defaultProps, jobId: null });

      expect(screen.queryByText('Job ID:')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should render error container when error is present', () => {
      renderModal({ ...defaultProps, error: 'Something went wrong' });

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('should have role alert on error container', () => {
      renderModal({ ...defaultProps, error: 'Error occurred' });

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
    });
  });

  describe('Buttons', () => {
    it('should render Download JSON File button when canDownload is true', () => {
      renderModal({ ...defaultProps, canDownload: true, status: 'completed' });

      expect(screen.getByRole('button', { name: /Download JSON File/i })).toBeInTheDocument();
    });

    it('should not render Download button when canDownload is false', () => {
      renderModal({ ...defaultProps, canDownload: false });

      expect(screen.queryByRole('button', { name: /Download JSON File/i })).not.toBeInTheDocument();
    });

    it('should render Cancel Export button when status is pending', () => {
      renderModal({ ...defaultProps, status: 'pending' });

      expect(screen.getByRole('button', { name: 'Cancel Export' })).toBeInTheDocument();
    });

    it('should render Close button when export is not active', () => {
      renderModal({ ...defaultProps, status: 'completed', isPolling: false });

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should call onDownload when Download button is clicked', async () => {
      const user = userEvent.setup();
      renderModal({ ...defaultProps, canDownload: true, status: 'completed' });

      const downloadButton = screen.getByRole('button', { name: /Download JSON File/i });
      await user.click(downloadButton);

      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel Export button is clicked', async () => {
      const user = userEvent.setup();
      renderModal({ ...defaultProps, status: 'pending' });

      const cancelButton = screen.getByRole('button', { name: 'Cancel Export' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      renderModal({ ...defaultProps, status: 'completed', isPolling: false });

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button (x) is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      const closeBtn = screen.getByRole('button', { name: 'Close modal' });
      await user.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal is open', () => {
      renderModal({ ...defaultProps, isOpen: true });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal is closed', () => {
      const { unmount } = renderModal({ ...defaultProps, isOpen: true });

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Portal Behavior', () => {
    it('should create portal container if not exists', () => {
      renderModal();

      const portal = document.getElementById('data-export-modal-portal');
      expect(portal).toBeInTheDocument();
    });

    it('should remove portal when unmounted and empty', () => {
      const { unmount } = renderModal();
      unmount();

      const portal = document.getElementById('data-export-modal-portal');
      expect(portal).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderModal();

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'export-modal-title');
    });

    it('should have accessible close button with aria-label', () => {
      renderModal();

      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null status gracefully', () => {
      renderModal({ ...defaultProps, status: null });

      expect(screen.getByText('Initializing export...')).toBeInTheDocument();
    });

    it('should handle progress at 0', () => {
      renderModal({ ...defaultProps, progress: 0 });

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle progress at 100', () => {
      renderModal({ ...defaultProps, progress: 100 });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle long job IDs by truncating them', () => {
      renderModal({ ...defaultProps, jobId: 'verylongjobbidentifier123456789' });

      const truncated = screen.getByText(`${'verylongjobbidentifier123456789'.slice(0, 8)}...`);
      expect(truncated).toBeInTheDocument();
    });

    it('should handle rapid status changes', () => {
      const { rerender } = renderModal({ ...defaultProps, status: 'pending' });

      expect(screen.getByText('Preparing your data export...')).toBeInTheDocument();

      rerender(<DataExportModal {...defaultProps} status="processing" />);
      expect(screen.getByText('Collecting and formatting your data...')).toBeInTheDocument();

      rerender(<DataExportModal {...defaultProps} status="completed" />);
      expect(screen.getByText('Your data export is ready!')).toBeInTheDocument();
    });

    it('should render expired status message and icon', () => {
      renderModal({ ...defaultProps, status: 'expired' });

      expect(
        screen.getByText('This export has expired. Please create a new one.')
      ).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('should render processing status message', () => {
      renderModal({ ...defaultProps, status: 'processing', progress: 45 });

      expect(screen.getByText('Collecting and formatting your data...')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should render progress bar when isPolling is true even without status', () => {
      renderModal({ ...defaultProps, status: null, isPolling: true });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render Close button when status is failed', () => {
      renderModal({ ...defaultProps, status: 'failed' });

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should render Close button when status is expired', () => {
      renderModal({ ...defaultProps, status: 'expired' });

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should render Cancel Export button when isPolling is true', () => {
      renderModal({ ...defaultProps, status: 'pending', isPolling: true });

      expect(screen.getByRole('button', { name: 'Cancel Export' })).toBeInTheDocument();
    });

    it('should render Cancel Export button when status is processing', () => {
      renderModal({ ...defaultProps, status: 'processing' });

      expect(screen.getByRole('button', { name: 'Cancel Export' })).toBeInTheDocument();
    });

    it('should handle null jobId gracefully', () => {
      renderModal({ ...defaultProps, jobId: null });

      expect(screen.queryByText('Job ID:')).not.toBeInTheDocument();
    });

    it('should render info text about JSON format', () => {
      renderModal();

      expect(
        screen.getByText(
          /Your data is exported in JSON format, which is structured, commonly used, and machine-readable/
        )
      ).toBeInTheDocument();
    });

    it('should render error container with role alert when error exists', () => {
      renderModal({ ...defaultProps, error: 'Network timeout' });

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('should not render error container when error is null', () => {
      renderModal({ ...defaultProps, error: null });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should render status icon with correct class for completed status', () => {
      renderModal({ ...defaultProps, status: 'completed' });

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should render status icon with correct class for failed status', () => {
      renderModal({ ...defaultProps, status: 'failed' });

      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('should render status icon with correct class for pending status', () => {
      renderModal({ ...defaultProps, status: 'pending' });

      expect(screen.getByText('⟳')).toBeInTheDocument();
    });
  });

  describe('Overlay Click Behavior', () => {
    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      const dialog = screen.getByRole('dialog');

      await user.click(dialog);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal title is clicked', async () => {
      const user = userEvent.setup();
      renderModal();

      const modalTitle = screen.getByText('Data Export');
      await user.click(modalTitle);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Renders and Cleanup', () => {
    it('should handle multiple mount/unmount cycles', () => {
      const { unmount: unmount1 } = renderModal();
      unmount1();

      const { unmount: unmount2 } = renderModal();
      unmount2();

      const portal = document.getElementById('data-export-modal-portal');
      expect(portal).not.toBeInTheDocument();
    });
  });

  describe('Full Props Integration', () => {
    it('should render with all props set to various values', () => {
      renderModal({
        isOpen: true,
        onClose: mockOnClose,
        jobId: 'integration-test-job-id-123',
        status: 'processing',
        progress: 75,
        error: null,
        canDownload: false,
        onDownload: mockOnDownload,
        isPolling: true,
      });

      expect(screen.getByText('Data Export')).toBeInTheDocument();
      expect(screen.getByText('Collecting and formatting your data...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText(/integrat\.\.\./)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel Export' })).toBeInTheDocument();
    });

    it('should render completed state with download button', () => {
      renderModal({
        isOpen: true,
        onClose: mockOnClose,
        jobId: 'completed-job-id',
        status: 'completed',
        progress: 100,
        error: null,
        canDownload: true,
        onDownload: mockOnDownload,
        isPolling: false,
      });

      expect(screen.getByText('Your data export is ready!')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download JSON File/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should render failed state with error and close button', () => {
      renderModal({
        isOpen: true,
        onClose: mockOnClose,
        jobId: 'failed-job-id',
        status: 'failed',
        progress: 30,
        error: 'Server error occurred',
        canDownload: false,
        onDownload: mockOnDownload,
        isPolling: false,
      });

      expect(screen.getByText('Export failed. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
      expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Download JSON File/i })).not.toBeInTheDocument();
    });

    it('should render expired state with appropriate message', () => {
      renderModal({
        isOpen: true,
        onClose: mockOnClose,
        jobId: 'expired-job-id',
        status: 'expired',
        progress: 100,
        error: null,
        canDownload: false,
        onDownload: mockOnDownload,
        isPolling: false,
      });

      expect(
        screen.getByText('This export has expired. Please create a new one.')
      ).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
  });
});
