# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy root package files for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/backend/package.json packages/backend/tsconfig.json ./packages/backend/

# Install dependencies with frozen lockfile for reproducible builds
# Use --shamefully-hoist to create flat node_modules (better for Prisma)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Explicitly install TypeScript and Prisma globally
# Use same versions as defined in package.json
# Also install dotenv for prisma.config.ts
RUN npm install -g typescript@6.0.3 prisma@7.7.0 dotenv@17.4.2

# Copy source
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Generate Prisma client first (needed for TypeScript types)
# Use a dummy database URL for build-time generation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NODE_PATH="/usr/local/lib/node_modules"
RUN cd packages/backend && prisma generate --schema=prisma/schema.prisma

# Build shared first, then backend
RUN cd packages/shared && tsc
RUN cd packages/backend && tsc

# Create and run Node.js script to fix import extensions
COPY scripts/deployment/fix-imports.js /tmp/fix-imports.js
RUN cd packages/backend/dist && node /tmp/fix-imports.js

# Production stage
FROM node:24-alpine AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs scrsphere

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R scrsphere:nodejs /app/logs

# Copy built artifacts - order matters to avoid directory conflicts
COPY --from=builder --chown=scrsphere:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=scrsphere:nodejs /app/packages/backend/prisma ./prisma
COPY --from=builder --chown=scrsphere:nodejs /app/packages/backend/src/generated ./dist/generated
COPY --from=builder --chown=scrsphere:nodejs /app/packages/backend/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=scrsphere:nodejs /app/node_modules ./node_modules

# Copy shared package properly - need full package structure
COPY --from=builder --chown=scrsphere:nodejs /app/packages/shared/package.json /app/node_modules/@scrsphere/shared/package.json
COPY --from=builder --chown=scrsphere:nodejs /app/packages/shared/dist /app/node_modules/@scrsphere/shared/dist

# Copy backend package.json (not root, as root has type:module which conflicts with CommonJS output)
COPY --from=builder --chown=scrsphere:nodejs /app/packages/backend/package.json ./package.json

# Generate Prisma client in production (schema is already copied)
# Use npx to run local prisma which has access to dotenv
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER scrsphere

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
