#!/bin/bash
# Development Docker startup script

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting Scrsphere development environment..."

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    else
        echo "Error: .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Change to project root and start development containers
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.dev.yml up --build -d

echo "Development environment started!"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
echo "Database: localhost:5432"
