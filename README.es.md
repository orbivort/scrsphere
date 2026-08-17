# Scrumooth

**Herramienta de Scrum autohospedada, fiel a la Scrum Guide**

> **Idiomas:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg)](https://codecov.io/github/orbivort/scrumooth)
[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791.svg)](https://www.postgresql.org/)

Scrumooth es una herramienta de Scrum autohospedada que implementa fielmente la Scrum Guide. Ligera por diseño, guía a los equipos a lo largo de todo el ciclo de vida de Scrum — desde el Product Goal y el backlog hasta la Sprint Review y la retrospectiva — sin la complejidad de las plataformas SaaS pesadas. Despliéguela en su propia infraestructura, mantenga sus datos bajo su control y no pague nunca por usuario.

## Tabla de contenidos

- [Demo en vivo](#live-demo)
- [Características](#features)
- [Stack tecnológico](#tech-stack)
- [Inicio rápido](#quick-start)
- [Requisitos previos](#prerequisites)
- [Instalación](#installation)
- [Pruebas](#testing)
- [Calidad del código](#code-quality)
- [Gestión de la base de datos](#database-management)
- [Soporte de Docker](#docker-support)
- [Despliegue](#deployment)
- [Documentación](#documentation)
- [Solución de problemas](#troubleshooting)
- [Hoja de ruta](#roadmap)
- [Contribuciones](#contributing)
- [Licencia](#license)

<a id="live-demo"></a>

## 🚀 Demo en vivo

Pruebe Scrumooth al instante en su navegador, sin necesidad de instalación. La demo se ejecuta con datos simulados (no requiere backend), de modo que puede explorar el ciclo de vida completo de Scrum de inmediato.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Abrir la demo en vivo en GitHub Pages</strong>
  </a>
</p>

> **Nota:** La demo utiliza datos simulados en memoria — cualquier cambio que realice es local a su sesión del navegador y se restablece al recargar la página. Para datos persistentes y colaboración multiusuario, siga la guía de [Instalación](#installation) para autohospedar su propia instancia.

<a id="features"></a>

## ✨ Características

### Características principales de Scrum

- **Product Goal** - Alineación estratégica y seguimiento de objetivos
- **Product Backlog** - Priorización MoSCoW (Must, Should, Could, Won't)
- **Sprint Planning** - Duraciones de sprint configurables y planificación de capacidad
- **Ejecución del Sprint** - Tablero Kanban interactivo con arrastrar y soltar
- **Daily Scrum** - Seguimiento y actualizaciones de la reunión diaria
- **Impediment** - Identificación de bloqueos y seguimiento de su resolución
- **Increment** - Gestión del incremento de producto
- **Sprint Review** - Gestión y documentación de la reunión de revisión
- **Sprint Retrospective** - Reflexión del equipo y mejora continua

### Características avanzadas

- **Panel e informes** - Métricas y visualizaciones en tiempo real
- **Motor de flujo de trabajo** - Permisos basados en roles y transiciones de estado
- **Definition of Done/Ready** - Listas de verificación personalizables
- **Comunicación del equipo** - Notificaciones y mensajería integradas
- **Registro de auditoría** - Seguimiento exhaustivo de acciones

<a id="tech-stack"></a>

## 🛠 Stack tecnológico

### Backend

- **Runtime:** Node.js 24+
- **Framework:** Express.js 5
- **Lenguaje:** TypeScript (modo estricto)
- **Base de datos:** PostgreSQL 18+ con Prisma ORM 7
- **Autenticación:** JWT con bcrypt
- **Validación:** Zod
- **Trabajos programados:** node-cron
- **Correo electrónico:** Nodemailer (proveedores SMTP, SendGrid, AWS SES)
- **Registro:** Winston con transports de archivos rotativos

### Frontend

- **Framework:** React 19 con Vite
- **Lenguaje:** TypeScript (modo estricto)
- **Enrutamiento:** React Router 6
- **Gestión de estado:** TanStack Query (React Query) + Zustand
- **Visualización:** Chart.js
- **Estilos:** CSS Modules con Design Tokens
- **Seguimiento de errores:** Sentry (opcional, vía `VITE_SENTRY_DSN`)

### Compartido

- Tipos e interfaces de TypeScript
- Constantes y enumeraciones
- Funciones de utilidad

### Pruebas y calidad

- **Unitarias / Integración:** Vitest
- **End-to-End:** Playwright (frontend) + Vitest (backend)
- **Pruebas de carga:** k6 (10 escenarios predefinidos)
- **Linting:** ESLint + Stylelint
- **Formato:** Prettier
- **Git Hooks:** Husky + lint-staged

## 📁 Estructura del proyecto

```
scrumooth/
├── packages/
│   ├── backend/              # API REST Express.js
│   │   ├── src/
│   │   │   ├── controllers/  # Manejadores de rutas API
│   │   │   ├── services/     # Capa de lógica de negocio
│   │   │   ├── middleware/   # Middleware de Express
│   │   │   ├── routes/       # Definiciones de rutas API
│   │   │   ├── utils/        # Funciones de utilidad
│   │   │   └── __tests__/    # Pruebas unitarias, de integración y e2e
│   │   ├── prisma/           # Esquema de base de datos y migraciones
│   │   ├── Dockerfile        # Imagen de producción
│   │   └── Dockerfile.dev    # Imagen de desarrollo
│   ├── frontend/             # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/   # Componentes React
│   │   │   ├── pages/        # Páginas a nivel de ruta
│   │   │   ├── hooks/        # Hooks de React personalizados
│   │   │   ├── services/     # Servicios de cliente API
│   │   │   ├── stores/       # Stores de Zustand
│   │   │   └── styles/       # CSS y design tokens
│   │   ├── e2e/              # Pruebas end-to-end de Playwright
│   │   ├── Dockerfile        # Imagen de producción
│   │   └── Dockerfile.dev    # Imagen de desarrollo
│   └── shared/               # Tipos, constantes y utilidades compartidas
├── docs/
│   ├── api/                  # Referencia de la API REST
│   ├── architecture/         # Diseño del sistema, modelo de datos, seguridad
│   ├── deployment/           # Guías de despliegue
│   └── user-guide/           # Documentación y guías de usuario
├── k6/                       # Escenarios de pruebas de carga (k6)
│   └── scripts/scenarios/    # escenarios de pruebas de carga predefinidos
├── scripts/                  # Scripts de build y utilidades
├── .github/workflows/        # CI, Release y despliegue en GitHub Pages
├── docker-compose.yml        # Docker Compose de producción
├── docker-compose.dev.yml    # Docker Compose de desarrollo
├── CHANGELOG.md              # Historial de versiones
├── SECURITY.md               # Política de seguridad y reportes
├── CONTRIBUTING.md           # Directrices de contribución
├── CODE_OF_CONDUCT.md        # Código de conducta de la comunidad
└── THIRD-PARTY-NOTICES.md    # Atribuciones de licencias de terceros
```

<a id="quick-start"></a>

## ⚡ Inicio rápido

La forma más rápida de ejecutar una instancia local es con Docker Compose:

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
cp packages/backend/.env.production.example packages/backend/.env.production
docker compose up -d
```

Esto inicia el proxy inverso Caddy, el backend, el frontend y PostgreSQL. Una vez en ejecución, abra <http://localhost> (HTTPS está habilitado por defecto en el puerto 443). Para una configuración manual completa (sin Docker), consulte [Instalación](#installation).

> **Nota:** El stack de Compose de producción requiere `packages/backend/.env.production`. Si prefiere un entorno de desarrollo completamente preconfigurado con recarga en caliente, utilice `docker compose -f docker-compose.dev.yml up` en su lugar.

<a id="prerequisites"></a>

## 📋 Requisitos previos

- **Node.js** v24.19.0 o superior
- **pnpm** v11.21.0 o superior
- **PostgreSQL** v18 o superior
- **Docker** y **Docker Compose** (opcional, para el inicio rápido)

<a id="installation"></a>

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
```

### 2. Instalar dependencias

Este proyecto utiliza pnpm como gestor de paquetes. El proyecto exige pnpm mediante scripts de preinstalación.

```bash
pnpm install
```

### 3. Configuración del entorno

Copie los archivos de entorno de ejemplo y configure sus ajustes:

```bash
# Configuración del backend
cp packages/backend/.env.example packages/backend/.env

# Configuración del frontend
cp packages/frontend/.env.example packages/frontend/.env
```

Edite los archivos de entorno con su configuración:

**Backend** (`packages/backend/.env`):

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/scrumooth

# JWT Configuration (generate with: openssl rand -hex 64)
JWT_SECRET=your-64-character-secret-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Opcional: restrinja el registro de nuevas cuentas a dominios de correo específicos.
# Déjelo vacío o sin definir para permitir el registro abierto. Se aplica en el servidor (HTTP 403 para
# dominios no permitidos). Solo es una puerta de control del tenant, no verificación de correo electrónico.
REGISTRATION_ALLOWED_EMAIL_DOMAINS=example.com,example.eu
```

**Frontend** (`packages/frontend/.env`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api/v1

# Use mock API (set to false for real backend)
VITE_USE_MOCK_API=false
```

### 4. Configuración de la base de datos

Genere el cliente de Prisma y luego cree el esquema de su base de datos. Para el desarrollo local puede utilizar cualquiera de los dos enfoques:

```bash
# Generar el cliente Prisma (siempre requerido)
pnpm run db:generate

# Opción A: Hacer push del esquema directamente (iteración rápida, sin archivos de migración)
pnpm run db:push

# Opción B: Crear y aplicar una migración (recomendado para cambios rastreados)
pnpm run db:migrate
```

Para despliegues en producción, utilice `pnpm run db:migrate:prod` para aplicar las migraciones existentes sin solicitudes interactivas.

### 5. Iniciar el servidor de desarrollo

```bash
pnpm run dev
```

Esto iniciará los servidores de backend y frontend de forma simultánea. Para ejecutarlos de forma independiente:

```bash
pnpm run dev:backend    # Solo backend (http://localhost:5001)
pnpm run dev:frontend   # Solo frontend (http://localhost:5173)
```

## 🎯 Uso

Los comandos más comunes para el desarrollo diario:

| Tarea                        | Comando                 |
| ---------------------------- | ----------------------- |
| Iniciar backend + frontend   | `pnpm run dev`          |
| Iniciar solo backend         | `pnpm run dev:backend`  |
| Iniciar solo frontend        | `pnpm run dev:frontend` |
| Construir todos los paquetes | `pnpm run build`        |

<a id="testing"></a>

## 🧪 Pruebas

```bash
pnpm run test              # Todas las pruebas
pnpm run test:coverage     # Con informe de cobertura
pnpm run test:unit         # Solo pruebas unitarias
pnpm run test:integration  # Pruebas de integración del backend
pnpm run test:e2e          # End-to-end (backend Vitest + frontend Playwright)
pnpm run test:watch        # Modo watch
```

Umbrales de cobertura aplicados: **80 % líneas, funciones, sentencias y ramas**.

### Pruebas de carga (k6)

Los escenarios de pruebas de carga predefinidos se encuentran en [`k6/scripts/scenarios/`](k6/scripts/scenarios). Copie [`k6/.env.k6.example`](k6/.env.k6.example) a `k6/.env.k6`, configure su destino y, a continuación, ejecute un escenario como:

```bash
pnpm run loadtest:normal    # Carga diaria realista
pnpm run loadtest:peak      # Pico de Sprint Planning (concurrencia en el peor de los casos)
pnpm run loadtest:stress    # Llevar el sistema hasta que se rompa
```

> **Requisito previo:** Instale [k6](https://k6.io/docs/get-started/installation/) y asegúrese de que su backend de destino esté en ejecución. Escenarios adicionales (endurance, multi-team, daily-scrum, auth, db) están disponibles mediante los scripts `loadtest:*` en [`package.json`](package.json).

<a id="code-quality"></a>

## 🔍 Calidad del código

| Tarea                  | Comando              |
| ---------------------- | -------------------- |
| Lint (ESLint)          | `pnpm run lint`      |
| Lint y autocorrección  | `pnpm run lint:fix`  |
| Lint CSS (Stylelint)   | `pnpm run lint:css`  |
| Formato (Prettier)     | `pnpm run format`    |
| Verificación de tipos  | `pnpm run typecheck` |
| Auditoría de seguridad | `pnpm run audit`     |

Consulte [`CONTRIBUTING.md`](CONTRIBUTING.md) para conocer el flujo de trabajo de desarrollo completo y los controles de calidad.

<a id="database-management"></a>

## 🗄 Gestión de la base de datos

```bash
pnpm run db:generate     # Generar el cliente Prisma (tras cambios de esquema)
pnpm run db:migrate      # Crear y aplicar una migración (desarrollo)
pnpm run db:migrate:prod # Aplicar migraciones en producción (no interactivo)
pnpm run db:studio       # Abrir Prisma Studio (GUI de base de datos)
```

Comandos de base de datos adicionales (`db:push`, `db:reset`, `db:validate`, `db:migrate:test`) están documentados en [`CONTRIBUTING.md`](CONTRIBUTING.md).

<a id="docker-support"></a>

## 🐳 Soporte de Docker

El proyecto incluye configuración de Docker tanto para desarrollo como para despliegue en producción.

### Usar Docker Compose

```bash
# Entorno de desarrollo (con recarga en caliente)
docker compose -f docker-compose.dev.yml up

# Entorno de producción (detached)
docker compose up -d

# Desmontar
docker compose down
```

### Construir imágenes Docker manualmente

> **Nota:** Todos los Dockerfiles referencian rutas relativas a la raíz del repositorio (archivos del workspace del monorepo como `package.json`, `pnpm-lock.yaml` y `packages/shared/`). Debe construirlos desde la **raíz del repositorio** y usar `-f` para apuntar al Dockerfile — pasar el directorio del paquete como contexto de build fallará.

```bash
# Imágenes de desarrollo (con dependencias de desarrollo y modo watch)
docker build -t scrumooth-backend:dev -f packages/backend/Dockerfile.dev .
docker build -t scrumooth-frontend:dev -f packages/frontend/Dockerfile.dev .

# Imágenes de producción (construir desde la raíz del repositorio)
docker build -t scrumooth-backend -f packages/backend/Dockerfile .
docker build -t scrumooth-frontend -f packages/frontend/Dockerfile .
```

<details>
<summary>Usar un mirror de registry/apt</summary>

Si se encuentra detrás de una red que requiere un registry de npm o un mirror de apt, puede configurarlos como argumentos de build o variables de entorno:

```bash
# Docker Compose
$env:NPM_REGISTRY="https://your_mirror_url"
$env:APT_MIRROR="your_mirror_url"

# Build manual
docker build --build-arg NPM_REGISTRY=https://your_mirror_url --build-arg APT_MIRROR=your_mirror_url .
```

</details>

<a id="deployment"></a>

## ☁️ Despliegue

### Producción autohospedada

Consulte [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) para obtener una guía completa de despliegue en producción, que cubre la configuración del entorno, la migración de la base de datos, la configuración del proxy inverso y las buenas prácticas operativas.

### Despliegue de la demo en GitHub Pages

La rama `main` se despliega automáticamente en GitHub Pages mediante el workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml), utilizando una **Mock API** en memoria (no requiere backend ni base de datos). Consulte la [Demo en vivo](#live-demo) más arriba para probarla.

<a id="documentation"></a>

## 📚 Documentación

| Área                          | Ubicación                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Guía de usuario**           | [`docs/user-guide/`](docs/user-guide) — primeros pasos, características principales, flujos de trabajo Scrum                      |
| **Referencia de la API REST** | [`docs/api/`](docs/api) — grupos de endpoints que cubren autenticación, sprints, backlog, informes y más                          |
| **Arquitectura del sistema**  | [`docs/architecture/`](docs/architecture) — diseño del sistema, modelo de datos, diseño de componentes, arquitectura de seguridad |
| **Guía de despliegue**        | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                                  |
| **Política de seguridad**     | [`SECURITY.md`](SECURITY.md) — procedimiento de reporte de vulnerabilidades                                                       |
| **Contribuciones**            | [`CONTRIBUTING.md`](CONTRIBUTING.md) — directrices y flujo de trabajo de desarrollo                                               |
| **Código de conducta**        | [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — normas de la comunidad                                                               |
| **Historial de releases**     | [`CHANGELOG.md`](CHANGELOG.md)                                                                                                    |
| **Avisos de terceros**        | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                                |

<a id="troubleshooting"></a>

## 🛟 Solución de problemas

### `Cannot find module @scrumooth/shared`

El paquete compartido debe compilarse antes de que el backend o frontend puedan resolver las importaciones.

```bash
pnpm --filter=@scrumooth/shared run build
```

Esto normalmente se gestiona automáticamente mediante `pnpm install` y los scripts de desarrollo, pero es necesario tras un `pnpm run clean` manual.

### `pnpm install` falla con "Use pnpm instead"

El repositorio exige pnpm mediante un script `preinstall`. Instale pnpm globalmente:

```bash
npm install -g pnpm@11.21.0
```

### Errores de conexión a la base de datos al iniciar

Verifique que su `DATABASE_URL` en `packages/backend/.env` apunte a una instancia de PostgreSQL 18+ en ejecución y que la base de datos exista. Ejecute `pnpm run db:validate` para validar el esquema de Prisma contra la conexión.

### Puerto ya en uso (5001 o 5173)

Los puertos predeterminados se pueden sobrescribir mediante variables de entorno:

- Backend: `PORT` en `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` en `packages/frontend/.env`

### El frontend no puede alcanzar el backend

Compruebe que `VITE_API_URL` en `packages/frontend/.env` coincida con la dirección real del backend y que `CORS_ORIGIN` en `packages/backend/.env` permita el origen del frontend.

### ¿Quiere desarrollar sin un backend?

Establezca `VITE_USE_MOCK_API=true` en `packages/frontend/.env` para usar la misma Mock API que impulsa la demo en vivo.

<a id="roadmap"></a>

## 🗺 Hoja de ruta

Scrumooth está en desarrollo activo. Las próximas prioridades incluyen:

- [ ] Paneles de informes y analíticas mejorados
- [ ] Integraciones y webhooks adicionales
- [ ] Refuerzo del rendimiento y la escalabilidad

El estado del proyecto y los últimos cambios se registran en el [CHANGELOG](CHANGELOG.md). Los comentarios y las solicitudes de funciones son bienvenidos a través de [GitHub Issues](https://github.com/orbivort/scrumooth/issues).

<a id="contributing"></a>

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Lea [`CONTRIBUTING.md`](CONTRIBUTING.md) para conocer el flujo de trabajo de desarrollo, los estándares de código y el proceso de pull request, y revise el [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) antes de participar.

<a id="license"></a>

## 📝 Licencia

Este proyecto está licenciado bajo la [Apache License 2.0](LICENSE).
