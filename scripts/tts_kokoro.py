# ============================================================================
# scripts/tts_kokoro.py
# Generación de narración en español con Kokoro TTS.
# Uso: python tts_kokoro.py --text "Texto" --voice es --out salida.wav
# Requiere: kokoro, soundfile, numpy (instalados).
# ============================================================================

import argparse
import os
import sys

try:
    from kokoro import KPipeline
    import soundfile as sf
    import numpy as np
except Exception as exc:  # pragma: no cover
    print(f"ERROR: No se pudieron importar las dependencias de Kokoro: {exc}", file=sys.stderr)
    sys.exit(1)


def synthesize(text, voice='af_heart', output='narration.wav', sample_rate=24000):
    """Genera un WAV de narración usando Kokoro TTS.

    Nota: el modelo base hexgrad/Kokoro-82M es de habla inglesa. Para narración
    en español se recomienda usar un modelo de voces en español de Kokoro o
    ajustar el texto para que sea leído con una voz cercana. La voz por defecto
    'af_heart' está disponible en el modelo base.
    """
    pipeline = KPipeline(lang_code='a')  # 'a' = inglés base (modelo Kokoro-82M)

    # Kokoro genera (audio, ...) por segmento. Concatenamos todo.
    audio_segments = []
    try:
        generator = pipeline(text, voice=voice, speed=1.0, split_pattern=r'\n+')
    except Exception as exc:
        # Si la voz no existe, probar con la voz por defecto del modelo.
        if voice != 'af_heart':
            print(f"AVISO: Voz '{voice}' no disponible, usando 'af_heart'.", file=sys.stderr)
            generator = pipeline(text, voice='af_heart', speed=1.0, split_pattern=r'\n+')
        else:
            raise

    for _, _, audio in generator:
        audio_segments.append(np.asarray(audio, dtype=np.float32))

    if not audio_segments:
        raise RuntimeError("Kokoro no generó audio para el texto proporcionado.")

    audio = np.concatenate(audio_segments) if len(audio_segments) > 1 else audio_segments[0]

    # Asegurar mono y escribir WAV.
    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    sf.write(output, audio, sample_rate)
    print(f"OK: narración generada en {output} ({len(audio)/sample_rate:.2f}s)")
    return output


def main():
    parser = argparse.ArgumentParser(description="Narración TTS en español con Kokoro")
    parser.add_argument('--text', required=True, help="Texto a narrar")
    parser.add_argument('--voice', default='af_heart', help="Voz de Kokoro (default: af_heart; modelo base es inglés)")
    parser.add_argument('--out', default='narration.wav', help="Archivo WAV de salida")
    parser.add_argument('--sample-rate', type=int, default=24000, help="Frecuencia de muestreo")
    args = parser.parse_args()

    try:
        synthesize(args.text, args.voice, args.out, args.sample_rate)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
