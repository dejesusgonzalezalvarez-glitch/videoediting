# ============================================================================
# scripts/run_capture.ps1
# Inicia servidor HTTP, captura frames con Playwright, y detiene el servidor.
# ============================================================================

$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

# Matar cualquier proceso previo en el puerto 8765
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*http_server*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Iniciar servidor HTTP en segundo plano
Write-Host "Iniciando servidor HTTP..." -ForegroundColor Cyan
$serverProc = Start-Process node -ArgumentList "scripts/http_server.js" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3

try {
    Write-Host "Ejecutando captura de frames..." -ForegroundColor Cyan
    node scripts/capture_bukele_en.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error en la captura" -ForegroundColor Red
        exit 1
    }
} finally {
    Write-Host "Deteniendo servidor HTTP..." -ForegroundColor Cyan
    Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "Captura finalizada." -ForegroundColor Green
