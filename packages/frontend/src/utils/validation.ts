type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

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

export const validateProfileUpdate = (
  data: ProfileUpdateData,
  t?: TranslateFunction
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = t ? t('validation:firstNameRequired') : 'First name is required';
  } else if (data.firstName.trim().length > 100) {
    errors.firstName = t
      ? t('validation:firstNameMaxLength', { max: 100 })
      : 'First name must be 100 characters or less';
  }

  if (!data.lastName.trim()) {
    errors.lastName = t ? t('validation:lastNameRequired') : 'Last name is required';
  } else if (data.lastName.trim().length > 100) {
    errors.lastName = t
      ? t('validation:lastNameMaxLength', { max: 100 })
      : 'Last name must be 100 characters or less';
  }

  return errors;
};

export const validatePasswordChange = (
  data: PasswordChangeData,
  t?: TranslateFunction
): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.currentPassword) {
    errors.currentPassword = t
      ? t('validation:currentPasswordRequired')
      : 'Current password is required';
  }

  if (!data.newPassword) {
    errors.newPassword = t ? t('validation:newPasswordRequired') : 'New password is required';
  } else {
    const passwordErrors: string[] = [];

    if (data.newPassword.length < 12) {
      passwordErrors.push(
        t ? t('validation:passwordMinLength', { min: 12 }) : 'at least 12 characters'
      );
    }
    if (!/[A-Z]/.test(data.newPassword)) {
      passwordErrors.push(t ? t('validation:passwordUppercase') : 'an uppercase letter');
    }
    if (!/[a-z]/.test(data.newPassword)) {
      passwordErrors.push(t ? t('validation:passwordLowercase') : 'a lowercase letter');
    }
    if (!/[0-9]/.test(data.newPassword)) {
      passwordErrors.push(t ? t('validation:passwordNumber') : 'a number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(data.newPassword)) {
      passwordErrors.push(t ? t('validation:passwordSpecial') : 'a special character');
    }

    if (passwordErrors.length > 0) {
      errors.newPassword = t
        ? t('validation:passwordMustContain', { requirements: passwordErrors.join(', ') })
        : `Password must contain ${passwordErrors.join(', ')}`;
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = t
      ? t('validation:confirmPasswordRequired')
      : 'Please confirm your new password';
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = t ? t('validation:passwordMismatch') : 'Passwords do not match';
  }

  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    errors.newPassword = t
      ? t('validation:newPasswordDifferent')
      : 'New password must be different from current password';
  }

  return errors;
};
