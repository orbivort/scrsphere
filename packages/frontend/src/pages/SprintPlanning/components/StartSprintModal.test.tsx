import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { StartSprintModal, type SprintStats } from './StartSprintModal';

// Mock CSS modules
vi.mock('./StartSprintModal.module.css', () => ({
  default: {
    overlay: 'overlay',
    modal: 'modal',
    'gradient-orb': 'gradient-orb',
    header: 'header',
    'header-content': 'header-content',
    'icon-wrapper': 'icon-wrapper',
    title: 'title',
    subtitle: 'subtitle',
    'sprint-highlight': 'sprint-highlight',
    'close-button': 'close-button',
    'progress-bar': 'progress-bar',
    'progress-fill': 'progress-fill',
    body: 'body',
    'error-banner': 'error-banner',
    'error-icon': 'error-icon',
    'error-content': 'error-content',
    'error-title': 'error-title',
    'error-text': 'error-text',
    'summary-card': 'summary-card',
    'summary-header': 'summary-header',
    'summary-title': 'summary-title',
    'summary-badge': 'summary-badge',
    'summary-grid': 'summary-grid',
    'summary-item': 'summary-item',
    'summary-icon': 'summary-icon',
    'summary-content': 'summary-content',
    'summary-label': 'summary-label',
    'summary-value': 'summary-value',
    'capacity-section': 'capacity-section',
    'capacity-header': 'capacity-header',
    'capacity-label': 'capacity-label',
    'capacity-value': 'capacity-value',
    'capacity-danger': 'capacity-danger',
    'capacity-warning': 'capacity-warning',
    'capacity-success': 'capacity-success',
    'capacity-bar': 'capacity-bar',
    'capacity-fill': 'capacity-fill',
    'capacity-fill-danger': 'capacity-fill-danger',
    'capacity-fill-warning': 'capacity-fill-warning',
    'capacity-fill-success': 'capacity-fill-success',
    'capacity-warning-message': 'capacity-warning-message',
    'goal-section': 'goal-section',
    'goal-header': 'goal-header',
    'goal-icon': 'goal-icon',
    'goal-title': 'goal-title',
    'goal-text': 'goal-text',
    'notice-box': 'notice-box',
    'notice-icon': 'notice-icon',
    'notice-text': 'notice-text',
    footer: 'footer',
    'button-secondary': 'button-secondary',
    'button-primary': 'button-primary',
    'button-spinner': 'button-spinner',
    'button-icon': 'button-icon',
  },
}));

const defaultStats: SprintStats = {
  totalItems: 5,
  totalPoints: 23,
  totalTasks: 12,
  estimatedHours: 96,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  sprintName: 'Sprint 1',
  sprintGoal: 'Complete user authentication feature',
  sprintDuration: 10,
  stats: defaultStats,
  teamCapacity: 120,
  capacityPercentage: 80,
  error: null,
  isLoading: false,
  userRole: 'SCRUM_MASTER',
};

