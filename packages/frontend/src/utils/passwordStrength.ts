export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
};

export const calculatePasswordStrength = (requirements: PasswordRequirements): PasswordStrength => {
  const metCount = Object.values(requirements).filter(Boolean).length;

  if (metCount <= 2) return 'weak';
  if (metCount <= 4) return 'medium';
  return 'strong';
};

export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
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
};

export const getPasswordStrengthLabel = (strength: PasswordStrength): string => {
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
};
