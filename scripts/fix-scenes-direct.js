#!/usr/bin/env node
// ============================================================================
// scripts/fix-scenes-direct.js
// Corrige escenas HTML para usar import directo de Three.js (sin importmap).
// ============================================================================

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const scenesDir = join('projects', 'system-solar', 'scenes');

if (!existsSync(scenesDir)) {
  console.error(`❌ No se encuentra: ${scenesDir}`);
  process.exit(1);
}

const files = readdirSync(scenesDir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = join(scenesDir, file);
  let content = readFileSync(filePath, 'utf8');

  // Remover el script type="importmap" si existe
  const importmapRegex = /<script type="importmap">[\s\S]*?<\/script>/g;
  content = content.replace(importmapRegex, '');

  // Remover la importación CDN si existe
  content = content.replace("import * as THREE from 'https://unpkg.com/three@0.187.0/build/three.module.js';", '');

  // Agregar import directo al principio del script module
  const directImport = "import * as THREE from '../../../node_modules/three/build/three.module.js';\n";
  
  // Encontrar el script type="module" y agregar la importación después de la etiqueta de apertura
  const moduleScriptRegex = /(<script type="module">\s*\n?)/;
  content = content.replace(moduleScriptRegex, '$1' + directImport);

  writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Corregido: ${file}`);
}

console.log('\n✅ Todas las escenas corregidas con import directo');
