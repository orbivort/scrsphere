# Scrumooth

**Outil Scrum auto-hébergé, fidèle au Scrum Guide**

> **Langues :** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg)](https://codecov.io/github/orbivort/scrumooth)
[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791.svg)](https://www.postgresql.org/)

Scrumooth est un outil Scrum auto-hébergé qui implémente fidèlement le Scrum Guide. Conçu pour rester léger, il accompagne les équipes tout au long du cycle de vie Scrum — du Product Goal et du backlog jusqu'à la Sprint Review et à la rétrospective — sans la complexité des plateformes SaaS lourdes. Déployez-le sur votre propre infrastructure, gardez le contrôle de vos données et ne payez jamais par utilisateur.

<p align="center">
  <img src="docs/screenshots/scrumooth_fr.png" alt="Scrumooth" width="800" />
</p>

## Table des matières

- [Démo en ligne](#live-demo)
- [Fonctionnalités](#features)
- [Pile technologique](#tech-stack)
- [Démarrage rapide](#quick-start)
- [Prérequis](#prerequisites)
- [Installation](#installation)
- [Tests](#testing)
- [Qualité du code](#code-quality)
- [Gestion de la base de données](#database-management)
- [Prise en charge de Docker](#docker-support)
- [Déploiement](#deployment)
- [Documentation](#documentation)
- [Dépannage](#troubleshooting)
- [Feuille de route](#roadmap)
- [Contribuer](#contributing)
- [Licence](#license)

<a id="live-demo"></a>

## 🚀 Démo en ligne

Essayez Scrumooth instantanément dans votre navigateur — aucune installation requise. La démo s'exécute avec des données simulées (aucun backend nécessaire), ce qui vous permet d'explorer immédiatement l'ensemble du cycle de vie Scrum.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Lancer la démo en ligne sur GitHub Pages</strong>
  </a>
</p>

> **Remarque :** La démo utilise des données simulées en mémoire — toute modification que vous apportez reste locale à votre session de navigateur et est réinitialisée lors du rafraîchissement. Pour des données persistantes et une collaboration multi-utilisateurs, suivez le guide d'[Installation](#installation) afin d'auto-héberger votre propre instance.

<a id="features"></a>

## ✨ Fonctionnalités

### Fonctionnalités Scrum principales

- **Product Goal** — Alignement stratégique et suivi des objectifs
- **Product Backlog** — Priorisation MoSCoW (Must, Should, Could, Won't)
- **Sprint Planning** — Durées de sprint configurables et planification de la capacité
- **Exécution du Sprint** — Tableau Kanban interactif avec glisser-déposer
- **Daily Scrum** — Suivi et mise à jour du standup quotidien
- **Impediment** — Identification des blocages et suivi de leur résolution
- **Increment** — Gestion de l'incrément produit
- **Sprint Review** — Gestion et documentation de la réunion de revue
- **Sprint Retrospective** — Réflexion d'équipe et amélioration continue

### Fonctionnalités avancées

- **Tableau de bord et rapports** — Métriques et visualisations en temps réel
- **Moteur de workflow** — Autorisations basées sur les rôles et transitions d'état
- **Definition of Done/Ready** — Listes de contrôle personnalisables
- **Communication d'équipe** — Notifications et messagerie intégrées
- **Journalisation d'audit** — Suivi complet des actions

<a id="tech-stack"></a>

## 🛠 Pile technologique

### Backend

- **Runtime :** Node.js 24+
- **Framework :** Express.js 5
- **Langage :** TypeScript (mode strict)
- **Base de données :** PostgreSQL 18+ avec Prisma ORM 7
- **Authentification :** JWT avec bcrypt
- **Validation :** Zod
- **Tâches planifiées :** node-cron
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
│   │   │   └── __tests__/    # Tests unitaires, d'intégration et e2e
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
│   ├── api/                  # Référence de l'API REST
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
├── CONTRIBUTING.md           # Directives de contribution
├── CODE_OF_CONDUCT.md        # Code de conduite de la communauté
└── THIRD-PARTY-NOTICES.md    # Attributions de licences tierces
```

<a id="quick-start"></a>

## ⚡ Démarrage rapide

Le moyen le plus rapide d'exécuter une instance locale est d'utiliser Docker Compose :

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
cp packages/backend/.env.production.example packages/backend/.env.production
docker compose up -d
```

Cela démarre le proxy inverse Caddy, le backend, le frontend et PostgreSQL. Une fois en cours d'exécution, ouvrez <http://localhost> (HTTPS est activé par défaut sur le port 443). Pour une configuration manuelle complète (sans Docker), consultez [Installation](#installation).

> **Remarque :** Le stack Compose de production nécessite `packages/backend/.env.production`. Si vous préférez un environnement de développement entièrement préconfiguré avec rechargement à chaud, utilisez plutôt `docker compose -f docker-compose.dev.yml up`.

<a id="prerequisites"></a>

## 📋 Prérequis

- **Node.js** v24.19.0 ou supérieur
- **pnpm** v11.21.0 ou supérieur
- **PostgreSQL** v18 ou supérieur
- **Docker** et **Docker Compose** (optionnel, pour le démarrage rapide)

<a id="installation"></a>

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

# Facultatif : limitez l'inscription de nouveaux comptes à des domaines de messagerie spécifiques.
# Laissez vide ou non défini pour une inscription ouverte. Appliqué côté serveur (HTTP 403 pour les
# domaines non autorisés). Uniquement un contrôle au niveau du tenant, pas une vérification d'e-mail.
REGISTRATION_ALLOWED_EMAIL_DOMAINS=example.com,example.eu
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

# Option B : Créer et appliquer une migration (recommandé pour les changements suivis)
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

Les commandes les plus courantes pour le développement quotidien :

| Tâche                           | Commande                |
| ------------------------------- | ----------------------- |
| Démarrer backend + frontend     | `pnpm run dev`          |
| Démarrer uniquement le backend  | `pnpm run dev:backend`  |
| Démarrer uniquement le frontend | `pnpm run dev:frontend` |
| Construire tous les paquets     | `pnpm run build`        |

<a id="testing"></a>

## 🧪 Tests

```bash
pnpm run test              # Tous les tests
pnpm run test:coverage     # Avec rapport de couverture
pnpm run test:unit         # Tests unitaires uniquement
pnpm run test:integration  # Tests d'intégration du backend
pnpm run test:e2e          # End-to-end (backend Vitest + frontend Playwright)
pnpm run test:watch        # Mode watch
```

Seuils de couverture imposés : **80 % lignes, fonctions, instructions et branches**.

### Tests de charge (k6)

Les scénarios de tests de charge préconstruits se trouvent dans [`k6/scripts/scenarios/`](k6/scripts/scenarios). Copiez [`k6/.env.k6.example`](k6/.env.k6.example) vers `k6/.env.k6`, configurez votre cible, puis exécutez un scénario tel que :

```bash
pnpm run loadtest:normal    # Charge quotidienne réaliste
pnpm run loadtest:peak      # Affluence de Sprint Planning (concurrence dans le pire des cas)
pnpm run loadtest:stress    # Pousser le système jusqu'à la rupture
```

> **Prérequis :** Installez [k6](https://k6.io/docs/get-started/installation/) et assurez-vous que votre backend cible est en cours d'exécution. Des scénarios supplémentaires (endurance, multi-team, daily-scrum, auth, db) sont disponibles via les scripts `loadtest:*` dans [`package.json`](package.json).

<a id="code-quality"></a>

## 🔍 Qualité du code

| Tâche                          | Commande             |
| ------------------------------ | -------------------- |
| Lint (ESLint)                  | `pnpm run lint`      |
| Lint et correction automatique | `pnpm run lint:fix`  |
| Lint CSS (Stylelint)           | `pnpm run lint:css`  |
| Formatage (Prettier)           | `pnpm run format`    |
| Vérification des types         | `pnpm run typecheck` |
| Audit de sécurité              | `pnpm run audit`     |

Consultez [`CONTRIBUTING.md`](CONTRIBUTING.md) pour le flux de travail de développement complet et les contrôles qualité.

<a id="database-management"></a>

## 🗄 Gestion de la base de données

```bash
pnpm run db:generate     # Générer le client Prisma (après des changements de schéma)
pnpm run db:migrate      # Créer et appliquer une migration (développement)
pnpm run db:migrate:prod # Appliquer les migrations en production (non interactif)
pnpm run db:studio       # Ouvrir Prisma Studio (interface graphique de base de données)
```

Des commandes de base de données supplémentaires (`db:push`, `db:reset`, `db:validate`, `db:migrate:test`) sont documentées dans [`CONTRIBUTING.md`](CONTRIBUTING.md).

<a id="docker-support"></a>

## 🐳 Prise en charge de Docker

Le projet inclut une configuration Docker pour le développement et le déploiement en production.

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

> **Remarque :** Tous les Dockerfiles référencent des chemins relatifs à la racine du dépôt (fichiers du workspace monorepo tels que `package.json`, `pnpm-lock.yaml` et `packages/shared/`). Vous devez les construire depuis la **racine du dépôt** et utiliser `-f` pour pointer vers le Dockerfile — passer le répertoire du paquet comme contexte de build échouera.

```bash
# Images de développement (avec dépendances de développement et mode watch)
docker build -t scrumooth-backend:dev -f packages/backend/Dockerfile.dev .
docker build -t scrumooth-frontend:dev -f packages/frontend/Dockerfile.dev .

# Images de production (construire depuis la racine du dépôt)
docker build -t scrumooth-backend -f packages/backend/Dockerfile .
docker build -t scrumooth-frontend -f packages/frontend/Dockerfile .
```

<details>
<summary>Utiliser un miroir registry/apt</summary>

Si vous êtes derrière un réseau qui nécessite un registry npm ou un miroir apt, vous pouvez les définir comme arguments de build ou variables d'environnement :

```bash
# Docker Compose
$env:NPM_REGISTRY="https://your_mirror_url"
$env:APT_MIRROR="your_mirror_url"

# Build manuel
docker build --build-arg NPM_REGISTRY=https://your_mirror_url --build-arg APT_MIRROR=your_mirror_url .
```

</details>

<a id="deployment"></a>

## ☁️ Déploiement

### Production auto-hébergée

Consultez [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) pour un guide complet de déploiement en production, couvrant la configuration de l'environnement, la migration de la base de données, la configuration du proxy inverse et les bonnes pratiques opérationnelles.

### Déploiement de la démo sur GitHub Pages

La branche `main` est automatiquement déployée sur GitHub Pages via le workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml), en utilisant une **Mock API** en mémoire (aucun backend ni base de données requis). Consultez la [Démo en ligne](#live-demo) ci-dessus pour l'essayer.

<a id="documentation"></a>

## 📚 Documentation

| Domaine                     | Emplacement                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Guide utilisateur**       | [`docs/user-guide/`](docs/user-guide) — prise en main, fonctionnalités principales, flux de travail Scrum                              |
| **Référence API REST**      | [`docs/api/`](docs/api) — groupes d'endpoints couvrant l'authentification, les sprints, le backlog, les rapports et plus               |
| **Architecture système**    | [`docs/architecture/`](docs/architecture) — conception système, modèle de données, conception des composants, architecture de sécurité |
| **Guide de déploiement**    | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                                       |
| **Politique de sécurité**   | [`SECURITY.md`](SECURITY.md) — procédure de signalement des vulnérabilités                                                             |
| **Contribuer**              | [`CONTRIBUTING.md`](CONTRIBUTING.md) — directives et flux de travail de développement                                                  |
| **Code de conduite**        | [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — normes de la communauté                                                                   |
| **Historique des releases** | [`CHANGELOG.md`](CHANGELOG.md)                                                                                                         |
| **Mentions tierces**        | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                                     |

<a id="troubleshooting"></a>

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
npm install -g pnpm@11.21.0
```

### Erreurs de connexion à la base de données au démarrage

Vérifiez que votre `DATABASE_URL` dans `packages/backend/.env` pointe vers une instance PostgreSQL 18+ en cours d'exécution et que la base de données existe. Exécutez `pnpm run db:validate` pour valider le schéma Prisma par rapport à la connexion.

### Port déjà utilisé (5001 ou 5173)

Les ports par défaut peuvent être remplacés via des variables d'environnement :

- Backend : `PORT` dans `packages/backend/.env`
- Frontend : `VITE_DEV_PORT` dans `packages/frontend/.env`

### Le frontend ne peut pas atteindre le backend

Vérifiez que `VITE_API_URL` dans `packages/frontend/.env` correspond à l'adresse réelle du backend et que `CORS_ORIGIN` dans `packages/backend/.env` autorise l'origine du frontend.

### Vous souhaitez développer sans backend ?

Définissez `VITE_USE_MOCK_API=true` dans `packages/frontend/.env` pour utiliser la même Mock API que celle qui alimente la démo en ligne.

<a id="roadmap"></a>

## 🗺 Feuille de route

Scrumooth est en développement actif. Les priorités à venir incluent :

- [ ] Tableaux de bord de reporting et d'analyse améliorés
- [ ] Intégrations et webhooks supplémentaires
- [ ] Renforcement des performances et de l'évolutivité

L'état du projet et les dernières modifications sont suivis dans le [CHANGELOG](CHANGELOG.md). Les retours et les demandes de fonctionnalités sont les bienvenus via [GitHub Issues](https://github.com/orbivort/scrumooth/issues).

<a id="contributing"></a>

## 🤝 Contribuer

Les contributions sont les bienvenues ! Veuillez lire [`CONTRIBUTING.md`](CONTRIBUTING.md) pour le flux de travail de développement, les normes de code et le processus de pull request, et consultez le [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) avant de participer.

<a id="license"></a>

## 📝 Licence

Ce projet est sous licence [Apache License 2.0](LICENSE).
