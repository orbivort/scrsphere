export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    email: `testuser_${timestamp}_${random}@example.com`,
    password: 'TestPass123!@#',
    firstName: 'Test',
    lastName: 'User',
  };
}

export function generateWeakPasswordUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `weakpass_${timestamp}@example.com`,
    password: 'weak',
    firstName: 'Weak',
    lastName: 'Password',
  };
}

export function generateInvalidCredentials(): { email: string; password: string } {
  return {
    email: 'invalid@example.com',
    password: 'wrongpassword123',
  };
}

export const testConstants = {
  validPassword: 'TestPass123!@#',
  weakPassword: 'weak',
  invalidEmail: 'invalid-email',
  emptyString: '',
} as const;
