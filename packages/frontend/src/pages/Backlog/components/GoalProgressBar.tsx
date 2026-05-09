/**
 * GoalProgressBar Component
 *
 * A circular progress bar component for displaying goal completion progress.
 * Shows the percentage of story points completed for a product goal.
 *
 * @module pages/Backlog/components/GoalProgressBar
 */

import React from 'react';

import { ItemStatus, type ProductBacklogItem, type ProductGoal } from '../../../types';

import styles from './GoalProgressBar.module.css';

/**
 * Props for the GoalProgressBar component
 */
export interface GoalProgressBarProps {
  /** The product goal to display progress for */
  goal: ProductGoal;
  /** Array of backlog items to calculate progress from */
  backlogItems: ProductBacklogItem[];
}

/**
 * GoalProgressBar Component
 *
 * Renders a circular SVG progress ring showing the percentage of
 * completed story points for a given goal.
 *
 * The progress is calculated as:
 * (completed story points / total story points) * 100
 *
 * @param props - Component props
 * @returns The rendered GoalProgressBar component
 *
 * @example
 * ```tsx
 * <GoalProgressBar
 *   goal={activeGoal}
 *   backlogItems={backlogData}
 * />
 * ```
 */
export const GoalProgressBar: React.FC<GoalProgressBarProps> = ({ goal, backlogItems }) => {
  const goalItems = backlogItems.filter((item) => item.goalId === goal.id);
  const completedItems = goalItems.filter((item) => item.status === ItemStatus.DONE);
  const totalPoints = goalItems.reduce((sum, item) => sum + (item.storyPoints ?? 0), 0);
  const completedPoints = completedItems.reduce((sum, item) => sum + (item.storyPoints ?? 0), 0);
  const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <div className={styles['goal-progress-ring']}>
      {/* eslint-disable-next-line icon-rules/no-inline-svg -- Progress ring visualization, not an icon */}
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className={styles['progress-ring-bg']}
        />
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress * 1.63} 163.36`}
          transform="rotate(-90 30 30)"
          className={styles['progress-ring-fill']}
        />
      </svg>
      <span className={styles['progress-text']}>{progress}%</span>
    </div>
  );
};

export default GoalProgressBar;
