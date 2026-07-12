import i18n, { type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';

// Import all locale files for bundling
// English
import enAuth from '../locales/en/auth.json';
import enBacklog from '../locales/en/backlog.json';
import enCommon from '../locales/en/common.json';
import enDailyScrum from '../locales/en/daily-scrum.json';
import enDashboard from '../locales/en/dashboard.json';
import enErrors from '../locales/en/errors.json';
import enImpediments from '../locales/en/impediments.json';
import enIncrements from '../locales/en/increments.json';
import enNotifications from '../locales/en/notifications.json';
import enReports from '../locales/en/reports.json';
import enRetrospective from '../locales/en/retrospective.json';
import enSettings from '../locales/en/settings.json';
import enSprintReview from '../locales/en/sprint-review.json';
import enSprint from '../locales/en/sprint.json';
import enTeam from '../locales/en/team.json';
import enValidation from '../locales/en/validation.json';
// German
import deAuth from '../locales/de/auth.json';
import deBacklog from '../locales/de/backlog.json';
import deCommon from '../locales/de/common.json';
import deDailyScrum from '../locales/de/daily-scrum.json';
import deDashboard from '../locales/de/dashboard.json';
import deErrors from '../locales/de/errors.json';
import deImpediments from '../locales/de/impediments.json';
import deIncrements from '../locales/de/increments.json';
import deNotifications from '../locales/de/notifications.json';
import deReports from '../locales/de/reports.json';
import deRetrospective from '../locales/de/retrospective.json';
import deSettings from '../locales/de/settings.json';
import deSprintReview from '../locales/de/sprint-review.json';
import deSprint from '../locales/de/sprint.json';
import deTeam from '../locales/de/team.json';
import deValidation from '../locales/de/validation.json';
// Spanish
import esAuth from '../locales/es/auth.json';
import esBacklog from '../locales/es/backlog.json';
import esCommon from '../locales/es/common.json';
import esDailyScrum from '../locales/es/daily-scrum.json';
import esDashboard from '../locales/es/dashboard.json';
import esErrors from '../locales/es/errors.json';
import esImpediments from '../locales/es/impediments.json';
import esIncrements from '../locales/es/increments.json';
import esNotifications from '../locales/es/notifications.json';
import esReports from '../locales/es/reports.json';
import esRetrospective from '../locales/es/retrospective.json';
import esSettings from '../locales/es/settings.json';
import esSprintReview from '../locales/es/sprint-review.json';
import esSprint from '../locales/es/sprint.json';
import esTeam from '../locales/es/team.json';
import esValidation from '../locales/es/validation.json';
// French
import frAuth from '../locales/fr/auth.json';
import frBacklog from '../locales/fr/backlog.json';
import frCommon from '../locales/fr/common.json';
import frDailyScrum from '../locales/fr/daily-scrum.json';
import frDashboard from '../locales/fr/dashboard.json';
import frErrors from '../locales/fr/errors.json';
import frImpediments from '../locales/fr/impediments.json';
import frIncrements from '../locales/fr/increments.json';
import frNotifications from '../locales/fr/notifications.json';
import frReports from '../locales/fr/reports.json';
import frRetrospective from '../locales/fr/retrospective.json';
import frSettings from '../locales/fr/settings.json';
import frSprintReview from '../locales/fr/sprint-review.json';
import frSprint from '../locales/fr/sprint.json';
import frTeam from '../locales/fr/team.json';
import frValidation from '../locales/fr/validation.json';
// Italian
import itAuth from '../locales/it/auth.json';
import itBacklog from '../locales/it/backlog.json';
import itCommon from '../locales/it/common.json';
import itDailyScrum from '../locales/it/daily-scrum.json';
import itDashboard from '../locales/it/dashboard.json';
import itErrors from '../locales/it/errors.json';
import itImpediments from '../locales/it/impediments.json';
import itIncrements from '../locales/it/increments.json';
import itNotifications from '../locales/it/notifications.json';
import itReports from '../locales/it/reports.json';
import itRetrospective from '../locales/it/retrospective.json';
import itSettings from '../locales/it/settings.json';
import itSprintReview from '../locales/it/sprint-review.json';
import itSprint from '../locales/it/sprint.json';
import itTeam from '../locales/it/team.json';
import itValidation from '../locales/it/validation.json';

export const i18nInstance = i18n.use(initReactI18next);

export function initI18n(initialLocale?: Locale): Promise<TFunction> {
  return i18nInstance.init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        backlog: enBacklog,
        sprint: enSprint,
        'daily-scrum': enDailyScrum,
        impediments: enImpediments,
        increments: enIncrements,
        'sprint-review': enSprintReview,
        retrospective: enRetrospective,
        reports: enReports,
        team: enTeam,
        settings: enSettings,
        notifications: enNotifications,
        errors: enErrors,
        validation: enValidation,
      },
      de: {
        common: deCommon,
        auth: deAuth,
        dashboard: deDashboard,
        backlog: deBacklog,
        sprint: deSprint,
        'daily-scrum': deDailyScrum,
        impediments: deImpediments,
        increments: deIncrements,
        'sprint-review': deSprintReview,
        retrospective: deRetrospective,
        reports: deReports,
        team: deTeam,
        settings: deSettings,
        notifications: deNotifications,
        errors: deErrors,
        validation: deValidation,
      },
      es: {
        common: esCommon,
        auth: esAuth,
        dashboard: esDashboard,
        backlog: esBacklog,
        sprint: esSprint,
        'daily-scrum': esDailyScrum,
        impediments: esImpediments,
        increments: esIncrements,
        'sprint-review': esSprintReview,
        retrospective: esRetrospective,
        reports: esReports,
        team: esTeam,
        settings: esSettings,
        notifications: esNotifications,
        errors: esErrors,
        validation: esValidation,
      },
      fr: {
        common: frCommon,
        auth: frAuth,
        dashboard: frDashboard,
        backlog: frBacklog,
        sprint: frSprint,
        'daily-scrum': frDailyScrum,
        impediments: frImpediments,
        increments: frIncrements,
        'sprint-review': frSprintReview,
        retrospective: frRetrospective,
        reports: frReports,
        team: frTeam,
        settings: frSettings,
        notifications: frNotifications,
        errors: frErrors,
        validation: frValidation,
      },
      it: {
        common: itCommon,
        auth: itAuth,
        dashboard: itDashboard,
        backlog: itBacklog,
        sprint: itSprint,
        'daily-scrum': itDailyScrum,
        impediments: itImpediments,
        increments: itIncrements,
        'sprint-review': itSprintReview,
        retrospective: itRetrospective,
        reports: itReports,
        team: itTeam,
        settings: itSettings,
        notifications: itNotifications,
        errors: itErrors,
        validation: itValidation,
      },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    load: 'languageOnly',
    ns: [
      'common',
      'auth',
      'dashboard',
      'backlog',
      'sprint',
      'daily-scrum',
      'impediments',
      'increments',
      'sprint-review',
      'retrospective',
      'reports',
      'team',
      'settings',
      'notifications',
      'errors',
      'validation',
    ],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React escapes by default
    },

    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
    },

    returnNull: false,
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key: ${lngs.join(',')}:${ns}:${key}`);
      }
    },

    lng: initialLocale,
  });
}
