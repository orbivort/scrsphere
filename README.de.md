# Scrumooth

**Agiles Scrum-Lebenszyklus-Managementsystem**

> **Sprachen:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg?token=Z2T4R3G8F7)](https://codecov.io/github/orbivort/scrumooth)
[![Known Vulnerabilities](https://snyk.io/test/github/orbivort/scrumooth/badge.svg)](https://snyk.io/test/github/orbivort/scrumooth)

[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-success?style=for-the-badge)](https://orbivort.github.io/scrumooth/)

Scrumooth ist eine selbst gehostete Webanwendung zur Verwaltung agiler Scrum-Prozesse. Sie wurde entwickelt, um den Scrum Guide getreu umzusetzen, und nutzt moderne Technologien sowie strenge Qualitätsstandards. Sie bietet eine vollständige Lösung, die Teams durch den gesamten Scrum-Lebenszyklus führt — von Product Goals und Backlogs bis hin zu Sprint Reviews und Sprint Retrospectives — und lässt sich auf der eigenen Infrastruktur ohne Kosten pro Benutzer bereitstellen.

## 🚀 Live-Demo

Probieren Sie Scrumooth sofort in Ihrem Browser aus — keine Installation erforderlich. Die Demo läuft mit Mock-Daten (kein Backend erforderlich), sodass Sie den vollständigen Scrum-Lebenszyklus sofort erkunden können.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Live-Demo auf GitHub Pages starten</strong>
  </a>
</p>

> **Hinweis:** Die Demo verwendet In-Memory-Mock-Daten — alle Änderungen sind nur in Ihrer Browser-Sitzung lokal und werden beim Aktualisieren zurückgesetzt. Für persistente Daten und Mehrbenutzer-Zusammenarbeit folgen Sie der [Installation](#-installation)-Anleitung, um Ihre eigene Instanz selbst zu hosten.

## ✨ Funktionen

### Kernfunktionen von Scrum

- **Product Goals** — Strategische Ausrichtung und Zielverfolgung
- **Product Backlog** — MoSCoW-Priorisierung (Must, Should, Could, Won't)
- **Sprint Planning** — Konfigurierbare Sprint-Dauern und Kapazitätsplanung
- **Sprint Execution** — Interaktives Kanban-Board mit Drag-and-Drop
- **Daily Scrum** — Tägliches Standup-Tracking und Aktualisierungen
- **Impediments** — Erkennung und Behebung von Blockern
- **Incremental Delivery** — Verwaltung von Product Increments
- **Sprint Reviews** — Verwaltung von Review-Meetings und Dokumentation
- **Sprint Retrospectives** — Teamreflexion und kontinuierliche Verbesserung

### Erweiterte Funktionen

- **Dashboard & Berichte** — Echtzeitkennzahlen und Visualisierungen
- **Workflow-Engine** — Rollenbasierte Berechtigungen und Zustandsübergänge
- **Definition of Done/Ready** — anpassbare Checklisten
- **Team-Kommunikation** — integrierte Benachrichtigungen und Messaging
- **Audit-Logging** — umfassende Aktionsverfolgung

## 🛠 Technologie-Stack

### Backend

- **Runtime:** Node.js 24+
- **Framework:** Express.js 5
- **Sprache:** TypeScript (Strict Mode)
- **Datenbank:** PostgreSQL 18+ mit Prisma ORM 7
- **Authentifizierung:** JWT mit bcrypt
- **Validierung:** Zod
- **Geplante Jobs:** node-cron
- **E-Mail:** Nodemailer (SMTP-, SendGrid-, AWS-SES-Anbieter)
- **Protokollierung:** Winston mit rotierenden Logdateien

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

### Tests & Qualität

- **Unit- / Integrationstests:** Vitest
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
│   │   │   ├── pages/        # Routenbasierte Seiten
│   │   │   ├── hooks/        # Custom React Hooks
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
├── k6/                       # Lasttestszenarien (k6)
│   └── scripts/scenarios/    # vorgefertigte Lasttestszenarien
├── scripts/                  # Build- und Hilfsskripte
├── .github/workflows/        # CI-, Release- und GitHub-Pages-Deployment
├── docker-compose.yml        # Produktions-Docker-Compose
├── docker-compose.dev.yml    # Entwicklungs-Docker-Compose
├── CHANGELOG.md              # Versionshistorie
├── SECURITY.md               # Sicherheitsrichtlinie und Meldeverfahren
└── THIRD-PARTY-NOTICES.md    # Drittanbieter-Lizenzhinweise
```

## 📋 Voraussetzungen

- **Node.js** v24.14.1 oder höher
- **pnpm** v11.5.0 oder höher
- **PostgreSQL** v18 oder höher
- **Git**

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

### 3. Umgebung konfigurieren

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
```

**Frontend** (`packages/frontend/.env`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api/v1

# Use mock API (set to false for real backend)
VITE_USE_MOCK_API=false
```

### 4. Datenbank einrichten

Generieren Sie den Prisma-Client und erstellen Sie anschließend Ihr Datenbankschema. Für die lokale Entwicklung können Sie beide Ansätze wählen:

```bash
# Prisma-Client generieren (immer erforderlich)
pnpm run db:generate

# Option A: Schema direkt pushen (schnelle Iteration, keine Migrationsdateien)
pnpm run db:push

# Option B: Migration erstellen und anwenden (empfohlen für nachverfolgbare Änderungen)
pnpm run db:migrate
```

Für Produktionsbereitstellungen verwenden Sie `pnpm run db:migrate:prod`, um bestehende Migrationen ohne Rückfragen anzuwenden.

### 5. Entwicklungsserver starten

```bash
pnpm run dev
```

Dadurch werden Backend und Frontend gleichzeitig gestartet. Um sie unabhängig voneinander zu starten:

```bash
pnpm run dev:backend    # Nur Backend (http://localhost:5001)
pnpm run dev:frontend   # Nur Frontend (http://localhost:5173)
```

## 🎯 Verwendung

### Entwicklung

```bash
# Frontend und Backend zusammen starten
pnpm run dev

# Im Testmodus starten (verwendet NODE_ENV=test)
pnpm run dev:test

# Nur eine Seite starten
pnpm run dev:backend
pnpm run dev:frontend
```

### Build

```bash
# Alle Pakete bauen
pnpm run build

# Build-Artefakte bereinigen
pnpm run clean

# Vollständige Bereinigung inklusive node_modules
pnpm run clean:all
```

## 🧪 Tests

### Tests ausführen

```bash
# Alle Tests über alle Pakete ausführen
pnpm run test

# Mit Abdeckungsbericht ausführen
pnpm run test:coverage

# Nur Unit-Tests ausführen
pnpm run test:unit

# Integrationstests ausführen (nur Backend)
pnpm run test:integration

# End-to-End-Tests ausführen (Backend Vitest + Frontend Playwright)
pnpm run test:e2e

# E2E für nur eine Seite ausführen
pnpm run test:e2e:backend
pnpm run test:e2e:frontend

# Watch-Modus
pnpm run test:watch
```

Es gelten folgende Abdeckungsschwellenwerte: **80 % Zeilen, Funktionen, Anweisungen** und **70 % Zweige**.

### Lasttests (k6)

Zehn vorgefertigte Lasttestszenarien befinden sich unter [`k6/scripts/scenarios/`](k6/scripts/scenarios). Kopieren Sie vor der Ausführung [`k6/.env.k6.example`](k6/.env.k6.example) nach `k6/.env.k6` und konfigurieren Sie Ihr Ziel.

```bash
# Realistische Alltagslast
pnpm run loadtest:normal

# Sprint-Planning-Rush (Worst-Case-Concurrency)
pnpm run loadtest:peak

# System bis zum Versagen belasten
pnpm run loadtest:stress

# Simulierter 8-Stunden-Arbeitstag
pnpm run loadtest:endurance

# Weitere Szenarien
pnpm run loadtest:multi-team
pnpm run loadtest:daily-scrum
pnpm run loadtest:auth
pnpm run loadtest:db

# Seed-Daten für Lasttests generieren
pnpm run loadtest:generate-data
```

> **Voraussetzung:** Installieren Sie [k6](https://k6.io/docs/get-started/installation/) und stellen Sie sicher, dass Ihr Ziel-Backend läuft.

## 🔍 Code-Qualität

### Linting

```bash
# ESLint auf TypeScript/JavaScript-Dateien ausführen
pnpm run lint

# ESLint-Probleme automatisch beheben
pnpm run lint:fix

# Stylelint auf CSS-Dateien ausführen
pnpm run lint:css

# Stylelint-Probleme automatisch beheben
pnpm run lint:css:fix
```

### Formatierung

```bash
# Alle Quelldateien mit Prettier formatieren
pnpm run format

# Formatierung prüfen, ohne Änderungen zu schreiben
pnpm run format:check

# CSS-spezifische Formatierung
pnpm run format:css
pnpm run format:css:check
```

### Typprüfung

```bash
# TypeScript-Typprüfung über alle Pakete ausführen
pnpm run typecheck
```

### Sicherheits-Audit

```bash
# Installierte Abhängigkeiten auf bekannte Schwachstellen prüfen
pnpm run audit

# Veraltete Abhängigkeiten auflisten
pnpm run outdated
```

## 🗄 Datenbankverwaltung

```bash
# Prisma-Client generieren (nach Schemaänderungen)
pnpm run db:generate

# Schema an Datenbank pushen (Entwicklung, keine Migrationsdateien)
pnpm run db:push

# Neue Migration erstellen und anwenden (Entwicklung)
pnpm run db:migrate

# Migrationen in Produktion anwenden (nicht-interaktiv)
pnpm run db:migrate:prod

# Migrationen auf die Testdatenbank anwenden
pnpm run db:migrate:test

# Prisma Studio öffnen (Datenbank-GUI)
pnpm run db:studio

# Datenbank zurücksetzen (⚠️ zerstört alle Daten)
pnpm run db:reset

# Prisma-Schema validieren
pnpm run db:validate
```

## 🐳 Docker-Unterstützung

Das Projekt enthält Docker-Konfiguration sowohl für die Entwicklung als auch für den Produktionsbetrieb.

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

```bash
# Produktions-Images
docker build -t scrumooth-backend ./packages/backend
docker build -t scrumooth-frontend ./packages/frontend

# Entwicklungs-Images (mit Dev-Abhängigkeiten und Watch-Modus)
docker build -f ./packages/backend/Dockerfile.dev -t scrumooth-backend:dev ./packages/backend
docker build -f ./packages/frontend/Dockerfile.dev -t scrumooth-frontend:dev ./packages/frontend
```

## ☁️ Bereitstellung

### Selbst gehostete Produktion

Siehe [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) für eine vollständige Anleitung zur Produktionsbereitstellung mit Umgebungskonfiguration, Datenbankmigration, Reverse-Proxy-Einrichtung und operativen Best Practices.

### Demo-Bereitstellung auf GitHub Pages

Der `main`-Branch wird automatisch über den [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml)-Workflow auf GitHub Pages bereitgestellt. Der Pages-Build:

- Verwendet eine In-Memory-**Mock-API** (kein Backend oder Datenbank erforderlich)

Live-Demo: <https://orbivort.github.io/scrumooth/>

## 📚 Dokumentation

| Bereich                    | Ort                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Benutzerhandbuch**       | [`docs/user-guide/`](docs/user-guide) — Erste Schritte, Kernfunktionen, Scrum-Workflows                           |
| **REST-API-Referenz**      | [`docs/api/`](docs/api) — 19 Endpunktgruppen (Authentifizierung, Sprints, Backlog, Berichte, etc.)                |
| **Systemarchitektur**      | [`docs/architecture/`](docs/architecture) — Systemdesign, Datenmodell, Komponenten-Design, Sicherheitsarchitektur |
| **Deployment-Anleitung**   | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                  |
| **Sicherheitsrichtlinie**  | [`SECURITY.md`](SECURITY.md) — Meldung von Schwachstellen                                                         |
| **Release-Historie**       | [`CHANGELOG.md`](CHANGELOG.md)                                                                                    |
| **Drittanbieter-Hinweise** | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                |

## 🛟 Fehlerbehebung

### `Cannot find module @scrumooth/shared`

Das Shared-Paket muss kompiliert werden, bevor Backend/Frontend Imports auflösen können.

```bash
pnpm --filter=@scrumooth/shared run build
```

Dies wird normalerweise automatisch durch `pnpm install` und die Dev-Skripte gehandhabt, ist aber nach einem manuellen `pnpm run clean` erforderlich.

### `pnpm install` schlägt mit "Use pnpm instead" fehl

Das Repository erzwingt pnpm über ein `preinstall`-Skript. Installieren Sie pnpm global:

```bash
npm install -g pnpm@11.5.0
```

### Datenbankverbindungsfehler beim Start

Überprüfen Sie, ob Ihre `DATABASE_URL` in `packages/backend/.env` auf eine laufende PostgreSQL-Instanz (Version 18 oder höher) zeigt und die Datenbank existiert. Führen Sie `pnpm run db:validate` aus, um das Prisma-Schema gegen die Verbindung zu validieren.

### Port bereits belegt (5001 oder 5173)

Standard-Ports können über Umgebungsvariablen überschrieben werden:

- Backend: `PORT` in `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` in `packages/frontend/.env`

### Frontend erreicht Backend nicht

Prüfen Sie, ob `VITE_API_URL` in `packages/frontend/.env` mit der tatsächlichen Backend-Adresse übereinstimmt und `CORS_ORIGIN` in `packages/backend/.env` die Frontend-Origin erlaubt.

### Möchten Sie ohne Backend entwickeln?

Setzen Sie `VITE_USE_MOCK_API=true` in `packages/frontend/.env`, um dieselbe Mock-API zu verwenden, die auch die Live-Demo antreibt.

## 📝 Lizenz

Dieses Projekt ist unter der Apache License 2.0 lizenziert — siehe die [LICENSE](LICENSE)-Datei für Details.

```
Copyright 2026 Orbivort

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
