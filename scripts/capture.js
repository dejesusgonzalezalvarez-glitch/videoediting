// ============================================================================
// scripts/capture.js
// Captura de frames mediante Playwright + Chromium. Cada fotograma del vídeo
// se renderiza ejecutando window.updateScene(t) de forma determinista y se
// guarda como imagen PNG en temp/frames/. Evita capturas manuales.
// ============================================================================

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS } from '../config/paths.config.js';
import { HARDWARE } from '../config/hardware.config.js';
import { VIDEO_CONFIG } from '../config/video.config.js';
import { error, info, withRetry } from './error-logger.js';

/**
 * Captura un rango de frames de una escena.
 * @param {Object} options
 * @param {string} options.sceneHtml - Ruta al HTML de la escena.
 * @param {string} options.outputDir - Directorio de frames de salida.
 * @param {number} options.startTime - Tiempo inicial (segundos).
 * @param {number} options.endTime - Tiempo final (segundos).
 * @param {number} options.fps - Fotogramas por segundo.
 * @param {string} options.prefix - Prefijo de archivos.
 * @returns {Object} { framesCaptured, outputDir }
 */
export async function captureSceneFrames({
  sceneHtml,
  outputDir,
  startTime = 0,
  endTime = VIDEO_CONFIG.duration,
  fps = VIDEO_CONFIG.fps,
  prefix = 'frame',
}) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: HARDWARE.chromiumFlags,
  });

  let framesCaptured = 0;
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: VIDEO_CONFIG.width, height: VIDEO_CONFIG.height });

    await withRetry(() => page.goto(`file:///${sceneHtml}`), {
      label: 'navegación a escena',
      retries: 3,
    });

    // Asegurar que Three.js esté cargado.
    await page.waitForTimeout(500);

    const step = 1 / fps;
    let t = startTime;
    const totalFrames = Math.round((endTime - startTime) * fps);
    let index = 0;

    while (index < totalFrames) {
      const fileName = `${prefix}-${String(index).padStart(6, '0')}.png`;
      const filePath = join(outputDir, fileName);

      // Llamar a updateScene de forma determinista y capturar.
      await page.evaluate((time) => {
        if (typeof window.updateScene === 'function') {
          window.updateScene(time);
        }
      }, t);

      await page.screenshot({ path: filePath, type: 'png', fullPage: false });
      framesCaptured += 1;
      index += 1;
      t = startTime + index * step;
    }

    info(`Frames capturados: ${framesCaptured} (${startTime}s - ${endTime}s)`, {
      outputDir,
      fps,
    });
    return { framesCaptured, outputDir };
  } catch (err) {
    error(`Error capturando frames: ${err.message}`, { sceneHtml, outputDir });
    throw err;
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Captura todas las escenas de un proyecto en temp/<projectId>/frames/.
 * @param {string} projectId
 * @param {Array} scenes - lista de { filePath, start, end, id }
 * @returns {Object} resumen por escena.
 */
export async function captureProject(projectId, scenes) {
  const framesDir = join(PATHS.temp, projectId, 'frames');
  const results = [];

  for (const scene of scenes) {
    const sceneFrames = join(framesDir, scene.id);
    const res = await captureSceneFrames({
      sceneHtml: scene.filePath,
      outputDir: sceneFrames,
      startTime: scene.start,
      endTime: scene.end,
      fps: VIDEO_CONFIG.fps,
      prefix: 'frame',
    });
    results.push({ sceneId: scene.id, ...res });
  }

  return results;
}

export default { captureSceneFrames, captureProject };
