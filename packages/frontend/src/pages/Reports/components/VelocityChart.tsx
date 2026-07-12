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

  const chartData = useMemo(
    () => ({
      labels: data?.sprints ?? [],
      datasets: [
        {
          label: t('velocityChart.planned'),
          data: data?.planned ?? [],
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: '#9CA3AF',
          borderWidth: 1,
        },
        {
          label: t('velocityChart.completed'),
          data: data?.completed ?? [],
          backgroundColor: 'rgba(26, 102, 255, 0.8)',
          borderColor: '#1A66FF',
          borderWidth: 1,
        },
      ],
    }),
    [data, t]
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

  return <Bar data={chartData} options={chartOptions} />;
};

export default VelocityChart;
