# Scrumooth

**Agile Scrum Lifecycle Management System**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg?token=Z2T4R3G8F7)](https://codecov.io/github/orbivort/scrumooth)
[![Known Vulnerabilities](https://snyk.io/test/github/orbivort/scrumooth/badge.svg)](https://snyk.io/test/github/orbivort/scrumooth)

[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-success?style=for-the-badge)](https://orbivort.github.io/scrumooth/)

Scrumooth is a self-hosted web application for managing Agile Scrum processes, built to faithfully follow the Scrum Guide with modern technologies and rigorous quality standards. It provides a complete solution that guides teams through the entire Scrum lifecycle — from product goals and backlogs to sprint reviews and retrospectives — all deployable on your own infrastructure with zero per‑user fees.

## 🚀 Live Demo

Try Scrumooth instantly in your browser — no installation required. The demo runs with mock data (no backend needed) so you can explore the full Scrum lifecycle right away.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Launch the Live Demo on GitHub Pages</strong>
  </a>
</p>

> **Note:** The demo uses in‑memory mock data — any changes you make are local to your browser session and reset on refresh. For persistent data and multi‑user collaboration, follow the [Installation](#-installation) guide to self‑host your own instance.

## ✨ Features

### Core Scrum Features

- **Product Goals** - Strategic alignment and goal tracking
- **Product Backlog** - MoSCoW prioritization (Must, Should, Could, Won't)
- **Sprint Planning** - Configurable sprint durations and capacity planning
- **Sprint Execution** - Interactive Kanban board with drag-and-drop
- **Daily Scrum** - Daily standup tracking and updates
- **Impediments** - Blocker identification and resolution tracking
- **Incremental Delivery** - Product increment management
- **Sprint Reviews** - Review meeting management and documentation
- **Retrospectives** - Team reflection and continuous improvement

### Advanced Features

- **Dashboard & Reporting** - Real-time metrics and visualizations
- **Workflow Engine** - Role-based permissions and state transitions
- **Definition of Done/Ready** - Customizable checklists
- **Team Communication** - Built-in notifications and messaging
- **Audit Logging** - Comprehensive action tracking

## 🛠 Tech Stack

### Backend

- **Runtime:** Node.js 24+
- **Framework:** Express.js 5
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 18+ with Prisma ORM 7
- **Authentication:** JWT with bcrypt
- **Validation:** Zod
- **Scheduled Jobs:** node-cron
- **Email:** Nodemailer (SMTP, SendGrid, AWS SES providers)
- **Logging:** Winston with rotating file transports

### Frontend

- **Framework:** React 19 with Vite
- **Language:** TypeScript (strict mode)
- **Routing:** React Router 6
- **State Management:** TanStack Query (React Query) + Zustand
- **Visualization:** Chart.js
- **Styling:** CSS Modules with Design Tokens
- **Error Tracking:** Sentry (optional, via `VITE_SENTRY_DSN`)

### Shared

- TypeScript types and interfaces
- Constants and enumerations
- Utility functions

### Testing & Quality

- **Unit / Integration:** Vitest
- **End-to-End:** Playwright (frontend) + Vitest (backend)
- **Load Testing:** k6 (10 pre-built scenarios)
- **Linting:** ESLint + Stylelint
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged

## 📁 Project Structure

```
scrumooth/
├── packages/
│   ├── backend/              # Express.js REST API
│   │   ├── src/
│   │   │   ├── controllers/  # API route handlers
│   │   │   ├── services/     # Business logic layer
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── routes/       # API route definitions
│   │   │   ├── utils/        # Utility functions
│   │   │   └── __tests__/    # Unit, integration, and e2e tests
│   │   ├── prisma/           # Database schema and migrations
│   │   ├── Dockerfile        # Production image
│   │   └── Dockerfile.dev    # Development image
│   ├── frontend/             # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Route-level pages
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── services/     # API client services
│   │   │   ├── stores/       # Zustand stores
│   │   │   └── styles/       # CSS and design tokens
│   │   ├── e2e/              # Playwright end-to-end tests
│   │   ├── Dockerfile        # Production image
│   │   └── Dockerfile.dev    # Development image
│   └── shared/               # Shared types, constants, utilities
├── docs/
│   ├── api/                  # REST API reference
│   ├── architecture/         # System design, data model, security
│   ├── deployment/           # Deployment guides
│   └── user-guide/           # User documentation and guides
├── k6/                       # Load testing scenarios (k6)
│   └── scripts/scenarios/    # pre-built load test scenarios
├── scripts/                  # Build and utility scripts
├── .github/workflows/        # CI, Release, and GitHub Pages deployment
├── docker-compose.yml        # Production Docker Compose
├── docker-compose.dev.yml    # Development Docker Compose
├── CHANGELOG.md              # Version history
├── SECURITY.md               # Security policy and reporting
└── THIRD-PARTY-NOTICES.md    # Third-party license attributions
```

## 📋 Prerequisites

- **Node.js** v24.14.1 or higher
- **pnpm** v11.5.0 or higher
- **PostgreSQL** v18 or higher
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
```

### 2. Install Dependencies

This project uses pnpm as its package manager. The project enforces pnpm through preinstall scripts.

```bash
pnpm install
```

### 3. Environment Configuration

Copy the example environment files and configure your settings:

```bash
# Backend configuration
cp packages/backend/.env.example packages/backend/.env

# Frontend configuration
cp packages/frontend/.env.example packages/frontend/.env
```

Edit the environment files with your configuration:

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

### 4. Database Setup

Generate the Prisma client, then create your database schema. For local development you can use either approach:

```bash
# Generate Prisma client (always required)
pnpm run db:generate

# Option A: Push schema directly (fast iteration, no migration files)
pnpm run db:push

# Option B: Create and apply a migration (recommended for tracked changes)
pnpm run db:migrate
```

For production deployments use `pnpm run db:migrate:prod` to apply existing migrations without prompting.

### 5. Start Development Server

```bash
pnpm run dev
```

This will start both the backend and frontend servers concurrently. To run them independently:

```bash
pnpm run dev:backend    # Backend only (http://localhost:5001)
pnpm run dev:frontend   # Frontend only (http://localhost:5173)
```

## 🎯 Usage

### Development

```bash
# Start both frontend and backend
pnpm run dev

# Start in test mode (uses NODE_ENV=test)
pnpm run dev:test

# Start only one side
pnpm run dev:backend
pnpm run dev:frontend
```

### Build

```bash
# Build all packages
pnpm run build

# Clean build artifacts
pnpm run clean

# Full clean including node_modules
pnpm run clean:all
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests across all packages
pnpm run test

# Run with coverage report
pnpm run test:coverage

# Run unit tests only
pnpm run test:unit

# Run integration tests (backend only)
pnpm run test:integration

# Run end-to-end tests (backend Vitest + frontend Playwright)
pnpm run test:e2e

# Run e2e for one side only
pnpm run test:e2e:backend
pnpm run test:e2e:frontend

# Watch mode
pnpm run test:watch
```

Coverage thresholds enforced: **80% lines, functions, statements** and **70% branches**.

### Load Testing (k6)

Ten pre-built load test scenarios live under [`k6/scripts/scenarios/`](k6/scripts/scenarios). Before running, copy [`k6/.env.k6.example`](k6/.env.k6.example) to `k6/.env.k6` and configure your target.

```bash
# Realistic everyday load
pnpm run loadtest:normal

# Sprint planning rush (worst-case concurrency)
pnpm run loadtest:peak

# Push the system until it breaks
pnpm run loadtest:stress

# Sustained 8-hour workday simulation
pnpm run loadtest:endurance

# Other scenarios
pnpm run loadtest:multi-team
pnpm run loadtest:daily-scrum
pnpm run loadtest:auth
pnpm run loadtest:db

# Generate seed data for load tests
pnpm run loadtest:generate-data
```

> **Prerequisite:** Install [k6](https://k6.io/docs/get-started/installation/) and ensure your target backend is running.

## 🔍 Code Quality

### Linting

```bash
# Run ESLint on TypeScript/JavaScript files
pnpm run lint

# Auto-fix ESLint issues
pnpm run lint:fix

# Run Stylelint on CSS files
pnpm run lint:css

# Auto-fix Stylelint issues
pnpm run lint:css:fix
```

### Formatting

```bash
# Format all source files with Prettier
pnpm run format

# Check formatting without writing changes
pnpm run format:check

# CSS-specific formatting
pnpm run format:css
pnpm run format:css:check
```

### Type Checking

```bash
# Run TypeScript type checking across all packages
pnpm run typecheck
```

### Security Auditing

```bash
# Check installed dependencies for known vulnerabilities
pnpm run audit

# List outdated dependencies
pnpm run outdated
```

## 🗄 Database Management

```bash
# Generate Prisma client (after schema changes)
pnpm run db:generate

# Push schema to database (development, no migration files)
pnpm run db:push

# Create and apply a new migration (development)
pnpm run db:migrate

# Apply migrations in production (non-interactive)
pnpm run db:migrate:prod

# Apply migrations against the test database
pnpm run db:migrate:test

# Open Prisma Studio (database GUI)
pnpm run db:studio

# Reset the database (⚠️ destroys all data)
pnpm run db:reset

# Validate the Prisma schema
pnpm run db:validate
```

## 🐳 Docker Support

The project includes Docker configuration for both development and production deployment.

### Using Docker Compose

```bash
# Development environment (with hot reload)
docker compose -f docker-compose.dev.yml up

# Production environment (detached)
docker compose up -d

# Tear down
docker compose down
```

### Build Docker Images Manually

```bash
# Production images
docker build -t scrumooth-backend ./packages/backend
docker build -t scrumooth-frontend ./packages/frontend

# Development images (with dev dependencies and watch mode)
docker build -f ./packages/backend/Dockerfile.dev -t scrumooth-backend:dev ./packages/backend
docker build -f ./packages/frontend/Dockerfile.dev -t scrumooth-frontend:dev ./packages/frontend
```

## ☁️ Deployment

### Self-Hosted Production

See [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) for full production deployment guidance covering environment configuration, database migration, reverse-proxy setup, and operational best practices.

### Demo Deployment on GitHub Pages

The `main` branch is automatically deployed to GitHub Pages via the [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml) workflow. The Pages build:

- Uses an in-memory **mock API** (no backend or database required)

Live demo: <https://orbivort.github.io/scrumooth/>

## 📚 Documentation

| Area                    | Location                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **User guide**          | [`docs/user-guide/`](docs/user-guide) — getting started, core features, Scrum workflows                        |
| **REST API reference**  | [`docs/api/`](docs/api) — 19 endpoint groups (authentication, sprints, backlog, reports, etc.)                 |
| **System architecture** | [`docs/architecture/`](docs/architecture) — system design, data model, component design, security architecture |
| **Deployment guide**    | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                               |
| **Security policy**     | [`SECURITY.md`](SECURITY.md) — vulnerability reporting procedure                                               |
| **Release history**     | [`CHANGELOG.md`](CHANGELOG.md)                                                                                 |
| **Third-party notices** | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                             |

## 🛟 Troubleshooting

### `Cannot find module @scrumooth/shared`

The shared package must be built before backend/frontend can resolve imports.

```bash
pnpm --filter=@scrumooth/shared run build
```

This is normally handled automatically by `pnpm install` and the dev scripts, but is required after a manual `pnpm run clean`.

### `pnpm install` fails with "Use pnpm instead"

The repository enforces pnpm via a `preinstall` script. Install pnpm globally:

```bash
npm install -g pnpm@11.5.0
```

### Database connection errors on startup

Verify your `DATABASE_URL` in `packages/backend/.env` points to a running PostgreSQL 18+ instance, and that the database exists. Run `pnpm run db:validate` to validate the Prisma schema against the connection.

### Port already in use (5001 or 5173)

Default ports can be overridden via environment variables:

- Backend: `PORT` in `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` in `packages/frontend/.env`

### Frontend cannot reach the backend

Check that `VITE_API_URL` in `packages/frontend/.env` matches the actual backend address and that `CORS_ORIGIN` in `packages/backend/.env` allows the frontend origin.

### Want to develop without a backend?

Set `VITE_USE_MOCK_API=true` in `packages/frontend/.env` to use the same mock API that powers the live demo.

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

```
Copyright 2026 Orbivort

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
