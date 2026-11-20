// ============================================================================
// scripts/generate_scenes_bukele.js
// Genera los archivos HTML de cada escena para el proyecto Bukele.
// Cada HTML es autocontenido con Three.js y expone window.updateScene(t).
// ============================================================================

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { VIDEO_CONFIG } from '../config/video.config.js';

const PROJECT_DIR = join(process.cwd(), 'projects', 'bukele_agujero_negro');
const SCENES_DIR = join(PROJECT_DIR, 'scenes');
const STORYBOARD_PATH = join(PROJECT_DIR, 'storyboard.json');

const fs = await import('node:fs');
const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, 'utf8'));

mkdirSync(SCENES_DIR, { recursive: true });

function buildSceneHTML(scene) {
  const { id, type, camera, objects, lighting, effects, typography, narrationText } = scene;
  const width = VIDEO_CONFIG.width;
  const height = VIDEO_CONFIG.height;

  // Construcción del código Three.js específico por tipo de escena
  let threeInit = '';
  let threeAnimate = '';

  const commonLights = `
    const ambient = new THREE.AmbientLight(0x444444, 0.4);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xaaaaaa, 0.4);
    fillLight.position.set(-5, 2, 5);
    scene.add(fillLight);
  `;

  switch (type) {
    case '3d': {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        // Silueta de Bukele (estilizada, sin copiar personas reales)
        const bukeleGroup = new THREE.Group();
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshStandardMaterial({color: 0x333333}));
        head.position.y = 1.6;
        bukeleGroup.add(head);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.4), new THREE.MeshStandardMaterial({color: 0x1a1a2e}));
        body.position.y = 0.9;
        bukeleGroup.add(body);
        const suit = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.5), new THREE.MeshStandardMaterial({color: 0x0d1b2a}));
        suit.position.y = 0.3;
        bukeleGroup.add(suit);
        bukeleGroup.position.set(0, 0, -3);
        scene.add(bukeleGroup);
        window.__bukele = bukeleGroup;

        // Agujero negro supermasivo
        const bhGroup = new THREE.Group();
        const bhCore = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshBasicMaterial({color: 0x000000}));
        bhGroup.add(bhCore);
        const ringGeo = new THREE.RingGeometry(1.6, 3.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide});
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        bhGroup.add(ring);
        bhGroup.position.set(0, -1, -8);
        scene.add(bhGroup);
        window.__blackHole = bhGroup;
      `;
      threeAnimate = `
        if (window.__bukele) {
          window.__bukele.position.z += 0.03;
          window.__bukele.rotation.y += 0.02;
        }
        if (window.__blackHole) {
          window.__blackHole.rotation.y += 0.01;
          window.__blackHole.children[1].rotation.z += 0.02;
        }
      `;
      break;
    }
    case 'astronomy': {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        // Agujero negro con disco de acreción
        const bhGroup = new THREE.Group();
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshBasicMaterial({color: 0x000000}));
        bhGroup.add(core);
        const diskGeo = new THREE.RingGeometry(1.3, 4, 128);
        const diskMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = -Math.PI / 2;
        bhGroup.add(disk);
        bhGroup.position.set(0, -1, -6);
        scene.add(bhGroup);
        window.__bhGroup = bhGroup;

        // Estrellas de fondo
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(2000 * 3);
        for (let i = 0; i < 2000; i++) {
          starPos[i*3] = (Math.random()-0.5)*100;
          starPos[i*3+1] = (Math.random()-0.5)*100;
          starPos[i*3+2] = (Math.random()-0.5)*100 - 20;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.3, transparent: true, opacity: 0.8});
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);
        window.__stars = stars;
      `;
      threeAnimate = `
        if (window.__bhGroup) {
          window.__bhGroup.rotation.y += 0.015;
          window.__bhGroup.children[1].rotation.z += 0.03;
        }
        if (window.__stars) {
          window.__stars.rotation.y += 0.005;
        }
      `;
      break;
    }
    case 'physics': {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        // Grid del espacio-tiempo
        const gridHelper = new THREE.GridHelper(40, 40, 0xffaa00, 0x333333);
        gridHelper.position.y = -2;
        scene.add(gridHelper);
        window.__grid = gridHelper;

        // Agujero negro en el centro
        const bh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({color: 0x000000}));
        bh.position.set(0, -2, -5);
        scene.add(bh);
        window.__bh = bh;

        // Reloj para escena de tiempo
        if ('${id}' === 'el_tiempo') {
          const clockGroup = new THREE.Group();
          const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshStandardMaterial({color: 0xffffff}));
          clockFace.rotation.x = -Math.PI / 2;
          clockGroup.add(clockFace);
          const hand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.1), new THREE.MeshStandardMaterial({color: 0xff0000}));
          hand.position.y = 0.3;
          clockGroup.add(hand);
          clockGroup.position.set(0, 1, -4);
          scene.add(clockGroup);
          window.__clock = clockGroup;
        }

        // Silueta estirándose (espaguetificación)
        if ('${id}' === 'el_estiramiento') {
          const stretchGroup = new THREE.Group();
          const segments = [];
          for (let i = 0; i < 8; i++) {
            const seg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), new THREE.MeshStandardMaterial({color: 0x333333}));
            seg.position.y = -1 + i * 0.7;
            stretchGroup.add(seg);
            segments.push(seg);
          }
          stretchGroup.position.set(0, 0, -4);
          scene.add(stretchGroup);
          window.__stretch = { group: stretchGroup, segments };
        }
      `;
      threeAnimate = `
        if (window.__grid) {
          const time = performance.now() * 0.001;
          for (let i = 0; i < window.__grid.geometry.attributes.position.count; i++) {
            const y = window.__grid.geometry.attributes.position.getY(i);
            const x = window.__grid.geometry.attributes.position.getX(i);
            const dist = Math.sqrt(x*x + y*y);
            const wave = Math.sin(dist * 0.5 - time * 2) * 0.5;
            window.__grid.geometry.attributes.position.setZ(i, wave);
          }
          window.__grid.geometry.attributes.position.needsUpdate = true;
        }
        if (window.__bh) {
          window.__bh.rotation.y += 0.02;
        }
        if (window.__clock) {
          window.__clock.rotation.z += 0.02;
        }
        if (window.__stretch) {
          const t = performance.now() * 0.001;
          window.__stretch.segments.forEach((seg, i) => {
            const stretch = 1 + Math.sin(t + i) * 0.3;
            seg.scale.y = 1 + Math.abs(Math.sin(t * 2 + i)) * 2;
            seg.position.y = -1 + i * 0.7 + Math.sin(t + i) * 0.5;
          });
        }
      `;
      break;
    }
    default: {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        const geo = new THREE.IcosahedronGeometry(1, 0);
        const mat = new THREE.MeshStandardMaterial({color: 0x4488ff, roughness: 0.4});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, -5);
        scene.add(mesh);
        window.__obj = mesh;
      `;
      threeAnimate = `
        if (window.__obj) {
          window.__obj.rotation.y += 0.02;
          window.__obj.rotation.x += 0.01;
        }
      `;
    }
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Escena ${id}</title>
<style>
  body { margin:0; overflow:hidden; background:#000; }
  canvas { display:block; width:100vw; height:100vh; }
  #typography {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    color:#ffffff; font-family:Arial,sans-serif; font-size:48px; font-weight:bold;
    text-align:center; pointer-events:none; opacity:0; transition:opacity 0.5s ease;
    text-shadow: 0 0 10px rgba(0,255,255,0.5); padding:20px; box-sizing:border-box;
    max-width:90%; line-height:1.4;
  }
  #overlay {
    position:absolute; top:15px; left:15px; color:#00ffff; font-family:monospace;
    font-size:14px; background:rgba(0,0,0,0.6); padding:8px; border-radius:4px;
    pointer-events:none;
  }
