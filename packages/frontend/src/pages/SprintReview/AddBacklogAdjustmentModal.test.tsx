import React from 'react';
import {
  screen,
  fireEvent,
  waitFor,
  renderWithProviders,
  initTestI18n,
  i18nT,
} from '../../test-utils';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';

import { AddBacklogAdjustmentModal } from './AddBacklogAdjustmentModal';
import type { ApiResponse, ProductBacklogItem, TeamMember, User } from '../../types';

// Initialize i18n before all tests
beforeAll(async () => {
  await initTestI18n();
});

vi.mock('./AddBacklogAdjustmentModal.module.css', () => ({
  default: {
    'adjustment-form-overlay': 'adjustment-form-overlay',
    'adjustment-form': 'adjustment-form',
    'adjustment-form-header': 'adjustment-form-header',
    'adjustment-form-header-content': 'adjustment-form-header-content',
    'adjustment-form-icon-wrapper': 'adjustment-form-icon-wrapper',
    'adjustment-form-title': 'adjustment-form-title',
    'adjustment-form-subtitle': 'adjustment-form-subtitle',
    'adjustment-form-close': 'adjustment-form-close',
    'adjustment-form-body': 'adjustment-form-body',
    'form-group': 'form-group',
    'input-with-counter': 'input-with-counter',
    error: 'error',
    'error-message': 'error-message',
    'char-counter': 'char-counter',
    'char-counter-warning': 'char-counter-warning',
    'action-type-wrapper': 'action-type-wrapper',
    'action-type-icon': 'action-type-icon',
    'action-type-select': 'action-type-select',
    'required-asterisk': 'required-asterisk',
    'required-label': 'required-label',
    'adjustment-form-footer': 'adjustment-form-footer',
    button: 'button',
    'button-primary': 'button-primary',
    'button-secondary': 'button-secondary',
  },
}));

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: () => ({ modalRef: { current: null } }),
}));

vi.mock('../../components/common/Form/UnsavedChangesModal', () => ({
  UnsavedChangesModal: ({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
  }) =>
    isOpen ? (
      <div role="dialog" data-testid="unsaved-changes-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Discard</button>
        <button onClick={onCancel}>Keep Editing</button>
      </div>
    ) : null,
}));

const mockTeamMembers: TeamMember[] = [
  {
    userId: 'user-1',
    teamId: 'team-1',
    role: 'owner',
    joinedAt: '2026-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as User,
  },
];

const mockSprintBacklogItems: ApiResponse<ProductBacklogItem[]> = {
  success: true,
  data: [
    {
      id: 'pbi-1',
      teamId: 'team-1',
      title: 'User Authentication',
      description: 'Implement login/logout',
      status: 'NEW',
      priority: 'MUST_HAVE',
      storyPoints: 8,
      businessValue: 10,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
    },
  ],
};

const defaultAdjustmentForm = {
  action: 'add' as const,
  description: '',
  reason: '',
  pbiId: undefined as string | undefined,
  ownerId: '',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  teamMembers: mockTeamMembers,
  sprintBacklogItems: mockSprintBacklogItems,
  formErrors: {},
  setFormErrors: vi.fn(),
  adjustmentForm: defaultAdjustmentForm,
  setAdjustmentForm: vi.fn(),
  isPending: false,
};

