# =============================================================================
# Scrumooth Backend - Production Dockerfile
# =============================================================================
# Multi-stage build for minimal image size and security
# Following Docker and OCI best practices
# =============================================================================

# Build arguments for version pinning and reproducibility
ARG NODE_VERSION=24
ARG ALPINE_VERSION=3.21
ARG PNPM_VERSION=11.5.0
ARG TYPESCRIPT_VERSION=6.0.3
ARG PRISMA_VERSION=7.7.0

# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

# Build arguments for labels
ARG VERSION=1.5.1
ARG BUILD_DATE
ARG VCS_REF

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

# Install build dependencies in a single layer
# dumb-init for proper signal handling
RUN apk add --no-cache dumb-init~=1.2.5

# Install pnpm using corepack (recommended by Node.js)
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy package files first for better layer caching
# Order: least frequently changed to most frequently changed
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/package.json packages/backend/tsconfig.json ./packages/backend/

# Install dependencies with frozen lockfile for reproducible builds
# Use --shamefully-hoist to create flat node_modules (better for Prisma)
RUN pnpm install --frozen-lockfile --shamefully-hoist

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

# Fix import extensions for ESM compatibility
COPY scripts/deployment/fix-imports.js /tmp/fix-imports.js
RUN cd packages/backend/dist && node /tmp/fix-imports.js

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS production

# Build arguments for labels
ARG VERSION=1.5.1
ARG BUILD_DATE
ARG VCS_REF

# OCI Image Labels (Open Container Initiative)
LABEL org.opencontainers.image.title="Scrumooth Backend" \
      org.opencontainers.image.description="Backend API for Scrumooth - Agile Scrum Lifecycle Management System" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Scrumooth" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/orbivort/scrumooth" \
      org.opencontainers.image.url="https://scrumooth.com" \
      org.opencontainers.image.documentation="https://github.com/orbivort/scrumooth/blob/main/docs/README.md" \
      org.opencontainers.image.authors="Scrumooth Team"

# Security: Create non-root user and group with fixed IDs
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --home /home/scrumooth scrumooth

# Install runtime dependencies in a single layer
# dumb-init for proper signal handling (PID 1 zombie reaping)
RUN apk add --no-cache dumb-init~=1.2.5

WORKDIR /app

# Create required directories with proper permissions before switching user
RUN mkdir -p /app/logs /app/dist/generated && \
    chown -R scrumooth:nodejs /app

# Copy built artifacts with proper ownership
# Order matters to optimize layer caching
COPY --from=builder --chown=scrumooth:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=scrumooth:nodejs /app/packages/backend/prisma ./prisma
COPY --from=builder --chown=scrumooth:nodejs /app/packages/backend/src/generated ./dist/generated
COPY --from=builder --chown=scrumooth:nodejs /app/packages/backend/prisma.config.ts ./prisma.config.ts

# Copy node_modules (contains all dependencies including Prisma)
COPY --from=builder --chown=scrumooth:nodejs /app/node_modules ./node_modules

# Setup shared package in node_modules for proper resolution
COPY --from=builder --chown=scrumooth:nodejs /app/packages/shared/package.json /app/node_modules/@scrumooth/shared/package.json
COPY --from=builder --chown=scrumooth:nodejs /app/packages/shared/dist /app/node_modules/@scrumooth/shared/dist

# Copy backend package.json
COPY --from=builder --chown=scrumooth:nodejs /app/packages/backend/package.json ./package.json

# Generate Prisma client in production stage
# Schema is already copied, this generates the client with production config
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000

# Switch to non-root user for security
USER scrumooth

# Expose application port
EXPOSE 5000

# Health check with reasonable defaults
# Checks /health endpoint every 30s, allows 3s for response
# Starts checking after 10s grace period, retries 3 times before marking unhealthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init as PID 1 for proper signal handling
# This ensures graceful shutdown and zombie process reaping
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
