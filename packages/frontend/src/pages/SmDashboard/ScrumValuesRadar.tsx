import React, { useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const SCRUM_VALUES = ['COMMITMENT', 'FOCUS', 'OPENNESS', 'RESPECT', 'COURAGE'];

interface ScrumValuesRadarProps {
  results: Array<{ scrumValue: string; averageScore: number; responseCount: number }>;
}

export const ScrumValuesRadar: React.FC<ScrumValuesRadarProps> = ({ results }) => {
  const { t } = useTranslation('scrum-master-dashboard');

  const chartOptions = useMemo<ChartOptions<'radar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 5,
          min: 0,
          ticks: { stepSize: 1 },
        },
      },
      plugins: {
        legend: { display: false },
      },
    }),
    []
  );

  const chartData = useMemo(() => {
    const scoresByValue = new Map(results.map((r) => [r.scrumValue, r.averageScore]));
    return {
      labels: SCRUM_VALUES.map((v) => t(`scrumValues.values.${v}.label` as never)),
      datasets: [
        {
          label: t('healthCheck.overallAverage'),
          data: SCRUM_VALUES.map((v) => scoresByValue.get(v) ?? 0),
          backgroundColor: 'rgba(26, 102, 255, 0.2)',
          borderColor: '#1A66FF',
          borderWidth: 2,
          pointBackgroundColor: '#1A66FF',
        },
      ],
    };
  }, [results, t]);

  return (
    <div style={{ height: 260 }} aria-label={t('healthCheck.results')}>
      <Radar data={chartData} options={chartOptions} />
    </div>
  );
};

export default ScrumValuesRadar;