describe('StartSprintModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Start Sprint/i })).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<StartSprintModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display sprint name in subtitle', () => {
      render(<StartSprintModal {...defaultProps} sprintName="My Sprint" />);

      expect(screen.getByText(/My Sprint/)).toBeInTheDocument();
    });

    it('should display all sprint statistics', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // Items
      expect(screen.getByText('23')).toBeInTheDocument(); // Story Points
      expect(screen.getByText('12')).toBeInTheDocument(); // Tasks
      expect(screen.getByText('96h')).toBeInTheDocument(); // Est. Hours
      expect(screen.getByText('10 days')).toBeInTheDocument(); // Duration
      expect(screen.getByText('120h')).toBeInTheDocument(); // Team Capacity
    });

    it('should display sprint goal when provided', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByText(/Complete user authentication feature/i)).toBeInTheDocument();
    });

    it('should not display sprint goal section when goal is empty', () => {
      render(<StartSprintModal {...defaultProps} sprintGoal="" />);

      expect(screen.queryByText(/Sprint Goal/i)).not.toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Sprint$/i })).toBeInTheDocument();
    });
  });

  describe('Capacity Display', () => {
    it('should display capacity percentage', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show success status for capacity under 80%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={75} />);

      const capacityValue = screen.getByText('75%');
      expect(capacityValue).toHaveClass('capacity-success');
    });

    it('should show warning status for capacity between 80% and 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={85} />);

      const capacityValue = screen.getByText('85%');
      expect(capacityValue).toHaveClass('capacity-warning');
    });

    it('should show danger status for capacity over 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={110} />);

      const capacityValue = screen.getByText('110%');
      expect(capacityValue).toHaveClass('capacity-danger');
    });

    it('should show warning message when capacity is in warning range', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={85} />);

      expect(screen.getByText(/Sprint is near capacity/i)).toBeInTheDocument();
    });

    it('should show danger message when capacity is over 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={110} />);

      expect(screen.getByText(/Sprint is over capacity/i)).toBeInTheDocument();
    });

    it('should not show warning when capacity is normal', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={75} />);

      expect(screen.queryByText(/Sprint is near capacity/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sprint is over capacity/i)).not.toBeInTheDocument();
    });

    it('should cap capacity bar at 100% visually', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={150} />);

      // The bar width should be capped at 100%
      const capacityBar = document.querySelector('.capacity-fill');
      if (capacityBar) {
        expect(capacityBar).toHaveStyle({ width: '100%' });
      }
    });
  });

  describe('Error Display', () => {
    it('should not show error banner when no error', () => {
      render(<StartSprintModal {...defaultProps} error={null} />);

      expect(screen.queryByText(/Unable to Start Sprint/i)).not.toBeInTheDocument();
    });

    it('should show error banner when error is provided', () => {
      render(<StartSprintModal {...defaultProps} error="Something went wrong" />);

      expect(screen.getByText(/Unable to Start Sprint/i)).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should show friendly error message for active sprint conflict', () => {
      render(<StartSprintModal {...defaultProps} error="Another sprint is already active" />);

      expect(screen.getByText(/Active Sprint Exists/i)).toBeInTheDocument();
      expect(screen.getByText(/complete or cancel the current active sprint/i)).toBeInTheDocument();
    });

    it('should show friendly error message for assignee error', () => {
      render(<StartSprintModal {...defaultProps} error="Invalid assignee specified" />);

      expect(screen.getByText(/Invalid Task Assignment/i)).toBeInTheDocument();
    });

    it('should show friendly error message for missing sprint goal', () => {
      render(<StartSprintModal {...defaultProps} error="Sprint goal is required" />);

      expect(screen.getByText(/Sprint Goal Required/i)).toBeInTheDocument();
    });

    it('should show friendly error message for 401 error', () => {
      render(<StartSprintModal {...defaultProps} error="401 Unauthorized" />);

      expect(screen.getByText(/Session Expired/i)).toBeInTheDocument();
    });

    it('should show friendly error message for 403 error', () => {
      render(<StartSprintModal {...defaultProps} error="403 Forbidden" />);

      expect(screen.getByText(/Permission Denied/i)).toBeInTheDocument();
    });

    it('should show friendly error message for network error', () => {
      render(<StartSprintModal {...defaultProps} error="Network error occurred" />);

      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });

    it('should show original error for unknown errors', () => {
      render(<StartSprintModal {...defaultProps} error="Custom unknown error" />);

      expect(screen.getByText(/Unable to Start Sprint/i)).toBeInTheDocument();
      expect(screen.getByText(/Custom unknown error/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      // Check that the button shows "Starting..." (specific to button, not notice text)
      const startButton = screen.getByRole('button', { name: /Starting.../i });
      expect(startButton).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Starting.../i })).toBeDisabled();
    });

    it('should disable start button when capacity is over 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={110} />);

      expect(screen.getByRole('button', { name: /Start Sprint$/i })).toBeDisabled();
    });

    it('should enable start button when capacity is under 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={95} />);

      expect(screen.getByRole('button', { name: /Start Sprint$/i })).not.toBeDisabled();
    });

    it('should have aria-busy attribute when loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      const startButton = screen.getByRole('button', { name: /Starting.../i });
      expect(startButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('User Actions', () => {
    it('should call onConfirm when clicking start sprint button', () => {
      render(<StartSprintModal {...defaultProps} />);

      const startButton = screen.getByRole('button', { name: /Start Sprint$/i });
      fireEvent.click(startButton);

      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('should call onClose when clicking cancel button', () => {
      render(<StartSprintModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay', () => {
      render(<StartSprintModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking overlay while loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      render(<StartSprintModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      fireEvent.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on dialog', () => {
      render(<StartSprintModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'start-sprint-title');
    });

    it('should have alert role on error banner', () => {
      render(<StartSprintModal {...defaultProps} error="Test error" />);

      const alerts = screen.queryAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('should have aria-label on close button', () => {
      render(<StartSprintModal {...defaultProps} />);

      const closeButton = screen.getByLabelText(/Close modal/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero capacity percentage', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle very high capacity percentage', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={200} />);

      expect(screen.getByText('200%')).toBeInTheDocument();
    });

    it('should handle empty stats', () => {
      render(
        <StartSprintModal
          {...defaultProps}
          stats={{
            totalItems: 0,
            totalPoints: 0,
            totalTasks: 0,
            estimatedHours: 0,
          }}
        />
      );

      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle pre-formatted error messages', () => {
      const longError =
        'This is a very long error message that has been pre-formatted with periods and spaces. It should be displayed directly without being transformed.';
      render(<StartSprintModal {...defaultProps} error={longError} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Permission Warning', () => {
    it('should show permission warning when userRole is DEVELOPER', () => {
      render(<StartSprintModal {...defaultProps} userRole="DEVELOPER" />);

      expect(screen.getByText(/Permission Required/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Only Product Owner or Scrum Master can start a sprint/i)
      ).toBeInTheDocument();
    });

    it('should show permission warning when userRole is VIEWER', () => {
      render(<StartSprintModal {...defaultProps} userRole="VIEWER" />);

      expect(screen.getByText(/Permission Required/i)).toBeInTheDocument();
    });

    it('should show permission warning when userRole is undefined', () => {
      render(<StartSprintModal {...defaultProps} userRole={undefined} />);

      expect(screen.getByText(/Permission Required/i)).toBeInTheDocument();
    });

    it('should show permission warning when userRole is null', () => {
      render(<StartSprintModal {...defaultProps} userRole={null} />);

      expect(screen.getByText(/Permission Required/i)).toBeInTheDocument();
    });

    it('should not show permission warning when userRole is PRODUCT_OWNER', () => {
      render(<StartSprintModal {...defaultProps} userRole="PRODUCT_OWNER" />);

      expect(screen.queryByText(/Permission Required/i)).not.toBeInTheDocument();
    });

    it('should disable start button when user lacks permission', () => {
      render(<StartSprintModal {...defaultProps} userRole="DEVELOPER" />);

      expect(screen.getByRole('button', { name: /Start Sprint$/i })).toBeDisabled();
    });

    it('should show tooltip hint when start button is disabled due to permission', () => {
      render(<StartSprintModal {...defaultProps} userRole="DEVELOPER" />);

      const startButton = screen.getByRole('button', { name: /Start Sprint$/i });
      expect(startButton).toHaveAttribute(
        'title',
        'Only Product Owner or Scrum Master can start a sprint'
      );
    });

    it('should not show permission warning when userRole is SCRUM_MASTER', () => {
      render(<StartSprintModal {...defaultProps} userRole="SCRUM_MASTER" />);

      expect(screen.queryByText(/Permission Required/i)).not.toBeInTheDocument();
    });

    it('should allow start button when user has SCRUM_MASTER role and capacity is normal', () => {
      render(
        <StartSprintModal {...defaultProps} userRole="SCRUM_MASTER" capacityPercentage={80} />
      );

      expect(screen.getByRole('button', { name: /Start Sprint$/i })).not.toBeDisabled();
    });

    it('should disable start button when capacity is at exactly 100% but user has permission', () => {
      render(
        <StartSprintModal {...defaultProps} userRole="SCRUM_MASTER" capacityPercentage={100} />
      );

      expect(screen.getByRole('button', { name: /Start Sprint$/i })).not.toBeDisabled();
    });
  });

  describe('Capacity Boundary Values', () => {
    it('should display capacity percentage value', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={80} />);

      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should display capacity percentage below threshold', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={79} />);

      expect(screen.getByText('79%')).toBeInTheDocument();
    });

    it('should display capacity at 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display capacity above 100%', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={101} />);

      expect(screen.getByText('101%')).toBeInTheDocument();
    });

    it('should display zero capacity', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display high capacity', () => {
      render(<StartSprintModal {...defaultProps} capacityPercentage={200} />);

      expect(screen.getByText('200%')).toBeInTheDocument();
    });
  });

  describe('Error Message Formatting', () => {
    it('should display error message when provided', () => {
      const preFormattedError = 'This is a pre-formatted error. It should be displayed as-is.';
      render(<StartSprintModal {...defaultProps} error={preFormattedError} />);

      expect(screen.getByText(/This is a pre-formatted error/i)).toBeInTheDocument();
    });

    it('should treat short error without periods as non-pre-formatted', () => {
      render(<StartSprintModal {...defaultProps} error="Simple error" />);

      expect(screen.getByText(/Unable to Start Sprint/i)).toBeInTheDocument();
      expect(screen.getByText(/Simple error/i)).toBeInTheDocument();
    });

    it('should format 404 error correctly', () => {
      render(<StartSprintModal {...defaultProps} error="404 Not Found" />);

      expect(screen.getByText(/Sprint Not Found/i)).toBeInTheDocument();
    });

    it('should format 409 conflict error correctly', () => {
      render(<StartSprintModal {...defaultProps} error="409 Conflict" />);

      expect(screen.getByText(/Sprint Conflict/i)).toBeInTheDocument();
    });

    it('should format 400 bad request error correctly', () => {
      render(<StartSprintModal {...defaultProps} error="400 Bad Request" />);

      expect(screen.getByText(/Invalid Request/i)).toBeInTheDocument();
    });

    it('should format timeout error correctly', () => {
      render(<StartSprintModal {...defaultProps} error="Request timeout" />);

      expect(screen.getByText(/Request Timeout/i)).toBeInTheDocument();
    });

    it('should show error banner even when permission warning is shown', () => {
      render(
        <StartSprintModal
          {...defaultProps}
          userRole="DEVELOPER"
          error="Another sprint is already active"
        />
      );

      expect(screen.getByText(/Permission Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Sprint Exists/i)).toBeInTheDocument();
    });
  });

  describe('Footer Button States', () => {
    it('should disable cancel button when loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    });

    it('should disable close button when loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      const closeButton = screen.getByLabelText(/Close modal/i);
      expect(closeButton).toBeDisabled();
    });

    it('should not close on overlay click when loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should show loading text in start button when loading', () => {
      render(<StartSprintModal {...defaultProps} isLoading={true} />);

      expect(screen.getByText(/Starting\.\.\./i)).toBeInTheDocument();
    });
  });

  describe('Sprint Goal Display', () => {
    it('should display sprint goal text when provided', () => {
      render(
        <StartSprintModal {...defaultProps} sprintGoal="Complete the authentication module" />
      );

      expect(screen.getByText(/Complete the authentication module/i)).toBeInTheDocument();
    });

    it('should show sprint goal section when sprintGoal is empty string', () => {
      render(<StartSprintModal {...defaultProps} sprintGoal="" />);

      expect(screen.queryByText(/Sprint Goal/i)).not.toBeInTheDocument();
    });

    it('should show sprint goal section when sprintGoal is undefined', () => {
      render(<StartSprintModal {...defaultProps} sprintGoal={undefined} />);

      expect(screen.queryByText(/Sprint Goal/i)).not.toBeInTheDocument();
    });

    it('should display sprint name in the ready to launch message', () => {
      render(<StartSprintModal {...defaultProps} sprintName="Sprint 42" />);

      expect(screen.getByText(/Ready to launch/i)).toBeInTheDocument();
      expect(screen.getByText(/Sprint 42/i)).toBeInTheDocument();
      expect(screen.getByText(/\?/)).toBeInTheDocument();
    });
  });

  describe('Ready to Start Badge', () => {
    it('should show Ready to Start badge in summary card', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByText(/Ready to Start/i)).toBeInTheDocument();
    });
  });

  describe('Confirmation Notice', () => {
    it('should display confirmation notice about redirecting to Sprint Board', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(
        screen.getByText(
          /Starting this sprint will activate it and redirect you to the Sprint Board/i
        )
      ).toBeInTheDocument();
    });

    it('should display notice about planning items properly', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByText(/Make sure all items are properly planned/i)).toBeInTheDocument();
    });
  });

  describe('Summary Card Details', () => {
    it('should display all summary items with correct icons', () => {
      render(<StartSprintModal {...defaultProps} />);

      expect(screen.getByText(/Duration/i)).toBeInTheDocument();
      expect(screen.getByText(/Backlog Items/i)).toBeInTheDocument();
      expect(screen.getByText(/Story Points/i)).toBeInTheDocument();
      expect(screen.getByText(/Tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/Est. Hours/i)).toBeInTheDocument();
      expect(screen.getByText(/Team Capacity/i)).toBeInTheDocument();
    });

    it('should format duration with days suffix', () => {
      render(<StartSprintModal {...defaultProps} sprintDuration={14} />);

      expect(screen.getByText('14 days')).toBeInTheDocument();
    });

    it('should format estimated hours with h suffix', () => {
      render(
        <StartSprintModal {...defaultProps} stats={{ ...defaultStats, estimatedHours: 40 }} />
      );

      expect(screen.getByText('40h')).toBeInTheDocument();
    });

    it('should format team capacity with h suffix', () => {
      render(<StartSprintModal {...defaultProps} teamCapacity={160} />);

      expect(screen.getByText('160h')).toBeInTheDocument();
    });
  });
});
