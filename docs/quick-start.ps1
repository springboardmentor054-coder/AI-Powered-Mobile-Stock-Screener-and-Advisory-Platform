# Quick Start - Install Dependencies

Write-Host "`n🚀 Stock Screener - Quick Start`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if we're in the correct directory
if (-not (Test-Path ".\backend\package.json")) {
    Write-Host "❌ Error: Run this script from the Stock_screener directory" -ForegroundColor Red
    exit 1
}

# Backend setup
Write-Host "`n📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend

# Check if node_modules exists
if (-not (Test-Path ".\node_modules")) {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Backend dependencies already installed" -ForegroundColor Green
}

Set-Location ..

# Flutter setup
Write-Host "`n📱 Installing Flutter Dependencies..." -ForegroundColor Yellow
Set-Location stock_screener_app

# Check if flutter is available
$flutterExists = Get-Command flutter -ErrorAction SilentlyContinue
if ($flutterExists) {
    flutter pub get
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Flutter dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install Flutter dependencies" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Flutter not found - skipping Flutter setup" -ForegroundColor Yellow
    Write-Host "   Install Flutter from: https://flutter.dev/docs/get-started/install" -ForegroundColor Gray
}

Set-Location ..

# Check for .env file
Write-Host "`n⚙️  Checking Configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".\backend\.env")) {
    Write-Host "⚠️  No .env file found in backend folder" -ForegroundColor Yellow
    Write-Host "   Creating sample .env file..." -ForegroundColor Gray
    
    $envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_screener
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=5000

# OpenAI API (Get key from https://platform.openai.com/api-keys)
OPENAI_API_KEY=your_openai_api_key_here

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
"@
    
    $envContent | Out-File -FilePath ".\backend\.env" -Encoding utf8
    Write-Host "✅ Created .env file - Please update with your credentials" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "`n✅ Setup Complete!`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with your credentials:" -ForegroundColor White
Write-Host "   - PostgreSQL credentials" -ForegroundColor Gray
Write-Host "   - OpenAI API key" -ForegroundColor Gray
Write-Host "   - Redis settings (optional)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start PostgreSQL database" -ForegroundColor White
Write-Host ""
Write-Host "3. Start Redis (optional but recommended):" -ForegroundColor White
Write-Host "   redis-server" -ForegroundColor Gray
Write-Host "   OR" -ForegroundColor Gray
Write-Host "   docker run -d -p 6379:6379 redis" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "5. In another terminal, start Flutter app:" -ForegroundColor White
Write-Host "   cd stock_screener_app" -ForegroundColor Gray
Write-Host "   flutter run" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Test the API:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   node verify-complete.js" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For detailed instructions, see SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
