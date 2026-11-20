#!/usr/bin/env node
// ============================================================================
// scripts/capture-custom.js
// Captura frames usando las escenas Three.js con contenido real creadas manualmente.
// ============================================================================

import { captureSceneFrames } from './capture.js';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const scenes = [
  { id: 'hook', start: 0, end: 3, file: 'hook.html' },
  { id: 'sol', start: 3, end: 12, file: 'sol.html' },
  { id: 'planetas', start: 12, end: 28, file: 'planetas.html' },
  { id: 'gigantes', start: 28, end: 44, file: 'gigantes.html' },
  { id: 'hechos', start: 44, end: 60, file: 'hechos.html' },
  { id: 'cinturon', start: 60, end: 70, file: 'cinturon.html' },
  { id: 'cierre', start: 70, end: 90, file: 'cierre.html' }
];

async function main() {
  const scenesDir = join('projects', 'system-solar', 'scenes');
  const framesBase = join('temp', 'system-solar', 'frames');
  
  console.log('🎬 Capturando frames con escenas Three.js reales...\n');
  
  for (const scene of scenes) {
    const outputDir = join(framesBase, scene.id);
    mkdirSync(outputDir, { recursive: true });
    
    const sceneHtml = join(scenesDir, scene.file);
    
    if (!existsSync(sceneHtml)) {
      console.error(`❌ No se encuentra: ${sceneHtml}`);
      process.exit(1);
    }
    
    console.log(`📹 Capturando escena "${scene.id}" (${scene.start}s - ${scene.end}s)...`);
    
    const result = await captureSceneFrames({
      sceneHtml,
      outputDir,
      startTime: scene.start,
      endTime: scene.end,
      fps: 24,
      prefix: 'frame'
    });
    
    console.log(`   ✅ ${result.framesCaptured} frames capturados\n`);
  }
  
  console.log('✅ Todas las escenas capturadas exitosamente');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
