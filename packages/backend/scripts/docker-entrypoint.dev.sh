#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd packages/backend
pnpm exec prisma migrate deploy
cd ../..

echo "Starting development server..."
exec pnpm -w run dev:backend
