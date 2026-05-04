import React, { useState, useEffect, useCallback } from 'react';

import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';

import { DataExportButton } from './components';
import styles from './PrivacyData.module.css';

import { DownloadIcon, ShieldIcon, SettingsIcon, LogOutIcon } from '@/components/common/Icons';

interface SessionInfo {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export const PrivacyData: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const response = await apiService.getActiveSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        setSessionsError('Failed to load sessions');
      }
    } catch (error) {
      logger.error('Failed to fetch sessions', undefined, { error });
      setSessionsError('Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await apiService.revokeSession(sessionId);
      if (response.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        setSessionsError('Failed to revoke session');
      }
    } catch (error) {
      logger.error('Failed to revoke session', undefined, { error });
      setSessionsError('Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (sessions.length <= 1) return;

    setRevokingAll(true);
    try {
      const response = await apiService.logoutAllSessions();
      if (response.success) {
        await fetchSessions();
      } else {
        setSessionsError('Failed to sign out other sessions');
      }
    } catch (error) {
      logger.error('Failed to revoke all sessions', undefined, { error });
      setSessionsError('Failed to sign out other sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown device';

    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
  };

  const currentSessionId = sessions.length > 0 ? sessions[0]!.id : null;
  const otherSessions = sessions.slice(1);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Privacy & Data</h1>
        <p className={styles.subtitle}>Manage your personal data and privacy settings</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles['section-header']}>
            <div className={styles['icon-wrapper']}>
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className={styles['section-title']}>Active Sessions</h2>
              <p className={styles['section-description']}>Manage your active login sessions</p>
            </div>
          </div>

          <div className={styles.card}>
            {sessionsLoading ? (
              <p className={styles['loading-text']}>Loading sessions...</p>
            ) : sessionsError ? (
              <p className={styles['error-text']}>{sessionsError}</p>
            ) : sessions.length === 0 ? (
              <p className={styles['empty-text']}>No active sessions found</p>
            ) : (
              <>
                <div className={styles['sessions-list']}>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`${styles['session-item']} ${session.id === currentSessionId ? styles['current-session'] : ''}`}
                    >
                      <div className={styles['session-info']}>
                        <div className={styles['session-header']}>
                          <span className={styles['session-device']}>
                            {parseUserAgent(session.userAgent)}
                          </span>
                          {session.id === currentSessionId && (
                            <span className={styles['current-badge']}>Current</span>
                          )}
                        </div>
                        <div className={styles['session-details']}>
                          {session.ipAddress && (
                            <span className={styles['session-ip']}>IP: {session.ipAddress}</span>
                          )}
                          <span className={styles['session-time']}>
                            Last active: {formatDate(session.lastActivityAt)}
                          </span>
                        </div>
                      </div>
                      {session.id !== currentSessionId && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSessionId === session.id}
                          className={styles['revoke-button']}
                          aria-label="Revoke this session"
                        >
                          {revokingSessionId === session.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {otherSessions.length > 0 && (
                  <div className={styles['sessions-footer']}>
                    <button
                      type="button"
                      onClick={handleRevokeAllOtherSessions}
                      disabled={revokingAll}
                      className={styles['revoke-all-button']}
                    >
                      <LogOutIcon size={16} />
                      {revokingAll ? 'Signing out...' : 'Sign out all other sessions'}
                    </button>
                    <p className={styles['sessions-note']}>
                      This will sign you out of all other devices except this one.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles['section-header']}>
            <div className={styles['icon-wrapper']}>
              <DownloadIcon size={24} />
            </div>
            <div>
              <h2 className={styles['section-title']}>Export Your Data</h2>
              <p className={styles['section-description']}>Download a copy of your personal data</p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['info-box']}>
              <h3 className={styles['info-title']}>Right to Data Portability</h3>
              <p className={styles['info-text']}>
                You have the right to receive your personal data in a structured, commonly used, and
                machine-readable format.
              </p>
            </div>

            <div className={styles['data-categories']}>
              <h4 className={styles['categories-title']}>Data included in the export:</h4>
              <ul className={styles['categories-list']}>
                <li className={styles['category-item']}>
                  <span className={styles['check-icon']}>✓</span>
                  <div>
                    <strong>Profile Information</strong>
                    <span className={styles['category-desc']}>
                      Name, email, avatar, preferences
                    </span>
                  </div>
                </li>
                <li className={styles['category-item']}>
                  <span className={styles['check-icon']}>✓</span>
                  <div>
                    <strong>Team Memberships</strong>
                    <span className={styles['category-desc']}>
                      Teams you belong to and your roles
                    </span>
                  </div>
                </li>
                <li className={styles['category-item']}>
                  <span className={styles['check-icon']}>✓</span>
                  <div>
                    <strong>Session Information</strong>
                    <span className={styles['category-desc']}>
                      Active sessions and login history
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className={styles['export-section']}>
              <div className={styles['export-info']}>
                <p className={styles['export-format']}>
                  <strong>Format:</strong> JSON (machine-readable)
                </p>
              </div>

              <div className={styles['export-action']}>
                <DataExportButton
                  onExportStart={() => logger.debug('Export started')}
                  onExportComplete={() => logger.debug('Export completed')}
                  onExportError={(error) => logger.error('Export failed', undefined, { error })}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles['section-header']}>
            <div className={styles['icon-wrapper']}>
              <ShieldIcon size={24} />
            </div>
            <div>
              <h2 className={styles['section-title']}>Your Data Rights</h2>
              <p className={styles['section-description']}>Your rights regarding personal data</p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['rights-grid']}>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>Right to Access</h4>
                <p className={styles['right-description']}>
                  You can request a copy of all personal data we hold about you.
                </p>
              </div>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>Right to Rectification</h4>
                <p className={styles['right-description']}>
                  You can correct inaccurate or incomplete personal data.
                </p>
              </div>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>Right to Erasure</h4>
                <p className={styles['right-description']}>
                  You can request deletion of your personal data when no longer needed.
                </p>
              </div>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>Right to Portability</h4>
                <p className={styles['right-description']}>
                  You can receive your data in a structured, machine-readable format.
                </p>
              </div>
            </div>

            <div className={styles['contact-section']}>
              <h4 className={styles['contact-title']}>Questions about your data?</h4>
              <p className={styles['contact-text']}>
                Contact your HR Data Protection Team or the Corporate Data Protection Officer.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyData;
