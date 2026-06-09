# Deployment Scripts

This directory contains scripts for deploying Scrumooth to production environments.

## Available Scripts

### deploy.sh

One-command deployment script for production deployments using **pre-built** Docker images from GHCR.

#### Usage

```bash
./deploy.sh [VERSION] [DOMAIN]
```

#### Examples

```bash
# Deploy latest version to localhost
./deploy.sh

# Deploy specific version to localhost
./deploy.sh 1.0.0

# Deploy specific version to a domain
./deploy.sh 1.0.0 example.com
```

#### What the Script Does

1. **Pre-flight Checks**
   - Verifies Docker is installed and running
   - Verifies OpenSSL is available for secret generation

2. **Pull Docker Images**
   - Pulls backend image from GHCR
   - Pulls frontend image from GHCR
   - Pulls backup service image (optional)

3. **Generate Configuration**
   - Creates `.env.production` file with secure random secrets
   - Generates JWT_SECRET (128 hex characters)
   - Generates DB_PASSWORD (64 hex characters)
   - Prompts for email configuration

4. **Validate Configuration**
   - Runs configuration validation script
   - Checks for required environment variables
   - Validates secret strength
   - Verifies database URL format

5. **Create Docker Compose File**
   - Generates `docker-compose.prod.yml`
   - Configures all services (postgres, backend, frontend, caddy)
   - Sets up health checks and dependencies

6. **Create Caddyfile**
   - Generates reverse proxy configuration
   - Configures TLS (internal for localhost, automatic for domains)
   - Sets up security headers

7. **Deploy Services**
   - Starts all containers
   - Waits for services to become healthy

8. **Verify Deployment**
   - Checks service status
   - Verifies health endpoint responds
   - Displays access URL and next steps

#### Generated Files

The script creates the following files in the current directory:

- `.env.production` - Environment configuration with secrets
- `docker-compose.prod.yml` - Docker Compose configuration
- `Caddyfile` - Reverse proxy configuration

#### Requirements

- Docker 24.0+
- OpenSSL (for secret generation)
- curl (for health checks)

#### Important Notes

**Vite Environment Variables (VITE\_\*)**

Vite environment variables are **build-time variables**, not runtime variables. They are compiled into the frontend JavaScript bundle during the Docker build process. The pre-built images from GHCR already have these values baked in:

| Variable                          | Default Value |
| --------------------------------- | ------------- |
| `VITE_BASE_PATH`                  | `/scrumooth/` |
| `VITE_API_URL`                    | `/api/v1`     |
| `VITE_USE_MOCK_API`               | `false`       |
| `VITE_BACKLOG_ITEM_LIMIT`         | `100`         |
| `VITE_BACKLOG_MAX_ITEMS_PER_GOAL` | `200`         |
| `VITE_LOG_LEVEL`                  | `info`        |

**To customize Vite variables**, you must build the frontend image locally:

```bash
# Set your custom values in .env or environment
export VITE_BASE_PATH=/my-app/
export VITE_API_URL=/api/v2

# Build the frontend image locally
docker compose -f docker-compose.yml build frontend

# Then deploy with the custom image
docker compose -f docker-compose.yml up -d
```

#### Notes

- The script is designed for Linux/macOS
- Windows users should run in WSL or Git Bash
- Email configuration requires manual setup after deployment
- Generated secrets should be stored securely for future reference

## Related Documentation

- [Main Deployment Guide](../../docs/deployment/DEPLOYMENT.md)
- [Database Maintenance Scripts](../maintenance/database/)
- [Local Development with docker-compose.yml](../../docker-compose.yml)
