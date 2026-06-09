#!/bin/bash
# =============================================================================
# Scrumooth One-Command Deployment Script
# =============================================================================
# Usage: ./deploy.sh [VERSION] [DOMAIN]
#
# Examples:
#   ./deploy.sh                    # Deploy latest to localhost
#   ./deploy.sh 1.0.0              # Deploy version 1.0.0 to localhost
#   ./deploy.sh 1.0.0 example.com  # Deploy version 1.0.0 to example.com
#
# This script deploys PRE-BUILT Docker images from GitHub Container Registry.
# It does NOT build images locally - use docker-compose.yml for local builds.
#
# What this script does:
#   1. Pull Docker images from GHCR (backend, frontend, backup)
#   2. Generate configuration if not exists (.env.production)
#   3. Validate configuration
#   4. Deploy services with Docker Compose
#   5. Verify deployment health
#
# NOTE: Vite environment variables (VITE_*) are BUILD-TIME variables.
# They are compiled into the frontend JavaScript bundle during the Docker build.
# The pre-built images from GHCR already have these values baked in:
#   - VITE_BASE_PATH=/scrumooth/
#   - VITE_API_URL=/api/v1
#   - VITE_USE_MOCK_API=false
#   - VITE_BACKLOG_ITEM_LIMIT=100
#   - VITE_BACKLOG_MAX_ITEMS_PER_GOAL=200
#   - VITE_LOG_LEVEL=info
#
# To customize Vite variables, build the frontend image locally:
#   docker compose -f docker-compose.yml build frontend
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION=${1:-latest}
DOMAIN=${2:-localhost}
REGISTRY="ghcr.io/orbivort/scrumooth"
ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    log_error "$1 is not installed. Please install it first."
    exit 1
  fi
}

