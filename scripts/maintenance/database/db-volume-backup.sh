#!/bin/bash
#
# PostgreSQL Volume Backup Script
# Creates compressed tar.gz backups of the PostgreSQL data volume
# This backs up the actual data files, not just SQL dumps
#
# Note: On Windows with Docker Desktop, this script runs entirely within Docker
# to access volume data since Docker volumes are stored in the WSL2 VM.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${1:-./backups/volumes}"
# Try to find the PostgreSQL volume (handles both docker-compose prefixed and plain names)
VOLUME_NAME=$(docker volume ls -q | grep -E "(scrsphere.*postgres_data|postgres_data)" | head -1)
CONTAINER_NAME="scrsphere-postgres"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="postgres_volume_${TIMESTAMP}.tar.gz"

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if volume exists
if [ -z "$VOLUME_NAME" ]; then
    log_error "PostgreSQL volume not found!"
    log_info "Available volumes:"
    docker volume ls
    exit 1
fi

log_info "Found volume: $VOLUME_NAME"

# Check if PostgreSQL container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    log_error "PostgreSQL container '$CONTAINER_NAME' is not running!"
    exit 1
fi

# Create backup directory (ignore if exists)
mkdir -p "$BACKUP_DIR" 2>/dev/null || true

# Get absolute path for backup directory
BACKUP_DIR_ABS=$(cd "$BACKUP_DIR" && pwd)

log_info "Starting volume backup..."
log_info "Volume: $VOLUME_NAME"
log_info "Backup file: $BACKUP_FILE"
log_info "Destination: $BACKUP_DIR"

# Method: Use a temporary container to backup the volume
# This works on all platforms including Windows with Docker Desktop
log_info "Creating backup using temporary container..."

# First, check if we're on Windows by looking at the path format
if [[ "$BACKUP_DIR_ABS" == /mnt/* ]] || [[ "$BACKUP_DIR_ABS" == *[A-Za-z]:* ]]; then
    # Windows path detected (Git Bash, WSL, or Windows native)
    log_info "Windows environment detected, using alternative backup method..."
    
    # Create a temporary backup container that copies data to host via docker cp
    TEMP_CONTAINER="temp-pg-backup-$(date +%s)"
    
    # Create a temporary container with the volume mounted
    docker create --name "$TEMP_CONTAINER" \
        -v "$VOLUME_NAME":/data:ro \
        alpine:latest \
        sh -c "tar czf /backup.tar.gz -C /data ." || {
        log_error "Failed to create backup container!"
        exit 1
    }
    
    # Start the container to create the backup
    docker start "$TEMP_CONTAINER" || {
        log_error "Failed to start backup container!"
        docker rm "$TEMP_CONTAINER" 2>/dev/null || true
        exit 1
    }
    
    # Wait for backup to complete
    sleep 2
    
    # Copy the backup from container to host
    docker cp "$TEMP_CONTAINER:/backup.tar.gz" "$BACKUP_DIR_ABS/$BACKUP_FILE" || {
        log_error "Failed to copy backup from container!"
        docker rm "$TEMP_CONTAINER" 2>/dev/null || true
        exit 1
    }
    
    # Remove temporary container
    docker rm "$TEMP_CONTAINER" 2>/dev/null || true
    
else
    # Linux/Mac - direct volume mount works
    docker run --rm \
        -v "$VOLUME_NAME":/data:ro \
        -v "$BACKUP_DIR_ABS":/backups \
        alpine:latest \
        tar czf "/backups/$BACKUP_FILE" -C /data . || {
        log_error "Backup failed!"
        exit 1
    }
fi

# Verify backup was created and has content
if [ -f "$BACKUP_DIR_ABS/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(stat -f%z "$BACKUP_DIR_ABS/$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_DIR_ABS/$BACKUP_FILE" 2>/dev/null || ls -l "$BACKUP_DIR_ABS/$BACKUP_FILE" | awk '{print $5}')
    
    if [ -z "$BACKUP_SIZE" ] || [ "$BACKUP_SIZE" -lt 100 ]; then
        log_error "Backup file is empty or too small (${BACKUP_SIZE} bytes)!"
        rm -f "$BACKUP_DIR_ABS/$BACKUP_FILE"
        exit 1
    fi
    
    # Convert size to human readable
    if [ "$BACKUP_SIZE" -gt 1048576 ]; then
        BACKUP_SIZE_HUMAN="$(echo "scale=2; $BACKUP_SIZE / 1048576" | bc) MB"
    elif [ "$BACKUP_SIZE" -gt 1024 ]; then
        BACKUP_SIZE_HUMAN="$(echo "scale=2; $BACKUP_SIZE / 1024" | bc) KB"
    else
        BACKUP_SIZE_HUMAN="${BACKUP_SIZE} bytes"
    fi
    
    log_success "Volume backup completed successfully!"
    log_info "Backup size: $BACKUP_SIZE_HUMAN"
    log_info "Location: $BACKUP_DIR/$BACKUP_FILE"
    
    # Verify backup contents
    log_info "Verifying backup contents..."
    FILE_COUNT=$(docker run --rm -i alpine:latest tar tzf - < "$BACKUP_DIR_ABS/$BACKUP_FILE" | wc -l)
    log_info "Files in backup: $FILE_COUNT"
else
    log_error "Backup file was not created!"
    exit 1
fi

# Cleanup old backups
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "postgres_volume_*.tar.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
find "$BACKUP_DIR" -name "postgres_volume_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
if [ "$DELETED_COUNT" -gt 0 ]; then
    log_success "Deleted $DELETED_COUNT old backup(s)"
else
    log_info "No old backups to delete"
fi

# List remaining backups
echo ""
log_info "Current volume backups:"
ls -lh "$BACKUP_DIR"/postgres_volume_*.tar.gz 2>/dev/null || echo "  No backups found"

echo ""
log_success "Volume backup process completed!"
