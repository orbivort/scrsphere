import type enCommon from '../locales/en/common.json';
import type enAuth from '../locales/en/auth.json';
import type enDashboard from '../locales/en/dashboard.json';
import type enBacklog from '../locales/en/backlog.json';
import type enSprint from '../locales/en/sprint.json';
import type enDailyScrum from '../locales/en/daily-scrum.json';
import type enImpediments from '../locales/en/impediments.json';
import type enIncrements from '../locales/en/increments.json';
import type enSprintReview from '../locales/en/sprint-review.json';
import type enRetrospective from '../locales/en/retrospective.json';
import type enReports from '../locales/en/reports.json';
import type enTeam from '../locales/en/team.json';
import type enSettings from '../locales/en/settings.json';
import type enNotifications from '../locales/en/notifications.json';
import type enErrors from '../locales/en/errors.json';
import type enValidation from '../locales/en/validation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      auth: typeof enAuth;
      dashboard: typeof enDashboard;
      backlog: typeof enBacklog;
      sprint: typeof enSprint;
      'daily-scrum': typeof enDailyScrum;
      impediments: typeof enImpediments;
      increments: typeof enIncrements;
      'sprint-review': typeof enSprintReview;
      retrospective: typeof enRetrospective;
      reports: typeof enReports;
      team: typeof enTeam;
      settings: typeof enSettings;
      notifications: typeof enNotifications;
      errors: typeof enErrors;
      validation: typeof enValidation;
    };
  }
}
