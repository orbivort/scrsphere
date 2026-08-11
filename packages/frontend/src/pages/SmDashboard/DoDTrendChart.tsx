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
  type ChartOptions,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

import type { DoDComplianceTrend } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DoDTrendChartProps {
  data: DoDComplianceTrend[];
}

export const DoDTrendChart: React.FC<DoDTrendChartProps> = ({ data }) => {
  const { t } = useTranslation('scrum-master-dashboard');

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: t('smDashboard.dodCompliance'),
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: '%' },
        },
      },
    }),
    [t]
  );

  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.sprintName),
      datasets: [
        {
          label: t('smDashboard.dodCompliance'),
          data: data.map((d) => d.compliancePercentage),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [data, t]
  );

  if (!data.length) {
    return <p className="visually-hidden">{t('smDashboard.noData')}</p>;
  }

  return (
    <div style={{ height: 260 }} aria-label={t('smDashboard.dodCompliance')}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default DoDTrendChart;
