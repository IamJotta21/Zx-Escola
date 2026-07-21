#!/usr/bin/env pwsh
# =============================================================================
# Zx-Escola — Development Start Script
# Starts both Backend and Frontend servers in parallel.
# Run from project root: .\scripts\dev.ps1
# =============================================================================

Write-Host "[INICIANDO] Iniciando Zx-Escola em modo Desenvolvimento..." -ForegroundColor Cyan

# Start backend in new window
$backendJob = Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$PSScriptRoot\..\backend'; npm run dev" -PassThru

# Small delay to let backend start first
Start-Sleep -Seconds 2

# Start frontend in new window
$frontendJob = Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$PSScriptRoot\..\frontend'; npm run dev" -PassThru

Write-Host "`n[OK] Servidores iniciados!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Health:   http://localhost:3000/health" -ForegroundColor Cyan
Write-Host "`nFeche as janelas do PowerShell para parar os servidores." -ForegroundColor Yellow
