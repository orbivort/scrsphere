#!/bin/bash

# PostgreSQL Restore Script for Scrsphere
# Usage: ./db-restore.sh <backup_file>

set -e

# Configuration
CONTAINER_NAME="scrsphere-postgres"
DB_NAME="scrsphere"
DB_USER="postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if container is running
check_container() {
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container '${CONTAINER_NAME}' is not running!"
        exit 1
    fi
    log_info "Container '${CONTAINER_NAME}' is running"
}

# Validate backup file
validate_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified!"
        log_info "Usage: $0 <backup_file>"
        log_info "Example: $0 ./backups/scrsphere_backup_20250427_120000.sql.gz"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "Backup file: $backup_file"
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        log_info "Compressed backup detected"
        if gunzip -t "$backup_file" 2>/dev/null; then
            log_info "Backup file integrity check passed"
        else
            log_error "Backup file is corrupted!"
            exit 1
        fi
    fi
}

# Create pre-restore backup
create_pre_restore_backup() {
    log_section "Pre-Restore Backup"
    log_warn "Creating safety backup before restore..."
    
    PRE_RESTORE_BACKUP="./backups/pre_restore_$(date +"%Y%m%d_%H%M%S").sql"
    mkdir -p ./backups
    
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$PRE_RESTORE_BACKUP"
    
    if [ $? -eq 0 ]; then
        gzip "$PRE_RESTORE_BACKUP"
        log_info "Pre-restore backup created: ${PRE_RESTORE_BACKUP}.gz"
    else
        log_error "Failed to create pre-restore backup!"
        read -p "Continue without backup? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    log_section "Database Restore"
    
    # Confirm restore
    log_warn "This will REPLACE the current database with the backup!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    # Stop application containers to prevent data modification during restore
    log_info "Stopping application containers..."
    docker-compose stop backend frontend 2>/dev/null || true
    
    # Drop and recreate database
    log_info "Dropping existing database..."
    docker exec "$CONTAINER_NAME" dropdb -U "$DB_USER" --if-exists "$DB_NAME"
    
    log_info "Creating new database..."
    docker exec "$CONTAINER_NAME" createdb -U "$DB_USER" "$DB_NAME"
    
    # Restore from backup
    log_info "Restoring database from backup..."
    
    if [[ "$backup_file" == *.gz ]]; then
        gunzip < "$backup_file" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    else
        docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "Database restored successfully!"
    else
        log_error "Database restore failed!"
        exit 1
    fi
    
    # Restart application containers
    log_info "Restarting application containers..."
    docker-compose start backend frontend 2>/dev/null || true
}

# Verify restore
verify_restore() {
    log_section "Restore Verification"
    
    # Check database connectivity
    if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_info "Database is accessible"
    else
        log_error "Database is not accessible after restore!"
        exit 1
    fi
    
    # Get table count
    TABLE_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    " 2>/dev/null | xargs)
    log_info "Tables restored: $TABLE_COUNT"
    
    # Get database size
    DB_SIZE=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
    " 2>/dev/null | xargs)
    log_info "Database size: $DB_SIZE"
}

# Main execution
main() {
    local backup_file="$1"
    
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Scrsphere Database Restore                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_container
    validate_backup "$backup_file"
    create_pre_restore_backup
    restore_database "$backup_file"
    verify_restore
    
    log_section "Restore Completed"
    log_info "Database has been successfully restored from: $backup_file"
    log_info "Pre-restore backup saved for safety"
}

# Run main function
main "$@"
