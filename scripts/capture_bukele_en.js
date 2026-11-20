// ============================================================================
// scripts/capture_bukele_en.js
// Captura frames para el proyecto Bukele (inglés).
// Asume que hay un servidor HTTP corriendo en http://127.0.0.1:8765
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
const storyboard = JSON.parse(fs.readFileSync(join(PROJECT_DIR, 'storyboard_en.json'), 'utf8'));

const BASE_URL = 'http://127.0.0.1:8765';

async function waitForServer(maxRetries = 60) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status === 200 || res.status === 404) return true; // servidor responde
    } catch (e) {
      // aún no listo
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Servidor HTTP no respondió');
}

async function captureScene(scene, index) {
  const scenePath = `/projects/bukele_agujero_negro/scenes/scene-${String(index).padStart(2, '0')}-${scene.id}.html`;
  const outputDir = join(FRAMES_DIR, scene.id);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: HARDWARE.chromiumFlags.filter(f => f !== '--headless=new'),
  });

  let framesCaptured = 0;
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: VIDEO_CONFIG.width, height: VIDEO_CONFIG.height });

    await page.goto(`${BASE_URL}${scenePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(600);

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

    info(`Scene "${scene.id}": ${framesCaptured} frames captured`);
    return { sceneId: scene.id, framesCaptured };
  } catch (err) {
    error(`Error capturing scene "${scene.id}": ${err.message}`);
    throw err;
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  mkdirSync(FRAMES_DIR, { recursive: true });

  await waitForServer();
  info('Servidor HTTP listo');

  const results = [];
  for (let i = 0; i < storyboard.scenes.length; i++) {
    const res = await captureScene(storyboard.scenes[i], i);
    results.push(res);
  }

  const total = results.reduce((sum, r) => sum + r.framesCaptured, 0);
  info(`Capture complete: ${total} total frames`);
  console.log(JSON.stringify({ totalFrames: total, scenes: results }));
}

main().catch(err => {
  error(`Fatal capture error: ${err.message}`);
  process.exit(1);
});
