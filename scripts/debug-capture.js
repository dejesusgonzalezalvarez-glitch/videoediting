#!/usr/bin/env node
// ============================================================================
// scripts/debug-capture.js
// Captura una escena mínima y captura errores de consola para depurar.
// ============================================================================

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 8765;

async function main() {
  // Iniciar servidor HTTP
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
  
  // Capturar errores de consola
  const consoleErrors = [];
  const consoleLogs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
      console.log('🔴 CONSOLE ERROR:', text);
    } else if (type === 'log') {
      consoleLogs.push(text);
      console.log('📝 CONSOLE LOG:', text);
    }
  });
  
  page.on('pageerror', err => {
    console.log('🔴 PAGE ERROR:', err.message);
  });

  const sceneUrl = `http://127.0.0.1:${PORT}/projects/system-solar/scenes/test-minimal.html`;
  console.log(`\n📍 Cargando: ${sceneUrl}\n`);
  
  await page.goto(sceneUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Llamar updateScene
  await page.evaluate(() => {
    if (typeof window.updateScene === 'function') {
      window.updateScene(0);
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Capturar screenshot
  await page.screenshot({ path: 'temp/debug-test.png', type: 'png', fullPage: false });
  console.log('📸 Screenshot guardado: temp/debug-test.png');
  
  console.log('\n--- RESUMEN ---');
  console.log('Console logs:', consoleLogs.length);
  console.log('Console errors:', consoleErrors.length);
  
  await browser.close();
  serverProc.kill();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
