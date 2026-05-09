// Main Layout Component

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuthStore, useUIStore } from '../../store';
import { useTeamContext } from '../../contexts/TeamContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useResponsive } from '../../hooks/useResponsive';
import { useScrollbarDetection } from '../../hooks/useScrollbarDetection';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { NotificationBadge } from '../Notifications/NotificationBadge';
import { NotificationPanel } from '../Notifications/NotificationPanel';
import { DangerZone, DeleteAccountModal } from '../AccountDeletion';
import { EditProfileModal } from '../Profile/EditProfileModal';
import { ChangePasswordModal } from '../Profile/ChangePasswordModal';
import { UnsavedChangesModal } from '../common/Form/UnsavedChangesModal';
import { SkipLink } from '../common/Page/SkipLink';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon,
  BellIcon,
  EditIcon,
  LockIcon,
  LogOutIcon,
  ScrSphereIcon,
} from '../common/Icons';
import { NAV_ITEMS, SETTINGS_GROUPS, getFilteredSettingsGroups } from '../../config/navigation';
import { getRoleLabel, getRoleBadgeClass } from '../../utils/roleUtils';

import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentTeam, userRole, hasMultipleTeams, switchTeam, userTeams } = useTeamContext();
  const location = useLocation();

  // UI state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Refs
  const userMenuRef = useRef<HTMLDivElement>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarNavRef = useRef<HTMLElement>(null);

  // Custom hooks
  const isMobile = useResponsive(768);
  const hasScrollbar = useScrollbarDetection(sidebarNavRef, sidebarCollapsed);
  const accountDeletion = useAccountDeletion(userMenuOpen, () => setUserMenuOpen(false));

  // Modal state
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [editProfileFormDirty, setEditProfileFormDirtyState] = useState(false);
  const [changePasswordFormDirty, setChangePasswordFormDirtyState] = useState(false);

  // Use refs to track dirty state for callbacks to avoid stale closures
  const editProfileFormDirtyRef = useRef(editProfileFormDirty);
  const changePasswordFormDirtyRef = useRef(changePasswordFormDirty);

  // Custom setters that update both state and ref synchronously
  const setEditProfileFormDirty = useCallback(
    (value: boolean) => {
      editProfileFormDirtyRef.current = value;
      setEditProfileFormDirtyState(value);
    },
    [setEditProfileFormDirtyState]
  );

  const setChangePasswordFormDirty = useCallback(
    (value: boolean) => {
      changePasswordFormDirtyRef.current = value;
      setChangePasswordFormDirtyState(value);
    },
    [setChangePasswordFormDirtyState]
  );

  const unsavedChanges = useUnsavedChanges();

  // Click outside handlers
  useClickOutside(userMenuRef, () => setUserMenuOpen(false), userMenuOpen);
  useClickOutside(teamDropdownRef, () => setTeamDropdownOpen(false), teamDropdownOpen);

  // Click outside sidebar on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(`.${styles['menu-toggle']}`)
      ) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  }, [isMobile, toggleMobileSidebar, toggleSidebar]);

  const handleNavItemClick = useCallback(() => {
    if (isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, isMobileSidebarOpen]);

  const handleTeamSwitch = useCallback(
    async (teamId: string) => {
      await switchTeam(teamId);
      setTeamDropdownOpen(false);
    },
    [switchTeam]
  );

  // Modal close handlers with unsaved changes check
  // Use refs to avoid stale closure issues when dirty state changes
  const handleEditProfileClose = useCallback(() => {
    unsavedChanges.checkBeforeClose('editProfile', editProfileFormDirtyRef.current, () =>
      setEditProfileModalOpen(false)
    );
  }, [unsavedChanges]);

  const handleChangePasswordClose = useCallback(() => {
    unsavedChanges.checkBeforeClose('changePassword', changePasswordFormDirtyRef.current, () =>
      setChangePasswordModalOpen(false)
    );
  }, [unsavedChanges]);

  // Unsaved changes confirm: close the pending modal and reset dirty state
  // We capture pendingModalClose before the hook clears it
  const handleUnsavedChangesConfirmWrapper = useCallback(() => {
    const pending = unsavedChanges.pendingModalClose;
    unsavedChanges.handleUnsavedChangesConfirm();
    if (pending === 'editProfile') {
      setEditProfileFormDirty(false);
    } else if (pending === 'changePassword') {
      setChangePasswordFormDirty(false);
    }
  }, [unsavedChanges, setEditProfileFormDirty, setChangePasswordFormDirty]);

  // Filtered settings groups based on user role
  const filteredSettingsGroups = getFilteredSettingsGroups(SETTINGS_GROUPS, userRole);

  return (
    <div
      className={`${styles.layout} ${sidebarCollapsed ? styles['sidebar-collapsed'] : ''} ${isMobileSidebarOpen ? styles['sidebar-open'] : ''} ${hasScrollbar ? styles['sidebar-has-scrollbar'] : ''}`}
    >
      {/* Sidebar */}
      <aside className={styles.sidebar} ref={sidebarRef}>
        <div className={styles['sidebar-header']}>
          <h1 className={styles.logo}>
            <ScrSphereIcon size={40} />
            <span className={styles['logo-text']}>ScrSphere</span>
          </h1>
          <button
            className={styles['sidebar-toggle']}
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
          </button>
        </div>

        <nav className={styles['sidebar-nav']} ref={sidebarNavRef}>
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles['nav-item']} ${location.pathname === item.path ? styles.active : ''}`}
                onClick={handleNavItemClick}
                prefetch="intent"
              >
                <span className={styles['nav-icon']}>
                  <IconComponent size={20} />
                </span>
                {!sidebarCollapsed && <span className={styles['nav-label']}>{item.label}</span>}
              </Link>
            );
          })}

          {!sidebarCollapsed && filteredSettingsGroups.length > 0 && (
            <div className={styles['nav-divider']}>Settings</div>
          )}
          {filteredSettingsGroups.map((group) => (
            <div key={group.id} role="group" aria-label={`${group.label} settings`}>
              {!sidebarCollapsed && (
                <div className={styles['nav-group-label']} aria-hidden="true">
                  {group.label}
                </div>
              )}
              {sidebarCollapsed && <div className={styles['nav-group-divider']} />}
              {group.items.map((item) => {
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles['nav-item']} ${location.pathname === item.path ? styles.active : ''}`}
                    onClick={handleNavItemClick}
                    prefetch="intent"
                  >
                    <span className={styles['nav-icon']}>
                      <IconComponent size={20} />
                    </span>
                    {!sidebarCollapsed && <span className={styles['nav-label']}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer with app version */}
        <div className={styles['sidebar-footer']}>
          <span className={styles['version-badge']}>v{__APP_VERSION__}</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles['main-wrapper']}>
        {/* Skip Link for Accessibility */}
        <SkipLink targetId="main-content" />

        {/* Top Bar */}
        <header className={styles.topbar}>
          <div className={styles['topbar-left']}>
            <button
              className={styles['menu-toggle']}
              onClick={handleSidebarToggle}
              aria-label={isMobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileSidebarOpen}
              type="button"
            >
              {isMobileSidebarOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
            <div className={styles.breadcrumb}>
              {currentTeam ? (
                <div className={styles['team-info-breadcrumb']}>
                  <span className={styles['team-icon']}>馃懃</span>
                  <div className={styles['team-details-breadcrumb']}>
                    <span className={styles['team-name-breadcrumb']}>{currentTeam.name}</span>
                    <span
                      className={`${styles['role-badge']} ${getRoleBadgeClass(userRole, styles)}`}
                    >
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                  {hasMultipleTeams && (
                    <div className={styles['team-dropdown']} ref={teamDropdownRef}>
                      <button
                        className={styles['team-dropdown-trigger']}
                        onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                      >
                        <span className={styles['dropdown-arrow']}>
                          <ChevronDownIcon size={14} />
                        </span>
                      </button>
                      {teamDropdownOpen && (
                        <div className={styles['team-dropdown-menu']}>
                          {userTeams.map((team) => (
                            <button
                              key={team.id}
                              className={`${styles['team-dropdown-item']} ${team.id === currentTeam.id ? styles.active : ''}`}
                              onClick={() => {
                                void handleTeamSwitch(team.id);
                              }}
                            >
                              <div className={styles['dropdown-team-info']}>
                                <span className={styles['dropdown-team-name']}>{team.name}</span>
                                <span
                                  className={`${styles['dropdown-role-badge']} ${getRoleBadgeClass(team.userRole, styles)}`}
                                >
                                  {getRoleLabel(team.userRole)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <span className={styles['no-team-message']}>No team selected</span>
              )}
            </div>
          </div>
          <div className={styles['topbar-right']}>
            <div className={styles['notification-container']}>
              <button
                className={styles['notification-button']}
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                aria-label="Notifications"
              >
                <BellIcon size={20} />
                <NotificationBadge />
              </button>
              <NotificationPanel
                isOpen={notificationPanelOpen}
                onClose={() => setNotificationPanelOpen(false)}
              />
            </div>
            <div className={styles['user-menu']} ref={userMenuRef}>
              <button
                className={styles['user-menu-button']}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className={styles['user-avatar-small']}>
                  {user?.firstName.charAt(0)}
                  {user?.lastName.charAt(0)}
                </div>
                <span className={styles['user-menu-name']}>
                  {user?.firstName} {user?.lastName}
                </span>
                <span className={styles['user-menu-arrow']}>
                  <ChevronDownIcon size={14} />
                </span>
              </button>
              {userMenuOpen && (
                <div className={styles['user-dropdown']}>
                  <div className={styles['user-dropdown-header']}>
                    <div className={styles['user-avatar-large']}>
                      {user?.firstName.charAt(0)}
                      {user?.lastName.charAt(0)}
                    </div>
                    <div className={styles['user-dropdown-info']}>
                      <div className={styles['user-dropdown-name']}>
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className={styles['user-dropdown-email']}>{user?.email}</div>
                    </div>
                  </div>
                  <div className={styles['user-dropdown-divider']} />
                  <button
                    className={styles['user-dropdown-item']}
                    onClick={() => {
                      setEditProfileModalOpen(true);
                      setUserMenuOpen(false);
                    }}
                  >
                    <EditIcon size={16} />
                    Edit Profile
                  </button>
                  <button
                    className={styles['user-dropdown-item']}
                    onClick={() => {
                      setChangePasswordModalOpen(true);
                      setUserMenuOpen(false);
                    }}
                  >
                    <LockIcon size={16} />
                    Change Password
                  </button>
                  <div className={styles['user-dropdown-divider']} />
                  <button className={styles['user-dropdown-item']} onClick={logout}>
                    <LogOutIcon size={16} />
                    Logout
                  </button>
                  {/* Danger Zone for account deletion - separated from frequently used Logout */}
                  {accountDeletion.deletionEligibility && (
                    <>
                      <div className={styles['user-dropdown-divider']} />
                      <DangerZone onDeleteClick={accountDeletion.handleDeleteClick} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className={styles['main-content']}>
          {children}
        </main>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={accountDeletion.deleteModalOpen}
        onClose={() => accountDeletion.setDeleteModalOpen(false)}
        userEmail={user?.email ?? ''}
        userName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
        teams={accountDeletion.deletionEligibility?.teams ?? []}
        isBlocked={!accountDeletion.deletionEligibility?.canDelete}
        pendingDeletion={accountDeletion.deletionEligibility?.pendingDeletion ?? null}
        onDelete={accountDeletion.handleDeleteAccount}
        onScheduleDeletion={accountDeletion.handleScheduleDeletion}
        onCancelDeletion={accountDeletion.handleCancelDeletion}
        onForceDelete={accountDeletion.handleForceDelete}
        isDeleting={
          accountDeletion.isDeleting ||
          accountDeletion.isScheduling ||
          accountDeletion.isCancelling ||
          accountDeletion.isForceDeleting
        }
        error={accountDeletion.deleteError}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={handleEditProfileClose}
        onDirtyChange={setEditProfileFormDirty}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={handleChangePasswordClose}
        onDirtyChange={setChangePasswordFormDirty}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={unsavedChanges.unsavedChangesModalOpen}
        onConfirm={handleUnsavedChangesConfirmWrapper}
        onCancel={unsavedChanges.handleUnsavedChangesCancel}
        title="Unsaved Changes"
        message={unsavedChanges.getUnsavedChangesMessage()}
      />
    </div>
  );
};
