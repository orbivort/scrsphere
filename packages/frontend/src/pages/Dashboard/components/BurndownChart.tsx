import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';

import { logger } from '../../../utils/logger';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Sprint Burndown Chart',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Estimated Hours',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Day',
      },
    },
  },
};

interface BurndownData {
  dates: string[];
  ideal: number[];
  actual: (number | null)[];
}

interface BurndownChartProps {
  data: BurndownData | null | undefined;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const dates = data?.dates ?? [];
    const ideal = data?.ideal ?? [];
    const actual = data?.actual ?? [];

    if (!dates.length || !ideal.length || !actual.length) {
      if (data) {
        logger.warn('Burndown chart data validation failed: Empty arrays');
      }
      return {
        labels: [],
        datasets: [
          {
            label: 'Ideal',
            data: [],
            borderColor: '#9CA3AF',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0,
          },
          {
            label: 'Actual',
            data: [],
            borderColor: '#1A66FF',
            backgroundColor: 'rgba(26, 102, 255, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    if (dates.length !== ideal.length || dates.length !== actual.length) {
      logger.warn(
        `Burndown chart data validation failed: Array length mismatch - dates: ${dates.length}, ideal: ${ideal.length}, actual: ${actual.length}`
      );
      return {
        labels: [],
        datasets: [
          {
            label: 'Ideal',
            data: [],
            borderColor: '#9CA3AF',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0,
          },
          {
            label: 'Actual',
            data: [],
            borderColor: '#1A66FF',
            backgroundColor: 'rgba(26, 102, 255, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    return {
      labels: dates,
      datasets: [
        {
          label: 'Ideal',
          data: ideal,
          borderColor: '#9CA3AF',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
        },
        {
          label: 'Actual',
          data: actual,
          borderColor: '#1A66FF',
          backgroundColor: 'rgba(26, 102, 255, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [data]);

  const chartSummary = useMemo(() => {
    if (!data) return '';

    const { dates, ideal, actual } = data;
    if (!dates.length || !ideal.length || !actual.length) {
      return 'No burndown data available.';
    }

    const totalDays = dates.length;
    const startPoints = ideal[0];

    const lastActualIndex = actual.reduce((lastIdx: number, val, idx) => {
      return val !== null ? idx : lastIdx;
    }, -1);

    const currentDay = lastActualIndex >= 0 ? dates[lastActualIndex] : dates[dates.length - 1];
    const idealRemaining = lastActualIndex >= 0 ? ideal[lastActualIndex] : ideal[ideal.length - 1];
    const actualRemaining = lastActualIndex >= 0 ? actual[lastActualIndex] : null;

    const actualText = actualRemaining !== null ? `${actualRemaining} points` : 'no data';

    return (
      `Sprint burndown chart: ${totalDays} days tracked. ` +
      `Current day: ${currentDay}. ` +
      `Starting story points: ${startPoints}. ` +
      `Ideal remaining: ${idealRemaining} points. ` +
      `Actual remaining: ${actualText}.`
    );
  }, [data]);

  return (
    <>
      <p id="burndown-chart-summary" className="visually-hidden">
        {chartSummary}
      </p>
      <div aria-describedby="burndown-chart-summary">
        <Line
          data={chartData}
          options={CHART_OPTIONS}
          aria-label="Sprint burndown chart showing progress over time"
        />
      </div>
    </>
  );
};

export default BurndownChart;
