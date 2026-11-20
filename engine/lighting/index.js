// ============================================================================
// engine/lighting/index.js
// Iluminación dinámica: luces principales, de relleno, de contorno, volumétricas.
// ============================================================================

import * as THREE from 'three';

/**
 * Configura un esquema de iluminación cinematográfica de tres puntos.
 * Devuelve un THREE.Group con las tres luces.
 * @param {Object} options { intensity, color, temperature }
 * @returns {THREE.Group}
 */
export function threePointLighting({
  intensity = 1,
  color = 0xffffff,
  temperature = 0xffffff,
} = {}) {
  const group = new THREE.Group();

  // Luz clave (key light).
  const key = new THREE.DirectionalLight(color, intensity);
  key.position.set(5, 5, 5);
  key.name = 'key-light';
  key.castShadow = true;
  group.add(key);

  // Luz de relleno (fill light), más suave y opuesta.
  const fill = new THREE.DirectionalLight(0xaaaaaa, intensity * 0.4);
  fill.position.set(-5, 2, 5);
  fill.name = 'fill-light';
  group.add(fill);

  // Luz de contorno / contra (rim/back light).
  const rim = new THREE.SpotLight(0xddddff, intensity * 0.8);
  rim.position.set(0, 3, -8);
  rim.lookAt(0, 0, 0);
  rim.name = 'rim-light';
  group.add(rim);

  // Luz ambiente suave para no dejar zonas totalmente negras.
  const ambient = new THREE.AmbientLight(0x444444, intensity * 0.25);
  ambient.name = 'ambient-light';
  group.add(ambient);

  return group;
}

/**
 * Crea una luz puntual dinámica con color animable.
 * @param {Object} options { color, intensity, distance, decay }
 * @returns {THREE.PointLight}
 */
export function pointLight({
  color = 0xffffff,
  intensity = 1,
  distance = 100,
  decay = 2,
} = {}) {
  return new THREE.PointLight(color, intensity, distance, decay);
}

export default { threePointLighting, pointLight };
