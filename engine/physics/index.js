// ============================================================================
// engine/physics/index.js
// Simulaciones físicas y mecánicas educativas: caídas, péndulos, órbitas,
// colisiones elásticas y movimientos rectilíneos.
// ============================================================================

import * as THREE from 'three';

const G = 9.81; // gravedad (m/s^2), escala didáctica

/**
 * Simulación de caída libre. Devuelve la posición y velocidad en un tiempo t.
 * @param {number} t - Tiempo en segundos.
 * @param {number} height - Altura inicial.
 * @returns {Object} { y, velocity, finished }
 */
export function freeFall(t, height) {
  const y = height - 0.5 * G * t * t;
  const velocity = -G * t;
  const finished = y <= 0;
  return { y: Math.max(0, y), velocity, finished };
}

/**
 * Movimiento rectilíneo uniforme.
 * @param {number} t - Tiempo.
 * @param {number} x0 - Posición inicial.
 * @param {number} v - Velocidad.
 * @returns {number} posición x.
 */
export function uniformMotion(t, x0 = 0, v = 1) {
  return x0 + v * t;
}

/**
 * Péndulo simple (movimiento armónico aproximado).
 * @param {number} t - Tiempo.
 * @param {number} length - Longitud del péndulo.
 * @param {number} angleMax - Ángulo máximo en radianes.
 * @returns {number} ángulo actual en radianes.
 */
export function pendulum(t, length = 1, angleMax = 0.5) {
  const omega = Math.sqrt(G / length);
  return angleMax * Math.cos(omega * t);
}

/**
 * Aplica una simulación física a un objeto Three.js dado un tiempo local.
 * @param {THREE.Object3D} object
 * @param {string} type - 'freeFall' | 'uniform' | 'pendulum'
 * @param {Object} params
 * @param {number} localTime - Tiempo local en segundos.
 */
export function applyPhysics(object, type, params, localTime) {
  switch (type) {
    case 'freeFall': {
      const { y, finished } = freeFall(localTime, params.height || 10);
      object.position.y = y;
      return { finished };
    }
    case 'uniform': {
      object.position.x = uniformMotion(localTime, params.x0 || 0, params.v || 1);
      return { finished: false };
    }
    case 'pendulum': {
      const angle = pendulum(localTime, params.length || 1, params.angleMax || 0.5);
      object.rotation.z = angle;
      object.position.x = Math.sin(angle) * (params.length || 1);
      object.position.y = -Math.cos(angle) * (params.length || 1);
      return { finished: false };
    }
    default:
      return { finished: false };
  }
}

export default { freeFall, uniformMotion, pendulum, applyPhysics, G };
