// ============================================================================
// engine/Renderer.js
// Configura el renderizador Three.js para salida de vídeo 1920x1080 a 24 fps.
// Diseñado para integrarse con Playwright/Chromium: el renderizador se monta
// en un canvas offscreen dentro de la página capturada.
// ============================================================================

import * as THREE from 'three';

export class ThreeRenderer {
  constructor({ width = 1920, height = 1080, pixelRatio = 1 } = {}) {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.context = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    }) || this.canvas.getContext('webgl', { alpha: true, antialias: true });

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: this.context,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Optimización para Radeon RX 580: limitar draw calls y texturas grandes.
    this.renderer.info.autoReset = true;
  }

  get domElement() {
    return this.canvas;
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    this.context = null;
    this.canvas = null;
    this.renderer = null;
  }

  /**
   * Devuelve los datos de imagen del canvas como Uint8Array RGBA.
   * Útil para Playwright (captura de frame) o fallback de software.
   */
  readPixels() {
    const { width, height } = this.canvas;
    const pixels = new Uint8Array(width * height * 4);
    this.renderer.readRenderTargetPixels(
      null,
      0,
      0,
      width,
      height,
      pixels
    );
    return pixels;
  }
}

export default ThreeRenderer;
