import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockStore } from '../../__mocks__/mockData';

import { EditProfileModal } from './EditProfileModal';

vi.mock('./EditProfileModal.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: (target, prop) => prop,
    }
  ),
}));

vi.mock('../../utils/validation', () => ({
  validateProfileUpdate: vi.fn((data) => {
    const errors: Record<string, string> = {};
    if (!data.firstName?.trim()) {
      errors.firstName = 'First name is required';
    } else if (data.firstName.trim().length > 100) {
      errors.firstName = 'First name must be 100 characters or less';
    }
    if (!data.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    } else if (data.lastName.trim().length > 100) {
      errors.lastName = 'Last name must be 100 characters or less';
    }
    return errors;
  }),
}));

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: () => ({ modalRef: { current: null } }),
}));

vi.mock('../../store', () => ({
  useAuthStore: vi.fn(),
  useToastStore: vi.fn(),
}));

import { useAuthStore, useToastStore } from '../../store';
import { validateProfileUpdate } from '../../utils/validation';

const mockUser = {
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
};

interface SetupOptions {
  isOpen?: boolean;
  user?: typeof mockUser | null;
  isUpdatingProfile?: boolean;
  profileUpdateError?: string | null;
  onDirtyChange?: ReturnType<typeof vi.fn>;
  onClose?: ReturnType<typeof vi.fn>;
}

const setup = (options: SetupOptions = {}) => {
  const {
    isOpen = true,
    user = mockUser,
    isUpdatingProfile = false,
    profileUpdateError = null,
    onDirtyChange = vi.fn(),
    onClose = vi.fn(),
  } = options;

  const mockUpdateProfile = vi.fn().mockResolvedValue(true);
  const mockClearProfileErrors = vi.fn();

  mockStore(useAuthStore, {
    user,
    updateProfile: mockUpdateProfile,
    isUpdatingProfile,
    profileUpdateError,
    clearProfileErrors: mockClearProfileErrors,
  });

  const mockSuccess = vi.fn();
  vi.mocked(useToastStore).mockImplementation((selector) => {
    if (typeof selector === 'function') {
      return selector({ success: mockSuccess } as any);
    }
    return { success: mockSuccess } as any;
  });

  const utils = render(
    <EditProfileModal isOpen={isOpen} onClose={onClose} onDirtyChange={onDirtyChange} />
  );

  return {
    ...utils,
    onClose,
    onDirtyChange,
    mockUpdateProfile,
    mockClearProfileErrors,
    mockSuccess,
  };
};

const getFirstNameInput = () => screen.getByLabelText(/first name/i);
const getLastNameInput = () => screen.getByLabelText(/last name/i);
const getEmailInput = () => screen.getByDisplayValue(/@/);
const getSaveButton = () => screen.getByRole('button', { name: /save changes/i });
const getCancelButton = () => screen.getByRole('button', { name: /cancel/i });
const getCloseButton = () => screen.getByRole('button', { name: /close/i });

