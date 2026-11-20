#!/usr/bin/env node
import { mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const scenesDir = 'temp/system-solar/frames';
const scenes = ['hook', 'sol', 'planetas', 'gigantes', 'hechos', 'cinturon', 'cierre'];
const allDir = join(scenesDir, 'all');

mkdirSync(allDir, { recursive: true });

let total = 0;
for (const scene of scenes) {
  const srcDir = join(scenesDir, scene);
  if (!existsSync(srcDir)) continue;
  const files = readdirSync(srcDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    copyFileSync(join(srcDir, file), join(allDir, file));
    total++;
  }
  console.log(`📁 ${scene}: ${files.length} frames`);
}

console.log(`\n✅ Total consolidado: ${total} frames en ${allDir}`);
