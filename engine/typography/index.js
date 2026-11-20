// ============================================================================
// engine/typography/index.js
// Tipografía cinética y elementos de texto para infografías animadas.
// Se renderizan como overlays HTML/CSS sobre la escena Three.js.
// ============================================================================

/**
 * Crea un bloque de texto cinético con estilo CSS.
 * @param {Object} options { id, text, x, y, fontSize, color, duration, fadeIn, fadeOut }
 * @returns {Object} configuración de texto.
 */
export function createTextOverlay({
  id = 'text-1',
  text = '',
  x = '50%',
  y = '50%',
  fontSize = '48px',
  color = '#ffffff',
  fontFamily = 'Arial, sans-serif',
  duration = 5,
  fadeIn = 0.5,
  fadeOut = 0.5,
  align = 'center',
} = {}) {
  return {
    id,
    text,
    x,
    y,
    fontSize,
    color,
    fontFamily,
    duration,
    fadeIn,
    fadeOut,
    align,
    opacity: 0,
    visible: false,
  };
}

/**
 * Genera el HTML de un contenedor de tipografía cinética.
 * @param {Array} overlays - lista de objetos createTextOverlay.
 * @returns {string} HTML.
 */
export function buildTypographyHTML(overlays = []) {
  const items = overlays
    .map(
      (o) => `
    <div id="${o.id}" class="kinetic-text" style="
      position:absolute;
      left:${o.x}; top:${o.y};
      font-size:${o.fontSize}; color:${o.color};
      font-family:${o.fontFamily}; text-align:${o.align};
      opacity:0; pointer-events:none;
      transform:translate(-50%,-50%);
      white-space:pre-wrap;
    ">${o.text}</div>
  `
    )
    .join('');

  return `
    <style>
      .kinetic-text { transition: opacity 0.5s ease; will-change: opacity; }
    </style>
    <div id="typography-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden;">
      ${items}
    </div>
  `;
}

/**
 * Actualiza la opacidad y visibilidad de un overlay de texto para un tiempo dado.
 * @param {Object} overlay
 * @param {number} localTime - Tiempo local dentro de la escena (0..duration).
 * @returns {Object} { opacity, visible, transform }
 */
export function animateText(overlay, localTime) {
  const { duration, fadeIn, fadeOut } = overlay;
  let opacity = 0;
  let visible = false;

  if (localTime >= 0 && localTime <= duration) {
    // Fade in.
    if (localTime < fadeIn) {
      opacity = localTime / Math.max(fadeIn, 0.001);
    }
    // Fade out.
    else if (localTime > duration - fadeOut) {
      opacity = (duration - localTime) / Math.max(fadeOut, 0.001);
    }
    // Plano estable.
    else {
      opacity = 1;
    }
    visible = opacity > 0.01;
  }

  return {
    id: overlay.id,
    opacity: Math.min(1, Math.max(0, opacity)),
    visible,
    transform: 'translate(-50%,-50%)',
  };
}

export default { createTextOverlay, buildTypographyHTML, animateText };
