# =============================================================================
# Scrumooth Backend - Production Dockerfile
# =============================================================================
# Multi-stage build for minimal image size and security
# Following Docker and OCI best practices
# =============================================================================
#
# NOTE: Dependencies are pulled from the official npm registry by default.
# If you are in a region with slow access to registry.npmjs.org, you can pass
# the NPM_REGISTRY build-arg to point at a faster mirror, for example:
#
#   docker build -t scrumooth-backend:latest -f packages/backend/Dockerfile \
#     --build-arg NPM_REGISTRY=your_mirror_url .
#
# Without the build-arg, the build falls back to the official registry.
# =============================================================================

# Build arguments for version pinning and reproducibility
ARG NODE_VERSION=24.19.0
ARG PNPM_VERSION=11.21.0

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:${NODE_VERSION}-slim AS builder

# npm registry override (falls back to the official registry if not provided)
# Exported as npm_config_registry so that ALL pnpm/Prisma operations (including
# Prisma postinstall engine downloads) honor the mirror. A sentinel default
# (__default__) lets us detect whether the user actually supplied
# --build-arg NPM_REGISTRY=... on the command line.
ARG NPM_REGISTRY=__default__

# Debian apt mirror override. If provided, rewrite sources.list before any
# apt-get runs so package index downloads hit the faster mirror instead of the
# slow default deb.debian.org.
ARG APT_MIRROR=

# Resolve the effective registry and print a friendly terminal notice as early
# as possible. When the user provided --build-arg NPM_REGISTRY=..., display it.
# Otherwise show a clear reminder and fall back to the official registry. The
# resolved value is written to /tmp/npm_registry for reuse in later steps.
RUN set -eu; \
    printf 'NPM_REGISTRY=%s\n' "${NPM_REGISTRY}"; \
    if [ "${NPM_REGISTRY}" = "__default__" ]; then \
      NPM_REGISTRY="https://registry.npmjs.org"; \
      printf '\n'; \
      printf '============================================================\n'; \
      printf '  NOTICE: no --build-arg NPM_REGISTRY was provided.\n'; \
      printf '  Using the default npm registry: %s\n' "${NPM_REGISTRY}"; \
      printf '  If downloads are slow, rebuild with a faster mirror:\n'; \
      printf '    --build-arg NPM_REGISTRY=your_mirror_url\n'; \
      printf '============================================================\n'; \
      printf '\n'; \
    else \
      printf '\n'; \
      printf '============================================================\n'; \
      printf '  npm registry: %s\n' "${NPM_REGISTRY}"; \
      printf '============================================================\n'; \
      printf '\n'; \
    fi; \
    printf '%s' "${NPM_REGISTRY}" > /tmp/npm_registry

# Build arguments for labels
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_VERSION
ARG PNPM_VERSION

# OCI Image Labels
LABEL org.opencontainers.image.title="Scrumooth Backend Builder" \
      org.opencontainers.image.description="Builder stage for Scrumooth Backend API" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Scrumooth" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/orbivort/scrumooth"

WORKDIR /app

# Install pnpm using corepack (recommended by Node.js)
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV CI=true

# Install openssl so Prisma can detect the correct libssl version.
# The node slim image lacks openssl, which makes Prisma fall back to a guessed
# OpenSSL version ("openssl-1.1.x") and can cause runtime failures connecting
# to PostgreSQL.
# NOTE: we deliberately do NOT cache-mount any apt state dir. Cache-mounting
# apt's /var/lib/apt/lists or /var/cache/apt/archives causes recurring build
# failures: the apt lock files persist in the mount and the next build fails
# with "Could not get lock ... held by process 0". The slow part of the original
# build (14s+ hitting deb.debian.org) is fully solved by the APT_MIRROR build-arg
# below, which downloads the index from a fast mirror (~2s).
RUN set -eu; \
    if [ -n "${APT_MIRROR}" ]; then \
      sed -i "s|deb.debian.org/debian|${APT_MIRROR}/debian|g" /etc/apt/sources.list.d/debian.sources; \
      sed -i "s|deb.debian.org/debian-security|${APT_MIRROR}/debian-security|g" /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better layer caching
# Order: least frequently changed to most frequently changed
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/package.json packages/backend/tsconfig.json ./packages/backend/

# Extract app version from package.json (avoids hardcoding)
RUN node -e "console.log(require('./packages/backend/package.json').version)" > /tmp/app_version

