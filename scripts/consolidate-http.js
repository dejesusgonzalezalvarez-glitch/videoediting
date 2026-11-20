#!/usr/bin/env node
import { mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const scenesDir = 'temp/system-solar/frames-http';
const scenes = ['hook', 'sol', 'planetas', 'gigantes', 'hechos', 'cinturon', 'cierre'];
const allDir = join(scenesDir, 'all-fixed');

mkdirSync(allDir, { recursive: true });

let total = 0;
let globalIndex = 0;
for (const scene of scenes) {
  const srcDir = join(scenesDir, scene);
  if (!existsSync(srcDir)) continue;
  const files = readdirSync(srcDir).filter(f => f.endsWith('.png')).sort();
  for (const file of files) {
    const newName = `frame-${String(globalIndex).padStart(6, '0')}.png`;
    copyFileSync(join(srcDir, file), join(allDir, newName));
    globalIndex++;
    total++;
  }
  console.log(`📁 ${scene}: ${files.length} frames (offset ${total - files.length}-${total - 1})`);
}

console.log(`\n✅ Total consolidado: ${total} frames en ${allDir}`);
