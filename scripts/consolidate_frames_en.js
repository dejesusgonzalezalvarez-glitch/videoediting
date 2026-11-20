// ============================================================================
// scripts/consolidate_frames_en.js
// Consolida frames de escenas en inglés en un solo directorio con numeración
// secuencial para FFmpeg.
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
  'intro_accident',
  'no_way_back',
  'gravity',
  'event_horizon',
  'surprise_supermassive',
  'time',
  'spaghettification',
  'the_end',
  'the_punchline',
  'outro'
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
info(`Consolidación completa: ${globalIndex} frames totales`);
console.log(`Total frames: ${globalIndex}`);
