#!/usr/bin/env python3
"""FFmpeg render desde timeline.json"""
import json, subprocess, sys
from pathlib import Path

TL = json.loads(Path(sys.argv[1]).read_text())
OUT = sys.argv[2]

# Build filter_complex
v_parts, a_parts = [], []
v_idx = a_idx = 0

# Video tracks
for i, clip in enumerate(TL["tracks"]["video"]):
    v_parts.append(f"[{v_idx}:v]trim=start={clip['in']}:end={clip['out']},setpts=PTS-STARTPTS[v{i}]")
    v_idx += 1

v_concat = "".join(f"[v{i}]" for i in range(len(TL["tracks"]["video"])))
v_parts.append(f"{v_concat}concat=n={len(TL['tracks']['video'])}:v=1:a=0[video_out]")

# Text overlays (drawtext)
for i, txt in enumerate(TL["tracks"]["text"]):
    font = txt.get("font", "Inter")
    size = txt.get("size", 48)
    color = txt.get("color", "#FFFFFF")
    stroke = txt.get("stroke", "#000000")
    stroke_w = txt.get("stroke_width", 3)
    x = txt.get("x", "(w-text_w)/2")
    y = txt.get("y", "h-th-100")
    enable = f"enable='between(t,{txt['start']},{txt['end']})'"
    
    if i == 0:
        v_parts.append(f"[video_out]drawtext=text='{txt['content']}':fontfile=assets/fonts/{font}.ttf:fontsize={size}:fontcolor={color}:bordercolor={stroke}:borderw={stroke_w}:x={x}:y={y}:{enable}[vtxt{i}]")
    else:
        v_parts.append(f"[vtxt{i-1}]drawtext=text='{txt['content']}':fontfile=assets/fonts/{font}.ttf:fontsize={size}:fontcolor={color}:bordercolor={stroke}:borderw={stroke_w}:x={x}:y={y}:{enable}[vtxt{i}]")

v_parts.append(f"[vtxt{len(TL['tracks']['text'])-1}]copy[video_final]")

# Audio: voice + music + sfx (ducking)
a_parts.append(f"[{v_idx}:a]volume=1.0[voice]")
a_parts.append(f"[{v_idx+1}:a]volume={10**(TL['tracks']['audio']['music']['volume_db']/20)},afade=t=in:st=0:d=0.5,afade=t=out:st={TL['meta']['target_duration']-2}:d=2[music]")

# SFX
for j, sfx in enumerate(TL["tracks"]["audio"]["sfx"]):
    a_parts.append(f"[{v_idx+2+j}:a]volume={sfx['volume']},adelay={int(sfx['time']*1000)}|{int(sfx['time']*1000)}[sfx{j}]")

sfx_mix = "+".join(f"[sfx{j}]" for j in range(len(TL["tracks"]["audio"]["sfx"])))
if TL["tracks"]["audio"]["sfx"]:
    a_parts.append(f"{sfx_mix}amix=inputs={len(TL['tracks']['audio']['sfx'])}:duration=first[sfx_mix]")
    a_parts.append("[voice][music][sfx_mix]amix=inputs=3:duration=first:dropout_transition=0[audio_pre]")
else:
    a_parts.append("[voice][music]amix=inputs=2:duration=first:dropout_transition=0[audio_pre]")

a_parts.append("[audio_pre]alimiter=limit=0.89[audio_out]")

filter_complex = ";".join(v_parts + a_parts)

# Inputs
inputs = []
for clip in TL["tracks"]["video"]:
    inputs.extend(["-i", clip["src"]])
inputs.extend(["-i", TL["tracks"]["audio"]["voice"]["src"]])
inputs.extend(["-i", TL["tracks"]["audio"]["music"]["src"]])
for sfx in TL["tracks"]["audio"]["sfx"]:
    inputs.extend(["-i", sfx["src"]])

cmd = [
    "ffmpeg", "-y", *inputs,
    "-filter_complex", filter_complex,
    "-map", "[video_final]", "-map", "[audio_out]",
    "-c:v", "libx264", "-crf", "20", "-preset", "fast",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-t", str(TL["meta"]["target_duration"]),
    OUT
]

print("RENDER Renderizando...")
subprocess.run(cmd, check=True)
print(f"OK Render completo: {OUT}")