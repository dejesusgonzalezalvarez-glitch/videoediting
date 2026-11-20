#!/usr/bin/env python3
"""TTS Local: Kokoro > Edge > Coqui > Piper (orden de preferencia)"""
import sys, subprocess, asyncio, json
from pathlib import Path

PROJECT = Path(sys.argv[1])
SCRIPT_FILE = PROJECT / "script.txt"
OUT_FILE = PROJECT / "voice.wav"

def kokoro(text, out, voice="af_heart", speed=1.05):
    subprocess.run(["kokoro", "-t", text, "-m", voice, "-s", str(speed), "-l", "e", "-o", str(out)], check=True)

def edge_tts(text, out, voice="es-ES-AlvaroNeural", rate="+10%"):
    import edge_tts
    async def _run():
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(str(out))
    asyncio.run(_run())

def coqui(text, out, model="tts_models/es/css10/vits"):
    from TTS.api import TTS
    TTS(model).tts_to_file(text=text, file_path=str(out))

def piper(text, out, voice="es_ES-sharvard-medium"):
    subprocess.run(["piper", "--model", voice, "--output_file", str(out)], input=text.encode(), check=True)

text = SCRIPT_FILE.read_text(encoding="utf-8").strip()

for fn in (kokoro, edge_tts, coqui, piper):
    try:
        fn(text, OUT_FILE)
        print(f"OK Voz generada con {fn.__name__}: {OUT_FILE}")
        sys.exit(0)
    except Exception as e:
        print(f"WARN {fn.__name__} fallo: {e}")

print("ERROR Ningun TTS disponible"); sys.exit(1)