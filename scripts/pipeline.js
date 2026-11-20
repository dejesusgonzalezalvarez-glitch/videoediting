// ============================================================================
// scripts/pipeline.js
// Orquestador del flujo de producción automatizado. Ejecuta, en orden:
// 1. Construir escenas  2. Capturar frames  3. Generar audio (TTS)  4.
//    Generar subtítulos  5. Ensamblar con FFmpeg  6. Validar MP4  7. Limpiar.
// Cada etapa registra errores y permite reintentos.
// ============================================================================

import { buildScenes } from './build-scene.js';
import { captureProject } from './capture.js';
import { assemble } from './assemble.js';
import { validateMp4 } from './validate.js';
import { cleanupProjectTemp } from './cleanup.js';
import { join } from 'node:path';
import { copyFileSync, existsSync } from 'node:fs';
import { AudioEngine } from '../engine/AudioEngine.js';
import { SubtitleEngine } from '../engine/SubtitleEngine.js';
import { error, info, withRetry, stats } from './error-logger.js';
import { PATHS } from '../config/paths.config.js';
import { VIDEO_CONFIG } from '../config/video.config.js';

/**
 * Ejecuta el pipeline completo para un proyecto.
 *
 * @param {Object} options
 * @param {string} options.projectId - Identificador del proyecto.
 * @param {Array} options.storyboard - Lista de escenas con start/end.
 * @param {string} options.narrationText - Texto de narración (español).
 * @param {Object} options.audio - { musicPath?, sfxPaths[], voice? }
 * @param {Array} options.subtitleSegments - [{start, end, text}].
 * @returns {Object} { success, outputPath, validation }
 */
export async function runPipeline({
  projectId,
  storyboard,
  narrationText = '',
  audio = {},
  subtitleSegments = [],
}) {
  const projectTemp = join(PATHS.temp, projectId);
  const outputDir = join(PATHS.renders, projectId);

  try {
    // 1. Construir escenas HTML.
    info(`[1/6] Construyendo escenas del proyecto "${projectId}"`);
    const builtScenes = buildScenes(projectId, storyboard);
    // Transformar a formato esperado por captureProject: { id, filePath, start, end }
    const scenes = builtScenes.map((bs) => ({
      id: bs.scene.id,
      filePath: bs.filePath,
      start: bs.scene.start,
      end: bs.scene.end,
    }));

    // 2. Capturar frames con Playwright.
    info(`[2/6] Capturando frames del proyecto "${projectId}"`);
    await captureProject(projectId, scenes);

    // 3. Generar audio (narración TTS + mezcla).
    info(`[3/6] Generando audio del proyecto "${projectId}"`);
    const audioEngine = new AudioEngine({ projectDir: projectTemp });
    
    // Verificar si existe narración en el directorio del proyecto (projects/<id>/narration.wav)
    const projectDir = join(PATHS.projects, projectId);
    const existingNarration = join(projectDir, 'narration.wav');
    if (existsSync(existingNarration)) {
      info(`Usando narración existente: ${existingNarration}`);
      copyFileSync(existingNarration, join(projectTemp, 'narration.wav'));
      // Establecer la ruta de narración en el AudioEngine manualmente
      audioEngine.narrationPath = join(projectTemp, 'narration.wav');
    } else if (narrationText) {
      audioEngine.generateNarration(narrationText, { voice: audio.voice || 'af_heart' });
    }
    if (audio.musicPath) audioEngine.setMusic(audio.musicPath);
    (audio.sfxPaths || []).forEach((p) => audioEngine.addSfx(p));
    const mixedAudio = join(projectTemp, 'audio-mixed.wav');
    audioEngine.mix(mixedAudio, VIDEO_CONFIG.duration);

    // 4. Generar subtítulos SRT.
    info(`[4/6] Generando subtítulos del proyecto "${projectId}"`);
    const subEngine = new SubtitleEngine({ language: VIDEO_CONFIG.language });
    subtitleSegments.forEach((s) => subEngine.add(s.start, s.end, s.text));
    const srtPath = join(projectTemp, 'subtitles.srt');
    subEngine.save(srtPath);

    // 5. Ensamblar MP4 final.
    info(`[5/6] Ensamblando MP4 del proyecto "${projectId}"`);
    const framesDir = join(projectTemp, 'frames');
    const sceneOrder = storyboard.map(s => s.id);
    const outputPath = assemble({
      framesDir,
      audioMixed: mixedAudio,
      srtPath,
      outputDir,
      projectId,
      sceneOrder,
    });

    // 6. Validar MP4.
    info(`[6/6] Validando MP4 del proyecto "${projectId}"`);
    const validation = validateMp4(outputPath);

    // Limpieza de temporales (conservar fuentes en projects/ y renders/).
    cleanupProjectTemp(projectId);

    return {
      success: validation.valid,
      outputPath,
      validation,
      stats: stats(),
    };
  } catch (err) {
    error(`Error en el pipeline del proyecto "${projectId}": ${err.message}`, {
      projectId,
      stack: err.stack,
    });
    return { success: false, error: err.message, stats: stats() };
  }
}

export default { runPipeline };
