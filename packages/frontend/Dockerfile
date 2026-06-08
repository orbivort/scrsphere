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
FROM debian:bookworm-slim AS builder

# Build arguments for labels
ARG VERSION=1.5.1
ARG BUILD_DATE
ARG VCS_REF
ARG NODE_VERSION
ARG PNPM_VERSION

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

# Install build dependencies and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Download and install Node.js from official binaries
ARG NODE_VERSION
RUN curl -fsSL https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz -o /tmp/node.tar.xz && \
    tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 && \
    rm -f /tmp/node.tar.xz && \
    ls -la /usr/local/bin/node && \
    /usr/local/bin/node --version && \
    /usr/local/bin/npm --version

# Add Node.js to PATH
ENV PATH="/usr/local/bin:${PATH}" \
    CI=true

# Install pnpm using corepack (recommended by Node.js)
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy package files first for better layer caching
# Order: least frequently changed to most frequently changed
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/frontend/package.json packages/frontend/tsconfig.json ./packages/frontend/

# Install dependencies with frozen lockfile for reproducible builds
# Use --shamefully-hoist for flat node_modules structure
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source code (most frequently changed)
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

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
ARG VERSION=1.5.1
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
      org.opencontainers.image.url="https://scrumooth.com" \
      org.opencontainers.image.documentation="https://github.com/orbivort/scrumooth/blob/main/docs/README.md" \
      org.opencontainers.image.authors="Scrumooth Team"

WORKDIR /usr/share/nginx/html

# Copy built frontend with proper ownership
COPY --from=builder --chown=nginx:nginx /app/packages/frontend/dist .

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/nginx.conf

# Create required directories and set permissions in a single layer
# This ensures nginx can write logs and cache
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root user (nginx user exists in nginx:alpine)
USER nginx

# Expose HTTP port
EXPOSE 80

# Health check with reasonable defaults
# Uses wget spider mode to check if nginx is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# nginx runs as foreground process by default in official images
# No need for dumb-init as nginx handles signals properly
