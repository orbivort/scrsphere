# Multi-Language Support (i18n) Architecture

> **Status:** Proposed
> **Author:** Architecture Team
> **Last Updated:** 2026-07-11
> **Reviewers:** Frontend, Backend, Product, QA
> **Target Languages:** English (en, default), German (de), French (fr), Spanish (es), Italian (it)
> **Directionality:** LTR (initial), RTL-ready architecture (future)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Requirements](#2-requirements)
3. [Current State Assessment](#3-current-state-assessment)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Architecture Decision Records (ADRs)](#5-architecture-decision-records-adrs)
6. [Database Schema Changes](#6-database-schema-changes)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Backend Implementation](#8-backend-implementation)
9. [Shared Package Integration](#9-shared-package-integration)
10. [Translation File Format & Organization](#10-translation-file-format--organization)
11. [Pluralization & Cultural Formatting](#11-pluralization--cultural-formatting)
12. [Fallback Mechanisms](#12-fallback-mechanisms)
13. [Translation Workflow & Tooling](#13-translation-workflow--tooling)
14. [Performance Optimization](#14-performance-optimization)
15. [RTL-Ready Architecture](#15-rtl-ready-architecture)
16. [Testing Strategy](#16-testing-strategy)
17. [Security Considerations](#17-security-considerations)
18. [Risks & Mitigation Strategies](#18-risks--mitigation-strategies)
19. [Implementation Roadmap](#19-implementation-roadmap)
20. [Appendices](#20-appendices)

---

## 1. Executive Summary

Scrumooth is an Agile Scrum Lifecycle Management System used by an 80-person European organization across 8 teams. As the platform scales across a multilingual European user base, a comprehensive internationalization (i18n) system is required to support English (default), German, French, Spanish, and Italian, with an architecture ready for future Right-to-Left (RTL) language expansion.

This document defines the end-to-end i18n architecture spanning the monorepo's three packages — **frontend** (React 19 + Vite), **backend** (Express + Prisma + PostgreSQL), and **shared** (types, constants, utilities). It establishes a structured, namespaced translation file format; dynamic language switching without page reloads; complete coverage of user-facing text including emails and notifications; ICU-compatible pluralization and locale-aware formatting for dates, numbers, and currencies; a maintainable translator workflow with terminology glossary; multi-tier fallback mechanisms; and performance optimizations including namespace-based lazy loading and CDN-cached language bundles.

The design is compatible with the existing layered architecture, reuses the already-present `date-fns` dependency, integrates with the Zustand stores and TanStack Query cache, and is delivered through a phased roadmap that minimizes disruption to ongoing feature development.

**Key decisions:** adopt `i18next` + `react-i18next` (frontend) and a lightweight `i18next` instance (backend); JSON translation files organized by namespace and locale; persist user locale in the `User.locale` column with browser-detection fallback; ICU MessageFormat for pluralization; locale-aware formatting via `date-fns` (dates) and `Intl` APIs (numbers/currencies); and a CI-enforced translation completeness gate.

---

## 2. Requirements

### 2.1 Functional Requirements

| ID    | Requirement                                                                                                      | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| FR-1  | Support 5 languages: en (default), de, fr, es, it                                                                | P0       |
| FR-2  | Dynamic language switching at runtime without page reload                                                        | P0       |
| FR-3  | All user-facing UI text (labels, buttons, toasts, errors, empty states, tooltips, aria-labels) internationalized | P0       |
| FR-4  | Backend user-facing content (emails, notification titles/messages, validation error messages) internationalized  | P0       |
| FR-5  | Locale-aware date formatting (e.g., 31/01/2026 vs 01/31/2026)                                                    | P0       |
| FR-6  | Locale-aware number formatting (e.g., 1.234,56 vs 1,234.56)                                                      | P0       |
| FR-7  | Locale-aware currency formatting                                                                                 | P1       |
| FR-8  | Pluralization support (e.g., "1 task" vs "2 tasks" + CLDR rules per locale)                                      | P0       |
| FR-9  | Gender/role-aware interpolation where applicable (e.g., Scrum Master, Product Owner, Developer)                  | P1       |
| FR-10 | Fallback chain: locale → base language → default (en) → key with warning                                         | P0       |
| FR-11 | Persist user's language preference in the database (User.locale)                                                 | P0       |
| FR-12 | Detect language from (a) user profile, (b) Accept-Language header / browser setting, (c) default                 | P0       |
| FR-13 | Allow guests (unauthenticated) to switch language via UI, persisted in localStorage                              | P0       |
| FR-14 | Maintain consistent terminology via a glossary enforced in CI                                                    | P1       |
| FR-15 | Provide a translator workflow for adding/updating translations without code changes                              | P1       |
| FR-16 | Architecture must be RTL-ready (logical CSS properties, directional abstraction) for future Arabic/Hebrew        | P1       |
| FR-17 | Locale-aware relative time ("2 days ago", "in 3 hours")                                                          | P1       |
| FR-18 | Locale-aware list formatting ("A, B, and C" vs "A, B et C")                                                      | P2       |

### 2.2 Non-Functional Requirements

| ID     | Requirement                                            | Target                                                               |
| ------ | ------------------------------------------------------ | -------------------------------------------------------------------- |
| NFR-1  | Initial language bundle load (per namespace)           | ≤ 30 KB gzipped                                                      |
| NFR-2  | Language switch latency (after bundle cached)          | < 50 ms (no re-fetch)                                                |
| NFR-3  | Language switch latency (first switch to a new locale) | < 200 ms (fetch + parse)                                             |
| NFR-4  | No layout shift (CLS) caused by language switching     | CLS = 0                                                              |
| NFR-5  | Translation coverage gate in CI                        | 100% of keys present in all 5 locales (or explicitly marked missing) |
| NFR-6  | Runtime overhead of `t()` calls                        | < 0.1 ms per call                                                    |
| NFR-7  | Backwards compatibility                                | No breaking changes to existing API contracts; locale is opt-in      |
| NFR-8  | Accessibility                                          | `lang` and `dir` attributes updated on `<html>` on language change   |
| NFR-9  | Type safety                                            | Translation keys are type-checked at compile time (no magic strings) |
| NFR-10 | Bundle size impact                                     | Default locale (en) bundled; other locales lazy-loaded               |

### 2.3 Constraints

- **Monorepo structure:** Must integrate with `packages/backend`, `packages/frontend`, `packages/shared`.
- **Package manager:** `pnpm` only (enforced via preinstall scripts).
- **TypeScript strict mode:** All i18n code must pass `strict: true`, `noUncheckedIndexedAccess`.
- **Existing dependencies:** Reuse `date-fns` (already present). Avoid heavy new dependencies where possible.
- **Self-hosted:** No dependency on external translation SaaS at runtime (offline-capable). Translation tooling may use external services during build.
- **PostgreSQL 18+:** Locale storage must use the existing Prisma/Postgres stack.
- **No `any` types:** All i18n TypeScript code must follow project ESLint rules.

---

## 3. Current State Assessment

### 3.1 What Exists Today

| Area                   | Current State                                                                                                                                                                                                                                                                              | i18n Gap                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| **Database**           | `User` model has no `locale` field                                                                                                                                                                                                                                                         | No persistence of language preference                |
| **Frontend pages**     | All text is hardcoded English (e.g., [LoginPage.tsx](file:///e:/ws1/ov/ce/scrumooth/packages/frontend/src/pages/Auth/LoginPage.tsx) has 30+ hardcoded strings)                                                                                                                             | Every string must be extracted                       |
| **Navigation**         | [navigation.ts](file:///e:/ws1/ov/ce/scrumooth/packages/frontend/src/config/navigation.ts) hardcodes labels ("Dashboard", "Product Goals", etc.)                                                                                                                                           | Labels need translation keys                         |
| **Frontend stores**    | Zustand stores (`useAuthStore`, `useSessionStore`, `useTeamStore`) — no locale store                                                                                                                                                                                                       | Need a `useI18nStore` for locale                     |
| **Backend errors**     | Custom error classes ([errors.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/utils/errors.ts)) throw English messages                                                                                                                                                             | Error messages need translation keys                 |
| **Email templates**    | [PasswordResetTemplate.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/services/email/templates/PasswordResetTemplate.ts), [WelcomeEmailTemplate.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/services/email/templates/WelcomeEmailTemplate.ts) — all English hardcoded | Templates need locale-aware rendering                |
| **Notifications**      | `NotificationService.create()` accepts raw `title`/`message` strings                                                                                                                                                                                                                       | Should accept keys + params, resolve per-user locale |
| **Dates**              | `date-fns` v4 already a frontend dependency                                                                                                                                                                                                                                                | Not locale-aware yet; need `date-fns/locale` imports |
| **Numbers/currencies** | No formatting library; raw `toString()` usage                                                                                                                                                                                                                                              | Need `Intl.NumberFormat` integration                 |
| **Shared package**     | Types, constants, utilities — no i18n primitives                                                                                                                                                                                                                                           | Needs `Locale` type, `SUPPORTED_LOCALES`, formatters |
| **Config**             | [backend config](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/config/index.ts) has no i18n config                                                                                                                                                                                   | Need `i18n` config section                           |
| **CI/CD**              | No translation validation step                                                                                                                                                                                                                                                             | Need completeness + lint gate                        |

### 3.2 Scale of Effort

The frontend has ~30 pages, ~50 feature components, ~40 common components, and ~30 hooks. Estimated **~1,500–2,000 translatable strings** across the UI, plus ~200 backend strings (emails, notifications, errors, validation messages).

---

## 4. High-Level Architecture

### 4.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                           │
│                                                                         │
│  ┌──────────────┐   ┌─────────────────┐   ┌──────────────────────────┐ │
│  │  Language    │──▶│  I18nProvider   │──▶│  React Component Tree    │ │
│  │  Switcher UI │   │  (react-i18next)│   │  useTranslation() hook   │ │
│  └──────────────┘   └────────┬────────┘   └──────────────────────────┘ │
│         ▲                    │                        │                 │
│         │                    │ lazy-load              │ format          │
│         │                    ▼                        ▼                 │
│  ┌──────┴───────┐   ┌─────────────────┐   ┌──────────────────────────┐ │
│  │ useI18nStore │   │  Locale Bundles │   │  Formatters (date/num/   │ │
│  │ (Zustand)    │   │  /locales/{lng} │   │  currency/plural)        │ │
│  │ locale, dir  │   │  /{ns}.json     │   │  date-fns + Intl API     │ │
│  └──────┬───────┘   └─────────────────┘   └──────────────────────────┘ │
│         │ localStorage                                                     │
└─────────┼─────────────────────────────────────────────────────────────────┘
          │ Accept-Language header + locale cookie
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Express)                             │
│                                                                         │
│  ┌──────────────┐   ┌─────────────────┐   ┌──────────────────────────┐ │
│  │ Accept-      │──▶│ LocaleResolver  │──▶│  i18next (backend inst.) │ │
│  │ Language MW  │   │  middleware     │   │  t(key, { lng, ... })    │ │
│  └──────────────┘   └────────┬────────┘   └───────────┬──────────────┘ │
│                              │                         │                │
│         ┌────────────────────┼─────────────────────────┼──────────┐     │
│         ▼                    ▼                         ▼          ▼     │
│  ┌──────────────┐   ┌─────────────────┐   ┌──────────────┐ ┌────────┐ │
│  │ EmailService │   │ Notification    │   │ Error        │ │Valid-  │ │
│  │ (templates   │   │ Service         │   │ Middleware   │ │ation   │ │
│  │ per locale)  │   │ (per-user lng)  │   │ (localized   │ │(msgs)  │ │
│  └──────────────┘   └─────────────────┘   │  messages)   │ └────────┘ │
│                                           └──────────────┘            │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ Prisma
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL (Prisma)                              │
│  ┌─────────────┐         ┌─────────────────────────────────────────┐   │
│  │  users      │         │  ADD COLUMN locale TEXT DEFAULT 'en'    │   │
│  │  ...        │         │  + CHECK (locale IN ('en','de','fr'...))│   │
│  └─────────────┘         └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        SHARED PACKAGE                                   │
│  • Locale type  • SUPPORTED_LOCALES  • DEFAULT_LOCALE                  │
│  • Locale utility functions (isRTL, getBaseLanguage, normalizeLocale)   │
│  • Shared translation key type definitions (optional compile-time)      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                                   │
│  • i18n-lint (validate JSON structure, no missing keys)                │
│  • i18n-completeness (compare all locales against en baseline)         │
│  • terminology-glossary check                                           │
│  • TypeScript key validation (frontend)                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow: Language Switching

```
User clicks "Deutsch" in Language Switcher
        │
        ▼
useI18nStore.setLocale('de')
        │
        ├─▶ i18next.changeLanguage('de')  (triggers lazy fetch of /locales/de/*.json)
        │         │
        │         ▼
        │    React re-render via useTranslation() consumers
        │
        ├─▶ localStorage.setItem('scrumooth.locale', 'de')
        │
        ├─▶ document.documentElement.lang = 'de'
        ├─▶ document.documentElement.dir = 'ltr'
        │
        └─▶ PUT /api/v1/auth/me/profile { locale: 'de' }  (if authenticated)
                  │
                  ▼
            Backend persists User.locale = 'de'
            Audit-logs USER.UPDATE (§8.7)
            Sets locale cookie (1 year, for SSR/refresh)
```

---

## 5. Architecture Decision Records (ADRs)

### ADR-001: i18n Library Selection — `i18next` + `react-i18next`

**Status:** Accepted
**Date:** 2026-07-11

**Context.** The frontend (React 19 + Vite) needs an i18n runtime. The backend (Node.js + Express) needs lightweight message resolution for emails, notifications, and errors. Candidates evaluated: `i18next`, `react-intl` (FormatJS), `lingui`, `next-intl`, and a custom solution.

**Decision.** Adopt `i18next` as the core engine for both frontend and backend, with `react-i18next` bindings on the frontend.

**Rationale.**

| Criterion                 | i18next          | react-intl      | lingui            | Custom  |
| ------------------------- | ---------------- | --------------- | ----------------- | ------- |
| Framework agnostic core   | ✅               | ❌ (React-only) | ⚠️ (macro-based)  | ✅      |
| Runtime vs compile-time   | Runtime          | Runtime         | Compile-time      | Runtime |
| Pluralization (ICU/CLDR)  | ✅ (intl plugin) | ✅ (ICU native) | ✅                | Manual  |
| Lazy loading namespaces   | ✅ Built-in      | ⚠️ Manual       | ✅                | Manual  |
| Backend (non-React) usage | ✅ Same API      | ❌              | ⚠️                | ✅      |
| Ecosystem & maturity      | Very high        | High            | Medium            | —       |
| TypeScript support        | ✅ Good          | ✅ Good         | ✅ Good           | Manual  |
| Vite compatibility        | ✅               | ✅              | ⚠️ (babel macros) | ✅      |
| Bundle size (core)        | ~25 KB           | ~45 KB          | ~10 KB + macros   | 0       |

`i18next` wins on framework-agnosticism (shared learning curve across FE/BE), mature lazy-loading, and the largest ecosystem. `react-intl` is React-only, making backend reuse impossible. `lingui`'s compile-time macros add build complexity to the existing Vite setup.

**Consequences.**

- **+** Single i18n API across frontend and backend reduces cognitive load.
- **+** Mature lazy-loading and namespace support out of the box.
- **+** `react-i18next` `Trans` component handles rich interpolation safely.
- **−** Adds ~25 KB gzipped to the frontend bundle (mitigated: en bundled, others lazy).
- **−** ICU MessageFormat requires the `i18next-intlpluralresolver` plugin (small).

**Alternatives considered.** `react-intl` (rejected — React-only, larger bundle), `lingui` (rejected — build macro complexity), custom (rejected — would need to reimplement pluralization, lazy loading, fallback).

---

### ADR-002: Translation File Format — Namespaced JSON per Locale

**Status:** Accepted
**Date:** 2026-07-11

**Context.** With ~1,500–2,000 strings, a single flat file per locale becomes unmaintainable. We need a format that supports grouping, lazy loading, and tooling.

**Decision.** Use **JSON files** organized by **locale** and **namespace**, stored in `packages/frontend/src/locales/{lng}/{ns}.json` (frontend) and `packages/backend/src/locales/{lng}/{ns}.json` (backend).

**Structure.**

```
packages/frontend/src/locales/
├── en/
│   ├── common.json        # shared buttons, labels (Save, Cancel, Loading...)
│   ├── auth.json          # login, register, password reset
│   ├── dashboard.json
│   ├── backlog.json
│   ├── sprint.json
│   ├── daily-scrum.json
│   ├── impediments.json
│   ├── increments.json
│   ├── sprint-review.json
│   ├── retrospective.json
│   ├── reports.json
│   ├── team.json
│   ├── settings.json
│   ├── notifications.json
│   ├── errors.json        # generic UI error messages
│   └── validation.json    # form validation messages
├── de/
│   └── ... (same namespace structure)
├── fr/
├── es/
└── it/

packages/backend/src/locales/
├── en/
│   ├── emails.json        # email subjects + bodies
│   ├── notifications.json # notification titles + messages
│   ├── errors.json        # API error messages
│   └── validation.json    # request validation messages
├── de/
└── ...
```

**Rationale.**

- **JSON** is natively supported by Vite (importable), Node.js (`require`/`import`), and all translation tooling.
- **Namespaces** map to features (matching the existing `pages/` and `components/` structure), enabling lazy loading — a user on the Dashboard only fetches `common.json` + `dashboard.json`.
- Mirrors the domain boundaries already present in the codebase (e.g., `Backlog`, `Sprint`, `Retrospective`).
- Avoids YAML (extra dependency, indentation-sensitivity) and ICU `.json` custom formats.

**Consequences.**

- **+** Lazy loading per namespace minimizes initial bundle.
- **+** Translators work on focused files, not a monolith.
- **+** CI can validate each namespace independently.
- **−** ~15 namespaces × 5 locales = 75 files to maintain (mitigated by tooling + glossary).

---

### ADR-003: Language Detection & Persistence Strategy

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Language preference must be detected, persisted, and applied consistently across page reloads, sessions, and devices.

**Decision.** Multi-tier detection with explicit precedence, persisted in `User.locale` (authenticated) and `localStorage` (guests), synchronized via a long-lived `scrumooth_locale` cookie.

**Detection precedence (highest → lowest):**

1. **Authenticated user:** `User.locale` from the database (authoritative, cross-device).
2. **Locale cookie:** `scrumooth_locale` (1-year expiry, enables SSR/refresh before auth resolves).
3. **localStorage:** `scrumooth.locale` (guest fallback, fast client read).
4. **Browser:** `navigator.language` / `Accept-Language` header (first-visit default).
5. **Application default:** `en`.

**Flow:**

- On login, the backend reads `User.locale` and sets the `scrumooth_locale` cookie.
- On page load, the frontend reads cookie → localStorage → browser → default, then calls `PUT /api/v1/auth/me/profile` if the resolved locale differs from the stored one (first-visit auto-detection).
- On language switch (UI), update all three: localStorage, cookie, and `User.locale` (if authenticated).
- **After `/api/v1/auth/me` resolves** (TanStack Query), the frontend **explicitly** calls `useI18nStore.getState().setLocale(user.locale)` and `i18nInstance.changeLanguage(user.locale)`. This step is what makes `User.locale` the _effective_ highest precedence: the i18next `LanguageDetector` (cookie/localStorage/navigator) cannot read the database, so the user-profile locale must be applied programmatically once auth resolves. If the profile locale differs from the cookie/localStorage value, the profile value wins and a `PUT /api/v1/auth/me/profile` is fired to reconcile (only when the user explicitly changed it, not on every load).

> **Why two sources appear "highest".** `User.locale` is authoritative for authenticated users, but it is only known _after_ an authenticated round-trip. The cookie bridges the pre-hydration gap so the first paint is in the right language. The explicit `setLocale(user.locale)` after `/me` resolves corrects any drift (e.g., user changed language on another device).

**Cookie spec:**

```
Set-Cookie: scrumooth_locale=de; Path=/; Max-Age=31536000; SameSite=Strict; Secure
```

**Rationale.** User DB column is the source of truth for authenticated users (cross-device). Cookie enables correct rendering before React hydrates / auth resolves. localStorage gives instant client-side reads.

**Consequences.**

- **+** Cross-device consistency for authenticated users.
- **+** No flash of wrong language (cookie available pre-hydration).
- **−** Requires a Prisma migration to add `User.locale`.

---

### ADR-004: Fallback Strategy — Three-Tier Chain

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Translations will be incomplete during rollout and as new features ship. The system must degrade gracefully.

**Decision.** Configure `i18next` with a three-tier fallback chain:

```
requested locale (e.g., "de-AT") → base language ("de") → default ("en") → key string
```

**i18next configuration:**

```typescript
fallbackLng: 'en',
load: 'languageOnly', // "de-AT" → "de", not "de-AT" + "de"
nonExplicitSupportedLngs: true,
returnNull: false,
returnEmptyString: false,
missingKeyHandler: (lng, ns, key) => {
  logger.warn(`Missing i18n key: ${lng}:${ns}:${key}`);
},
parseMissingKeyHandler: (key) => key, // show key, not "missing"
}
```

**Behavior:**

| Scenario                            | Result                                  |
| ----------------------------------- | --------------------------------------- |
| Key exists in `de`                  | German text                             |
| Key missing in `de`, exists in `en` | English text (logged as warning in dev) |
| Key missing in both `de` and `en`   | The key string itself (logged as error) |
| Namespace missing for `de`          | Entire namespace falls back to `en`     |

**CI enforcement:** A completeness check compares every non-default locale against `en`. Missing keys **fail CI** unless explicitly tagged `// @i18n-ignore` in a `.i18nignore` manifest.

**Consequences.**

- **+** Users never see a broken UI due to missing translations.
- **+** Dev-time warnings surface gaps early.
- **−** English text may appear in non-English UIs during gradual rollout (acceptable, documented).

---

### ADR-005: Backend i18n — Shared `i18next` Instance with Per-Request Locale Resolution

**Status:** Accepted
**Date:** 2026-07-11

**Context.** The backend produces user-facing text in three contexts: (1) email templates, (2) notifications, (3) API error/validation messages. These must be rendered in the recipient's locale.

**Decision.** Run a **single `i18next` instance** on the backend, initialized once at startup with all namespaces preloaded (backend has fewer strings, ~200). Resolve the locale **per request** via a `LocaleResolver` middleware that stores the locale in the existing [requestContext](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/utils/requestContext.ts) (`AsyncLocalStorage`).

> **Compatibility note (verified against the existing `requestContext.ts`).** The existing `RequestContext` interface is a fixed shape (`requestId`, `userId?`, `teamId?`) and is mutated via `updateRequestContext(partial)` / read via `getRequestContext()`. There is **no** generic `requestContext.set(key, value)` API. Therefore this ADR requires extending the `RequestContext` interface with an optional `locale?: Locale` field (see §8.2) and using `updateRequestContext({ locale })` to write it and `getRequestContext()?.locale` to read it. The `localeResolver` middleware **must run after the `contextMiddleware` and after `authenticate`** (so that `req.user.locale` is available for authenticated requests); for unauthenticated requests it reads `Accept-Language`.

**Locale resolution (backend):**

1. If authenticated: `req.user.locale` (from DB).
2. Else: `Accept-Language` header (parsed via `i18next-languageDetector`).
3. Fallback: `en`.

**Usage pattern:**

```typescript
// Instead of: throw new NotFoundError('Notification');
const t = reqI18n.t; // bound to request locale
throw new NotFoundError(t('errors:entityNotFound', { entity: t('common:notification') }));
```

**For async contexts (jobs, email sending):** The locale is explicitly passed as a parameter (`sendEmail({ to, locale, template, data })`) since there's no HTTP request.

**Rationale.** A single instance with all namespaces preloaded avoids per-request initialization overhead (~200 strings is trivial). `AsyncLocalStorage` (already used for request context) propagates the locale through the middleware/service chain without parameter threading.

**Consequences.**

- **+** Consistent translation API with the frontend.
- **+** No per-request i18next init cost.
- **−** Background jobs must pass locale explicitly (no request context).

---

### ADR-006: Pluralization & Cultural Formatting — ICU + `date-fns` + `Intl`

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Pluralization rules vary by language (English: one/other; French: one/many; Arabic: 6 forms). Date, number, and currency formats vary by locale.

**Decision.**

| Concern                 | Solution                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Pluralization**       | `i18next-intlpluralresolver` (ICU MessageFormat `{count, plural, one {...} other {...}}`) |
| **Date formatting**     | `date-fns` v4 with `date-fns/locale` (already a dependency)                               |
| **Number formatting**   | Native `Intl.NumberFormat` API                                                            |
| **Currency formatting** | Native `Intl.NumberFormat` with `style: 'currency'`                                       |
| **Relative time**       | Native `Intl.RelativeTimeFormat` API                                                      |
| **List formatting**     | Native `Intl.ListFormat` API                                                              |

**Shared formatters** (in `packages/shared/src/utils/formatters.ts`):

```typescript
import { format, parseISO } from 'date-fns';
import { enUS, de, fr, es, it } from 'date-fns/locale';

const DATE_FNS_LOCALES = { en: enUS, de, fr, es, it };

export function formatDate(date: Date | string, locale: Locale, fmt = 'PP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: DATE_FNS_LOCALES[locale] ?? DATE_FNS_LOCALES.en });
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(value: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  // ... unit selection logic
  return rtf.format(Math.round(diff), 'day');
}
```

**Pluralization example (translation file):**

```json
{
  "tasks": "{{count}} task",
  "tasks_other": "{{count}} tasks",
  "sprintDaysRemaining": "{{count}} day remaining",
  "sprintDaysRemaining_other": "{{count}} days remaining"
}
```

**Rationale.** `date-fns` is already installed — no new date library. Native `Intl` APIs have zero bundle cost and full CLDR coverage. ICU pluralization via `i18next-intlpluralresolver` handles all CLDR plural categories.

**Consequences.**

- **+** Zero additional dependencies for formatting (Intl is native, date-fns exists).
- **+** Full CLDR plural category support.
- **−** `i18next-intlpluralresolver` adds ~5 KB (acceptable).

---

### ADR-007: Translation Workflow — JSON-in-Repo + CI Gates + Optional TMS Export

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Translators are not developers. We need a workflow that allows non-technical contributors to add/update translations safely, with quality gates.

**Decision.** Store JSON translation files in the Git repo (source of truth). Provide a CI pipeline that validates structure, completeness, and terminology. Optionally export to a Translation Management System (TMS) like Crowdin/Transifex for large-scale translation, then import back via PR.

**Workflow:**

1. **Developer adds a new string:** Adds the key to `en/{ns}.json` (the source locale). CI blocks merge if the key is missing from `de/fr/es/it/{ns}.json` (or listed in `.i18nignore`).
2. **Translator updates a translation:** Edits the locale JSON directly (PR) OR works in a TMS that exports a PR.
3. **Terminology consistency:** A `glossary.json` in `packages/shared/i18n/glossary.json` defines canonical translations for domain terms (e.g., "Sprint" → "Sprint" in de, "Itération" in fr). A CI script flags deviations.
4. **Validation script** (`scripts/i18n/validate.mjs`):
   - JSON syntax validity.
   - All `en` keys present in other locales.
   - No extra keys in non-`en` locales (detect stale translations).
   - No hardcoded English in non-`en` files (heuristic: detect common English words).
   - Glossary term compliance.

**Tooling scripts (in `scripts/i18n/`):**

| Script                    | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `validate.mjs`            | Run all CI checks locally                                             |
| `extract.mjs`             | Scan `.tsx`/`.ts` for hardcoded strings (heuristic, assist migration) |
| `completeness-report.mjs` | Generate a coverage report per locale/namespace                       |
| `sync-glossary.mjs`       | Verify glossary terms are used consistently                           |

**Consequences.**

- **+** JSON-in-repo keeps translations versioned alongside code (atomic feature + translation commits).
- **+** CI gates prevent missing translations from shipping.
- **+** Optional TMS export supports scaling to more languages/translators.
- **−** Translators must use Git PRs or a TMS (no in-app translator UI — out of scope for v1).

---

### ADR-008: Performance Optimization — Namespace Lazy Loading + HTTP Caching

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Loading all 5 locales × 15 namespaces = 75 JSON files upfront is wasteful. Only the user's active locale and current feature's namespaces are needed.

**Decision.**

1. **Bundle the default locale (`en`) + `common` namespace** into the main chunk (Vite `import`). This avoids a flash-of-English on first paint for default-locale users.
2. **Lazy-load all other locales and non-common namespaces** via dynamic `import()` triggered by `i18next`'s backend plugin (`i18next-http-backend` for fetch from `/locales/{lng}/{ns}.json`).
3. **Cache fetched bundles** in browser cache (HTTP `Cache-Control: public, max-age=31536000, immutable` with content-hashed filenames via Vite build).
4. **Preload** the user's preferred locale on app init (from cookie) in parallel with auth, before the first route renders.
5. **Prefetch** adjacent namespaces on hover/idle for likely-next routes (e.g., hovering "Sprint Planning" nav link prefetches `sprint-planning.json`).

**Bundle strategy (Vite):**

```typescript
// vite.config.ts — bundle en + common, lazy-load the rest
i18next: {
  load: 'languageOnly',
  ns: ['common'],
  defaultNS: 'common',
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  partialBundledLanguages: true,
  resources: {
    en: { common: enCommon }, // bundled
  },
}
```

**Expected payload sizes (gzipped estimates):**

| Namespace                                  | Estimated keys | Gzipped size |
| ------------------------------------------ | -------------- | ------------ |
| common                                     | ~80            | ~3 KB        |
| auth                                       | ~40            | ~2 KB        |
| dashboard                                  | ~60            | ~2.5 KB      |
| backlog                                    | ~150           | ~6 KB        |
| sprint                                     | ~120           | ~5 KB        |
| **Total (all 15 ns, one locale)**          | ~1,800         | ~55 KB       |
| **Initial load (en + common + active ns)** | ~200           | ~8 KB        |

**Consequences.**

- **+** Initial load adds only ~3 KB (en/common bundled).
- **+** Subsequent language/namespace fetches are < 6 KB each, cacheable for 1 year.
- **+** No CLS — language switch happens in-memory after bundle load.
- **−** First switch to a new locale incurs a network fetch (mitigated by prefetching).

---

### ADR-009: RTL-Ready Architecture — Logical CSS + Directional Abstraction

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Initial languages are all LTR, but the architecture must not block future Arabic/Hebrew (RTL) support, avoiding expensive refactors later.

**Decision.** Adopt **logical CSS properties** and **directional abstractions** now, even though only LTR ships initially.

**Guidelines enforced via Stylelint:**

1. **Use logical properties** instead of physical ones:
   - `margin-inline-start` instead of `margin-left`
   - `padding-inline-end` instead of `padding-right`
   - `inset-inline-start` instead of `left`
   - `text-align: start` instead of `text-align: left`
2. **Avoid `float: left/right`** — use flexbox/grid with `direction`-aware flow.
3. **Icons with directionality** (e.g., arrow back/forward) must be mirrored via `[dir="rtl"]` CSS selectors or `transform: scaleX(-1)`.
4. **Set `dir` attribute** on `<html>` from `useI18nStore` based on `isRTL(locale)`.

**Shared utility:**

```typescript
// packages/shared/src/utils/locale.ts
export function isRTL(locale: Locale): boolean {
  return ['ar', 'he', 'fa', 'ur'].includes(getBaseLanguage(locale));
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
```

**Stylelint rule** (added to `.stylelintrc.json`):

```json
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "/^margin|padding$/": ["left", "right"],
      "/^text-align$/": ["left", "right"]
    },
    "property-disallowed-list": ["float"]
  }
}
```

**Consequences.**

- **+** Adding RTL languages later requires only: (a) new locale JSON, (b) `ar`/`he` added to `SUPPORTED_LOCALES`, (c) `date-fns` locale import. Zero CSS changes.
- **+** Logical properties are a modern CSS best practice regardless of RTL.
- **−** Slight learning curve for developers used to physical properties.
- **−** Existing CSS modules must be migrated to logical properties (part of phased rollout).

---

### ADR-010: Locale-Aware Collation & Sorting — `Intl.Collator`

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Lists of named entities (backlog items, team members, sprints, impediments) are sorted by name in the UI. Default `Array.prototype.sort()` uses code-unit ordering, which produces wrong results for accented characters and locale-specific rules. For example, German sorts `ä` like `a` (or as `ae` in phonebook order), French sorts accents from the end of the word, and Swedish places `ö` after `z`. Sorting "Österreich" vs "Orange" differs between `de` and `en`.

**Decision.** Use the native `Intl.Collator` API for all user-facing string sorting, exposed via shared helpers `createCollator(locale, options)` and `sortLocaleStrings(items, locale)` (see §9.1). Default options: `{ sensitivity: 'base', numeric: true }` (case- and accent-insensitive, natural number ordering `task-2` before `task-10`).

**Where to apply:**

- Backlog list view sorted by title.
- Team member directory sorted by name.
- Sprint/impediment/increment lists sorted by name.
- Any `<select>`/autocomplete options populated from named entities.

**Where NOT to apply:** internal/stable IDs, timestamps (use numeric comparison), or server-side DB `ORDER BY` where the DB collation already handles it (Postgres `COLLATE`). For server-side sorting of localized names, prefer fetching unsorted and sorting in the application layer with `Intl.Collator`, OR set the Postgres column collation explicitly — but application-layer collation is simpler and locale-dynamic per request.

**Consequences.**

- **+** Correct alphabetical ordering per locale; zero dependency cost (native API).
- **+** `numeric: true` solves the `task-2` vs `task-10` problem without zero-padding.
- **−** Must remember to use the helper instead of bare `.sort()` — add an ESLint `no-restricted-syntax` rule to flag `.sort()` on string arrays in feature code (warn, not error, since some sorts are numeric).

---

### ADR-011: Chart.js & Data Visualization i18n

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Scrumooth uses Chart.js for burndown charts, velocity charts, and dashboards. Chart.js renders axis titles, tick labels, legend labels, tooltips, and dataset labels — all of which are user-facing text that must be translated, and all numeric/date tick values must be locale-formatted.

**Decision.** Treat Chart.js configuration as a translation surface: all label strings come from `t()`, and all numeric/date ticks go through the shared formatters (`formatNumber`, `formatDate`). Chart options are rebuilt when the locale changes (the chart re-renders on `locale` dependency change).

**Pattern:**

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18nStore } from '@/i18n/useI18nStore';
import { formatDate, formatNumber } from '@scrumooth/shared';

export function BurndownChart({ data }: BurndownChartProps) {
  const { t } = useTranslation('sprint');
  const { locale } = useI18nStore();

  const options = useMemo(
    () => ({
      scales: {
        x: {
          title: { display: true, text: t('sprint:chartAxisDays') },
          ticks: {
            callback: (value: number | string) =>
              formatDate(labels[Number(value)], locale, 'dd MMM'),
          },
        },
        y: {
          title: { display: true, text: t('sprint:chartAxisStoryPoints') },
          ticks: { callback: (value: number | string) => formatNumber(Number(value), locale) },
        },
      },
      plugins: {
        legend: { labels: { text: t('sprint:chartIdealBurndown') } },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: { y: number } }) =>
              t('sprint:chartTooltipPoints', { count: ctx.parsed.y }),
          },
        },
      },
    }),
    [t, locale, labels]
  );

  return <Chart type="line" data={data} options={options} />;
}
```

**Coverage checklist (gap h):**

- [ ] Axis titles (`scales.x.title.text`, `scales.y.title.text`)
- [ ] Axis tick labels (dates via `formatDate`, numbers via `formatNumber`)
- [ ] Legend labels (`plugins.legend.labels.text` and per-dataset `label`)
- [ ] Tooltip headers and bodies (`plugins.tooltip.callbacks.*`)
- [ ] Chart titles (`plugins.title.text`)
- [ ] Data labels (if using a label plugin)

**Consequences.**

- **+** Charts render correctly in every locale, including number formatting (`1.234,56` vs `1,234.56`) and date formatting on axes.
- **−** Chart `options` must be memoized on `[t, locale, ...data]` to avoid recreation each render; forgetting the dependency causes stale translations after a language switch.

---

### ADR-012: Test Migration Strategy — Locale-Aware Unit & E2E Tests

**Status:** Accepted
**Date:** 2026-07-11

**Context.** Existing unit tests (`*.test.tsx`) and Playwright E2E tests assert on hardcoded English strings (e.g., `screen.getByText('Dashboard')`, `expect(page).toContainText('Sign in')`). When i18n is introduced, the default render path goes through `t('nav:dashboard')` which resolves to English **only when the test locale is `en` and the namespace is loaded**. Tests that (a) don't wrap in `I18nextProvider`, (b) don't load the required namespace, or (c) assert text that hasn't been extracted yet will break. Additionally, Playwright tests run in a single browser locale and will fail if the UI switches to a non-`en` default.

**Decision.** Adopt a three-part test strategy:

1. **Unit/integration tests (Vitest + RTL):**
   - Add a shared test setup that initializes i18next with `en` + all namespaces preloaded, and wraps every component render in `I18nextProvider`.
   - Provide a `renderWithI18n(ui, { locale = 'en', ns = [] })` test helper.
   - Prefer asserting on **translation keys via `data-testid`** for stable tests, OR assert on the resolved English text (acceptable since `en` is the test default). Do **not** assert on raw strings that are known to be untranslated.
   - Add at least one test per feature that switches to a second locale (`de`) and asserts the German text renders — this catches missing-namespace and missing-key regressions.

2. **E2E tests (Playwright):**
   - Set a fixed locale per test via the `scrumooth_locale` cookie or the language switcher, and assert against the expected locale's text. Add a `test.use({ locale: 'en-US' })` default plus explicit per-test overrides.
   - Add `data-testid` attributes to stable elements (buttons, headings) so tests can locate elements without coupling to translatable text where possible.
   - Provide a `t(key)` helper in the Playwright fixture that reads the same JSON the app uses, so tests can assert `await expect(page.locator('h1')).toHaveText(t('auth:welcomeBack'))` without hardcoding.

3. **CI gate:** a `i18n:test-locale` job runs a subset of E2E tests in `de` to ensure non-English rendering works end-to-end.

**Migration order:** before extracting strings from a page, update its tests to use `data-testid` assertions (decoupling them from text); then extract strings; the tests continue to pass. See §16.6 for the detailed migration steps and the roadmap (§19) for scheduling.

**Consequences.**

- **+** Tests survive the i18n migration without mass rewrites.
- **+** `data-testid`-based assertions are more robust to copy changes regardless of i18n.
- **−** Adding `data-testid` to existing components is incremental work (folded into the phased rollout).

---

## 6. Database Schema Changes

### 6.1 Prisma Schema Migration

Add a `locale` column to the `User` model.

**File:** `packages/backend/prisma/schema.prisma`

```prisma
model User {
  id                   String                     @id @db.Uuid
  email                String                     @unique
  password             String
  firstName            String
  lastName             String
  avatarUrl            String?
  locale               String                     @default("en") @db.VarChar(10)  // NEW
  createdAt            DateTime                   @default(now()) @db.Timestamptz(3)
  // ... existing fields
  @@map("users")
}
```

**Migration:**

```sql
-- Migration: add_locale_to_users
ALTER TABLE "users" ADD COLUMN "locale" VARCHAR(10) NOT NULL DEFAULT 'en';

-- Optional: CHECK constraint for valid locales
ALTER TABLE "users" ADD CONSTRAINT "users_locale_check"
  CHECK ("locale" IN ('en', 'de', 'fr', 'es', 'it'));
```

> **Note:** The `CHECK` constraint is intentionally not added via Prisma (Prisma doesn't natively support CHECK). It's added via a raw SQL migration. If future locales are added, this constraint must be updated. Alternatively, omit the CHECK and validate at the application layer (Zod) for flexibility.

### 6.2 Application-Layer Validation (Zod)

```typescript
// packages/shared/src/constants/index.ts
export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

// packages/backend/src/validations/auth.validation.ts
import { SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';
// z.enum() requires a mutable [string, ...string[]] tuple. SUPPORTED_LOCALES is
// `readonly ['en','de','fr','es','it']` (declared `as const`), so cast it.
const localeSchema = z.enum(SUPPORTED_LOCALES as unknown as [Locale, ...Locale[]]).default('en');
```

### 6.3 API Endpoint Changes

> **Verified against `auth.routes.ts`.** The existing profile-update route is `PUT /api/v1/auth/me/profile` (mounted under the `/api/v1/auth` router), protected by `authenticate` + `validateBody(updateProfileSchema)`. The `locale` field is added to the existing `updateProfileSchema` (see §8.4b), not to a new endpoint.

| Method | Path                      | Change                                                                                                                                                                                                    |
| ------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUT`  | `/api/v1/auth/me/profile` | **Existing route** — extend `updateProfileSchema` to accept optional `locale`; persist via `authService.updateProfile`; set `scrumooth_locale` cookie on response; **audit-log** the locale change (§8.7) |
| `GET`  | `/api/v1/auth/me`         | **Existing route** — include `locale` in the returned user object (automatic once the Prisma `User.locale` column exists and `select`/serialization includes it)                                          |
| `POST` | `/api/v1/auth/login`      | **Existing route** — on success, set `scrumooth_locale` cookie from `User.locale`                                                                                                                         |
| `POST` | `/api/v1/auth/register`   | **Existing route** — accept optional `locale` in `registerSchema`; default to browser-detected (`Accept-Language`) or `en`                                                                                |
| `GET`  | `/api/v1/config/locales`  | **New endpoint** — return `SUPPORTED_LOCALES` + `LOCALE_LABELS` (for the language switcher UI); public, no auth required                                                                                  |

---

## 7. Frontend Implementation

### 7.1 Package Dependencies

Add to `packages/frontend/package.json` (and mirror the runtime deps in `packages/backend/package.json` minus the React/browser-specific packages):

```json
{
  "dependencies": {
    "i18next": "^26.0.0",
    "react-i18next": "^15.7.0",
    "i18next-http-backend": "^3.0.0",
    "i18next-browser-languagedetector": "^8.0.0",
    "i18next-intlpluralresolver": "^8.0.0"
  }
}
```

> **Version notes (verified 2026-07-11).** `i18next` v26 is the current major release (v26.3.4 is latest). All configuration options used in this document (`fallbackLng`, `supportedLngs`, `load`, `partialBundledLanguages`, `ns`, `defaultNS`, `returnNull`, `returnEmptyString`, `saveMissing`, `missingKeyHandler`, `react.useSuspense`, `react.bindI18n`) are valid in v26. Two v26 breaking changes are relevant:
>
> 1. **`interpolation.format` function removed** — custom value formatting must use the Formatter API (`i18next.services.formatter.add('name', fn)`). This document does **not** use a custom `interpolation.format` function (formatting is done explicitly via the shared `format*` helpers), so no migration is required. If a custom formatter is added later, use the Formatter API, not `interpolation.format`.
> 2. **`initImmediate` removed** — renamed to `initAsync` in v24. The backend init uses `void i18nInstance.init()` (fire-and-forget) which is unaffected; if awaited initialization is needed, use `await i18nInstance.init()` (returns a promise by default in v26).
>
> **TypeScript:** i18next v24+ requires TypeScript v5+. The project already uses a modern TypeScript; confirm `typescript >= 5.x` in all three packages. For large translation dictionaries, consider `enableSelector: true` (added in v25.4) to keep IDE performance acceptable; this is optional and off by default in v25.4 but on by default in v26+.
>
> **`i18next-intlpluralresolver`** resolves CLDR plural categories (one/few/many/other) and is required for correct French/Spanish/Italian `many` forms. Pin `^8.0.0` (compatible with i18next v26).

### 7.2 i18next Configuration

**File:** `packages/frontend/src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';

// Bundled default locale + common namespace (avoids flash of untranslated text)
import enCommon from '../locales/en/common.json';

export const i18nInstance = i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next);

export function initI18n(initialLocale?: Locale): Promise<typeof i18n> {
  return i18nInstance.init({
    resources: {
      en: { common: enCommon },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    load: 'languageOnly',
    ns: ['common'],
    defaultNS: 'common',
    partialBundledLanguages: true,

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      lookupCookie: 'scrumooth_locale',
      lookupLocalStorage: 'scrumooth.locale',
      caches: ['localStorage'],
    },

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
  });
}
```

### 7.3 I18nProvider & Store Integration

**File:** `packages/frontend/src/i18n/I18nProvider.tsx`

```tsx
import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18nInstance } from './config';
import { useI18nStore } from './useI18nStore';
import { getDirection } from '@scrumooth/shared';

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLocale }) => {
  const { locale, setLocale } = useI18nStore();

  useEffect(() => {
    void i18nInstance.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
```

### 7.4 Zustand Store

**File:** `packages/frontend/src/i18n/useI18nStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, type Locale } from '@scrumooth/shared';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'scrumooth.locale',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
```

### 7.5 Language Switcher Component

**File:** `packages/frontend/src/components/common/LanguageSwitcher/LanguageSwitcher.tsx`

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';
import { useI18nStore } from '@/i18n/useI18nStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiService } from '@/services';
import { logger } from '@/utils/logger';
import { toast } from '@/components/common/Toast';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dropdown' }) => {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18nStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleChange = async (newLocale: Locale) => {
    // Optimistically update the UI; the store persists to localStorage.
    setLocale(newLocale);
    if (!isAuthenticated) {
      return; // guests: localStorage is the source of truth, nothing else to do
    }
    try {
      await apiService.updateProfile({ locale: newLocale });
    } catch (error) {
      // Authenticated user: the profile sync failed — log and surface a toast,
      // but keep the optimistic local change (it will reconcile on next /me).
      logger.warn('Failed to persist locale to profile', { error });
      toast.error(t('common:localeSyncFailed'));
    }
  };

  return (
    <div className={styles.container}>
      <label htmlFor="language-select" className={styles.label}>
        {t('common:language')}
      </label>
      <select
        id="language-select"
        className={styles.select}
        value={locale}
        onChange={(e) => void handleChange(e.target.value as Locale)}
        aria-label={t('common:selectLanguage')}
      >
        {SUPPORTED_LOCALES.map((lng) => (
          <option key={lng} value={lng}>
            {LOCALE_LABELS[lng]}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 7.6 Usage Pattern in Components

**Before (current):**

```tsx
<h1>Welcome back</h1>
<button onClick={handleLogin}>Sign in</button>
<p>{error}</p>
```

**After (i18n):**

```tsx
const { t } = useTranslation('auth');

<h1>{t('welcomeBack')}</h1>
<button onClick={handleLogin}>{t('signIn')}</button>
<p>{t('loginFailed')}</p>

// With interpolation:
<p>{t('welcomeUser', { name: user.firstName })}</p>

// With pluralization:
<span>{t('tasksRemaining', { count: remaining })}</span>

// With namespace + formatted date:
<span>{t('sprint:endsOn', { date: formatDate(sprint.endDate, locale) })}</span>
```

### 7.7 Type-Safe Translation Keys (Optional Enhancement)

To satisfy NFR-9 (type safety), define key types from the JSON:

**File:** `packages/frontend/src/i18n/types.ts`

```typescript
import type enCommon from '../locales/en/common.json';

type CommonKeys = keyof typeof enCommon;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      // Add other namespaces as they're typed
    };
  }
}
```

This enables IDE autocompletion and compile-time key validation in `t('...')`.

### 7.8 Lazy Namespace Loading per Route

**File:** `packages/frontend/src/routes/lazyComponents.ts` (extended)

```typescript
import { lazy } from 'react';
import { i18nInstance } from '@/i18n/config';

function withNamespace<T extends React.ComponentType>(
  ns: string,
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    await i18nInstance.loadNamespaces([ns]);
    return factory();
  });
}

export const LazyProductBacklog = withNamespace('backlog', () =>
  import('../pages/Backlog/Backlog').then((m) => ({ default: m.Backlog as never }))
);
```

### 7.9 Accessibility Deep-Dive

Internationalization and accessibility are tightly coupled: an untranslated or mis-translated accessible name is a regression for screen-reader users. This section defines the i18n scope for accessibility attributes so that `extract.mjs` (§13.8) captures them and the completeness gate (§16.5) enforces their presence.

#### 7.9.1 Attributes in Scope

The following attributes MUST be translated and are treated as translation surfaces by `extract.mjs`:

| Attribute              | Element Context                             | Translation Key Pattern                       | Example                                               |
| ---------------------- | ------------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `aria-label`           | Icon-only buttons, decorative-link wrappers | `common:aria.<purpose>`                       | `aria-label={t('common:aria.openMenu')}`              |
| `aria-labelledby`      | IDs referencing translated text             | (indirect — translate the referenced element) | `aria-labelledby="dialog-title"`                      |
| `aria-describedby`     | IDs referencing translated help text        | (indirect — translate the referenced element) | `aria-describedby="password-hint"`                    |
| `aria-roledescription` | Custom-widget descriptions                  | `common:aria.<widget>`                        | `aria-roledescription={t('common:aria.kanbanCard')}`  |
| `alt`                  | Informative images (`<img>`)                | `<ns>:alt.<image>`                            | `alt={t('dashboard:alt.teamPhoto')}`                  |
| `title`                | Tooltips / advisory info                    | `common:title.<purpose>`                      | `title={t('common:title.lastUpdated')}`               |
| `placeholder`          | Form inputs                                 | `<ns>:placeholder.<field>`                    | `placeholder={t('auth:placeholder.email')}`           |
| `<title>` (document)   | Page title                                  | `<ns>:pageTitle.<page>`                       | `document.title = t('dashboard:pageTitle.dashboard')` |
| `lang` (nested)        | Foreign-language quotes/terms               | Literal BCP-47 tag, NOT a translation key     | `<span lang="fr">déjà vu</span>`                      |

**Decorative images** (`alt=""`) are OUT of scope and MUST NOT be translated — empty `alt` is locale-independent.

#### 7.9.2 Accessible Name Computation

Screen readers compute the _accessible name_ from a precedence chain (per WAI-ARIA 1.2): `aria-labelledby` → `aria-label` → visible text → `title` → `placeholder`. Translation MUST be applied consistently at every link in the chain, or the localized accessible name will silently fall back to an untranslated source.

**Anti-pattern (mixed-language accessible name):**

```tsx
// ❌ Bad: aria-label is translated, visible label is not (or vice versa)
<button aria-label={t('common:actions.save')}>Save {/* English hardcoded */}</button>
```

**Correct pattern:**

```tsx
// ✅ Good: visible label and aria-label share the same key;
// omit aria-label entirely when visible text is sufficient
<button>
  {t('common:actions.save')}
</button>

// ✅ Good: icon-only button — aria-label is the sole accessible name
<button
  aria-label={t('common:aria.closeDialog')}
  onClick={onClose}
>
  <CloseIcon />
</button>
```

**Rule of thumb:** Do NOT set `aria-label` to a translation of text that is already visible inside the element — it duplicates the accessible name and can diverge on locale switch. Use `aria-label` only for icon-only controls or when the visible text is intentionally ambiguous.

#### 7.9.3 Dynamic `lang` Attribute on Nested Content

When a page embeds a term in a different language (e.g., a German UI quoting a French product name), the nested element MUST carry a `lang` attribute so screen readers pronounce it correctly:

```tsx
<span lang={termLocale}>{term}</span>
```

`termLocale` is a literal BCP-47 tag from `SUPPORTED_LOCALES` — it is NOT looked up via `t()`. The translation value for the term itself is resolved normally via `t()` in the surrounding UI locale.

#### 7.9.4 Document `<title>` and `lang`/`dir` Synchronization

On every locale change, three document-level attributes MUST be updated atomically (see `useI18nStore` §7.4):

1. `document.documentElement.lang` → BCP-47 tag (e.g., `'de'`)
2. `document.documentElement.dir` → `'ltr'` or `'rtl'` (via `isRTL(locale)`)
3. `document.title` → translated page title for the current route

Failure to update `lang` causes screen readers to mispronounce translated content using the wrong phonology engine. Failure to update `dir` breaks BiDi layout (relevant once RTL lands in Phase 5).

#### 7.9.5 Screen-Reader Testing in CI

The Playwright suite (§16.4, ADR-012) includes accessibility assertions that run under both `en` and `de`:

```typescript
test('icon-only buttons have localized accessible names', async ({ page }) => {
  await page.goto('/dashboard');
  await page.selectOption('[data-testid="language-select"]', 'de');
  const closeBtn = page.locator('[data-testid="close-sidebar"]');
  await expect(closeBtn).toHaveAttribute('aria-label', 'Seitenleiste schließen');
});

test('document lang attribute matches selected locale', async ({ page }) => {
  await page.goto('/dashboard');
  await page.selectOption('[data-testid="language-select"]', 'fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});
```

#### 7.9.6 Extraction & Coverage

`extract.mjs` (§13.8) scans for all attributes listed in §7.9.1 and emits keys under the `aria`, `alt`, `title`, `placeholder`, and `pageTitle` sub-trees of the relevant namespace. The CI completeness gate (§16.5) treats these keys as P0 — a missing `aria-label` translation fails the build just like a missing button label.

### 7.10 Empty, Loading & Error States

These three states are the most frequently forgotten i18n surfaces because they are not part of the "happy path" and are often added late or via copy-paste. Each state has distinct translation requirements documented below.

#### 7.10.1 Empty States

Empty states appear when a list/query returns no results. They typically contain a heading, a description, and optionally a call-to-action button — all of which MUST be translated. Empty states frequently include **interpolated counts or entity names** and may require **pluralization**.

**Key structure:** `<ns>:empty.<entity>.{title|description|action}`

```json
// backlog.json (de)
{
  "empty": {
    "backlog": {
      "title": "Der Product Backlog ist leer",
      "description": "Es sind noch keine Backlog-Einträge vorhanden. Erstellen Sie den ersten Eintrag, um zu starten.",
      "action": "Backlog-Eintrag erstellen"
    },
    "search": {
      "title": "Keine Ergebnisse für \"{{query}}\"",
      "description": "Versuchen Sie es mit einem anderen Suchbegriff oder entfernen Sie Filter."
    }
  }
}
```

**Pluralized empty state (rare but valid — e.g., "No items match 1 filter" vs "No items match 3 filters"):**

```json
{
  "empty": {
    "filteredBacklog": {
      "description_one": "Keine Einträge entsprechen {{count}} Filter.",
      "description_other": "Keine Einträge entsprechen {{count}} Filtern."
    }
  }
}
```

#### 7.10.2 Loading States

Loading states (skeletons, spinners, progressive placeholders) are **mostly locale-independent** because they render shapes rather than text. However, two sub-cases require translation:

1. **Loading text labels** (e.g., `"Loading sprints…"`, `"Daten werden geladen…"`) — translate via `<ns>:loading.<context>`.
2. **Skeleton `aria-label` / `aria-busy`** — screen readers announce loading regions; the accessible label MUST be translated (see §7.9).

```tsx
// ✅ Good: loading label translated, skeleton has localized aria-label
<section aria-busy="true" aria-label={t('sprint:loading.sprints')}>
  <Skeleton rows={5} />
</section>
```

**Anti-pattern:** embedding English placeholder text inside skeleton components (e.g., `Skeleton text="Loading…"`) — this leaks English to non-English users during the brief loading window.

#### 7.10.3 Error States

Error states fall into three categories, each with its own translation source:

| Error Category                                          | Translation Source                                                 | Key Pattern                 | Example                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------- | ----------------------------------------------- |
| **HTTP/transport errors** (network down, 500, timeout)  | Frontend `errors` namespace                                        | `errors:http.<code>`        | `errors:http.networkOffline`                    |
| **Backend validation errors** (400 with field details)  | Backend resolves via `t()`, sends resolved string (see §8.4b)      | `validation:<field>.<rule>` | `validation:email.invalid`                      |
| **Business-logic errors** (404, 403, 409 from services) | Backend `errors` namespace, resolved per request locale (see §8.4) | `errors:entityNotFound`     | `errors:entityNotFound` with `{ entity }` param |

**Frontend error boundary text** MUST be bundled with the `common` namespace so it renders even when a route-level namespace fails to load:

```json
// common.json (de)
{
  "error": {
    "boundary": {
      "title": "Etwas ist schiefgelaufen",
      "description": "Ein unerwarteter Fehler ist aufgetreten. Sie können es erneut versuchen oder zum Dashboard zurückkehren.",
      "retry": "Erneut versuchen",
      "goHome": "Zum Dashboard"
    },
    "http": {
      "networkOffline": "Sie sind offline. Bitte überprüfen Sie Ihre Verbindung.",
      "timeout": "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.",
      "serverError": "Ein Serverfehler ist aufgetreten. Unser Team wurde benachrichtigt."
    }
  }
}
```

#### 7.10.4 Coverage Enforcement

Empty, loading, and error states are explicitly enumerated in the migration checklist (Appendix D) and audited by `extract.mjs` (§13.8) via the following scan targets:

- JSX text inside components named `*EmptyState`, `*LoadingState`, `*ErrorState`, `*Skeleton`, `*ErrorBoundary`
- `toast.error(...)`, `toast.success(...)` calls
- `throw new Error(...)` / `throw new NotFoundError(...)` in services
- `message:` fields in Zod schemas (§8.4b)

The CI completeness gate (§16.5) treats all `empty.*`, `loading.*`, and `error.*` keys as P0.

---

## 8. Backend Implementation

### 8.1 Backend i18next Instance

**File:** `packages/backend/src/i18n/config.ts`

```typescript
import i18n from 'i18next';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@scrumooth/shared';

import enEmails from '../locales/en/emails.json';
import enNotifications from '../locales/en/notifications.json';
import enErrors from '../locales/en/errors.json';
import enValidation from '../locales/en/validation.json';
import deEmails from '../locales/de/emails.json';
// ... all locales preloaded

const resources = {
  en: {
    emails: enEmails,
    notifications: enNotifications,
    errors: enErrors,
    validation: enValidation,
  },
  de: { emails: deEmails /* ... */ },
  // ...
};

export const i18nInstance = i18n.createInstance({
  resources,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  load: 'languageOnly',
  ns: ['emails', 'notifications', 'errors', 'validation'],
  defaultNS: 'errors',
  interpolation: { escapeValue: false },
  returnNull: false,
});

void i18nInstance.init();
```

### 8.2 LocaleResolver Middleware

**Prerequisite — extend the `RequestContext` interface.**

**File:** `packages/backend/src/utils/requestContext.ts` (modified)

```typescript
import type { Locale } from '@scrumooth/shared';

export interface RequestContext {
  /** Unique identifier for the request */
  requestId: string;
  /** ID of the authenticated user (if any) */
  userId?: string;
  /** ID of the team context (if any) */
  teamId?: string;
  /** Resolved locale for this request (added by i18n — see ADR-005) */
  locale?: Locale;
}
```

The existing `updateRequestContext(updates)` uses `Object.assign(store, updates)`, so adding `locale` to the interface is sufficient — no other change to `requestContext.ts` is required. Add a thin accessor for ergonomics:

```typescript
// packages/backend/src/utils/requestContext.ts (append)
import { DEFAULT_LOCALE, type Locale } from '@scrumooth/shared';
import { isSupportedLocale } from '@scrumooth/shared';

export const getRequestLocale = (): Locale => {
  const locale = getRequestContext()?.locale;
  return locale && isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
};
```

**Middleware.**

**File:** `packages/backend/src/middleware/locale.middleware.ts`

```typescript
import { type Request, type Response, type NextFunction } from 'express';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale, normalizeLocale } from '@scrumooth/shared';
import { updateRequestContext } from '../utils/requestContext';

/**
 * Resolves the request locale and stores it in the AsyncLocalStorage request context.
 *
 * MUST be registered AFTER `contextMiddleware` (which creates the ALS store) and
 * AFTER `authenticate` (so `req.user.locale` is available for authenticated requests).
 * For unauthenticated requests it falls back to the Accept-Language header.
 */
export function localeResolver(req: Request, _res: Response, next: NextFunction): void {
  let locale: Locale = DEFAULT_LOCALE;

  // 1. Authenticated user's stored preference (authoritative, cross-device)
  const userLocale = req.user?.locale;
  if (userLocale && (SUPPORTED_LOCALES as readonly string[]).includes(userLocale)) {
    locale = userLocale as Locale;
  }
  // 2. Accept-Language header (guests / first visit)
  else {
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      const detected = acceptLang
        .split(',')
        .map((l) => l.split(';')[0]?.trim() ?? '')
        .map((l) => l.split('-')[0]?.toLowerCase() ?? '')
        .find((l) => (SUPPORTED_LOCALES as readonly string[]).includes(l));
      if (detected) {
        locale = normalizeLocale(detected);
      }
    }
  }

  // Persist the locale cookie so SSR/refresh renders the correct language pre-hydration
  _res.cookie('scrumooth_locale', locale, {
    maxAge: 31536000,
    sameSite: 'strict',
    secure: true,
    httpOnly: false, // readable by client LanguageDetector
    path: '/',
  });

  updateRequestContext({ locale });
  next();
}
```

> **Middleware ordering (in the Express app).** `requestId → contextMiddleware → authenticate → localeResolver → ...route handlers...`. Because `localeResolver` runs after `authenticate`, it can read `req.user.locale` for authenticated users. For public routes (login, register, forgot-password) that skip `authenticate`, `localeResolver` still runs and resolves from `Accept-Language`, then `updateRequestContext({ locale })` writes into the store created by `contextMiddleware`.

### 8.3 Request-Scoped `t()` Accessor

**File:** `packages/backend/src/i18n/requestT.ts`

```typescript
import { i18nInstance } from './config';
import { getRequestLocale } from '../utils/requestContext';

/**
 * Request-scoped translator. Reads the locale from AsyncLocalStorage
 * (set by `localeResolver` middleware via `updateRequestContext({ locale })`).
 *
 * Throws a descriptive error if called outside a request scope, to surface
 * misuse early (e.g., calling `t()` in a background job without passing locale).
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18nInstance.t(key, { lng: getRequestLocale(), ...options });
}
```

> **Background jobs / out-of-request contexts.** `getRequestLocale()` falls back to `DEFAULT_LOCALE` when there is no request context. For scheduled jobs (node-cron) and email sending, **do not** rely on `t()` — instead pass an explicit `locale` argument and obtain a bound translator via `i18nInstance.getFixedT(locale, namespace)` (see §8.5). This avoids silently emitting English in job output when a team's primary locale is non-English.

### 8.4 Localized Error Messages

> **Design constraint (verified against `errors.ts`).** The existing error classes have specific, stable constructor signatures, e.g. `NotFoundError(resource: string = 'Resource')` constructs `${resource} not found`, and `ValidationError(details: Array<{ field; message }>)` carries per-field messages. Changing these signatures would break every existing call site (hundreds of throws across services). We therefore adopt a **non-breaking, opt-in** localization strategy: the error classes keep their current string-based constructors, and localization is applied **at the throw site** using the request-scoped `t()` helper (§8.3). No string-sniffing (e.g. "if it contains `:`, treat as a key") — that pattern is fragile and couples error construction to i18n, which breaks for errors thrown outside a request scope (background jobs, startup).

**File:** `packages/backend/src/utils/errors.ts` (modified — additive only)

The existing classes are unchanged. We add an optional `code`/`params` channel so the error middleware can re-localize if needed, and a helper for the common "entity not found" pattern:

```typescript
import { t } from '../i18n/requestT';

/**
 * Resolve a localized "X not found" message. Prefer this over raw
 * `new NotFoundError('Notification')` so the phrase is translated per locale.
 */
export function notFound(entityKey: string, params?: Record<string, unknown>): NotFoundError {
  // entityKey is a translation key, e.g. 'common:notification'
  return new NotFoundError(t('errors:entityNotFound', { entity: t(entityKey, params) }));
}

/**
 * Resolve an arbitrary localized error. Use when the message must be translated.
 */
export function localizedError(
  key: string,
  params: Record<string, unknown> = {},
  statusCode = 400,
  code = 'BAD_REQUEST'
): AppError {
  return new AppError(t(key, params), statusCode, code);
}
```

**Usage — before vs after:**

```typescript
// Before (hardcoded English):
throw new NotFoundError('Notification');

// After (localized, non-breaking — old call sites still compile):
import { notFound } from '../utils/errors';
throw notFound('common:notification');

// Arbitrarily localized messages:
import { localizedError } from '../utils/errors';
throw localizedError('errors:emailAlreadyExists', { email }, 409, 'CONFLICT');
```

Existing call sites continue to work (they pass a raw English string); they are migrated incrementally to `notFound(...)` / `localizedError(...)` as part of the phased rollout (§19). The `errors.json` namespace carries the templates:

```json
{
  "entityNotFound": "{{entity}} not found",
  "emailAlreadyExists": "An account with email {{email}} already exists",
  "invalidCredentials": "Invalid email or password",
  "forbidden": "You do not have permission to perform this action"
}
```

### 8.4b Localized Validation Messages (Zod → `ValidationError`)

> **Gap addressed:** the `validateBody`/`validateParams`/`validateQuery` middleware (`validation.middleware.ts`) maps each Zod issue's `err.message` directly into the `ValidationError` details array. Today those messages are raw English strings baked into Zod schemas (e.g. `'First name is required'`). To localize them, schemas declare **translation keys** as messages and the middleware resolves them via `t()` before constructing the `ValidationError`.

**Step 1 — schemas use translation keys as messages.**

**File:** `packages/backend/src/validations/auth.validation.ts` (modified)

```typescript
import { z } from 'zod';
import { SUPPORTED_LOCALES } from '@scrumooth/shared';

// Reusable localized field validators. The message is a translation key
// (namespace:key); the validation middleware resolves it per-request locale.
const localizedString = (fieldKey: string, maxLength = 100) =>
  z
    .string()
    .min(1, { message: 'validation:fieldRequired' })
    .max(maxLength, { message: 'validation:fieldTooLong' })
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= 1, { message: 'validation:fieldRequired' });

export const updateProfileSchema = z.object({
  firstName: localizedString('validation:firstName', 100),
  lastName: localizedString('validation:lastName', 100),
  locale: z.enum(SUPPORTED_LOCALES as [string, ...string[]]).optional(),
});
```

> **TypeScript strict note.** `SUPPORTED_LOCALES` is `readonly ['en','de','fr','es','it']` (declared `as const`). `z.enum()` requires a mutable `[string, ...string[]]` tuple, so cast: `z.enum(SUPPORTED_LOCALES as [string, ...string[]])`. Without the cast, `z.enum(SUPPORTED_LOCALES)` fails typecheck under `strict` because the `as const` tuple is `readonly`.

**Step 2 — validation middleware resolves message keys.**

**File:** `packages/backend/src/middleware/validation.middleware.ts` (modified)

```typescript
import { t } from '../i18n/requestT';

// A message is treated as a translation key if it matches `ns:key` shape.
// Otherwise (raw string) it is passed through unchanged — preserves backwards
// compatibility with schemas that have not yet been migrated.
const resolveMessage = (message: string, ctx?: Record<string, unknown>): string => {
  return message.includes(':') ? t(message, ctx) : message;
};

// Inside validateBody/validateParams/validateQuery, replace the details mapping:
const details = error.issues.map((err) => ({
  field: err.path.join('.') || 'value',
  message: resolveMessage(err.message, err.params as Record<string, unknown> | undefined),
}));
```

**`validation.json` namespace (backend):**

```json
{
  "fieldRequired": "This field is required",
  "fieldTooLong": "This field is too long",
  "invalidEmail": "Please enter a valid email address",
  "passwordTooShort": "Password must be at least {{min}} characters",
  "firstName": "First name",
  "lastName": "Last name"
}
```

### 8.4c Localized Error Middleware (Prisma, JWT, session, route-not-found)

> **Gap addressed:** `error.middleware.ts` produces many hardcoded English strings that bypass the error classes entirely — Prisma error mapping (`P2002` "already exists", `P2025` "Record not found", `P2003`, `P2014`), JWT errors ("Invalid token", "Token has expired"), session messages ("Please log in again to continue"), and the catch-all 404 (`Route ${method} ${path} not found`). These all need localization at the middleware layer using the request-scoped `t()`.

**File:** `packages/backend/src/middleware/error.middleware.ts` (modified — key excerpts)

```typescript
import { t } from '../i18n/requestT';

// Inside errorHandler, for AppError: the message is already resolved at throw time
// (services use notFound()/localizedError()), so no re-translation here.
if (error instanceof AppError) {
  res.status(error.statusCode).json(createErrorResponse(error.code, error.message, error.details));
  return;
}

// Prisma known errors — localize here (they don't go through AppError classes)
if (error instanceof Prisma.PrismaClientKnownRequestError) {
  handlePrismaError(error, res, fingerprint);
  return;
}

// JWT errors
if (error.name === 'JsonWebTokenError') {
  res.status(401).json(createErrorResponse('INVALID_TOKEN', t('errors:invalidToken')));
  return;
}
if (error.name === 'TokenExpiredError') {
  res.status(401).json(createErrorResponse('TOKEN_EXPIRED', t('errors:tokenExpired')));
  return;
}

// Session timeouts — localize the guidance message
if (error instanceof SessionIdleTimeoutError || error instanceof SessionAbsoluteTimeoutError) {
  res
    .status(401)
    .json(
      createErrorResponse(error.code, error.message, [
        { field: 'session', message: t('errors:pleaseLoginAgain') },
      ])
    );
  return;
}

// Catch-all 404 for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res
    .status(404)
    .json(
      createErrorResponse(
        'NOT_FOUND',
        t('errors:routeNotFound', { method: req.method, path: req.path })
      )
    );
};

const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  res: Response,
  _fingerprint: string
): void => {
  switch (error.code) {
    case 'P2002': {
      const field = (error.meta?.target as string[] | undefined)?.[0] ?? 'field';
      res
        .status(409)
        .json(
          createErrorResponse('CONFLICT', t('errors:fieldAlreadyExists', { field }), [
            { field, message: t('errors:fieldAlreadyTaken', { field }) },
          ])
        );
      break;
    }
    case 'P2025':
      res.status(404).json(createErrorResponse('NOT_FOUND', t('errors:recordNotFound')));
      break;
    case 'P2003':
      res.status(400).json(createErrorResponse('INVALID_REFERENCE', t('errors:invalidReference')));
      break;
    case 'P2014':
      res.status(400).json(createErrorResponse('RELATION_VIOLATION', t('errors:invalidRelation')));
      break;
    default:
      res.status(500).json(createErrorResponse('DATABASE_ERROR', t('errors:databaseError')));
  }
};
```

> **Note on the production 500 fallback.** The `isProduction ? 'An unexpected error occurred' : error.message` branch should also use `t('errors:unexpectedError')` in production. In development, keep `error.message` (raw) for debugging.

### 8.5 Localized Email Templates

> **Compatibility note (verified against `BaseEmailTemplate.ts`).** `BaseTemplateData` currently **requires** a `subject: string` field, and `BaseEmailTemplate<T>.render(data)` receives the subject from the caller. When localizing, the subject is derived from `t()` inside `render()`, which makes the `subject` field redundant. To avoid a breaking change to `BaseTemplateData`, the localized templates **ignore `data.subject`** and compute the subject from `t('…subject')`. Callers may pass an empty/dummy `subject` to satisfy the type. A future refactor (out of scope for v1) could make `subject` optional in `BaseTemplateData` and have each template compute it.

**File:** `packages/backend/src/services/email/templates/PasswordResetTemplate.ts` (modified)

```typescript
import { i18nInstance } from '../../i18n/config';
import type { Locale } from '@scrumooth/shared';
import type { RenderedEmail } from './BaseEmailTemplate';

export interface PasswordResetTemplateData {
  locale: Locale; // NEW — drives all string resolution
  firstName: string;
  email: string;
  resetUrl: string;
  expiresIn: string;
  appName: string;
  appUrl: string;
  supportEmail?: string;
  currentYear: number;
}

export class PasswordResetTemplate extends BaseEmailTemplate<PasswordResetTemplateData> {
  getTemplateName(): string {
    return 'password-reset';
  }

  render(data: PasswordResetTemplateData): RenderedEmail {
    const t = i18nInstance.getFixedT(data.locale, 'emails');
    const subject = t('passwordReset.subject');
    const heading = t('passwordReset.heading', { name: data.firstName });
    const bodyIntro = t('passwordReset.bodyIntro', { email: data.email });
    const cta = t('passwordReset.cta');
    const expiresIn = t('passwordReset.expiresIn', { duration: data.expiresIn });
    // ... build HTML/text using translated strings instead of hardcoded English
    return { html: /* ... */ '', text: /* ... */ '' };
  }
}
```

**`emails.json` namespace (backend), `en`:**

```json
{
  "passwordReset": {
    "subject": "Reset your Scrumooth password",
    "heading": "Hi {{name}},",
    "bodyIntro": "We received a request to reset the password for {{email}}.",
    "cta": "Reset password",
    "expiresIn": "This link expires in {{duration}}."
  }
}
```

> **Email subject length risk (gap j).** German and French translations are typically 20–35% longer than English. RFC 5322 recommends subject lines ≤ 78 characters (hard limit 998). Long localized subjects may be truncated by email clients (especially mobile). Mitigations: (1) keep subject translation keys short and avoid concatenating multiple clauses; (2) add a CI check that flags any localized subject > 78 characters; (3) prefer `passwordReset.subject` (terse) over `passwordReset.subjectPrefix` + `passwordReset.subjectSuffix` concatenation. See risk R11.

### 8.6 Localized Notifications

**File:** `packages/backend/src/services/notification.service.ts` (modified)

```typescript
// New method: create from a translation key with per-user locale
async createLocalized(input: {
  userId: string;
  type: NotificationType;
  titleKey: string;
  messageKey?: string;
  messageParams?: Record<string, unknown>;
  data?: Prisma.InputJsonValue;
  createdBy?: string;
}): Promise<Notification> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { locale: true },
  });

  const t = i18nInstance.getFixedT(user?.locale ?? DEFAULT_LOCALE, 'notifications');
  const title = t(input.titleKey, input.messageParams);
  const message = input.messageKey ? t(input.messageKey, input.messageParams) : undefined;

  return this.create({
    userId: input.userId,
    type: input.type,
    title,
    message,
    data: input.data,
    createdBy: input.createdBy,
  });
}
```

> **Note:** Notifications store the **resolved** (translated) title/message, not keys, because (a) the user's locale may change after the notification is created, and (b) storing keys would require re-translating on every read. The trade-off: a notification created while the user's locale was `de` remains in German even if they switch to `fr`. This is acceptable and matches common practice (Slack, GitHub).

### 8.7 Audit Logging of Locale Changes

> **Gap addressed (f).** The project's convention is that significant user actions are audit-logged via `auditLog`/`auditResourceEvent` (`auditLogger.ts`). A locale change is a profile preference change and should be audited for consistency with `changePassword` (which is already audited via `auditAuthEvent('PASSWORD_CHANGE', ...)`). This also provides a trail for diagnosing "why is my UI in the wrong language" support tickets.

**File:** `packages/backend/src/controllers/auth.controller.ts` (modified `updateProfile`)

```typescript
import {
  auditResourceEvent,
  AuditEventTypes,
  AuditActions,
  AuditResults,
} from '../utils/auditLogger';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = req.validatedBody as UpdateProfileInput;
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  });

  const user = await authService.updateProfile(userId, data);

  // Audit-log only when the locale actually changed (avoid noise on name-only edits)
  if (data.locale && data.locale !== previous?.locale) {
    auditResourceEvent(
      AuditEventTypes.USER,
      AuditActions.UPDATE,
      AuditResults.SUCCESS,
      { type: 'user', id: userId, name: user.email },
      { field: 'locale', from: previous?.locale ?? DEFAULT_LOCALE, to: data.locale }
    );
  }

  // Keep the locale cookie in sync for SSR/refresh
  res.cookie('scrumooth_locale', user.locale, {
    maxAge: 31536000,
    sameSite: 'strict',
    secure: true,
    httpOnly: false,
    path: '/',
  });

  res.json(createSuccessResponse(user));
});
```

> **Note:** `updateProfile` currently reads from `req.body`; switch it to `req.validatedBody` (the validated payload from `validateBody(updateProfileSchema)`) for consistency with the validation middleware contract and to ensure the `locale` value is type-checked.

---

## 9. Shared Package Integration

### 9.1 New Exports

**File:** `packages/shared/src/constants/index.ts` (extended)

```typescript
export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

export const LOCALE_CURRENCIES: Record<Locale, string> = {
  en: 'EUR',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
};
```

**File:** `packages/shared/src/utils/locale.ts` (new)

```typescript
import type { Locale } from '../constants';

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

export function isRTL(locale: Locale | string): boolean {
  return RTL_LANGUAGES.has(getBaseLanguage(locale));
}

export function getDirection(locale: Locale | string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getBaseLanguage(locale: string): string {
  return locale.split('-')[0].toLowerCase();
}

export function isSupportedLocale(locale: string): locale is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale as Locale);
}

export function normalizeLocale(locale: string): Locale {
  const base = getBaseLanguage(locale);
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}
```

**File:** `packages/shared/src/utils/formatters.ts` (new)

```typescript
import { format, parseISO, type Locale as DateFnsLocale } from 'date-fns';
import { enUS, de, fr, es, it } from 'date-fns/locale';
import type { Locale } from '../constants';
import { DEFAULT_LOCALE } from '../constants';

// `Record<Locale, DateFnsLocale>` is fully populated for every supported locale,
// so direct indexing is safe. We assert the record type (not `Partial`) so that
// `DATE_FNS_LOCALES[locale]` is `DateFnsLocale` (not `DateFnsLocale | undefined`)
// even under `noUncheckedIndexedAccess`. The fallback guards against runtime
// values that bypass the `Locale` type (e.g., an unchecked query param).
const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enUS, de, fr, es, it };

function resolveDateFnsLocale(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale] ?? DATE_FNS_LOCALES[DEFAULT_LOCALE];
}

export function formatDate(date: Date | string, locale: Locale, fmt = 'PP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: resolveDateFnsLocale(locale) });
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(value: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diffSeconds = (d.getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absDiff < 60) return rtf.format(Math.round(diffSeconds), 'second');
  if (absDiff < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (absDiff < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  if (absDiff < 604800) return rtf.format(Math.round(diffSeconds / 86400), 'day');
  if (absDiff < 2592000) return rtf.format(Math.round(diffSeconds / 604800), 'week');
  if (absDiff < 31536000) return rtf.format(Math.round(diffSeconds / 2592000), 'month');
  return rtf.format(Math.round(diffSeconds / 31536000), 'year');
}

export function formatList(
  items: string[],
  locale: Locale,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, { type }).format(items);
}

/**
 * Locale-aware string comparison/sort. Use this when sorting user-facing lists
 * by name (e.g., backlog items, team members) so that accented characters and
 * locale-specific collation rules are respected. See ADR-010.
 */
export function createCollator(
  locale: Locale,
  options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true }
): Intl.Collator {
  return new Intl.Collator(locale, options);
}

export function sortLocaleStrings(items: string[], locale: Locale): string[] {
  return [...items].sort(createCollator(locale).compare);
}
```

> **Note:** `date-fns` is a frontend dependency today. To share formatters in `@scrumooth/shared`, add `date-fns` as a dependency of the shared package (it's tree-shakeable and the locale imports are small). The backend can also use these formatters for email rendering.

### 9.2 Shared Package Dependencies

**File:** `packages/shared/package.json` (add)

```json
{
  "dependencies": {
    "date-fns": "^4.4.0"
  }
}
```

---

## 10. Translation File Format & Organization

### 10.1 JSON Schema

Each translation file is a flat or shallow-nested JSON object. **Keys are camelCase**, values are strings (or arrays for plural variants using the `_one`/`_other` suffix convention, or ICU `{count, plural, ...}` inline).

**Example:** `packages/frontend/src/locales/en/common.json`

```json
{
  "appName": "Scrumooth",
  "language": "Language",
  "selectLanguage": "Select language",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "loading": "Loading...",
  "search": "Search",
  "noResults": "No results found",
  "confirm": "Confirm",
  "close": "Close",
  "back": "Back",
  "next": "Next",
  "previous": "Previous",
  "yes": "Yes",
  "no": "No",
  "all": "All",
  "none": "None",
  "actions": "Actions",
  "status": "Status",
  "created": "Created",
  "updated": "Updated",
  "by": "by",
  "required": "Required",
  "optional": "Optional"
}
```

**Example with pluralization:** `packages/frontend/src/locales/en/sprint.json`

```json
{
  "title": "Active Sprint",
  "daysRemaining": "{{count}} day remaining",
  "daysRemaining_other": "{{count}} days remaining",
  "tasksCompleted": "{{count}} of {{total}} tasks completed",
  "storyPoints": "{{count}} story point",
  "storyPoints_other": "{{count}} story points"
}
```

**Example with interpolation & context:** `packages/frontend/src/locales/en/notifications.json`

```json
{
  "taskAssigned": "Task \"{{taskTitle}}\" was assigned to you",
  "teamInvitation": "You've been invited to join team \"{{teamName}}\"",
  "impedimentReported": "New impediment reported: {{title}}",
  "dailyScrumReminder": "Don't forget to post your daily update"
}
```

### 10.2 Key Naming Conventions

| Rule                                                   | Example                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| camelCase keys                                         | `daysRemaining`, not `days_remaining`                         |
| Namespace = feature                                    | `backlog:moscowMustHave`                                      |
| Descriptive, not abbreviated                           | `passwordStrengthWeak`, not `pwWeak`                          |
| Plural suffix `_other` (i18next convention)            | `task`, `task_other`                                          |
| Context suffix `_<context>`                            | `role_sm` (Scrum Master), `role_po` (Product Owner)           |
| No nested objects beyond 1 level (flattened preferred) | `"backlog.emptyState"` not `{ backlog: { emptyState: ... } }` |

### 10.3 Terminology Glossary

**File:** `packages/shared/i18n/glossary.json`

```json
{
  "Sprint": {
    "en": "Sprint",
    "de": "Sprint",
    "fr": "Sprint",
    "es": "Sprint",
    "it": "Sprint"
  },
  "Scrum Master": {
    "en": "Scrum Master",
    "de": "Scrum Master",
    "fr": "Scrum Master",
    "es": "Scrum Master",
    "it": "Scrum Master"
  },
  "Product Owner": {
    "en": "Product Owner",
    "de": "Product Owner",
    "fr": "Product Owner",
    "es": "Product Owner",
    "it": "Product Owner"
  },
  "Product Backlog": {
    "en": "Product Backlog",
    "de": "Product Backlog",
    "fr": "Product Backlog",
    "es": "Product Backlog",
    "it": "Product Backlog"
  },
  "Burndown Chart": {
    "en": "Burndown Chart",
    "de": "Burndown-Diagramm",
    "fr": "Graphique d'avancement",
    "es": "Gráfico de burn-down",
    "it": "Grafico burndown"
  },
  "Definition of Done": {
    "en": "Definition of Done",
    "de": "Definition of Done",
    "fr": "Definition of Done",
    "es": "Definición de Hecho",
    "it": "Definition of Done"
  },
  "Story Points": {
    "en": "Story Points",
    "de": "Story Points",
    "fr": "Story Points",
    "es": "Story Points",
    "it": "Story Points"
  }
}
```

CI verifies that glossary terms appear verbatim in the corresponding locale files (preventing, e.g., "Sprint" being translated as "Iteration" in German when the glossary mandates "Sprint").

---

## 11. Pluralization & Cultural Formatting

### 11.1 Pluralization

`i18next` with `i18next-intlpluralresolver` uses CLDR plural rules. Each locale has plural categories:

| Locale | Plural categories |
| ------ | ----------------- |
| en     | one, other        |
| de     | one, other        |
| fr     | one, many, other  |
| es     | one, many, other  |
| it     | one, many, other  |

**Translation file convention (i18next default suffixes):**

```json
{
  "item": "{{count}} item",
  "item_other": "{{count}} items"
}
```

For French/Spanish/Italian with `many` category:

```json
{
  "item": "{{count}} élément",
  "item_many": "{{count}} éléments",
  "item_other": "{{count}} éléments"
}
```

**Usage:**

```tsx
const { t } = useTranslation('backlog');
<span>{t('item', { count: items.length })}</span>;
// count=1 → "1 item", count=5 → "5 items"
```

### 11.2 Date Formatting

```tsx
import { formatDate } from '@scrumooth/shared';
import { useI18nStore } from '@/i18n/useI18nStore';

const { locale } = useI18nStore();
<span>{formatDate(sprint.startDate, locale, 'PPP')}</span>;
// en: "January 31st, 2026"
// de: "31. Januar 2026"
// fr: "31 janvier 2026"
// es: "31 de enero de 2026"
// it: "31 gennaio 2026"
```

### 11.3 Number & Currency Formatting

```tsx
import { formatNumber, formatCurrency } from '@scrumooth/shared';

formatNumber(1234567.89, 'de'); // "1.234.567,89"
formatNumber(1234567.89, 'en'); // "1,234,567.89"

formatCurrency(42.5, 'de', 'EUR'); // "42,50 €"
formatCurrency(42.5, 'en', 'EUR'); // "€42.50"
```

### 11.4 Relative Time

```tsx
import { formatRelativeTime } from '@scrumooth/shared';

formatRelativeTime(new Date(Date.now() - 86400000), 'fr'); // "hier"
formatRelativeTime(new Date(Date.now() - 86400000), 'en'); // "yesterday"
```

### 11.5 List Formatting

```tsx
import { formatList } from '@scrumooth/shared';

formatList(['Alice', 'Bob', 'Charlie'], 'en'); // "Alice, Bob, and Charlie"
formatList(['Alice', 'Bob', 'Charlie'], 'fr'); // "Alice, Bob et Charlie"
formatList(['Alice', 'Bob', 'Charlie'], 'de'); // "Alice, Bob und Charlie"
```

### 11.6 Locale-Aware Collation & Sorting (gap a)

Sorting user-facing string lists must respect locale collation rules. Use the shared helpers (ADR-010):

```tsx
import { sortLocaleStrings, createCollator } from '@scrumooth/shared';
import { useI18nStore } from '@/i18n/useI18nStore';

const { locale } = useI18nStore();

// Sort a list of strings
const sortedNames = sortLocaleStrings(['Zoe', 'Äppler', 'Aaron', 'Özdemir'], locale);
// de: ['Aaron', 'Äppler', 'Özdemir', 'Zoe']  (ä treated like a, ö like o)
// en: ['Aaron', 'Äppler', 'Zoe', 'Özdemir']  (accents sort after base letters)

// Sort objects by a localized field
const collator = createCollator(locale);
const sortedBacklog = [...items].sort((a, b) => collator.compare(a.title, b.title));
```

> **Avoid** `Array.prototype.sort()` on string fields without a collator — it uses UTF-16 code-unit order and mis-sorts accented characters in all five target locales.

### 11.7 Timezone vs Locale Distinction (gap c)

**Locale controls _format_; timezone controls _instant_.** These are orthogonal concerns and must not be conflated:

| Concern                              | Controlled by                          | Example                                                    |
| ------------------------------------ | -------------------------------------- | ---------------------------------------------------------- |
| Date/number/currency _format_        | Locale (`de`, `fr`, ...)               | `31.01.2026` vs `01/31/2026`                               |
| Which _instant_ a timestamp displays | Timezone (`Europe/Berlin`, `UTC`, ...) | `2026-01-31T10:00:00Z` → `11:00` (Berlin) vs `10:00` (UTC) |

**Scrumooth's current rules (verified):**

- All timestamps are stored in PostgreSQL as `@db.Timestamptz(3)` (UTC). This does **not** change.
- The API returns ISO-8601 UTC strings (e.g., `2026-01-31T10:00:00.000Z`).
- The frontend converts to a `Date` object and formats with `formatDate(date, locale)` / `formatRelativeTime(date, locale)`. `date-fns` `format` renders in the **user's local browser timezone** by default (via `Date`'s local methods). This is the current, acceptable behavior: a user in Berlin sees sprint times in Europe/Berlin, a user in London sees Europe/London.

**What i18n does NOT change:** we do **not** introduce a per-user `timezone` column in this phase. A future "display timezone" feature (letting a Berlin-based user view times in a teammate's Lagos timezone) is out of scope and would be a separate ADR. The locale switch only changes the _format_ (e.g., `31. Januar 2026, 11:00` vs `January 31, 2026, 11:00`), not the underlying instant.

**Implementation guidance:**

```tsx
// ✅ Correct: locale controls format; Date uses the browser's local timezone
import { formatDate } from '@scrumooth/shared';
<span>{formatDate(sprint.startDate, locale, 'PPP p')}</span>

// ❌ Wrong: hardcoding a locale assumption or a timezone
<span>{sprint.startDate.toLocaleString('en-US')}</span>  // hardcoded locale
<span>{new Date(sprint.startDate).toLocaleString('de-DE', { timeZone: 'UTC' })}</span>
// ⚠️ The above forces UTC display — only do this if explicitly showing UTC,
//    and still pass the user's locale for formatting consistency.
```

> **Backend:** never localize timestamps in API responses. Always return ISO-8601 UTC. Localization happens exclusively on the client. The backend `formatDate`/`formatRelativeTime` helpers exist only for **email rendering**, where the recipient's locale (and optionally their timezone) is known.

---

## 12. Fallback Mechanisms

### 12.1 Fallback Chain (i18next)

```
requested locale (e.g., "de-AT")
  → "de" (base language, via load: 'languageOnly')
    → "en" (default, via fallbackLng)
      → key string (via parseMissingKeyHandler)
```

### 12.2 Namespace-Level Fallback

If an entire namespace JSON file is missing for a locale (e.g., `de/retrospective.json` not yet translated), i18next falls back to `en/retrospective.json` automatically.

### 12.3 Missing Key Handling

| Environment | Behavior                                           |
| ----------- | -------------------------------------------------- |
| Development | `console.warn` + log to a missing-keys file        |
| Production  | Return the key string (never throw) + log to audit |
| Test        | Fail the test (catch untranslated strings in CI)   |

### 12.4 Network Failure (Lazy Load)

If the HTTP fetch for a locale bundle fails (offline, CDN issue):

1. Retry once with exponential backoff (built into `i18next-http-backend`).
2. On persistent failure, fall back to `en` (already bundled for `common`, lazy-fetched for others).
3. Display a non-blocking toast: "Some translations could not be loaded; showing English."

### 12.5 Backend Fallback

The backend `i18nInstance` preloads all locales at startup. If a key is missing for a user's locale, it falls back to `en` via `fallbackLng`. There is no network-failure risk (no lazy loading on backend).

### 12.6 Partial-Translation Production Policy (gap n)

During gradual rollout and ongoing development, a non-default locale may be incomplete (e.g., `de` at 95%). This is the policy for shipping partial translations:

| Coverage                         | Policy                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **100%** (all `en` keys present) | Ship normally.                                                                                                                                                                                            |
| **≥ 90%**                        | **Shipable.** Missing keys fall back to `en` (ADR-004). The `missingKeyHandler` logs the gap to the audit log in production so translation debt is visible.                                               |
| **< 90%**                        | **Not shipable for that locale as a default.** The locale remains selectable, but the language switcher shows a "beta" badge and a tooltip: "{{percent}}% translated — some text will appear in English." |
| **< 50%**                        | Locale is hidden from the switcher entirely (still loadable via cookie/URL for testers) until coverage recovers.                                                                                          |

**Rules:**

1. The `en` baseline is **always 100%** — it is the source of truth and the final fallback. A missing `en` key is a CI-breaking bug (the `validate.mjs` script enforces this).
2. A locale dropping below 90% after a feature release is acceptable for **one release cycle**; a follow-up ticket is auto-created from the completeness report to restore coverage.
3. `.i18nignore` entries (explicitly-allowed missing keys) do **not** count against coverage and do not trigger the beta badge. They are the sanctioned mechanism for shipping an English-only feature to all locales temporarily. Each `.i18nignore` entry must have an expiry date (a linked issue); the CI report flags expired entries.
4. The completeness gate (`i18n:completeness`) is a **reporting** gate by default, not a hard CI failure, except for the `en` baseline (which is hard-fail). This avoids blocking all feature development on translation completion.

---

## 13. Translation Workflow & Tooling

### 13.1 Developer Workflow (Adding a New String)

1. Add the key with English value to `packages/frontend/src/locales/en/{namespace}.json`.
2. Run `pnpm run i18n:check` locally — it reports missing keys in `de/fr/es/it`.
3. Either:
   - Add translations to all locale files (if the developer knows the languages), or
   - Add the key to `.i18nignore` (temporary, until a translator fills it in). The CI allows merges with `.i18nignore` entries but flags them for follow-up.
4. Use the key in the component: `const { t } = useTranslation('namespace'); t('myNewKey')`.
5. Commit. CI validates JSON structure + completeness.

### 13.2 Translator Workflow

**Option A (Git-based, for small teams):**

1. Translator clones the repo (or uses a web Git editor).
2. Edits `packages/frontend/src/locales/{their-locale}/{namespace}.json`.
3. Opens a PR.
4. CI runs the terminology glossary check + JSON validation.
5. Reviewer (developer who speaks the language) approves.

**Option B (TMS-based, for scaling):**

1. Configure a TMS (Crowdin/Transifex) to sync with `packages/frontend/src/locales/`.
2. Translators work in the TMS UI (no Git knowledge needed).
3. TMS auto-opens PRs with completed translations.
4. CI validates the PR.

### 13.3 CI Pipeline Stages

**File:** `.github/workflows/ci.yml` (extended)

```yaml
- name: i18n validation
  run: |
    pnpm run i18n:check
    pnpm run i18n:glossary
    pnpm run i18n:completeness
```

**File:** `package.json` (root, scripts)

```json
{
  "scripts": {
    "i18n:check": "node scripts/i18n/validate.mjs",
    "i18n:extract": "node scripts/i18n/extract.mjs",
    "i18n:completeness": "node scripts/i18n/completeness-report.mjs",
    "i18n:glossary": "node scripts/i18n/sync-glossary.mjs"
  }
}
```

### 13.4 Validation Script (Pseudo)

**File:** `scripts/i18n/validate.mjs`

```javascript
// Checks:
// 1. All JSON files are valid JSON
// 2. All en/ keys exist in de/, fr/, es/, it/ (or in .i18nignore)
// 3. No extra keys in non-en locales (stale translations)
// 4. No empty string values
// 5. Interpolation placeholders {{x}} match between en and translations
```

### 13.5 Completeness Report

```
i18n Completeness Report
========================
Locale: de (German)
  common:           80/80 (100%)
  auth:             38/40 (95%)  ← 2 missing keys
  backlog:         148/150 (98%)
  ...
Locale: fr (French)
  common:           80/80 (100%)
  ...

Overall: 94% complete across non-default locales.
```

### 13.6 Concurrency & Conflict Resolution in Translation Files (gap e)

**Problem.** When two developers add keys to the same namespace JSON (e.g., both add keys to `en/backlog.json` in different PRs), Git produces a merge conflict on the JSON file. Because JSON has no comment lines and trailing commas are illegal, conflicts are noisy and error-prone to resolve manually.

**Mitigations:**

1. **Keep keys sorted alphabetically.** The `validate.mjs` script includes an `--fix` mode that sorts keys within each namespace file. Sorting makes conflicts localized to the actual changed key instead of a whole block. Add a pre-commit hook (`pnpm run i18n:sort`) that auto-sorts before commit.
2. **One namespace per PR where feasible.** Reviewers should request that large i18n PRs split by namespace to reduce conflict surface.
3. **Conflict resolution convention.** When resolving a JSON merge conflict, **always take both sides** (union of keys). The `i18n:check` script then validates that every key in `en` exists in all other locales — a missing key after merge is caught by CI, not by the conflict resolver. Never delete a key to resolve a conflict unless both sides agree it should be removed.
4. **Translation-file lockfile (optional).** For very large teams, a `.i18nlock` file (similar to `package-lock.json`) can record the last-known key set; the script auto-merges non-conflicting additions. Out of scope for v1; the alphabetical-sort + union convention is sufficient for an 80-person organization.
5. **TMS-based workflow eliminates the problem entirely** (ADR-007 Option B) — translators work in the TMS, which exports a complete, deterministic JSON file per PR. Conflicts only arise when two developers change the **same** key, which is rare and reviewable.

### 13.7 Translation Key Lifecycle (gap m)

Keys evolve. A key's English value may change meaning over time. The lifecycle policy:

| Event                                                                        | Action                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Add a key**                                                                | Add to `en/{ns}.json`, use in code, add to other locales (or `.i18nignore`).                                                                                                                                                                                                         |
| **Change a value's _wording_ (same meaning)**                                | Update the `en` value in place. Translators update other locales via the TMS/PR. The key name stays. Example: "Save" → "Save changes" — same `common:save` key.                                                                                                                      |
| **Change a key's _meaning_** (the same string now means something different) | **Rename the key** (e.g., `common:save` → `common:saveChanges`). Do NOT reuse the old key with a new meaning — translators' memories and TMS translation memories would silently apply the old translation. Remove the old key and add the new one in the same PR.                   |
| **Remove a key**                                                             | Delete from `en/{ns}.json` **and** all locale files in the same commit. The `validate.mjs` "no extra keys in non-en locales" check catches stale keys left behind.                                                                                                                   |
| **Move a key between namespaces**                                            | Treat as remove + add (old `backlog:priority` → new `common:priority`). Update all call sites.                                                                                                                                                                                       |
| **Deprecate (temporary)**                                                    | Prefer deletion. There is no "deprecated" status — unused keys are dead weight and translation cost. If a key may be needed again soon, leave it in `en` and mark the code call site with a comment; the glossary/CI does not flag unused keys (out of scope), so rely on PR review. |

**Key naming stability.** Keys are part of the API contract between code and translations. Prefer stable, descriptive key names that survive minor wording changes (e.g., `auth:loginFailed` survives "Login failed" → "Unable to sign in"). Avoid keys that encode the current wording (e.g., `auth:unableToSignInPleaseTryAgain` — too brittle).

### 13.8 `extract.mjs` Specification (gap d)

The `extract.mjs` script is a **heuristic migration assistant** that scans `.tsx`/`.ts` files for likely-translatable hardcoded strings and reports them (it does not auto-rewrite code). It is not a compile-time extractor (we use runtime `t()` calls, not macros); its purpose is to surface the ~2,000 strings that need manual extraction.

**Scan targets (in priority order):**

| Pattern                                                                          | How detected                                                             | Example                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- | ---- | ----- | ----------------------- | ------------------------------- |
| JSX text nodes                                                                   | Text between `>` and `<` that is non-whitespace                          | `<h1>Welcome back</h1>`                            |
| String-valued props known to be user-facing                                      | `placeholder`, `aria-label`, `aria-describedby`, `title`, `alt`, `label` | `<input placeholder="Search..." />`                |
| `aria-*` string attributes                                                       | Any `aria-*` prop with a string literal                                  | `aria-roledescription="slider"`                    |
| String literals passed to `toast.*()` / `alert()` / `throw new ...Error(...)`    | Heuristic: call expressions matching `/^(toast\.(success                 | error                                              | info | warn) | throw new \w+Error)\(/` | `toast.error('Failed to save')` |
| Object literals with a `label`/`title`/`heading`/`message` key assigned a string | Shallow scan of object literals                                          | `{ label: 'Dashboard' }` (catches `navigation.ts`) |

**Exclusions:**

- Files under `src/locales/`, `src/__tests__/`, `*.test.*`, `*.spec.*`, `e2e/`.
- Strings that are clearly non-translatable: imports, type annotations, `data-testid`, `className`, `key={...}`, URLs, regex, console/log messages, string literals that are enum-like (all-caps `SCREAMING_CASE`) or clearly identifiers (`camelCase` assigned to a variable named `id`/`key`/`type`).
- Strings already wrapped in `t(...)` or `t.match(...)`.

**Output:** a JSON report mapping `filePath:line` → `{ snippet, suggestedNamespace, suggestedKey }`, where the suggested namespace is inferred from the nearest `pages/<feature>/` directory and the suggested key is a camelCased slug of the string. The report is consumed by the developer during migration (Appendix D step 1).

**Limitations (documented):**

- False positives are expected (e.g., a string literal that is a CSS class name passed as a prop). The report is a starting point, not a source of truth.
- Template literals with interpolation (`` `Hello ${name}` ``) are flagged with a suggestion to convert to `t('greeting', { name })`.
- The script does **not** modify files; it only reports. Auto-rewriting JSX to insert `t()` calls is intentionally out of scope because correct key naming requires human judgment.

---

## 14. Performance Optimization

### 14.1 Bundling Strategy

| What                                       | How                                          | Size Impact                |
| ------------------------------------------ | -------------------------------------------- | -------------------------- |
| Default locale (`en`) + `common` namespace | Bundled via Vite `import`                    | +3 KB gzipped (main chunk) |
| Other locales                              | Lazy-fetched JSON via `i18next-http-backend` | 0 KB initial               |
| Non-common namespaces (en)                 | Lazy-fetched on route entry                  | 0 KB initial               |

### 14.2 Caching

| Layer                       | Strategy                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **Browser HTTP cache**      | `Cache-Control: public, max-age=31536000, immutable` (Vite emits content-hashed filenames) |
| **i18next resource cache**  | In-memory after first fetch (survives route changes)                                       |
| **Service Worker** (future) | Pre-cache all locale bundles for offline use                                               |

### 14.3 Preloading & Prefetching

```typescript
// On app init: preload the user's locale in parallel with auth
const detectedLocale = getLocaleFromCookie() ?? getLocaleFromBrowser();
await i18nInstance.loadLanguages(detectedLocale);
await i18nInstance.loadNamespaces(['common', 'dashboard']); // initial route

// On nav hover: prefetch the target namespace
<navLink onMouseEnter={() => i18nInstance.loadNamespaces(['backlog'])}>
```

### 14.4 Render Optimization

- `useTranslation('namespace')` is scoped to a namespace; only re-renders components using that namespace on language change.
- Avoid `useTranslation()` with no namespace (loads all).
- Memoize formatted values: `const formattedDate = useMemo(() => formatDate(date, locale), [date, locale])`.

### 14.5 Backend Performance

- Single `i18next` instance, all resources preloaded at startup — zero per-request overhead.
- `getFixedT(locale, ns)` creates a bound translator (cheap, cacheable).
- `requestContext` (AsyncLocalStorage) propagates locale without parameter threading.

### 14.6 Bundle Analysis & Size Monitoring (gap l)

Lazy loading only delivers its promised initial-bundle savings if (a) non-default locales actually stay out of the main chunk and (b) namespaces are not accidentally imported eagerly. Verify this with:

**1. Build-time visualization.** Add `rollup-plugin-visualizer` to the frontend Vite build (dev-only, gated behind an env flag so it does not slow CI):

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ...existing plugins
    process.env.ANALYZE &&
      visualizer({
        filename: 'temp/bundle-stats.html',
        template: 'treemap',
        gzipSize: true,
      }),
  ],
});
```

Run `ANALYZE=true pnpm run build` and inspect `temp/bundle-stats.html` (per the project rule, temp files go in the `temp/` folder). Confirm:

- The `i18next` + `react-i18next` + `i18next-intlpluralresolver` runtime is in the main chunk (~30 KB gzipped total).
- `en/common.json` is in the main chunk (~3 KB).
- Non-`en` locale JSONs appear as **separate** chunks (one per `{lng}/{ns}`), not inlined.
- No `de`/`fr`/`es`/`it` string appears in the main chunk.

**2. CI bundle-size gate.** Add a `bundlewatch` (or `size-limit`) step to CI that fails if the frontend main chunk grows beyond a threshold. Set the baseline after Phase 1 lands, with a +5% tolerance. This catches regressions where a developer accidentally `import`s a locale JSON eagerly (e.g., `import deBacklog from '../locales/de/backlog.json'`) instead of letting `i18next-http-backend` fetch it.

```yaml
# .github/workflows/ci.yml (extended)
- name: Bundle size check
  run: pnpm run bundlewatch
```

**3. Runtime verification.** A Playwright E2E test asserts that on first load (default `en`), the browser performs **zero** fetches to `/locales/en/*.json` for non-`common` namespaces, and that switching to `de` triggers exactly the expected set of namespace fetches. This catches lazy-loading regressions that a static bundle analysis might miss (e.g., a namespace preloaded eagerly by a hook).

```typescript
test('default locale loads only common + active namespace', async ({ page }) => {
  const localeRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/locales/')) localeRequests.push(req.url());
  });
  await page.goto('/dashboard');
  // en/common is bundled (no fetch); only en/dashboard is fetched
  await expect
    .poll(() => localeRequests)
    .toEqual(expect.arrayContaining([expect.stringContaining('/locales/en/dashboard.json')]));
  expect(localeRequests.every((u) => !u.includes('/locales/de/'))).toBe(true);
});
```

---

## 15. RTL-Ready Architecture

Although v1 ships LTR-only, the following measures ensure RTL can be added with zero refactoring:

### 15.1 CSS Logical Properties (Enforced via Stylelint)

```css
/* ❌ Avoid */
.card {
  padding-left: 16px;
  margin-right: 8px;
  text-align: left;
}

/* ✅ Use */
.card {
  padding-inline-start: 16px;
  margin-inline-end: 8px;
  text-align: start;
}
```

### 15.2 Direction-Aware Icons

```css
.arrow-back {
  transform: rotate(180deg);
}
[dir='rtl'] .arrow-back {
  transform: rotate(0deg);
}
```

### 15.3 `dir` Attribute Management

```typescript
// In I18nProvider
document.documentElement.dir = getDirection(locale);
```

### 15.4 Migration of Existing CSS

As part of the phased rollout, a Stylelint rule flags physical properties. Existing CSS modules are migrated incrementally (no big-bang rewrite).

### 15.5 Concrete Migration Example with Design Tokens (gap k)

The project's CSS modules use design tokens (`var(--space-*)`, `var(--color-*)`, etc.) and currently use **physical** properties (`margin-left`, `padding-right`, `text-align: left`). Verified instances exist across the codebase (e.g., `Dashboard.module.css`, `DailyScrum.module.css`, `LoginPage.module.css`, `Layout.module.css`). Below is a real before/after for a representative card pattern, using the project's actual token vocabulary.

**Before — `packages/frontend/src/pages/Dashboard/Dashboard.module.css` (current, physical):**

```css
.metricCard {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-left: var(--space-6); /* ❌ physical */
  margin-left: auto; /* ❌ physical */
  border: var(--border-width-1) solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  text-align: left; /* ❌ physical */
}

.metricCard .icon {
  margin-right: var(--space-2); /* ❌ physical */
  flex-shrink: 0;
}

.metricCard .arrow {
  position: absolute;
  left: 0; /* ❌ physical */
}
```

**After — logical properties (RTL-ready, same visual result in LTR):**

```css
.metricCard {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  padding-inline-start: var(--space-6); /* ✅ logical (start edge) */
  margin-inline-start: auto; /* ✅ logical (auto on start edge) */
  border: var(--border-width-1) solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  text-align: start; /* ✅ logical */
}

.metricCard .icon {
  margin-inline-end: var(--space-2); /* ✅ logical (trailing edge) */
  flex-shrink: 0;
}

.metricCard .arrow {
  position: absolute;
  inset-inline-start: 0; /* ✅ logical (start edge) */
}
```

**Property mapping reference (keep this in the translator/developer guide):**

| Physical (avoid)    | Logical (use)          | Notes                                          |
| ------------------- | ---------------------- | ---------------------------------------------- |
| `margin-left`       | `margin-inline-start`  | `inline` = horizontal axis                     |
| `margin-right`      | `margin-inline-end`    |                                                |
| `padding-left`      | `padding-inline-start` |                                                |
| `padding-right`     | `padding-inline-end`   |                                                |
| `left` (position)   | `inset-inline-start`   |                                                |
| `right` (position)  | `inset-inline-end`     |                                                |
| `text-align: left`  | `text-align: start`    |                                                |
| `text-align: right` | `text-align: end`      |                                                |
| `border-left`       | `border-inline-start`  |                                                |
| `float: left`       | (use flex/grid)        | `float` is direction-ambiguous; avoid entirely |

> **Design tokens are direction-agnostic.** `var(--space-4)`, `var(--color-surface)`, `var(--radius-md)` etc. do not change with direction — only the _edge_ they apply to changes. So the migration is purely a property-name change; token values are untouched. This keeps the design-token system stable across LTR/RTL.

---

## 16. Testing Strategy

### 16.1 Unit Tests

| Layer                | Test Scope                                                | Tool                 |
| -------------------- | --------------------------------------------------------- | -------------------- |
| Shared formatters    | `formatDate`, `formatNumber`, `formatCurrency` per locale | Vitest               |
| i18n config          | Fallback chain, missing key handling, pluralization       | Vitest               |
| Backend `t()`        | Locale resolution from request context, per-user locale   | Vitest + mocks       |
| Notification service | `createLocalized` produces correct locale strings         | Vitest + Prisma mock |

### 16.2 Component Tests

```tsx
// Example: test a component renders translated text
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { i18nInstance } from '@/i18n/config';

test('LoginPage renders German title when locale is de', async () => {
  await i18nInstance.changeLanguage('de');
  await i18nInstance.loadNamespaces(['auth']);
  const { getByText } = render(
    <I18nextProvider i18n={i18nInstance}>
      <LoginPage />
    </I18nextProvider>
  );
  expect(getByText('Willkommen zurück')).toBeInTheDocument();
});
```

### 16.3 Integration Tests

- API responses include localized error messages based on `Accept-Language` header.
- `PUT /profile { locale: 'de' }` persists and returns the updated locale.
- Email rendering produces the correct locale HTML/text.

### 16.4 E2E Tests (Playwright)

```typescript
test('user can switch language and see UI update', async ({ page }) => {
  await page.goto('/dashboard');
  await page.selectOption('[data-testid="language-select"]', 'de');
  await expect(page.locator('h1')).toContainText('Übersicht'); // German "Dashboard"
  await expect(page).toHaveLocale('de'); // custom fixture
});
```

### 16.5 CI Translation Completeness

- `pnpm run i18n:check` fails CI if any `en` key is missing from another locale (unless in `.i18nignore`).
- `pnpm run i18n:glossary` fails CI if glossary terms are not used verbatim.

---

## 17. Security Considerations

| Concern                              | Mitigation                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS via interpolation**            | `interpolation.escapeValue: false` is safe because React escapes by default. Never use `dangerouslySetInnerHTML` with translated content.                                             |
| **Malicious locale files**           | Locale JSON is author-controlled (in-repo), not user-uploaded. No risk.                                                                                                               |
| **Locale cookie tampering**          | Locale is validated against `SUPPORTED_LOCALES` on every read. Invalid values fall back to `en`.                                                                                      |
| **Accept-Language spoofing**         | Backend always prefers `User.locale` (DB) over `Accept-Language` for authenticated users. Guests using `Accept-Language` only affect their own view.                                  |
| **Translation injection in emails**  | Email templates use `i18next` interpolation (escaped). The `resetUrl` and `email` values are inserted into known-safe template positions (no script execution path in email clients). |
| **Data leakage in missing-key logs** | Missing-key logs contain only the key name, never user data.                                                                                                                          |
| **Bundle integrity**                 | Locale JSON files are content-hashed by Vite; CDN serves immutable files.                                                                                                             |

---

## 18. Risks & Mitigation Strategies

| ID  | Risk                                                                                                                                                                              | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | **Translation drift** — developers add English keys, translations lag                                                                                                             | High       | Medium | CI completeness gate + `.i18nignore` with expiry + auto-assign translator tickets                                                                                                                                                                                                                                              |
| R2  | **Bundle size bloat** from i18next + plugins                                                                                                                                      | Low        | Low    | En bundle (~3 KB gz), others lazy; monitor with `rollup-plugin-visualizer`                                                                                                                                                                                                                                                     |
| R3  | **Inconsistent terminology** across locales/translators                                                                                                                           | Medium     | Medium | Glossary + CI glossary check + translator guidelines doc                                                                                                                                                                                                                                                                       |
| R4  | **Layout shift** on language switch                                                                                                                                               | Low        | High   | Bundled en/common; preload user locale before render; CLS metric in Lighthouse                                                                                                                                                                                                                                                 |
| R5  | **Date/timezone confusion** — locale formatting vs. timezone                                                                                                                      | Medium     | Medium | Locale controls _format_; timezone is separate (UTC storage + per-user display timezone is a future feature)                                                                                                                                                                                                                   |
| R6  | **Notification locale staleness** — notification created in `de`, user switches to `fr`                                                                                           | Medium     | Low    | Documented behavior; notifications store resolved text. Mitigation: show a "translated at creation" note, or re-translate on read (future)                                                                                                                                                                                     |
| R7  | **Migration effort underestimated** — ~2,000 strings to extract                                                                                                                   | High       | High   | Phased rollout (§19); start with high-traffic pages; extraction assist script                                                                                                                                                                                                                                                  |
| R8  | **RTL future migration** fails due to physical CSS                                                                                                                                | Medium     | High   | Stylelint rule enforced now; logical properties in all new CSS                                                                                                                                                                                                                                                                 |
| R9  | **Test flakiness** due to async locale loading                                                                                                                                    | Medium     | Medium | Use `i18next` `useSuspense: true` + `waitFor` in tests                                                                                                                                                                                                                                                                         |
| R10 | **Backend job locale** — scheduled jobs have no request context                                                                                                                   | High       | Low    | Jobs explicitly pass `locale` param; default to `DEFAULT_LOCALE` or team's primary locale                                                                                                                                                                                                                                      |
| R11 | **Email subject length truncation** — localized subject lines may exceed RFC 5322 78-char recommended limit or 998-char hard limit (esp. German compounds)                        | Medium     | Medium | §8.5 documents the constraint; translators keep subjects ≤ 78 chars; `emailSubjectStats.mjs` CI check flags over-length subjects per locale; `EmailService.send()` truncates with ellipsis at 998 as a safety net                                                                                                              |
| R12 | **Test breakage from i18n** — existing unit/component/E2E tests assert English strings (e.g., `getByText('Dashboard')`) and break once UI switches to translation keys            | High       | Medium | ADR-012 three-part migration strategy: (1) unit/component tests wrap in `I18nextProvider` with `en` + assert via `t()` or English fallback, (2) E2E tests decouple via `data-testid` + `toHaveAttribute` for aria-label, (3) CI gate runs a `de` smoke test to catch regressions. Migration tracked per-namespace in Phase 2-3 |
| R13 | **Locale-aware collation divergence** — `Intl.Collator` ordering differs from default `String.prototype.sort` (e.g., German umlauts, Spanish `ñ`), causing list-order regressions | Low        | Low    | ADR-010 mandates `sortLocaleStrings()` helper for all user-visible sorted lists; unit tests assert collation order per locale                                                                                                                                                                                                  |
| R14 | **Chart.js misconfiguration** — chart axis labels, tooltips, or number formatting leak English after locale switch                                                                | Medium     | Medium | ADR-011 defines chart options as a translation surface via `useMemo`; checklist in ADR-011 verifies axis titles, ticks, tooltips, and legend. E2E test asserts chart `aria-label` updates on locale switch                                                                                                                     |

---

## 19. Implementation Roadmap

### Phase 0: Foundation (Preparation)

**Goal:** Set up infrastructure without touching user-facing UI.

- [ ] Add `i18n` dependencies to `packages/frontend` and `packages/backend`.
- [ ] Add `date-fns` to `packages/shared` dependencies.
- [ ] Create `packages/shared/src/constants` locale exports + `utils/locale.ts` + `utils/formatters.ts` (incl. `sortLocaleStrings`, `createCollator` per ADR-010).
- [ ] Create `packages/frontend/src/locales/` and `packages/backend/src/locales/` directory structure with empty `en/*.json` namespace files.
- [ ] Create `scripts/i18n/` validation tooling (`validate.mjs`, `completeness-report.mjs`, `sync-glossary.mjs`, `extract.mjs` per §13.8, `emailSubjectStats.mjs` per R11).
- [ ] Add CI stage `i18n:check` to `.github/workflows/ci.yml`.
- [ ] Create `packages/shared/i18n/glossary.json` with initial domain terms.
- [ ] Prisma migration: add `User.locale` column (default `en`).
- [ ] Backend: `LocaleResolver` middleware + `requestContext` integration + backend `i18nInstance`.
- [ ] Add `GET /api/v1/config/locales` endpoint.
- [ ] Stylelint: add logical-property rules to `.stylelintrc.json`.
- [ ] Configure `rollup-plugin-visualizer` to output to `temp/bundle-stats.html` (per §14.6) and add `bundlewatch` CI gate.

### Phase 1: Frontend Infrastructure & High-Traffic Pages

**Goal:** i18n infrastructure live; first pages translated.

- [ ] Frontend: `i18n/config.ts`, `I18nProvider`, `useI18nStore`.
- [ ] Frontend: `LanguageSwitcher` component in the sidebar/profile menu.
- [ ] Frontend: `App.tsx` wrapped in `I18nProvider`.
- [ ] Translate the **`common` namespace** (shared buttons, labels, error boundary, http errors per §7.10.3) — ~80 keys.
- [ ] Translate the **`auth` namespace** (login, register, password reset) — [LoginPage.tsx](file:///e:/ws1/ov/ce/scrumooth/packages/frontend/src/pages/Auth/LoginPage.tsx), ForgotPassword, ResetPassword.
- [ ] Translate the **`dashboard` namespace** — [Dashboard.tsx](file:///e:/ws1/ov/ce/scrumooth/packages/frontend/src/pages/Dashboard/Dashboard.tsx).
- [ ] Translate the **navigation** — [navigation.ts](file:///e:/ws1/ov/ce/scrumooth/packages/frontend/src/config/navigation.ts) labels.
- [ ] Provide complete `de`, `fr`, `es`, `it` translations for the above namespaces.
- [ ] Test infrastructure: create `I18nTestProvider` wrapper (per ADR-012) for unit/component tests; audit `auth`/`dashboard` tests and migrate to English-fallback assertions.

### Phase 2: Backend i18n & Core Feature Pages

**Goal:** Backend produces localized content; core Scrum pages translated.

- [ ] Backend: localize **email templates** (PasswordReset, Welcome) — `emails.json` namespace (address `BaseTemplateData.subject` conflict per §8.5; enforce ≤ 78-char subjects per R11).
- [ ] Backend: localize **notifications** — `notifications.json` namespace + `createLocalized` method.
- [ ] Backend: localize **error messages** — `errors.json` + `validation.json` namespaces; migrate Zod schemas to translation-key messages (§8.4b) and localize error middleware Prisma/JWT/session strings (§8.4c).
- [ ] Backend: localize `NotFoundError` via non-breaking `notFound()` helper (§8.4).
- [ ] Backend: `PUT /api/v1/auth/me/profile` accepts `locale` (route verified against [auth.routes.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/routes/auth.routes.ts)).
- [ ] Backend: audit log locale changes via `auditResourceEvent` (§8.7).
- [ ] Frontend: translate `backlog`, `sprint`, `daily-scrum` namespaces.
- [ ] Frontend: integrate `formatDate`, `formatNumber` into existing date/number displays.
- [ ] Frontend: apply `sortLocaleStrings` to all user-visible sorted lists (ADR-010).
- [ ] Frontend: apply ADR-011 Chart.js i18n pattern to Dashboard charts (axis titles, ticks, tooltips).
- [ ] Provide complete translations for the above.
- [ ] Test migration: migrate `backlog`, `sprint`, `daily-scrum` tests per ADR-012; add `data-testid` to E2E-tested elements.

### Phase 3: Remaining Pages & Polish

**Goal:** 100% UI coverage.

- [ ] Frontend: translate `impediments`, `increments`, `sprint-review`, `retrospective`, `reports`, `team`, `settings`, `notifications` (UI), `errors` (UI), `validation` (UI) namespaces.
- [ ] Frontend: translate all **empty states**, **loading states**, **error states** per §7.10 (incl. pluralized empty states, skeleton `aria-label`s, error boundary text).
- [ ] Frontend: translate all **tooltips**, **aria-labels**, **alt text**, **title attributes**, **placeholders**, **document titles** per §7.9.
- [ ] Frontend: migrate existing CSS modules to **logical properties** (Stylelint-driven; use before/after pattern from §15.5; ~40+ instances across Dashboard, DailyScrum, LoginPage, Team, Layout).
- [ ] Frontend: apply ADR-011 Chart.js i18n to all remaining charts (burndown, velocity, reports).
- [ ] E2E tests for language switching on each major page; add screen-reader assertions per §7.9.5.
- [ ] E2E: add `de` locale smoke test CI gate (per ADR-012).
- [ ] Lighthouse CLS audit after language switch = 0.
- [ ] Test migration: complete per-namespace test migration (R12).

### Phase 4: Hardening & Optimization

**Goal:** Production-grade performance and completeness.

- [ ] Prefetching of adjacent-route namespaces on hover/idle.
- [ ] Service Worker pre-caching of locale bundles (if PWA).
- [ ] Terminology glossary CI enforcement at 100%.
- [ ] Translation completeness: remove all `.i18nignore` entries (100% coverage); enforce partial-translation policy tiers from §12.6.
- [ ] Performance benchmark: language switch < 50 ms (cached), < 200 ms (first fetch).
- [ ] Bundle analysis: `bundlewatch` gates per-locale chunk sizes; `temp/bundle-stats.html` reviewed each release (§14.6).
- [ ] Accessibility audit: `lang`/`dir` correctness, screen reader testing in `de`/`fr` (per §7.9).
- [ ] Documentation: translator guide, developer i18n guide.

### Phase 5 (Future): RTL Language Support

- [ ] Add `ar` (Arabic) and/or `he` (Hebrew) to `SUPPORTED_LOCALES`.
- [ ] Import `date-fns/locale/ar` etc.
- [ ] Audit all CSS for remaining physical properties (Stylelint already enforces new code).
- [ ] Bidirectional icon mirroring pass.
- [ ] RTL-specific E2E tests.

---

## 20. Appendices

### Appendix A: Glossary of Terms

| Term                  | Definition                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **i18n**              | Internationalization — designing software to support multiple locales.                                            |
| **L10n**              | Localization — translating content for a specific locale.                                                         |
| **ICU MessageFormat** | A standardized syntax for messages with pluralization, gender, and interpolation.                                 |
| **CLDR**              | Common Locale Data Repository — the Unicode standard for locale data (plural rules, formats).                     |
| **Locale**            | A language + region identifier (e.g., `en-US`, `de-DE`). In this system, we use language-only codes (`en`, `de`). |
| **Namespace (ns)**    | A grouping of translation keys (e.g., `common`, `auth`) enabling lazy loading.                                    |
| **Fallback**          | The chain of locales checked when a translation is missing.                                                       |
| **RTL**               | Right-to-Left text direction (Arabic, Hebrew).                                                                    |
| **TMS**               | Translation Management System (Crowdin, Transifex, etc.).                                                         |

### Appendix B: New Environment Variables

| Variable            | Default          | Description                                                                      |
| ------------------- | ---------------- | -------------------------------------------------------------------------------- |
| `DEFAULT_LOCALE`    | `en`             | Application default locale                                                       |
| `SUPPORTED_LOCALES` | `en,de,fr,es,it` | Comma-separated list of supported locales (optional; can be hardcoded in shared) |

No new secrets required.

### Appendix C: File Inventory (New Files)

```
packages/
├── shared/
│   ├── i18n/
│   │   └── glossary.json                    # Terminology glossary
│   └── src/
│       ├── constants/index.ts               # +SUPPORTED_LOCALES, Locale, LOCALE_LABELS
│       └── utils/
│           ├── locale.ts                    # isRTL, getDirection, normalizeLocale
│           └── formatters.ts                # formatDate, formatNumber, formatCurrency
├── frontend/
│   └── src/
│       ├── i18n/
│       │   ├── config.ts                    # i18next initialization
│       │   ├── I18nProvider.tsx             # React provider
│       │   ├── useI18nStore.ts              # Zustand locale store
│       │   └── types.ts                     # TypeScript key types
│       ├── locales/
│       │   ├── en/{15 namespaces}.json
│       │   ├── de/{15 namespaces}.json
│       │   ├── fr/{15 namespaces}.json
│       │   ├── es/{15 namespaces}.json
│       │   └── it/{15 namespaces}.json
│       └── components/common/LanguageSwitcher/
│           ├── LanguageSwitcher.tsx
│           └── LanguageSwitcher.module.css
├── backend/
│   └── src/
│       ├── i18n/
│       │   ├── config.ts                    # Backend i18next instance
│       │   └── requestT.ts                  # Per-request t() accessor
│       ├── middleware/locale.middleware.ts  # LocaleResolver
│       └── locales/
│           ├── en/{4 namespaces}.json
│           └── {de,fr,es,it}/{4 namespaces}.json
scripts/
└── i18n/
    ├── validate.mjs                         # CI validation
    ├── extract.mjs                          # Hardcoded string extraction assist
    ├── completeness-report.mjs              # Coverage report
    └── sync-glossary.mjs                    # Glossary compliance check
docs/
└── architecture/
    └── i18n-architecture.md                 # This document
```

### Appendix D: Migration Checklist for Existing Components

For each existing component/page being migrated to i18n:

1. [ ] Identify all hardcoded strings (use `pnpm run i18n:extract` for assistance).
2. [ ] Add keys to `en/{namespace}.json`.
3. [ ] Replace hardcoded strings with `t('key')` calls.
4. [ ] Add `const { t } = useTranslation('namespace')` at the top of the component.
5. [ ] Replace `date.toString()` / `toLocaleDateString()` with `formatDate(date, locale)`.
6. [ ] Replace raw number displays with `formatNumber(value, locale)`.
7. [ ] Update CSS to use logical properties (Stylelint will flag violations).
8. [ ] Add the keys to `de/fr/es/it/{namespace}.json` (or `.i18nignore` temporarily).
9. [ ] Run `pnpm run i18n:check` — must pass.
10. [ ] Update/add tests to assert translated text.

### Appendix E: Reference: Existing Architecture Integration Points

| Concern                             | Existing File                                                                                                                                                                                                                                                      | Integration                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Request context (AsyncLocalStorage) | [requestContext.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/utils/requestContext.ts)                                                                                                                                                                   | Add `locale` to context            |
| Custom errors                       | [errors.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/utils/errors.ts)                                                                                                                                                                                   | Accept translation keys            |
| Email templates                     | [PasswordResetTemplate.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/services/email/templates/PasswordResetTemplate.ts), [WelcomeEmailTemplate.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/services/email/templates/WelcomeEmailTemplate.ts) | Accept `locale` in data; use `t()` |
| Notifications                       | [notification.service.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/services/notification.service.ts)                                                                                                                                                    | Add `createLocalized` method       |
| Navigation                          | [navigation.ts](file:///e:/ws1/ov/ce/scrumooth/packages/frontend/src/config/navigation.ts)                                                                                                                                                                         | Replace `label` with `labelKey`    |
| Auth store                          | `useAuthStore` (Zustand)                                                                                                                                                                                                                                           | Include `locale` in user state     |
| Config                              | [config/index.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/config/index.ts)                                                                                                                                                                             | Add `i18n` section                 |
| Email config                        | [config/index.ts](file:///e:/ws1/ov/ce/scrumooth/packages/backend/src/config/index.ts)                                                                                                                                                                             | `defaultLocale` for system emails  |

---

**End of Document**
