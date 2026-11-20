// ============================================================================
// config/video.config.js
// Configuración centralizada de vídeo para el Estudio Audiovisual Automatizado.
// Todos los parámetros de producción viven aquí. Modificar este archivo cambia
// la configuración global de todos los proyectos.
// ============================================================================

export const VIDEO_CONFIG = {
  // Duración exacta del vídeo en segundos.
  duration: 90,

  // Resolución y relación de aspecto.
  width: 1920,
  height: 1080,
  aspectRatio: '16:9',

  // Frecuencia de fotogramas.
  fps: 24,

  // Formato de salida.
  format: 'mp4',
  container: 'mp4',

  // Códec de vídeo.
  codec: 'libx264',
  // Codificación por hardware para AMD Radeon RX 580 (AMF). Si Chromium no
  // puede usar la GPU, se usa codificación por software (CPU).
  hardwareEncoder: 'amf', // 'amf' | 'none'
  softwareFallback: 'libx264',

  // Calidad de vídeo (CRF). 18-28 es rango recomendado; 20 = referencia.
  crf: 20,
  preset: 'medium',

  // Códec de audio.
  audioCodec: 'aac',
  audioBitrate: '192k',
  audioSampleRate: 48000,
  audioChannels: 2,

  // Idioma de narración y subtítulos.
  language: 'es-ES',
  ttsLanguage: 'es',
  subtitles: true,
  subtitleFormat: 'srt',

  // Sincronización audio/animación.
  syncToleranceMs: 40,

  // Concurrencia de renderizado: una instancia de Chromium a la vez.
  maxConcurrentChromium: 1,

  // Directorios temporales y de salida.
  tempDir: 'temp',
  rendersDir: 'renders',
  projectsDir: 'projects',

  // Umbrales de validación.
  validation: {
    maxDurationDriftSeconds: 0.5,
    maxFpsDrift: 1,
    requireAudioStream: true,
    requireSubtitles: true,
  },
};

// Export Helper: calcular totales derivados.
export function derivedConfig() {
  const totalFrames = Math.round(VIDEO_CONFIG.duration * VIDEO_CONFIG.fps);
  const frameDurationMs = 1000 / VIDEO_CONFIG.fps;
  return {
    totalFrames,
    frameDurationMs,
    totalMilliseconds: VIDEO_CONFIG.duration * 1000,
  };
}

export default VIDEO_CONFIG;
