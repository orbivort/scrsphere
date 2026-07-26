# Scrumooth

**Système de gestion du cycle de vie Scrum Agile**

> **Langues :** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg?token=Z2T4R3G8F7)](https://codecov.io/github/orbivort/scrumooth)
[![Known Vulnerabilities](https://snyk.io/test/github/orbivort/scrumooth/badge.svg)](https://snyk.io/test/github/orbivort/scrumooth)

[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-success?style=for-the-badge)](https://orbivort.github.io/scrumooth/)

Scrumooth est une application web auto-hébergée pour la gestion des processus Scrum Agile, conçue pour suivre fidèlement le Guide Scrum avec des technologies modernes et des normes de qualité rigoureuses. Elle fournit une solution complète qui guide les équipes à travers tout le cycle de vie Scrum — des Objectifs de Produit et des backlogs jusqu'aux Sprint Reviews et Retrospectives — le tout déployable sur votre propre infrastructure sans frais par utilisateur.

## 🚀 Démo en ligne

Essayez Scrumooth instantanément dans votre navigateur — aucune installation requise. La démo fonctionne avec des données simulées (aucun backend nécessaire) afin que vous puissiez explorer immédiatement le cycle de vie Scrum complet.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Lancer la démo en ligne sur GitHub Pages</strong>
  </a>
</p>

> **Note :** La démo utilise des données simulées en mémoire — toute modification que vous effectuez est locale à votre session de navigateur et est réinitialisée lors du rafraîchissement. Pour des données persistantes et la collaboration multi-utilisateurs, suivez le guide d'[Installation](#-installation) pour auto-héberger votre propre instance.

## ✨ Fonctionnalités

### Fonctionnalités Scrum principales

- **Objectifs de Produit** — Alignement stratégique et suivi des objectifs
- **Product Backlog** — Priorisation MoSCoW (Must, Should, Could, Won't)
- **Sprint Planning** — Durées de Sprint configurables et planification de capacité
- **Exécution du Sprint** — Tableau Kanban interactif avec glisser-déposer
- **Daily Scrum** — Suivi du standup quotidien et mises à jour
- **Obstacles** — Identification des bloqueurs et suivi de résolution
- **Livraison incrémentale** — Gestion des Increments de produit
- **Sprint Reviews** — Gestion et documentation des réunions de revue
- **Retrospectives** — Réflexion d'équipe et amélioration continue

### Fonctionnalités avancées

- **Tableau de bord et rapports** — Métriques et visualisations en temps réel
- **Moteur de flux de travail** — Permissions basées sur les rôles et transitions d'état
- **Definition of Done/Ready** — Listes de vérification personnalisables
- **Communication d'équipe** — Notifications et messagerie intégrées
- **Journalisation d'audit** — Suivi complet des actions

## 🛠 Stack technique

### Backend

- **Runtime :** Node.js 24+
- **Framework :** Express.js 5
- **Langage :** TypeScript (mode strict)
- **Base de données :** PostgreSQL 18+ avec Prisma ORM 7
- **Authentification :** JWT avec bcrypt
- **Validation :** Zod
- **Jobs planifiés :** node-cron
- **E-mail :** Nodemailer (fournisseurs SMTP, SendGrid, AWS SES)
- **Journalisation :** Winston avec transports de fichiers rotatifs

### Frontend

- **Framework :** React 19 avec Vite
- **Langage :** TypeScript (mode strict)
- **Routage :** React Router 6
- **Gestion d'état :** TanStack Query (React Query) + Zustand
- **Visualisation :** Chart.js
- **Styles :** CSS Modules avec Design Tokens
- **Suivi des erreurs :** Sentry (optionnel, via `VITE_SENTRY_DSN`)

### Partagé

- Types et interfaces TypeScript
- Constantes et énumérations
- Fonctions utilitaires

### Tests et qualité

- **Unitaires / Intégration :** Vitest
- **End-to-End :** Playwright (frontend) + Vitest (backend)
- **Tests de charge :** k6 (10 scénarios préconstruits)
- **Linting :** ESLint + Stylelint
- **Formatage :** Prettier
- **Git Hooks :** Husky + lint-staged

## 📁 Structure du projet

```
scrumooth/
├── packages/
│   ├── backend/              # API REST Express.js
│   │   ├── src/
│   │   │   ├── controllers/  # Gestionnaires de routes API
│   │   │   ├── services/     # Couche de logique métier
│   │   │   ├── middleware/   # Middleware Express
│   │   │   ├── routes/       # Définitions des routes API
│   │   │   ├── utils/        # Fonctions utilitaires
│   │   │   └── __tests__/    # Tests unitaires, intégration et e2e
│   │   ├── prisma/           # Schéma de base de données et migrations
│   │   ├── Dockerfile        # Image de production
│   │   └── Dockerfile.dev    # Image de développement
│   ├── frontend/             # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/   # Composants React
│   │   │   ├── pages/        # Pages au niveau des routes
│   │   │   ├── hooks/        # Hooks React personnalisés
│   │   │   ├── services/     # Services client API
│   │   │   ├── stores/       # Stores Zustand
│   │   │   └── styles/       # CSS et design tokens
│   │   ├── e2e/              # Tests end-to-end Playwright
│   │   ├── Dockerfile        # Image de production
│   │   └── Dockerfile.dev    # Image de développement
│   └── shared/               # Types, constantes et utilitaires partagés
├── docs/
│   ├── api/                  # Référence API REST
│   ├── architecture/         # Conception système, modèle de données, sécurité
│   ├── deployment/           # Guides de déploiement
│   └── user-guide/           # Documentation utilisateur et guides
├── k6/                       # Scénarios de tests de charge (k6)
│   └── scripts/scenarios/    # scénarios de tests de charge préconstruits
├── scripts/                  # Scripts de build et utilitaires
├── .github/workflows/        # CI, Release et déploiement GitHub Pages
├── docker-compose.yml        # Docker Compose de production
├── docker-compose.dev.yml    # Docker Compose de développement
├── CHANGELOG.md              # Historique des versions
├── SECURITY.md               # Politique de sécurité et signalement
└── THIRD-PARTY-NOTICES.md    # Attributions de licences tierces
```

## 📋 Prérequis

- **Node.js** v24.14.1 ou supérieur
- **pnpm** v11.5.0 ou supérieur
- **PostgreSQL** v18 ou supérieur
- **Git**

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
```

### 2. Installer les dépendances

Ce projet utilise pnpm comme gestionnaire de paquets. Le projet impose pnpm via des scripts de préinstallation.

```bash
pnpm install
```

### 3. Configuration de l'environnement

Copiez les fichiers d'environnement d'exemple et configurez vos paramètres :

```bash
# Configuration du backend
cp packages/backend/.env.example packages/backend/.env

# Configuration du frontend
cp packages/frontend/.env.example packages/frontend/.env
```

Modifiez les fichiers d'environnement avec votre configuration :

**Backend** (`packages/backend/.env`) :

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/scrumooth

# JWT Configuration (generate with: openssl rand -hex 64)
JWT_SECRET=your-64-character-secret-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`packages/frontend/.env`) :

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api/v1

# Use mock API (set to false for real backend)
VITE_USE_MOCK_API=false
```

### 4. Configuration de la base de données

Générez le client Prisma, puis créez votre schéma de base de données. Pour le développement local, vous pouvez utiliser l'une ou l'autre approche :

```bash
# Générer le client Prisma (toujours requis)
pnpm run db:generate

# Option A : Pousser le schéma directement (itération rapide, sans fichiers de migration)
pnpm run db:push

# Option B : Créer et appliquer une migration (recommandé pour des changements tracés)
pnpm run db:migrate
```

Pour les déploiements de production, utilisez `pnpm run db:migrate:prod` pour appliquer les migrations existantes sans invite interactive.

### 5. Démarrer le serveur de développement

```bash
pnpm run dev
```

Cela démarrera les serveurs backend et frontend simultanément. Pour les exécuter indépendamment :

```bash
pnpm run dev:backend    # Backend uniquement (http://localhost:5001)
pnpm run dev:frontend   # Frontend uniquement (http://localhost:5173)
```

## 🎯 Utilisation

### Développement

```bash
# Démarrer frontend et backend ensemble
pnpm run dev

# Démarrer en mode test (utilise NODE_ENV=test)
pnpm run dev:test

# Démarrer un seul côté
pnpm run dev:backend
pnpm run dev:frontend
```

### Build

```bash
# Construire tous les paquets
pnpm run build

# Nettoyer les artefacts de build
pnpm run clean

# Nettoyage complet incluant node_modules
pnpm run clean:all
```

## 🧪 Tests

### Exécuter les tests

```bash
# Exécuter tous les tests sur tous les paquets
pnpm run test

# Exécuter avec rapport de couverture
pnpm run test:coverage

# Exécuter uniquement les tests unitaires
pnpm run test:unit

# Exécuter les tests d'intégration (backend uniquement)
pnpm run test:integration

# Exécuter les tests end-to-end (Vitest backend + Playwright frontend)
pnpm run test:e2e

# Exécuter E2E pour un seul côté
pnpm run test:e2e:backend
pnpm run test:e2e:frontend

# Mode watch
pnpm run test:watch
```

Seuils de couverture imposés : **80 % lignes, fonctions, instructions** et **70 % branches**.

### Tests de charge (k6)

Dix scénarios de tests de charge préconstruits se trouvent dans [`k6/scripts/scenarios/`](k6/scripts/scenarios). Avant l'exécution, copiez [`k6/.env.k6.example`](k6/.env.k6.example) vers `k6/.env.k6` et configurez votre cible.

```bash
# Charge quotidienne réaliste
pnpm run loadtest:normal

# Rush de Sprint Planning (concurrence au pire cas)
pnpm run loadtest:peak

# Pousser le système jusqu'à la rupture
pnpm run loadtest:stress

# Simulation d'une journée de travail soutenue de 8 heures
pnpm run loadtest:endurance

# Autres scénarios
pnpm run loadtest:multi-team
pnpm run loadtest:daily-scrum
pnpm run loadtest:auth
pnpm run loadtest:db

# Générer des données seed pour les tests de charge
pnpm run loadtest:generate-data
```

> **Prérequis :** Installez [k6](https://k6.io/docs/get-started/installation/) et assurez-vous que votre backend cible est en cours d'exécution.

## 🔍 Qualité du code

### Linting

```bash
# Exécuter ESLint sur les fichiers TypeScript/JavaScript
pnpm run lint

# Corriger automatiquement les problèmes ESLint
pnpm run lint:fix

# Exécuter Stylelint sur les fichiers CSS
pnpm run lint:css

# Corriger automatiquement les problèmes Stylelint
pnpm run lint:css:fix
```

### Formatage

```bash
# Formater tous les fichiers sources avec Prettier
pnpm run format

# Vérifier le formatage sans écrire de modifications
pnpm run format:check

# Formatage spécifique au CSS
pnpm run format:css
pnpm run format:css:check
```

### Vérification des types

```bash
# Exécuter la vérification des types TypeScript sur tous les paquets
pnpm run typecheck
```

### Audit de sécurité

```bash
# Vérifier les dépendances installées pour les vulnérabilités connues
pnpm run audit

# Lister les dépendances obsolètes
pnpm run outdated
```

## 🗄 Gestion de la base de données

```bash
# Générer le client Prisma (après des changements de schéma)
pnpm run db:generate

# Pousser le schéma vers la base de données (développement, sans fichiers de migration)
pnpm run db:push

# Créer et appliquer une nouvelle migration (développement)
pnpm run db:migrate

# Appliquer les migrations en production (non interactif)
pnpm run db:migrate:prod

# Appliquer les migrations à la base de données de test
pnpm run db:migrate:test

# Ouvrir Prisma Studio (interface graphique de base de données)
pnpm run db:studio

# Réinitialiser la base de données (⚠️ détruit toutes les données)
pnpm run db:reset

# Valider le schéma Prisma
pnpm run db:validate
```

## 🐳 Support Docker

Le projet inclut une configuration Docker pour le déploiement en développement et en production.

### Utiliser Docker Compose

```bash
# Environnement de développement (avec rechargement à chaud)
docker compose -f docker-compose.dev.yml up

# Environnement de production (détaché)
docker compose up -d

# Démonter
docker compose down
```

### Construire les images Docker manuellement

```bash
# Images de production
docker build -t scrumooth-backend ./packages/backend
docker build -t scrumooth-frontend ./packages/frontend

# Images de développement (avec dépendances dev et mode watch)
docker build -f ./packages/backend/Dockerfile.dev -t scrumooth-backend:dev ./packages/backend
docker build -f ./packages/frontend/Dockerfile.dev -t scrumooth-frontend:dev ./packages/frontend
```

## ☁️ Déploiement

### Production auto-hébergée

Voir [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) pour le guide complet de déploiement en production, couvrant la configuration de l'environnement, la migration de base de données, la configuration du proxy inverse et les meilleures pratiques opérationnelles.

### Déploiement de la démo sur GitHub Pages

La branche `main` est automatiquement déployée sur GitHub Pages via le workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml). Le build Pages :

- Utilise une **Mock API** en mémoire (aucun backend ni base de données requis)

Démo en ligne : <https://orbivort.github.io/scrumooth/>

## 📚 Documentation

| Domaine                     | Emplacement                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Guide utilisateur**       | [`docs/user-guide/`](docs/user-guide) — prise en main, fonctionnalités principales, flux de travail Scrum                              |
| **Référence API REST**      | [`docs/api/`](docs/api) — 19 groupes d'endpoints (authentification, sprints, backlog, rapports, etc.)                                  |
| **Architecture système**    | [`docs/architecture/`](docs/architecture) — conception système, modèle de données, conception des composants, architecture de sécurité |
| **Guide de déploiement**    | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                                       |
| **Politique de sécurité**   | [`SECURITY.md`](SECURITY.md) — procédure de signalement de vulnérabilités                                                              |
| **Historique des releases** | [`CHANGELOG.md`](CHANGELOG.md)                                                                                                         |
| **Mentions tierces**        | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                                     |

## 🛟 Dépannage

### `Cannot find module @scrumooth/shared`

Le paquet partagé doit être construit avant que le backend/frontend puisse résoudre les imports.

```bash
pnpm --filter=@scrumooth/shared run build
```

Cela est normalement géré automatiquement par `pnpm install` et les scripts de développement, mais est nécessaire après un `pnpm run clean` manuel.

### `pnpm install` échoue avec « Use pnpm instead »

Le dépôt impose pnpm via un script `preinstall`. Installez pnpm globalement :

```bash
npm install -g pnpm@11.5.0
```

### Erreurs de connexion à la base de données au démarrage

Vérifiez que votre `DATABASE_URL` dans `packages/backend/.env` pointe vers une instance PostgreSQL 18+ en cours d'exécution et que la base de données existe. Exécutez `pnpm run db:validate` pour valider le schéma Prisma par rapport à la connexion.

### Port déjà utilisé (5001 ou 5173)

Les ports par défaut peuvent être surchargés via des variables d'environnement :

- Backend : `PORT` dans `packages/backend/.env`
- Frontend : `VITE_DEV_PORT` dans `packages/frontend/.env`

### Le frontend ne peut pas atteindre le backend

Vérifiez que `VITE_API_URL` dans `packages/frontend/.env` correspond à l'adresse réelle du backend et que `CORS_ORIGIN` dans `packages/backend/.env` autorise l'origine du frontend.

### Vous souhaitez développer sans backend ?

Définissez `VITE_USE_MOCK_API=true` dans `packages/frontend/.env` pour utiliser la même Mock API que celle qui alimente la démo en ligne.

## 📝 Licence

Ce projet est sous licence Apache License 2.0 — voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
Copyright 2026 Orbivort

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
