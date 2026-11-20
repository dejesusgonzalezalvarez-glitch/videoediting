#!/usr/bin/env node
// ============================================================================
// scripts/capture-http.js
// Captura frames usando servidor HTTP local para evitar problemas de CORS
// y permitir importación local de Three.js desde node_modules.
// ============================================================================

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PORT = 8765;
const scenes = [
  { id: 'hook', start: 0, end: 3, file: 'projects/system-solar/scenes/hook.html' },
  { id: 'sol', start: 3, end: 12, file: 'projects/system-solar/scenes/sol.html' },
  { id: 'planetas', start: 12, end: 28, file: 'projects/system-solar/scenes/planetas.html' },
  { id: 'gigantes', start: 28, end: 44, file: 'projects/system-solar/scenes/gigantes.html' },
  { id: 'hechos', start: 44, end: 60, file: 'projects/system-solar/scenes/hechos.html' },
  { id: 'cinturon', start: 60, end: 70, file: 'projects/system-solar/scenes/cinturon.html' },
  { id: 'cierre', start: 70, end: 90, file: 'projects/system-solar/scenes/cierre.html' }
];

async function main() {
  // 1. Iniciar servidor HTTP
  console.log('🖥️  Iniciando servidor HTTP en puerto', PORT, '...');
  const serverProc = spawn('node', ['scripts/http_server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  // Esperar a que el servidor esté listo
  await new Promise(resolve => {
    serverProc.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('Servidor HTTP en')) {
        resolve();
      }
    });
    serverProc.stderr.on('data', (data) => {
      console.log('Server stderr:', data.toString());
    });
    setTimeout(resolve, 5000); // Timeout de seguridad
  });

  console.log('✅ Servidor HTTP iniciado\n');

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let totalFrames = 0;

    for (const scene of scenes) {
      const outputDir = join('temp', 'system-solar', 'frames-http', scene.id);
      mkdirSync(outputDir, { recursive: true });

      // Usar URL HTTP en lugar de file:///
      const sceneUrl = `http://127.0.0.1:${PORT}/${scene.file}`;

      console.log(`📹 Capturando escena "${scene.id}" (${scene.start}s - ${scene.end}s)...`);
      console.log(`   URL: ${sceneUrl}`);

      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto(sceneUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000); // Esperar a que Three.js cargue

      const step = 1 / 24;
      let t = scene.start;
      const totalFramesScene = Math.round((scene.end - scene.start) * 24);
      let index = 0;

      while (index < totalFramesScene) {
        const fileName = `frame-${String(index).padStart(6, '0')}.png`;
        const filePath = join(outputDir, fileName);

        await page.evaluate((time) => {
          if (typeof window.updateScene === 'function') {
            window.updateScene(time);
          }
        }, t);

        await page.screenshot({ path: filePath, type: 'png', fullPage: false });
        index++;
        t = scene.start + index * step;
      }

      await page.close();
      totalFrames += totalFramesScene;
      console.log(`   ✅ ${totalFramesScene} frames capturados\n`);
    }

    await browser.close();
    console.log(`\n✅ Total: ${totalFrames} frames capturados con Three.js local`);

  } finally {
    // Detener servidor HTTP
    serverProc.kill();
    console.log('🛑 Servidor HTTP detenido');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
