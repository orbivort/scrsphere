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
import { formatLocaleDate } from '@scrumooth/shared';

import { useI18nStore } from '../../i18n/useI18nStore';
import type { HealthCheckTrendItem } from '../../services/domain/healthCheck.service';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HealthCheckTrendChartProps {
  data: HealthCheckTrendItem[];
}

export const HealthCheckTrendChart: React.FC<HealthCheckTrendChartProps> = ({ data }) => {
  const { t } = useTranslation('scrum-master-dashboard');
  const { locale } = useI18nStore();

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: t('healthCheck.results') },
      },
      scales: {
        y: { beginAtZero: true, max: 5, min: 0 },
      },
    }),
    [t]
  );

  const chartData = useMemo(
    () => ({
      labels: data.map((d) => formatLocaleDate(new Date(d.createdAt), locale)),
      datasets: [
        {
          label: t('healthCheck.overallAverage'),
          data: data.map((d) => d.overallAverage),
          borderColor: '#1A66FF',
          backgroundColor: 'rgba(26, 102, 255, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [data, t, locale]
  );

  if (data.length < 2) {
    return null;
  }

  return (
    <div style={{ height: 200 }} aria-label={t('healthCheck.results')}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default HealthCheckTrendChart;
