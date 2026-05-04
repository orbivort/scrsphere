# Maintenance Scripts

This directory contains scripts for maintaining the Scrsphere application.

## Subdirectories

### database/

PostgreSQL database maintenance scripts including backup, restore, and validation operations.

See [database/DATABASE_MAINTENANCE.md](./database/DATABASE_MAINTENANCE.md) for comprehensive documentation.

## Quick Reference

| Task              | Command                                                      |
| ----------------- | ------------------------------------------------------------ |
| Validate Database | `./scripts/maintenance/database/db-validate.sh`              |
| Create Backup     | `./scripts/maintenance/database/db-backup.sh`                |
| Restore Backup    | `./scripts/maintenance/database/db-restore.sh <file>`        |
| Volume Backup     | `./scripts/maintenance/database/db-volume-backup.sh`         |
| Volume Restore    | `./scripts/maintenance/database/db-volume-restore.sh <file>` |
