// ============================================================================
// engine/SubtitleEngine.js
// Generador de subtítulos sincronizados (formato SRT) a partir de los segmentos
// de narración con sus tiempos de inicio y fin.
// ============================================================================

import { writeFileSync } from 'node:fs';

export class SubtitleEngine {
  constructor({ language = 'es-ES' } = {}) {
    this.language = language;
    this.segments = []; // { start, end, text }
  }

  /**
   * Añade un segmento de subtítulo.
   * @param {number} start - Tiempo de inicio en segundos.
   * @param {number} end - Tiempo de fin en segundos.
   * @param {string} text - Texto del subtítulo.
   */
  add(start, end, text) {
    this.segments.push({
      start: Number(start),
      end: Number(end),
      text: String(text).trim(),
    });
  }

  /**
   * Formatea un tiempo en segundos al formato SRT: HH:MM:SS,mmm.
   * @private
   */
  _formatTime(seconds) {
    const totalMs = Math.round(seconds * 1000);
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * Genera el contenido SRT.
   * @returns {string}
   */
  toSrt() {
    return this.segments
      .map((seg, i) => {
        const start = this._formatTime(seg.start);
        const end = this._formatTime(seg.end);
        return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join('\n');
  }

  /**
   * Escribe el archivo SRT en disco.
   * @param {string} outputPath
   * @returns {string} ruta del archivo escrito.
   */
  save(outputPath) {
    writeFileSync(outputPath, this.toSrt(), 'utf8');
    return outputPath;
  }

  /**
   * Incrusta los subtítulos en el vídeo mediante FFmpeg (filtro subtitles).
   * Devuelve los argumentos de filtro necesarios para el ensamblaje.
   * @param {string} srtPath - Ruta al archivo SRT.
   * @returns {string} cadena del filtro subtitles de FFmpeg.
   */
  subtitlesFilter(srtPath) {
    // Escapar barras invertidas y dos puntos para el filtro de FFmpeg en Windows.
    const escaped = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
    return `subtitles='${escaped}'`;
  }
}

export default SubtitleEngine;
