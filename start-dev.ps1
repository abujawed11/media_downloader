# Media Downloader Development Startup Script
# This script starts both backend and frontend in development mode

Write-Host "🚀 Starting Media Downloader Development Environment" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Function to start backend
function Start-Backend {
    Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Blue
    Set-Location "backend"
    
    # Install Python dependencies if requirements.txt exists
    if (Test-Path "requirements.txt") {
        Write-Host "📦 Installing Python dependencies..." -ForegroundColor Blue
        pip install -r requirements.txt
    }
    
    # Start the FastAPI server
    Write-Host "🚀 Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "python start.py"
    
    Set-Location ".."
}

# Function to start frontend
function Start-Frontend {
    Write-Host "`n📱 Starting React Native App..." -ForegroundColor Blue
    Set-Location "frontend"
    
    # Install npm dependencies
    if (Test-Path "package.json") {
        Write-Host "📦 Installing npm dependencies..." -ForegroundColor Blue
        npm install
    }
    
    # Start Metro bundler
    Write-Host "🚀 Starting Metro bundler..." -ForegroundColor Green
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "npm start"
    
    # Wait a moment, then start Android app
    Start-Sleep -Seconds 5
    Write-Host "📱 Starting Android app..." -ForegroundColor Green
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "npm run android"
    
    Set-Location ".."
}

# Main execution
Write-Host "`n🔄 Starting services..." -ForegroundColor Yellow

# Start backend in background
Start-Backend

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend
Start-Frontend

Write-Host "`n✅ Development environment started!" -ForegroundColor Green
Write-Host "🌐 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📖 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "📱 React Native Metro: http://localhost:8081" -ForegroundColor Cyan
Write-Host "`n⏹️  Close all PowerShell windows to stop all services" -ForegroundColor Yellow

# Keep this window open
Read-Host "Press Enter to exit this script (services will continue running)"
