#!/usr/bin/env pwsh
# =============================================================================
# Zx-Escola — Setup Script (Windows PowerShell)
# Installs dependencies and initializes the database for first use.
# Run from project root: .\scripts\setup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "[ZX-ESCOLA] Zx-Escola - Configuracao Inicial" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# 1. Check Node
Write-Host "`n[1/6] Verificando versao do Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Node.js nao encontrado. Instale Node 20+ em https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green

# 2. Check npm
$npmVersion = npm --version 2>&1
Write-Host "[OK] npm $npmVersion" -ForegroundColor Green

# 3. Install backend dependencies
Write-Host "`n[2/6] Instalando dependencias do Backend..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "[OK] Backend deps instaladas" -ForegroundColor Green

# 4. Setup backend environment file
Write-Host "`n[3/6] Configurando arquivo .env do Backend..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".env")) {
        # If no .env.example, write a minimal one
        $envContent = 'PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="zx-escola-jwt-secret-mude-em-producao-use-32chars-aleatorio"
JWT_REFRESH_SECRET="zx-escola-refresh-secret-mude-em-producao-32chars"
SUPABASE_URL=""
SUPABASE_KEY=""
SUPABASE_BUCKET="school-storage"
OPENAI_API_KEY=
ALLOWED_ORIGINS=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200'
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
    }
    Write-Host "[OK] Arquivo .env criado" -ForegroundColor Green
} else {
    Write-Host "[OK] Arquivo .env ja existe (mantido)" -ForegroundColor Green
}

# 5. Run DB migrations and generate Prisma client
Write-Host "`n[4/6] Executando migracoes do banco de dados..." -ForegroundColor Yellow
npx prisma migrate deploy --schema=src/prisma/schema.prisma
Write-Host "[OK] Migracoes aplicadas" -ForegroundColor Green

Write-Host "`n[5/6] Gerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate --schema=src/prisma/schema.prisma
Write-Host "[OK] Prisma Client gerado" -ForegroundColor Green

# 6. Seed the database
Write-Host "`n[6/6] Populando banco com dados iniciais (seed)..." -ForegroundColor Yellow
npm run seed
Write-Host "[OK] Seed concluido" -ForegroundColor Green

# 7. Install frontend dependencies
Set-Location ../frontend
Write-Host "`n[EXTRA] Instalando dependencias do Frontend..." -ForegroundColor Yellow
npm install
Write-Host "[OK] Frontend deps instaladas" -ForegroundColor Green

Set-Location ..

Write-Host "`n[SUCESSO] Setup concluido com sucesso!" -ForegroundColor Green
Write-Host "Para iniciar em desenvolvimento, execute:" -ForegroundColor Cyan
Write-Host "  .\scripts\dev.ps1" -ForegroundColor White
