# Scripts Directory

This directory contains all utility scripts for the Scrsphere project, organized by functional category.

## Directory Structure

```
scripts/
├── deployment/        # Deployment scripts
├── maintenance/       # Maintenance scripts
│   └── database/      # Database maintenance scripts
└── utility/           # Utility scripts
```

## Categories

### 🚀 deployment/

Scripts for deploying the application to various environments.

| Script       | Platform    | Purpose                                      |
| ------------ | ----------- | -------------------------------------------- |
| `deploy.ps1` | Windows     | Production deployment with environment setup |
| `dev.sh`     | Linux/macOS | Development environment startup              |
| `prod.sh`    | Linux/macOS | Production environment startup               |

**Windows Usage:**

```powershell
.\scripts\deployment\deploy.ps1 -Setup              # First-time setup
.\scripts\deployment\deploy.ps1 -Deploy             # Start deployment
.\scripts\deployment\deploy.ps1 -Stop               # Stop containers
.\scripts\deployment\deploy.ps1 -Logs               # View logs
.\scripts\deployment\deploy.ps1 -Clean              # Full cleanup
```

**Linux/macOS Usage:**

```bash
./scripts/deployment/dev.sh    # Development environment
./scripts/deployment/prod.sh   # Production environment
```

### 🔧 maintenance/

Scripts for maintaining the application, including database operations.

#### maintenance/database/

PostgreSQL database maintenance scripts for backup, restore, and validation.

| Script                    | Purpose                      |
| ------------------------- | ---------------------------- |
| `db-backup.sh`            | Create compressed SQL backup |
| `db-restore.sh`           | Restore from SQL backup      |
| `db-validate.sh`          | Validate database integrity  |
| `db-volume-backup.sh`     | Create volume-level backup   |
| `db-volume-restore.sh`    | Restore from volume backup   |
| `DATABASE_MAINTENANCE.md` | Comprehensive documentation  |

**Quick Reference:**

```bash
# Validate database
./scripts/maintenance/database/db-validate.sh

# Create backup
./scripts/maintenance/database/db-backup.sh [./backups]

# Restore from backup
./scripts/maintenance/database/db-restore.sh <backup_file>
```

See [DATABASE_MAINTENANCE.md](./maintenance/database/DATABASE_MAINTENANCE.md) for detailed documentation.

### 🛠️ utility/

General utility scripts for development and code quality.

| Script                        | Purpose                             | Usage                                                       |
| ----------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `check-package-manager.js`    | Enforces pnpm usage                 | Auto-run via npm pre-scripts                                |
| `eslint-plugin-icon-rules.js` | ESLint plugin for icon usage        | Integrated in ESLint config                                 |
| `generate-icon-types.ts`      | Generate TypeScript types for icons | `pnpm --filter=@scrsphere/frontend run generate:icon-types` |

## Naming Conventions

- **Shell scripts**: Use kebab-case with `.sh` extension (e.g., `db-backup.sh`)
- **JavaScript/TypeScript**: Use kebab-case with appropriate extension (e.g., `check-package-manager.js`)
- **PowerShell**: Use kebab-case with `.ps1` extension (e.g., `deploy.ps1`)
- **Documentation**: Use UPPERCASE with `.md` extension (e.g., `DATABASE_MAINTENANCE.md`)

## Adding New Scripts

When adding new scripts:

1. Determine the appropriate category subdirectory
2. Follow the naming conventions above
3. Include a header comment explaining the script's purpose
4. Update this README with the new script's documentation
5. If the script affects project configuration, update relevant documentation

## Related Documentation

- [Deployment Guide](../docs/deployment/deployment-guide.md)
- [Database Maintenance](./maintenance/database/DATABASE_MAINTENANCE.md)
- [Development Standards](../docs/development/)
