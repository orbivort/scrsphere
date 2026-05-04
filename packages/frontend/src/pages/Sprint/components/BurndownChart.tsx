import React from 'react';

import type { BurndownDataPoint } from '../SprintBoard.types';

import styles from './BurndownChart.module.css';

export interface BurndownChartProps {
  sprintName: string;
  sprintDuration: number;
  daysRemaining: number;
  totalEstimatedHours: number;
  totalRemainingHours: number;
  progressPercentage: number;
  burndownChartData: BurndownDataPoint[];
  showDataTable: boolean;
  onToggleDataTable: () => void;
  onClose: () => void;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  sprintName,
  sprintDuration,
  daysRemaining,
  totalEstimatedHours,
  totalRemainingHours,
  progressPercentage,
  burndownChartData,
  showDataTable,
  onToggleDataTable,
  onClose,
}) => {
  return (
    <div
      id="burndown-panel"
      className={styles['burndown-panel']}
      role="region"
      aria-label="Sprint Burndown Chart"
    >
      <div className={styles['burndown-header']}>
        <h3>Sprint Burndown</h3>
        <div className={styles['burndown-controls']}>
          <button
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={onToggleDataTable}
            aria-expanded={showDataTable}
            aria-controls="burndown-data-table"
          >
            {showDataTable ? 'Hide Data Table' : 'View Data Table'}
          </button>
          <button
            className={styles['burndown-close']}
            onClick={onClose}
            aria-label="Close burndown chart"
          >
            ×
          </button>
        </div>
      </div>

      {showDataTable && (
        <div
          id="burndown-data-table"
          className={styles['burndown-data-table']}
          role="region"
          aria-label="Burndown data table"
        >
          <table className={styles['data-table']}>
            <caption>Burndown Chart Data - {sprintName}</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Date</th>
                <th scope="col">Ideal Hours</th>
                <th scope="col">Actual Hours</th>
                <th scope="col">Variance</th>
              </tr>
            </thead>
            <tbody>
              {burndownChartData.map((point, index) => {
                const idealHours = Math.round(
                  totalEstimatedHours * (1 - point.day / (sprintDuration || 1))
                );
                const actualHours = point.actual ?? 0;
                const variance = point.actual !== null ? actualHours - idealHours : null;
                return (
                  <tr key={index}>
                    <td>{point.day + 1}</td>
                    <td>{point.date}</td>
                    <td>{idealHours}h</td>
                    <td>{point.actual !== null ? `${actualHours}h` : 'No data'}</td>
                    <td>
                      {variance !== null ? (
                        <span
                          className={
                            variance > 0 ? styles['variance-behind'] : styles['variance-ahead']
                          }
                        >
                          {variance > 0 ? `+${variance}h behind` : `${Math.abs(variance)}h ahead`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles['burndown-chart']}>
        <div className={styles['chart-y-axis']}>
          <span>{totalEstimatedHours}h</span>
          <span>{Math.round(totalEstimatedHours / 2)}h</span>
          <span>0h</span>
        </div>
        <div className={styles['chart-area']}>
          {/* eslint-disable-next-line icon-rules/no-inline-svg -- Data visualization chart, not an icon */}
          <svg
            viewBox={`0 0 ${sprintDuration * 30 + 20} 220`}
            className={styles['burndown-svg']}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Sprint burndown chart. Total estimated hours: ${totalEstimatedHours}h. Current remaining: ${totalRemainingHours}h. Progress: ${progressPercentage}% complete. Ideal burndown shown as dashed gray line. Actual progress shown as solid blue line.`}
          >
            <defs>
              <linearGradient id="idealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#D1D5DB" />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="10"
                y1={10 + ratio * 180}
                x2={sprintDuration * 30 + 10}
                y2={10 + ratio * 180}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}

            <line
              x1="10"
              y1="10"
              x2={sprintDuration * 30 + 10}
              y2="190"
              stroke="url(#idealGradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
              className={styles['ideal-line']}
            />

            {(() => {
              const totalHours = totalEstimatedHours || 1;
              const actualPoints = burndownChartData
                .filter((point) => point.actual !== null)
                .map((point) => {
                  const x = point.day * 30 + 10;
                  const y = 190 - (point.actual! / totalHours) * 180;
                  return `${x},${y}`;
                });

              if (actualPoints.length > 0) {
                return (
                  <>
                    <polygon
                      points={`10,190 ${actualPoints.join(' ')} ${actualPoints.length > 0 ? actualPoints[actualPoints.length - 1]!.split(',')[0] : 10},190`}
                      fill="url(#areaGradient)"
                    />
                    <polyline
                      points={actualPoints.join(' ')}
                      fill="none"
                      stroke="url(#actualGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="actual-line"
                    />
                    {burndownChartData
                      .filter((point) => point.actual !== null)
                      .map((point, i) => {
                        const x = point.day * 30 + 10;
                        const y = 190 - (point.actual! / totalHours) * 180;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#3B82F6"
                            stroke="white"
                            strokeWidth="2"
                            className="data-point"
                          />
                        );
                      })}
                  </>
                );
              }
              return null;
            })()}

            <circle
              cx={(() => {
                const currentDay = Math.max(0, sprintDuration - daysRemaining);
                return currentDay * 30 + 10;
              })()}
              cy={(() => {
                const totalHours = totalEstimatedHours || 1;
                return 190 - (totalRemainingHours / totalHours) * 180;
              })()}
              r="8"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="3"
              className={styles['current-point']}
            />
          </svg>

          <div className={styles['chart-legend']}>
            <span className={`${styles['legend-item']} ${styles.ideal}`}>
              <span className={`${styles['legend-line']} ${styles.ideal}`} />
              Ideal Burndown
            </span>
            <span className={`${styles['legend-item']} ${styles.actual}`}>
              <span className={`${styles['legend-line']} ${styles.actual}`} />
              Actual ({totalRemainingHours}h remaining)
            </span>
          </div>
        </div>
        <div className={styles['chart-x-axis']}>
          <span>Day 1</span>
          <span>Day {Math.round(sprintDuration / 2)}</span>
          <span>Day {sprintDuration}</span>
        </div>
      </div>
    </div>
  );
};