# Write project .npmrc so BOTH pnpm and npm-based postinstall scripts (e.g.
# Prisma engine downloads) honor the mirror. Also export npm_config_registry so
# npm/Prisma operations honor the mirror.
RUN printf 'registry=%s\n' "$(cat /tmp/npm_registry)" > .npmrc && \
    export npm_config_registry="$(cat /tmp/npm_registry)"

# Install dependencies with frozen lockfile for reproducible builds
RUN sh -c 'export npm_config_registry="$(cat /tmp/npm_registry)"; \
    pnpm install --frozen-lockfile --registry="$(cat /tmp/npm_registry)"'

# Copy Prisma schema first (needed for client generation)
COPY packages/backend/prisma ./packages/backend/prisma

# Generate Prisma client first (needed for TypeScript types)
# Use a dummy database URL for build-time generation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd packages/backend && pnpm exec prisma generate --schema=prisma/schema.prisma

# Copy source code (most frequently changed)
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared package first (dependency for backend).
# The shared package is a composite (project-reference) build, so it MUST be
# compiled with `tsc --build` (tsc -b). Plain `tsc` on a composite project does
# not reliably emit the .d.ts declaration files, which later causes TS7016
# ("Could not find a declaration file for module '@scrumooth/shared'") when the
# backend is compiled.
# `--force` forces a complete rebuild and guarantees all .d.ts files are
# emitted. Without it, Docker COPY sets identical file mtimes, which confuses
# TypeScript's incremental build into skipping .d.ts emission (the .d.ts.map is
# written but the .d.ts itself is missing).
RUN cd packages/shared && pnpm exec tsc --build --force

# Build backend
RUN cd packages/backend && pnpm exec tsc

# Compile scripts folder (validate-config.ts)
RUN cd packages/backend && pnpm exec tsc scripts/validate-config.ts --outDir dist/scripts --esModuleInterop --moduleResolution nodenext --target ES2023 --module NodeNext --types node --ignoreConfig

# Fix import extensions for ESM compatibility
COPY scripts/utility/add-import-extensions.js /tmp/add-import-extensions.js
RUN cd packages/backend/dist && node /tmp/add-import-extensions.js

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:${NODE_VERSION}-slim AS production

# Build arguments for labels
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_VERSION
# npm registry override (falls back to the official registry if not provided)
# A sentinel default (__default__) lets us detect whether the user actually
# supplied --build-arg NPM_REGISTRY=... on the command line.
ARG NPM_REGISTRY=__default__
# Debian apt mirror override (see builder stage).
ARG APT_MIRROR=

# OCI Image Labels (Open Container Initiative)
LABEL org.opencontainers.image.title="Scrumooth Backend" \
      org.opencontainers.image.description="Backend API for Scrumooth - Agile Scrum Lifecycle Management System" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Scrumooth" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/orbivort/scrumooth" \
      org.opencontainers.image.url="https://app.local" \
      org.opencontainers.image.documentation="https://github.com/orbivort/scrumooth/blob/main/docs/README.md" \
      org.opencontainers.image.authors="Scrumooth Team"

# Install dumb-init for proper signal handling, and openssl so Prisma can
# detect the correct libssl version at runtime (avoids the "openssl-1.1.x"
# fallback that can break PostgreSQL connections).
# No apt cache mounts (they break builds via persisted apt lock files, see
# builder stage). APT_MIRROR makes apt-get update fast.
RUN set -eu; \
    if [ -n "${APT_MIRROR}" ]; then \
      sed -i "s|deb.debian.org/debian|${APT_MIRROR}/debian|g" /etc/apt/sources.list.d/debian.sources; \
      sed -i "s|deb.debian.org/debian-security|${APT_MIRROR}/debian-security|g" /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create required directories with proper permissions
RUN mkdir -p /app/logs/emails && \
    chown -R node:node /app

# Copy app version extracted from package.json
COPY --from=builder /tmp/app_version /tmp/app_version

# Copy built artifacts from builder
COPY --from=builder --chown=node:node /app/packages/backend/dist ./dist
COPY --from=builder --chown=node:node /app/packages/backend/prisma ./prisma
COPY --from=builder --chown=node:node /app/packages/backend/src/generated ./dist/generated
COPY --from=builder --chown=node:node /app/packages/backend/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/packages/backend/package.json ./package.json

