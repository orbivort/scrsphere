# Scrumooth

**Sistema di gestione del ciclo di vita Scrum Agile**

> **Lingue:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg?token=Z2T4R3G8F7)](https://codecov.io/github/orbivort/scrumooth)
[![Known Vulnerabilities](https://snyk.io/test/github/orbivort/scrumooth/badge.svg)](https://snyk.io/test/github/orbivort/scrumooth)

[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-success?style=for-the-badge)](https://orbivort.github.io/scrumooth/)

Scrumooth è un'applicazione web auto-ospitata per la gestione dei processi Scrum Agile, costruita per seguire fedelmente la Guida Scrum con tecnologie moderne e standard di qualità rigorosi. Fornisce una soluzione completa che guida i team attraverso l'intero ciclo di vita Scrum — dai Product Goals e dal Product Backlog fino alle Sprint Reviews e alle Sprint Retrospectives — il tutto distribuibile sulla propria infrastruttura, senza tariffe per singolo utente.

## 🚀 Demo dal vivo

Provi Scrumooth istantaneamente nel suo browser — non è richiesta alcuna installazione. La demo viene eseguita con dati simulati (nessun backend necessario) così da poter esplorare immediatamente l'intero ciclo di vita Scrum.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Avviare la demo dal vivo su GitHub Pages</strong>
  </a>
</p>

> **Nota:** La demo utilizza dati simulati in memoria — qualsiasi modifica apportata è locale alla sessione del browser e viene ripristinata al refresh. Per dati persistenti e collaborazione multiutente, segua la guida all'[Installazione](#-installazione) per ospitare autonomamente la propria istanza.

## ✨ Funzionalità

### Funzionalità Scrum principali

- **Product Goal** — Allineamento strategico e tracciamento degli obiettivi
- **Product Backlog** — Prioritizzazione MoSCoW (Must, Should, Could, Won't)
- **Sprint Planning** — Durate configurabili degli Sprint e pianificazione della capacità
- **Esecuzione dello Sprint** — Board Kanban interattiva con drag-and-drop
- **Daily Scrum** — Tracciamento dello standup giornaliero e aggiornamenti
- **Impediments** — Identificazione dei bloccanti e tracciamento della risoluzione
- **Consegna incrementale** — Gestione degli Increments di prodotto
- **Sprint Review** — Gestione della riunione di review e documentazione
- **Retrospectives** — Riflessione del team e miglioramento continuo

### Funzionalità avanzate

- **Dashboard e reportistica** — Metriche e visualizzazioni in tempo reale
- **Motore di workflow** — Permessi basati sui ruoli e transizioni di stato
- **Definition of Done/Ready** — Checklist personalizzabili
- **Comunicazione del team** — Notifiche e messaggistica integrate
- **Log di audit** — Tracciamento completo delle azioni

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
- **Tracciamento errori:** Sentry (opzionale, via `VITE_SENTRY_DSN`)

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
│   │   │   └── __tests__/    # Test unitari, integrazione ed e2e
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
│   ├── deployment/           # Guide di deployment
│   └── user-guide/           # Documentazione utente e guide
├── k6/                       # Scenari di test di carico (k6)
│   └── scripts/scenarios/    # scenari di test di carico predefiniti
├── scripts/                  # Script di build e di utilità
├── .github/workflows/        # CI, Release e deployment GitHub Pages
├── docker-compose.yml        # Docker Compose di produzione
├── docker-compose.dev.yml    # Docker Compose di sviluppo
├── CHANGELOG.md              # Cronologia delle versioni
├── SECURITY.md               # Politica di sicurezza e segnalazione
└── THIRD-PARTY-NOTICES.md    # Attribuzioni delle licenze di terze parti
```

## 📋 Prerequisiti

- **Node.js** v24.14.1 o superiore
- **pnpm** v11.5.0 o superiore
- **PostgreSQL** v18 o superiore
- **Git**

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

Copi i file di ambiente di esempio e configuri le proprie impostazioni:

```bash
# Configurazione del backend
cp packages/backend/.env.example packages/backend/.env

# Configurazione del frontend
cp packages/frontend/.env.example packages/frontend/.env
```

Modifichi i file di ambiente con la propria configurazione:

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

Generi il client Prisma, poi crei il proprio schema del database. Per lo sviluppo locale può utilizzare uno qualsiasi degli approcci:

```bash
# Generare il client Prisma (sempre richiesto)
pnpm run db:generate

# Opzione A: Push diretto dello schema (iterazione veloce, senza file di migrazione)
pnpm run db:push

# Opzione B: Creare e applicare una migrazione (consigliato per modifiche tracciate)
pnpm run db:migrate
```

Per i deployment di produzione utilizzi `pnpm run db:migrate:prod` per applicare le migrazioni esistenti senza prompt interattivi.

### 5. Avviare il server di sviluppo

```bash
pnpm run dev
```

Questo avvierà sia il server backend che frontend contemporaneamente. Per avviarli indipendentemente:

```bash
pnpm run dev:backend    # Solo backend (http://localhost:5001)
pnpm run dev:frontend   # Solo frontend (http://localhost:5173)
```

## 🎯 Utilizzo

### Sviluppo

```bash
# Avviare frontend e backend insieme
pnpm run dev

# Avviare in modalità test (utilizza NODE_ENV=test)
pnpm run dev:test

# Avviare un solo lato
pnpm run dev:backend
pnpm run dev:frontend
```

### Build

```bash
# Costruire tutti i pacchetti
pnpm run build

# Pulire gli artefatti di build
pnpm run clean

# Pulizia completa inclusi i node_modules
pnpm run clean:all
```

## 🧪 Test

### Eseguire i test

```bash
# Eseguire tutti i test su tutti i pacchetti
pnpm run test

# Eseguire con report di copertura
pnpm run test:coverage

# Eseguire solo i test unitari
pnpm run test:unit

# Eseguire i test di integrazione (solo backend)
pnpm run test:integration

# Eseguire i test end-to-end (Vitest backend + Playwright frontend)
pnpm run test:e2e

# Eseguire E2E per un solo lato
pnpm run test:e2e:backend
pnpm run test:e2e:frontend

# Modalità watch
pnpm run test:watch
```

Soglie di copertura obbligatorie: **80% righe, funzioni, statement** e **70% branch**.

### Test di carico (k6)

Dieci scenari di test di carico predefiniti si trovano in [`k6/scripts/scenarios/`](k6/scripts/scenarios). Prima dell'esecuzione, copi [`k6/.env.k6.example`](k6/.env.k6.example) in `k6/.env.k6` e configuri il proprio target.

```bash
# Carico quotidiano realistico
pnpm run loadtest:normal

# Rush di Sprint Planning (concorrenza nel caso peggiore)
pnpm run loadtest:peak

# Spingere il sistema fino al punto di rottura
pnpm run loadtest:stress

# Simulazione di giornata lavorativa sostenuta di 8 ore
pnpm run loadtest:endurance

# Altri scenari
pnpm run loadtest:multi-team
pnpm run loadtest:daily-scrum
pnpm run loadtest:auth
pnpm run loadtest:db

# Generare dati seed per i test di carico
pnpm run loadtest:generate-data
```

> **Prerequisito:** installi [k6](https://k6.io/docs/get-started/installation/) e si assicuri che il backend target sia in esecuzione.

## 🔍 Qualità del codice

### Linting

```bash
# Eseguire ESLint sui file TypeScript/JavaScript
pnpm run lint

# Correggere automaticamente i problemi ESLint
pnpm run lint:fix

# Eseguire Stylelint sui file CSS
pnpm run lint:css

# Correggere automaticamente i problemi Stylelint
pnpm run lint:css:fix
```

### Formattazione

```bash
# Formattare tutti i file sorgenti con Prettier
pnpm run format

# Verificare la formattazione senza scrivere modifiche
pnpm run format:check

# Formattazione specifica CSS
pnpm run format:css
pnpm run format:css:check
```

### Verifica dei tipi

```bash
# Eseguire la verifica dei tipi TypeScript su tutti i pacchetti
pnpm run typecheck
```

### Audit di sicurezza

```bash
# Verificare le dipendenze installate per vulnerabilità note
pnpm run audit

# Elencare le dipendenze obsolete
pnpm run outdated
```

## 🗄 Gestione del database

```bash
# Generare il client Prisma (dopo modifiche allo schema)
pnpm run db:generate

# Push dello schema al database (sviluppo, senza file di migrazione)
pnpm run db:push

# Creare e applicare una nuova migrazione (sviluppo)
pnpm run db:migrate

# Applicare le migrazioni in produzione (non interattivo)
pnpm run db:migrate:prod

# Applicare le migrazioni al database di test
pnpm run db:migrate:test

# Aprire Prisma Studio (GUI del database)
pnpm run db:studio

# Resettare il database (⚠️ distrugge tutti i dati)
pnpm run db:reset

# Validare lo schema Prisma
pnpm run db:validate
```

## 🐳 Supporto Docker

Il progetto include la configurazione Docker sia per il deployment di sviluppo che di produzione.

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

```bash
# Immagini di produzione
docker build -t scrumooth-backend ./packages/backend
docker build -t scrumooth-frontend ./packages/frontend

# Immagini di sviluppo (con dipendenze dev e modalità watch)
docker build -f ./packages/backend/Dockerfile.dev -t scrumooth-backend:dev ./packages/backend
docker build -f ./packages/frontend/Dockerfile.dev -t scrumooth-frontend:dev ./packages/frontend
```

## ☁️ Deployment

### Produzione self-hosted

Veda [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) per la guida completa al deployment in produzione, che copre la configurazione dell'ambiente, la migrazione del database, la configurazione del reverse proxy e le migliori pratiche operative.

### Deployment della demo su GitHub Pages

Il branch `main` viene distribuito automaticamente su GitHub Pages tramite il workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml). Il build di Pages:

- Utilizza una **Mock API** in memoria (nessun backend o database richiesto)

Demo dal vivo: <https://orbivort.github.io/scrumooth/>

## 📚 Documentazione

| Area                            | Posizione                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guida utente**                | [`docs/user-guide/`](docs/user-guide) — primi passi, funzionalità principali, flussi di lavoro Scrum                                         |
| **Riferimento API REST**        | [`docs/api/`](docs/api) — 19 gruppi di endpoint (autenticazione, sprint, backlog, report, ecc.)                                              |
| **Architettura di sistema**     | [`docs/architecture/`](docs/architecture) — progettazione del sistema, modello dati, progettazione dei componenti, architettura di sicurezza |
| **Guida al deployment**         | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                                             |
| **Politica di sicurezza**       | [`SECURITY.md`](SECURITY.md) — procedura di segnalazione delle vulnerabilità                                                                 |
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

Il repository impone pnpm tramite uno script `preinstall`. installi pnpm globalmente:

```bash
npm install -g pnpm@11.5.0
```

### Errori di connessione al database all'avvio

Verifichi che la propria `DATABASE_URL` in `packages/backend/.env` punti a un'istanza PostgreSQL 18+ in esecuzione e che il database esista. Eseguisca `pnpm run db:validate` per validare lo schema Prisma rispetto alla connessione.

### Porta già in uso (5001 o 5173)

Le porte predefinite possono essere sovrascritte tramite variabili di ambiente:

- Backend: `PORT` in `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` in `packages/frontend/.env`

### Il frontend non riesce a raggiungere il backend

Verifichi che `VITE_API_URL` in `packages/frontend/.env` corrisponda all'indirizzo effettivo del backend e che `CORS_ORIGIN` in `packages/backend/.env` consenta l'origine del frontend.

### Vuole sviluppare senza backend?

Imposti `VITE_USE_MOCK_API=true` in `packages/frontend/.env` per utilizzare la stessa Mock API che alimenta la demo dal vivo.

## 📝 Licenza

Questo progetto è concesso in licenza sotto la Apache License 2.0 — veda il file [LICENSE](LICENSE) per i dettagli.

```
Copyright 2026 Orbivort

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
