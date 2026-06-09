# =============================================================================
# Scrumooth Backend - Production Dockerfile
# =============================================================================
# Multi-stage build for minimal image size and security
# Following Docker and OCI best practices
# =============================================================================

# Build arguments for version pinning and reproducibility
ARG NODE_VERSION=24.14.1
ARG PNPM_VERSION=11.5.0

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:${NODE_VERSION}-slim AS builder

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

# Copy package files first for better layer caching
# Order: least frequently changed to most frequently changed
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/package.json packages/backend/tsconfig.json ./packages/backend/

# Extract app version from package.json (avoids hardcoding)
RUN node -e "console.log(require('./packages/backend/package.json').version)" > /tmp/app_version

# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile

# Copy Prisma schema first (needed for client generation)
COPY packages/backend/prisma ./packages/backend/prisma

# Generate Prisma client first (needed for TypeScript types)
# Use a dummy database URL for build-time generation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd packages/backend && pnpm exec prisma generate --schema=prisma/schema.prisma

# Copy source code (most frequently changed)
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared package first (dependency for backend)
RUN cd packages/shared && pnpm exec tsc

# Build backend
RUN cd packages/backend && pnpm exec tsc

# Compile scripts folder (validate-config.ts)
RUN cd packages/backend && pnpm exec tsc scripts/validate-config.ts --outDir dist/scripts --esModuleInterop --moduleResolution node --target ES2023 --module ESNext

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

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
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

# Install production dependencies using npm (flat node_modules, no symlink issues)
# This avoids pnpm's symlink-based node_modules structure which breaks in Docker COPY
# Remove workspace dependency and catalog: protocol entries (pnpm-specific) first
RUN apt-get update && apt-get install -y --no-install-recommends jq && rm -rf /var/lib/apt/lists/* && \
    jq 'del(.dependencies["@scrumooth/shared"]) | .devDependencies |= with_entries(select(.value | startswith("catalog:") | not))' package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    npm install --omit=dev

# Copy shared package build output into node_modules
COPY --from=builder --chown=node:node /app/packages/shared/dist ./node_modules/@scrumooth/shared/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./node_modules/@scrumooth/shared/package.json

# Generate Prisma client in production stage
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

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
