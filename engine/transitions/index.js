// ============================================================================
// engine/transitions/index.js
// Transiciones entre escenas: desvaneces, deslizados, barridos y cortes.
// ============================================================================

/**
 * Tipos de transición disponibles.
 */
export const TRANSITION_TYPES = {
  FADE: 'fade',
  SLIDE: 'slide',
  WIPE: 'wipe',
  CUT: 'cut',
  ZOOM: 'zoom',
};

/**
 * Calcula la opacidad de transición para un tiempo dado dentro de la ventana
 * de transición.
 * @param {number} t - Tiempo transcurrido dentro de la transición (0..duration).
 * @param {number} duration - Duración total de la transición.
 * @param {string} type - Tipo de transición.
 * @returns {number} opacidad de salida (0..1).
 */
export function transitionOpacity(t, duration, type = TRANSITION_TYPES.FADE) {
  const s = Math.min(1, Math.max(0, t / Math.max(duration, 0.001)));
  switch (type) {
    case TRANSITION_TYPES.FADE:
      return s;
    case TRANSITION_TYPES.CUT:
      return s >= 1 ? 1 : 0;
    case TRANSITION_TYPES.SLIDE:
    case TRANSITION_TYPES.WIPE:
    case TRANSITION_TYPES.ZOOM:
      return s;
    default:
      return s;
  }
}

/**
 * Genera el CSS de una capa de transición para Playwright.
 * @param {Object} options { type, duration, color }
 * @returns {string} HTML con estilo embebido.
 */
export function buildTransitionHTML({ type = TRANSITION_TYPES.FADE, duration = 1, color = '#000000' } = {}) {
  return `
    <style>
      #transition-layer {
        position:fixed; top:0; left:0; width:100vw; height:100vh;
        background:${color}; z-index:9999; pointer-events:none;
        transition: opacity ${duration}s ease;
        opacity: 1;
      }
      #transition-layer.out { opacity: 0; }
    </style>
    <div id="transition-layer"></div>
  `;
}

export default { TRANSITION_TYPES, transitionOpacity, buildTransitionHTML };
