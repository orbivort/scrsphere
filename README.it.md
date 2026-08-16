# Scrumooth

**Strumento Scrum self-hosted, fedele alla Scrum Guide**

> **Lingue:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg)](https://codecov.io/github/orbivort/scrumooth)
[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791.svg)](https://www.postgresql.org/)

Scrumooth è uno strumento Scrum self-hosted che implementa fedelmente la Scrum Guide. Leggero per impostazione, guida i team lungo l'intero ciclo di vita di Scrum — dal Product Goal e dal backlog fino alla Sprint Review e alla Sprint Retrospective — senza la complessità delle piattaforme SaaS più pesanti. Distribuiscilo sulla tua infrastruttura, mantieni i tuoi dati sotto il tuo controllo e non pagare mai per utente.

## Indice

- [Demo dal vivo](#live-demo)
- [Funzionalità](#features)
- [Stack tecnologico](#tech-stack)
- [Avvio rapido](#quick-start)
- [Prerequisiti](#prerequisites)
- [Installazione](#installation)
- [Test](#testing)
- [Qualità del codice](#code-quality)
- [Gestione del database](#database-management)
- [Supporto Docker](#docker-support)
- [Distribuzione](#deployment)
- [Documentazione](#documentation)
- [Risoluzione dei problemi](#troubleshooting)
- [Roadmap](#roadmap)
- [Contribuire](#contributing)
- [Licenza](#license)

## 🚀 Demo dal vivo

Prova subito Scrumooth nel tuo browser, senza alcuna installazione. La demo viene eseguita con dati simulati (nessun backend necessario), così puoi esplorare immediatamente l'intero ciclo di vita di Scrum.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Avvia la demo dal vivo su GitHub Pages</strong>
  </a>
</p>

> **Nota:** La demo utilizza dati simulati in memoria — qualsiasi modifica apporti è locale alla sessione del browser e viene azzerata al refresh. Per dati persistenti e collaborazione multi-utente, segui la guida all'[Installazione](#installation) per ospitare autonomamente la tua istanza.

## ✨ Funzionalità

### Funzionalità Scrum principali

- **Product Goal** - Allineamento strategico e monitoraggio degli obiettivi
- **Product Backlog** - Prioritizzazione MoSCoW (Must, Should, Could, Won't)
- **Sprint Planning** - Durate configurabili degli sprint e pianificazione della capacità
- **Esecuzione dello Sprint** - Board Kanban interattiva con drag-and-drop
- **Daily Scrum** - Monitoraggio e aggiornamenti del daily standup
- **Impediment** - Identificazione dei blocchi e monitoraggio della risoluzione
- **Increment** - Gestione dell'incremento di prodotto
- **Sprint Review** - Gestione e documentazione della riunione di review
- **Sprint Retrospective** - Riflessione del team e miglioramento continuo

### Funzionalità avanzate

- **Dashboard e reportistica** - Metriche e visualizzazioni in tempo reale
- **Motore di workflow** - Permessi basati sui ruoli e transizioni di stato
- **Definition of Done/Ready** - Checklist personalizzabili
- **Comunicazione del team** - Notifiche e messaggistica integrate
- **Registrazione degli audit** - Tracciamento completo delle azioni

## 🛠 Stack tecnologico

### Backend

- **Runtime:** Node.js 24+
- **Framework:** Express.js 5
- **Linguaggio:** TypeScript (modalità strict)
- **Database:** PostgreSQL 18+ con Prisma ORM 7
- **Autenticazione:** JWT con bcrypt
- **Validazione:** Zod
- **Job pianificati:** node-cron
- **Email:** Nodemailer (provider SMTP, SendGrid, AWS SES)
- **Logging:** Winston con transport di file rotanti

### Frontend

- **Framework:** React 19 con Vite
- **Linguaggio:** TypeScript (modalità strict)
- **Routing:** React Router 6
- **Gestione dello stato:** TanStack Query (React Query) + Zustand
- **Visualizzazione:** Chart.js
- **Stili:** CSS Modules con Design Token
- **Monitoraggio errori:** Sentry (opzionale, via `VITE_SENTRY_DSN`)

### Condiviso

- Tipi e interfacce TypeScript
- Costanti ed enumerazioni
- Funzioni di utilità

### Test e qualità

- **Unitari / Integrazione:** Vitest
- **End-to-End:** Playwright (frontend) + Vitest (backend)
- **Test di carico:** k6 (10 scenari predefiniti)
- **Linting:** ESLint + Stylelint
- **Formattazione:** Prettier
- **Git Hook:** Husky + lint-staged

## 📁 Struttura del progetto

```
scrumooth/
├── packages/
│   ├── backend/              # API REST Express.js
│   │   ├── src/
│   │   │   ├── controllers/  # Gestori delle route API
│   │   │   ├── services/     # Livello di logica di business
│   │   │   ├── middleware/   # Middleware Express
│   │   │   ├── routes/       # Definizioni delle route API
│   │   │   ├── utils/        # Funzioni di utilità
│   │   │   └── __tests__/    # Test unitari, di integrazione ed e2e
│   │   ├── prisma/           # Schema del database e migrazioni
│   │   ├── Dockerfile        # Immagine di produzione
│   │   └── Dockerfile.dev    # Immagine di sviluppo
│   ├── frontend/             # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/   # Componenti React
│   │   │   ├── pages/        # Pagine a livello di route
│   │   │   ├── hooks/        # Hook React personalizzati
│   │   │   ├── services/     # Servizi client API
│   │   │   ├── stores/       # Store Zustand
│   │   │   └── styles/       # CSS e design token
│   │   ├── e2e/              # Test end-to-end Playwright
│   │   ├── Dockerfile        # Immagine di produzione
│   │   └── Dockerfile.dev    # Immagine di sviluppo
│   └── shared/               # Tipi, costanti e utilità condivisi
├── docs/
│   ├── api/                  # Riferimento API REST
│   ├── architecture/         # Progettazione del sistema, modello dati, sicurezza
│   ├── deployment/           # Guide alla distribuzione
│   └── user-guide/           # Documentazione e guide per l'utente
├── k6/                       # Scenari di test di carico (k6)
│   └── scripts/scenarios/    # scenari di test di carico predefiniti
├── scripts/                  # Script di build e di utilità
├── .github/workflows/        # CI, Release e distribuzione GitHub Pages
├── docker-compose.yml        # Docker Compose di produzione
├── docker-compose.dev.yml    # Docker Compose di sviluppo
├── CHANGELOG.md              # Cronologia delle versioni
├── SECURITY.md               # Politica di sicurezza e segnalazione
├── CONTRIBUTING.md           # Linee guida per i contributi
├── CODE_OF_CONDUCT.md        # Codice di condotta della community
└── THIRD-PARTY-NOTICES.md    # Attribuzioni delle licenze di terze parti
```

## ⚡ Avvio rapido

Il modo più rapido per eseguire un'istanza locale è usare Docker Compose:

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
cp packages/backend/.env.production.example packages/backend/.env.production
docker compose up -d
```

Questo avvia il reverse proxy Caddy, il backend, il frontend e PostgreSQL. Una volta in esecuzione, apri <http://localhost> (HTTPS è abilitato per impostazione predefinita sulla porta 443). Per una configurazione manuale completa (senza Docker), consulta [Installazione](#installation).

> **Nota:** Lo stack Compose di produzione richiede `packages/backend/.env.production`. Se preferisci un ambiente di sviluppo completamente preconfigurato con hot reload, usa invece `docker compose -f docker-compose.dev.yml up`.

## 📋 Prerequisiti

- **Node.js** v24.19.0 o superiore
- **pnpm** v11.21.0 o superiore
- **PostgreSQL** v18 o superiore
- **Docker** e **Docker Compose** (opzionale, per l'avvio rapido)

## 🚀 Installazione

### 1. Clonare il repository

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
```

### 2. Installare le dipendenze

Questo progetto utilizza pnpm come gestore di pacchetti. Il progetto impone pnpm tramite script di preinstallazione.

```bash
pnpm install
```

### 3. Configurazione dell'ambiente

Copia i file di ambiente di esempio e configura le tue impostazioni:

```bash
# Configurazione del backend
cp packages/backend/.env.example packages/backend/.env

# Configurazione del frontend
cp packages/frontend/.env.example packages/frontend/.env
```

Modifica i file di ambiente con la tua configurazione:

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

### 4. Configurazione del database

Genera il client Prisma, poi crea lo schema del database. Per lo sviluppo locale puoi utilizzare uno qualsiasi dei due approcci:

```bash
# Generare il client Prisma (sempre richiesto)
pnpm run db:generate

# Opzione A: Push diretto dello schema (iterazione rapida, senza file di migrazione)
pnpm run db:push

# Opzione B: Creare e applicare una migrazione (consigliato per modifiche tracciate)
pnpm run db:migrate
```

Per i deployment di produzione, utilizza `pnpm run db:migrate:prod` per applicare le migrazioni esistenti senza prompt interattivi.

### 5. Avviare il server di sviluppo

```bash
pnpm run dev
```

Questo avvierà sia il server backend sia quello frontend in modo concorrente. Per eseguirli in modo indipendente:

```bash
pnpm run dev:backend    # Solo backend (http://localhost:5001)
pnpm run dev:frontend   # Solo frontend (http://localhost:5173)
```

## 🎯 Utilizzo

I comandi più comuni per lo sviluppo quotidiano:

| Attività                    | Comando                 |
| --------------------------- | ----------------------- |
| Avviare backend + frontend  | `pnpm run dev`          |
| Avviare solo il backend     | `pnpm run dev:backend`  |
| Avviare solo il frontend    | `pnpm run dev:frontend` |
| Compilare tutti i pacchetti | `pnpm run build`        |

## 🧪 Test

```bash
pnpm run test              # Tutti i test
pnpm run test:coverage     # Con report di copertura
pnpm run test:unit         # Solo test unitari
pnpm run test:integration  # Test di integrazione del backend
pnpm run test:e2e          # End-to-end (backend Vitest + frontend Playwright)
pnpm run test:watch        # Modalità watch
```

Soglie di copertura applicate: **80% righe, funzioni, statement e branch**.

### Test di carico (k6)

Gli scenari di test di carico predefiniti si trovano in [`k6/scripts/scenarios/`](k6/scripts/scenarios). Copia [`k6/.env.k6.example`](k6/.env.k6.example) in `k6/.env.k6`, configura il tuo target, quindi esegui uno scenario come:

```bash
pnpm run loadtest:normal    # Carico quotidiano realistico
pnpm run loadtest:peak      # Affluenza di Sprint Planning (concorrenza nel caso peggiore)
pnpm run loadtest:stress    # Spingere il sistema fino al punto di rottura
```

> **Prerequisito:** Installa [k6](https://k6.io/docs/get-started/installation/) e assicurati che il backend di destinazione sia in esecuzione. Ulteriori scenari (endurance, multi-team, daily-scrum, auth, db) sono disponibili tramite gli script `loadtest:*` in [`package.json`](package.json).

## 🔍 Qualità del codice

| Attività                     | Comando              |
| ---------------------------- | -------------------- |
| Lint (ESLint)                | `pnpm run lint`      |
| Lint e correzione automatica | `pnpm run lint:fix`  |
| Lint CSS (Stylelint)         | `pnpm run lint:css`  |
| Formattazione (Prettier)     | `pnpm run format`    |
| Verifica dei tipi            | `pnpm run typecheck` |
| Audit di sicurezza           | `pnpm run audit`     |

Consulta [`CONTRIBUTING.md`](CONTRIBUTING.md) per il flusso di lavoro di sviluppo completo e i controlli di qualità.

## 🗄 Gestione del database

```bash
pnpm run db:generate     # Generare il client Prisma (dopo modifiche allo schema)
pnpm run db:migrate      # Creare e applicare una migrazione (sviluppo)
pnpm run db:migrate:prod # Applicare le migrazioni in produzione (non interattivo)
pnpm run db:studio       # Aprire Prisma Studio (GUI del database)
```

Ulteriori comandi per il database (`db:push`, `db:reset`, `db:validate`, `db:migrate:test`) sono documentati in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 🐳 Supporto Docker

Il progetto include la configurazione Docker sia per lo sviluppo sia per il deployment in produzione.

### Utilizzare Docker Compose

```bash
# Ambiente di sviluppo (con hot reload)
docker compose -f docker-compose.dev.yml up

# Ambiente di produzione (detached)
docker compose up -d

# Smontare
docker compose down
```

### Costruire le immagini Docker manualmente

> **Nota:** Tutti i Dockerfile fanno riferimento a percorsi relativi alla radice del repository (file del workspace monorepo come `package.json`, `pnpm-lock.yaml` e `packages/shared/`). Devi costruirli dalla **radice del repository** e usare `-f` per puntare al Dockerfile — passare la directory del pacchetto come contesto di build non funzionerà.

```bash
# Immagini di sviluppo (con dipendenze di sviluppo e modalità watch)
docker build -t scrumooth-backend:dev -f packages/backend/Dockerfile.dev .
docker build -t scrumooth-frontend:dev -f packages/frontend/Dockerfile.dev .

# Immagini di produzione (costruire dalla radice del repository)
docker build -t scrumooth-backend -f packages/backend/Dockerfile .
docker build -t scrumooth-frontend -f packages/frontend/Dockerfile .
```

<details>
<summary>Utilizzare un mirror registry/apt</summary>

Se ti trovi dietro una rete che richiede un registry npm o un mirror apt, puoi configurarli come argomenti di build o variabili di ambiente:

```bash
# Docker Compose
$env:NPM_REGISTRY="https://your_mirror_url"
$env:APT_MIRROR="your_mirror_url"

# Build manuale
docker build --build-arg NPM_REGISTRY=https://your_mirror_url --build-arg APT_MIRROR=your_mirror_url .
```

</details>

## ☁️ Distribuzione

### Produzione self-hosted

Consulta [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) per la guida completa alla distribuzione in produzione, che copre la configurazione dell'ambiente, la migrazione del database, la configurazione del reverse proxy e le migliori pratiche operative.

### Distribuzione della demo su GitHub Pages

Il branch `main` viene distribuito automaticamente su GitHub Pages tramite il workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml), utilizzando una **Mock API** in memoria (nessun backend o database richiesto). Consulta la [Demo dal vivo](#live-demo) qui sopra per provarla.

## 📚 Documentazione

| Area                            | Posizione                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guida utente**                | [`docs/user-guide/`](docs/user-guide) — primi passi, funzionalità principali, flussi di lavoro Scrum                                         |
| **Riferimento API REST**        | [`docs/api/`](docs/api) — gruppi di endpoint che coprono autenticazione, sprint, backlog, report e altro                                     |
| **Architettura di sistema**     | [`docs/architecture/`](docs/architecture) — progettazione del sistema, modello dati, progettazione dei componenti, architettura di sicurezza |
| **Guida alla distribuzione**    | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                                             |
| **Politica di sicurezza**       | [`SECURITY.md`](SECURITY.md) — procedura di segnalazione delle vulnerabilità                                                                 |
| **Contribuire**                 | [`CONTRIBUTING.md`](CONTRIBUTING.md) — linee guida e flusso di lavoro di sviluppo                                                            |
| **Codice di condotta**          | [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — standard della community                                                                        |
| **Cronologia dei release**      | [`CHANGELOG.md`](CHANGELOG.md)                                                                                                               |
| **Attribuzioni di terze parti** | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                                           |

## 🛟 Risoluzione dei problemi

### `Cannot find module @scrumooth/shared`

Il pacchetto condiviso deve essere compilato prima che backend/frontend possano risolvere gli import.

```bash
pnpm --filter=@scrumooth/shared run build
```

Questo viene normalmente gestito automaticamente da `pnpm install` e dagli script di sviluppo, ma è necessario dopo un `pnpm run clean` manuale.

### `pnpm install` fallisce con "Use pnpm instead"

Il repository impone pnpm tramite uno script `preinstall`. Installa pnpm globalmente:

```bash
npm install -g pnpm@11.21.0
```

### Errori di connessione al database all'avvio

Verifica che la tua `DATABASE_URL` in `packages/backend/.env` punti a un'istanza PostgreSQL 18+ in esecuzione e che il database esista. Esegui `pnpm run db:validate` per validare lo schema Prisma rispetto alla connessione.

### Porta già in uso (5001 o 5173)

Le porte predefinite possono essere sovrascritte tramite variabili di ambiente:

- Backend: `PORT` in `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` in `packages/frontend/.env`

### Il frontend non riesce a raggiungere il backend

Verifica che `VITE_API_URL` in `packages/frontend/.env` corrisponda all'indirizzo effettivo del backend e che `CORS_ORIGIN` in `packages/backend/.env` consenta l'origine del frontend.

### Vuoi sviluppare senza backend?

Imposta `VITE_USE_MOCK_API=true` in `packages/frontend/.env` per utilizzare la stessa Mock API che alimenta la demo dal vivo.

## 🗺 Roadmap

Scrumooth è in fase di sviluppo attivo. Le priorità imminenti includono:

- [ ] Dashboard di reportistica e analisi migliorate
- [ ] Integrazioni e webhook aggiuntivi
- [ ] Rafforzamento di prestazioni e scalabilità

Lo stato del progetto e le ultime modifiche sono tracciati nel [CHANGELOG](CHANGELOG.md). Feedback e richieste di funzionalità sono benvenuti tramite [GitHub Issues](https://github.com/orbivort/scrumooth/issues).

## 🤝 Contribuire

I contributi sono benvenuti! Leggi [`CONTRIBUTING.md`](CONTRIBUTING.md) per il flusso di lavoro di sviluppo, gli standard di codice e il processo di pull request, e consulta il [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) prima di partecipare.

## 📝 Licenza

Questo progetto è concesso in licenza sotto la [Apache License 2.0](LICENSE).
