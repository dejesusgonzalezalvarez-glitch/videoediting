// ============================================================================
// engine/AudioEngine.js
// Gestor de audio: narración TTS (español, Kokoro), música y efectos de sonido.
// Genera un WAV intermedio que luego FFmpeg convierte a AAC y mezcla con el
// vídeo. Toda la generación de audio se hace fuera del bucle de renderizado
// para no consumir RAM innecesariamente durante la captura.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export class AudioEngine {
  constructor({ projectDir, language = 'es-ES', sampleRate = 48000 } = {}) {
    this.projectDir = projectDir;
    this.language = language;
    this.sampleRate = sampleRate;
    this.narrationPath = null;
    this.musicPath = null;
    this.sfxPaths = [];
  }

  /**
   * Genera la narración en español usando Kokoro TTS a través del script
   * Python auxiliar scripts/tts_kokoro.py.
   *
   * @param {string} text - Texto a narrar.
   * @param {string} voice - Voz de Kokoro a usar (por defecto español).
   * @returns {string} Ruta al WAV generado.
   */
  generateNarration(text, { voice = 'es' } = {}) {
    const script = join(process.cwd(), 'scripts', 'tts_kokoro.py');
    const outPath = join(this.projectDir, 'narration.wav');

    try {
      execFileSync('python', [script, '--text', text, '--voice', voice, '--out', outPath], {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      this.narrationPath = outPath;
      return outPath;
    } catch (err) {
      throw new Error(`Error generando narración TTS (Kokoro): ${err.message}`);
    }
  }

  /**
   * Establece la pista de música de fondo (archivo WAV/MP3 existente en assets).
   */
  setMusic(path) {
    this.musicPath = path;
  }

  /**
   * Añade un efecto de sonido.
   */
  addSfx(path) {
    this.sfxPaths.push(path);
  }

  /**
   * Mezcla narración + música + SFX en un único WAV estéreo mediante FFmpeg.
   * El volumen de la música se atenuará (-15 dB) para que la narración
   * prevalezca. Padea la narración a targetDuration si se proporciona.
   *
   * @param {string} outputPath - Ruta del WAV mezclado de salida.
   * @param {number} [targetDuration] - Duración objetivo en segundos (padea con silencio).
   * @returns {string} Ruta del WAV mezclado.
   */
  mix(outputPath, targetDuration = null) {
    const inputs = [];
    const filterParts = [];
    let inputIndex = 0;

    // Input 0: narración (obligatorio).
    if (!this.narrationPath) {
      throw new Error('No hay narración generada. Llama a generateNarration primero.');
    }
    inputs.push('-i', this.narrationPath);
    // Padear narración a targetDuration si se especifica
    if (targetDuration) {
      filterParts.push(`[${inputIndex}:a]apad=whole_dur=${targetDuration}[narration]`);
    } else {
      filterParts.push(`[${inputIndex}:a]volume=1.0[narration]`);
    }
    inputIndex += 1;

    // Música de fondo (opcional), atenuada.
    if (this.musicPath) {
      inputs.push('-i', this.musicPath);
      filterParts.push(`[${inputIndex}:a]volume=0.18,apad[music]`);
      inputIndex += 1;
    }

    // SFX (opcionales).
    this.sfxPaths.forEach((sfx) => {
      inputs.push('-i', sfx);
      filterParts.push(`[${inputIndex}:a]apad[sfx${inputIndex}]`);
      inputIndex += 1;
    });

    // Mezclar todo.
    const mixInputs = ['[narration]'];
    if (this.musicPath) mixInputs.push('[music]');
    this.sfxPaths.forEach((_, i) => mixInputs.push(`[sfx${i + 1}]`));

    const amixFilter = `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=2[aout]`;
    filterParts.push(amixFilter);

    const args = [
      ...inputs.flat(),
      '-filter_complex',
      filterParts.join('; '),
      '-map',
      '[aout]',
      '-ar',
      String(this.sampleRate),
      '-ac',
      '2',
      '-c:a',
      'pcm_s16le',
      '-y',
      outputPath,
    ];

    execFileSync('ffmpeg', args, { stdio: 'pipe', encoding: 'utf8' });
    return outputPath;
  }
}

export default AudioEngine;
