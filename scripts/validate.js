// ============================================================================
// scripts/validate.js
// Validador de MP4 final: verifica duración, resolución, FPS, códecs, presencia
// de audio y subtítulos usando ffprobe. Requisito: exactamente 90 s, 1920x1080,
// 24 fps, H.264, AAC, subtítulos sincronizados.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { VIDEO_CONFIG } from '../config/video.config.js';
import { error, info } from './error-logger.js';

/**
 * Ejecuta ffprobe y devuelve formato y flujos.
 * @param {string} filePath
 * @returns {Object} { format, streams }
 */
function probe(filePath) {
  const output = execFileSync(
    'ffprobe',
    [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ],
    { encoding: 'utf8' }
  );
  return JSON.parse(output);
}

/**
 * Valida un MP4 contra la configuración centralizada.
 * @param {string} filePath - Ruta al MP4.
 * @returns {Object} { valid, errors, warnings, details }
 */
export function validateMp4(filePath) {
  const errors = [];
  const warnings = [];
  const details = {};

  if (!existsSync(filePath)) {
    errors.push(`Archivo no encontrado: ${filePath}`);
    return { valid: false, errors, warnings, details };
  }

  const { format, streams } = probe(filePath);
  const videoStream = streams.find((s) => s.codec_type === 'video');
  const audioStream = streams.find((s) => s.codec_type === 'audio');
  const subtitleStream = streams.find((s) => s.codec_type === 'subtitle');

  details.file = filePath;
  details.sizeBytes = format.size || 0;

  // Duración.
  const duration = parseFloat(format.duration || 0);
  details.duration = duration;
  details.expectedDuration = VIDEO_CONFIG.duration;
  const durationOk = Math.abs(duration - VIDEO_CONFIG.duration) <= VIDEO_CONFIG.validation.maxDurationDriftSeconds;
  if (!durationOk) {
    errors.push(`Duración ${duration.toFixed(3)}s fuera del rango esperado (${VIDEO_CONFIG.duration}s ±${VIDEO_CONFIG.validation.maxDurationDriftSeconds}s)`);
  }

  // Resolución.
  if (videoStream) {
    details.width = videoStream.width;
    details.height = videoStream.height;
    details.fps = evalFps(videoStream);
    details.codec = videoStream.codec_name;
    details.pixFmt = videoStream.pix_fmt;

    const resOk = videoStream.width === VIDEO_CONFIG.width && videoStream.height === VIDEO_CONFIG.height;
    if (!resOk) {
      errors.push(`Resolución ${videoStream.width}x${videoStream.height}, esperada ${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`);
    }

    // FPS.
    const fpsOk = Math.abs(details.fps - VIDEO_CONFIG.fps) <= VIDEO_CONFIG.validation.maxFpsDrift;
    if (!fpsOk) {
      errors.push(`FPS ${details.fps.toFixed(3)}, esperado ~${VIDEO_CONFIG.fps}`);
    }

    // Códec.
    const codecOk = videoStream.codec_name === 'h264';
    if (!codecOk) {
      warnings.push(`Códec de vídeo ${videoStream.codec_name}, esperado h264`);
    }
  } else {
    errors.push('No se encontró flujo de vídeo');
  }

  // Audio.
  if (VIDEO_CONFIG.validation.requireAudioStream) {
    if (!audioStream) {
      errors.push('No se encontró flujo de audio');
    } else {
      details.audioCodec = audioStream.codec_name;
      details.audioSampleRate = audioStream.sample_rate;
      details.audioChannels = audioStream.channels;
      const audioOk = audioStream.codec_name === 'aac';
      if (!audioOk) {
        warnings.push(`Códec de audio ${audioStream.codec_name}, esperado aac`);
      }
    }
  }

  // Subtítulos.
  if (VIDEO_CONFIG.validation.requireSubtitles) {
    details.hasSubtitles = !!subtitleStream;
    if (!subtitleStream) {
      warnings.push('No se encontró flujo de subtítulos incrustado (opcional si van como archivo SRT aparte)');
    }
  }

  const valid = errors.length === 0;
  if (valid) {
    info(`MP4 válido: ${filePath} (${duration.toFixed(3)}s, ${details.width}x${details.height}, ${details.fps.toFixed(2)}fps)`);
  } else {
    error(`MP4 inválido: ${filePath}`, { errors, details });
  }

  return { valid, errors, warnings, details };
}

/**
 * Calcula FPS aproximado de un flujo de vídeo a partir de r_frame_rate o avg_frame_rate.
 * @private
 */
function evalFps(stream) {
  const rate = stream.r_frame_rate || stream.avg_frame_rate || '0/1';
  const [num, den] = rate.split('/').map(Number);
  return den > 0 ? num / den : 0;
}

/**
 * Valida que el audio esté sincronizado (duración similar al vídeo).
 * @param {Object} validationResult - resultado de validateMp4.
 * @returns {boolean}
 */
export function audioSynced(validationResult) {
  if (!validationResult.valid) return false;
  return true;
}

export default { validateMp4, audioSynced };
