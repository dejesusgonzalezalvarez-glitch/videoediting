// ============================================================================
// scripts/capture_bukele.js
// Captura frames para el proyecto Bukele, escena por escena.
// ============================================================================

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { HARDWARE } from '../config/hardware.config.js';
import { VIDEO_CONFIG } from '../config/video.config.js';
import { info, error } from './error-logger.js';

const PROJECT_DIR = join(process.cwd(), 'projects', 'bukele_agujero_negro');
const SCENES_DIR = join(PROJECT_DIR, 'scenes');
const FRAMES_DIR = join(PROJECT_DIR, 'frames');

const fs = await import('node:fs');
const storyboard = JSON.parse(fs.readFileSync(join(PROJECT_DIR, 'storyboard.json'), 'utf8'));

async function captureScene(scene, index) {
  const sceneHtml = join(SCENES_DIR, `scene-${String(index).padStart(2, '0')}-${scene.id}.html`);
  const outputDir = join(FRAMES_DIR, scene.id);

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

    await page.goto(`file:///${sceneHtml}`);
    await page.waitForTimeout(500);

    const step = 1 / VIDEO_CONFIG.fps;
    let t = scene.start;
    let frameIndex = 0;
    const totalFrames = Math.round((scene.end - scene.start) * VIDEO_CONFIG.fps);

    while (t < scene.end + 0.001 && frameIndex <= totalFrames) {
      const fileName = `frame-${String(frameIndex).padStart(6, '0')}.png`;
      const filePath = join(outputDir, fileName);

      await page.evaluate((time) => {
        if (typeof window.updateScene === 'function') {
          window.updateScene(time);
        }
      }, t);

      await page.screenshot({ path: filePath, type: 'png', fullPage: false });
      framesCaptured += 1;
      frameIndex += 1;
      t = scene.start + frameIndex * step;
    }

    info(`Escena "${scene.id}": ${framesCaptured} frames capturados (${scene.start}s-${scene.end}s)`);
    return { sceneId: scene.id, framesCaptured };
  } catch (err) {
    error(`Error capturando escena "${scene.id}": ${err.message}`);
    throw err;
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  mkdirSync(FRAMES_DIR, { recursive: true });
  const results = [];
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const res = await captureScene(storyboard.scenes[i], i);
    results.push(res);
  }
  const total = results.reduce((sum, r) => sum + r.framesCaptured, 0);
  info(`Captura completa: ${total} frames totales en ${results.length} escenas`);
  console.log(JSON.stringify({ totalFrames: total, scenes: results }));
}

main().catch(err => {
  error(`Error fatal en captura: ${err.message}`);
  process.exit(1);
});
