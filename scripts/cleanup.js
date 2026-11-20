// ============================================================================
// scripts/cleanup.js
// Limpieza segura de archivos temporales (frames, WAV intermedios, logs).
// Conserva los archivos fuente de cada proyecto en projects/ y renders/.
// ============================================================================

import { existsSync, readdirSync, unlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS } from '../config/paths.config.js';
import { info, warn } from './error-logger.js';

/**
 * Directorios seguros para limpiar (nunca tocar projects/ ni renders/).
 */
const CLEANABLE_TEMP_SUBDIRS = ['frames', 'audio', 'scenes'];

/**
 * Limpia los frames PNG de un directorio específico.
 * @param {string} dir
 * @returns {number} archivos eliminados.
 */
export function clearFrames(dir) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const file of readdirSync(dir)) {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      try {
        unlinkSync(join(dir, file));
        count += 1;
      } catch (err) {
        warn(`No se pudo eliminar ${file}: ${err.message}`);
      }
    }
  }
  return count;
}

/**
 * Limpia los temporales de un proyecto concreto, conservando sus fuentes.
 * @param {string} projectId
 * @returns {Object} resumen de limpieza.
 */
export function cleanupProjectTemp(projectId) {
  const projectTemp = join(PATHS.temp, projectId);
  let removed = 0;

  if (existsSync(projectTemp)) {
    removed = readdirSync(projectTemp).length;
    rmSync(projectTemp, { recursive: true, force: true });
  }

  removed += clearFrames(join(PATHS.temp, 'frames'));

  info(`Limpieza temporal del proyecto "${projectId}": ${removed} archivos`, { projectId, removed });
  return { projectId, removed };
}

/**
 * Limpieza general de temp/ manteniendo la estructura de carpetas.
 * @returns {Object} resumen.
 */
export function cleanupAllTemp() {
  let removed = 0;
  if (existsSync(PATHS.temp)) {
    for (const entry of readdirSync(PATHS.temp)) {
      const full = join(PATHS.temp, entry);
      try {
        rmSync(full, { recursive: true, force: true });
        removed += 1;
      } catch (err) {
        warn(`No se pudo limpiar ${entry}: ${err.message}`);
      }
    }
    // Recrear subdirectorios base.
    for (const sub of CLEANABLE_TEMP_SUBDIRS) {
      const subDir = join(PATHS.temp, sub);
      if (!existsSync(subDir)) {
        import('node:fs').then((fs) => fs.mkdirSync(subDir, { recursive: true }));
      }
    }
  }
  info(`Limpieza general de temporales: ${removed} entradas`);
  return { removed };
}

export default { clearFrames, cleanupProjectTemp, cleanupAllTemp };
