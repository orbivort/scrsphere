#!/bin/sh
set -e

# =============================================================================
# Scrumooth Backend Docker Entrypoint
# =============================================================================
# Production-ready entrypoint with:
# - Environment variable validation
# - Database connection retry logic
# - Graceful shutdown handling
# - Migration execution with error handling
# =============================================================================

# Colors for output (disabled if not a terminal)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m' # No Color
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

log_info() {
  echo "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo "${RED}[ERROR]${NC} $1"
}

log_debug() {
  if [ "${LOG_LEVEL}" = "debug" ]; then
    echo "${BLUE}[DEBUG]${NC} $1"
  fi
}

# =============================================================================
# Environment Variable Validation
# =============================================================================
log_info "Validating environment variables..."

# Required variables for production
REQUIRED_VARS="DATABASE_URL JWT_SECRET NODE_ENV CORS_ORIGIN FRONTEND_URL"
MISSING_VARS=""

for var in $REQUIRED_VARS; do
  eval "val=\$$var"
  if [ -z "$val" ]; then
    MISSING_VARS="$MISSING_VARS $var"
  fi
done

if [ -n "$MISSING_VARS" ]; then
  log_error "Missing required environment variables:$MISSING_VARS"
  log_error "Please check your .env.production file"
  exit 1
fi

log_info "All required environment variables are set"

# Validate NODE_ENV
if [ "$NODE_ENV" != "production" ]; then
  log_warn "NODE_ENV is not set to 'production' (current: $NODE_ENV)"
  log_warn "This is not recommended for production deployments"
fi

# Validate JWT_SECRET length
JWT_LENGTH=$(printf '%s' "$JWT_SECRET" | wc -c)
if [ "$JWT_LENGTH" -lt 64 ]; then
  log_error "JWT_SECRET is too short ($JWT_LENGTH characters)"
  log_error "Must be at least 64 characters for production security"
  log_error "Generate with: openssl rand -hex 64"
  exit 1
fi

log_info "JWT_SECRET length validated ($JWT_LENGTH characters)"

# Warn about EMAIL_TEST_MODE in production
if [ "$EMAIL_TEST_MODE" = "true" ] && [ "$NODE_ENV" = "production" ]; then
  log_error "EMAIL_TEST_MODE is set to 'true' in production environment"
  log_error "Emails will NOT be sent. Set EMAIL_TEST_MODE=false for production"
  exit 1
fi

# =============================================================================
# Database Connection with Retry Logic
# =============================================================================
log_info "Checking database connection..."

MAX_RETRIES=${DB_CONNECTION_RETRIES:-30}
RETRY_INTERVAL=${DB_CONNECTION_INTERVAL:-2}
RETRY_COUNT=0

# Extract database host from DATABASE_URL for logging
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
log_debug "Database host: $DB_HOST"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # Try to connect to database
  if echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; then
    log_info "Database connection established successfully"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    log_warn "Database not ready, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
    sleep $RETRY_INTERVAL
  fi
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  log_error "Failed to connect to database after $MAX_RETRIES attempts"
  log_error "Total wait time: $((MAX_RETRIES * RETRY_INTERVAL)) seconds"
  log_error "Please check:"
  log_error "  1. Database is running and accessible"
  log_error "  2. DATABASE_URL is correct"
  log_error "  3. Network connectivity between containers"
  exit 1
fi

# =============================================================================
# Database Migrations
# =============================================================================
log_info "Running Prisma migrations..."

# Capture migration output and exit code
set +e
MIGRATION_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATION_EXIT_CODE=$?
set -e

if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
  log_error "Database migrations failed with exit code $MIGRATION_EXIT_CODE"
  log_error "Migration output:"
  echo "$MIGRATION_OUTPUT"
  log_error ""
  log_error "Possible causes:"
  log_error "  1. Database schema conflicts"
  log_error "  2. Migration files missing or corrupted"
  log_error "  3. Insufficient database permissions"
  log_error ""
  log_error "To resolve:"
  log_error "  1. Check migration status: npx prisma migrate status"
  log_error "  2. Review migration files in prisma/migrations/"
  log_error "  3. Check database logs for errors"
  exit 1
fi

log_info "Migrations completed successfully"
log_debug "$MIGRATION_OUTPUT"

# =============================================================================
# Graceful Shutdown Handler
# =============================================================================
SHUTDOWN_TIMEOUT=${SHUTDOWN_TIMEOUT:-30}

shutdown_handler() {
  log_info "Received shutdown signal (SIGTERM/SIGINT)"
  log_info "Initiating graceful shutdown..."
  log_info "Waiting up to ${SHUTDOWN_TIMEOUT}s for connections to close"
  
  # The Node.js application will handle graceful shutdown
  # We just need to forward the signal and wait
  if [ -n "$PID" ]; then
    kill -TERM "$PID" 2>/dev/null || true
    
    # Wait for the process to exit gracefully
    WAIT_COUNT=0
    while kill -0 "$PID" 2>/dev/null && [ $WAIT_COUNT -lt $SHUTDOWN_TIMEOUT ]; do
      sleep 1
      WAIT_COUNT=$((WAIT_COUNT + 1))
    done
    
    # Force kill if still running
    if kill -0 "$PID" 2>/dev/null; then
      log_warn "Process did not exit gracefully, forcing shutdown"
      kill -KILL "$PID" 2>/dev/null || true
    fi
  fi
  
  log_info "Shutdown complete"
  exit 0
}

# Register signal handlers
trap 'shutdown_handler' SIGTERM SIGINT

# =============================================================================
# Start Application
# =============================================================================
log_info "Starting Scrumooth Backend..."
log_info "Environment: $NODE_ENV"
log_info "Port: ${PORT:-5010}"
log_info "Node.js version: $(node --version)"

# Start the application and capture PID
node dist/index.js &
PID=$!

log_info "Application started with PID $PID"

# Wait for the application process
wait $PID