generate_secret() {
  openssl rand -hex 32
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

log_step "Pre-flight Checks"

# Check required commands
log_info "Checking required commands..."
check_command docker
check_command openssl

# Check if Docker is running
if ! docker info &> /dev/null; then
  log_error "Docker is not running. Please start Docker first."
  exit 1
fi

log_info "✅ All checks passed"

# =============================================================================
# Pull Docker Images
# =============================================================================

log_step "Pulling Docker Images (Version: $VERSION)"

log_info "Pulling backend image..."
docker pull ${REGISTRY}/backend:${VERSION}

log_info "Pulling frontend image..."
docker pull ${REGISTRY}/frontend:${VERSION}

log_info "Pulling backup service image..."
docker pull ${REGISTRY}/backup:${VERSION} || log_warn "Backup service image not available, skipping..."

log_info "✅ All images pulled successfully"

# =============================================================================
# Generate Configuration
# =============================================================================

if [ ! -f "$ENV_FILE" ]; then
  log_step "Generating Configuration"

  log_info "Generating secrets..."
  JWT_SECRET=$(openssl rand -hex 64)
  DB_PASSWORD=$(openssl rand -hex 32)

  log_info "Creating $ENV_FILE..."

  cat > $ENV_FILE << EOF
# ===========================================
# Scrumooth Production Configuration
# Generated on $(date)
# ===========================================

# Environment
NODE_ENV=production
PORT=5010

# Database
DATABASE_URL=postgresql://scrumooth:${DB_PASSWORD}@postgres:5432/scrumooth
DB_USER=scrumooth
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=scrumooth

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://${DOMAIN}

# Frontend
FRONTEND_URL=https://${DOMAIN}

# Email (Configure these for production!)
EMAIL_PROVIDER=smtp
EMAIL_TEST_MODE=false
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM_ADDRESS=noreply@${DOMAIN}
EMAIL_FROM_NAME="Scrumooth"

# Domain
DOMAIN=${DOMAIN}
EOF

  log_warn "⚠️  Configuration generated with placeholder email settings!"
  log_warn "⚠️  Please edit $ENV_FILE and configure your email provider."
  log_warn ""
  read -p "Press Enter to continue after configuring email settings..."
else
  log_info "✅ Configuration file already exists: $ENV_FILE"
fi

# =============================================================================
# Validate Configuration
# =============================================================================

log_step "Validating Configuration"

log_info "Running configuration validation..."
if docker run --rm --env-file $ENV_FILE ${REGISTRY}/backend:${VERSION} node dist/scripts/validate-config.js; then
  log_info "✅ Configuration is valid"
else
  log_error "Configuration validation failed!"
  log_error "Please fix the errors in $ENV_FILE and run this script again."
  exit 1
fi

# =============================================================================
# Create Docker Compose File
# =============================================================================

if [ ! -f "$COMPOSE_FILE" ]; then
  log_step "Creating Docker Compose File"

  cat > $COMPOSE_FILE << 'EOF'
name: scrumooth

services:
  postgres:
    image: postgres:18-alpine
    container_name: scrumooth-postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - scrumooth_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - scrumooth-network

  backend:
    image: ghcr.io/orbivort/scrumooth/backend:latest
    container_name: scrumooth-backend
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    expose:
      - "5010"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5010/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
    networks:
      - scrumooth-network

  frontend:
    image: ghcr.io/orbivort/scrumooth/frontend:latest
    container_name: scrumooth-frontend
    depends_on:
      backend:
        condition: service_healthy
    expose:
      - "80"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1/"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - scrumooth-network

  caddy:
    image: caddy:2-alpine
    container_name: scrumooth-caddy
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - scrumooth-network

volumes:
  scrumooth_postgres_data:
    driver: local
  caddy_data:
    driver: local
  caddy_config:
    driver: local

networks:
  scrumooth-network:
    driver: bridge
EOF

  # Update image versions if not latest
  if [ "$VERSION" != "latest" ]; then
    sed -i "s|backend:latest|backend:${VERSION}|g" $COMPOSE_FILE
    sed -i "s|frontend:latest|frontend:${VERSION}|g" $COMPOSE_FILE
  fi

  log_info "✅ Docker Compose file created: $COMPOSE_FILE"
  
  # Note about Vite environment variables
  echo ""
  log_warn "Note: Vite environment variables (VITE_*) are build-time variables."
  log_warn "They are already baked into the pre-built frontend image from GHCR."
  log_warn "Default values in the image:"
  log_warn "  - VITE_BASE_PATH=/scrumooth/"
  log_warn "  - VITE_API_URL=/api/v1"
  log_warn "  - VITE_USE_MOCK_API=false"
  log_warn "  - VITE_BACKLOG_ITEM_LIMIT=100"
  log_warn "  - VITE_BACKLOG_MAX_ITEMS_PER_GOAL=200"
  log_warn "  - VITE_LOG_LEVEL=info"
  log_warn ""
  log_warn "To customize these values, build the frontend image locally:"
  log_warn "  docker compose -f docker-compose.yml build frontend"
  echo ""
else
  log_info "✅ Docker Compose file already exists: $COMPOSE_FILE"
fi

# =============================================================================
# Create Caddyfile
# =============================================================================

if [ ! -f "Caddyfile" ]; then
  log_step "Creating Caddyfile"

  cat > Caddyfile << EOF
{\$DOMAIN:localhost} {
    tls internal

    log {
        output stdout
        format console
    }

    handle /api/* {
        reverse_proxy backend:5010 {
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up Host {host}
        }
    }

    handle /health {
        reverse_proxy backend:5010
    }

    handle {
        reverse_proxy frontend:80
    }

    header {
        Strict-Transport-Security "max-age=31536000; include-subdomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}

:80 {
    handle /health {
        reverse_proxy backend:5010
    }
}
EOF

  log_info "✅ Caddyfile created"
else
  log_info "✅ Caddyfile already exists"
fi

# =============================================================================
# Deploy Services
# =============================================================================

log_step "Deploying Services"

log_info "Starting services..."
docker compose -f $COMPOSE_FILE up -d

log_info "Waiting for services to be healthy..."
sleep 30

# =============================================================================
# Verify Deployment
# =============================================================================

log_step "Verifying Deployment"

# Check service status
log_info "Checking service status..."
docker compose -f $COMPOSE_FILE ps

# Check health endpoint
log_info "Checking health endpoint..."
if [ "$DOMAIN" = "localhost" ]; then
  HEALTH_URL="http://localhost/health"
else
  HEALTH_URL="https://${DOMAIN}/health"
fi

MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf $HEALTH_URL > /dev/null; then
    log_info "✅ Health check passed"
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    log_warn "Health check failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep 5
  fi
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  log_error "Health check failed after $MAX_RETRIES attempts"
  log_error "Check logs with: docker compose -f $COMPOSE_FILE logs"
  exit 1
fi

# =============================================================================
# Success!
# =============================================================================

log_step "Deployment Complete! 🎉"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Scrumooth has been successfully deployed!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Version:${NC}    $VERSION"
echo -e "  ${BLUE}Domain:${NC}     $DOMAIN"
echo -e "  ${BLUE}Health:${NC}     $HEALTH_URL"
echo ""

if [ "$DOMAIN" = "localhost" ]; then
  echo -e "  ${BLUE}Access URL:${NC} http://localhost"
else
  echo -e "  ${BLUE}Access URL:${NC} https://${DOMAIN}"
fi

echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure email settings in $ENV_FILE"
echo "  2. Restart backend: docker compose -f $COMPOSE_FILE restart backend"
echo "  3. View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "  4. Create first admin user through the UI"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  • Stop:     docker compose -f $COMPOSE_FILE down"
echo "  • Restart:  docker compose -f $COMPOSE_FILE restart"
echo "  • Logs:     docker compose -f $COMPOSE_FILE logs -f"
echo "  • Status:   docker compose -f $COMPOSE_FILE ps"
echo ""
