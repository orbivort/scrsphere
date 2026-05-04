#!/usr/bin/env pwsh
# ===========================================
# Scrsphere Production Deployment Script
# ===========================================
# This script helps set up and deploy the
# Scrsphere application to a local environment
# for testing before physical server deployment.
# ===========================================

param(
    [switch]$Setup,
    [switch]$Deploy,
    [switch]$Stop,
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

function Show-Help {
    Write-Host @"
Scrsphere Deployment Script
===========================

Usage: .\scripts\deployment\deploy.ps1 [options]

Options:
    -Setup      Create .env file from template and generate secrets
    -Deploy     Build and start all containers
    -Stop       Stop all containers
    -Clean      Remove containers, volumes, and clean up
    -Logs       Show container logs
    -Help       Show this help message

Examples:
    .\scripts\deployment\deploy.ps1 -Setup              # First-time setup
    .\scripts\deployment\deploy.ps1 -Deploy             # Start deployment
    .\scripts\deployment\deploy.ps1 -Stop               # Stop containers
    .\scripts\deployment\deploy.ps1 -Clean              # Full cleanup
    .\scripts\deployment\deploy.ps1 -Setup -Deploy      # Setup and deploy in one command

"@
}

function New-RandomSecret {
    param([int]$Length = 64)
    $bytes = New-Object byte[] $Length
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLower()
}

function Invoke-Setup {
    Write-Host "Setting up environment..." -ForegroundColor Cyan
    
    $envFile = Join-Path $ProjectRoot ".env"
    $envExample = Join-Path $ProjectRoot ".env.example"
    
    if (Test-Path $envFile) {
        Write-Host ".env file already exists. Do you want to overwrite it? (y/N): " -NoNewline -ForegroundColor Yellow
        $response = Read-Host
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "Setup cancelled." -ForegroundColor Yellow
            return
        }
    }
    
    # Generate secrets
    Write-Host "Generating secure secrets..." -ForegroundColor Green
    $dbPassword = New-RandomSecret -Length 32
    $jwtSecret = New-RandomSecret -Length 64
    
    # Create .env file
    $envContent = @"
# ===========================================
# Scrsphere Production Environment Configuration
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ===========================================

# Database Configuration
DATABASE_URL=postgresql://postgres:${dbPassword}@postgres:5432/scrsphere
DB_USER=postgres
DB_PASSWORD=${dbPassword}
DB_NAME=scrsphere

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host ".env file created with secure secrets!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Keep the .env file secure and never commit it to version control!" -ForegroundColor Yellow
}

function Invoke-Deploy {
    Write-Host "Starting deployment..." -ForegroundColor Cyan
    
    $envFile = Join-Path $ProjectRoot ".env"
    
    if (-not (Test-Path $envFile)) {
        Write-Host "ERROR: .env file not found!" -ForegroundColor Red
        Write-Host "Run '.\scripts\deployment\deploy.ps1 -Setup' first to create the environment file." -ForegroundColor Yellow
        return
    }
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    } catch {
        Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
        return
    }
    
    # Check for port conflicts
    Write-Host "Checking for port conflicts..." -ForegroundColor Green
    $ports = @(80, 5000)
    $conflicts = @()
    
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $conflicts += $port
        }
    }
    
    if ($conflicts.Count -gt 0) {
        Write-Host "WARNING: The following ports are in use: $($conflicts -join ', ')" -ForegroundColor Yellow
        Write-Host "Do you want to continue anyway? (y/N): " -NoNewline
        $response = Read-Host
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "Deployment cancelled." -ForegroundColor Yellow
            return
        }
    }
    
    # Build and start containers
    Write-Host "Building and starting containers..." -ForegroundColor Green
    Set-Location $ProjectRoot
    
    docker-compose up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services:" -ForegroundColor Cyan
        Write-Host "  Frontend:  http://localhost"
        Write-Host "  Backend:   http://localhost:5000"
        Write-Host "  API Docs:  http://localhost:5000/api/v1"
        Write-Host ""
        Write-Host "Run '.\scripts\deployment\deploy.ps1 -Logs' to view container logs." -ForegroundColor Yellow
        Write-Host "Run '.\scripts\deployment\deploy.ps1 -Stop' to stop the deployment." -ForegroundColor Yellow
    } else {
        Write-Host "Deployment failed! Check the logs for details." -ForegroundColor Red
    }
}

function Invoke-Stop {
    Write-Host "Stopping containers..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    docker-compose down
    Write-Host "Containers stopped." -ForegroundColor Green
}

function Invoke-Clean {
    Write-Host "Cleaning up..." -ForegroundColor Cyan
    Write-Host "WARNING: This will remove all containers, volumes, and the database!" -ForegroundColor Yellow
    Write-Host "Are you sure? (y/N): " -NoNewline
    $response = Read-Host
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Set-Location $ProjectRoot
        docker-compose down -v --remove-orphans
        Write-Host "Cleanup complete." -ForegroundColor Green
    } else {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    }
}

function Show-Logs {
    Write-Host "Showing container logs (Ctrl+C to exit)..." -ForegroundColor Cyan
    Set-Location $ProjectRoot
    docker-compose logs -f
}

# Main
if ($Help -or (-not $Setup -and -not $Deploy -and -not $Stop -and -not $Clean -and -not $Logs)) {
    Show-Help
    exit 0
}

if ($Setup) { Invoke-Setup }
if ($Deploy) { Invoke-Deploy }
if ($Stop) { Invoke-Stop }
if ($Clean) { Invoke-Clean }
if ($Logs) { Show-Logs }
