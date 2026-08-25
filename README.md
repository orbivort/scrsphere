# Scrumooth – Block the noise. Ship the smooth.

_The Linter for Scrum._

_Self-hosted, open-source, and built to enforce the 2020 Scrum Guide._

> **Languages:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg)](https://codecov.io/github/orbivort/scrumooth)
[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791.svg)](https://www.postgresql.org/)

<p align="center">
  <img src="docs/screenshots/scrumooth.png" alt="Scrumooth" width="800" />
</p>

<a id="live-demo"></a>

## 🖥️ Live Demo

Try Scrumooth instantly in your browser — no installation required. The demo runs with mock data (no backend needed) so you can explore the full Scrum lifecycle right away.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Launch the Live Demo on GitHub Pages</strong>
  </a>
</p>

> **Note:** The demo uses in‑memory mock data — any changes you make are local to your browser session and reset on refresh. For persistent data and multi‑user collaboration, follow the [Installation](#installation) guide to self‑host your own instance.

---

<a id="the-manifesto"></a>

## 📜 The Manifesto — Why Scrumooth exists

> Most project management tools are **passive tape recorders**.
> They give you boards, they log your clicks, they draw beautiful charts—_after_ the Sprint fails.
> They track your mistakes. They never stop you from making them.
>
> **Scrumooth flips the script.** We are the **gatekeeper**, not the note-taker.
>
> We embed the **2020 Scrum Guide** as executable code. We don't just suggest best practices—we **enforce** them natively, so your team spends less time arguing about process and more time shipping working software.

## Table of Contents

- [Live Demo](#live-demo)
- [The Manifesto](#the-manifesto)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Database Management](#database-management)
- [Docker Support](#docker-support)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

<a id="features"></a>

## ✨ Features

### Core Scrum Features

- **Product Goal** - Strategic alignment and goal tracking
- **Product Backlog** - MoSCoW prioritization (Must, Should, Could, Won't)
- **Sprint Planning** - Configurable sprint durations and capacity planning
- **Sprint Execution** - Interactive Kanban board with drag-and-drop
- **Daily Scrum** - Daily standup tracking and updates
- **Impediment** - Blocker identification and resolution tracking
- **Increment** - Product increment management
- **Sprint Review** - Review meeting management and documentation
- **Sprint Retrospective** - Team reflection and continuous improvement

### Advanced Features

- **Dashboard & Reporting** - Real-time metrics and visualizations
- **Workflow Engine** - Role-based permissions and state transitions
- **Definition of Done/Ready** - Customizable checklists
- **Team Communication** - Built-in notifications and messaging
- **Audit Logging** - Comprehensive action tracking

<a id="tech-stack"></a>

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
├── CONTRIBUTING.md           # Contributing guidelines
├── CODE_OF_CONDUCT.md        # Community code of conduct
└── THIRD-PARTY-NOTICES.md    # Third-party license attributions
```

<a id="quick-start"></a>

## ⚡ Quick Start

The fastest way to run a local instance is with Docker Compose:

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
cp packages/backend/.env.production.example packages/backend/.env.production
docker compose up -d
```

This starts the Caddy reverse proxy, backend, frontend, and PostgreSQL. Once running, open <http://localhost> (HTTPS is enabled by default on port 443). For a full manual setup (without Docker), see [Installation](#installation).

> **Note:** The production compose stack requires `packages/backend/.env.production`. If you prefer a fully pre-configured, hot-reloading development environment, use `docker compose -f docker-compose.dev.yml up` instead.

<a id="prerequisites"></a>

## 📋 Prerequisites

- **Node.js** v24.19.0 or higher
- **pnpm** v11.21.0 or higher
- **PostgreSQL** v18 or higher
- **Docker** & **Docker Compose** (optional, for the Quick Start)

<a id="installation"></a>

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

# Optional: restrict new-account registration to specific email domains.
# Leave empty/unset for open registration. Enforced server-side (HTTP 403 on
# disallowed domains). Tenant-control gate only, not email verification.
REGISTRATION_ALLOWED_EMAIL_DOMAINS=example.com,example.eu
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

The most common commands for everyday development:

| Task                     | Command                 |
| ------------------------ | ----------------------- |
| Start backend + frontend | `pnpm run dev`          |
| Start backend only       | `pnpm run dev:backend`  |
| Start frontend only      | `pnpm run dev:frontend` |
| Build all packages       | `pnpm run build`        |

<a id="testing"></a>

## 🧪 Testing

```bash
pnpm run test              # All tests
pnpm run test:coverage     # With coverage report
pnpm run test:unit         # Unit tests only
pnpm run test:integration  # Backend integration tests
pnpm run test:e2e          # End-to-end (backend Vitest + frontend Playwright)
pnpm run test:watch        # Watch mode
```

Coverage thresholds enforced: **80% lines, functions, statements, branches**.

### Load Testing (k6)

Pre-built load test scenarios live under [`k6/scripts/scenarios/`](k6/scripts/scenarios). Copy [`k6/.env.k6.example`](k6/.env.k6.example) to `k6/.env.k6`, configure your target, then run a scenario such as:

```bash
pnpm run loadtest:normal    # Realistic everyday load
pnpm run loadtest:peak      # Sprint planning rush (worst-case concurrency)
pnpm run loadtest:stress    # Push the system until it breaks
```

> **Prerequisite:** Install [k6](https://k6.io/docs/get-started/installation/) and ensure your target backend is running. Additional scenarios (endurance, multi-team, daily-scrum, auth, db) are available via the `loadtest:*` scripts in [`package.json`](package.json).

<a id="code-quality"></a>

## 🔍 Code Quality

| Task                 | Command              |
| -------------------- | -------------------- |
| Lint (ESLint)        | `pnpm run lint`      |
| Lint & auto-fix      | `pnpm run lint:fix`  |
| Lint CSS (Stylelint) | `pnpm run lint:css`  |
| Format (Prettier)    | `pnpm run format`    |
| Type check           | `pnpm run typecheck` |
| Security audit       | `pnpm run audit`     |

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full development workflow and quality gates.

<a id="database-management"></a>

## 🗄 Database Management

```bash
pnpm run db:generate     # Generate Prisma client (after schema changes)
pnpm run db:migrate      # Create and apply a migration (development)
pnpm run db:migrate:prod # Apply migrations in production (non-interactive)
pnpm run db:studio       # Open Prisma Studio (database GUI)
```

Additional database commands (`db:push`, `db:reset`, `db:validate`, `db:migrate:test`) are documented in [`CONTRIBUTING.md`](CONTRIBUTING.md).

<a id="docker-support"></a>

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

> **Note:** All Dockerfiles reference repository-root-relative paths (monorepo workspace files such as `package.json`, `pnpm-lock.yaml`, and `packages/shared/`). You must build them from the **repository root** and use `-f` to point at the Dockerfile — passing the package directory as the build context will fail.

```bash
# Development images (with dev dependencies and watch mode)
docker build -t scrumooth-backend:dev -f packages/backend/Dockerfile.dev .
docker build -t scrumooth-frontend:dev -f packages/frontend/Dockerfile.dev .

# Production images (build from the repo root)
docker build -t scrumooth-backend -f packages/backend/Dockerfile .
docker build -t scrumooth-frontend -f packages/frontend/Dockerfile .
```

<details>
<summary>Using a registry/apt mirror</summary>

If you are behind a network that requires an npm registry or apt mirror, you can set them as build arguments or environment variables:

```bash
# Docker Compose
$env:NPM_REGISTRY="https://your_mirror_url"
$env:APT_MIRROR="your_mirror_url"

# Manual build
docker build --build-arg NPM_REGISTRY=https://your_mirror_url --build-arg APT_MIRROR=your_mirror_url .
```

</details>

<a id="deployment"></a>

## ☁️ Deployment

### Self-Hosted Production

See [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) for full production deployment guidance covering environment configuration, database migration, reverse-proxy setup, and operational best practices.

### Demo Deployment on GitHub Pages

The `main` branch is automatically deployed to GitHub Pages via the [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml) workflow, using an in-memory **mock API** (no backend or database required). See the [Live Demo](#live-demo) above to try it.

<a id="documentation"></a>

## 📚 Documentation

| Area                    | Location                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **User guide**          | [`docs/user-guide/`](docs/user-guide) — getting started, core features, Scrum workflows                        |
| **REST API reference**  | [`docs/api/`](docs/api) — endpoint groups covering authentication, sprints, backlog, reports, and more         |
| **System architecture** | [`docs/architecture/`](docs/architecture) — system design, data model, component design, security architecture |
| **Deployment guide**    | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                               |
| **Security policy**     | [`SECURITY.md`](SECURITY.md) — vulnerability reporting procedure                                               |
| **Contributing**        | [`CONTRIBUTING.md`](CONTRIBUTING.md) — guidelines and development workflow                                     |
| **Code of conduct**     | [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — community standards                                               |
| **Release history**     | [`CHANGELOG.md`](CHANGELOG.md)                                                                                 |
| **Third-party notices** | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                             |

<a id="troubleshooting"></a>

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
npm install -g pnpm@11.21.0
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

<a id="roadmap"></a>

## 🗺 Roadmap

Scrumooth is under active development. Upcoming priorities include:

- [ ] Enhanced reporting and analytics dashboards
- [ ] Additional integrations and webhooks
- [ ] Performance and scalability hardening

The project status and latest changes are tracked in the [CHANGELOG](CHANGELOG.md). Feedback and feature requests are welcome via [GitHub Issues](https://github.com/orbivort/scrumooth/issues).

<a id="contributing"></a>

## 🤝 Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for development workflow, code standards, and the pull request process, and review the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) before participating.

<a id="license"></a>

## 📝 License

This project is licensed under the [Apache License 2.0](LICENSE).
