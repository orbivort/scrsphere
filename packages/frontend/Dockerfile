# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy root package files for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/frontend/package.json packages/frontend/tsconfig.json ./packages/frontend/

# Install dependencies with frozen lockfile for reproducible builds
# Use --shamefully-hoist for flat node_modules structure
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Explicitly install TypeScript to ensure it's available
RUN npm install -g typescript@6.0.3

# Copy source
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build shared first, then frontend
RUN cd packages/shared && tsc
# Run TypeScript strict checks before Vite build
RUN cd packages/frontend && ../../node_modules/.bin/tsc --noEmit
# Build frontend with Vite
RUN cd packages/frontend && ../../node_modules/.bin/vite build

# Production stage - nginx
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Copy built frontend with proper ownership
COPY --from=builder --chown=nginx:nginx /app/packages/frontend/dist .

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/nginx.conf

# Create required directories and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root user (nginx user exists in nginx:alpine)
USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
