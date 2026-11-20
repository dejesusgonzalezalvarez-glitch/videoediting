// ============================================================================
// engine/effects/index.js
// Efectos visuales: partículas, brillos, humo, destellos y overlays animados.
// ============================================================================

import * as THREE from 'three';

/**
 * Crea un sistema de partículas (puntos) para fondos estelares, polvo o
 * elementos abstractos.
 * @param {Object} options { count, color, size, bounds }
 * @returns {THREE.Points}
 */
export function createParticleSystem({
  count = 2000,
  color = 0xffffff,
  size = 0.1,
  bounds = 50,
} = {}) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * bounds * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * bounds * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * bounds * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

/**
 * Anima un sistema de partículas rotándolo lentamente.
 * @param {THREE.Points} particles
 * @param {number} localTime - Tiempo local 0..1.
 */
export function animateParticles(particles, localTime) {
  particles.rotation.y = localTime * 0.5;
  particles.rotation.x = localTime * 0.25;
}

/**
 * Crea un anillo de brillo (glow) alrededor de un objeto.
 * @param {Object} options { radius, color, intensity }
 * @returns {THREE.Mesh}
 */
export function createGlowRing({ radius = 5, color = 0x00ffff, intensity = 1 } = {}) {
  const geometry = new THREE.RingGeometry(radius - 0.2, radius + 0.2, 64);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35 * intensity,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

export default { createParticleSystem, animateParticles, createGlowRing };
