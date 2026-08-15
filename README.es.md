# Scrumooth

**Sistema ágil de gestión del ciclo de vida de Scrum**

> **Idiomas:** [English](README.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [Italiano](README.it.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

[![CI](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml/badge.svg)](https://github.com/orbivort/scrumooth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/orbivort/scrumooth/graph/badge.svg?token=Z2T4R3G8F7)](https://codecov.io/github/orbivort/scrumooth)
[![Known Vulnerabilities](https://snyk.io/test/github/orbivort/scrumooth/badge.svg)](https://snyk.io/test/github/orbivort/scrumooth)

[![GitHub release](https://img.shields.io/github/v/release/orbivort/scrumooth?include_prereleases)](https://github.com/orbivort/scrumooth/releases)
[![GitHub issues](https://img.shields.io/github/issues/orbivort/scrumooth)](https://github.com/orbivort/scrumooth/issues)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24+-green.svg)](https://nodejs.org/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-GitHub_Pages-success?style=for-the-badge)](https://orbivort.github.io/scrumooth/)

Scrumooth es una aplicación web autohospedada para gestionar procesos ágiles de Scrum, construida para seguir fielmente la Guía de Scrum con tecnologías modernas y rigurosos estándares de calidad. Proporciona una solución completa que guía a los equipos a través de todo el ciclo de vida de Scrum — desde los Product Goals y backlogs hasta las Sprint Reviews y Sprint Retrospectives — todo desplegable en su propia infraestructura sin coste por usuario.

## 🚀 Demo en vivo

Pruebe Scrumooth al instante en su navegador — sin necesidad de instalación. La demo se ejecuta con datos simulados (no se necesita backend), por lo que puede explorar el ciclo de vida completo de Scrum de inmediato.

<p align="center">
  <a href="https://orbivort.github.io/scrumooth/" target="_blank" rel="noopener noreferrer">
    <strong>👉 Abrir la demo en vivo en GitHub Pages</strong>
  </a>
</p>

> **Nota:** La demo utiliza datos simulados en memoria — cualquier cambio que realice permanece únicamente en su sesión del navegador y se pierde al actualizar. Para datos persistentes y colaboración multiusuario, siga la guía de [Instalación](#-instalación) para autohospedar su propia instancia.

## ✨ Características

### Funcionalidades principales de Scrum

- **Product Goals** — Alineación estratégica y seguimiento de objetivos
- **Product Backlog** — Priorización MoSCoW (Must, Should, Could, Won't)
- **Sprint Planning** — Duraciones de Sprint configurables y planificación de capacidad
- **Sprint Execution** — Tablero Kanban interactivo con arrastrar y soltar
- **Daily Scrum** — Seguimiento del standup diario y actualizaciones
- **Impediments** — Identificación de bloqueadores y seguimiento de resolución
- **Incremental Delivery** — Gestión de Increments de producto
- **Sprint Reviews** — Gestión y documentación de reuniones de revisión
- **Sprint Retrospectives** — Reflexión del equipo y mejora continua

### Funcionalidades avanzadas

- **Dashboard e informes** — Métricas y visualizaciones en tiempo real
- **Motor de flujo de trabajo** — Permisos basados en roles y transiciones de estado
- **Definition of Done/Ready** — Listas de verificación personalizables
- **Comunicación del equipo** — Notificaciones y mensajería integradas
- **Registro de auditoría** — Seguimiento exhaustivo de acciones

## 🛠 Stack tecnológico

### Backend

- **Runtime:** Node.js 24+
- **Framework:** Express.js 5
- **Lenguaje:** TypeScript (modo estricto)
- **Base de datos:** PostgreSQL 18+ con Prisma ORM 7
- **Autenticación:** JWT con bcrypt
- **Validación:** Zod
- **Jobs programados:** node-cron
- **Correo electrónico:** Nodemailer (proveedores SMTP, SendGrid, AWS SES)
- **Registro:** Winston con archivos de registro rotativos

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
- Funciones utilitarias

### Pruebas y calidad

- **Unitarias/Integración:** Vitest
- **End-to-End:** Playwright (frontend) + Vitest (backend)
- **Pruebas de carga:** k6 (10 escenarios predefinidos)
- **Linting:** ESLint + Stylelint
- **Formateo:** Prettier
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
│   │   │   ├── utils/        # Funciones utilitarias
│   │   │   └── __tests__/    # Pruebas unitarias, integración y e2e
│   │   ├── prisma/           # Esquema y migraciones de base de datos
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
│   ├── api/                  # Referencia API REST
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
└── THIRD-PARTY-NOTICES.md    # Atribuciones de licencias de terceros
```

## 📋 Requisitos previos

- **Node.js** v24.14.1 o superior
- **pnpm** v11.5.0 o superior
- **PostgreSQL** v18 o superior
- **Git**

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/orbivort/scrumooth.git
cd scrumooth
```

### 2. Instalar dependencias

Este proyecto utiliza pnpm como gestor de paquetes. El proyecto exige el uso de pnpm mediante scripts de preinstalación.

```bash
pnpm install
```

### 3. Configuración del entorno

Copie los archivos de entorno de ejemplo y configure los parámetros:

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
```

**Frontend** (`packages/frontend/.env`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5001/api/v1

# Use mock API (set to false for real backend)
VITE_USE_MOCK_API=false
```

### 4. Configuración de la base de datos

Genere el cliente de Prisma y luego cree el esquema de la base de datos. Para desarrollo local puede usar cualquiera de los dos enfoques:

```bash
# Generar cliente Prisma (siempre requerido)
pnpm run db:generate

# Opción A: Push directo del esquema (iteración rápida, sin archivos de migración)
pnpm run db:push

# Opción B: Crear y aplicar una migración (recomendado para cambios rastreados)
pnpm run db:migrate
```

Para despliegues en producción, use `pnpm run db:migrate:prod` para aplicar migraciones existentes sin prompts interactivos.

### 5. Iniciar el servidor de desarrollo

```bash
pnpm run dev
```

Esto iniciará los servidores backend y frontend de forma concurrente. Para ejecutarlos de forma independiente:

```bash
pnpm run dev:backend    # Solo backend (http://localhost:5001)
pnpm run dev:frontend   # Solo frontend (http://localhost:5173)
```

## 🎯 Uso

### Desarrollo

```bash
# Iniciar frontend y backend juntos
pnpm run dev

# Iniciar en modo test (usa NODE_ENV=test)
pnpm run dev:test

# Iniciar solo un lado
pnpm run dev:backend
pnpm run dev:frontend
```

### Build

```bash
# Construir todos los paquetes
pnpm run build

# Limpiar artefactos de build
pnpm run clean

# Limpieza completa incluyendo node_modules
pnpm run clean:all
```

## 🧪 Pruebas

### Ejecutar pruebas

```bash
# Ejecutar todas las pruebas en todos los paquetes
pnpm run test

# Ejecutar con informe de cobertura
pnpm run test:coverage

# Ejecutar solo pruebas unitarias
pnpm run test:unit

# Ejecutar pruebas de integración (solo backend)
pnpm run test:integration

# Ejecutar pruebas end-to-end (Vitest backend + Playwright frontend)
pnpm run test:e2e

# Ejecutar E2E para un solo lado
pnpm run test:e2e:backend
pnpm run test:e2e:frontend

# Modo watch
pnpm run test:watch
```

Umbrales de cobertura obligatorios: **80% líneas, funciones, sentencias** y **70% ramas**.

### Pruebas de carga (k6)

Diez escenarios de pruebas de carga predefinidos se encuentran en [`k6/scripts/scenarios/`](k6/scripts/scenarios). Antes de ejecutar, copie [`k6/.env.k6.example`](k6/.env.k6.example) a `k6/.env.k6` y configure su destino.

```bash
# Carga cotidiana realista
pnpm run loadtest:normal

# Pico de Sprint Planning (concurrencia en el peor caso)
pnpm run loadtest:peak

# Llevar el sistema hasta el punto de ruptura
pnpm run loadtest:stress

# Simulación de jornada laboral sostenida de 8 horas
pnpm run loadtest:endurance

# Otros escenarios
pnpm run loadtest:multi-team
pnpm run loadtest:daily-scrum
pnpm run loadtest:auth
pnpm run loadtest:db

# Generar datos seed para pruebas de carga
pnpm run loadtest:generate-data
```

> **Requisito previo:** Instale [k6](https://k6.io/docs/get-started/installation/) y asegúrese de que su backend objetivo esté en ejecución.

## 🔍 Calidad del código

### Linting

```bash
# Ejecutar ESLint en archivos TypeScript/JavaScript
pnpm run lint

# Autocorregir problemas de ESLint
pnpm run lint:fix

# Ejecutar Stylelint en archivos CSS
pnpm run lint:css

# Autocorregir problemas de Stylelint
pnpm run lint:css:fix
```

### Formateo

```bash
# Formatear todos los archivos fuente con Prettier
pnpm run format

# Verificar el formato sin aplicar cambios
pnpm run format:check

# Formateo específico de CSS
pnpm run format:css
pnpm run format:css:check
```

### Verificación de tipos

```bash
# Ejecutar verificación de tipos TypeScript en todos los paquetes
pnpm run typecheck
```

### Auditoría de seguridad

```bash
# Comprobar dependencias instaladas en busca de vulnerabilidades conocidas
pnpm run audit

# Listar dependencias desactualizadas
pnpm run outdated
```

## 🗄 Gestión de la base de datos

```bash
# Generar cliente Prisma (tras cambios de esquema)
pnpm run db:generate

# Push del esquema a la base de datos (desarrollo, sin archivos de migración)
pnpm run db:push

# Crear y aplicar una nueva migración (desarrollo)
pnpm run db:migrate

# Aplicar migraciones en producción (no interactivo)
pnpm run db:migrate:prod

# Aplicar migraciones a la base de datos de test
pnpm run db:migrate:test

# Abrir Prisma Studio (GUI de base de datos)
pnpm run db:studio

# Restablecer la base de datos (⚠️ destruye todos los datos)
pnpm run db:reset

# Validar el esquema de Prisma
pnpm run db:validate
```

## 🐳 Soporte Docker

El proyecto incluye configuración Docker tanto para despliegue de desarrollo como de producción.

### Usar Docker Compose

```bash
# Entorno de desarrollo (con hot reload)
docker compose -f docker-compose.dev.yml up

# Entorno de producción (detached)
docker compose up -d

# Detener y eliminar
docker compose down
```

### Construir imágenes Docker manualmente

```bash
# Imágenes de desarrollo (con dependencias dev y modo watch)
docker build -t scrumooth-backend:dev -f packages/backend/Dockerfile.dev .
docker build -t scrumooth-frontend:dev -f packages/frontend/Dockerfile.dev .

# Imágenes de producción
docker build -t scrumooth-backend -f packages/backend/Dockerfile .
docker build -t scrumooth-frontend -f packages/frontend/Dockerfile .
```

## ☁️ Despliegue

### Producción autohospedada

Consulte [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md) para la guía completa de despliegue en producción, que cubre configuración de entorno, migración de base de datos, configuración de proxy inverso y buenas prácticas operativas.

### Despliegue de demo en GitHub Pages

La rama `main` se despliega automáticamente a GitHub Pages mediante el workflow [`Deploy to GitHub Pages`](.github/workflows/deploy-github-pages.yml). El build de Pages:

- Usa una **Mock API** en memoria (no requiere backend ni base de datos)

Demo en vivo: <https://orbivort.github.io/scrumooth/>

## 📚 Documentación

| Área                         | Ubicación                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Guía de usuario**          | [`docs/user-guide/`](docs/user-guide) — primeros pasos, características principales, flujos de trabajo Scrum                      |
| **Referencia API REST**      | [`docs/api/`](docs/api) — 19 grupos de endpoints (autenticación, sprints, backlog, informes, etc.)                                |
| **Arquitectura del sistema** | [`docs/architecture/`](docs/architecture) — diseño del sistema, modelo de datos, diseño de componentes, arquitectura de seguridad |
| **Guía de despliegue**       | [`docs/deployment/DEPLOYMENT.md`](docs/deployment/DEPLOYMENT.md)                                                                  |
| **Política de seguridad**    | [`SECURITY.md`](SECURITY.md) — procedimiento de reporte de vulnerabilidades                                                       |
| **Historial de releases**    | [`CHANGELOG.md`](CHANGELOG.md)                                                                                                    |
| **Avisos de terceros**       | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md)                                                                                |

## 🛟 Solución de problemas

### `Cannot find module @scrumooth/shared`

El paquete compartido debe compilarse antes de que el backend o frontend pueda resolver las importaciones.

```bash
pnpm --filter=@scrumooth/shared run build
```

Esto se gestiona automáticamente mediante `pnpm install` y los scripts de desarrollo, pero es necesario tras un `pnpm run clean` manual.

### `pnpm install` falla con "Use pnpm instead"

El repositorio exige el uso de pnpm mediante un script `preinstall`. Instale pnpm globalmente:

```bash
npm install -g pnpm@11.5.0
```

### Errores de conexión a la base de datos al iniciar

Verifique que su `DATABASE_URL` en `packages/backend/.env` apunte a una instancia PostgreSQL 18+ en ejecución y que la base de datos exista. Ejecute `pnpm run db:validate` para validar el esquema de Prisma contra la conexión.

### Puerto ya en uso (5001 o 5173)

Los puertos predeterminados se pueden cambiar mediante variables de entorno:

- Backend: `PORT` en `packages/backend/.env`
- Frontend: `VITE_DEV_PORT` en `packages/frontend/.env`

### El frontend no puede conectarse al backend

Compruebe que `VITE_API_URL` en `packages/frontend/.env` coincida con la dirección real del backend y que `CORS_ORIGIN` en `packages/backend/.env` permita el origen del frontend.

### ¿Quiere desarrollar sin backend?

Establezca `VITE_USE_MOCK_API=true` en `packages/frontend/.env` para usar la misma Mock API que impulsa la demo en vivo.

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia Apache 2.0 — consulte el archivo [LICENSE](LICENSE) para más detalles.

```
Copyright 2026 Orbivort

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
