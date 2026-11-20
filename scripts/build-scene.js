// ============================================================================
// scripts/build-scene.js
// Generador automatizado de escenas a partir de un storyboard.
// Produce un archivo HTML autocontenido (Three.js + CSS) por escena, listo
// para ser capturado por Playwright. La función updateScene(time) es
// determinista: mismo tiempo -> mismo frame.
// ============================================================================

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SceneManager } from '../engine/SceneManager.js';
import { VIDEO_CONFIG } from '../config/video.config.js';
import { PATHS } from '../config/paths.config.js';
import { error, info } from './error-logger.js';

/**
 * Genera el HTML de una escena individual usando la configuración completa del storyboard.
 * @param {Object} sceneConfig - Configuración de la escena (del storyboard).
 * @param {number} localTime - Tiempo local dentro de la escena (segundos).
 * @param {number} progress - Progreso 0..1.
 * @returns {string} HTML completo.
 */
export function renderSceneHTML(sceneConfig, localTime, progress) {
  const { 
    id, 
    type = '3d', 
    camera = {}, 
    objects = [], 
    lighting = 'default',
    effects = [],
    typography = {},
    config = {}
  } = sceneConfig;

  const cameraPosition = camera.position || [0, 5, 12];
  const cameraLookAt = camera.lookAt || [0, 0, 0];
  const cameraMove = camera.move || 'static';

  // Construir objetos 3D basados en la lista del storyboard
  const threeInit = buildObjectsInit(objects, config, localTime);
  const threeAnimate = buildObjectsAnimate(objects, config, cameraMove, localTime, progress);

  // Construir iluminación
  const lightingSetup = buildLighting(lighting);

  // Tipografía
  const typographyHtml = typography.text
    ? `<div id="typography-layer" style="--typo-duration: ${typography.duration || 5}s;">${escapeHtml(typography.text)}</div>`
    : '';

  // Efectos CSS adicionales
  const effectsCss = buildEffectsCss(effects);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Escena ${id}</title>
<style>
  body { margin:0; overflow:hidden; background:#000; }
  canvas { display:block; width:100vw; height:100vh; }
  #typography-layer { 
    position:absolute; top:0; left:0; width:100%; height:100%;
    display:flex; align-items:center; justify-content:center; color:#fff;
    font-family:Arial,sans-serif; font-size:48px; pointer-events:none;
    text-align:center; padding:20px; box-sizing:border-box; opacity:1; 
    animation: fadeInOut var(--typo-duration, 5s) ease-in-out forwards;
  }
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(20px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  #overlay { position:absolute; top:20px; left:20px; color:#0f0; font-family:monospace;
    font-size:16px; background:rgba(0,0,0,0.6); padding:8px; border-radius:4px;
    pointer-events:none; }
  ${effectsCss}
</style>
<script type="importmap">
  {
    "imports": {
      "three": "../../node_modules/three/build/three.module.js",
      "three/addons/": "../../node_modules/three/examples/jsm/"
    }
  }
</script>
</head>
<body>
<div id="overlay">Escena: ${id} | t=<span id="time">0</span>s</div>
${typographyHtml}
<script type="module">
  import * as THREE from 'three';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  // Cámara con posición y lookAt del storyboard
  const camera = new THREE.PerspectiveCamera(45, ${VIDEO_CONFIG.width}/${VIDEO_CONFIG.height}, 0.1, 1000);
  camera.position.set(${cameraPosition.join(', ')});
  camera.lookAt(${cameraLookAt.join(', ')});
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(${VIDEO_CONFIG.width}, ${VIDEO_CONFIG.height});
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  ${lightingSetup}

  ${threeInit}

  // Función determinista exigida: updateScene(timeInSeconds)
  window.updateScene = function(timeInSeconds) {
    const localTime = Number(timeInSeconds) || 0;
    document.getElementById('time').textContent = localTime.toFixed(2);
    
    ${threeAnimate}
    
    // Movimiento de cámara según storyboard
    ${buildCameraAnimation(cameraMove, cameraPosition, cameraLookAt)}
    
    renderer.render(scene, camera);
    return { localTime, active: true };
  };

  // Render inicial.
  if (typeof window.updateScene === 'function') window.updateScene(0);
</script>
</body>
</html>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function buildObjectsInit(objects, config, localTime) {
  if (objects.length === 0) {
    return `// No objects defined`;
  }

  const parts = [];
  
  for (const objName of objects) {
    switch (objName) {
      case 'sol_silhouette': {
        parts.push(`
        // Sol - silueta brillante
        const solGeo = new THREE.SphereGeometry(3, 64, 64);
        const solMat = new THREE.MeshBasicMaterial({ 
          color: 0xffaa00, 
          transparent: true, 
          opacity: 0.9,
          side: THREE.DoubleSide 
        });
        const sol = new THREE.Mesh(solGeo, solMat);
        sol.position.set(0, 0, -5);
        scene.add(sol);
        window.__sol = sol;
        
        // Corona solar
        const coronaGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({ 
          color: 0xff8800, 
          transparent: true, 
          opacity: 0.15,
          side: THREE.BackSide 
        });
        const corona = new THREE.Mesh(coronaGeo, coronaMat);
        corona.position.set(0, 0, -5);
        scene.add(corona);
        window.__corona = corona;
        `);
        break;
      }
      case 'tierra_orbita': {
        parts.push(`
        // Tierra orbitando
        const tierraGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const tierraMat = new THREE.MeshStandardMaterial({ 
          color: 0x22aaff, 
          roughness: 0.7,
          metalness: 0.1
        });
        const tierra = new THREE.Mesh(tierraGeo, tierraMat);
        tierra.position.set(8, 0, -5);
        tierra.castShadow = true;
        tierra.receiveShadow = true;
        scene.add(tierra);
        window.__tierra = tierra;
        window.__tierraAngle = 0;
        
        // Anillo de órbita
        const orbitGeo = new THREE.RingGeometry(7.9, 8.1, 64);
        const orbitMat = new THREE.MeshBasicMaterial({ 
          color: 0x4444ff, 
          transparent: true, 
          opacity: 0.3,
          side: THREE.DoubleSide 
        });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = -Math.PI / 2;
        scene.add(orbit);
        window.__orbit = orbit;
        `);
        break;
      }
      case 'tierra_silhouette': {
        parts.push(`
        // Tierra silueta (sin sol)
        const tierraGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const tierraMat = new THREE.MeshStandardMaterial({ 
          color: 0x1155aa, 
          roughness: 0.8,
          metalness: 0.05,
          emissive: 0x001133,
          emissiveIntensity: 0.3
        });
        const tierra = new THREE.Mesh(tierraGeo, tierraMat);
        tierra.position.set(0, 0, -2);
        tierra.castShadow = true;
        tierra.receiveShadow = true;
        scene.add(tierra);
        window.__tierra = tierra;
        `);
        break;
      }
      case 'fondo_estrellas': {
        parts.push(`
        // Fondo de estrellas
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 3000;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);
        const sizes = new Float32Array(starsCount);
        
        for (let i = 0; i < starsCount; i++) {
          const radius = 50 + Math.random() * 100;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = radius * Math.cos(phi);
          
          const colorChoice = Math.random();
          if (colorChoice < 0.4) {
            colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
          } else if (colorChoice < 0.7) {
            colors[i * 3] = 1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
          } else {
            colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1;
          }
          sizes[i] = Math.random() * 2 + 0.5;
        }
        
        starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starsMat = new THREE.PointsMaterial({ 
          size: 1, 
          vertexColors: true, 
          transparent: true, 
          opacity: 0.8,
          sizeAttenuation: true 
        });
        const stars = new THREE.Points(starsGeo, starsMat);
        scene.add(stars);
        window.__stars = stars;
        `);
        break;
      }
      case 'reloj_tierra': {
        parts.push(`
        // Reloj visual representando tiempo
        const clockGroup = new THREE.Group();
        
        // Cara del reloj
        const faceGeo = new THREE.CylinderGeometry(2, 2, 0.1, 32);
        const faceMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.y = 0;
        clockGroup.add(face);
        
        // Marcadores
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const markerGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
          const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const marker = new THREE.Mesh(markerGeo, markerMat);
          marker.position.set(Math.sin(angle) * 1.7, 0, Math.cos(angle) * 1.7);
          marker.rotation.y = -angle;
          clockGroup.add(marker);
        }
        
        // Manecilla de horas
        const hourHandGeo = new THREE.BoxGeometry(0.05, 1.2, 0.05);
        const handMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const hourHand = new THREE.Mesh(hourHandGeo, handMat);
        hourHand.position.set(0, 0.6, 0.1);
        clockGroup.add(hourHand);
        window.__hourHand = hourHand;
        
        // Manecilla de minutos
        const minHandGeo = new THREE.BoxGeometry(0.03, 1.6, 0.03);
        const minHand = new THREE.Mesh(minHandGeo, handMat);
        minHand.position.set(0, 0.8, 0.1);
        clockGroup.add(minHand);
        window.__minHand = minHand;
        
        clockGroup.position.set(0, 0, -2);
        scene.add(clockGroup);
        window.__clock = clockGroup;
        `);
        break;
      }
      case 'tierra_fading': {
        parts.push(`
        // Tierra desvaneciéndose
        const tierraGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const tierraMat = new THREE.MeshStandardMaterial({ 
          color: 0x22aaff, 
          roughness: 0.7,
          transparent: true,
          opacity: 1.0
        });
        const tierra = new THREE.Mesh(tierraGeo, tierraMat);
        tierra.position.set(0, 0, -2);
        scene.add(tierra);
        window.__tierraFading = tierra;
        window.__tierraMat = tierraMat;
        `);
        break;
      }
      case 'raya_stretching': {
        parts.push(`
        // Efecto de estiramiento (espaguetización)
        const stretchGroup = new THREE.Group();
        
        const segmentCount = 20;
        for (let i = 0; i < segmentCount; i++) {
          const scale = 1 + (i / segmentCount) * 5;
          const geo = new THREE.SphereGeometry(0.3 / scale, 16, 16);
          const mat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.6 - i * 0.02, 0.8, 0.5),
            roughness: 0.5,
            metalness: 0.2
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = (i - segmentCount/2) * 0.5 * scale;
          mesh.scale.y = scale;
          stretchGroup.add(mesh);
          if (!window.__stretchSegments) window.__stretchSegments = [];
          window.__stretchSegments.push({ mesh, baseScale: scale, index: i });
        }
        
        stretchGroup.position.set(0, 0, -4);
        scene.add(stretchGroup);
        window.__stretchGroup = stretchGroup;
        `);
        break;
      }
      case 'tidal_forces_visual': {
        parts.push(`
        // Visualización de fuerzas de marea
        const tideGroup = new THREE.Group();
        
        const ringCount = 5;
        for (let i = 0; i < ringCount; i++) {
          const radius = 1.5 + i * 0.5;
          const geo = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
          const mat = new THREE.MeshBasicMaterial({ 
            color: 0xff4400, 
            transparent: true, 
            opacity: 0.3 - i * 0.05,
            side: THREE.DoubleSide 
          });
          const ring = new THREE.Mesh(geo, mat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = (i - 2) * 0.3;
          tideGroup.add(ring);
          if (!window.__tideRings) window.__tideRings = [];
          window.__tideRings.push(ring);
        }
        
        tideGroup.position.set(0, 0, -4);
        scene.add(tideGroup);
        window.__tideGroup = tideGroup;
        `);
        break;
      }
      case 'agujero_negro_lejanoso': {
        parts.push(`
        // Agujero negro lejano
        const bhGroup = new THREE.Group();
        
        // Horizonte de eventos
        const eventGeo = new THREE.SphereGeometry(1, 32, 32);
        const eventMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const eventHorizon = new THREE.Mesh(eventGeo, eventMat);
        bhGroup.add(eventHorizon);
        window.__eventHorizon = eventHorizon;
        
        // Disco de acreción
        const diskGeo = new THREE.RingGeometry(1.2, 3, 64);
        const diskMat = new THREE.MeshBasicMaterial({ 
          color: 0xff6600, 
          transparent: true, 
          opacity: 0.6,
          side: THREE.DoubleSide 
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = -Math.PI / 2;
        bhGroup.add(disk);
        window.__accretionDisk = disk;
        
        // Anillo de fotones
        const ringGeo = new THREE.RingGeometry(1.0, 1.15, 64);
        const ringMat = new THREE.MeshBasicMaterial({ 
          color: 0xffaa00, 
          transparent: true, 
          opacity: 0.8,
          side: THREE.DoubleSide 
        });
        const photonRing = new THREE.Mesh(ringGeo, ringMat);
        photonRing.rotation.x = -Math.PI / 2;
        bhGroup.add(photonRing);
        window.__photonRing = photonRing;
        
        bhGroup.position.set(0, 0, -20);
        scene.add(bhGroup);
        window.__blackHole = bhGroup;
        `);
        break;
      }
      case 'sol_fading': {
        parts.push(`
        // Sol desvaneciéndose
        const solGeo = new THREE.SphereGeometry(2, 32, 32);
        const solMat = new THREE.MeshBasicMaterial({ 
          color: 0xffaa00, 
          transparent: true, 
          opacity: 0.5
        });
        const sol = new THREE.Mesh(solGeo, solMat);
        sol.position.set(0, 0, -10);
        scene.add(sol);
        window.__solFading = sol;
        window.__solFadingMat = solMat;
        `);
        break;
      }
      case 'particles_stars': {
        // Ya incluido en fondo_estrellas
        break;
      }
      default: {
        // Objeto genérico
        parts.push(`
        // Objeto: ${objName}
        const geo = new THREE.SphereGeometry(1, 16, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        window.__${objName.replace(/-/g, '_')} = mesh;
        `);
      }
    }
  }
  
  return parts.join('\n');
}

function buildObjectsAnimate(objects, config, cameraMove, localTime, progress) {
  const parts = [];
  
  for (const objName of objects) {
    switch (objName) {
      case 'sol_silhouette': {
        parts.push(`
        if (window.__sol) {
          window.__sol.rotation.y = localTime * 0.1;
          window.__sol.rotation.x = localTime * 0.05;
        }
        if (window.__corona) {
          window.__corona.rotation.y = -localTime * 0.05;
          window.__corona.scale.setScalar(1 + Math.sin(localTime * 2) * 0.05);
        }
        `);
        break;
      }
      case 'tierra_orbita': {
        parts.push(`
        if (window.__tierra) {
          window.__tierraAngle += 0.02;
          window.__tierra.position.x = Math.cos(window.__tierraAngle) * 8;
          window.__tierra.position.z = Math.sin(window.__tierraAngle) * 8 - 5;
          window.__tierra.rotation.y = localTime * 0.5;
        }
        if (window.__orbit) {
          window.__orbit.rotation.z = localTime * 0.01;
        }
        `);
        break;
      }
      case 'tierra_silhouette': {
        parts.push(`
        if (window.__tierra) {
          window.__tierra.rotation.y = localTime * 0.3;
          // Deriva lenta alejándose
          window.__tierra.position.z -= 0.01;
        }
        `);
        break;
      }
      case 'fondo_estrellas': {
        parts.push(`
        if (window.__stars) {
          window.__stars.rotation.y = localTime * 0.001;
          window.__stars.rotation.x = localTime * 0.0005;
        }
        `);
        break;
      }
      case 'reloj_tierra': {
        parts.push(`
        if (window.__clock) {
          window.__clock.rotation.y = localTime * 0.1;
        }
        if (window.__hourHand) {
          window.__hourHand.rotation.z = -localTime * 0.5; // Acelerado para visualización
        }
        if (window.__minHand) {
          window.__minHand.rotation.z = -localTime * 6; // 12x más rápido
        }
        `);
        break;
      }
      case 'tierra_fading': {
        parts.push(`
        if (window.__tierraFading && window.__tierraMat) {
          window.__tierraFading.rotation.y = localTime * 0.2;
          const fadeProgress = Math.min(progress * 1.5, 1);
          window.__tierraMat.opacity = 1 - fadeProgress * 0.8;
          window.__tierraFading.scale.setScalar(1 - fadeProgress * 0.3);
        }
        `);
        break;
      }
      case 'raya_stretching': {
        parts.push(`
        if (window.__stretchSegments) {
          window.__stretchSegments.forEach((seg, i) => {
            const stretchFactor = 1 + progress * 10 * (seg.index / window.__stretchSegments.length);
            seg.mesh.scale.y = seg.baseScale * stretchFactor;
            seg.mesh.position.y = (seg.index - 10) * 0.5 * stretchFactor;
            seg.mesh.rotation.x = localTime * 0.5 + seg.index * 0.2;
          });
          if (window.__stretchGroup) {
            window.__stretchGroup.rotation.y = localTime * 0.3;
          }
        }
        `);
        break;
      }
      case 'tidal_forces_visual': {
        parts.push(`
        if (window.__tideRings) {
          window.__tideRings.forEach((ring, i) => {
            ring.rotation.z = localTime * 0.2 * (i % 2 === 0 ? 1 : -1);
            ring.scale.setScalar(1 + Math.sin(localTime * 2 + i) * 0.1);
          });
          if (window.__tideGroup) {
            window.__tideGroup.rotation.y = localTime * 0.1;
          }
        }
        `);
        break;
      }
      case 'agujero_negro_lejanoso': {
        parts.push(`
        if (window.__blackHole) {
          window.__blackHole.rotation.y = localTime * 0.02;
        }
        if (window.__accretionDisk) {
          window.__accretionDisk.rotation.z = localTime * 0.3;
        }
        if (window.__photonRing) {
          window.__photonRing.rotation.z = -localTime * 0.5;
          window.__photonRing.material.opacity = 0.5 + Math.sin(localTime * 5) * 0.3;
        }
        if (window.__eventHorizon) {
          window.__eventHorizon.scale.setScalar(1 + Math.sin(localTime * 3) * 0.02);
        }
        `);
        break;
      }
      case 'sol_fading': {
        parts.push(`
        if (window.__solFading && window.__solFadingMat) {
          const fadeProgress = Math.min(progress, 1);
          window.__solFadingMat.opacity = 0.5 * (1 - fadeProgress);
          window.__solFading.scale.setScalar(1 - fadeProgress * 0.5);
        }
        `);
        break;
      }
      default: {
        parts.push(`
        if (window.__${objName.replace(/-/g, '_')}) {
          window.__${objName.replace(/-/g, '_')}.rotation.y = localTime * 0.2;
        }
        `);
      }
    }
  }
  
  return parts.join('\n');
}

function buildLighting(lighting) {
  switch (lighting) {
    case 'cinematic_three_point':
      return `
  // Iluminación cinematográfica 3 puntos
  const keyLight = new THREE.DirectionalLight(0xffffee, 2);
  keyLight.position.set(10, 15, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);
  window.__keyLight = keyLight;

  const fillLight = new THREE.DirectionalLight(0x88aaff, 0.8);
  fillLight.position.set(-8, 5, 8);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffaa44, 1.2);
  rimLight.position.set(0, -10, -10);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0x222233, 0.3);
  scene.add(ambient);
      `;
    case 'rim_light_violet':
      return `
  // Iluminación de contorno violeta
  const rimLight = new THREE.DirectionalLight(0xaa66ff, 2);
  rimLight.position.set(0, -10, -10);
  scene.add(rimLight);

  const sideLight = new THREE.DirectionalLight(0x442288, 1);
  sideLight.position.set(-10, 0, 5);
  scene.add(sideLight);

  const ambient = new THREE.AmbientLight(0x110022, 0.4);
  scene.add(ambient);
      `;
    case 'warm_golden':
      return `
  // Iluminación dorada cálida
  const sunLight = new THREE.DirectionalLight(0xffdd88, 1.5);
  sunLight.position.set(10, 10, 10);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const ambient = new THREE.AmbientLight(0xffaa44, 0.5);
  scene.add(ambient);
      `;
    case 'dramatic_red_orange':
      return `
  // Iluminación dramática rojo/naranja
  const keyLight = new THREE.DirectionalLight(0xff4400, 2);
  keyLight.position.set(10, 5, 10);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xff8800, 0.5);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffaa00, 1.5);
  rimLight.position.set(0, -8, -8);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0x331100, 0.3);
  scene.add(ambient);
      `;
    case 'dark_ambient':
      return `
  // Iluminación ambiental oscura
  const ambient = new THREE.AmbientLight(0x111111, 0.5);
  scene.add(ambient);

  const faintLight = new THREE.DirectionalLight(0x444466, 0.3);
  faintLight.position.set(0, 10, 0);
  scene.add(faintLight);
      `;
    default:
      return `
  // Iluminación por defecto
  const ambient = new THREE.AmbientLight(0x444444, 0.6);
  scene.add(ambient);
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  light.castShadow = true;
  scene.add(light);
      `;
  }
}

function buildCameraAnimation(cameraMove, cameraPosition, cameraLookAt) {
  switch (cameraMove) {
    case 'zoom_in':
      return `
    // Zoom in suave
    const zoomProgress = Math.min(localTime / 5, 1);
    camera.position.z = ${cameraPosition[2]} * (1 - zoomProgress * 0.5);
    camera.lookAt(${cameraLookAt.join(', ')});
      `;
    case 'zoom_in_fast':
      return `
    // Zoom in rápido
    const zoomProgress = Math.min(localTime / 5, 1);
    camera.position.z = ${cameraPosition[2]} * (1 - zoomProgress * 0.7);
    camera.lookAt(${cameraLookAt.join(', ')});
      `;
    case 'push_in':
      return `
    // Push in (dolly)
    const pushProgress = Math.min(localTime / 6, 1);
    camera.position.z = ${cameraPosition[2]} * (1 - pushProgress * 0.5);
    camera.position.y = ${cameraPosition[1]} * (1 - pushProgress * 0.2);
    camera.lookAt(${cameraLookAt.join(', ')});
      `;
    case 'orbit_around':
      return `
    // Orbita alrededor del objeto
    const orbitAngle = localTime * 0.3;
    const radius = Math.sqrt(${cameraPosition[0]}**2 + ${cameraPosition[2]}**2);
    camera.position.x = Math.sin(orbitAngle) * radius;
    camera.position.z = Math.cos(orbitAngle) * radius;
    camera.lookAt(${cameraLookAt.join(', ')});
      `;
    case 'slow_zoom_out':
      return `
    // Zoom out lento
    const zoomProgress = Math.min(localTime / 8, 1);
    camera.position.z = ${cameraPosition[2]} * (1 + zoomProgress * 0.5);
    camera.position.y = ${cameraPosition[1]} * (1 + zoomProgress * 0.2);
    camera.lookAt(${cameraLookAt.join(', ')});
      `;
    default:
      return `
    // Cámara estática
    camera.lookAt(${cameraLookAt.join(', ')});
      `;
  }
}

function buildEffectsCss(effects) {
  if (effects.length === 0) return '';
  
  const cssParts = [];
  
  for (const effect of effects) {
    switch (effect) {
      case 'particles_stars':
        cssParts.push(`
  /* Partículas de estrellas en CSS como overlay */
  #star-particles::before {
    content: '';
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      radial-gradient(1px 1px at 10% 20%, white, transparent),
      radial-gradient(1px 1px at 30% 40%, white, transparent),
      radial-gradient(1px 1px at 50% 60%, white, transparent),
      radial-gradient(1px 1px at 70% 80%, white, transparent),
      radial-gradient(1px 1px at 90% 10%, #ffaa00, transparent);
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: starTwinkle 4s infinite;
    pointer-events: none;
    opacity: 0.5;
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.02); }
  }
        `);
        break;
      case 'light_bending':
      case 'star_distortion':
        cssParts.push(`
  /* Distorsión de lente gravitacional */
  canvas { 
    filter: url(#gravitational-lens);
  }
        `);
        break;
      case 'horizon_glow':
        cssParts.push(`
  /* Brillo en el horizonte */
  #horizon-glow::after {
    content: '';
    position: fixed; bottom: 0; left: 0; width: 100%; height: 30%;
    background: linear-gradient(to top, #ff6600, transparent);
    opacity: 0.3;
    pointer-events: none;
    animation: horizonPulse 3s infinite;
  }
  @keyframes horizonPulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.5; }
  }
        `);
        break;
      case 'crossing_distortion':
        cssParts.push(`
  /* Distorsión al cruzar */
  canvas { animation: distort 2s infinite; }
  @keyframes distort {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(1.02); }
  }
        `);
        break;
      case 'grid_curvature':
      case 'time_dilation':
        cssParts.push(`
  /* Curvatura de grid / dilatación temporal */
  #time-grid::before {
    content: '';
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridWarp 5s infinite;
    pointer-events: none;
  }
  @keyframes gridWarp {
    0% { transform: perspective(500px) rotateX(0deg); }
    50% { transform: perspective(500px) rotateX(5deg); }
    100% { transform: perspective(500px) rotateX(0deg); }
  }
        `);
        break;
      case 'spaghettification':
      case 'gravity_gradient':
        cssParts.push(`
  /* Efecto espaguetización */
  canvas { animation: stretch 1s infinite; }
  @keyframes stretch {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.05); }
  }
        `);
        break;
      case 'event_horizon_ring':
      case 'spacetime_tear':
        cssParts.push(`
  /* Anillo de horizonte de eventos */
  #event-ring::after {
    content: '';
    position: fixed; top: 50%; left: 50%; width: 200px; height: 200px;
    margin: -100px 0 0 -100px;
    border: 2px solid #ffaa00;
    border-radius: 50%;
    animation: ringPulse 2s infinite;
    pointer-events: none;
    box-shadow: 0 0 20px #ffaa00, inset 0 0 20px #ffaa00;
  }
  @keyframes ringPulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.2); opacity: 0.8; }
  }
        `);
        break;
    }
  }
  
  return cssParts.join('\n');
}

/**
 * Genera los archivos HTML de todas las escenas de un storyboard en el
 * directorio temp/scenes del proyecto.
 * @param {string} projectId - Identificador del proyecto.
 * @param {Array} storyboard - Lista de escenas.
 * @returns {Array} rutas de los HTML generados.
 */
export function buildScenes(projectId, storyboard) {
  const outDir = join(PATHS.temp, projectId, 'scenes');
  mkdirSync(outDir, { recursive: true });
  const manager = new SceneManager({ storyboard, totalDuration: VIDEO_CONFIG.duration });
  const generated = [];

  storyboard.forEach((scene, index) => {
    const duration = scene.end - scene.start;
    // Generar un HTML por escena (el tiempo se sobrescribe en updateScene al capturar).
    const html = renderSceneHTML(scene, 0, 0);
    const fileName = `scene-${String(index).padStart(3, '0')}-${scene.id}.html`;
    const filePath = join(outDir, fileName);
    writeFileSync(filePath, html, 'utf8');
    generated.push({ scene, filePath, duration });
    info(`Escena generada: ${fileName}`, { projectId, sceneId: scene.id });
  });

  return generated;
}

export default { renderSceneHTML, buildScenes };