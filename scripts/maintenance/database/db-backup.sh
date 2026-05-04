#!/bin/bash

# PostgreSQL Backup Script for Scrsphere
# Usage: ./db-backup.sh [backup_directory]

set -e

# Configuration
CONTAINER_NAME="scrsphere-postgres"
DB_NAME="scrsphere"
DB_USER="postgres"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="scrsphere_backup_${TIMESTAMP}.sql"
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

# Check if container is running
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
    
    # Get password from environment or prompt
    DB_PASSWORD=$(docker exec "$CONTAINER_NAME" printenv POSTGRES_PASSWORD 2>/dev/null || echo "")
    
    if [ -z "$DB_PASSWORD" ]; then
        log_warn "Could not get password from container environment"
        log_info "Attempting backup with trust authentication..."
        
        docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH"
    else
        docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
            pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH"
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
    find "$BACKUP_DIR" -name "scrsphere_backup_*.sql.gz" -type f -mtime +7 -delete
    log_info "Cleanup completed"
}

# Main execution
main() {
    log_info "=== Scrsphere Database Backup ==="
    log_info "Backup directory: $BACKUP_DIR"
    log_info "Timestamp: $TIMESTAMP"
    
    check_container
    create_backup_dir
    backup_database
    cleanup_old_backups
    
    log_info "=== Backup Process Completed ==="
}

# Run main function
main "$@"
