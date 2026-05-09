import React from 'react';

import type { TeamMember, User, ProductBacklogItem } from '../../../types';
import type { ViewMode, SwimlaneGroup } from '../SprintBoard.types';
import styles from '../SprintBoard.module.css';

import { XIcon, SearchIcon } from '@/components/common/Icons';

export interface BoardFiltersProps {
  filterAssignee: string;
  filterPbi: string;
  searchQuery: string;
  viewMode: ViewMode;
  swimlaneGroup: SwimlaneGroup;
  teamMembers: (TeamMember & { user?: User })[];
  sprintItems: ProductBacklogItem[];
  onFilterAssigneeChange: (value: string) => void;
  onFilterPbiChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSwimlaneGroupChange: (group: SwimlaneGroup) => void;
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({
  filterAssignee,
  filterPbi,
  searchQuery,
  viewMode,
  swimlaneGroup,
  teamMembers,
  sprintItems,
  onFilterAssigneeChange,
  onFilterPbiChange,
  onSearchQueryChange,
  onViewModeChange,
  onSwimlaneGroupChange,
}) => {
  return (
    <div className={styles['board-controls']} role="toolbar" aria-label="Board controls">
      <div className={styles['filter-group']}>
        <label htmlFor="filter-assignee" className={styles['visually-hidden']}>
          Filter by assignee
        </label>
        <select
          id="filter-assignee"
          className={styles['filter-select']}
          value={filterAssignee}
          onChange={(e) => onFilterAssigneeChange(e.target.value)}
        >
          <option value="all">All Assignees</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.userId}>
              {member.user?.firstName} {member.user?.lastName}
            </option>
          ))}
        </select>

        <label htmlFor="filter-pbi" className={styles['visually-hidden']}>
          Filter by backlog item
        </label>
        <select
          id="filter-pbi"
          className={styles['filter-select']}
          value={filterPbi}
          onChange={(e) => onFilterPbiChange(e.target.value)}
        >
          <option value="all">All Items</option>
          {sprintItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} ({item.storyPoints ?? 0} pts)
            </option>
          ))}
        </select>

        <label htmlFor="search-tasks" className={styles['visually-hidden']}>
          Search tasks
        </label>
        <div className={styles['search-input-wrapper']}>
          <span className={styles['search-icon']}>
            <SearchIcon size={16} />
          </span>
          <input
            id="search-tasks"
            type="text"
            className={styles['filter-search']}
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles['search-clear-button']}
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear search"
              title="Clear search"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles['view-controls']}>
        <div className={styles['view-mode-toggle']} role="group" aria-label="View mode">
          <button
            className={`${styles['view-btn']} ${viewMode === 'kanban' ? styles.active : ''}`}
            onClick={() => onViewModeChange('kanban')}
            aria-pressed={viewMode === 'kanban'}
          >
            Kanban
          </button>
          <button
            className={`${styles['view-btn']} ${viewMode === 'swimlanes' ? styles.active : ''}`}
            onClick={() => onViewModeChange('swimlanes')}
            aria-pressed={viewMode === 'swimlanes'}
          >
            Swimlanes
          </button>
        </div>

        {viewMode === 'swimlanes' && (
          <select
            className={styles['swimlane-select']}
            value={swimlaneGroup}
            onChange={(e) => onSwimlaneGroupChange(e.target.value as SwimlaneGroup)}
            aria-label="Group swimlanes by"
          >
            <option value="none">No Grouping</option>
            <option value="assignee">By Assignee</option>
            <option value="pbi">By Backlog Item</option>
          </select>
        )}
      </div>
    </div>
  );
};
