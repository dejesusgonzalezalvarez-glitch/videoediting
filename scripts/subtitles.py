# ============================================================================
# scripts/subtitles.py
# Generador de subtítulos SRT sincronizados a partir de segmentos de tiempo.
# Uso: python subtitles.py --segments "0,5,Hola mundo;5,10,Segundo segmento" --out subtitles.srt
# ============================================================================

import argparse
import sys


def fmt_time(seconds):
    total_ms = int(round(float(seconds) * 1000))
    h = total_ms // 3600000
    m = (total_ms % 3600000) // 60000
    s = (total_ms % 60000) // 1000
    ms = total_ms % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_srt(segments):
    lines = []
    for i, (start, end, text) in enumerate(segments, start=1):
        lines.append(str(i))
        lines.append(f"{fmt_time(start)} --> {fmt_time(end)}")
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def parse_segments(raw):
    segments = []
    for part in raw.split(";"):
        part = part.strip()
        if not part:
            continue
        fields = part.split(",", 2)
        if len(fields) != 3:
            raise ValueError(f"Segmento inválido: {part}")
        start, end, text = fields
        segments.append((float(start), float(end), text))
    return segments


def main():
    parser = argparse.ArgumentParser(description="Generador de subtítulos SRT")
    parser.add_argument('--segments', required=True, help='Segmentos "start,end,text;start,end,text"')
    parser.add_argument('--out', default='subtitles.srt', help='Archivo SRT de salida')
    args = parser.parse_args()

    try:
        segments = parse_segments(args.segments)
        srt = build_srt(segments)
        with open(args.out, 'w', encoding='utf-8') as f:
            f.write(srt)
        print(f"OK: subtítulos escritos en {args.out} ({len(segments)} segmentos)")
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
