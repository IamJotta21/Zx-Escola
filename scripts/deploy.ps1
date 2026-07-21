#!/usr/bin/env pwsh
# =============================================================================
# Zx-Escola — Automated Deployment Helper
# Helps install Vercel CLI, authenticate, and push the build to production.
# Run from project root: .\scripts\deploy.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Zx-Escola — Iniciando Assistente de Implantação Vercel/Supabase`n" -ForegroundColor Cyan

# 1. Check/Install Vercel CLI
Write-Host "🔍 Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "  ℹ️  Vercel CLI não encontrado. Instalando via npm globalmente..." -ForegroundColor Gray
    npm install -g vercel
    Write-Host "  ✅ Vercel CLI instalado com sucesso!`n" -ForegroundColor Green
} else {
    Write-Host "  ✅ Vercel CLI já está instalado.`n" -ForegroundColor Green
}

# 2. Login
Write-Host "🔑 Autenticação na Vercel" -ForegroundColor Yellow
Write-Host "  Isso abrirá seu navegador para login seguro. Pressione Enter para continuar..." -ForegroundColor Gray
$null = Read-Host
vercel login

# 3. Deploy
Write-Host "`n🚀 Iniciando deploy..." -ForegroundColor Yellow
Write-Host "  Siga as perguntas na tela para configurar seu projeto Vercel." -ForegroundColor Gray
vercel

Write-Host "`n🎉 Configuração concluída! Agora você pode adicionar suas variáveis de ambiente (como DATABASE_URL) no console da Vercel." -ForegroundColor Green