describe('AddBacklogAdjustmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(
        screen.getByRole('heading', { name: i18nT('sprint-review:addAdjustmentModal.title') })
      ).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      expect(
        screen.getByLabelText(i18nT('sprint-review:addAdjustmentModal.actionType'))
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.description')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.reason')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(i18nT('sprint-review:addAdjustmentModal.relatedPbi'))
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.owner')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      // The close button (X icon) has aria-label="Cancel" and class adjustment-form-close
      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('adjustment-form-close');
    });

    it('should render action buttons', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      // Footer cancel button has class "button-secondary"
      const cancelButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('button-secondary'));
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveClass('button-secondary');

      expect(
        screen.getByRole('button', {
          name: i18nT('sprint-review:addAdjustmentModal.addAdjustment'),
        })
      ).toBeInTheDocument();
    });

    it('should display subtitle', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      expect(
        screen.getByText(i18nT('sprint-review:addAdjustmentModal.subtitle'))
      ).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should call setAdjustmentForm when action type changes', () => {
      const setAdjustmentForm = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} setAdjustmentForm={setAdjustmentForm} />
      );

      const actionSelect = screen.getByLabelText(
        i18nT('sprint-review:addAdjustmentModal.actionType')
      );
      fireEvent.change(actionSelect, { target: { value: 'modify' } });

      expect(setAdjustmentForm).toHaveBeenCalledWith(expect.objectContaining({ action: 'modify' }));
    });

    it('should call setAdjustmentForm when description changes', () => {
      const setAdjustmentForm = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} setAdjustmentForm={setAdjustmentForm} />
      );

      const descriptionTextarea = screen.getByLabelText(
        new RegExp(
          i18nT('sprint-review:addAdjustmentModal.description')
            .replace(/\s*\*\s*/g, '')
            .trim()
        )
      );
      fireEvent.change(descriptionTextarea, { target: { value: 'New description' } });

      expect(setAdjustmentForm).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'New description' })
      );
    });

    it('should call setAdjustmentForm when reason changes', () => {
      const setAdjustmentForm = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} setAdjustmentForm={setAdjustmentForm} />
      );

      const reasonTextarea = screen.getByLabelText(
        new RegExp(
          i18nT('sprint-review:addAdjustmentModal.reason')
            .replace(/\s*\*\s*/g, '')
            .trim()
        )
      );
      fireEvent.change(reasonTextarea, { target: { value: 'New reason' } });

      expect(setAdjustmentForm).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'New reason' })
      );
    });

    it('should call setAdjustmentForm when related PBI changes', () => {
      const setAdjustmentForm = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} setAdjustmentForm={setAdjustmentForm} />
      );

      const pbiSelect = screen.getByLabelText(i18nT('sprint-review:addAdjustmentModal.relatedPbi'));
      fireEvent.change(pbiSelect, { target: { value: 'pbi-1' } });

      expect(setAdjustmentForm).toHaveBeenCalledWith(expect.objectContaining({ pbiId: 'pbi-1' }));
    });

    it('should call setAdjustmentForm when owner changes', () => {
      const setAdjustmentForm = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} setAdjustmentForm={setAdjustmentForm} />
      );

      const ownerSelect = screen.getByLabelText(
        new RegExp(
          i18nT('sprint-review:addAdjustmentModal.owner')
            .replace(/\s*\*\s*/g, '')
            .trim()
        )
      );
      fireEvent.change(ownerSelect, { target: { value: 'user-1' } });

      expect(setAdjustmentForm).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-1' })
      );
    });

    it('should clear related PBI when selecting None option', () => {
      const setAdjustmentForm = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, pbiId: 'pbi-1' }}
          setAdjustmentForm={setAdjustmentForm}
        />
      );

      const pbiSelect = screen.getByLabelText(i18nT('sprint-review:addAdjustmentModal.relatedPbi'));
      fireEvent.change(pbiSelect, { target: { value: '' } });

      expect(setAdjustmentForm).toHaveBeenCalled();
      const lastCall = setAdjustmentForm.mock.calls[0][0];
      expect(lastCall.pbiId).toBe('');
    });
  });

  describe('Action Type Icons', () => {
    it('should display correct icon for add action', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, action: 'add' }}
        />
      );

      expect(screen.getByLabelText(/Action Type/i)).toHaveValue('add');
    });

    it('should display correct icon for modify action', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, action: 'modify' }}
        />
      );

      expect(screen.getByLabelText(/Action Type/i)).toHaveValue('modify');
    });

    it('should display correct icon for remove action', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, action: 'remove' }}
        />
      );

      expect(screen.getByLabelText(/Action Type/i)).toHaveValue('remove');
    });

    it('should display correct icon for reorder action', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, action: 'reorder' }}
        />
      );

      expect(screen.getByLabelText(/Action Type/i)).toHaveValue('reorder');
    });

    it('should display correct icon for split action', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, action: 'split' }}
        />
      );

      expect(screen.getByLabelText(/Action Type/i)).toHaveValue('split');
    });

    it('should display default icon for unknown action', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{
            ...defaultAdjustmentForm,
            action: 'unknown' as 'add' | 'modify' | 'remove' | 'reorder' | 'split',
          }}
        />
      );

      expect(screen.getByLabelText(/Action Type/i)).toBeInTheDocument();
    });
  });

  describe('Character Counters', () => {
    it('should display character count for description', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, description: 'Test' }}
        />
      );

      expect(screen.getByText('4/500')).toBeInTheDocument();
    });

    it('should display character count for reason', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, reason: 'Because' }}
        />
      );

      expect(screen.getByText('7/300')).toBeInTheDocument();
    });

    it('should show warning style when description approaches limit', () => {
      const longDesc = 'A'.repeat(450);
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, description: longDesc }}
        />
      );

      expect(screen.getByText('450/500')).toHaveClass('char-counter-warning');
    });

    it('should show warning style when reason approaches limit', () => {
      const longReason = 'A'.repeat(250);
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, reason: longReason }}
        />
      );

      expect(screen.getByText('250/300')).toHaveClass('char-counter-warning');
    });
  });

  describe('Form Validation and Errors', () => {
    it('should display description error when formErrors.description exists', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          formErrors={{ description: 'Description is required' }}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.includes('Description is required'))).toBe(true);
    });

    it('should display reason error when formErrors.reason exists', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          formErrors={{ reason: 'Reason is required' }}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.includes('Reason is required'))).toBe(true);
    });

    it('should display owner error when formErrors.ownerId exists', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          formErrors={{ ownerId: 'Owner is required' }}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.includes('Owner is required'))).toBe(true);
    });

    it('should mark description textarea as invalid when error exists', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} formErrors={{ description: 'Required' }} />
      );

      expect(screen.getByLabelText(/Description/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should mark reason textarea as invalid when error exists', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} formErrors={{ reason: 'Required' }} />
      );

      expect(screen.getByLabelText(/Reason/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should mark owner select as invalid when error exists', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} formErrors={{ ownerId: 'Required' }} />
      );

      expect(screen.getByLabelText(/Owner/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Unsaved Changes', () => {
    it('should show unsaved changes modal when closing with unsaved changes', async () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, description: 'Some change' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });
    });

    it('should not show unsaved changes modal when closing with empty form', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} adjustmentForm={defaultAdjustmentForm} />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
    });

    it('should close modal when discarding changes', async () => {
      const onClose = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          onClose={onClose}
          adjustmentForm={{ ...defaultAdjustmentForm, description: 'Test' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Discard/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('should keep modal open when cancelling discard', async () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, description: 'Test' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Keep Editing/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      });
    });

    it('should detect unsaved changes when reason is filled', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, reason: 'Some reason' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('should detect unsaved changes when pbiId is set', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, pbiId: 'pbi-1' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('should detect unsaved changes when ownerId is set', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, ownerId: 'user-1' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('should detect unsaved changes when action is not add', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, action: 'modify' }}
        />
      );

      const closeButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('adjustment-form-close'));
      fireEvent.click(closeButton!);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('should call onSubmit when Add Adjustment button is clicked', () => {
      const onSubmit = vi.fn();
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(
        screen.getByRole('button', {
          name: i18nT('sprint-review:addAdjustmentModal.addAdjustment'),
        })
      );

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should disable Add Adjustment button when isPending is true', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} isPending={true} />);

      expect(
        screen.getByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.adding') })
      ).toBeDisabled();
    });

    it('should show "Adding..." text when isPending is true', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} isPending={true} />);

      expect(
        screen.getByText(i18nT('sprint-review:addAdjustmentModal.adding'))
      ).toBeInTheDocument();
    });

    it('should clear form errors when Cancel button is clicked', () => {
      const setFormErrors = vi.fn();
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} setFormErrors={setFormErrors} />
      );

      // Click the footer Cancel button (not the close X button)
      const cancelButton = screen
        .getAllByRole('button', { name: i18nT('sprint-review:addAdjustmentModal.cancel') })
        .find((btn) => btn.classList.contains('button-secondary'));
      fireEvent.click(cancelButton!);

      expect(setFormErrors).toHaveBeenCalledWith({});
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on dialog', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'adjustment-form-title');
    });

    it('should have aria-required on required fields', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} />);

      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.description')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toHaveAttribute('aria-required', 'true');
      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.reason')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toHaveAttribute('aria-required', 'true');
      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.owner')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toHaveAttribute('aria-required', 'true');
    });

    it('should have aria-describedby on inputs when errors exist', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} formErrors={{ description: 'Required' }} />
      );

      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.description')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toHaveAttribute('aria-describedby', 'adjustment-description-error');
    });

    it('should have error IDs for each field', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          formErrors={{ description: 'D', reason: 'R', ownerId: 'O' }}
        />
      );

      expect(screen.getByText('D')).toHaveAttribute('id', 'adjustment-description-error');
      expect(screen.getByText('R')).toHaveAttribute('id', 'adjustment-reason-error');
      expect(screen.getByText('O')).toHaveAttribute('id', 'adjustment-owner-error');
    });
  });

  describe('Negative Test Cases', () => {
    it('should handle empty teamMembers array', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} teamMembers={[]} />);

      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.owner')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toBeInTheDocument();
    });

    it('should handle undefined teamMembers', () => {
      renderWithProviders(<AddBacklogAdjustmentModal {...defaultProps} teamMembers={undefined} />);

      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.owner')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toBeInTheDocument();
    });

    it('should handle empty sprintBacklogItems', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          sprintBacklogItems={{ success: true, data: [] }}
        />
      );

      expect(
        screen.getByLabelText(i18nT('sprint-review:addAdjustmentModal.relatedPbi'))
      ).toBeInTheDocument();
    });

    it('should handle undefined sprintBacklogItems', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal {...defaultProps} sprintBacklogItems={undefined} />
      );

      expect(
        screen.getByLabelText(i18nT('sprint-review:addAdjustmentModal.relatedPbi'))
      ).toBeInTheDocument();
    });

    it('should handle long description text', () => {
      const longDesc = 'A'.repeat(500);
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, description: longDesc }}
        />
      );

      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.description')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toHaveValue(longDesc);
    });

    it('should handle long reason text', () => {
      const longReason = 'A'.repeat(300);
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          adjustmentForm={{ ...defaultAdjustmentForm, reason: longReason }}
        />
      );

      expect(
        screen.getByLabelText(
          new RegExp(
            i18nT('sprint-review:addAdjustmentModal.reason')
              .replace(/\s*\*\s*/g, '')
              .trim()
          )
        )
      ).toHaveValue(longReason);
    });

    it('should handle multiple errors simultaneously', () => {
      renderWithProviders(
        <AddBacklogAdjustmentModal
          {...defaultProps}
          formErrors={{
            description: 'Description required',
            reason: 'Reason required',
            ownerId: 'Owner required',
          }}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(3);
    });
  });
});