</style>
<script type="importmap">
  {
    "imports": {
      "three": "../../../node_modules/three/build/three.module.js",
      "three/addons/": "../../../node_modules/three/examples/jsm/"
    }
  }
</script>
</head>
<body>
<div id="overlay">Escena: ${id} | t=<span id="time">0</span>s</div>
<div id="typography">${typography.text}</div>
<script type="module">
  import * as THREE from 'three';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(45, ${width}/${height}, 0.1, 1000);
  camera.position.set(${camera.position[0]}, ${camera.position[1]}, ${camera.position[2]});
  camera.lookAt(${camera.lookAt[0]}, ${camera.lookAt[1]}, ${camera.lookAt[2]});
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(${width}, ${height});
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  ${threeInit}

  window.updateScene = function(timeInSeconds) {
    const t = Number(timeInSeconds) || 0;
    document.getElementById('time').textContent = t.toFixed(2);
    const typ = document.getElementById('typography');
    if (typ) {
      typ.style.opacity = 1;
    }
    ${threeAnimate}
    renderer.render(scene, camera);
    return { localTime: t, active: true };
  };

  if (typeof window.updateScene === 'function') window.updateScene(0);
</script>
</body>
</html>`;
}

let generated = 0;
for (const scene of storyboard.scenes) {
  const html = buildSceneHTML(scene);
  const fileName = `scene-${String(storyboard.scenes.indexOf(scene)).padStart(2, '0')}-${scene.id}.html`;
  const filePath = join(SCENES_DIR, fileName);
  writeFileSync(filePath, html, 'utf8');
  generated += 1;
  console.log(`Generada: ${fileName} (${scene.start}s-${scene.end}s)`);
}

console.log(`\nTotal escenas generadas: ${generated}`);
console.log(`Directorio: ${SCENES_DIR}`);
