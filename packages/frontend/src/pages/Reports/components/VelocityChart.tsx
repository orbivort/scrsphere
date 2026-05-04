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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VelocityData {
  sprints: string[];
  planned: number[];
  completed: number[];
}

interface VelocityChartProps {
  data: VelocityData | null | undefined;
}

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Sprint Velocity',
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
        text: 'Story Points',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Sprint',
      },
    },
  },
};

export const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  const chartData = useMemo(
    () => ({
      labels: data?.sprints || [],
      datasets: [
        {
          label: 'Planned',
          data: data?.planned || [],
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: '#9CA3AF',
          borderWidth: 1,
        },
        {
          label: 'Completed',
          data: data?.completed || [],
          backgroundColor: 'rgba(26, 102, 255, 0.8)',
          borderColor: '#1A66FF',
          borderWidth: 1,
        },
      ],
    }),
    [data]
  );

  return <Bar data={chartData} options={CHART_OPTIONS} />;
};

export default VelocityChart;
