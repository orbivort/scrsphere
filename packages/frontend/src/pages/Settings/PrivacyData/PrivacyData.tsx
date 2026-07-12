import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');

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
        setSessionsError(t('privacyData.activeSessions.errors.loadFailed'));
      }
    } catch (error) {
      logger.error('Failed to fetch sessions', undefined, { error });
      setSessionsError(t('privacyData.activeSessions.errors.loadFailed'));
    } finally {
      setSessionsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await apiService.revokeSession(sessionId);
      if (response.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        setSessionsError(t('privacyData.activeSessions.errors.revokeFailed'));
      }
    } catch (error) {
      logger.error('Failed to revoke session', undefined, { error });
      setSessionsError(t('privacyData.activeSessions.errors.revokeFailed'));
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
        setSessionsError(t('privacyData.activeSessions.errors.signOutFailed'));
      }
    } catch (error) {
      logger.error('Failed to revoke all sessions', undefined, { error });
      setSessionsError(t('privacyData.activeSessions.errors.signOutFailed'));
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
    if (!userAgent) return t('privacyData.activeSessions.devices.unknown');

    if (userAgent.includes('Chrome')) return t('privacyData.activeSessions.devices.chrome');
    if (userAgent.includes('Firefox')) return t('privacyData.activeSessions.devices.firefox');
    if (userAgent.includes('Safari')) return t('privacyData.activeSessions.devices.safari');
    if (userAgent.includes('Edge')) return t('privacyData.activeSessions.devices.edge');
    return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
  };

  const currentSessionId = sessions.length > 0 ? (sessions[0] as { id: string }).id : null;
  const otherSessions = sessions.slice(1);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('privacyData.title')}</h1>
        <p className={styles.subtitle}>{t('privacyData.subtitle')}</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles['section-header']}>
            <div className={styles['icon-wrapper']}>
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className={styles['section-title']}>{t('privacyData.activeSessions.title')}</h2>
              <p className={styles['section-description']}>
                {t('privacyData.activeSessions.description')}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            {sessionsLoading ? (
              <p className={styles['loading-text']}>{t('privacyData.activeSessions.loading')}</p>
            ) : sessionsError ? (
              <p className={styles['error-text']}>{sessionsError}</p>
            ) : sessions.length === 0 ? (
              <p className={styles['empty-text']}>{t('privacyData.activeSessions.empty')}</p>
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
                            <span className={styles['current-badge']}>
                              {t('privacyData.activeSessions.current')}
                            </span>
                          )}
                        </div>
                        <div className={styles['session-details']}>
                          {session.ipAddress && (
                            <span className={styles['session-ip']}>
                              {t('privacyData.activeSessions.ip')} {session.ipAddress}
                            </span>
                          )}
                          <span className={styles['session-time']}>
                            {t('privacyData.activeSessions.lastActive')}{' '}
                            {formatDate(session.lastActivityAt)}
                          </span>
                        </div>
                      </div>
                      {session.id !== currentSessionId && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingSessionId === session.id}
                          className={styles['revoke-button']}
                          aria-label={t('privacyData.activeSessions.revokeSession')}
                        >
                          {revokingSessionId === session.id
                            ? t('privacyData.activeSessions.revoking')
                            : t('privacyData.activeSessions.revoke')}
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
                      {revokingAll
                        ? t('privacyData.activeSessions.signingOut')
                        : t('privacyData.activeSessions.signOutAll')}
                    </button>
                    <p className={styles['sessions-note']}>
                      {t('privacyData.activeSessions.note')}
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
              <h2 className={styles['section-title']}>{t('privacyData.dataExport.title')}</h2>
              <p className={styles['section-description']}>
                {t('privacyData.dataExport.description')}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['info-box']}>
              <h3 className={styles['info-title']}>
                {t('privacyData.dataExport.rightToPortability')}
              </h3>
              <p className={styles['info-text']}>
                {t('privacyData.dataExport.portabilityDescription')}
              </p>
            </div>

            <div className={styles['data-categories']}>
              <h4 className={styles['categories-title']}>
                {t('privacyData.dataExport.dataIncluded')}
              </h4>
              <ul className={styles['categories-list']}>
                <li className={styles['category-item']}>
                  <span className={styles['check-icon']}>✓</span>
                  <div>
                    <strong>{t('privacyData.dataExport.profileInformation')}</strong>
                    <span className={styles['category-desc']}>
                      {t('privacyData.dataExport.profileDescription')}
                    </span>
                  </div>
                </li>
                <li className={styles['category-item']}>
                  <span className={styles['check-icon']}>✓</span>
                  <div>
                    <strong>{t('privacyData.dataExport.teamMemberships')}</strong>
                    <span className={styles['category-desc']}>
                      {t('privacyData.dataExport.teamDescription')}
                    </span>
                  </div>
                </li>
                <li className={styles['category-item']}>
                  <span className={styles['check-icon']}>✓</span>
                  <div>
                    <strong>{t('privacyData.dataExport.sessionInformation')}</strong>
                    <span className={styles['category-desc']}>
                      {t('privacyData.dataExport.sessionDescription')}
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className={styles['export-section']}>
              <div className={styles['export-info']}>
                <p className={styles['export-format']}>
                  <strong>{t('privacyData.dataExport.formatLabel')}</strong>{' '}
                  {t('privacyData.dataExport.formatValue')}
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
              <h2 className={styles['section-title']}>{t('privacyData.dataRights.title')}</h2>
              <p className={styles['section-description']}>
                {t('privacyData.dataRights.subtitle')}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles['rights-grid']}>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>
                  {t('privacyData.dataRights.rightToAccess')}
                </h4>
                <p className={styles['right-description']}>
                  {t('privacyData.dataRights.rightToAccessDescription')}
                </p>
              </div>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>
                  {t('privacyData.dataRights.rightToRectification')}
                </h4>
                <p className={styles['right-description']}>
                  {t('privacyData.dataRights.rightToRectificationDescription')}
                </p>
              </div>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>
                  {t('privacyData.dataRights.rightToErasure')}
                </h4>
                <p className={styles['right-description']}>
                  {t('privacyData.dataRights.rightToErasureDescription')}
                </p>
              </div>
              <div className={styles['right-item']}>
                <h4 className={styles['right-title']}>
                  {t('privacyData.dataRights.rightToPortability')}
                </h4>
                <p className={styles['right-description']}>
                  {t('privacyData.dataRights.rightToPortabilityDescription')}
                </p>
              </div>
            </div>

            <div className={styles['contact-section']}>
              <h4 className={styles['contact-title']}>{t('privacyData.contactSection.title')}</h4>
              <p className={styles['contact-text']}>{t('privacyData.contactSection.message')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyData;
