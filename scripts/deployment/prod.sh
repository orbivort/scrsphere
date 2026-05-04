#!/bin/bash
# Production Docker startup script

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting Scrsphere production environment..."

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "Error: .env file not found. Please create .env file with production values."
    exit 1
fi

# Change to project root and start production containers
cd "$PROJECT_ROOT"
docker-compose up --build -d

echo "Production environment started!"
echo "Frontend: http://localhost"
echo "Backend: http://localhost:5000"
echo "Database: localhost:5432"
