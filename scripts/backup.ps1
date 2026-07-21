#!/usr/bin/env pwsh
# =============================================================================
# Zx-Escola — Backup Script (SQLite)
# Creates a timestamped backup of the SQLite database and uploads directory.
# Schedule with Windows Task Scheduler for automated backups.
# Run from project root: .\scripts\backup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir  = Join-Path $PSScriptRoot "..\backups\$timestamp"
$dbSource   = Join-Path $PSScriptRoot "..\backend\src\prisma\dev.db"
$uploadsDir = Join-Path $PSScriptRoot "..\backend\src\uploads"

Write-Host "💾 Zx-Escola — Backup [$timestamp]" -ForegroundColor Cyan

# Create backup folder
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup SQLite database
if (Test-Path $dbSource) {
    Copy-Item $dbSource "$backupDir\dev_$timestamp.db"
    Write-Host "  ✅ Banco de dados: $backupDir\dev_$timestamp.db" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Banco de dados não encontrado em: $dbSource" -ForegroundColor Yellow
}

# Backup uploads directory
if (Test-Path $uploadsDir) {
    $uploadsBackup = "$backupDir\uploads"
    Copy-Item $uploadsDir $uploadsBackup -Recurse -Force
    Write-Host "  ✅ Uploads: $uploadsBackup" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Diretório uploads não encontrado (ignorado)" -ForegroundColor Gray
}

# Keep only last 30 backups
$allBackups = Get-ChildItem (Join-Path $PSScriptRoot "..\backups") -Directory | Sort-Object Name
if ($allBackups.Count -gt 30) {
    $toDelete = $allBackups | Select-Object -First ($allBackups.Count - 30)
    foreach ($dir in $toDelete) {
        Remove-Item $dir.FullName -Recurse -Force
        Write-Host "  🗑️  Backup antigo removido: $($dir.Name)" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 Backup concluído: $backupDir" -ForegroundColor Green
