// ============================================================================
// engine/astronomy/index.js
// Herramientas astronómicas: sistemas planetarios, órbitas, cuerpos celestes.
// Diseñadas para Three.js y escenarios educativos de astronomía.
// ============================================================================

import * as THREE from 'three';

/**
 * Crea un sistema planetario simple con Sol y planetas en órbita circular.
 * Devuelve un objeto THREE.Group con el sol, los planetas y sus trayectorias.
 *
 * @param {Object} options
 * @param {number} options.scale - Escala general del sistema.
 * @param {Array}  options.planets - Lista { name, radius, distance, speed, color }.
 * @returns {THREE.Group}
 */
export function createPlanetarySystem({ scale = 1, planets = [] } = {}) {
  const system = new THREE.Group();

  // Sol.
  const sunGeometry = new THREE.SphereGeometry(2 * scale, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.name = 'Sun';
  system.add(sun);

  // Punto de luz en el Sol para iluminar los planetas.
  const sunLight = new THREE.PointLight(0xffffff, 2, 100 * scale);
  sunLight.position.set(0, 0, 0);
  system.add(sunLight);

  const orbitRadius = (distance) => distance * scale;

  planets.forEach((p) => {
    const group = new THREE.Group();
    group.name = p.name;

    // Trayectoria orbital (círculo).
    const orbitCurve = new THREE.EllipseCurve(
      0, 0, // centro
      orbitRadius(p.distance), orbitRadius(p.distance), // ejes x, y
      0, 2 * Math.PI, // ángulo inicial, final
      false, // sentido horario
      0 // rotación
    );
    const orbitPoints = orbitCurve.getPoints(128);
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.35,
    });
    const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    orbitLine.name = `${p.name}-orbit`;
    group.add(orbitLine);

    // Planeta.
    const planetGeometry = new THREE.SphereGeometry(p.radius * scale, 16, 16);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: p.color || 0xaaaaaa,
      roughness: 0.7,
      metalness: 0.1,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(orbitRadius(p.distance), 0, 0);
    planet.name = p.name;
    group.add(planet);

    // Función de animación: recibe tiempo local (0..1) y posiciona el planeta.
    group.animate = (localTime) => {
      const angle = localTime * p.speed * 2 * Math.PI;
      planet.position.x = Math.cos(angle) * orbitRadius(p.distance);
      planet.position.z = Math.sin(angle) * orbitRadius(p.distance);
      planet.rotation.y += 0.02;
    };

    system.add(group);
  });

  return system;
}

/**
 * Crea una estrella con brillo pulsante.
 * @param {Object} options { color, intensity, radius }
 * @returns {THREE.Group}
 */
export function createStar({ color = 0xffffaa, intensity = 2, radius = 1 } = {}) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 24),
    new THREE.MeshBasicMaterial({ color })
  );
  group.add(core);
  const light = new THREE.PointLight(color, intensity, 50);
  group.add(light);
  return group;
}

export default { createPlanetarySystem, createStar };
