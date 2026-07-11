import i18next, { type i18n as I18nType } from 'i18next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@scrumooth/shared';

import enEmails from '../locales/en/emails.json' with { type: 'json' };
import enNotifications from '../locales/en/notifications.json' with { type: 'json' };
import enErrors from '../locales/en/errors.json' with { type: 'json' };
import enValidation from '../locales/en/validation.json' with { type: 'json' };
import deEmails from '../locales/de/emails.json' with { type: 'json' };
import deNotifications from '../locales/de/notifications.json' with { type: 'json' };
import deErrors from '../locales/de/errors.json' with { type: 'json' };
import deValidation from '../locales/de/validation.json' with { type: 'json' };
import frEmails from '../locales/fr/emails.json' with { type: 'json' };
import frNotifications from '../locales/fr/notifications.json' with { type: 'json' };
import frErrors from '../locales/fr/errors.json' with { type: 'json' };
import frValidation from '../locales/fr/validation.json' with { type: 'json' };
import esEmails from '../locales/es/emails.json' with { type: 'json' };
import esNotifications from '../locales/es/notifications.json' with { type: 'json' };
import esErrors from '../locales/es/errors.json' with { type: 'json' };
import esValidation from '../locales/es/validation.json' with { type: 'json' };
import itEmails from '../locales/it/emails.json' with { type: 'json' };
import itNotifications from '../locales/it/notifications.json' with { type: 'json' };
import itErrors from '../locales/it/errors.json' with { type: 'json' };
import itValidation from '../locales/it/validation.json' with { type: 'json' };

const resources = {
  en: {
    emails: enEmails,
    notifications: enNotifications,
    errors: enErrors,
    validation: enValidation,
  },
  de: {
    emails: deEmails,
    notifications: deNotifications,
    errors: deErrors,
    validation: deValidation,
  },
  fr: {
    emails: frEmails,
    notifications: frNotifications,
    errors: frErrors,
    validation: frValidation,
  },
  es: {
    emails: esEmails,
    notifications: esNotifications,
    errors: esErrors,
    validation: esValidation,
  },
  it: {
    emails: itEmails,
    notifications: itNotifications,
    errors: itErrors,
    validation: itValidation,
  },
};

export const i18nInstance: I18nType = i18next.createInstance({
  resources,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...SUPPORTED_LOCALES],
  load: 'languageOnly',
  ns: ['emails', 'notifications', 'errors', 'validation'],
  defaultNS: 'errors',
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});

void i18nInstance.init();