# Resolve the effective registry into /tmp/npm_registry for use by npm/Prisma
# in this stage (the terminal notice was already printed in the builder stage).
RUN set -eu; \
    if [ "${NPM_REGISTRY}" = "__default__" ]; then \
      NPM_REGISTRY="https://registry.npmjs.org"; \
    fi; \
    printf '%s' "${NPM_REGISTRY}" > /tmp/npm_registry

# Export registry so npm and npx prisma generate honor the mirror too
RUN export npm_config_registry="$(cat /tmp/npm_registry)" && \
    printf 'registry=%s\n' "$(cat /tmp/npm_registry)" > .npmrc

# Install production dependencies using npm (flat node_modules, no symlink issues).
# This avoids pnpm's symlink-based node_modules structure which breaks in Docker COPY.
#
# Steps (order matters for image size):
#   1. Strip pnpm-specific entries: the workspace dep (@scrumooth/shared) and any
#      "catalog:" protocol deps (i18next, intl-pluralrules, date-fns) are removed
#      from the copied package.json with jq, since npm cannot resolve them.
#   2. `npm install --omit=dev` installs only production dependencies. Note that
#      @prisma/client (prod dep) hard-depends on the `prisma` CLI, which in turn
#      depends on @prisma/studio-core + @prisma/dev (Prisma Studio UI) and their
#      frontend packages (react-dom, @visx, d3-*, elkjs). Those are NOT removable
#      because the Prisma CLI hard-requires @prisma/studio-core on startup (even
#      for `migrate deploy`), so `npm prune` keeps them.
#   3. `npm prune --omit=dev` removes the remaining dev-only top-level packages
#      (eslint, supertest, @faker-js, @types/*, etc.).
#   4. `npm install --no-save` re-adds the runtime deps stripped in step 1. This
#      MUST come AFTER the prune, otherwise those packages are removed as
#      extraneous.
#   5. `npm cache clean --force` removes the ~470MB npm cache from /root/.npm
#      (created because this stage runs as root). This is the single largest
#      size reduction for the image.
RUN set -eu; \
    if [ -n "${APT_MIRROR}" ]; then \
      sed -i "s|deb.debian.org/debian|${APT_MIRROR}/debian|g" /etc/apt/sources.list.d/debian.sources; \
      sed -i "s|deb.debian.org/debian-security|${APT_MIRROR}/debian-security|g" /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update && apt-get install -y --no-install-recommends jq && rm -rf /var/lib/apt/lists/* && \
    jq 'del(.dependencies["@scrumooth/shared"]) | .dependencies |= with_entries(select(.value | startswith("catalog:") | not)) | .devDependencies |= with_entries(select(.value | startswith("catalog:") | not))' package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    npm install --omit=dev --registry="$(cat /tmp/npm_registry)" && \
    npm prune --omit=dev --registry="$(cat /tmp/npm_registry)" && \
    npm install --no-save --registry="$(cat /tmp/npm_registry)" i18next@^26.0.0 intl-pluralrules@^2.0.1 date-fns@^4.4.0 && \
    npm cache clean --force && \
    rm -rf /root/.npm /home/node/.npm /tmp/*.log

# Copy shared package build output into node_modules
COPY --from=builder --chown=node:node /app/packages/shared/dist ./node_modules/@scrumooth/shared/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./node_modules/@scrumooth/shared/package.json

# Generate Prisma client in production stage.
# This wires up the query engine for the freshly npm-installed @prisma/client
# so runtime `prisma migrate deploy` works. The schema declares output
# "../src/generated/prisma", so a redundant /app/src/generated is created.
# The app actually loads the client from /app/dist/generated (copied complete
# from the builder above), so we delete the redundant copy to avoid a 14MB
# duplicate in the image.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate && rm -rf /app/src/generated && rm -rf /root/.npm /home/node/.npm

# Copy entrypoint script
COPY --chown=node:node packages/backend/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5010

# Switch to non-root user for security (node user exists in node:bookworm-slim)
USER node

# Expose application port
EXPOSE 5010

# Health check with reasonable defaults
# Checks /health endpoint every 30s, allows 3s for response
# Starts checking after 60s grace period (allows time for migrations), retries 3 times before marking unhealthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5010/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init as PID 1 for proper signal handling
# This ensures graceful shutdown and zombie process reaping
ENTRYPOINT ["dumb-init", "--"]

# Start the application with database migrations
CMD ["./docker-entrypoint.sh"]
