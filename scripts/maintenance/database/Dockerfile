# =============================================================================
# Scrumooth Backup Service - Dockerfile
# =============================================================================
# Lightweight image for automated database backups
# =============================================================================

FROM postgres:18-alpine

# Build arguments for labels
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF

# OCI Image Labels
LABEL org.opencontainers.image.title="Scrumooth Backup Service" \
      org.opencontainers.image.description="Automated backup service for Scrumooth PostgreSQL database" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Scrumooth" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/orbivort/scrumooth"

# Install required tools
RUN apk add --no-cache \
    bash \
    curl \
    gzip \
    jq

# Create backup directory
RUN mkdir -p /backups && chmod 755 /backups

# Copy backup scripts
COPY db-backup.sh /scripts/db-backup.sh
COPY db-restore.sh /scripts/db-restore.sh
COPY db-validate.sh /scripts/db-validate.sh
COPY db-volume-backup.sh /scripts/db-volume-backup.sh
COPY db-volume-restore.sh /scripts/db-volume-restore.sh

# Make scripts executable
RUN chmod +x /scripts/*.sh

# Health check - verify cron is running
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \
  CMD pgrep crond > /dev/null || exit 1

# Default environment variables
ENV BACKUP_SCHEDULE="0 2 * * *" \
    BACKUP_RETENTION_DAYS=30 \
    BACKUP_COMPRESS=true

# Entrypoint script
COPY <<'EOF' /entrypoint.sh
#!/bin/bash
set -e

echo "=========================================="
echo "Scrumooth Backup Service"
echo "=========================================="
echo "Schedule: ${BACKUP_SCHEDULE}"
echo "Retention: ${BACKUP_RETENTION_DAYS} days"
echo "Compression: ${BACKUP_COMPRESS}"
echo "=========================================="

# Wait for database to be ready
echo "Waiting for database..."
until pg_isready -h "${PGHOST:-postgres}" -U "${PGUSER:-postgres}" > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 5
done
echo "Database is ready!"

# Setup cron job
echo "${BACKUP_SCHEDULE} cd /scripts && ./db-backup.sh /backups >> /backups/backup.log 2>&1" | crontab -

# Start cron daemon
echo "Starting backup scheduler..."
exec crond -f -l 2
EOF

RUN chmod +x /entrypoint.sh

# Volume for backups
VOLUME ["/backups"]

# Start the backup service
ENTRYPOINT ["/entrypoint.sh"]
