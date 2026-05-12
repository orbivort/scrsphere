import type React from 'react';

export interface NavItem {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

export interface SettingsItem {
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  roles?: string[];
}

export interface SettingsGroup {
  id: string;
  label: string;
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
  { path: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
  { path: '/product-goals', icon: TargetIcon, label: 'Product Goals' },
  { path: '/backlog', icon: ListIcon, label: 'Product Backlog' },
  { path: '/sprint-planning', icon: CalendarIcon, label: 'Sprint Planning' },
  { path: '/sprint', icon: ZapIcon, label: 'Active Sprint' },
  { path: '/daily-scrum', icon: SunIcon, label: 'Daily Scrum' },
  { path: '/impediments', icon: AlertTriangleIcon, label: 'Impediments' },
  { path: '/increments', icon: PackageIcon, label: 'Increments' },
  { path: '/sprint-review', icon: FileTextIcon, label: 'Sprint Review' },
  { path: '/retrospectives', icon: SearchIcon, label: 'Retrospective' },
  { path: '/reports', icon: TrendingUpIcon, label: 'Reports' },
  { path: '/team', icon: UsersIcon, label: 'Team' },
];

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'team',
    label: 'Team',
    items: [
      {
        path: '/settings/sprint-configuration',
        icon: SettingsIcon,
        label: 'Sprint Configuration',
        roles: ['PRODUCT_OWNER', 'SCRUM_MASTER'],
      },
      {
        path: '/settings/team-definitions',
        icon: FileTextIcon,
        label: 'Team Definitions',
        roles: ['PRODUCT_OWNER', 'SCRUM_MASTER'],
      },
      {
        path: '/settings/team-management',
        icon: BuildingIcon,
        label: 'Team Management',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [
      {
        path: '/settings/privacy-data',
        icon: DownloadIcon,
        label: 'Privacy & Data',
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
