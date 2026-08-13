// HealthCheckSurvey
// Lets a team member submit their 1-5 rating for each of the five Scrum Values,
// with an optional anonymous flag.
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { healthCheckService } from '../../../services';
import { queryKeys } from '../../../hooks/queryKeys';
import { ScrumValue } from '../../../types';

import styles from './HealthCheckSurvey.module.css';

const SCRUM_VALUES = Object.values(ScrumValue);

interface HealthCheckSurveyProps {
  teamId: string;
  healthCheckId: string;
}

export const HealthCheckSurvey: React.FC<HealthCheckSurveyProps> = ({ teamId, healthCheckId }) => {
  const { t } = useTranslation(['scrum-master-dashboard', 'common']);
  const queryClient = useQueryClient();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      healthCheckService.submitResponses(
        healthCheckId,
        SCRUM_VALUES.map((value) => ({
          scrumValue: value,
          score: scores[value] ?? 3,
          anonymous,
        }))
      ),
    onSuccess: () => {
      setSubmitted(true);
      // Refresh both the SM dashboard (results/trend) and the team page
      // (latest health check status) after a successful submission.
      void queryClient.invalidateQueries({ queryKey: ['sm-dashboard', teamId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.healthCheck.latest(teamId) });
    },
  });

  if (submitted) {
    return <p className={styles.saved}>{t('healthCheck.responseSaved')}</p>;
  }

  return (
    <form
      className={styles.survey}
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <p className={styles.subtitle}>{t('healthCheck.subtitle')}</p>

      <div className={styles.questions}>
        {SCRUM_VALUES.map((value) => (
          <div key={value} className={styles.question}>
            <div className={styles['question-text']}>
              <span className={styles['value-name']}>
                {t(`scrumValues.values.${value}.label` as never)}
              </span>
              <span className={styles['value-question']}>
                {t(`scrumValues.values.${value}.question` as never)}
              </span>
            </div>
            <div
              className={styles.scale}
              role="radiogroup"
              aria-label={t(`scrumValues.values.${value}.label` as never)}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={scores[value] === score}
                  className={`${styles['score-button']} ${scores[value] === score ? styles.selected : ''}`}
                  onClick={() => setScores((prev) => ({ ...prev, [value]: score }))}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className={styles['anonymous-label']}>
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        <span>{t('healthCheck.respondAnonymous')}</span>
      </label>

      <button
        type="submit"
        className={styles.submit}
        disabled={mutation.isPending || Object.keys(scores).length < SCRUM_VALUES.length}
      >
        {mutation.isPending ? t('common:loading') : t('healthCheck.submitResponse')}
      </button>
    </form>
  );
};

export default HealthCheckSurvey;
