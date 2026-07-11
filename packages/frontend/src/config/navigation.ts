import type React from 'react';

export interface NavItem {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelKey: string;
}

export interface SettingsItem {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelKey: string;
  roles?: string[];
}

export interface SettingsGroup {
  id: string;
  labelKey: string;
  items: SettingsItem[];
}

import {
  DashboardIcon,
  TargetIcon,
  ListIcon,
  CalendarIcon,
  ZapIcon,
  SunIcon,
  AlertTriangleIcon,
  PackageIcon,
  FileTextIcon,
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
  BuildingIcon,
  SettingsIcon,
  DownloadIcon,
} from '../components/common/Icons';

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', icon: DashboardIcon, labelKey: 'nav.dashboard' },
  { path: '/product-goals', icon: TargetIcon, labelKey: 'nav.productGoals' },
  { path: '/backlog', icon: ListIcon, labelKey: 'nav.productBacklog' },
  { path: '/sprint-planning', icon: CalendarIcon, labelKey: 'nav.sprintPlanning' },
  { path: '/sprint', icon: ZapIcon, labelKey: 'nav.activeSprint' },
  { path: '/daily-scrum', icon: SunIcon, labelKey: 'nav.dailyScrum' },
  { path: '/impediments', icon: AlertTriangleIcon, labelKey: 'nav.impediments' },
  { path: '/increments', icon: PackageIcon, labelKey: 'nav.increments' },
  { path: '/sprint-review', icon: FileTextIcon, labelKey: 'nav.sprintReview' },
  { path: '/retrospectives', icon: SearchIcon, labelKey: 'nav.retrospective' },
  { path: '/reports', icon: TrendingUpIcon, labelKey: 'nav.reports' },
  { path: '/team', icon: UsersIcon, labelKey: 'nav.team' },
];

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'team',
    labelKey: 'nav.settings.team',
    items: [
      {
        path: '/settings/sprint-configuration',
        icon: SettingsIcon,
        labelKey: 'nav.settings.sprintConfiguration',
        roles: ['PRODUCT_OWNER', 'SCRUM_MASTER'],
      },
      {
        path: '/settings/team-definitions',
        icon: FileTextIcon,
        labelKey: 'nav.settings.teamDefinitions',
        roles: ['PRODUCT_OWNER', 'SCRUM_MASTER'],
      },
      {
        path: '/settings/team-management',
        icon: BuildingIcon,
        labelKey: 'nav.settings.teamManagement',
      },
    ],
  },
  {
    id: 'data',
    labelKey: 'nav.settings.data',
    items: [
      {
        path: '/settings/privacy-data',
        icon: DownloadIcon,
        labelKey: 'nav.settings.privacyData',
      },
    ],
  },
];

export function getFilteredSettingsGroups(
  groups: SettingsGroup[],
  userRole: string | null
): SettingsGroup[] {
  const normalizedUserRole = userRole?.toUpperCase() ?? null;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.roles ||
          (normalizedUserRole &&
            item.roles.some((role) => role.toUpperCase() === normalizedUserRole))
      ),
    }))
    .filter((group) => group.items.length > 0);
}
