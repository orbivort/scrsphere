# =============================================================================
# Scrumooth Frontend - Production Dockerfile
# =============================================================================
# Multi-stage build for minimal image size and security
# Following Docker and OCI best practices
# =============================================================================

# Build arguments for version pinning and reproducibility
ARG NODE_VERSION=24.14.1
ARG PNPM_VERSION=11.5.0
ARG NGINX_VERSION=1.27

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

# Build arguments for Vite environment variables (non-sensitive only)
# These are passed from docker-compose.yml build.args
ARG VITE_BASE_PATH=/scrumooth/
# Use relative URL for API - nginx proxies /api to backend:5010
ARG VITE_API_URL=/api/v1
ARG VITE_USE_MOCK_API=false
ARG VITE_BACKLOG_ITEM_LIMIT=100
ARG VITE_BACKLOG_MAX_ITEMS_PER_GOAL=200
ARG VITE_LOG_LEVEL=info

# OCI Image Labels
LABEL org.opencontainers.image.title="Scrumooth Frontend Builder" \
      org.opencontainers.image.description="Builder stage for Scrumooth Frontend" \
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
COPY packages/frontend/package.json packages/frontend/tsconfig.json ./packages/frontend/

# Extract app version from package.json (avoids hardcoding)
RUN node -e "console.log(require('./packages/frontend/package.json').version)" > /tmp/app_version

# Install dependencies with frozen lockfile for reproducible builds
# Use --shamefully-hoist for flat node_modules structure
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source code (most frequently changed)
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Create .env.production file from build arguments
# This ensures only non-sensitive variables are embedded in the build
RUN echo "VITE_BASE_PATH=${VITE_BASE_PATH}" > packages/frontend/.env.production && \
    echo "VITE_API_URL=${VITE_API_URL}" >> packages/frontend/.env.production && \
    echo "VITE_USE_MOCK_API=${VITE_USE_MOCK_API}" >> packages/frontend/.env.production && \
    echo "VITE_BACKLOG_ITEM_LIMIT=${VITE_BACKLOG_ITEM_LIMIT}" >> packages/frontend/.env.production && \
    echo "VITE_BACKLOG_MAX_ITEMS_PER_GOAL=${VITE_BACKLOG_MAX_ITEMS_PER_GOAL}" >> packages/frontend/.env.production && \
    echo "VITE_LOG_LEVEL=${VITE_LOG_LEVEL}" >> packages/frontend/.env.production

# Build shared package first (dependency for frontend)
RUN cd packages/shared && pnpm exec tsc

# Run TypeScript strict checks before Vite build
RUN cd packages/frontend && pnpm exec tsc --noEmit

# Build frontend with Vite
RUN cd packages/frontend && pnpm exec vite build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM nginx:${NGINX_VERSION}-alpine AS production

# Build arguments for labels
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF

# OCI Image Labels (Open Container Initiative)
LABEL org.opencontainers.image.title="Scrumooth Frontend" \
      org.opencontainers.image.description="Frontend for Scrumooth - Agile Scrum Lifecycle Management System" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Scrumooth" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/orbivort/scrumooth" \
      org.opencontainers.image.url="https://app.local" \
      org.opencontainers.image.documentation="https://github.com/orbivort/scrumooth/blob/main/docs/README.md" \
      org.opencontainers.image.authors="Scrumooth Team"

WORKDIR /usr/share/nginx/html

# Copy built frontend with proper ownership
COPY --from=builder --chown=nginx:nginx /app/packages/frontend/dist .

# Copy app version extracted from package.json
COPY --from=builder /tmp/app_version /tmp/app_version

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/nginx.conf

# Create required directories and set permissions in a single layer
# This ensures nginx can write logs and cache
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid && \
    rm -f /etc/nginx/conf.d/default.conf

# Switch to non-root user (nginx user exists in nginx:alpine)
# Disable default entrypoint scripts that try to modify read-only filesystem
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
USER nginx

# Expose HTTP port
EXPOSE 80

# Health check with reasonable defaults
# Uses wget spider mode to check if nginx is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://app.local/ || exit 1

# nginx runs as foreground process by default in official images
# No need for dumb-init as nginx handles signals properly
