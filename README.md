# Scrsphere

**Agile Scrum Lifecycle Management System**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Node.js Version](https://img.shields.io/badge/node-%5E24.14.1-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-blue.svg)](https://www.postgresql.org/)

Scrsphere is a self-hosted web application for managing Agile Scrum processes, built to faithfully follow the Scrum Guide with modern technologies and rigorous quality standards. It provides a complete solution that guides teams through the entire Scrum lifecycle — from product goals and backlogs to sprint reviews and retrospectives — all deployable on your own infrastructure with zero per‑user fees.

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
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL 18+ with Prisma ORM
- **Authentication:** JWT with bcrypt
- **Scheduled Jobs:** node-cron

### Frontend

- **Framework:** React 19 with Vite
- **Language:** TypeScript (strict mode)
- **State Management:** TanStack Query (React Query) + Zustand
- **Visualization:** Chart.js
- **Styling:** CSS Modules with Design Tokens

### Shared

- TypeScript types and interfaces
- Constants and enumerations
- Utility functions

## 📁 Project Structure

```
scrsphere/
├── packages/
│   ├── backend/              # Express.js REST API
│   │   ├── src/
│   │   │   ├── controllers/  # API route handlers
│   │   │   ├── services/     # Business logic layer
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── routes/       # API route definitions
│   │   │   ├── utils/        # Utility functions
│   │   │   └── __tests__/    # Test files
│   │   └── prisma/           # Database schema
│   ├── frontend/             # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── services/     # API client services
│   │   │   ├── stores/       # Zustand stores
│   │   │   └── styles/       # CSS and design tokens
│   │   └── e2e/              # End-to-end tests
│   └── shared/               # Shared types, constants, utilities
├── docs/                     # Documentation
├── scripts/                  # Build and utility scripts
└── .github/                  # GitHub workflows and templates
```

## 📋 Prerequisites

- **Node.js** v24.14.1 or higher
- **pnpm** v10.33.0 or higher
- **PostgreSQL** v18 or higher
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/orbivort/scrsphere.git
cd scrsphere
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
DATABASE_URL=postgresql://postgres:password@localhost:5432/scrsphere

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

Generate Prisma client and run migrations:

```bash
pnpm run db:generate
pnpm run db:migrate
```

### 5. Start Development Server

```bash
pnpm run dev
```

This will start both the backend and frontend servers concurrently.

## 🎯 Usage

### Development

```bash
# Start both frontend and backend
pnpm run dev

# Start both frontend and backend in test mode
pnpm run dev:test
```

### Build

```bash
# Build all packages
pnpm run build
```

## 🧪 Testing

### Run Tests

```bash
# Run tests with coverage
pnpm run test:coverage

# Run unit tests
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run end-to-end tests
pnpm run test:e2e
```

## 🔍 Code Quality

### Linting

```bash
# Run ESLint
pnpm run lint

# Run CSS linting
pnpm run lint:css
```

### Formatting

```bash
# Format code with Prettier
pnpm run format

# Check formatting
pnpm run format:check
```

### Type Checking

```bash
# Run TypeScript type checking
pnpm run typecheck
```

## 🗄 Database Management

```bash
# Generate Prisma client
pnpm run db:generate

# Create and apply migrations
pnpm run db:migrate

# Open Prisma Studio (GUI)
pnpm run db:studio
```

## 🐳 Docker Support

The project includes Docker configuration for containerized deployment.

### Using Docker Compose

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose up -d
```

### Build Docker Images

```bash
# Build backend image
docker build -t scrsphere-backend ./packages/backend

# Build frontend image
docker build -t scrsphere-frontend ./packages/frontend
```

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

```
Copyright 2024-2026 Orbivort

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
