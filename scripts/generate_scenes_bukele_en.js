// ============================================================================
// scripts/generate_scenes_bukele_en.js
// Genera las escenas HTML en inglés para el proyecto Bukele.
// Objetos con colores brillantes sobre fondo oscuro (no todo negro).
// Rutas resolubles por servidor HTTP.
// ============================================================================

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { VIDEO_CONFIG } from '../config/video.config.js';

const PROJECT_DIR = join(process.cwd(), 'projects', 'bukele_agujero_negro');
const SCENES_DIR = join(PROJECT_DIR, 'scenes');
const STORYBOARD_PATH = join(PROJECT_DIR, 'storyboard_en.json');

const fs = await import('node:fs');
const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, 'utf8'));

mkdirSync(SCENES_DIR, { recursive: true });

const THREE_MODULE_URL = '/node_modules/three/build/three.module.js';
const THREE_ADDONS_URL = '/node_modules/three/examples/jsm/';

function buildSceneHTML(scene) {
  const { id, type, camera, typography, narrationText } = scene;
  const width = VIDEO_CONFIG.width;
  const height = VIDEO_CONFIG.height;

  let threeInit = '';
  let threeAnimate = '';

  const commonLights = `
    const ambient = new THREE.AmbientLight(0x666666, 0.5);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x44aaff, 0.5);
    fillLight.position.set(-5, 2, 5);
    scene.add(fillLight);
    const rimLight = new THREE.SpotLight(0xff00ff, 0.8);
    rimLight.position.set(0, 3, -8);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);
  `;

  switch (type) {
    case '3d': {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        // Figura estilizada (traje, no copia de persona real)
        const figureGroup = new THREE.Group();
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 20), new THREE.MeshStandardMaterial({color: 0xdddddd}));
        head.position.y = 1.8;
        figureGroup.add(head);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.5), new THREE.MeshStandardMaterial({color: 0x111144}));
        body.position.y = 1.0;
        figureGroup.add(body);
        const suitJacket = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.6), new THREE.MeshStandardMaterial({color: 0x0a0a2a}));
        suitJacket.position.y = 0.35;
        figureGroup.add(suitJacket);
        figureGroup.position.set(0, 0, -4);
        scene.add(figureGroup);
        window.__figure = figureGroup;

        // Agujero negro supermasivo con disco de acreción visible
        const bhGroup = new THREE.Group();
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.6, 40, 40), new THREE.MeshBasicMaterial({color: 0x050505}));
        bhGroup.add(core);
        const ringGeo = new THREE.RingGeometry(1.7, 4.2, 96);
        const ringMat = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide});
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        bhGroup.add(ring);
        const innerRing = new THREE.Mesh(new THREE.RingGeometry(1.65, 2.0, 64), new THREE.MeshBasicMaterial({color: 0xffaa00, transparent: true, opacity: 0.5, side: THREE.DoubleSide}));
        innerRing.rotation.x = -Math.PI / 2;
        bhGroup.add(innerRing);
        bhGroup.position.set(0, -1.5, -10);
        scene.add(bhGroup);
        window.__blackHole = bhGroup;

        // Campo de estrellas brillante
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(3000 * 3);
        for (let i = 0; i < 3000; i++) {
          starPos[i*3] = (Math.random()-0.5)*200;
          starPos[i*3+1] = (Math.random()-0.5)*200;
          starPos[i*3+2] = (Math.random()-0.5)*200 - 30;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.5, transparent: true, opacity: 0.9});
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);
        window.__stars = stars;
      `;
      threeAnimate = `
        if (window.__figure) {
          window.__figure.position.z += 0.04;
          window.__figure.rotation.y += 0.02;
        }
        if (window.__blackHole) {
          window.__blackHole.rotation.y += 0.015;
          window.__blackHole.children[1].rotation.z += 0.03;
          if (window.__blackHole.children[2]) {
            window.__blackHole.children[2].rotation.z -= 0.02;
          }
        }
        if (window.__stars) {
          window.__stars.rotation.y += 0.004;
        }
      `;
      break;
    }
    case 'astronomy': {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        // Agujero negro central brillante
        const bhGroup = new THREE.Group();
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 40, 40), new THREE.MeshBasicMaterial({color: 0x020202}));
        bhGroup.add(core);
        const glowGeo = new THREE.SphereGeometry(1.8, 40, 40);
        const glowMat = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.25});
        const glow = new THREE.Mesh(glowGeo, glowMat);
        bhGroup.add(glow);
        const diskGeo = new THREE.RingGeometry(1.9, 5, 128);
        const diskMat = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide});
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = -Math.PI / 2;
        bhGroup.add(disk);
        bhGroup.position.set(0, -2, -8);
        scene.add(bhGroup);
        window.__bhGroup = bhGroup;

        // Estrellas de fondo con brillo
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(4000 * 3);
        for (let i = 0; i < 4000; i++) {
          starPos[i*3] = (Math.random()-0.5)*300;
          starPos[i*3+1] = (Math.random()-0.5)*300;
          starPos[i*3+2] = (Math.random()-0.5)*300 - 50;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({color: 0xaaddff, size: 0.4, transparent: true, opacity: 0.85});
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);
        window.__stars = stars;
      `;
      threeAnimate = `
        if (window.__bhGroup) {
          window.__bhGroup.rotation.y += 0.02;
          window.__bhGroup.children[2].rotation.z += 0.04;
          const glow = window.__bhGroup.children[1];
          glow.material.opacity = 0.2 + Math.sin(performance.now()*0.002)*0.1;
        }
        if (window.__stars) {
          window.__stars.rotation.y += 0.006;
        }
      `;
      break;
    }
    case 'physics': {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        // Grid del espacio-tiempo con colores visibles
        const gridHelper = new THREE.GridHelper(60, 60, 0xffaa00, 0x222244);
        gridHelper.position.y = -3;
        scene.add(gridHelper);
        window.__grid = gridHelper;

        // Agujero negro en el centro
        const bh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 40), new THREE.MeshBasicMaterial({color: 0x000000}));
        bh.position.set(0, -3, -7);
        scene.add(bh);
        window.__bh = bh;

        // Reloj distorsionado (escena de tiempo)
        if ('${id}' === 'el_tiempo') {
          const clockGroup = new THREE.Group();
          const face = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0x4444aa}));
          face.rotation.x = -Math.PI / 2;
          clockGroup.add(face);
          const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.12), new THREE.MeshStandardMaterial({color: 0xff3333}));
          hand.position.y = 0.4;
          clockGroup.add(hand);
          clockGroup.position.set(0, 1.5, -6);
          scene.add(clockGroup);
          window.__clock = clockGroup;
        }

        // Silueta estirándose (espaguetificación) - colores visibles
        if ('${id}' === 'el_estiramiento') {
          const stretchGroup = new THREE.Group();
          const segments = [];
          for (let i = 0; i < 10; i++) {
            const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), new THREE.MeshStandardMaterial({color: 0xeeeeee}));
            seg.position.y = -1.5 + i * 0.9;
            stretchGroup.add(seg);
            segments.push(seg);
          }
          stretchGroup.position.set(0, 0, -5);
          scene.add(stretchGroup);
          window.__stretch = { group: stretchGroup, segments };
        }
      `;
      threeAnimate = `
        if (window.__grid) {
          const time = performance.now() * 0.001;
          const pos = window.__grid.geometry.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const dist = Math.sqrt(x*x + y*y);
            const wave = Math.sin(dist * 0.4 - time * 3) * 0.8;
            pos.setZ(i, wave);
          }
          pos.needsUpdate = true;
        }
        if (window.__bh) {
          window.__bh.rotation.y += 0.025;
        }
        if (window.__clock) {
          window.__clock.rotation.z += 0.03;
        }
        if (window.__stretch) {
          const t = performance.now() * 0.001;
          window.__stretch.segments.forEach((seg, i) => {
            seg.scale.y = 1 + Math.abs(Math.sin(t * 2 + i)) * 3;
            seg.position.y = -1.5 + i * 0.9 + Math.sin(t + i) * 0.6;
          });
        }
      `;
      break;
    }
    default: {
      threeInit = `
        import * as THREE from 'three';
        ${commonLights}
        const geo = new THREE.IcosahedronGeometry(1.5, 1);
        const mat = new THREE.MeshStandardMaterial({color: 0x4488ff, emissive: 0x112244, roughness: 0.3});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, -6);
        scene.add(mesh);
        window.__obj = mesh;
      `;
      threeAnimate = `
        if (window.__obj) {
          window.__obj.rotation.y += 0.02;
          window.__obj.rotation.x += 0.015;
        }
      `;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scene ${id}</title>
<style>
  body { margin:0; overflow:hidden; background:#0a0a1a; }
  canvas { display:block; width:100vw; height:100vh; }
  #typography {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    color:#ffffff; font-family:'Segoe UI',Arial,sans-serif; font-size:56px; font-weight:bold;
    text-align:center; pointer-events:none; opacity:0; transition:opacity 0.6s ease;
    text-shadow: 0 0 20px rgba(0,255,255,0.6), 0 0 40px rgba(255,0,255,0.4);
    padding:30px; box-sizing:border-box; max-width:90%; line-height:1.4;
  }
  #overlay {
    position:absolute; top:15px; left:15px; color:#00ffff; font-family:monospace;
    font-size:16px; background:rgba(0,0,0,0.7); padding:10px; border-radius:6px;
    pointer-events:none; border:1px solid #00ffff;
  }
</style>
<script type="importmap">
  {
    "imports": {
      "three": "${THREE_MODULE_URL}",
      "three/addons/": "${THREE_ADDONS_URL}"
    }
  }
</script>
</head>
<body>
<div id="overlay">Scene: ${id} | t=<span id="time">0</span>s</div>
<div id="typography">${typography.text}</div>
<script type="module">
  import * as THREE from 'three';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a1a);
  const camera = new THREE.PerspectiveCamera(45, ${width}/${height}, 0.1, 2000);
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
    if (typ) { typ.style.opacity = 1; }
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
for (let i = 0; i < storyboard.scenes.length; i++) {
  const scene = storyboard.scenes[i];
  const html = buildSceneHTML(scene);
  const fileName = `scene-${String(i).padStart(2, '0')}-${scene.id}.html`;
  const filePath = join(SCENES_DIR, fileName);
  writeFileSync(filePath, html, 'utf8');
  generated += 1;
  console.log(`Generated: ${fileName} (${scene.start}s-${scene.end}s)`);
}

console.log(`\nTotal scenes generated: ${generated}`);
console.log(`Directory: ${SCENES_DIR}`);
