export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateProfileUpdate = (data: ProfileUpdateData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length > 100) {
    errors.firstName = 'First name must be 100 characters or less';
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length > 100) {
    errors.lastName = 'Last name must be 100 characters or less';
  }

  return errors;
};

export const validatePasswordChange = (data: PasswordChangeData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.currentPassword) {
    errors.currentPassword = 'Current password is required';
  }

  if (!data.newPassword) {
    errors.newPassword = 'New password is required';
  } else {
    const passwordErrors: string[] = [];

    if (data.newPassword.length < 12) {
      passwordErrors.push('at least 12 characters');
    }
    if (!/[A-Z]/.test(data.newPassword)) {
      passwordErrors.push('an uppercase letter');
    }
    if (!/[a-z]/.test(data.newPassword)) {
      passwordErrors.push('a lowercase letter');
    }
    if (!/[0-9]/.test(data.newPassword)) {
      passwordErrors.push('a number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(data.newPassword)) {
      passwordErrors.push('a special character');
    }

    if (passwordErrors.length > 0) {
      errors.newPassword = `Password must contain ${passwordErrors.join(', ')}`;
    }
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
};
