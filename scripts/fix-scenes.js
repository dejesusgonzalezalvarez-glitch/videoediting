#!/usr/bin/env node
// ============================================================================
// scripts/fix-scenes.js
// Corrige las escenas HTML para usar Three.js local (no CDN) mediante importmap.
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

  // Reemplazar la importación CDN de Three.js por importmap local
  const oldImport = "import * as THREE from 'https://unpkg.com/three@0.187.0/build/three.module.js';";
  
  if (content.includes(oldImport)) {
    // Remover la importación CDN
    content = content.replace(oldImport, '');
    
    // Agregar importmap después de <head>
    const importmap = `  <script type="importmap">
    {
      "imports": {
        "three": "/node_modules/three/build/three.module.js",
        "three/addons/": "/node_modules/three/examples/jsm/"
      }
    }
  </script>`;
    
    // Insertar después de <head>
    content = content.replace('<head>', '<head>\n' + importmap);
    
    writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corregido: ${file}`);
  } else {
    console.log(`⚠️  Sin cambios (ya corregido o diferente): ${file}`);
  }
}

console.log('\n✅ Todas las escenas corregidas para usar Three.js local');
