// ============================================================================
// config/paths.config.js
// Rutas absolutas del proyecto. Se resuelven a partir de la raíz del workspace.
// ============================================================================

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

export const PATHS = {
  root: ROOT,
  config: resolve(ROOT, 'config'),
  scripts: resolve(ROOT, 'scripts'),
  engine: resolve(ROOT, 'engine'),
  templates: resolve(ROOT, 'templates'),
  projects: resolve(ROOT, 'projects'),
  assets: resolve(ROOT, 'assets'),
  narration: resolve(ROOT, 'narration'),
  renders: resolve(ROOT, 'renders'),
  temp: resolve(ROOT, 'temp'),
  tests: resolve(ROOT, 'tests'),
  nodeModules: resolve(ROOT, 'node_modules'),

  // Subcarpetas de assets.
  assetsAudio: resolve(ROOT, 'assets', 'audio'),
  assetsFonts: resolve(ROOT, 'assets', 'fonts'),
  assetsModels: resolve(ROOT, 'assets', 'models'),
  assetsTextures: resolve(ROOT, 'assets', 'textures'),

  // Subcarpetas de engine.
  engineAstronomy: resolve(ROOT, 'engine', 'astronomy'),
  enginePhysics: resolve(ROOT, 'engine', 'physics'),
  engineEffects: resolve(ROOT, 'engine', 'effects'),
  engineLighting: resolve(ROOT, 'engine', 'lighting'),
  engineCameras: resolve(ROOT, 'engine', 'cameras'),
  engineTypography: resolve(ROOT, 'engine', 'typography'),
  engineTransitions: resolve(ROOT, 'engine', 'transitions'),
};

export function projectPath(projectId) {
  return resolve(PATHS.projects, projectId);
}

export function projectScenesDir(projectId) {
  return resolve(PATHS.projects, projectId, 'scenes');
}

export function projectAssetsDir(projectId) {
  return resolve(PATHS.projects, projectId, 'assets');
}

export function projectOutputDir(projectId) {
  return resolve(PATHS.renders, projectId);
}

export default PATHS;
