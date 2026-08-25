import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

import styles from './VelocityChart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VelocityData {
  sprints: string[];
  planned: number[];
  completed: number[];
}

interface VelocityChartProps {
  data: VelocityData | null | undefined;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  const { t } = useTranslation('reports');

  const sprints = useMemo(() => data?.sprints ?? [], [data?.sprints]);
  const planned = useMemo(() => data?.planned ?? [], [data?.planned]);
  const completed = useMemo(() => data?.completed ?? [], [data?.completed]);

  const chartData = useMemo(
    () => ({
      labels: sprints,
      datasets: [
        {
          label: t('velocityChart.planned'),
          data: planned,
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: '#9CA3AF',
          borderWidth: 1,
        },
        {
          label: t('velocityChart.completed'),
          data: completed,
          backgroundColor: 'rgba(26, 102, 255, 0.8)',
          borderColor: '#1A66FF',
          borderWidth: 1,
        },
      ],
    }),
    [sprints, planned, completed, t]
  );

  const chartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: t('velocityChart.title'),
          font: {
            size: 18,
            weight: 'bold',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: t('velocityChart.yAxisLabel'),
          },
        },
        x: {
          title: {
            display: true,
            text: t('velocityChart.xAxisLabel'),
          },
        },
      },
    }),
    [t]
  );

  return (
    <div>
      <div className={styles['chart-accessibility-label']} id="velocity-chart-desc">
        {t('velocityChart.accessibilityDescription')}
      </div>
      <Bar
        data={chartData}
        options={chartOptions}
        aria-label={t('velocityChart.ariaLabel')}
        aria-describedby="velocity-chart-desc"
        role="img"
      />

      <table className={styles['visually-hidden']} aria-label={t('velocityChart.ariaTableLabel')}>
        <caption className={styles['visually-hidden']}>
          {t('velocityChart.ariaTableCaption')}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('velocityChart.ariaTableSprint')}</th>
            <th scope="col">{t('velocityChart.planned')}</th>
            <th scope="col">{t('velocityChart.completed')}</th>
          </tr>
        </thead>
        <tbody>
          {sprints.map((sprintName, index) => (
            <tr key={sprintName}>
              <th scope="row">{sprintName}</th>
              <td>{planned[index] ?? 0}</td>
              <td>{completed[index] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VelocityChart;
