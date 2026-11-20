// ============================================================================
// engine/SceneManager.js
// Gestor de escenas del motor audiovisual.
//
// REQUISITO CLAVE: la actualización de escenas debe ser DETERMINISTA.
// updateScene(timeInSeconds) recibe el tiempo en segundos y devuelve siempre
// el mismo estado de escena para ese tiempo, independientemente de cuántas
// veces se llame o del orden de renderizado. Esto permite renderizar por
// lotes y re-renderizar fotogramas concretos sin inconsistencias.
// ============================================================================

import { VIDEO_CONFIG } from '../config/video.config.js';
import { HARDWARE } from '../config/hardware.config.js';

/**
 * Crea un SceneManager a partir de un storyboard.
 *
 * Un storyboard es un array de escenas ordenadas por tiempo de inicio:
 *   [
 *     { id: 'intro', start: 0, end: 12, type: '3d', ... },
 *     { id: 'solar-system', start: 12, end: 30, type: 'astronomy', ... },
 *     ...
 *   ]
 *
 * Cada escena define su configuración visual (objetos, cámaras, iluminación,
 * efectos, tipografía) y puede incluir una función de animación frameFn(t)
 * que recibe el tiempo local dentro de la escena (0 .. duration) y devuelve
 * las transformaciones a aplicar.
 *
 * @param {Object} options
 * @param {Array} options.storyboard - Lista de escenas con start/end.
 * @param {number} options.totalDuration - Duración total en segundos.
 */
export class SceneManager {
  constructor({ storyboard = [], totalDuration = VIDEO_CONFIG.duration } = {}) {
    this.totalDuration = totalDuration;
    this.storyboard = this._normalizeStoryboard(storyboard);
    this._cache = new Map(); // caché de resultados por tiempo (ms)
  }

  /**
   * Normaliza y valida el storyboard: ordena por start, rellena end del
   * último con totalDuration y detecta huecos o solapamientos.
   * @private
   */
  _normalizeStoryboard(storyboard) {
    const sorted = [...storyboard].sort((a, b) => a.start - b.start);
    const lastIndex = sorted.length - 1;
    return sorted.map((scene, i) => ({
      id: scene.id || `scene-${i}`,
      start: Number(scene.start),
      end: i === lastIndex ? this.totalDuration : Number(scene.end),
      type: scene.type || '2d',
      config: scene.config || {},
      frameFn: scene.frameFn || null,
      transitionIn: scene.transitionIn || null,
      transitionOut: scene.transitionOut || null,
      audioCue: scene.audioCue || null,
    }));
  }

  /**
   * Devuelve la escena activa y su tiempo local para un tiempo global dado.
   * Es determinista: misma entrada -> misma salida siempre.
   *
   * @param {number} timeInSeconds - Tiempo global en segundos (>= 0).
   * @returns {Object|null} { scene, localTime, progress } o null si no hay escena.
   */
  getSceneAt(timeInSeconds) {
    const t = Math.max(0, Math.min(Number(timeInSeconds) || 0, this.totalDuration));
    const key = t.toFixed(3); // clave de caché estable (milésimas de segundo)
    if (this._cache.has(key)) return this._cache.get(key);

    let result = null;
    for (const scene of this.storyboard) {
      if (t >= scene.start && t < scene.end) {
        const localTime = t - scene.start;
        const sceneDuration = scene.end - scene.start;
        const progress = sceneDuration > 0 ? localTime / sceneDuration : 0;
        result = {
          scene,
          localTime,
          progress: Math.min(1, Math.max(0, progress)),
          globalTime: t,
        };
        break;
      }
    }
    // Si t es exactamente el final, asignar a la última escena.
    if (!result && this.storyboard.length > 0 && t >= this.totalDuration) {
      const last = this.storyboard[this.storyboard.length - 1];
      const localTime = last.end - last.start;
      result = {
        scene: last,
        localTime,
        progress: 1,
        globalTime: t,
      };
    }

    this._cache.set(key, result);
    return result;
  }

  /**
   * Interfaz determinista exigida por la misión:
   * updateScene(timeInSeconds) -> estado de escena para renderizar ese fotograma.
   *
   * @param {number} timeInSeconds
   * @returns {Object} estado de la escena para el renderizador.
   */
  updateScene(timeInSeconds) {
    const resolved = this.getSceneAt(timeInSeconds);
    if (!resolved) {
      return {
        globalTime: Math.max(0, Number(timeInSeconds) || 0),
        active: false,
        scene: null,
        localTime: 0,
        progress: 0,
      };
    }
    return {
      globalTime: resolved.globalTime,
      active: true,
      scene: resolved.scene,
      localTime: resolved.localTime,
      progress: resolved.progress,
    };
  }

  /**
   * Lista de todas las escenas con sus intervalos (útil para storyboards).
   */
  listScenes() {
    return this.storyboard.map((s) => ({
      id: s.id,
      start: s.start,
      end: s.end,
      duration: s.end - s.start,
      type: s.type,
    }));
  }

  /**
   * Limpia el caché de resultados (útil al cambiar de storyboard).
   */
  clearCache() {
    this._cache.clear();
  }
}

export default SceneManager;
