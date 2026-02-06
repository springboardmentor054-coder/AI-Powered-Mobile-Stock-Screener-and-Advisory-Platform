# Stock Screener Pro - Quick Start Script
# This script helps you start both backend and frontend

Write-Host "Stock Screener Pro - Startup Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend/.env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "WARNING: backend/.env file not found!" -ForegroundColor Yellow
    Write-Host "Please create backend/.env with the following content:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DB_HOST=localhost" -ForegroundColor Gray
    Write-Host "DB_PORT=5432" -ForegroundColor Gray
    Write-Host "DB_NAME=stock_screener" -ForegroundColor Gray
    Write-Host "DB_USER=postgres" -ForegroundColor Gray
    Write-Host "DB_PASSWORD=your_password" -ForegroundColor Gray
    Write-Host "PORT=5000" -ForegroundColor Gray
    Write-Host "GROQ_API_KEY=your_groq_api_key" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if Flutter is installed
try {
    $flutterVersion = flutter --version | Select-String "Flutter" | Select-Object -First 1
    Write-Host "Flutter: $flutterVersion" -ForegroundColor Green
} catch {
    Write-Host "Flutter not found. You'll need it to run the mobile app" -ForegroundColor Yellow
}

# Check if PostgreSQL is running
Write-Host ""
Write-Host "Checking PostgreSQL..." -ForegroundColor Green
try {
    $pgProcess = Get-Process postgres -ErrorAction SilentlyContinue
    if ($pgProcess) {
        Write-Host "PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL may not be running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check PostgreSQL status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1. Start Backend Server only" -ForegroundColor White
Write-Host "2. Start Flutter App only" -ForegroundColor White
Write-Host "3. Start Both (Backend + Flutter)" -ForegroundColor White
Write-Host "4. Install Dependencies" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Backend Server..." -ForegroundColor Green
        Set-Location backend
        npm start
    }
    "2" {
        Write-Host ""
        Write-Host "Starting Flutter App..." -ForegroundColor Green
        Set-Location stock_screener_app
        flutter run
    }
    "3" {
        Write-Host ""
        Write-Host "Starting Backend Server in new window..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"
        
        Start-Sleep -Seconds 3
        
        Write-Host "Starting Flutter App..." -ForegroundColor Green
        Set-Location stock_screener_app
        flutter run
    }
    "4" {
        Write-Host ""
        Write-Host "Installing Backend Dependencies..." -ForegroundColor Green
        Set-Location backend
        npm install
        
        Write-Host ""
        Write-Host "Installing Flutter Dependencies..." -ForegroundColor Green
        Set-Location ..\stock_screener_app
        flutter pub get
        
        Write-Host ""
        Write-Host "All dependencies installed!" -ForegroundColor Green
    }
    "5" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}
