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

import { AddFeedbackModal } from './AddFeedbackModal';
import type { ApiResponse, ProductBacklogItem, TeamMember, User } from '../../types';

// Initialize i18n before all tests
beforeAll(async () => {
  await initTestI18n();
});

vi.mock('./AddFeedbackModal.module.css', () => ({
  default: {
    'feedback-form-overlay': 'feedback-form-overlay',
    'feedback-form': 'feedback-form',
    'feedback-form-header': 'feedback-form-header',
    'feedback-form-header-content': 'feedback-form-header-content',
    'feedback-form-icon-wrapper': 'feedback-form-icon-wrapper',
    'feedback-form-title': 'feedback-form-title',
    'feedback-form-subtitle': 'feedback-form-subtitle',
    'feedback-form-close': 'feedback-form-close',
    'feedback-form-body': 'feedback-form-body',
    'feedback-form-legend': 'feedback-form-legend',
    'form-group': 'form-group',
    'input-with-counter': 'input-with-counter',
    error: 'error',
    'error-message': 'error-message',
    'char-counter': 'char-counter',
    'char-counter-warning': 'char-counter-warning',
    'char-counter-error': 'char-counter-error',
    'category-select-wrapper': 'category-select-wrapper',
    'category-indicator': 'category-indicator',
    'category-select': 'category-select',
    positive: 'positive',
    negative: 'negative',
    suggestion: 'suggestion',
    question: 'question',
    'action-required-toggle': 'action-required-toggle',
    active: 'active',
    'action-required-label': 'action-required-label',
    'action-required': 'action-required-icon',
    'required-asterisk': 'required-asterisk',
    'required-label': 'required-label',
    'feedback-form-footer': 'feedback-form-footer',
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
        <button onClick={onConfirm}>{i18nT('common:unsavedChanges.discardChanges')}</button>
        <button onClick={onCancel}>{i18nT('common:unsavedChanges.goBack')}</button>
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
  {
    userId: 'user-2',
    teamId: 'team-1',
    role: 'member',
    joinedAt: '2026-01-01T00:00:00Z',
    user: {
      id: 'user-2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
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
    {
      id: 'pbi-2',
      teamId: 'team-1',
      title: 'Dashboard UI',
      description: 'Create dashboard page',
      status: 'NEW',
      priority: 'SHOULD_HAVE',
      storyPoints: 5,
      businessValue: 7,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'user-1',
    },
  ],
};

const defaultFeedbackForm = {
  authorName: '',
  content: '',
  category: 'positive' as const,
  actionRequired: false,
  relatedPbiId: undefined,
  ownerId: undefined,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  teamMembers: mockTeamMembers,
  sprintBacklogItems: mockSprintBacklogItems,
  formErrors: {},
  setFormErrors: vi.fn(),
  feedbackForm: defaultFeedbackForm,
  setFeedbackForm: vi.fn(),
  isPending: false,
};

describe('AddFeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(
        screen.getByRole('heading', { name: i18nT('sprint-review:addFeedbackModal.title') })
      ).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      expect(screen.getByLabelText(/Author Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Feedback/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Related PBI/i)).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      // There should be at least one Cancel button (the close button)
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('should render action buttons', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      // Check for Cancel button in footer
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
      // Check for Add Feedback button
      expect(
        screen.getByRole('button', { name: i18nT('sprint-review:addFeedbackModal.addFeedback') })
      ).toBeInTheDocument();
    });

    it('should display subtitle', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      expect(
        screen.getByText(i18nT('sprint-review:addFeedbackModal.subtitle'))
      ).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should call setFeedbackForm when author name changes', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(<AddFeedbackModal {...defaultProps} setFeedbackForm={setFeedbackForm} />);

      const authorInput = screen.getByLabelText(/Author Name/i);
      fireEvent.change(authorInput, { target: { value: 'John Stakeholder' } });

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ authorName: 'John Stakeholder' })
      );
    });

    it('should call setFeedbackForm when content changes', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(<AddFeedbackModal {...defaultProps} setFeedbackForm={setFeedbackForm} />);

      const contentInput = screen.getByLabelText(/^Feedback/i);
      fireEvent.change(contentInput, { target: { value: 'Great work!' } });

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Great work!' })
      );
    });

    it('should call setFeedbackForm when category changes', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(<AddFeedbackModal {...defaultProps} setFeedbackForm={setFeedbackForm} />);

      const categorySelect = screen.getByLabelText(
        i18nT('sprint-review:addFeedbackModal.category')
      );
      fireEvent.change(categorySelect, { target: { value: 'negative' } });

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'negative' })
      );
    });

    it('should call setFeedbackForm when related PBI changes', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(<AddFeedbackModal {...defaultProps} setFeedbackForm={setFeedbackForm} />);

      const pbiSelect = screen.getByLabelText(/Related PBI/i);
      fireEvent.change(pbiSelect, { target: { value: 'pbi-1' } });

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ relatedPbiId: 'pbi-1' })
      );
    });

    it('should toggle actionRequired when checkbox is clicked', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: false }}
          setFeedbackForm={setFeedbackForm}
        />
      );

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ actionRequired: true })
      );
    });

    it('should toggle actionRequired via keyboard Enter key', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: false }}
          setFeedbackForm={setFeedbackForm}
        />
      );

      const toggle = screen.getByRole('checkbox');
      fireEvent.keyDown(toggle, { key: 'Enter' });

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ actionRequired: true })
      );
    });

    it('should toggle actionRequired via keyboard Space key', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: false }}
          setFeedbackForm={setFeedbackForm}
        />
      );

      const toggle = screen.getByRole('checkbox');
      fireEvent.keyDown(toggle, { key: ' ' });

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ actionRequired: true })
      );
    });

    it('should clear ownerId when actionRequired is toggled off', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true, ownerId: 'user-1' }}
          setFeedbackForm={setFeedbackForm}
        />
      );

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(setFeedbackForm).toHaveBeenCalledWith(
        expect.objectContaining({ actionRequired: false, ownerId: undefined })
      );
    });
  });

  describe('Action Required Owner Field', () => {
    it('should show owner field when actionRequired is true', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(screen.getByLabelText(/Owner/i)).toBeInTheDocument();
    });

    it('should not show owner field when actionRequired is false', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: false }}
        />
      );

      expect(screen.queryByLabelText(/Owner/i)).not.toBeInTheDocument();
    });

    it('should call setFeedbackForm when owner changes', () => {
      const setFeedbackForm = vi.fn();
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
          setFeedbackForm={setFeedbackForm}
        />
      );

      const ownerSelect = screen.getByLabelText(/Owner/i);
      fireEvent.change(ownerSelect, { target: { value: 'user-1' } });

      expect(setFeedbackForm).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'user-1' }));
    });

    it('should render team members in owner dropdown', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle team member without user object', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          teamMembers={[
            {
              userId: 'user-3',
              teamId: 'team-1',
              role: 'member',
              joinedAt: '2026-01-01T00:00:00Z',
            },
          ]}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(screen.getByText('user-3')).toBeInTheDocument();
    });
  });

  describe('Form Validation and Errors', () => {
    it('should display author name error when formErrors.authorName exists', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          formErrors={{ authorName: 'Author name is required' }}
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Author name is required');
    });

    it('should display feedback content error when formErrors.content exists', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          formErrors={{ content: 'Feedback content is required' }}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.includes('Feedback content is required'))).toBe(
        true
      );
    });

    it('should display owner error when formErrors.ownerId exists and actionRequired is true', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          formErrors={{ ownerId: 'Owner is required' }}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((a) => a.textContent?.includes('Owner is required'))).toBe(true);
    });

    it('should mark author input as invalid when error exists', () => {
      renderWithProviders(
        <AddFeedbackModal {...defaultProps} formErrors={{ authorName: 'Required' }} />
      );

      expect(screen.getByLabelText(/Author Name/i)).toHaveAttribute('aria-invalid', 'true');
    });

    it('should mark feedback textarea as invalid when error exists', () => {
      renderWithProviders(
        <AddFeedbackModal {...defaultProps} formErrors={{ content: 'Required' }} />
      );

      const textarea = screen.getByLabelText(/^Feedback/i);
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should mark owner select as invalid when error exists', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          formErrors={{ ownerId: 'Required' }}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(screen.getByLabelText(/Owner/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Character Counters', () => {
    it('should display character count for author name', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, authorName: 'John' }}
        />
      );

      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    it('should display character count for feedback content', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, content: 'Great job' }}
        />
      );

      expect(screen.getByText('9/1000')).toBeInTheDocument();
    });

    it('should show warning style when author name approaches limit', () => {
      const longName = 'A'.repeat(85);
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, authorName: longName }}
        />
      );

      expect(screen.getByText('85/100')).toHaveClass('char-counter-warning');
    });

    it('should show warning style when content approaches limit', () => {
      const longContent = 'A'.repeat(850);
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, content: longContent }}
        />
      );

      expect(screen.getByText('850/1000')).toHaveClass('char-counter-warning');
    });

    it('should show error style when content is very close to limit', () => {
      const veryLongContent = 'A'.repeat(960);
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, content: veryLongContent }}
        />
      );

      expect(screen.getByText('960/1000')).toHaveClass('char-counter-error');
    });
  });

  describe('Unsaved Changes', () => {
    it('should show unsaved changes modal when attempting to close with unsaved changes', async () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, authorName: 'John' }}
        />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i })[0]);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });
    });

    it('should not show unsaved changes modal when closing with empty form', () => {
      renderWithProviders(
        <AddFeedbackModal {...defaultProps} feedbackForm={defaultFeedbackForm} />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i })[0]);

      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
    });

    it('should close modal when discarding changes', async () => {
      const onClose = vi.fn();
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          onClose={onClose}
          feedbackForm={{ ...defaultFeedbackForm, authorName: 'John' }}
        />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i })[0]);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: i18nT('common:unsavedChanges.discardChanges') })
      );

      expect(onClose).toHaveBeenCalled();
    });

    it('should keep modal open when cancelling discard', async () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, authorName: 'John' }}
        />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i })[0]);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: i18nT('common:unsavedChanges.goBack') }));

      await waitFor(() => {
        expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      });
    });

    it('should detect unsaved changes when actionRequired is true', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Cancel/i })[0]);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('should detect unsaved changes when category is not positive', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, category: 'negative' }}
        />
      );

      // Click the close button
      const closeButton = screen.getAllByRole('button', { name: /Cancel/i })[0];
      fireEvent.click(closeButton);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('should call onSubmit when Add Feedback button is clicked', () => {
      const onSubmit = vi.fn();
      renderWithProviders(<AddFeedbackModal {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(
        screen.getByRole('button', { name: i18nT('sprint-review:addFeedbackModal.addFeedback') })
      );

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should disable Add Feedback button when isPending is true', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} isPending={true} />);

      expect(
        screen.getByRole('button', { name: i18nT('sprint-review:addFeedbackModal.adding') })
      ).toBeDisabled();
    });

    it('should show "Adding..." text when isPending is true', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} isPending={true} />);

      expect(screen.getByText(i18nT('sprint-review:addFeedbackModal.adding'))).toBeInTheDocument();
    });

    it('should clear form errors when Cancel button is clicked', () => {
      const setFormErrors = vi.fn();
      renderWithProviders(<AddFeedbackModal {...defaultProps} setFormErrors={setFormErrors} />);

      // Click the footer Cancel button (second Cancel button, not the close button)
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButtons[1]);

      expect(setFormErrors).toHaveBeenCalledWith({});
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on dialog', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'feedback-form-title');
    });

    it('should have required asterisks on required fields', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} />);

      const asterisks = screen.getAllByText('*');
      expect(asterisks.length).toBeGreaterThan(0);
    });

    it('should have aria-checked on action required toggle', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    });

    it('should have aria-describedby on inputs when errors exist', () => {
      renderWithProviders(
        <AddFeedbackModal {...defaultProps} formErrors={{ authorName: 'Required' }} />
      );

      expect(screen.getByLabelText(/Author Name/i)).toHaveAttribute(
        'aria-describedby',
        'feedback-author-error'
      );
    });
  });

  describe('Negative Test Cases', () => {
    it('should handle empty teamMembers array', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          teamMembers={[]}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(
        screen.getByText(i18nT('sprint-review:addFeedbackModal.ownerPlaceholder'))
      ).toBeInTheDocument();
    });

    it('should handle undefined teamMembers', () => {
      renderWithProviders(
        <AddFeedbackModal
          {...defaultProps}
          teamMembers={undefined}
          feedbackForm={{ ...defaultFeedbackForm, actionRequired: true }}
        />
      );

      expect(
        screen.getByText(i18nT('sprint-review:addFeedbackModal.ownerPlaceholder'))
      ).toBeInTheDocument();
    });

    it('should handle empty sprintBacklogItems', () => {
      renderWithProviders(
        <AddFeedbackModal {...defaultProps} sprintBacklogItems={{ success: true, data: [] }} />
      );

      expect(screen.getByLabelText(/Related PBI/i)).toBeInTheDocument();
    });

    it('should handle undefined sprintBacklogItems', () => {
      renderWithProviders(<AddFeedbackModal {...defaultProps} sprintBacklogItems={undefined} />);

      expect(screen.getByLabelText(/Related PBI/i)).toBeInTheDocument();
    });
  });
});
