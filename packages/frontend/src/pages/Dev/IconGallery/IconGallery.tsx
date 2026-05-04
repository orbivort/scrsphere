import React, { useState, useCallback, useMemo } from 'react';

import styles from './IconGallery.module.css';

import type { IconProps } from '@/components/common/Icons';
import * as Icons from '@/components/common/Icons';

// Icon categories for organization
const iconCategories: Record<string, string[]> = {
  Navigation: [
    'DashboardIcon',
    'HomeIcon',
    'TargetIcon',
    'ListIcon',
    'CalendarIcon',
    'ZapIcon',
    'SunIcon',
    'AlertTriangleIcon',
    'PackageIcon',
    'FileTextIcon',
    'SearchIcon',
    'TrendingUpIcon',
    'UsersIcon',
    'BuildingIcon',
    'SettingsIcon',
    'TermsIcon',
    'PrivacyIcon',
    'DownloadIcon',
    'CookieIcon',
    'FlagIcon',
    'FolderIcon',
  ],
  Actions: [
    'PlusIcon',
    'EditIcon',
    'TrashIcon',
    'CheckIcon',
    'XIcon',
    'CloseIcon',
    'RefreshIcon',
    'EyeIcon',
    'EyeOffIcon',
    'ChevronRightIcon',
    'ChevronLeftIcon',
    'ChevronDownIcon',
    'ArrowUpIcon',
    'ArrowDownIcon',
    'ArrowRightIcon',
    'UploadIcon',
    'FilterIcon',
    'SortIcon',
    'MoreHorizontalIcon',
    'SendIcon',
  ],
  Status: [
    'CheckCircleIcon',
    'XCircleIcon',
    'InfoIcon',
    'WarningIcon',
    'ClockIcon',
    'CheckmarkIcon',
    'CircleIcon',
    'SquareIcon',
    'LoaderIcon',
  ],
  Communication: ['BellIcon', 'MessageSquareIcon', 'TagIcon', 'HelpCircleIcon', 'SearchXIcon'],
  User: ['UsersIcon', 'TeamIcon', 'LogOutIcon', 'LockIcon', 'MenuIcon'],
  Miscellaneous: [
    'ChartIcon',
    'GoalIcon',
    'ImpedimentIcon',
    'RunnerIcon',
    'RunningIcon',
    'ScrSphereIcon',
  ],
};

// Get category for an icon
function getIconCategory(iconName: string): string {
  for (const [category, icons] of Object.entries(iconCategories)) {
    if (icons.includes(iconName)) {
      return category;
    }
  }
  return 'Miscellaneous';
}

// Copy text to clipboard
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

interface IconCardProps {
  name: string;
  icon: React.ComponentType<IconProps>;
}

const IconCard: React.FC<IconCardProps> = ({ name, icon: IconComponent }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const importStatement = `import { ${name} } from '@/components/common/Icons';`;
    const success = await copyToClipboard(importStatement);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [name]);

  return (
    <button
      className={`${styles['icon-card']} ${copied ? styles.copied : ''}`}
      onClick={handleClick}
      title={`Click to copy import for ${name}`}
      type="button"
    >
      <span className={styles['copy-indicator']}>Copied!</span>
      <span className={styles['icon-preview']}>
        <IconComponent size={24} />
      </span>
      <span className={styles['icon-name']}>{name}</span>
    </button>
  );
};

interface IconData {
  name: string;
  icon: React.ComponentType<IconProps>;
  category: string;
}

export const IconGallery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all icons from the Icons module
  const allIcons = useMemo(() => {
    const icons: IconData[] = [];

    for (const [name, icon] of Object.entries(Icons)) {
      if (name.endsWith('Icon') && typeof icon === 'function') {
        icons.push({
          name,
          icon: icon as React.ComponentType<IconProps>,
          category: getIconCategory(name),
        });
      }
    }

    return icons.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) {
      return allIcons;
    }

    const query = searchQuery.toLowerCase();
    return allIcons.filter(
      ({ name, category }) =>
        name.toLowerCase().includes(query) || category.toLowerCase().includes(query)
    );
  }, [allIcons, searchQuery]);

  // Group filtered icons by category
  const groupedIcons = useMemo(() => {
    const groups: Record<string, IconData[]> = {};

    for (const icon of filteredIcons) {
      if (!groups[icon.category]) {
        groups[icon.category] = [];
      }
      groups[icon.category]!.push(icon);
    }

    // Sort categories
    const order = ['Navigation', 'Actions', 'Status', 'Communication', 'User', 'Miscellaneous'];
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const result: Record<string, IconData[]> = {};
    for (const category of sortedCategories) {
      const group = groups[category];
      if (group) {
        result[category] = group;
      }
    }

    return result;
  }, [filteredIcons]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Icon Gallery</h1>
        <p className={styles.subtitle}>
          Browse and copy import statements for all available icons. Click any icon to copy its
          import statement.
        </p>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={styles['stat-value']}>{allIcons.length}</span> total icons
          </span>
          <span className={styles.stat}>
            <span className={styles['stat-value']}>{Object.keys(groupedIcons).length}</span>{' '}
            categories
          </span>
          {searchQuery && (
            <span className={styles.stat}>
              <span className={styles['stat-value']}>{filteredIcons.length}</span> matching
            </span>
          )}
        </div>
      </header>

      <div className={styles['search-container']}>
        <input
          type="search"
          className={styles['search-input']}
          placeholder="Search icons by name or category..."
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search icons"
        />
      </div>

      {filteredIcons.length === 0 ? (
        <div className={styles['no-results']}>
          <p className={styles['no-results-title']}>No icons found</p>
          <p className={styles['no-results-text']}>Try adjusting your search query</p>
        </div>
      ) : (
        Object.entries(groupedIcons).map(([category, icons]) => (
          <section key={category} className={styles.category}>
            <h2 className={styles['category-title']}>
              {category} ({icons.length})
            </h2>
            <div className={styles['icon-grid']}>
              {icons.map(({ name, icon }) => (
                <IconCard key={name} name={name} icon={icon} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default IconGallery;
