// ============================================================================
// scripts/consolidate_frames_bukele.js
// Consolida todos los frames de las escenas en un solo directorio con
// numeración secuencial para FFmpeg (frame-%06d.png).
// ============================================================================

import { existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { info } from './error-logger.js';

const PROJECT_DIR = join(process.cwd(), 'projects', 'bukele_agujero_negro');
const SCENES_FRAMES_DIR = join(PROJECT_DIR, 'frames');
const OUTPUT_DIR = join(PROJECT_DIR, 'frames_consolidated');

mkdirSync(OUTPUT_DIR, { recursive: true });

let globalIndex = 0;
const sceneOrder = [
  'intro_accidente',
  'sin_marcha_atras',
  'la_gravedad',
  'horizonte_sucesos',
  'sorpresa_supermasivo',
  'el_tiempo',
  'el_estiramiento',
  'el_final',
  'el_remate',
  'cierre'
];

for (const sceneId of sceneOrder) {
  const sceneDir = join(SCENES_FRAMES_DIR, sceneId);
  if (!existsSync(sceneDir)) {
    info(`Directorio no encontrado: ${sceneDir}`);
    continue;
  }
  const files = readdirSync(sceneDir).filter(f => f.endsWith('.png')).sort();
  for (const file of files) {
    const src = join(sceneDir, file);
    const dst = join(OUTPUT_DIR, `frame-${String(globalIndex).padStart(6, '0')}.png`);
    copyFileSync(src, dst);
    globalIndex += 1;
  }
  info(`Escena "${sceneId}": ${files.length} frames consolidados`);
}

writeFileSync(join(OUTPUT_DIR, 'count.txt'), String(globalIndex), 'utf8');
info(`Consolidación completa: ${globalIndex} frames totales en ${OUTPUT_DIR}`);
console.log(`Total frames: ${globalIndex}`);
