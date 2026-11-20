// ============================================================================
// scripts/assemble.js
// Ensamblaje del vídeo final con FFmpeg:
// 1. Une los frames PNG en MP4 (H.264, CRF 20, 24 fps).
// 2. Añade audio AAC mezclado (narración + música + SFX).
// 3. Incrusta subtítulos sincronizados (filtro subtitles).
// ============================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync, mkdirSync, readdirSync, copyFileSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { VIDEO_CONFIG } from '../config/video.config.js';
import { HARDWARE } from '../config/hardware.config.js';
import { error, info, withRetry } from './error-logger.js';

/**
 * Combina frames de subdirectorios de escenas en un solo directorio con nombres secuenciales.
 * @param {string} framesRootDir - Directorio raíz que contiene subdirectorios por escena.
 * @param {string} outputDir - Directorio de salida para frames combinados.
 * @param {Array<string>} [sceneOrder] - Orden de IDs de escena (opcional). Si no se proporciona, usa orden alfabético.
 * @returns {number} Número total de frames combinados.
 */
export function combineFrames(framesRootDir, outputDir, sceneOrder = null) {
  // Limpiar directorio de salida si existe
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });
  
  // Obtener subdirectorios
  const allSceneDirs = readdirSync(framesRootDir)
    .map(d => join(framesRootDir, d))
    .filter(d => statSync(d).isDirectory());
  
  // Ordenar según sceneOrder si se proporciona, sino alfabéticamente
  let sceneDirs;
  if (sceneOrder && sceneOrder.length > 0) {
    const dirMap = new Map();
    for (const dir of allSceneDirs) {
      const name = dir.split(/[\\/]/).pop();
      dirMap.set(name, dir);
    }
    sceneDirs = sceneOrder
      .map(id => dirMap.get(id))
      .filter(d => d !== undefined);
  } else {
    sceneDirs = allSceneDirs.sort();
  }
  
  let frameIndex = 0;
  
  for (const sceneDir of sceneDirs) {
    const frames = readdirSync(sceneDir)
      .filter(f => f.endsWith('.png'))
      .sort();
    
    for (const frame of frames) {
      const src = join(sceneDir, frame);
      const dst = join(outputDir, `frame-${String(frameIndex).padStart(6, '0')}.png`);
      copyFileSync(src, dst);
      frameIndex++;
    }
  }
  
  info(`Frames combinados: ${frameIndex} en ${outputDir}`);
  return frameIndex;
}

/**
 * Codifica los frames PNG en un vídeo MP4 sin audio (paso intermedio).
 * @param {string} framesDir - Directorio con frames frame-%06d.png.
 * @param {string} outputVideo - Ruta del MP4 sin audio.
 * @returns {string} ruta del vídeo codificado.
 */
export function encodeVideo(framesDir, outputVideo) {
  const inputPattern = join(framesDir, 'frame-%06d.png');
  const args = [
    '-y',
    '-framerate',
    String(VIDEO_CONFIG.fps),
    '-i',
    inputPattern,
    '-c:v',
    VIDEO_CONFIG.softwareFallback,
    '-crf', String(VIDEO_CONFIG.crf),
    '-preset', VIDEO_CONFIG.preset,
    '-pix_fmt', 'yuv420p',
    '-r', String(VIDEO_CONFIG.fps),
    '-an', outputVideo,
  ];

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe', encoding: 'utf8' });
    info(`Vídeo sin audio codificado: ${outputVideo}`);
    return outputVideo;
  } catch (err) {
    error(`Error codificando vídeo: ${err.message}`);
    throw err;
  }
}

/**
 * Combina vídeo sin audio con el audio mezclado (WAV) y exporta MP4 con AAC.
 * @param {string} videoNoAudio - Ruta al MP4 sin audio.
 * @param {string} audioMixed - Ruta al WAV mezclado.
 * @param {string} outputFinal - Ruta del MP4 final con audio.
 * @returns {string} ruta del MP4 final.
 */
