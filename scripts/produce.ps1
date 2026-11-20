# ============================================================================
# scripts/produce.ps1
# Script principal de producción del Estudio Audiovisual Automatizado (Windows).
# Orquesta el flujo completo: escenas -> captura -> audio -> subtítulos ->
# ensamblaje FFmpeg -> validación MP4.
#
# Uso:
#   .\scripts\produce.ps1 -ProjectId "mi-video" -Theme "El sistema solar"
#
# Requisitos: Node.js, Python, FFmpeg, Playwright (Chromium), Kokoro TTS.
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [string]$Theme,

    [string]$Style = "cinematic",

    [string]$Instructions = "",

    [switch]$SkipCleanup
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootDir = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $rootDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " ESTUDIO AUDIOVISUAL - PRODUCCIÓN AUTOMATIZADA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Proyecto : $ProjectId"
Write-Host " Tema     : $Theme"
Write-Host " Estilo   : $Style" -ForegroundColor Gray

# --- Verificar herramientas -------------------------------------------------
function Test-Tool($name) {
    if (Get-Command $name -ErrorAction SilentlyContinue) {
        Write-Host " [OK] $name encontrado" -ForegroundColor Green
        return $true
    }
    Write-Host " [FALTA] $name no está instalado o no está en el PATH" -ForegroundColor Red
    return $false
}

$toolsOk = $true
foreach ($t in @("node", "npm", "python", "ffmpeg", "ffprobe")) {
    if (-not (Test-Tool $t)) { $toolsOk = $false }
}

if (-not $toolsOk) {
    Write-Host "Faltan herramientas. Instálalas antes de continuar." -ForegroundColor Red
    exit 1
}

# --- Verificar dependencias de Node ----------------------------------------
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias de Node.js..." -ForegroundColor Yellow
    npm install
}

# --- Construir el storyboard desde las instrucciones ------------------------
# El storyboard se define aquí según el tema y estilo. En el futuro se podrá
# generar automáticamente desde un LLM o instrucciones de lenguaje natural.
$storyboard = @(
    @{ id = "intro"; start = 0; end = 10; type = "3d"; config = @{ typography = "<div>INTRODUCCIÓN: $Theme</div>" } },
    @{ id = "contenido"; start = 10; end = 70; type = "astronomy"; config = @{ } },
    @{ id = "conclusion"; start = 70; end = 90; type = "3d"; config = @{ typography = "<div>CONCLUSIÓN</div>" } }
)

$storyboardJson = $storyboard | ConvertTo-Json -Depth 5

# --- Ejecutar el pipeline de Node.js ---------------------------------------
Write-Host "Ejecutando pipeline de producción..." -ForegroundColor Yellow
$nodeArgs = @(
    "--input", $storyboardJson,
    "--projectId", $ProjectId,
    "--theme", $Theme,
)

# El pipeline.js está diseñado para ser invocado desde aquí con argumentos.
# Como runPipeline recibe un objeto, usamos un script puente temporal.
$bridge = @"
import { runPipeline } from './scripts/pipeline.js';
const storyboard = $storyboardJson;
(async () => {
  const result = await runPipeline({
    projectId: '$ProjectId',
    storyboard: storyboard,
    narrationText: 'Narración de ejemplo para $Theme en español.',
    subtitleSegments: [
      { start: 0, end: 10, text: 'Introducción a $Theme.' },
      { start: 10, end: 70, text: 'Contenido educativo sobre $Theme.' },
      { start: 70, end: 90, text: 'Conclusión.' }
    ],
    audio: { voice: 'af_heart' }
  });
  console.log(JSON.stringify(result));
  process.exit(result.success ? 0 : 1);
})();
"@
$bridgePath = Join-Path $rootDir "temp/_bridge.js"
New-Item -ItemType Directory -Path (Split-Path $bridgePath) -Force | Out-Null
Set-Content -Path $bridgePath -Value $bridge -Encoding UTF8

try {
    & node $bridgePath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "El pipeline falló. Revisa temp/errors.log" -ForegroundColor Red
        exit 1
    }
} finally {
    if (-not $SkipCleanup) {
        Remove-Item $bridgePath -ErrorAction SilentlyContinue
    }
}

Write-Host "Producción completada. Revisa la carpeta renders/." -ForegroundColor Green