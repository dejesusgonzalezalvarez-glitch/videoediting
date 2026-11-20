# render_dbcooper.ps1
# Render script for D.B. Cooper short film

$ErrorActionPreference = "Stop"

$BLENDER = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
$PROJECT = "C:\Users\Roberth 2\Desktop\Gilmer\Creación de videos con IA\projects\db-cooper"
$SCENE_PY = "$PROJECT\scene.py"
$OUT_DIR = "$PROJECT\renders"
$FINAL_DIR = "$PROJECT\exports"

Write-Host "=== D.B. Cooper Render Pipeline ===" -ForegroundColor Cyan
Write-Host "Blender: $BLENDER"
Write-Host "Project: $PROJECT"
Write-Host "Output:  $OUT_DIR"

# Create directories
New-Item -ItemType Directory -Force -Path $OUT_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $FINAL_DIR | Out-Null

# Step 1: Gate renders (middle frame of each shot for review)
Write-Host "`n=== STEP 1: Gate Renders ===" -ForegroundColor Yellow
$GATE_DIR = "$OUT_DIR\_gate"
New-Item -ItemType Directory -Force -Path $GATE_DIR | Out-Null

& $BLENDER -b -P $SCENE_PY -- gate $GATE_DIR 2>&1 | Tee-Object -Variable gateLog
$gateLog

# Step 2: Full render (all 1500 frames)
Write-Host "`n=== STEP 2: Full Render (1500 frames) ===" -ForegroundColor Yellow
Write-Host "This will take approximately 20-40 minutes on RX 580..." -ForegroundColor Gray

& $BLENDER -b -P $SCENE_PY -- frames $OUT_DIR 0 1500 64 2>&1 | Tee-Object -Variable renderLog
$renderLog

# Step 3: Assemble with FFmpeg
Write-Host "`n=== STEP 3: Assemble MP4 ===" -ForegroundColor Yellow
$FFMPEG = "ffmpeg"
$INPUT_PATTERN = "$OUT_DIR\f%04d.png"
$OUTPUT_MP4 = "$FINAL_DIR\db_cooper_final.mp4"

# Check if frames exist
$frameCount = (Get-ChildItem $OUT_DIR -Filter "f*.png").Count
Write-Host "Frames rendered: $frameCount / 1500"

if ($frameCount -ge 1400) {
    & $FFMPEG -y -framerate 30 -i $INPUT_PATTERN `
        -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p `
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" `
        -movflags +faststart $OUTPUT_MP4 2>&1 | Tee-Object -Variable ffmpegLog
    $ffmpegLog
    
    Write-Host "`n=== COMPLETE ===" -ForegroundColor Green
    Write-Host "Output: $OUTPUT_MP4"
    
    # Verify
    & $FFMPEG -i $OUTPUT_MP4 2>&1 | Select-String "Duration|Stream.*Video|Stream.*Audio"
} else {
    Write-Host "ERROR: Not enough frames rendered ($frameCount/1500)" -ForegroundColor Red
    exit 1
}