export function addAudio(videoNoAudio, audioMixed, outputFinal) {
  const args = [
    '-y',
    '-i',
    videoNoAudio,
    '-i',
    audioMixed,
    '-c:v',
    'copy',
    '-c:a',
    VIDEO_CONFIG.audioCodec,
    '-b:a',
    VIDEO_CONFIG.audioBitrate,
    '-ar',
    String(VIDEO_CONFIG.audioSampleRate),
    '-ac',
    String(VIDEO_CONFIG.audioChannels),
    // No usar -shortest: el vídeo define la duración exacta (90s).
    // El audio se padeará en AudioEngine.mix() con duration=longest.
    '-movflags',
    '+faststart',
    outputFinal,
  ];

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe', encoding: 'utf8' });
    info(`Vídeo con audio ensamblado: ${outputFinal}`);
    return outputFinal;
  } catch (err) {
    error(`Error añadiendo audio: ${err.message}`);
    throw err;
  }
}

/**
 * Incrusta subtítulos SRT en el vídeo mediante el filtro subtitles de FFmpeg.
 * @param {string} inputVideo - Ruta del MP4 de entrada.
 * @param {string} srtPath - Ruta al archivo SRT.
 * @param {string} outputVideo - Ruta del MP4 con subtítulos.
 * @returns {string} ruta del MP4 con subtítulos incrustados.
 */
export function burnSubtitles(inputVideo, srtPath, outputVideo) {
  if (!existsSync(srtPath)) {
    info(`No se encontró SRT, se omite incrustación de subtítulos: ${srtPath}`);
    return inputVideo;
  }

  // En Windows, el filtro subtitles de FFmpeg tiene problemas con rutas que contienen ':'
  // (como C:/...). La solución es copiar el SRT a un directorio temporal simple
  // y usar una ruta relativa, o usar la opción 'subtitles' con ruta absoluta
  // correctamente escapada. Usamos una ruta relativa desde el directorio de trabajo.
  const srtDir = join(process.cwd(), 'temp', '_subs');
  mkdirSync(srtDir, { recursive: true });
  const simpleSrtPath = join(srtDir, 'subs.srt');
  copyFileSync(srtPath, simpleSrtPath);
  
  // Usar ruta relativa para evitar problemas con ':' en Windows
  const relativeSrtPath = simpleSrtPath.replace(process.cwd() + '\\', '').replace(/\\/g, '/');
  const vf = `subtitles='${relativeSrtPath}'`;

  const args = [
    '-y',
    '-i',
    inputVideo,
    '-vf',
    vf,
    '-c:a',
    'copy',
    '-c:v',
    VIDEO_CONFIG.softwareFallback,
    '-crf', String(VIDEO_CONFIG.crf),
    '-preset', VIDEO_CONFIG.preset,
    '-pix_fmt', 'yuv420p', outputVideo,
  ];

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe', encoding: 'utf8' });
    info(`Subtítulos incrustados: ${outputVideo}`);
    return outputVideo;
  } catch (err) {
    error(`Error incrustando subtítulos: ${err.message}`);
    throw err;
  }
}

/**
 * Ensamblaje completo: frames -> vídeo sin audio -> +audio -> +subtítulos.
 * @param {Object} options
 * @returns {string} ruta del MP4 final validable.
 */
export function assemble({
  framesDir,
  audioMixed,
  srtPath,
  outputDir,
  projectId,
  sceneOrder = null,
}) {
  mkdirSync(outputDir, { recursive: true });
  const base = join(outputDir, `${projectId}`);

  const videoNoAudio = `${base}-noaudio.mp4`;
  const withAudio = `${base}-audio.mp4`;
  const final = `${base}.mp4`;

  // Combinar frames de subdirectorios en un directorio temporal plano
  const combinedFramesDir = join(framesDir, '_combined');
  combineFrames(framesDir, combinedFramesDir, sceneOrder);

  encodeVideo(combinedFramesDir, videoNoAudio);
  addAudio(videoNoAudio, audioMixed, withAudio);
  const result = burnSubtitles(withAudio, srtPath, final);

  // Limpiar intermedios.
  try {
    unlinkSync(videoNoAudio);
    unlinkSync(withAudio);
  } catch (e) {
    // no crítico
  }

  return result;
}

export default { encodeVideo, addAudio, burnSubtitles, assemble };
