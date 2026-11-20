// ============================================================================
// engine/cameras/index.js
// Cámaras cinematográficas: perspectiva, movimientos, zoom y recorridos.
// ============================================================================

import * as THREE from 'three';

/**
 * Crea una cámara perspectiva configurada para 1920x1080.
 * @param {Object} options { fov, aspect, near, far, position, lookAt }
 * @returns {THREE.PerspectiveCamera}
 */
export function createCinematicCamera({
  fov = 45,
  aspect = 1920 / 1080,
  near = 0.1,
  far = 1000,
  position = new THREE.Vector3(0, 5, 10),
  lookAt = new THREE.Vector3(0, 0, 0),
} = {}) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.copy(position);
  camera.lookAt(lookAt);
  return camera;
}

/**
 * Genera una posición de cámara para un tiempo dado siguiendo un recorrido
 * (keyframes con interpolación lineal). Devuelve { position, lookAt }.
 *
 * @param {Array} keyframes - [{ time, position: [x,y,z], lookAt: [x,y,z] }]
 * @param {number} t - Tiempo local en segundos (0..duration).
 * @param {number} duration - Duración del recorrido.
 * @returns {Object}
 */
export function cameraPath(keyframes, t, duration) {
  if (keyframes.length === 0) {
    return { position: new THREE.Vector3(0, 5, 10), lookAt: new THREE.Vector3(0, 0, 0) };
  }

  // Normalizar t a [0,1].
  const normalized = Math.min(1, Math.max(0, t / Math.max(duration, 1)));

  // Encontrar el segmento clave.
  let i0 = 0;
  let i1 = keyframes.length - 1;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (normalized >= keyframes[i].time / duration && normalized < keyframes[i + 1].time / duration) {
      i0 = i;
      i1 = i + 1;
      break;
    }
  }

  const k0 = keyframes[i0];
  const k1 = keyframes[i1];
  const segDuration = k1.time - k0.time;
  const localT = segDuration > 0 ? (t - k0.time) / segDuration : 0;
  const s = Math.min(1, Math.max(0, localT));

  const p0 = new THREE.Vector3(...k0.position);
  const p1 = new THREE.Vector3(...k1.position);
  const l0 = new THREE.Vector3(...k0.lookAt);
  const l1 = new THREE.Vector3(...k1.lookAt);

  return {
    position: p0.lerp(p1, s),
    lookAt: l0.lerp(l1, s),
  };
}

/**
 * Efecto de zoom: devuelve el FOY dinámico para un tiempo dado.
 * @param {number} t - Tiempo local.
 * @param {number} duration - Duración del zoom.
 * @param {number} fovStart - FOV inicial.
 * @param {number} fovEnd - FOV final.
 * @returns {number} FOV actual.
 */
export function zoom(t, duration, fovStart, fovEnd) {
  const s = Math.min(1, Math.max(0, t / Math.max(duration, 1)));
  return fovStart + (fovEnd - fovStart) * s;
}

export default { createCinematicCamera, cameraPath, zoom };
