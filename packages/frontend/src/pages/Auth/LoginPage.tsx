import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import styles from './LoginPage.module.css';

import { EyeIcon, EyeOffIcon, LoaderIcon, ScrSphereIcon } from '@/components/common/Icons';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useApiError } from '@/hooks';
import { apiService } from '@/services';
import { useAuthStore, useSessionStore, useTeamStore } from '@/store';
import { logger } from '@/utils/logger';
import type { LoginCredentials } from '@/types';
import { getUserFriendlyErrorMessage, type ErrorDetails } from '@/utils/authErrors';

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 4) return 'good';
  return 'strong';
}

const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuthStore();
  const { setCurrentTeam, setUserRoleInCurrentTeam, setUserTeamsWithRoles } = useTeamStore();
  const { initializeSession } = useSessionStore();
  const { handleError } = useApiError();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning' | 'info'>('error');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const passwordStrength = useMemo(
    () => (isRegisterMode ? getPasswordStrength(password) : null),
    [isRegisterMode, password]
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register') {
        void navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  // Auto-populate credentials in mock mode (demo/development only)
  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK_API !== 'false') {
      setEmail('demo@example.com');
      setPassword('demo123456');
    }
  }, []);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      setErrorType('error');

      try {
        const credentials: LoginCredentials = { email, password };
        const response = await apiService.login(credentials);

        if (response.success && response.data) {
          const { user, sessionInfo } = response.data;

          setUser(user);

          initializeSession({
            expiresAt: new Date(sessionInfo.expiresAt),
            idleTimeoutMs: sessionInfo.idleTimeoutMs,
            absoluteTimeoutMs: sessionInfo.absoluteTimeoutMs,
            warningThresholdMs: sessionInfo.warningThresholdMs,
          });

          try {
            const teamsResponse = await apiService.getMyTeams();
            if (teamsResponse.success && teamsResponse.data && teamsResponse.data.length > 0) {
              setUserTeamsWithRoles(teamsResponse.data);

              const firstTeam = teamsResponse.data[0];
              if (firstTeam?.id) {
                const { userRole, ...teamData } = firstTeam;
                setCurrentTeam(teamData);
                setUserRoleInCurrentTeam(userRole);
              }
              void navigate('/dashboard');
            } else {
              void navigate('/team');
            }
          } catch (error) {
            logger.warn('Failed to fetch teams', undefined, { error });
            void navigate('/team');
          }
        } else {
          const backendMessage = response.error?.message;
          const userFriendlyMessage = getUserFriendlyErrorMessage(backendMessage, 'login');
          setError(userFriendlyMessage);
          setErrorType('error');
        }
      } catch (err) {
        const axiosError = err as {
          response?: {
            data?: {
              error?: { message?: string; details?: ErrorDetails['details'] };
            };
            status?: number;
          };
          message?: string;
        };

        if (import.meta.env.DEV) {
          logger.debug('Login error', undefined, {
            error: err,
            response: axiosError.response,
            data: axiosError.response?.data,
          });
        }

        let backendMessage = axiosError.response?.data?.error?.message;
        const errorDetails = axiosError.response?.data?.error;

        if (!backendMessage && err instanceof Error) {
          backendMessage = err.message;
        }

        if (backendMessage || errorDetails?.details) {
          const userFriendlyMessage = getUserFriendlyErrorMessage(
            backendMessage,
            'login',
            errorDetails
          );
          setError(userFriendlyMessage);
        } else {
          const errorMessage = handleError(err, 'Login failed. Please check your credentials.');
          setError(errorMessage);
        }
        setErrorType('error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      email,
      password,
      navigate,
      setUser,
      initializeSession,
      setCurrentTeam,
      setUserRoleInCurrentTeam,
      setUserTeamsWithRoles,
      handleError,
    ]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      setErrorType('error');

      try {
        const response = await apiService.register({
          email,
          password,
          firstName,
          lastName,
          termsAccepted: true as const,
        });

        if (response.success && response.data) {
          const { user, sessionInfo } = response.data;

          setUser(user);

          initializeSession({
            expiresAt: new Date(sessionInfo.expiresAt),
            idleTimeoutMs: sessionInfo.idleTimeoutMs,
            absoluteTimeoutMs: sessionInfo.absoluteTimeoutMs,
            warningThresholdMs: sessionInfo.warningThresholdMs,
          });

          setCurrentTeam(null);

          void navigate('/team');
        } else {
          const backendMessage = response.error?.message;
          const userFriendlyMessage = getUserFriendlyErrorMessage(backendMessage, 'register');
          setError(userFriendlyMessage);
          setErrorType('error');
        }
      } catch (err) {
        const axiosError = err as {
          response?: {
            data?: {
              error?: { message?: string; details?: ErrorDetails['details'] };
            };
            status?: number;
          };
          message?: string;
        };

        if (import.meta.env.DEV) {
          logger.debug('Register error', undefined, {
            error: err,
            response: axiosError.response,
            data: axiosError.response?.data,
          });
        }

        let backendMessage = axiosError.response?.data?.error?.message;
        const errorDetails = axiosError.response?.data?.error;

        if (!backendMessage && err instanceof Error) {
          backendMessage = err.message;
        }

        if (backendMessage || errorDetails?.details) {
          const userFriendlyMessage = getUserFriendlyErrorMessage(
            backendMessage,
            'register',
            errorDetails
          );
          setError(userFriendlyMessage);
        } else {
          const errorMessage = handleError(err, 'Registration failed. Please try again.');
          setError(errorMessage);
        }
        setErrorType('error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      email,
      password,
      firstName,
      lastName,
      navigate,
      setUser,
      initializeSession,
      setCurrentTeam,
      handleError,
    ]
  );

  const clearError = () => {
    setError(null);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setTermsAccepted(false);
    setShowPassword(false);
  };

  const isSubmitDisabled = isLoading || (isRegisterMode && !termsAccepted);

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        {/* Header */}
        <div className={styles['auth-header']}>
          <div className={styles['auth-logo']} aria-hidden="true">
            <ScrSphereIcon size={100} className={styles['auth-logo-icon']} />
          </div>
          <h1 className={styles['auth-title']}>
            {isRegisterMode ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className={styles['auth-subtitle']}>
            {isRegisterMode ? 'Start managing your Agile Scrum lifecycle' : 'Sign in to ScrSphere'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['error-message']}>
            <ErrorMessage
              message={error}
              title={isRegisterMode ? 'Registration Error' : 'Login Error'}
              type={errorType}
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Form */}
        <form
          className={styles['auth-form']}
          onSubmit={
            isRegisterMode
              ? (e) => {
                  void handleRegister(e);
                }
              : (e) => {
                  void handleLogin(e);
                }
          }
        >
          {/* Name Fields (Register only) */}
          {isRegisterMode && (
            <div className={styles['form-row']}>
              <div className={styles['form-group']}>
                <label className={styles['form-label']} htmlFor="firstName">
                  First name
                  <span className={styles['form-label-required']} aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={styles['input-field']}
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className={styles['form-group']}>
                <label className={styles['form-label']} htmlFor="lastName">
                  Last name
                  <span className={styles['form-label-required']} aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={styles['input-field']}
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="email">
              Email
              <span className={styles['form-label-required']} aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="email"
              type="email"
              className={styles['input-field']}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className={styles['form-group']}>
            <label className={styles['form-label']} htmlFor="password">
              Password
              <span className={styles['form-label-required']} aria-hidden="true">
                *
              </span>
            </label>
            <div className={styles['input-wrapper']}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`${styles['input-field']} ${styles['input-field-has-trailing']}`}
                placeholder={isRegisterMode ? 'Create a strong password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className={styles['password-toggle']}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>

            {/* Password Strength (Register only) */}
            {isRegisterMode && password && (
              <div className={styles['password-strength']} aria-live="polite">
                <div className={styles['strength-bars']}>
                  {[0, 1, 2, 3].map((index) => {
                    const strengthClass =
                      passwordStrength === 'weak'
                        ? index === 0
                          ? styles['strength-bar-weak']
                          : ''
                        : passwordStrength === 'fair'
                          ? index <= 1
                            ? styles['strength-bar-fair']
                            : ''
                          : passwordStrength === 'good'
                            ? index <= 2
                              ? styles['strength-bar-good']
                              : ''
                            : styles['strength-bar-strong'];

                    return (
                      <div key={index} className={`${styles['strength-bar']} ${strengthClass}`} />
                    );
                  })}
                </div>
                <span
                  className={`${styles['strength-label']} ${
                    passwordStrength === 'weak'
                      ? styles['strength-label-weak']
                      : passwordStrength === 'fair'
                        ? styles['strength-label-fair']
                        : passwordStrength === 'good'
                          ? styles['strength-label-good']
                          : styles['strength-label-strong']
                  }`}
                >
                  {STRENGTH_LABELS[passwordStrength ?? 'weak']}
                </span>
              </div>
            )}
          </div>

          {/* Forgot Password Link (Login only) */}
          {!isRegisterMode && (
            <div className={styles['forgot-password-link']}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          )}

          {/* Consent (Register only) */}
          {isRegisterMode && (
            <div className={styles['consent-group']}>
              <label className={styles['consent-label']}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                  className={styles['consent-checkbox']}
                />
                <span className={styles['consent-text']}>
                  I accept the Corporate IT Acceptable Use Policy and Data Protection Policy
                </span>
              </label>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className={styles['submit-button']} disabled={isSubmitDisabled}>
            {isLoading ? (
              <span className={styles['button-loading']}>
                <LoaderIcon size={16} className={styles['spinner-icon']} />
                {isRegisterMode ? 'Creating account...' : 'Signing in...'}
              </span>
            ) : isRegisterMode ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles['auth-footer']}>
          <button type="button" className={styles['mode-toggle']} onClick={toggleMode}>
            {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
