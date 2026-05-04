#!/bin/bash

# PostgreSQL Database Validation Script for Scrsphere
# Usage: ./db-validate.sh

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
    log_section "Container Status"
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container '${CONTAINER_NAME}' is not running!"
        exit 1
    fi
    log_info "Container '${CONTAINER_NAME}' is running"
    
    # Get container health
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
    log_info "Container health: $HEALTH"
}

# Check database connectivity
check_connectivity() {
    log_section "Database Connectivity"
    
    if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log_info "Database is accepting connections"
        
        # Get connection details
        VERSION=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" 2>/dev/null | head -1)
        log_info "PostgreSQL version: $VERSION"
    else
        log_error "Database is not accepting connections!"
        exit 1
    fi
}

# Check database size and statistics
check_database_stats() {
    log_section "Database Statistics"
    
    # Database size
    DB_SIZE=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME'));
    " 2>/dev/null | xargs)
    log_info "Database size: $DB_SIZE"
    
    # Table statistics
    log_info "Table statistics:"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            relname as table_name,
            n_live_tup as row_count,
            pg_size_pretty(pg_total_relation_size(relid)) as total_size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 10;
    " 2>/dev/null || log_warn "Could not retrieve table statistics"
}

# Check for database integrity
check_integrity() {
    log_section "Database Integrity"
    
    log_info "Running integrity checks..."
    
    # Check for tables with no primary keys
    log_info "Checking for tables without primary keys..."
    NO_PK_TABLES=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_indexes 
            WHERE indexname LIKE '%_pkey'
        );
    " 2>/dev/null | xargs)
    
    if [ -z "$NO_PK_TABLES" ]; then
        log_info "All tables have primary keys"
    else
        log_warn "Tables without primary keys: $NO_PK_TABLES"
    fi
    
    # Check for long-running queries
    log_info "Checking for long-running queries..."
    LONG_QUERIES=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND now() - query_start > interval '5 minutes';
    " 2>/dev/null | xargs)
    
    if [ "$LONG_QUERIES" = "0" ]; then
        log_info "No long-running queries detected"
    else
        log_warn "Found $LONG_QUERIES long-running queries"
    fi
    
    # Check for locks
    log_info "Checking for locks..."
    LOCKS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_locks WHERE NOT granted;
    " 2>/dev/null | xargs)
    
    if [ "$LOCKS" = "0" ]; then
        log_info "No blocking locks detected"
    else
        log_warn "Found $LOCKS blocking locks"
    fi
}

# Check Prisma migration status
check_migrations() {
    log_section "Prisma Migration Status"
    
    # Check if _prisma_migrations table exists
    MIGRATION_TABLE_EXISTS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '_prisma_migrations'
        );
    " 2>/dev/null | xargs)
    
    if [ "$MIGRATION_TABLE_EXISTS" = "t" ]; then
        log_info "Prisma migrations table exists"
        
        # Get migration count
        MIGRATION_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT count(*) FROM _prisma_migrations;
        " 2>/dev/null | xargs)
        log_info "Total migrations: $MIGRATION_COUNT"
        
        # Check for failed migrations
        FAILED_MIGRATIONS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL;
        " 2>/dev/null | xargs)
        
        if [ "$FAILED_MIGRATIONS" = "0" ]; then
            log_info "All migrations completed successfully"
        else
            log_warn "Found $FAILED_MIGRATIONS incomplete migrations"
        fi
    else
        log_warn "Prisma migrations table not found"
    fi
}

# Check disk space
check_disk_space() {
    log_section "Disk Space"
    
    # Container disk usage
    CONTAINER_SIZE=$(docker exec "$CONTAINER_NAME" df -h /var/lib/postgresql/data 2>/dev/null | tail -1)
    log_info "PostgreSQL data directory usage:"
    echo "$CONTAINER_SIZE"
    
    # Check volume usage
    VOLUME_NAME=$(docker inspect --format='{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}' "$CONTAINER_NAME" 2>/dev/null)
    if [ -n "$VOLUME_NAME" ]; then
        log_info "Volume name: $VOLUME_NAME"
    fi
}

# Check connection pool status
check_connection_pool() {
    log_section "Connection Pool"
    
    # Current connections
    CONNECTIONS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';
    " 2>/dev/null | xargs)
    log_info "Current connections: $CONNECTIONS"
    
    # Max connections
    MAX_CONNECTIONS=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT setting FROM pg_settings WHERE name = 'max_connections';
    " 2>/dev/null | xargs)
    log_info "Max connections: $MAX_CONNECTIONS"
    
    # Connection states
    log_info "Connection states:"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT state, count(*) 
        FROM pg_stat_activity 
        WHERE datname = '$DB_NAME'
        GROUP BY state;
    " 2>/dev/null || log_warn "Could not retrieve connection states"
}

# Generate validation report
generate_report() {
    log_section "Validation Summary"
    log_info "Database validation completed at $(date)"
    log_info "All critical checks passed"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           Scrsphere Database Validation Report               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_container
    check_connectivity
    check_database_stats
    check_integrity
    check_migrations
    check_disk_space
    check_connection_pool
    generate_report
}

# Run main function
main "$@"
