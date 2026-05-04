#!/bin/bash
#
# PostgreSQL Volume Restore Script
# Restores PostgreSQL data volume from a tar.gz backup
# WARNING: This will REPLACE the current database data!
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
# Try to find the PostgreSQL volume (handles both docker-compose prefixed and plain names)
VOLUME_NAME=$(docker volume ls -q | grep -E "(scrsphere.*postgres_data|postgres_data)" | head -1)
CONTAINER_NAME="scrsphere-postgres"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -1 ./backups/volumes/postgres_volume_*.tar.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Warning and confirmation
echo ""
log_warning "⚠️  WARNING: This will REPLACE the current PostgreSQL database data!"
log_warning "All current data will be lost and replaced with the backup."
echo ""
log_info "Backup file: $BACKUP_FILE"
log_info "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled."
    exit 0
fi

# Additional confirmation for production
read -p "Type 'RESTORE' to confirm: " confirm2
if [ "$confirm2" != "RESTORE" ]; then
    log_info "Restore cancelled."
    exit 0
fi

log_info "Stopping PostgreSQL container..."
docker stop "$CONTAINER_NAME" || true

# Create safety backup of current volume
SAFETY_BACKUP="./backups/volumes/safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
log_info "Creating safety backup of current volume..."
mkdir -p ./backups/volumes
docker run --rm \
    -v "$VOLUME_NAME":/data:ro \
    -v "$(pwd)/backups/volumes":/backups \
    alpine:latest \
    tar czf "/backups/$(basename "$SAFETY_BACKUP")" -C /data . || {
    log_warning "Could not create safety backup, but continuing..."
    }

if [ -f "$SAFETY_BACKUP" ]; then
    log_success "Safety backup created: $SAFETY_BACKUP"
fi

# Remove old volume and create new one
log_info "Removing old volume..."
docker volume rm "$VOLUME_NAME" || true

log_info "Creating new volume..."
docker volume create "$VOLUME_NAME"

# Restore from backup
log_info "Restoring from backup..."
docker run --rm \
    -v "$VOLUME_NAME":/data \
    -v "$(dirname "$BACKUP_FILE")":/backups:ro \
    alpine:latest \
    tar xzf "/backups/$(basename "$BACKUP_FILE")" -C /data || {
    log_error "Restore failed!"
    exit 1
    }

log_success "Volume restored successfully!"

# Start PostgreSQL container
log_info "Starting PostgreSQL container..."
cd "$(dirname "$0")/../../.." && docker-compose up -d postgres

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
sleep 5

for i in {1..30}; do
    if docker exec "$CONTAINER_NAME" pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL is ready!"
        break
    fi
    echo -n "."
    sleep 2
done

# Verify database
log_info "Verifying database..."
docker exec "$CONTAINER_NAME" psql -U postgres -d scrsphere -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1 && {
    log_success "Database verification passed!"
} || {
    log_warning "Could not verify database, but restore may still be successful."
}

echo ""
log_success "Volume restore completed successfully!"
log_info "Safety backup: $SAFETY_BACKUP"