describe('EditProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      setup();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      setup({ isOpen: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display modal title with user icon', () => {
      setup();

      const title = screen.getByRole('heading', { level: 2, name: /edit profile/i });
      expect(title).toBeInTheDocument();
    });

    it('should pre-fill form with user data', () => {
      setup();

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });

    it('should display email as read-only field', () => {
      setup();

      expect(getEmailInput()).toBeDisabled();
    });

    it('should display "Read-only" badge next to email label', () => {
      setup();

      expect(screen.getByText('Read-only')).toBeInTheDocument();
    });

    it('should display helper text for email field', () => {
      setup();

      expect(screen.getByText('Contact support to change your email address')).toBeInTheDocument();
    });

    it('should render Cancel and Save buttons', () => {
      setup();

      expect(getCancelButton()).toBeInTheDocument();
      expect(getSaveButton()).toBeInTheDocument();
    });

    it('should render required asterisks for first and last name fields', () => {
      setup();

      const firstNameLabel = screen.getByText('First Name');
      const lastNameLabel = screen.getByText('Last Name');

      expect(firstNameLabel).toBeInTheDocument();
      expect(lastNameLabel).toBeInTheDocument();
    });

    it('should render character counters for name fields', () => {
      setup();

      const counters = screen.getAllByText(/\/ 100/);
      expect(counters).toHaveLength(2);
    });
  });

  describe('Form Interactions', () => {
    it('should update first name input on change', async () => {
      const user = userEvent.setup();
      setup();

      await user.clear(getFirstNameInput());
      await user.type(getFirstNameInput(), 'Jane');

      expect(getFirstNameInput()).toHaveValue('Jane');
    });

    it('should update last name input on change', async () => {
      const user = userEvent.setup();
      setup();

      await user.clear(getLastNameInput());
      await user.type(getLastNameInput(), 'Smith');

      expect(getLastNameInput()).toHaveValue('Smith');
    });

    it('should show character count as user types', async () => {
      const user = userEvent.setup();
      setup();

      await user.clear(getFirstNameInput());
      await user.type(getFirstNameInput(), 'John');

      expect(screen.getByText('4 / 100')).toBeInTheDocument();
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const { onClose } = setup();

      await user.click(getCancelButton());

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button (X) is clicked', async () => {
      const user = userEvent.setup();
      const { onClose } = setup();

      await user.click(getCloseButton());

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking overlay', async () => {
      const user = userEvent.setup();
      const { onClose, container } = setup();

      await user.click(container.firstChild as HTMLElement);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside modal', async () => {
      const user = userEvent.setup();
      const { onClose } = setup();

      await user.click(screen.getByRole('dialog'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should call validateProfileUpdate on form submit', async () => {
      const user = userEvent.setup();
      setup();

      await user.click(getSaveButton());

      expect(validateProfileUpdate).toHaveBeenCalled();
    });

    it('should show validation error for empty first name', async () => {
      const user = userEvent.setup();
      setup();

      await user.clear(getFirstNameInput());
      await user.click(getSaveButton());

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should show validation error for empty last name', async () => {
      const user = userEvent.setup();
      setup();

      await user.clear(getLastNameInput());
      await user.click(getSaveButton());

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup();
      const { mockUpdateProfile } = setup();

      await user.clear(getFirstNameInput());
      await user.click(getSaveButton());

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('should disable save button when form is invalid', async () => {
      const user = userEvent.setup();
      setup();

      await user.clear(getFirstNameInput());

      expect(getSaveButton()).toBeDisabled();
    });

    it('should enable save button when form is valid', () => {
      setup();

      expect(getSaveButton()).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should call updateProfile with correct data on valid submit', async () => {
      const user = userEvent.setup();
      const { mockUpdateProfile } = setup();

      await user.click(getSaveButton());

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
        });
      });
    });

    it('should show success toast after successful update', async () => {
      vi.useFakeTimers();
      const { mockSuccess } = setup();

      fireEvent.click(getSaveButton());

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockSuccess).toHaveBeenCalledWith('Profile updated successfully');

      vi.useRealTimers();
    });

    it('should close modal after toast disappears', async () => {
      vi.useFakeTimers();
      const { onClose } = setup();

      fireEvent.click(getSaveButton());

      // Flush microtasks to let the async handler run
      await act(async () => {
        await Promise.resolve();
      });

      // Advance timers by 2000ms for the toast timeout
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should display error banner when profileUpdateError is present', () => {
      setup({ profileUpdateError: 'Failed to update profile' });

      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });

    it('should call clearProfileErrors when modal opens', () => {
      const { mockClearProfileErrors } = setup();

      expect(mockClearProfileErrors).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable form fields when isUpdatingProfile is true', () => {
      setup({ isUpdatingProfile: true });

      expect(getFirstNameInput()).toBeDisabled();
      expect(getLastNameInput()).toBeDisabled();
      expect(getCancelButton()).toBeDisabled();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('should show "Saving..." text when isUpdatingProfile is true', () => {
      setup({ isUpdatingProfile: true });

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should apply button-loading class when updating', () => {
      setup({ isUpdatingProfile: true });

      expect(screen.getByRole('button', { name: /saving/i })).toHaveClass('button-loading');
    });
  });

  describe('Dirty State Management', () => {
    it('should call onDirtyChange with true when form data changes', () => {
      const { onDirtyChange, container } = setup();

      const firstNameInput = container.querySelector('#firstName') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });

    it('should call onDirtyChange with false when form data matches original', () => {
      const { onDirtyChange } = setup();

      expect(onDirtyChange).toHaveBeenCalledWith(false);
    });

    it('should call onDirtyChange with false after successful form submission', async () => {
      vi.useFakeTimers();
      const { onDirtyChange, container } = setup();

      // Make the form dirty first
      const firstNameInput = container.querySelector('#firstName') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Clear previous calls to onDirtyChange
      onDirtyChange.mockClear();

      // Submit the form
      fireEvent.click(getSaveButton());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Verify onDirtyChange was called with false after successful submission
      expect(onDirtyChange).toHaveBeenCalledWith(false);

      vi.useRealTimers();
    });

    it('should not show unsaved changes warning after successful submission when closing modal', async () => {
      vi.useFakeTimers();
      const { onDirtyChange, onClose, container } = setup();

      // Make the form dirty
      const firstNameInput = container.querySelector('#firstName') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Clear previous calls
      onDirtyChange.mockClear();

      // Submit the form
      fireEvent.click(getSaveButton());

      // Wait for submission to complete
      await act(async () => {
        await Promise.resolve();
      });

      // Verify dirty state is reset to false
      expect(onDirtyChange).toHaveBeenCalledWith(false);

      // Advance timers to close the modal
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Verify modal is closed
      expect(onClose).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should maintain dirty state when submission fails', async () => {
      const { onDirtyChange, container } = setup();

      // Make the form dirty
      const firstNameInput = container.querySelector('#firstName') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Clear previous calls
      onDirtyChange.mockClear();

      // Trigger validation error by clearing first name
      fireEvent.change(firstNameInput, { target: { value: '' } });
      fireEvent.click(getSaveButton());

      // Verify onDirtyChange was NOT called with false (still dirty)
      expect(onDirtyChange).not.toHaveBeenCalledWith(false);

      // Verify the last call was with true (still dirty due to changes)
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('should correctly track dirty state through multiple changes and reverts', () => {
      const { onDirtyChange, container } = setup();

      // Clear initial call
      onDirtyChange.mockClear();

      const firstNameInput = container.querySelector('#firstName') as HTMLInputElement;

      // Change from John to Jane (dirty)
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);

      // Change back to John (not dirty)
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      expect(onDirtyChange).toHaveBeenLastCalledWith(false);

      // Change to something else (dirty again)
      fireEvent.change(firstNameInput, { target: { value: 'Bob' } });
      expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    });

    it('should reset dirty state when modal is reopened after successful save', async () => {
      vi.useFakeTimers();
      const onDirtyChange = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <EditProfileModal isOpen={true} onClose={onClose} onDirtyChange={onDirtyChange} />
      );

      // Make the form dirty
      const firstNameInput = container.querySelector('#firstName') as HTMLInputElement;
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await act(async () => {
        await Promise.resolve();
      });

      // Verify dirty state was reset
      expect(onDirtyChange).toHaveBeenCalledWith(false);

      // Close modal
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      vi.useRealTimers();
    });
  });

  describe('User Data Edge Cases', () => {
    it('should handle user with empty first name', () => {
      setup({ user: { ...mockUser, firstName: '' } });

      expect(getFirstNameInput()).toHaveValue('');
    });

    it('should handle user with empty last name', () => {
      setup({ user: { ...mockUser, lastName: '' } });

      expect(getLastNameInput()).toHaveValue('');
    });

    it('should handle null user gracefully', () => {
      setup({ user: null });

      expect(getFirstNameInput()).toHaveValue('');
      expect(getLastNameInput()).toHaveValue('');
    });

    it('should handle user with undefined email', () => {
      setup({ user: { ...mockUser, email: undefined } });

      const emailInput = screen.queryByDisplayValue(/@/);
      expect(emailInput).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on modal', () => {
      setup();

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'edit-profile-title');
    });

    it('should have proper ARIA attributes on error messages', () => {
      setup();

      const firstNameInput = getFirstNameInput();
      fireEvent.change(firstNameInput, { target: { value: '' } });
      fireEvent.click(getSaveButton());

      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('id', 'firstName-error');
    });

    it('should have aria-describedby on email input', () => {
      setup();

      expect(getEmailInput()).toHaveAttribute('aria-describedby', 'email-help');
    });

    it('should have Cancel button as type="button"', () => {
      setup();

      expect(getCancelButton()).toHaveAttribute('type', 'button');
    });

    it('should have Save button as type="submit"', () => {
      setup();

      expect(getSaveButton()).toHaveAttribute('type', 'submit');
    });
  });

  describe('Input Attributes', () => {
    it('should have maxLength of 100 on first name input', () => {
      setup();

      expect(getFirstNameInput()).toHaveAttribute('maxLength', '100');
    });

    it('should have maxLength of 100 on last name input', () => {
      setup();

      expect(getLastNameInput()).toHaveAttribute('maxLength', '100');
    });

    it('should have placeholder text on first name input', () => {
      setup();

      expect(getFirstNameInput()).toHaveAttribute('placeholder', 'Enter your first name');
    });

    it('should have placeholder text on last name input', () => {
      setup();

      expect(getLastNameInput()).toHaveAttribute('placeholder', 'Enter your last name');
    });

    it('should have proper input types', () => {
      setup();

      expect(getFirstNameInput()).toHaveAttribute('type', 'text');
      expect(getLastNameInput()).toHaveAttribute('type', 'text');
      expect(getEmailInput()).toHaveAttribute('type', 'email');
    });
  });
});
