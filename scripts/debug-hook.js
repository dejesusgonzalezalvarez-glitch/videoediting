#!/usr/bin/env node
// ============================================================================
// scripts/debug-hook.js
// Depura la escena hook.html capturando errores de consola.
// ============================================================================

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 8765;

async function main() {
  console.log('🖥️  Iniciando servidor HTTP...');
  const serverProc = spawn('node', ['scripts/http_server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  await new Promise(resolve => {
    serverProc.stdout.on('data', (data) => {
      if (data.toString().includes('Servidor HTTP en')) resolve();
    });
    setTimeout(resolve, 5000);
  });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') console.log('🔴 ERROR:', text);
    else if (type === 'log') console.log('📝 LOG:', text);
    else if (type === 'warn') console.log('⚠️  WARN:', text);
  });
  page.on('pageerror', err => console.log('🔴 PAGE ERROR:', err.message));

  const sceneUrl = `http://127.0.0.1:${PORT}/projects/system-solar/scenes/hook.html`;
  console.log(`\n📍 Cargando: ${sceneUrl}\n`);
  
  await page.goto(sceneUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  await page.evaluate(() => {
    if (typeof window.updateScene === 'function') {
      window.updateScene(0);
    }
  });
  
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'temp/debug-hook.png', type: 'png', fullPage: false });
  console.log('📸 Screenshot: temp/debug-hook.png');
  
  await browser.close();
  serverProc.kill();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
