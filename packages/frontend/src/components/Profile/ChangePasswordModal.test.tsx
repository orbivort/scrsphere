import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockStore } from '../../__mocks__/mockData';

import { ChangePasswordModal } from './ChangePasswordModal';

vi.mock('./ChangePasswordModal.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: (target, prop) => prop,
    }
  ),
}));

vi.mock('../../utils/validation', () => ({
  validatePasswordChange: vi.fn((data) => {
    const errors: Record<string, string> = {};
    if (!data.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!data.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (data.newPassword.length < 12) {
      errors.newPassword = 'Password must contain at least 12 characters';
    }
    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    return errors;
  }),
}));

vi.mock('../../utils/passwordStrength', () => ({
  checkPasswordRequirements: vi.fn((password) => ({
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  })),
  calculatePasswordStrength: vi.fn((requirements) => {
    const metCount = Object.values(requirements).filter(Boolean).length;
    if (metCount <= 2) return 'weak';
    if (metCount <= 4) return 'medium';
    return 'strong';
  }),
  getPasswordStrengthColor: vi.fn((strength) => {
    switch (strength) {
      case 'weak':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'strong':
        return '#10B981';
      default:
        return '#E5E7EB';
    }
  }),
  getPasswordStrengthLabel: vi.fn((strength) => {
    switch (strength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
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
import { validatePasswordChange } from '../../utils/validation';
import { checkPasswordRequirements, calculatePasswordStrength } from '../../utils/passwordStrength';

interface SetupOptions {
  isOpen?: boolean;
  isChangingPassword?: boolean;
  passwordChangeError?: string | null;
  onClose?: ReturnType<typeof vi.fn>;
  onDirtyChange?: ReturnType<typeof vi.fn>;
}

const setup = (options: SetupOptions = {}) => {
  const {
    isOpen = true,
    isChangingPassword = false,
    passwordChangeError = null,
    onClose = vi.fn(),
    onDirtyChange = vi.fn(),
  } = options;

  const mockChangePassword = vi.fn().mockResolvedValue(true);
  const mockClearProfileErrors = vi.fn();

  mockStore(useAuthStore, {
    changePassword: mockChangePassword,
    isChangingPassword,
    passwordChangeError,
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
    <ChangePasswordModal isOpen={isOpen} onClose={onClose} onDirtyChange={onDirtyChange} />
  );

  return {
    ...utils,
    onClose,
    onDirtyChange,
    mockChangePassword,
    mockClearProfileErrors,
    mockSuccess,
  };
};

const getCurrentPasswordInput = () => screen.getByLabelText('Current Password*');
const getNewPasswordInput = () => screen.getByLabelText('New Password*');
const getConfirmPasswordInput = () => screen.getByLabelText('Confirm New Password*');
const getChangeButton = () => screen.getByRole('button', { name: /change password/i });
const getCancelButton = () => screen.getByRole('button', { name: /cancel/i });
const getCloseButton = () => screen.getByRole('button', { name: /close/i });

describe('ChangePasswordModal', () => {
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
      const changePasswordElements = screen.getAllByText('Change Password');
      expect(changePasswordElements.length).toBeGreaterThan(0);
    });

    it('should not render when isOpen is false', () => {
      setup({ isOpen: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display modal title with lock icon', () => {
      setup();

      const title = screen.getByRole('heading', { level: 2, name: /change password/i });
      expect(title).toBeInTheDocument();
    });

    it('should render all password input fields', () => {
      setup();

      expect(getCurrentPasswordInput()).toBeInTheDocument();
      expect(getNewPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
    });

    it('should render required asterisks for all fields', () => {
      setup();

      const requiredAsterisks = screen.getAllByText('*');
      expect(requiredAsterisks).toHaveLength(3);
    });

    it('should render Cancel and Change Password buttons', () => {
      setup();

      expect(getCancelButton()).toBeInTheDocument();
      expect(getChangeButton()).toBeInTheDocument();
    });

    it('should render all fields as password type initially', () => {
      setup();

      expect(getCurrentPasswordInput()).toHaveAttribute('type', 'password');
      expect(getNewPasswordInput()).toHaveAttribute('type', 'password');
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Interactions', () => {
    it('should update current password input on change', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getCurrentPasswordInput(), 'CurrentPass123!');

      expect(getCurrentPasswordInput()).toHaveValue('CurrentPass123!');
    });

    it('should update new password input on change', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'NewP@ssw0rd123!');

      expect(getNewPasswordInput()).toHaveValue('NewP@ssw0rd123!');
    });

    it('should update confirm password input on change', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getConfirmPasswordInput(), 'NewP@ssw0rd123!');

      expect(getConfirmPasswordInput()).toHaveValue('NewP@ssw0rd123!');
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
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle current password visibility', async () => {
      const user = userEvent.setup();
      setup();

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      const currentPasswordToggle = toggleButtons[0];

      expect(getCurrentPasswordInput()).toHaveAttribute('type', 'password');

      await user.click(currentPasswordToggle);

      expect(getCurrentPasswordInput()).toHaveAttribute('type', 'text');
      expect(currentPasswordToggle).toHaveAttribute('aria-label', 'Hide password');
    });

    it('should toggle new password visibility', async () => {
      const user = userEvent.setup();
      setup();

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      const newPasswordToggle = toggleButtons[1];

      expect(getNewPasswordInput()).toHaveAttribute('type', 'password');

      await user.click(newPasswordToggle);

      expect(getNewPasswordInput()).toHaveAttribute('type', 'text');
      expect(newPasswordToggle).toHaveAttribute('aria-label', 'Hide password');
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      setup();

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      const confirmPasswordToggle = toggleButtons[2];

      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');

      await user.click(confirmPasswordToggle);

      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'text');
      expect(confirmPasswordToggle).toHaveAttribute('aria-label', 'Hide password');
    });

    it('should hide password when toggled twice', async () => {
      const user = userEvent.setup();
      setup();

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      const newPasswordToggle = toggleButtons[1];

      await user.click(newPasswordToggle);
      expect(getNewPasswordInput()).toHaveAttribute('type', 'text');

      await user.click(newPasswordToggle);
      expect(getNewPasswordInput()).toHaveAttribute('type', 'password');
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show strength indicator when new password is entered', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'Password');

      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    it('should not show strength indicator when new password is empty', () => {
      setup();

      expect(screen.queryByText(/weak/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/medium/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/strong/i)).not.toBeInTheDocument();
    });

    it('should update strength label based on password requirements', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'StrongP@ssw0rd12');

      expect(
        screen.getByText(
          (content) => content === 'Weak' || content === 'Medium' || content === 'Strong'
        )
      ).toBeInTheDocument();
    });

    it('should display password requirements list', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'Password');

      await vi.waitFor(() => {
        expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
      });

      const requirementsList = screen
        .getByText('Password Requirements:')
        .parentElement?.querySelector('ul');
      expect(requirementsList).toBeTruthy();
      expect(requirementsList!.textContent).toMatch(/at least 12 characters/i);
    });

    it('should show checkmark for met requirements', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'Password');

      const requirementsTitle = screen.getByText('Password Requirements:');
      expect(requirementsTitle).toBeInTheDocument();
      expect(requirementsTitle.tagName).toBe('P');
    });
  });

  describe('Password Match Indicator', () => {
    it('should show "Passwords match" when passwords match', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'NewP@ssw0rd123!');
      await user.type(getConfirmPasswordInput(), 'NewP@ssw0rd123!');

      expect(screen.getByText('Passwords match')).toBeInTheDocument();
    });

    it('should not show "Passwords match" when passwords do not match', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'NewP@ssw0rd123!');
      await user.type(getConfirmPasswordInput(), 'DifferentP@ss123!');

      expect(screen.queryByText('Passwords match')).not.toBeInTheDocument();
    });

    it('should not show "Passwords match" when confirm password is empty', async () => {
      const user = userEvent.setup();
      setup();

      await user.type(getNewPasswordInput(), 'NewP@ssw0rd123!');

      expect(screen.queryByText('Passwords match')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should call validatePasswordChange on form submit', () => {
      const { container } = setup();

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      expect(validatePasswordChange).toHaveBeenCalled();
    });

    it('should show validation error for empty current password', () => {
      const { container } = setup();

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should show validation error for empty new password', () => {
      setup();

      const currentInput = getCurrentPasswordInput();
      fireEvent.change(currentInput, { target: { value: 'CurrentPass123!' } });
      fireEvent.click(getChangeButton());

      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });

    it('should show validation error for empty confirm password', () => {
      setup();

      const currentInput = getCurrentPasswordInput();
      const newInput = getNewPasswordInput();
      fireEvent.change(currentInput, { target: { value: 'CurrentPass123!' } });
      fireEvent.change(newInput, { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.click(getChangeButton());

      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });

    it('should show validation error when passwords do not match', () => {
      setup();

      const currentInput = getCurrentPasswordInput();
      const newInput = getNewPasswordInput();
      const confirmInput = getConfirmPasswordInput();
      fireEvent.change(currentInput, { target: { value: 'CurrentPass123!' } });
      fireEvent.change(newInput, { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(confirmInput, { target: { value: 'DifferentP@ss123!' } });
      fireEvent.click(getChangeButton());

      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });

    it('should not submit form when validation fails', async () => {
      const user = userEvent.setup();
      const { mockChangePassword } = setup();

      await user.click(getChangeButton());

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should disable change button when form is invalid', () => {
      setup();

      expect(getChangeButton()).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should call changePassword with correct data on valid submit', async () => {
      const user = userEvent.setup();
      const { mockChangePassword } = setup();

      await user.type(getCurrentPasswordInput(), 'CurrentP@ss123!');
      await user.type(getNewPasswordInput(), 'NewP@ssw0rd123!');
      await user.type(getConfirmPasswordInput(), 'NewP@ssw0rd123!');
      await user.click(getChangeButton());

      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentP@ss123!',
        newPassword: 'NewP@ssw0rd123!',
      });
    });

    it('should show success toast after successful password change', async () => {
      vi.useFakeTimers();
      const { mockSuccess } = setup();

      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentP@ss123!' } });
      fireEvent.change(getNewPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.click(getChangeButton());

      await act(async () => {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      });

      expect(mockSuccess).toHaveBeenCalledWith('Password changed successfully');

      vi.useRealTimers();
    });

    it('should close modal after toast disappears', async () => {
      vi.useFakeTimers();
      const { onClose } = setup();

      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentP@ss123!' } });
      fireEvent.change(getNewPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.click(getChangeButton());

      await act(async () => {
        await Promise.resolve();
        vi.advanceTimersByTime(2000);
      });

      expect(onClose).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should display error banner when passwordChangeError is present', () => {
      setup({ passwordChangeError: 'Current password is incorrect' });

      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    });

    it('should call clearProfileErrors when modal opens', () => {
      const { mockClearProfileErrors } = setup();

      expect(mockClearProfileErrors).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable form fields when isChangingPassword is true', () => {
      setup({ isChangingPassword: true });

      expect(getCurrentPasswordInput()).toBeDisabled();
      expect(getNewPasswordInput()).toBeDisabled();
      expect(getConfirmPasswordInput()).toBeDisabled();
      expect(getCancelButton()).toBeDisabled();
      expect(screen.getByRole('button', { name: /changing/i })).toBeDisabled();
    });

    it('should show "Changing..." text when isChangingPassword is true', () => {
      setup({ isChangingPassword: true });

      expect(screen.getByText('Changing...')).toBeInTheDocument();
    });

    it('should apply button-loading class when changing password', () => {
      setup({ isChangingPassword: true });

      expect(screen.getByRole('button', { name: /changing/i })).toHaveClass('button-loading');
    });

    it('should disable password toggle buttons when loading', () => {
      setup({ isChangingPassword: true });

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      toggleButtons.forEach((button) => {
        expect(button).toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Dirty State Management', () => {
    it('should call onDirtyChange with true when form data changes', () => {
      const { onDirtyChange } = setup();

      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentPass123!' } });

      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });

    it('should call onDirtyChange with false when form is empty', () => {
      const { onDirtyChange } = setup();

      expect(onDirtyChange).toHaveBeenCalledWith(false);
    });

    it('should call onDirtyChange with false after successful password change', async () => {
      vi.useFakeTimers();
      const { onDirtyChange } = setup();

      // Make the form dirty first
      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentP@ss123!' } });
      fireEvent.change(getNewPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });

      // Clear previous calls to onDirtyChange
      onDirtyChange.mockClear();

      // Submit the form
      fireEvent.click(getChangeButton());

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
      const { onDirtyChange, onClose } = setup();

      // Make the form dirty
      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentP@ss123!' } });
      fireEvent.change(getNewPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });

      // Clear previous calls
      onDirtyChange.mockClear();

      // Submit the form
      fireEvent.click(getChangeButton());

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
      const { onDirtyChange, mockChangePassword } = setup();

      // Make the form dirty
      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentP@ss123!' } });
      fireEvent.change(getNewPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });

      // Clear previous calls
      onDirtyChange.mockClear();

      // Mock failure
      mockChangePassword.mockResolvedValueOnce(false);

      // Submit the form
      fireEvent.click(getChangeButton());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Verify onDirtyChange was NOT called with false (still dirty)
      expect(onDirtyChange).not.toHaveBeenCalledWith(false);
    });

    it('should reset form data after successful password change', async () => {
      vi.useFakeTimers();
      setup();

      // Fill in the form
      fireEvent.change(getCurrentPasswordInput(), { target: { value: 'CurrentP@ss123!' } });
      fireEvent.change(getNewPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });
      fireEvent.change(getConfirmPasswordInput(), { target: { value: 'NewP@ssw0rd123!' } });

      // Submit the form
      fireEvent.click(getChangeButton());

      await act(async () => {
        await Promise.resolve();
      });

      // Verify form data is reset
      expect(getCurrentPasswordInput()).toHaveValue('');
      expect(getNewPasswordInput()).toHaveValue('');
      expect(getConfirmPasswordInput()).toHaveValue('');

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on modal', () => {
      setup();

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'change-password-title');
    });

    it('should have proper autocomplete attributes on password fields', () => {
      setup();

      expect(getCurrentPasswordInput()).toHaveAttribute('autocomplete', 'current-password');
      expect(getNewPasswordInput()).toHaveAttribute('autocomplete', 'new-password');
      expect(getConfirmPasswordInput()).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should have proper aria-label on toggle buttons', () => {
      setup();

      const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
      expect(toggleButtons).toHaveLength(3);

      toggleButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should have Cancel button as type="button"', () => {
      setup();

      expect(getCancelButton()).toHaveAttribute('type', 'button');
    });

    it('should have Change button as type="submit"', () => {
      setup();

      expect(getChangeButton()).toHaveAttribute('type', 'submit');
    });

    it('should have role="alert" on error messages', () => {
      const { container } = setup();

      const form = container.querySelector('form');
      fireEvent.submit(form!);

      const errors = screen.getAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Input Placeholders', () => {
    it('should have placeholder on current password input', () => {
      setup();

      expect(getCurrentPasswordInput()).toHaveAttribute(
        'placeholder',
        'Enter your current password'
      );
    });

    it('should have placeholder on new password input', () => {
      setup();

      expect(getNewPasswordInput()).toHaveAttribute('placeholder', 'Enter your new password');
    });

    it('should have placeholder on confirm password input', () => {
      setup();

      expect(getConfirmPasswordInput()).toHaveAttribute('placeholder', 'Confirm your new password');
    });
  });

  describe('State Reset on Modal Open', () => {
    it('should reset form data when modal opens', () => {
      setup();

      expect(getCurrentPasswordInput()).toHaveValue('');
      expect(getNewPasswordInput()).toHaveValue('');
      expect(getConfirmPasswordInput()).toHaveValue('');
    });

    it('should reset visibility toggles when modal opens', () => {
      setup();

      expect(getCurrentPasswordInput()).toHaveAttribute('type', 'password');
      expect(getNewPasswordInput()).toHaveAttribute('type', 'password');
      expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');
    });
  });

  describe('Password Requirements Validation', () => {
    it('should call checkPasswordRequirements when new password changes', () => {
      setup();

      fireEvent.change(getNewPasswordInput(), { target: { value: 'Test' } });

      expect(checkPasswordRequirements).toHaveBeenCalledWith('Test');
    });

    it('should call calculatePasswordStrength when new password changes', () => {
      setup();

      fireEvent.change(getNewPasswordInput(), { target: { value: 'Test' } });

      expect(calculatePasswordStrength).toHaveBeenCalled();
    });
  });
});
