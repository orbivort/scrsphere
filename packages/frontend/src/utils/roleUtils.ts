/**
 * Returns a human-readable label for a user role.
 */
export function getRoleLabel(role: string | null): string {
  if (!role) return 'No Role';
  switch (role) {
    case 'PRODUCT_OWNER':
      return 'Product Owner';
    case 'SCRUM_MASTER':
      return 'Scrum Master';
    case 'DEVELOPER':
      return 'Developer';
    default:
      return role;
  }
}

/**
 * Returns the CSS module class name for a role badge.
 * Accepts a styles object from a CSS module import.
 */
export function getRoleBadgeClass(role: string | null, styles: Record<string, string>): string {
  if (!role) return styles['badge-default'] ?? '';
  switch (role) {
    case 'PRODUCT_OWNER':
      return styles['badge-po'] ?? '';
    case 'SCRUM_MASTER':
      return styles['badge-sm'] ?? '';
    case 'DEVELOPER':
      return styles['badge-dev'] ?? '';
    default:
      return styles['badge-default'] ?? '';
  }
}

/**
 * Returns a color string for role badges (used outside CSS module context).
 */
export function getRoleBadgeColor(role: string | null): string {
  if (!role) return '#6b7280';
  switch (role) {
    case 'PRODUCT_OWNER':
      return '#f59e0b';
    case 'SCRUM_MASTER':
      return '#3b82f6';
    case 'DEVELOPER':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

const ROLES_THAT_CAN_START_SPRINT = [
  'product_owner',
  'scrum_master',
  'PRODUCT_OWNER',
  'SCRUM_MASTER',
];

export function canStartSprint(role: string | null): boolean {
  if (!role) return false;
  return ROLES_THAT_CAN_START_SPRINT.includes(role);
}
