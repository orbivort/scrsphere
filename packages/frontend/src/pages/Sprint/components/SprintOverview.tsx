import React from 'react';

import styles from './SprintOverview.module.css';

import { TargetIcon, ClipboardIcon, ClockIcon, PackageIcon } from '@/components/common/Icons';

export interface SprintOverviewProps {
  sprintGoal?: string;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  totalEstimatedHours: number;
  totalRemainingHours: number;
  progressPercentage: number;
  totalPbis: number;
  completedPbis: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

export const SprintOverview: React.FC<SprintOverviewProps> = ({
  sprintGoal,
  totalTasks,
  todoTasks,
  inProgressTasks,
  doneTasks,
  totalRemainingHours,
  progressPercentage,
  totalPbis,
  completedPbis,
  totalStoryPoints,
  completedStoryPoints,
}) => {
  // Calculate progress ring circumference
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <section className={styles['sprint-overview']} aria-label="Sprint Overview">
      <div className={styles['overview-main']}>
        {/* Goal Section */}
        <div className={styles['goal-section']}>
          <div className={styles['goal-header']} aria-hidden="true">
            <TargetIcon size={18} />
          </div>
          <div className={styles['goal-content']}>
            <span className={styles['goal-label']}>Sprint Goal</span>
            <p className={styles['goal-text']} title={sprintGoal ?? 'No sprint goal set'}>
              {sprintGoal ?? 'No sprint goal set'}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className={styles['progress-section']}>
          <div className={styles['progress-ring']} aria-hidden="true">
            {/* eslint-disable-next-line icon-rules/no-inline-svg -- Progress ring visualization, not an icon */}
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className={styles['progress-ring-bg']}
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 22 22)"
                className={styles['progress-ring-fill']}
              />
            </svg>
            <span className={styles['progress-percentage']}>{progressPercentage}%</span>
          </div>
          <span className={styles['progress-label']}>Complete</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles['stats-row']}>
        {/* Tasks Stat */}
        <div className={styles['stat-item']} role="group" aria-labelledby="tasks-label">
          <div className={styles['stat-icon']} aria-hidden="true">
            <ClipboardIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <span className={styles['stat-label']} id="tasks-label">
              Tasks
            </span>
            <span className={styles['stat-value']}>{totalTasks}</span>
          </div>
          <span className={styles['stat-breakdown']}>
            {todoTasks} · {inProgressTasks} · {doneTasks}
          </span>
        </div>

        {/* Hours Stat */}
        <div className={styles['stat-item']} role="group" aria-labelledby="hours-label">
          <div className={styles['stat-icon']} aria-hidden="true">
            <ClockIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <span className={styles['stat-label']} id="hours-label">
              Remaining Hours
            </span>
            <span className={styles['stat-value']}>{totalRemainingHours}h</span>
          </div>
          <div className={styles['stat-bar']}>
            <div
              className={styles['stat-bar-fill']}
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* PBIs Stat */}
        <div className={styles['stat-item']} role="group" aria-labelledby="pbis-label">
          <div className={styles['stat-icon']} aria-hidden="true">
            <PackageIcon size={24} />
          </div>
          <div className={styles['stat-content']}>
            <span className={styles['stat-label']} id="pbis-label">
              PBIs
            </span>
            <span className={styles['stat-value']}>
              {completedPbis}/{totalPbis}
            </span>
          </div>
          <span className={styles['stat-breakdown']}>
            {completedStoryPoints}/{totalStoryPoints} pts
          </span>
        </div>
      </div>
    </section>
  );
};
