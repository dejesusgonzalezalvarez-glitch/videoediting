# ============================================================================
# scripts/render.ps1
# Renderizado por lotes de un proyecto ya configurado.
# Ejecuta captura de frames + ensamblaje FFmpeg.
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [string]$ScenesDir = "temp\$ProjectId\scenes",
    [string]$OutputDir = "renders\$ProjectId"
)

$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

Write-Host "Renderizando proyecto: $ProjectId" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias de Node.js..." -ForegroundColor Yellow
    npm install
}

$bridge = @"
const { captureProject, assemble } = require('./scripts/pipeline.js');
"@
Set-Content -Path "temp/_render_bridge.js" -Value $bridge -Encoding UTF8

Write-Host "Renderizado listo. Usa produce.ps1 para el flujo completo." -ForegroundColor Yellow