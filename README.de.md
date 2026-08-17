# Scrumooth

**Selbst gehostetes Scrum-Tool, getreu dem Scrum Guide**

> **Sprachen:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg)](https://codecov.io/github/orbivort/scrumooth)
[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791.svg)](https://www.postgresql.org/)

Scrumooth ist ein selbst gehostetes Scrum-Tool, das den Scrum Guide getreu umsetzt. Dank seines bewusst schlanken Designs führt es Teams durch den gesamten Scrum-Lebenszyklus — vom Product Goal und Backlog bis hin zu Sprint Review und Sprint Retrospective — ohne die Komplexität schwergewichtiger SaaS-Plattformen. Stellen Sie es auf Ihrer eigenen Infrastruktur bereit, behalten Sie die Kontrolle über Ihre Daten und zahlen Sie niemals pro Benutzer.

## Inhaltsverzeichnis

- [Live-Demo](#live-demo)
- [Funktionen](#features)
- [Tech-Stack](#tech-stack)
- [Schnellstart](#quick-start)
- [Voraussetzungen](#prerequisites)
- [Installation](#installation)
- [Testen](#testing)
- [Code-Qualität](#code-quality)
- [Datenbankverwaltung](#database-management)
- [Docker-Unterstützung](#docker-support)
- [Deployment](#deployment)
- [Dokumentation](#documentation)
- [Fehlerbehebung](#troubleshooting)
- [Roadmap](#roadmap)
- [Mitwirken](#contributing)
- [Lizenz](#license)

<a id="live-demo"></a>

## 🚀 Live-Demo

Probieren Sie Scrumooth sofort in Ihrem Browser aus — keine Installation erforderlich. Die Demo läuft mit Mock-Daten (kein Backend erforderlich), sodass Sie den gesamten Scrum-Lebenszyklus sofort erkunden können.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Live-Demo auf GitHub Pages starten</strong>
  </a>
</p>

> **Hinweis:** Die Demo verwendet In-Memory-Mock-Daten — alle von Ihnen vorgenommenen Änderungen sind nur lokal in Ihrer Browser-Sitzung gültig und werden beim Aktualisieren zurückgesetzt. Für persistente Daten und Mehrbenutzer-Zusammenarbeit folgen Sie der Anleitung unter [Installation](#installation), um Ihre eigene Instanz selbst zu hosten.

<a id="features"></a>

## ✨ Funktionen

### Kernfunktionen von Scrum

- **Product Goal** – Strategische Ausrichtung und Zielverfolgung
- **Product Backlog** – MoSCoW-Priorisierung (Must, Should, Could, Won't)
- **Sprint Planning** – Konfigurierbare Sprint-Dauern und Kapazitätsplanung
- **Sprint Execution** – Interaktives Kanban-Board mit Drag-and-Drop
- **Daily Scrum** – Tägliches Standup-Tracking und Aktualisierungen
- **Impediment** – Erkennung von Blockern und Verfolgung der Behebung
- **Increment** – Verwaltung des Produkt-Inkrements
- **Sprint Review** – Verwaltung und Dokumentation von Review-Meetings
- **Sprint Retrospective** – Teamreflexion und kontinuierliche Verbesserung

### Erweiterte Funktionen

- **Dashboard & Reporting** – Echtzeit-Metriken und Visualisierungen
- **Workflow-Engine** – Rollenbasierte Berechtigungen und Statusübergänge
- **Definition of Done/Ready** – Anpassbare Checklisten
- **Teamkommunikation** – Integrierte Benachrichtigungen und Nachrichten
- **Audit-Protokollierung** – Umfassende Nachverfolgung von Aktionen

<a id="tech-stack"></a>

## 🛠 Tech-Stack

### Backend

- **Runtime:** Node.js 24+
- **Framework:** Express.js 5
- **Sprache:** TypeScript (Strict Mode)
- **Datenbank:** PostgreSQL 18+ mit Prisma ORM 7
- **Authentifizierung:** JWT mit bcrypt
- **Validierung:** Zod
- **Geplante Jobs:** node-cron
- **E-Mail:** Nodemailer (Anbieter SMTP, SendGrid, AWS SES)
- **Protokollierung:** Winston mit rotierenden Datei-Transports

### Frontend

- **Framework:** React 19 mit Vite
- **Sprache:** TypeScript (Strict Mode)
- **Routing:** React Router 6
- **State Management:** TanStack Query (React Query) + Zustand
- **Visualisierung:** Chart.js
- **Styling:** CSS Modules mit Design Tokens
- **Fehlerverfolgung:** Sentry (optional, über `VITE_SENTRY_DSN`)

### Shared

- TypeScript-Typen und -Schnittstellen
- Konstanten und Enumerationen
- Hilfsfunktionen

### Testen & Qualität

- **Unit / Integration:** Vitest
- **End-to-End:** Playwright (Frontend) + Vitest (Backend)
- **Lasttests:** k6 (10 vorgefertigte Szenarien)
- **Linting:** ESLint + Stylelint
- **Formatierung:** Prettier
- **Git Hooks:** Husky + lint-staged

## 📁 Projektstruktur

```
scrumooth/
├── packages/
│   ├── backend/              # Express.js REST-API
│   │   ├── src/
│   │   │   ├── controllers/  # API-Routen-Handler
│   │   │   ├── services/     # Geschäftslogikschicht
│   │   │   ├── middleware/   # Express-Middleware
│   │   │   ├── routes/       # API-Routendefinitionen
│   │   │   ├── utils/        # Hilfsfunktionen
│   │   │   └── __tests__/    # Unit-, Integrations- und E2E-Tests
│   │   ├── prisma/           # Datenbankschema und Migrationen
│   │   ├── Dockerfile        # Produktions-Image
│   │   └── Dockerfile.dev    # Entwicklungs-Image
│   ├── frontend/             # React + Vite Frontend
│   │   ├── src/
│   │   │   ├── components/   # React-Komponenten
│   │   │   ├── pages/        # Seiten auf Routenebene
│   │   │   ├── hooks/        # Eigene React Hooks
│   │   │   ├── services/     # API-Client-Dienste
│   │   │   ├── stores/       # Zustand-Stores
│   │   │   └── styles/       # CSS und Design Tokens
│   │   ├── e2e/              # Playwright-End-to-End-Tests
│   │   ├── Dockerfile        # Produktions-Image
│   │   └── Dockerfile.dev    # Entwicklungs-Image
│   └── shared/               # Gemeinsame Typen, Konstanten, Hilfsfunktionen
├── docs/
│   ├── api/                  # REST-API-Referenz
│   ├── architecture/         # Systemdesign, Datenmodell, Sicherheit
│   ├── deployment/           # Deployment-Anleitungen
│   └── user-guide/           # Benutzerdokumentation und Anleitungen
├── k6/                       # Lasttest-Szenarien (k6)
│   └── scripts/scenarios/    # vorgefertigte Lasttest-Szenarien
├── scripts/                  # Build- und Hilfsskripte
├── .github/workflows/        # CI-, Release- und GitHub-Pages-Deployment
├── docker-compose.yml        # Produktions-Docker-Compose
├── docker-compose.dev.yml    # Entwicklungs-Docker-Compose
├── CHANGELOG.md              # Versionshistorie
├── SECURITY.md               # Sicherheitsrichtlinie und Meldeverfahren
├── CONTRIBUTING.md           # Beitragsrichtlinien
├── CODE_OF_CONDUCT.md        # Verhaltenskodex der Community
└── THIRD-PARTY-NOTICES.md    # Drittanbieter-Lizenzhinweise
```

<a id="quick-start"></a>

## ⚡ Schnellstart

Der schnellste Weg, eine lokale Instanz zu betreiben, ist Docker Compose:

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
cp packages/backend/.env.production.example packages/backend/.env.production
docker compose up -d
```

Dies startet den Caddy-Reverse-Proxy, das Backend, das Frontend und PostgreSQL. Sobald alles läuft, öffnen Sie <http://localhost> (HTTPS ist standardmäßig auf Port 443 aktiviert). Für ein vollständiges manuelles Setup (ohne Docker) siehe [Installation](#installation).

> **Hinweis:** Der Produktions-Compose-Stack erfordert `packages/backend/.env.production`. Wenn Sie eine vollständig vorkonfigurierte Entwicklungsumgebung mit Hot Reload bevorzugen, verwenden Sie stattdessen `docker compose -f docker-compose.dev.yml up`.

<a id="prerequisites"></a>

## 📋 Voraussetzungen

- **Node.js** v24.19.0 oder höher
- **pnpm** v11.21.0 oder höher
- **PostgreSQL** v18 oder höher
- **Docker** & **Docker Compose** (optional, für den Schnellstart)

<a id="installation"></a>

## 🚀 Installation

### 1. Repository klonen

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
```

### 2. Abhängigkeiten installieren

Dieses Projekt verwendet pnpm als Paketmanager. Das Projekt erzwingt pnpm über Preinstall-Skripte.

```bash
pnpm install
```

### 3. Umgebungskonfiguration

Kopieren Sie die Beispiel-Umgebungsdateien und konfigurieren Sie Ihre Einstellungen:

```bash
# Backend-Konfiguration
cp packages/backend/.env.example packages/backend/.env

# Frontend-Konfiguration
cp packages/frontend/.env.example packages/frontend/.env
```

Bearbeiten Sie die Umgebungsdateien mit Ihrer Konfiguration:

**Backend** (`packages/backend/.env`):

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/scrumooth

# JWT Configuration (generate with: openssl rand -hex 64)
JWT_SECRET=your-64-character-secret-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Optional: Beschränken Sie die Registrierung neuer Konten auf bestimmte E-Mail-Domains.
# Lassen Sie leer/nicht gesetzt für offene Registrierung. Wird serverseitig erzwungen (HTTP 403 bei
# unzulässigen Domains). Nur ein Tenant-Kontroll-Gate, keine E-Mail-Verifizierung.
REGISTRATION_ALLOWED_EMAIL_DOMAINS=example.com,example.eu
```

**Frontend** (`packages/frontend/.env`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api/v1

# Use mock API (set to false for real backend)
VITE_USE_MOCK_API=false
```

### 4. Datenbank einrichten

Generieren Sie den Prisma-Client und erstellen Sie anschließend Ihr Datenbankschema. Für die lokale Entwicklung können Sie einen der beiden Ansätze wählen:

```bash
# Prisma-Client generieren (immer erforderlich)
pnpm run db:generate

# Option A: Schema direkt pushen (schnelle Iteration, keine Migrationsdateien)
pnpm run db:push

# Option B: Migration erstellen und anwenden (empfohlen für nachverfolgbare Änderungen)
pnpm run db:migrate
```

Für Produktions-Deployments verwenden Sie `pnpm run db:migrate:prod`, um bestehende Migrationen ohne Rückfragen anzuwenden.

### 5. Entwicklungsserver starten

```bash
pnpm run dev
```

Dies startet Backend- und Frontend-Server gleichzeitig. Um sie unabhängig voneinander auszuführen:

```bash
pnpm run dev:backend    # Nur Backend (http://localhost:5001)
pnpm run dev:frontend   # Nur Frontend (http://localhost:5173)
```

## 🎯 Verwendung

Die gängigsten Befehle für die tägliche Entwicklung:

| Aufgabe                    | Befehl                  |
| -------------------------- | ----------------------- |
| Backend + Frontend starten | `pnpm run dev`          |
| Nur Backend starten        | `pnpm run dev:backend`  |
| Nur Frontend starten       | `pnpm run dev:frontend` |
| Alle Pakete bauen          | `pnpm run build`        |

<a id="testing"></a>

## 🧪 Testen

```bash
pnpm run test              # Alle Tests
pnpm run test:coverage     # Mit Coverage-Bericht
pnpm run test:unit         # Nur Unit-Tests
pnpm run test:integration  # Backend-Integrationstests
pnpm run test:e2e          # End-to-End (Backend Vitest + Frontend Playwright)
pnpm run test:watch        # Watch-Modus
```

Erzwungene Coverage-Schwellenwerte: **80 % Zeilen, Funktionen, Anweisungen, Zweige**.

### Lasttests (k6)

Vorgefertigte Lasttest-Szenarien liegen unter [`k6/scripts/scenarios/`](k6/scripts/scenarios). Kopieren Sie [`k6/.env.k6.example`](k6/.env.k6.example) nach `k6/.env.k6`, konfigurieren Sie Ihr Ziel und führen Sie anschließend ein Szenario aus, zum Beispiel:

```bash
pnpm run loadtest:normal    # Realistische Alltagslast
pnpm run loadtest:peak      # Sprint-Planning-Rush (Worst-Case-Nebenläufigkeit)
pnpm run loadtest:stress    # System bis zum Versagen belasten
```

> **Voraussetzung:** Installieren Sie [k6](https://k6.io/docs/get-started/installation/) und stellen Sie sicher, dass Ihr Ziel-Backend läuft. Weitere Szenarien (endurance, multi-team, daily-scrum, auth, db) sind über die `loadtest:*`-Skripte in [`package.json`](package.json) verfügbar.

<a id="code-quality"></a>

## 🔍 Code-Qualität

| Aufgabe                       | Befehl               |
| ----------------------------- | -------------------- |
| Lint (ESLint)                 | `pnpm run lint`      |
| Lint & automatische Korrektur | `pnpm run lint:fix`  |
| CSS-Lint (Stylelint)          | `pnpm run lint:css`  |
| Formatieren (Prettier)        | `pnpm run format`    |
| Typprüfung                    | `pnpm run typecheck` |
| Sicherheits-Audit             | `pnpm run audit`     |

Vollständiger Entwicklungs-Workflow und Quality Gates finden Sie in [`CONTRIBUTING.md`](CONTRIBUTING.md).

<a id="database-management"></a>

## 🗄 Datenbankverwaltung

```bash
pnpm run db:generate     # Prisma-Client generieren (nach Schemaänderungen)
pnpm run db:migrate      # Migration erstellen und anwenden (Entwicklung)
pnpm run db:migrate:prod # Migrationen in Produktion anwenden (nicht-interaktiv)
pnpm run db:studio       # Prisma Studio öffnen (Datenbank-GUI)
```

Weitere Datenbankbefehle (`db:push`, `db:reset`, `db:validate`, `db:migrate:test`) sind in [`CONTRIBUTING.md`](CONTRIBUTING.md) dokumentiert.

<a id="docker-support"></a>

## 🐳 Docker-Unterstützung

Das Projekt enthält Docker-Konfiguration für Entwicklungs- und Produktions-Deployment.

### Docker Compose verwenden

```bash
# Entwicklungsumgebung (mit Hot Reload)
docker compose -f docker-compose.dev.yml up

# Produktionsumgebung (detached)
docker compose up -d

# Abbauen
docker compose down
```

### Docker-Images manuell bauen

> **Hinweis:** Alle Dockerfiles referenzieren Pfade relativ zum Repository-Root (Monorepo-Workspace-Dateien wie `package.json`, `pnpm-lock.yaml` und `packages/shared/`). Sie müssen sie vom **Repository-Root** aus bauen und `-f` verwenden, um auf das Dockerfile zu zeigen — das Übergeben des Paketverzeichnisses als Build-Kontext schlägt fehl.

```bash
# Entwicklungs-Images (mit Dev-Abhängigkeiten und Watch-Modus)
docker build -t scrumooth-backend:dev -f packages/backend/Dockerfile.dev .
docker build -t scrumooth-frontend:dev -f packages/frontend/Dockerfile.dev .

# Produktions-Images (vom Repository-Root bauen)
docker build -t scrumooth-backend -f packages/backend/Dockerfile .
docker build -t scrumooth-frontend -f packages/frontend/Dockerfile .
```

<details>
<summary>Registry/apt-Mirror verwenden</summary>

Wenn Sie sich hinter einem Netzwerk befinden, das einen npm-Registry- oder apt-Mirror erfordert, können Sie diese als Build-Argumente oder Umgebungsvariablen setzen:

```bash
# Docker Compose
$env:NPM_REGISTRY="https://your_mirror_url"
$env:APT_MIRROR="your_mirror_url"

# Manueller Build
docker build --build-arg NPM_REGISTRY=https://your_mirror_url --build-arg APT_MIRROR=your_mirror_url .
```

</details>

<a id="deployment"></a>

## ☁️ Deployment

### Selbst gehostete Produktion

Vollständige Anleitung zum Produktions-Deployment mit Umgebungskonfiguration, Datenbankmigration, Reverse-Proxy-Einrichtung und operativen Best Practices finden Sie in [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md).

### Demo-Deployment auf GitHub Pages

Der `main`-Branch wird über den Workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml) automatisch auf GitHub Pages bereitgestellt, unter Verwendung einer In-Memory-**Mock-API** (kein Backend oder keine Datenbank erforderlich). Probieren Sie es über die [Live-Demo](#live-demo) oben aus.

<a id="documentation"></a>

## 📚 Dokumentation

| Bereich                    | Ort                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Benutzerhandbuch**       | [`docs/user-guide/`](docs/user-guide) — Erste Schritte, Kernfunktionen, Scrum-Workflows                           |
| **REST-API-Referenz**      | [`docs/api/`](docs/api) — Endpunktgruppen zu Authentifizierung, Sprints, Backlog, Berichten und mehr              |
| **Systemarchitektur**      | [`docs/architecture/`](docs/architecture) — Systemdesign, Datenmodell, Komponenten-Design, Sicherheitsarchitektur |
| **Deployment-Anleitung**   | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                  |
| **Sicherheitsrichtlinie**  | [`SECURITY.md`](SECURITY.md) — Meldeverfahren für Schwachstellen                                                  |
| **Mitwirken**              | [`CONTRIBUTING.md`](CONTRIBUTING.md) — Richtlinien und Entwicklungs-Workflow                                      |
| **Verhaltenskodex**        | [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — Standards der Community                                              |
| **Release-Historie**       | [`CHANGELOG.md`](CHANGELOG.md)                                                                                    |
| **Drittanbieter-Hinweise** | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                |

<a id="troubleshooting"></a>

## 🛟 Fehlerbehebung

### `Cannot find module @scrumooth/shared`

Das Shared-Paket muss gebaut werden, bevor Backend/Frontend Importe auflösen können.

```bash
pnpm --filter=@scrumooth/shared run build
```

Dies wird normalerweise automatisch von `pnpm install` und den Dev-Skripten erledigt, ist aber nach einem manuellen `pnpm run clean` erforderlich.

### `pnpm install` schlägt mit „Use pnpm instead" fehl

Das Repository erzwingt pnpm über ein `preinstall`-Skript. Installieren Sie pnpm global:

```bash
npm install -g pnpm@11.21.0
```

### Datenbankverbindungsfehler beim Start

Überprüfen Sie, ob Ihre `DATABASE_URL` in `packages/backend/.env` auf eine laufende PostgreSQL-18+-Instanz zeigt und die Datenbank existiert. Führen Sie `pnpm run db:validate` aus, um das Prisma-Schema gegen die Verbindung zu validieren.

### Port bereits belegt (5001 oder 5173)

Standard-Ports können über Umgebungsvariablen überschrieben werden:

- Backend: `PORT` in `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` in `packages/frontend/.env`

### Frontend erreicht das Backend nicht

Prüfen Sie, ob `VITE_API_URL` in `packages/frontend/.env` mit der tatsächlichen Backend-Adresse übereinstimmt und `CORS_ORIGIN` in `packages/backend/.env` die Frontend-Origin erlaubt.

### Möchten Sie ohne Backend entwickeln?

Setzen Sie `VITE_USE_MOCK_API=true` in `packages/frontend/.env`, um dieselbe Mock-API zu verwenden, die auch die Live-Demo antreibt.

<a id="roadmap"></a>

## 🗺 Roadmap

Scrumooth befindet sich in aktiver Entwicklung. Zu den kommenden Prioritäten gehören:

- [ ] Verbesserte Reporting- und Analyse-Dashboards
- [ ] Weitere Integrationen und Webhooks
- [ ] Härtung von Performance und Skalierbarkeit

Projektstatus und neueste Änderungen werden im [CHANGELOG](CHANGELOG.md) verfolgt. Feedback und Feature-Wünsche sind über [GitHub Issues](https://github.com/orbivort/scrumooth/issues) willkommen.

<a id="contributing"></a>

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte lesen Sie [`CONTRIBUTING.md`](CONTRIBUTING.md) für Entwicklungs-Workflow, Codestandards und den Pull-Request-Prozess, und lesen Sie den [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) vor der Teilnahme.

<a id="license"></a>

## 📝 Lizenz

Dieses Projekt ist unter der [Apache License 2.0](LICENSE) lizenziert.
