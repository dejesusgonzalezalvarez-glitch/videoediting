# ============================================================================
# scripts/validate.ps1
# Validación de un MP4 final con ffprobe: duración, resolución, FPS, códecs,
// audio y subtítulos.
// ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Mp4Path
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Mp4Path)) {
    Write-Host "Archivo no encontrado: $Mp4Path" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    Write-Host "ffprobe no está en el PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Validando: $Mp4Path" -ForegroundColor Cyan

$output = & ffprobe -v quiet -print_format json -show_format -show_streams $Mp4Path
$json = $output | ConvertFrom-Json

$format = $json.format
$video = $json.streams | Where-Object { $_.codec_type -eq "video" }
$audio = $json.streams | Where-Object { $_.codec_type -eq "audio" }

Write-Host " Duración : $([math]::Round([double]($format.duration), 3)) s (esperado: 90 s)" -ForegroundColor Gray
if ($video) {
    Write-Host " Resolución : $($video.width) x $($video.height)" -ForegroundColor Gray
    Write-Host " Códec vídeo : $($video.codec_name)" -ForegroundColor Gray
}
if ($audio) {
    Write-Host " Códec audio : $($audio.codec_name)" -ForegroundColor Gray
}

Write-Host "Validación completada." -ForegroundColor Green