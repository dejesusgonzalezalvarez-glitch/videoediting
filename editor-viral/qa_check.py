#!/usr/bin/env python3
"""QA: ffprobe + loudness + specs"""
import subprocess, json, sys
from pathlib import Path

VIDEO = Path(sys.argv[1])

# Probe
probe = json.loads(subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries",
     "format=duration:stream=width,height,r_frame_rate,codec_name",
     "-of", "json", str(VIDEO)], capture_output=True, text=True).stdout)

fmt = probe["format"]; v = probe["streams"][0]
dur = float(fmt["duration"]); w, h = v["width"], v["height"]
fps = eval(v["r_frame_rate"])

print(f"Duracion: {dur:.2f}s | Res: {w}x{h} | FPS: {fps:.1f} | Codec: {v['codec_name']}")

# Loudness
loud = subprocess.run(
    ["ffmpeg", "-i", str(VIDEO), "-af", "ebur128=peak=true", "-f", "null", "-"],
    capture_output=True, text=True).stderr
print(f"Loudness:\n{loud}")

# Checks
ok = True
if not (55 <= dur <= 90): print("ERROR Duracion fuera de 55-90s"); ok = False
if (w, h) not in [(1080,1920), (1920,1080)]: print("ERROR Resolucion invalida"); ok = False
if abs(fps - 30) > 1: print("ERROR FPS != 30"); ok = False

sys.exit(0 if ok else 1)