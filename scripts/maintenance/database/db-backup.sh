#!/bin/bash

# PostgreSQL Backup Script for Scrumooth
# Usage: ./db-backup.sh [backup_directory]
#
# Works in two modes:
#   1. Host mode (default): Uses docker exec to reach the PostgreSQL container
#   2. Container mode: When PGHOST is set (e.g., inside the automated backup container),
#      connects directly via TCP without requiring Docker CLI

set -e

# Configuration (overridable via environment variables)
CONTAINER_NAME="${CONTAINER_NAME:-scrumooth-postgres}"
DB_NAME="${DB_NAME:-scrumooth}"
DB_USER="${DB_USER:-scrumooth}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="scrumooth_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker CLI is available
has_docker_cli() {
    command -v docker > /dev/null 2>&1
}

# Check if running inside a container (PGHOST is set by the backup service)
is_container_mode() {
    [ -n "$PGHOST" ]
}

# Check if container is running (host mode only)
check_container() {
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container '${CONTAINER_NAME}' is not running!"
        exit 1
    fi
    log_info "Container '${CONTAINER_NAME}' is running"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Perform database backup
backup_database() {
    log_info "Starting database backup..."
    log_info "Backup file: $BACKUP_FILE"

    if is_container_mode; then
        # Container mode: connect directly via TCP (PGHOST is set by docker-compose)
        log_info "Running in container mode (PGHOST=$PGHOST)"
        PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump -h "$PGHOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH"
    elif has_docker_cli; then
        # Host mode: use docker exec to reach the PostgreSQL container
        log_info "Running in host mode (using docker exec)"

        DB_PASSWORD=$(docker exec "$CONTAINER_NAME" printenv POSTGRES_PASSWORD 2>/dev/null || echo "")

        if [ -z "$DB_PASSWORD" ]; then
            log_warn "Could not get password from container environment"
            log_info "Attempting backup with trust authentication..."
            docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH"
        else
            docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
                pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH"
        fi
    else
        log_error "Neither Docker CLI nor PGHOST environment variable is available."
        log_error "Run this script on the Docker host or inside the automated backup container."
        exit 1
    fi

    if [ $? -eq 0 ]; then
        log_info "Backup completed successfully!"
        log_info "Backup location: $BACKUP_PATH"

        # Compress the backup
        log_info "Compressing backup..."
        gzip "$BACKUP_PATH"
        log_info "Compressed backup: ${BACKUP_PATH}.gz"

        # Show backup size
        BACKUP_SIZE=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
        log_info "Backup size: $BACKUP_SIZE"
    else
        log_error "Backup failed!"
        rm -f "$BACKUP_PATH"
        exit 1
    fi
}

# Cleanup old backups (keep last 7 days)
cleanup_old_backups() {
    log_info "Cleaning up backups older than 7 days..."
    find "$BACKUP_DIR" -name "scrumooth_backup_*.sql.gz" -type f -mtime +7 -delete 2>/dev/null || true
    log_info "Cleanup completed"
}

# Main execution
main() {
    log_info "=== Scrumooth Database Backup ==="
    log_info "Backup directory: $BACKUP_DIR"
    log_info "Timestamp: $TIMESTAMP"

    if is_container_mode; then
        log_info "Container mode detected (PGHOST is set)"
    else
        check_container
    fi

    create_backup_dir
    backup_database
    cleanup_old_backups

    log_info "=== Backup Process Completed ==="
}

# Run main function
main "$@"
