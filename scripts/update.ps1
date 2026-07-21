#!/usr/bin/env pwsh
# =============================================================================
# Zx-Escola — Update Script
# Pulls latest code, installs dependencies, runs migrations, rebuilds frontend.
# Run from project root: .\scripts\update.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🔄 Zx-Escola — Atualização do Sistema" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 1. Run backup first
Write-Host "`n[0] Fazendo backup antes de atualizar..." -ForegroundColor Yellow
& "$PSScriptRoot\backup.ps1"

# 2. Pull latest code (if using git)
if (Test-Path (Join-Path $PSScriptRoot "..\\.git")) {
    Write-Host "`n[1/5] Atualizando código via Git..." -ForegroundColor Yellow
    Set-Location (Join-Path $PSScriptRoot "..")
    git pull origin main
    Write-Host "✅ Código atualizado" -ForegroundColor Green
} else {
    Write-Host "`n[1/5] Git não detectado — pulando git pull" -ForegroundColor Gray
}

# 3. Update backend dependencies & migrate
Write-Host "`n[2/5] Atualizando Backend..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..\backend")
npm install
npx prisma migrate deploy --schema=src/prisma/schema.prisma
npx prisma generate --schema=src/prisma/schema.prisma
Write-Host "✅ Backend atualizado e migrações aplicadas" -ForegroundColor Green

# 4. Update frontend dependencies & build
Write-Host "`n[3/5] Atualizando Frontend..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..\frontend")
npm install
npm run build
Write-Host "✅ Frontend atualizado e build gerado" -ForegroundColor Green

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "`n🎉 Sistema atualizado com sucesso!" -ForegroundColor Green
Write-Host "Reinicie os servidores para aplicar as mudanças." -ForegroundColor Cyan
