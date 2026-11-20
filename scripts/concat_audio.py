#!/usr/bin/env python3
import os
import subprocess
import sys

# Usar ruta absoluta y evitar caracteres problemáticos
workspace = r"C:\Users\Roberth 2\Desktop\Gilmer\Creaci�n de videos con IA"

# Verificar que el directorio existe
if not os.path.exists(workspace):
    print(f"ERROR: Directorio no encontrado: {workspace}")
    # Intentar con ruta corta
    short_path = os.path.join(os.environ.get('USERPROFILE', 'C:\\'), 'Desktop', 'Gilmer', 'Creaci�n de videos con IA')
    print(f"Ruta corta: {short_path}")
    sys.exit(1)

os.chdir(workspace)
print('Directorio de trabajo:', os.getcwd())

# Listar archivos WAV en temp
wav_files = sorted([f for f in os.listdir('temp') if f.endswith('.wav')])
print('Archivos WAV encontrados:', wav_files)

# Crear lista de concat para ffmpeg
with open(os.path.join('temp', 'concat_list.txt'), 'w', encoding='utf-8') as f:
    for wav in wav_files:
        # Usar ruta relativa desde el directorio actual, escapando correctamente
        f.write(f"file 'temp\\{wav}'\n")

# Ejecutar ffmpeg para concatenar
result = subprocess.run([
    "ffmpeg", "-f", "concat", "-i", os.path.join('temp', 'concat_list.txt'), 
    "-c", "copy", os.path.join('temp', 'narration_full.wav')
], capture_output=True, text=True, encoding='utf-8')
print("STDERR ffmpeg concat:", result.stderr[:500])
print("Return code:", result.returncode)

# Verificar duración
result2 = subprocess.run([
    "ffmpeg", "-i", os.path.join('temp', 'narration_full.wav'), 
    "-show_entries", "format=duration", 
    "-of", "default=noprint_wrappers=1", "-hide_banner"
], capture_output=True, text=True, encoding='utf-8')
print("Duración stdout:", result2.stdout.strip())