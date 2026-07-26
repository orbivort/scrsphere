# i18n Architecture

**Status**: Implemented (Phase 1–4) · Phase 5 (RTL) pending
**Last Updated**: 2026-07-18
**Scope**: Frontend (`packages/frontend/`), Backend (`packages/backend/`), Shared (`packages/shared/`)

> This document describes the internationalization architecture as implemented in the codebase. It is intentionally concise — for full source-of-truth, read the files referenced in each section.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Supported Locales](#2-supported-locales)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Architecture Decision Records (ADRs)](#4-architecture-decision-records-adrs)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Backend Implementation](#6-backend-implementation)
7. [Shared Package Integration](#7-shared-package-integration)
8. [Locale Detection & Fallback Flow](#8-locale-detection--fallback-flow)
9. [Pluralization & Cultural Formatting](#9-pluralization--cultural-formatting)
10. [Translation File Organization](#10-translation-file-organization)
11. [Translation Workflow & CI Gates](#11-translation-workflow--ci-gates)
12. [Testing Strategy](#12-testing-strategy)
13. [New Language Onboarding](#13-new-language-onboarding)
14. [Modern Best Practices Alignment (2026)](#14-modern-best-practices-alignment-2026)
15. [File Inventory](#15-file-inventory)

---

## 1. Executive Summary

Scrumooth supports 5 locales (`en`, `de`, `fr`, `it`, `es`) end-to-end across frontend, backend, and shared packages. The architecture uses **i18next v24+** with `react-i18next`, lazy-loaded namespaced JSON files, native `Intl` APIs for pluralization/formatting, and a per-request locale resolver on the backend via `AsyncLocalStorage`.

**Key design choices:**

- **No bundled locale** — all locale JSON (including `en/common`) is fetched over HTTP by `i18next-http-backend`. The main JS bundle contains only the i18next runtime (~30 KB gzipped) plus the `intl-pluralrules` polyfill (~1 KB).
- **Cookie-based locale persistence** — `scrumooth_locale` cookie (1 year, `SameSite=Strict`). `localStorage` is deliberately avoided because the Zustand persist format (`{ state: { locale: '…' }, version: 0 }`) collides with what a language detector would write.
- **Backend locale priority**: `Accept-Language` header FIRST → `User.locale` database column → `DEFAULT_LOCALE` (`en`). Reversed from typical SaaS pattern because Scrumooth is multi-tenant by team and browser preference is more reliable than per-user config at first visit.
- **RTL-ready** — CSS uses logical properties (`margin-inline-start` not `margin-left`); `dir="rtl"` is set on `<html>` based on `getDirection(locale)`. No RTL locale ships today.

---

## 2. Supported Locales

| Code | Endonym  | Date format  | Time    | Currency | Plural classes  |
| ---- | -------- | ------------ | ------- | -------- | --------------- |
| `en` | English  | `dd/MM/yyyy` | 24-hour | EUR      | `one` / `other` |
| `de` | Deutsch  | `dd.MM.yyyy` | 24-hour | EUR      | `one` / `other` |
| `fr` | Français | `dd/MM/yyyy` | 24-hour | EUR      | `one` / `other` |
| `it` | Italiano | `dd/MM/yyyy` | 24-hour | EUR      | `one` / `other` |
| `es` | Español  | `dd/MM/yyyy` | 24-hour | EUR      | `one` / `other` |

- **English uses `enGB`** (not `enUS`) date-fns locale — target organization is European.
- **DEFAULT_LOCALE** is `en`. All fallback chains terminate at `en`.
- **RTL_LANGUAGES** = `['ar', 'he', 'fa', 'ur']` (none currently supported; CSS groundwork is in place).

---

## 3. High-Level Architecture

```
┌───────────────────────────── Frontend ─────────────────────────────┐
│                                                                     │
│  React 19                                                           │
│    └─ I18nProvider (15s init timeout, error/retry UI)               │
│         └─ i18next instance (cookie + navigator detection)          │
│              └─ i18next-http-backend → /locales/{lng}/{ns}.json     │
│         └─ useI18nStore (Zustand) → scrumooth_locale cookie         │
│                                                                     │
│  Formatters (@scrumooth/shared)                                     │
│    └─ Intl.NumberFormat / DateTimeFormat / RelativeTimeFormat       │
│    └─ date-fns with locale imports (enGB, de, fr, it, es)           │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTPS (Cookie: scrumooth_locale=…)
                              ▼
┌───────────────────────────── Backend ───────────────────────────────┐
│                                                                     │
│  Express middleware chain                                           │
│    └─ locale.middleware.ts                                          │
│         priority: Accept-Language > User.locale > DEFAULT_LOCALE    │
│         stores locale in AsyncLocalStorage                          │
│                                                                     │
│  Per-request t()                                                    │
│    └─ requestT.ts reads locale from AsyncLocalStorage               │
│    └─ i18next instance with bundled JSON (5 ns × 5 locales)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Architecture Decision Records (ADRs)

### ADR-001: i18n Library — `i18next` + `react-i18next`

**Decision:** Use `i18next` v24+ with `react-i18next`, `i18next-http-backend`, and `i18next-browser-languagedetector`.
**Rationale:** Mature ecosystem, framework-agnostic core (so backend can use the same library), built-in lazy namespace loading, native `Intl.PluralRules` support (no resolver polyfill needed beyond `intl-pluralrules` for Safari < 14).
**Alternatives considered:** `react-intl` (Format.JS) — rejected because its ICU MessageFormat is overkill for European Scrum terminology; `lingui` — rejected due to smaller ecosystem.

### ADR-002: Translation File Format — Namespaced JSON per Locale

**Decision:** One JSON file per `(locale, namespace)` pair. Frontend files live in `packages/frontend/public/locales/{lng}/{ns}.json` (served as static HTTP assets). Backend files live in `packages/backend/src/locales/{lng}/{ns}.json` (bundled at build time via `with { type: 'json' }` ESM import attributes).
**Frontend namespaces (16):** `auth`, `backlog`, `common`, `daily-scrum`, `dashboard`, `errors`, `impediments`, `increments`, `notifications`, `reports`, `retrospective`, `sprint`, `sprint-review`, `settings`, `team`, `validation`.
**Backend namespaces (5):** `emails`, `notifications`, `errors`, `validation`, `retrospectives`.
**Rationale:** Namespacing enables route-level lazy loading (`useTranslation('dashboard')` only fetches `/locales/{lng}/dashboard.json`). JSON (not YAML/PO) keeps diffs reviewable and tooling simple.

### ADR-003: Language Detection & Persistence — Cookie Only

**Decision:** Frontend detection order is `['cookie', 'navigator']` with `caches: ['cookie']`. The `scrumooth_locale` cookie is set with `maxAge: 31536000000` (1 year in **milliseconds** — Express `res.cookie` `maxAge` is milliseconds, not seconds), `SameSite=Strict`, `Secure` (in production).
**Why not localStorage:** Zustand persist writes to `localStorage` key `scrumooth.locale` as `{"state":{"locale":"de"},"version":0}`. If `i18next-browser-languagedetector` also wrote to `localStorage` (its default), the two would race and corrupt each other's format. The cookie is shared with the backend (automatic `Accept-Language`-equivalent on every request).
**Backend cookie write:** `locale.middleware.ts` re-syncs the cookie on every request after resolving the locale.

### ADR-004: Fallback Strategy — Three-Tier Chain

**Decision:** i18next `fallbackLng: DEFAULT_LOCALE` (`en`). Missing key in `de` falls back to `en`. Missing namespace falls back to `common`. `parseMissingKeyHandler: (key) => key` returns the key string for missing translations (visible in UI during development; not blank).
**No bundled default locale:** Even `en/common` is fetched over HTTP (see ADR-008). The 15-second init timeout in `I18nProvider` covers network failures.

### ADR-005: Backend i18n — Shared Instance with Per-Request Locale

**Decision:** A single `i18next.createInstance()` is initialized at backend startup with all 5 locales × 5 namespaces bundled. Per-request locale is resolved by `locale.middleware.ts` and stored in `AsyncLocalStorage`. The `t()` accessor in `requestT.ts` reads the locale from `AsyncLocalStorage` and passes it as `i18nInstance.t(key, { lng: getRequestLocale(), ...options })`.
**Locale priority (verified):** `Accept-Language` header FIRST → `User.locale` (database) → `DEFAULT_LOCALE`. Reversed from typical SaaS pattern because Scrumooth is multi-tenant by team and the browser language is more reliable at first visit. The Accept-Language parser is simplistic (split-on-comma, no `q=` handling); `resolve-accept-language` is recommended for future improvement.
**Silent fallback:** `requestT.ts` does NOT throw when called outside a request scope — `getRequestLocale()` returns `DEFAULT_LOCALE`. A `logger.warn` is emitted to surface misuse. The JSDoc accurately describes this behavior.

### ADR-006: Pluralization & Cultural Formatting — Native `Intl` + `date-fns`

**Decision:** Use native `Intl.PluralRules` (polyfilled by `intl-pluralrules` for Safari < 14), `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.ListFormat`, `Intl.Collator`. Use `date-fns` v4 for date formatting that needs locale-aware tokens (`PP`, `d MMM`, etc.).
**Date-fns locales:** `{ en: enGB, de, fr, it, es }`. English uses `enGB` (European audience → `DD/MM/YYYY`, 24-hour by default).
**No `i18next-intlpluralresolver`:** Deprecated since i18next v24 — native `Intl.PluralRules` is used directly.
**Plural classes:** All five locales use `one`/`other` only (CLDR). No locale in the supported set has a `many` plural category.

### ADR-007: Translation Workflow — JSON-in-Repo + CI Gates

**Decision:** Translation JSON lives in the repo. The `packages/shared/i18n/glossary.json` file defines canonical Scrum term translations per locale (sourced from the official 2020 Scrum Guide). Four scripts enforce quality:

- `pnpm run i18n:check` — validates key completeness, structural correctness, no extra keys in non-`en` locales
- `pnpm run i18n:completeness` — produces a per-locale coverage report
- `pnpm run i18n:glossary` — flags locale JSON values that don't match glossary-prescribed Scrum terms
- `pnpm run i18n:extract` — assists with hardcoded-string extraction (not a fully automated extractor)

**No `i18n:sort` script exists** — sorting is a manual/PR-review convention.

### ADR-008: Performance — Lazy Namespace Loading, No Bundled Locale

**Decision:** Frontend uses `i18next-http-backend` to fetch every locale (including `en/common`) over HTTP from `public/locales/`. No locale JSON is bundled into the JS chunks.
**Rationale:** Smaller main bundle (~3 KB saved); locale switches never require re-bundling; the `i18n:check` script can verify all files exist without a build step.
**Trade-off:** First paint requires a network round-trip for `en/common` (~50 ms typical). Covered by the 15-second timeout in `I18nProvider`.
**Future option:** Bundle `en/common` only via Vite `import` if first-paint latency becomes measurable. One-line change in `config.ts`.

### ADR-009: RTL-Ready Architecture — Logical CSS + Directional Abstraction

**Decision:** All CSS uses logical properties (`margin-inline-start`, `text-align: start`, `inset-inline-end`). Stylelint rule `declaration-property-value-disallowed-list` flags physical properties. `getDirection(locale)` returns `'ltr' | 'rtl'`; `I18nProvider` sets `document.documentElement.dir`.
**Status:** CSS groundwork in place; no RTL locale ships today. Adding `ar` or `he` requires ~2–3 engineer-days of CSS auditing and email template `dir="rtl"` additions.

### ADR-010: Locale-Aware Collation — `Intl.Collator`

**Decision:** All user-facing string sorts (backlog items, team members) use `sortLocaleStrings(items, locale)` which wraps `new Intl.Collator(locale, { sensitivity: 'base', numeric: true })`. This ensures `Álvaro` sorts before `Ana` in Portuguese, `Österreich` sorts correctly in German, etc.

### ADR-011: Chart.js i18n

**Decision:** Chart.js axis labels use `formatChartDate(date, locale)` → `format(d, 'd MMM', { locale })`. Tooltip callbacks use `t()` for labels. Number formatting uses `Intl.NumberFormat`. Chart.js does not natively respect `dir="rtl"`; axis direction must be set explicitly when an RTL locale is added.

### ADR-012: Test Migration — Locale-Aware Unit & E2E

**Decision:** All tests that assert user-visible strings use translation keys (not hardcoded English). E2E tests pre-load the required namespaces and use `data-testid` attributes (not text selectors) to find elements. This avoids breaking tests when translations change.

---

## 5. Frontend Implementation

### 5.1 Package Dependencies

**File:** `packages/frontend/package.json`

| Package                            | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `i18next` (v24+)                   | Core i18n library                                    |
| `react-i18next` (v15+)             | React bindings (`useTranslation`, `I18nextProvider`) |
| `i18next-http-backend`             | Lazy-loads namespace JSON over HTTP                  |
| `i18next-browser-languagedetector` | Detects locale from cookie + navigator               |
| `intl-pluralrules`                 | Polyfill for Safari < 14 (~1 KB)                     |
| `date-fns` (v4)                    | Locale-aware date formatting                         |

### 5.2 i18next Configuration

**File:** `packages/frontend/src/i18n/config.ts` (75 lines)

Key options:

| Option                      | Value                          | Why                                                  |
| --------------------------- | ------------------------------ | ---------------------------------------------------- |
| `fallbackLng`               | `DEFAULT_LOCALE` (`en`)        | All missing keys fall back to English                |
| `supportedLngs`             | `[...SUPPORTED_LOCALES]`       | Rejects unsupported locales early                    |
| `load`                      | `'languageOnly'`               | `pt-BR` → `pt` (no region-qualified locales today)   |
| `ns`                        | 16 namespaces (see ADR-002)    | Lazy-loaded per route                                |
| `defaultNS`                 | `'common'`                     | Shared strings (buttons, labels)                     |
| `backend.loadPath`          | `/locales/{{lng}}/{{ns}}.json` | Served from `public/locales/`                        |
| `detection.order`           | `['cookie', 'navigator']`      | Cookie first (user preference), browser second       |
| `detection.caches`          | `['cookie']`                   | Persist resolved locale to `scrumooth_locale` cookie |
| `detection.lookupCookie`    | `'scrumooth_locale'`           | Shared with backend                                  |
| `parseMissingKeyHandler`    | `(key) => key`                 | Returns key string (visible in dev, not blank)       |
| `interpolation.escapeValue` | `false`                        | React escapes by default                             |

**No `resources` field** — locale JSON is fetched by `i18next-http-backend`, not bundled.

### 5.3 I18nProvider

**File:** `packages/frontend/src/i18n/I18nProvider.tsx` (246 lines)

The provider manages three concerns:

1. **Init lifecycle** — three states: `loading` → `ready` (or `error`). A 15-second timeout (`I18N_INIT_TIMEOUT_MS = 15_000`) flips to `error` if i18next doesn't initialize. The error UI shows a retry button and dev-only diagnostic details (`i18n.isInitialized`, `i18n.language`).

2. **Locale sync** — on mount, syncs the Zustand store from i18next's detected language. On login (auth store user transition from null to non-null), syncs from `user.locale` UNLESS the user has an explicit persisted preference (checked by reading the Zustand persist localStorage key).

3. **Language switching** — when `useI18nStore.locale` changes, calls `i18nInstance.changeLanguage(locale)` and sets `document.documentElement.lang` and `dir`. A `isChangingLanguage` ref guards against feedback loops (Zustand update → i18next `languageChanged` event → Zustand update).

**Children are not rendered until `i18nState === 'ready'`** — prevents flash of untranslated text.

### 5.4 useI18nStore (Zustand)

**File:** `packages/frontend/src/i18n/useI18nStore.ts` (37 lines)

Holds `{ locale: Locale }` with Zustand persist (key: `scrumooth.locale`).

`setLocale(locale)`:

1. Updates Zustand state.
2. Writes `scrumooth_locale` cookie directly via `document.cookie` (1 year, `SameSite=Strict`, `Secure` in production).

`syncLocaleFromUser(locale)`: helper that updates both Zustand state AND the cookie in one call (used by `I18nProvider` on login).

**Why write the cookie directly** instead of relying on `i18next-browser-languagedetector`'s `caches: ['cookie']`: the cache write happens asynchronously after `changeLanguage()` resolves; writing the cookie synchronously in `setLocale` ensures the next request (even immediate) carries the new locale.

### 5.5 Type-Safe Translation Keys

**File:** `packages/frontend/src/i18n/types.ts`

Enumerates all keys per namespace as TypeScript types. **`enableSelector: true` is NOT yet enabled** in i18next config — keys are currently `string`-typed. Enabling it would make `t('dashboard.titile')` (typo) a compile-time error. Recommended future improvement (see §14).

### 5.6 Usage Pattern in Components

```tsx
import { useTranslation } from 'react-i18next';

function BacklogPage() {
  const { t } = useTranslation('backlog'); // lazy-loads /locales/{lng}/backlog.json
  return <h1>{t('title')}</h1>; // typed as string (until enableSelector)
}
```

For multiple namespaces: `useTranslation(['common', 'backlog'])` then `t('common:save')` / `t('backlog:title')`.

### 5.7 Lazy Namespace Loading per Route

Each route component declares its namespaces via `useTranslation()`. `i18next-http-backend` fetches the JSON on first use and caches in memory. No explicit `loadNamespaces()` call is needed. Optional prefetching on nav hover: `<NavLink onMouseEnter={() => i18nInstance.loadNamespaces(['backlog'])}>`.

### 5.8 Accessibility

- All `aria-label` values use `t()`.
- `document.documentElement.lang` and `dir` are set on locale change.
- Error UI in `I18nProvider` uses `role="alert"` and `aria-live="assertive"`.

---

## 6. Backend Implementation

### 6.1 Backend i18next Instance

**File:** `packages/backend/src/i18n/config.ts` (81 lines)

Initialized at startup via `i18next.createInstance()`. All 5 locales × 5 namespaces are bundled via `with { type: 'json' }` ESM import attributes (Node 22+/TS 5.3+):

```typescript
import enEmails from '../locales/en/emails.json' with { type: 'json' };
// ... 24 more imports
```

Options: `fallbackLng: DEFAULT_LOCALE`, `supportedLngs: [...SUPPORTED_LOCALES]`, `load: 'languageOnly'`, `defaultNS: 'errors'`, `returnNull: false`, `returnEmptyString: false`.

`void i18nInstance.init()` is called at module load (fire-and-forget; the promise resolves before the first request in practice).

### 6.2 LocaleResolver Middleware

**File:** `packages/backend/src/middleware/locale.middleware.ts` (50 lines)

**Priority (verified):** `Accept-Language` header FIRST → `User.locale` (database) → `DEFAULT_LOCALE`.

```typescript
// Simplified
const locale =
  parseAcceptLanguage(req.headers['accept-language']) ??
  (user?.locale && isSupportedLocale(user.locale) ? user.locale : DEFAULT_LOCALE);
updateRequestContext({ locale });
res.cookie('scrumooth_locale', locale, {
  maxAge: 365 * 24 * 60 * 60 * 1000, // milliseconds (Express res.cookie maxAge is ms, not seconds)
  httpOnly: false, // frontend JS reads the cookie for sync
  sameSite: 'strict',
  secure: isProduction,
});
```

**Accept-Language parsing is simplistic** — splits on comma, doesn't handle `q=` quality values or RFC 4647 lookup. Use `resolve-accept-language` package when adding region-qualified locales.

### 6.3 Request-Scoped `t()` Accessor

**File:** `packages/backend/src/i18n/requestT.ts` (13 lines)

```typescript
export function t(key: string, options?: Record<string, unknown>): string {
  return i18nInstance.t(key, { lng: getRequestLocale(), ...options });
}
```

`getRequestLocale()` reads from `AsyncLocalStorage`; returns `DEFAULT_LOCALE` if no context (silent fallback with `logger.warn`). Used in services, controllers, and email templates.

### 6.4 Localized Error Messages

Errors thrown in services use `t('errors:resourceNotFound', { resource: 'Sprint' })`. The error middleware (`error.middleware.ts`) renders the message via `t()` in the request locale.

**`requestT.ts` is safe to call from error middleware** because errors are thrown within the request scope.

### 6.5 Localized Validation Messages

**File:** `packages/backend/src/middleware/validation.middleware.ts`

`resolveMessage(key, params)` helper translates Zod error messages. **Migration is partial**: `validation.middleware.ts` uses `resolveMessage()`, but `auth.validation.ts` schemas still use raw English strings with `as unknown as [string, ...string[]]` double cast to satisfy TypeScript strict mode. The double cast is a workaround — the proper fix is to migrate `auth.validation.ts` to use translation keys.

### 6.6 Localized Email Templates

**File:** `packages/backend/src/services/email/templates/PasswordResetTemplate.ts`

**Implementation status: partial.** The subject, heading, bodyIntro, cta, expiresIn, and ignoreIfNotRequested strings are correctly resolved via `i18nInstance.getFixedT(data.locale, 'emails')`. However, several strings remain hardcoded English (lines 106, 136, 155, 175, 185, 196–200, 270, 273, 276, 294–312):

| String                                                                                   | Suggested key                                                   |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| "Click the button below to create a new password:"                                       | `passwordReset.buttonHint`                                      |
| "If the button above doesn't work, copy and paste the following link into your browser:" | `passwordReset.fallbackLinkHint`                                |
| "If you have any questions or need assistance, please contact our support team."         | `passwordReset.supportContact`                                  |
| "Hello {{recipientName}}," / "Need help? Contact us at" / "Thank you for using" / etc.   | `common.greeting`, `common.needHelp`, `common.thankYouForUsing` |

**Remediation:** add the missing keys to `emails.json` (all 5 locales), then replace the hardcoded literals with `t('…')` calls. `getBaseHtmlTemplate` and `getBaseTextTemplate` are not currently passed `t` — thread it through or refactor to receive a `Record<string, string>` of pre-resolved strings.

### 6.7 Localized Notifications

**File:** `packages/backend/src/services/notification.service.ts`

**Dual storage pattern (verified):** `createLocalized()` persists BOTH the rendered text (`title`, `message`) AND the canonical key/params (`messageKey`, `params`):

```typescript
return await prisma.notification.create({
  data: {
    title, // Rendered text for email/push fallback
    message, // Rendered text for email/push fallback
    messageKey: input.titleKey, // Canonical key for display-time re-translation
    params: input.messageParams ?? {}, // Canonical params
    // ...
  },
});
```

**Rationale:** (1) backward compat with consumers that read `title`/`message` directly; (2) re-translation in the user's current locale on the in-app UI; (3) stable audit trail even if translation keys are renamed.

**Known bug (line 76):** `messageKey: input.titleKey` persists the **title's** key into the `messageKey` column, not the message's key. Fix: `messageKey: input.messageKey ?? null`. Additionally, `params` stores only `messageParams` — title params are not preserved. Recommended refactor: introduce separate `titleKey`/`titleParams`/`messageKey`/`messageParams` columns, or consolidate under a single `i18n` JSON field.

### 6.8 Audit Logging of Locale Changes

When a user changes their locale via the API, the change is logged via the standard audit trail with action `user.locale.change`, metadata `{ oldLocale, newLocale }`. No separate i18n audit table.

---

## 7. Shared Package Integration

### 7.1 Constants — `packages/shared/src/constants/index.ts`

| Export                 | Type                                      | Purpose                                                                 |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `SUPPORTED_LOCALES`    | `readonly ['en', 'de', 'fr', 'it', 'es']` | Locale list                                                             |
| `Locale`               | Union type                                | `'en' \| 'de' \| 'fr' \| 'it' \| 'es'`                                  |
| `DEFAULT_LOCALE`       | `'en'`                                    | Fallback locale                                                         |
| `LOCALE_LABELS`        | `Record<Locale, string>`                  | Endonyms for the language switcher (`'English'`, `'Deutsch'`, etc.)     |
| `LOCALE_CURRENCIES`    | `Record<Locale, string>`                  | All `'EUR'` today                                                       |
| `DATE_INPUT_FORMATS`   | `Record<Locale, string>`                  | Locale-specific input format (`'dd/MM/yyyy'`, `'dd.MM.yyyy'`)           |
| `DATE_FORMAT_EXAMPLES` | `Record<Locale, string>`                  | Localized placeholders (`'dd/mm/yyyy'`, `'tt.mm.jjjj'`, `'jj/mm/aaaa'`) |
| `DATE_SEPARATORS`      | `Record<Locale, string>`                  | `'/'` or `'.'`                                                          |

### 7.2 Locale Utilities — `packages/shared/src/utils/locale.ts`

| Function                    | Purpose                         |
| --------------------------- | ------------------------------- |
| `isRTL(locale)`             | True for `ar`, `he`, `fa`, `ur` |
| `getDirection(locale)`      | `'ltr' \| 'rtl'`                |
| `getBaseLanguage(locale)`   | `'pt-BR'` → `'pt'`              |
| `isSupportedLocale(locale)` | Type guard                      |
| `normalizeLocale(locale)`   | Unsupported → `DEFAULT_LOCALE`  |

### 7.3 Formatters — `packages/shared/src/utils/formatters.ts`

**15 functions**, all locale-aware via `Record<Locale, …>` lookups:

| Function                                        | API used                  | Notes                                                        |
| ----------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `formatDate(date, locale, fmt='PP')`            | `date-fns`                | `DATE_FNS_LOCALES.en = enGB`                                 |
| `formatNumber(value, locale, opts?)`            | `Intl.NumberFormat`       |                                                              |
| `formatCurrency(value, locale, currency='EUR')` | `Intl.NumberFormat`       |                                                              |
| `formatRelativeTime(date, locale)`              | `Intl.RelativeTimeFormat` | Numeric: 'auto'                                              |
| `formatList(items, locale, type)`               | `Intl.ListFormat`         | Conjunction/disjunction                                      |
| `createCollator(locale, opts?)`                 | `Intl.Collator`           | sensitivity: 'base', numeric: true                           |
| `sortLocaleStrings(items, locale)`              | `Intl.Collator`           | Wraps createCollator                                         |
| `formatDateRange(start, end, locale, fmt)`      | `date-fns`                | Joins with en dash                                           |
| `formatDateRangeCompact(start, end, locale)`    | `date-fns`                | Alias of `formatDateRange('PP')`                             |
| `formatDateForInput(date, locale)`              | `date-fns`                | Uses `DATE_INPUT_FORMATS[locale]`                            |
| `parseDateFromInput(str, locale)`               | `date-fns`                | Returns ISO `YYYY-MM-DD` or `''`                             |
| `isValidDateForLocale(str, locale)`             | `date-fns`                |                                                              |
| `formatTime(date, locale)`                      | `Intl`                    | `hour12: false` (24-hour for all locales, European standard) |
| `formatDateTime(date, locale, fmt)`             | `date-fns` + `Intl`       | Combines date + time                                         |
| `formatChartDate(date, locale)`                 | `date-fns`                | `d MMM` format for chart axes                                |

**`date-fns` is a shared-package dependency** — both frontend and backend pick it up transitively via `@scrumooth/shared`.

---

## 8. Locale Detection & Fallback Flow

### 8.1 Frontend First Load

1. `I18nProvider` mounts. `i18nInstance.isInitialized` is false → state = `loading`.
2. `i18next-browser-languagedetector` reads `scrumooth_locale` cookie. If absent, reads `navigator.language`.
3. `i18next-http-backend` fetches `/locales/{lng}/common.json` and any namespaces requested by the mounted tree.
4. On success → `initialized` event → state = `ready`. On 15s timeout → state = `error` (retry UI shown).
5. `I18nProvider` syncs `useI18nStore.locale` from `i18nInstance.language`.
6. If authenticated user has `user.locale` and no explicit persisted preference, syncs to `user.locale`.

### 8.2 Frontend Language Switch

1. User clicks language switcher → `useI18nStore.setLocale(newLocale)`.
2. Zustand state updates → triggers `I18nProvider` effect.
3. `i18nInstance.changeLanguage(newLocale)` → `i18next-http-backend` fetches `/locales/{newLocale}/{ns}.json` for all loaded namespaces.
4. On success: `document.documentElement.lang = newLocale`, `dir = getDirection(newLocale)`, state = `ready`.
5. `setLocale` also writes `scrumooth_locale` cookie synchronously → next backend request carries the new locale.

### 8.3 Backend Request

1. `locale.middleware.ts` reads `Accept-Language` header → simplistic parse → first supported match.
2. If no match, reads `User.locale` from database (if authenticated).
3. If neither, uses `DEFAULT_LOCALE`.
4. `updateRequestContext({ locale })` stores in `AsyncLocalStorage`.
5. `res.cookie('scrumooth_locale', locale, ...)` re-syncs the cookie.
6. Services call `t('errors:…')` → `requestT.ts` reads locale from `AsyncLocalStorage` → `i18nInstance.t(key, { lng })`.

### 8.4 Fallback Chain

```
Missing key in {lng}/{ns}
  → fallbackLng: 'en' (per ADR-004)
  → /locales/en/{ns}.json
  → if still missing: parseMissingKeyHandler returns the key string
```

### 8.5 Network Failure

- **Frontend:** 15s init timeout → error UI with retry button. `i18nInstance.reloadResources()` re-fetches.
- **Backend:** Backend JSON is bundled at build time — no network failure possible. If `i18nInstance.init()` fails at startup, all `t()` calls return the key string (silent fallback).

---

## 9. Pluralization & Cultural Formatting

### 9.1 Pluralization

i18next uses native `Intl.PluralRules` (polyfilled by `intl-pluralrules`). No custom resolver.

**CLDR plural classes:**

| Locale | `one`    | `other`         |
| ------ | -------- | --------------- |
| `en`   | n = 1    | everything else |
| `de`   | n = 1    | everything else |
| `fr`   | n = 0, 1 | everything else |
| `it`   | n = 1    | everything else |
| `es`   | n = 1    | everything else |

**Key naming:** `taskCount`, `taskCount_one`, `taskCount_other`. i18next auto-selects the suffix based on `Intl.PluralRules(lng).select(count)`.

```json
{
  "taskCount_one": "{{count}} task",
  "taskCount_other": "{{count}} tasks"
}
```

### 9.2 Date & Time Formatting

All date formatting flows through `@scrumooth/shared` formatters (`packages/shared/src/utils/formatters.ts`). Date-fns locale data: `{ en: enGB, de, fr, it, es }` — English uses `enGB` (European audience → day-first dates, 24-hour time).

**`formatDate(date, locale, fmt)` — date-fns tokens (`PP` = medium, `PPPP` = long):**

| Locale      | `PP`            | `PPPP`                        |
| ----------- | --------------- | ----------------------------- |
| `en` (enGB) | `18 Jul 2026`   | `Saturday, 18 July 2026`      |
| `de`        | `18. Juli 2026` | `Samstag, 18. Juli 2026`      |
| `fr`        | `18 juil. 2026` | `samedi 18 juillet 2026`      |
| `it`        | `18 lug 2026`   | `sabato 18 luglio 2026`       |
| `es`        | `18 jul 2026`   | `sábado, 18 de julio de 2026` |

**`formatDateForInput(date, locale)` — input field format via `DATE_INPUT_FORMATS`:**

| Locale | Format       | Output       | Placeholder (`DATE_FORMAT_EXAMPLES`) |
| ------ | ------------ | ------------ | ------------------------------------ |
| `en`   | `dd/MM/yyyy` | `18/07/2026` | `dd/mm/yyyy`                         |
| `de`   | `dd.MM.yyyy` | `18.07.2026` | `tt.mm.jjjj`                         |
| `fr`   | `dd/MM/yyyy` | `18/07/2026` | `jj/mm/aaaa`                         |
| `it`   | `dd/MM/yyyy` | `18/07/2026` | `gg/mm/aaaa`                         |
| `es`   | `dd/MM/yyyy` | `18/07/2026` | `dd/mm/aaaa`                         |

**`formatTime(date, locale)` — `Intl.DateTimeFormat` with `hour12: false` (24-hour for all locales):**

All locales produce `HH:MM` 24-hour output (e.g., `14:30`). English uses 24-hour to align with `enGB` (British English defaults to 24-hour in business/technical contexts); the target organization is European where 24-hour is standard.

**`formatChartDate(date, locale)` — compact `d MMM` for chart axes:**

| Locale | Output     |
| ------ | ---------- |
| `en`   | `18 Jul`   |
| `de`   | `18 Juli`  |
| `fr`   | `18 juil.` |
| `it`   | `18 lug`   |
| `es`   | `18 jul`   |

### 9.3 Number & Currency

- `formatNumber(1234.56, 'de')` → `'1.234,56'` (dot thousands, comma decimal)
- `formatNumber(1234.56, 'en')` → `'1,234.56'`
- `formatCurrency(1234.56, 'fr')` → `'1 234,56 €'` (non-breaking space thousands)

### 9.4 Relative Time

- `formatRelativeTime` uses `Intl.RelativeTimeFormat(lng, { numeric: 'auto' })`:
  - `en`: "yesterday", "2 days ago", "in 3 hours"
  - `de`: "gestern", "vor 2 Tagen", "in 3 Stunden"

### 9.5 List Formatting

- `formatList(['A', 'B', 'C'], 'en')` → `'A, B, and C'`
- `formatList(['A', 'B', 'C'], 'de')` → `'A, B und C'`

### 9.6 Collation

`sortLocaleStrings(['João', 'Ana', 'Álvaro'], 'pt')` → `['Álvaro', 'Ana', 'João']` (accented `Á` sorts with `A` under `sensitivity: 'base'`).

### 9.7 Timezone Handling

All timestamps are stored in UTC in the database (`Timestamptz(3)`). The frontend relies on the browser's built-in `Intl.DateTimeFormat()` API to display times in the user's local timezone automatically — no per-user timezone setting is required. Locale determines **format** (e.g., `dd/MM/yyyy` vs `MM/dd/yyyy`); the browser's timezone determines **instant** (e.g., `2026-07-18T14:30:00Z` displayed as `15:30` in CET, `14:30` in UTC).

For self-hosted deployments where users typically share one or a few timezones, browser-detected timezone is sufficient and eliminates the complexity of per-user timezone configuration. DST transitions are handled automatically by the IANA timezone database built into browsers.

---

## 10. Translation File Organization

### 10.1 File Layout

```
packages/frontend/public/locales/{lng}/{ns}.json   ← 16 ns × 5 locales = 80 files
packages/backend/src/locales/{lng}/{ns}.json        ← 5 ns × 5 locales = 25 files
packages/shared/i18n/glossary.json                  ← 1 file (Scrum terms per locale)
```

### 10.2 JSON Schema

Flat key-value with optional nesting and interpolation:

```json
{
  "title": "Backlog",
  "item": {
    "create": "Create item",
    "delete": "Delete {{name}}?"
  },
  "taskCount_one": "{{count}} task",
  "taskCount_other": "{{count}} tasks"
}
```

- Interpolation: `{{name}}` (i18next default)
- Plural suffix: `_one`, `_other` (only CLDR classes used by our 5 locales; `_many` not needed)
- No ICU MessageFormat (not needed for current locales)

### 10.3 Key Naming Conventions

- `camelCase` for keys
- Dot-separated namespaces: `backlog:item.create` (i18next resolves via `useTranslation('backlog')`)
- Avoid concatenating keys at runtime (`t('errors.' + errorType)`) — use a lookup table instead, for type safety and grep-ability

### 10.4 Terminology Glossary

`packages/shared/i18n/glossary.json` defines canonical translations of Scrum terms per locale, sourced from the official 2020 Scrum Guide translations. Examples:

- "Sprint Review" → `de: "Sprint Review"`, `fr: "Revue de Sprint"`, `es: "Revisión del Sprint"`, `it: "Revisione dello Sprint"`
- "Increment" → `de: "Inkrement"`, `fr: "Incrément"`, `es: "Incremento"`, `it: "Incremento"`

The `i18n:glossary` script flags any locale JSON value that uses a non-glossary translation of a Scrum term. Locale files **must** use glossary-prescribed translations for Scrum terms.

---

## 11. Translation Workflow & CI Gates

### 11.1 Developer Workflow (Adding a New String)

1. Add the key to `packages/frontend/public/locales/en/{ns}.json` (English is the source of truth).
2. Add the same key (value `__pending__` or translated) to `de`, `fr`, `es`, `it` JSON files.
3. Use `t('ns:key')` in the component.
4. Run `pnpm run i18n:check` locally → must pass.
5. PR review ensures translations are present (or marked `__pending__` for translator handoff).

### 11.2 Translator Workflow

- **Option A (TMS):** Push `en/*.json` to Tolgee/Crowdin/Phrase. Translators work in the TMS UI; pull translated JSON via TMS CLI. Best for ongoing maintenance.
- **Option B (PR-based):** Send `en/*.json` + `glossary.json` to a translator. They return translated JSON. Open a PR.
- **Option C (LLM-MTPE):** LLM produces first-pass translation (always pass `glossary.json` as context); human reviewer performs Machine Translation Post-Editing. Run `i18n:glossary` after every LLM pass to catch terminology drift. Never auto-merge LLM output without review.

### 11.3 CI Pipeline Stages

```yaml
- name: i18n validation
  run: pnpm run i18n:check # key completeness, structure, no extra keys

- name: i18n glossary compliance
  run: pnpm run i18n:glossary # Scrum terms match glossary.json

- name: i18n completeness report
  run: pnpm run i18n:completeness # informational; does not fail CI
```

**CI gate fails if:** any locale has missing keys, extra keys, or invalid JSON. Does NOT fail on `__pending__` count (allows incremental translation).

### 11.4 Concurrency & Conflict Resolution

Translation JSON files are sorted alphabetically by key to keep merge conflicts localized to the actual changed key. Sorting is a manual/PR-review convention (no `i18n:sort` script exists today).

### 11.5 Translation Key Lifecycle

1. **Add** key to `en/{ns}.json` first.
2. **Translate** to other locales (mark `__pending__` if translator not yet available).
3. **Rename** is discouraged — prefer adding a new key and deprecating the old. If rename is unavoidable, update all locales in the same PR.
4. **Delete** only when no code references the key. The `i18n:extract` script can help find unused keys (not fully automated).

---

## 12. Testing Strategy

### 12.1 Unit Tests

- **Pluralization:** `Intl.PluralRules(lng).select(n)` returns expected class for each locale.
- **Formatters:** `formatDate`, `formatNumber`, etc. produce expected output per locale.
- **`isSupportedLocale`, `normalizeLocale`, `getDirection`** — boundary cases.

### 12.2 Component Tests

Components that render translated text use `useTranslation` with a test i18next instance preloaded with the required namespace. Avoid asserting on English string literals — assert on translation keys or `data-testid`.

### 12.3 E2E Tests (Playwright)

- Use `data-testid` attributes (not text selectors) to find elements.
- Pre-load namespaces via the E2E fixture (`packages/frontend/e2e/fixtures/index.ts`).
- One smoke test per locale: switch language, verify `document.documentElement.lang` matches, verify no `__pending__` strings visible.

### 12.4 CI Translation Completeness

`pnpm run i18n:completeness` produces a per-locale coverage report. Run in CI as informational; does not fail the build (allows incremental translation).

---

## 13. New Language Onboarding

This section is a condensed playbook for adding a new locale. The running example is **`pt` (Portuguese — Portugal)**.

### 13.1 Work Estimate

| Phase                            | Effort               |
| -------------------------------- | -------------------- |
| Locale file scaffolding          | 0.5 engineer-day     |
| Code & type changes              | 0.5 engineer-day     |
| Translation (initial, parallel)  | 2–5 translator-days  |
| Glossary alignment               | 0.5 engineer-day     |
| Date/time/number/pluralization   | 0.25 engineer-day    |
| Testing                          | 1 engineer-day       |
| CI / completeness gate           | 0.25 engineer-day    |
| Documentation & release          | 0.25 engineer-day    |
| **Total engineering**            | **~3 engineer-days** |
| **Total translation** (parallel) | 2–5 translator-days  |

Adding an RTL language (e.g., `ar`) adds ~2–3 engineer-days for CSS auditing and email template `dir="rtl"` additions.

### 13.2 Locale File Scaffolding

Copy `en/` to `pt/` and replace values with `__pending__`:

```powershell
$dest = "packages/frontend/public/locales/pt"
New-Item -ItemType Directory -Path $dest -Force
Get-ChildItem packages/frontend/public/locales/en -Filter *.json | ForEach-Object {
  # ... copy JSON, replace string values with "__pending__"
}
```

Repeat for backend: `packages/backend/src/locales/pt/{5 namespaces}.json`.

**Why `__pending__` and not empty strings:** empty strings pass `i18n:check` (key exists) and render blank. `__pending__` is visually obvious in the UI during development.

### 13.3 Code Modifications

#### `packages/shared/src/constants/index.ts`

Add `pt` to all `Record<Locale, …>` constants. TypeScript immediately flags every record missing the new key.

```typescript
export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'es', 'pt'] as const;
export const LOCALE_LABELS = { /* ... */ pt: 'Português' }; // endonym
export const LOCALE_CURRENCIES = { /* ... */ pt: 'EUR' };
export const DATE_INPUT_FORMATS = { /* ... */ pt: 'dd/MM/yyyy' };
export const DATE_FORMAT_EXAMPLES = { /* ... */ pt: 'dd/mm/aaaa' };
export const DATE_SEPARATORS = { /* ... */ pt: '/' };
```

#### `packages/shared/src/utils/formatters.ts`

```typescript
import { enGB, de, fr, it, es, pt } from 'date-fns/locale';
const DATE_FNS_LOCALES = { /* ... */ pt };
```

All 15 formatters auto-pick up the new locale via `Record<Locale, …>`. No per-formatter changes.

#### `packages/backend/src/i18n/config.ts`

Add 5 `with { type: 'json' }` imports and register `pt` in `resources`. The `supportedLngs: [...SUPPORTED_LOCALES]` option auto-picks up the new locale.

#### `packages/frontend/src/i18n/config.ts`

**No code change.** Frontend uses `i18next-http-backend` to fetch JSON over HTTP. Adding `pt/*.json` files to `public/locales/pt/` is sufficient.

#### `packages/frontend/src/i18n/types.ts`

If `types.ts` enumerates locales, add `pt`. (Verify by reading the file before editing.)

#### Database / Prisma

If `User.locale` is a free-text column, no change. If it has a CHECK constraint or enum, add `pt` via a Prisma migration.

#### Validation Schemas

If schemas use `z.enum([...SUPPORTED_LOCALES])`, no change. If they hardcode the enum, update.

### 13.4 Pluralization Rules

Portuguese (`pt-PT` and `pt-BR`) uses CLDR `one`/`other` classes. **`0` is `one`** (like French and Italian), so "0 tarefas" is incorrect — it should be "0 tarefa".

Verify in browser console: `new Intl.PluralRules('pt').select(0)` → `'one'`.

JSON key naming:

```json
{
  "taskCount_one": "{{count}} tarefa",
  "taskCount_other": "{{count}} tarefas"
}
```

### 13.5 Date / Time / Number Formatting

All automatic via `Intl` + `date-fns`:

- `formatDate(d, 'pt', 'PP')` → `'18 de jul. de 2026'`
- `formatDateForInput(d, 'pt')` → `'18/07/2026'`
- `formatTime(d, 'pt')` → `'14:30'` (24-hour, per `hour12: false`)
- `formatNumber(1234.56, 'pt')` → `'1.234,56'`
- `formatCurrency(1234.56, 'pt')` → `'1.234,56 €'`
- `formatRelativeTime` → "há 2 dias", "em 3 horas"
- `formatList(['A', 'B', 'C'], 'pt')` → `'A, B e C'`

No code changes needed — only the `DATE_INPUT_FORMATS.pt` / `DATE_FORMAT_EXAMPLES.pt` / `DATE_SEPARATORS.pt` constants and the `date-fns/locale` `pt` import.

### 13.6 Glossary Alignment

Add `pt` entries to `packages/shared/i18n/glossary.json` (sourced from the official 2020 Scrum Guide Portuguese translation). Run `pnpm run i18n:glossary` — it will flag any locale JSON value that uses a non-glossary translation of a Scrum term.

### 13.7 Testing

- **Unit:** pluralization (`select(0)` → `'one'`), formatters, `isSupportedLocale('pt')`.
- **E2E smoke:** switch to `pt`, verify `document.documentElement.lang === 'pt'`, verify no `__pending__` visible.
- **Pseudo-localization (optional):** temporarily replace `pt/*.json` values with pseudo-localized versions (`~[Éñträär]~`) to verify UI layout handles accented characters and ~30% text expansion.

### 13.8 Onboarding Checklist

- [ ] Create `packages/frontend/public/locales/pt/{16 ns}.json` (scaffold with `__pending__`)
- [ ] Create `packages/backend/src/locales/pt/{5 ns}.json` (scaffold with `__pending__`)
- [ ] Update `packages/shared/src/constants/index.ts` (6 constants)
- [ ] Update `packages/shared/src/utils/formatters.ts` (date-fns locale import + `DATE_FNS_LOCALES`)
- [ ] Update `packages/backend/src/i18n/config.ts` (5 imports + `resources.pt`)
- [ ] Update `packages/frontend/src/i18n/types.ts` (if it enumerates locales)
- [ ] Update Prisma schema if `User.locale` has a CHECK constraint or enum
- [ ] Update validation schemas that hardcode locale enums
- [ ] Add `pt` entries to `packages/shared/i18n/glossary.json`
- [ ] Translate `__pending__` values (TMS / PR / LLM-MTPE)
- [ ] Add pluralization unit tests
- [ ] Add formatter unit tests
- [ ] Add E2E smoke test
- [ ] Run `i18n:check`, `i18n:completeness`, `i18n:glossary` — all pass
- [ ] Update user guide, release notes; notify support
- [ ] Final: `pnpm run typecheck && pnpm run lint && pnpm run test`

### 13.9 Special Cases

- **Region-qualified locales (`en-US`, `pt-BR`):** remove `load: 'languageOnly'` from i18next config, add the region-qualified tag to `SUPPORTED_LOCALES`, update `normalizeLocale` logic. ~2 engineer-days. Not recommended unless real user need.
- **RTL languages (`ar`, `he`):** add to `RTL_LANGUAGES` in `locale.ts`, audit CSS Modules for physical properties (stylelint catches these), test email templates in RTL, configure Chart.js axis direction. ~2–3 engineer-days extra.
- **Languages without `date-fns` locale data:** rare. Use closest related locale, or fall back to `Intl.DateTimeFormat` for that locale (requires changes to `formatDate`).

---

## 14. Modern Best Practices Alignment (2026)

| Item                                                  | Current State                                                          | Recommendation                                                                                         | Priority | Effort  |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- | ------- |
| **i18next v26 Selector API** (`enableSelector: true`) | Not enabled — `t()` keys are `string`-typed                            | Enable for compile-time key checking                                                                   | Medium   | 0.5 day |
| **`resolve-accept-language`**                         | Backend parses `Accept-Language` simplistically (no `q=`, no RFC 4647) | Install package, replace parsing                                                                       | Medium   | 0.5 day |
| **Pseudo-localization**                               | No tooling — layout bugs caught only after translator delivery         | Add `i18n:pseudo` script + dev-only `'pseudo'` locale                                                  | Medium   | 1 day   |
| **a11y + i18n E2E**                                   | No axe-core test per locale                                            | Add `AxeBuilder` test loop over `SUPPORTED_LOCALES`                                                    | Medium   | 1 day   |
| **i18next Formatter API**                             | All formatting via explicit `@scrumooth/shared` calls                  | Register custom formatters for `{{date, date}}` syntax in translations                                 | Low      | 1 day   |
| **TMS integration (Tolgee)**                          | PR-based workflow only                                                 | Set up Tolgee (self-hosted, open-source) for in-context editing                                        | Low      | 2 days  |
| **RTL dry-run test**                                  | CSS groundwork in place, no RTL locale, no test                        | Add fake `'pseudo-rtl'` locale + E2E test asserting no overflow                                        | Low      | 1 day   |
| **Temporal API (TC39 Stage 4, March 2026)**           | Uses `Date` + `date-fns`                                               | Migrate when Node 24 LTS ships (Q4 2026)                                                               | Low      | 2 days  |
| **ICU MessageFormat 2.0**                             | i18next v1 interpolation (`{{name}}`, `_one`/`_other` suffix)          | Do NOT migrate — i18next ecosystem has not adopted MF2; current syntax sufficient for European locales | Low      | 5+ days |
| **LLM-assisted translation prompt template**          | No structured prompt; translators may use LLMs informally              | Add `docs/i18n/llm-translation-prompt.md` with glossary context                                        | Low      | 0.5 day |

**Triggers for revisit:** locale count > 7 (consider TMS); adding first RTL/gendered language (consider ICU MF2); Node 24 LTS (consider Temporal API).

---

## 15. File Inventory

| Location                             | Locales                  | Namespaces per locale | Total files |
| ------------------------------------ | ------------------------ | --------------------- | ----------- |
| `packages/frontend/public/locales/`  | 5 (en, de, fr, it, es)   | 16                    | 80          |
| `packages/backend/src/locales/`      | 5 (en, de, fr, it, es)   | 5                     | 25          |
| `packages/shared/i18n/glossary.json` | 1 (multi-locale content) | —                     | 1           |
| **Total i18n resource files**        |                          |                       | **106**     |

**Frontend namespaces (16):** `auth`, `backlog`, `common`, `daily-scrum`, `dashboard`, `errors`, `impediments`, `increments`, `notifications`, `reports`, `retrospective`, `sprint`, `sprint-review`, `settings`, `team`, `validation`.

**Backend namespaces (5):** `emails`, `notifications`, `errors`, `validation`, `retrospectives`.

**Key source files:**

| File                                                   | Purpose                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `packages/frontend/src/i18n/config.ts`                 | i18next init (75 lines)                                     |
| `packages/frontend/src/i18n/I18nProvider.tsx`          | React provider (246 lines: 15s timeout, error/retry UI)     |
| `packages/frontend/src/i18n/useI18nStore.ts`           | Zustand locale store + cookie sync (37 lines)               |
| `packages/frontend/src/i18n/types.ts`                  | TypeScript key types (16 namespaces)                        |
| `packages/backend/src/i18n/config.ts`                  | Backend i18next instance (81 lines, 5 ns × 5 locales)       |
| `packages/backend/src/i18n/requestT.ts`                | Per-request `t()` accessor (13 lines)                       |
| `packages/backend/src/middleware/locale.middleware.ts` | Locale resolver (50 lines)                                  |
| `packages/backend/src/utils/requestContext.ts`         | `AsyncLocalStorage` for request-scoped locale (86 lines)    |
| `packages/shared/src/constants/index.ts`               | `SUPPORTED_LOCALES`, `LOCALE_LABELS`, date format constants |
| `packages/shared/src/utils/locale.ts`                  | `isRTL`, `getDirection`, `normalizeLocale` (24 lines)       |
| `packages/shared/src/utils/formatters.ts`              | 15 locale-aware formatters (201 lines)                      |
| `packages/shared/i18n/glossary.json`                   | Scrum term translations per locale                          |

**Tooling scripts (in `scripts/i18n/`):**

| Script                    | npm command                  | Purpose                                     |
| ------------------------- | ---------------------------- | ------------------------------------------- |
| `validate.mjs`            | `pnpm run i18n:check`        | CI validation (key completeness, structure) |
| `extract.mjs`             | `pnpm run i18n:extract`      | Hardcoded-string extraction assist          |
| `completeness-report.mjs` | `pnpm run i18n:completeness` | Per-locale coverage report                  |
| `sync-glossary.mjs`       | `pnpm run i18n:glossary`     | Scrum term glossary compliance              |

---

**End of Document**
