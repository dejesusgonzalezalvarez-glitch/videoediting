#!/usr/bin/env python3
"""Whisper align -> SRT palabra-palabra (usa openai-whisper)"""
import sys, re
from pathlib import Path
import whisper

PROJECT = Path(sys.argv[1])
AUDIO = PROJECT / "voice.wav"
OUT_SRT = PROJECT / "subtitles.srt"

print("Cargando modelo Whisper...")
model = whisper.load_model("base")
result = model.transcribe(str(AUDIO), word_timestamps=True, language="es")

phrases, current = [], {"words": [], "start": None, "end": None}
for seg in result["segments"]:
    for w in seg.get("words", []):
        if current["start"] is None: current["start"] = w["start"]
        current["words"].append(w["word"])
        current["end"] = w["end"]
        if re.search(r"[.!?。]", w["word"]):
            phrases.append(current)
            current = {"words": [], "start": None, "end": None}
if current["words"]: phrases.append(current)

def fmt(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

with open(OUT_SRT, "w", encoding="utf-8") as f:
    for i, p in enumerate(phrases, 1):
        text = " ".join(p["words"]).strip()
        f.write(f"{i}\n{fmt(p['start'])} --> {fmt(p['end'])}\n{text}\n\n")

print(f"OK Subtitulos sincronizados: {OUT_SRT} ({len(phrases)} frases)")