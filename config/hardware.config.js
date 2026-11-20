// ============================================================================
// config/hardware.config.js
// Configuración de hardware del ordenador de producción.
// CPU: Intel Xeon E5-2680 v4 (14 núcleos / 28 hilos)
// GPU: AMD Radeon RX 580 8 GB (soporte AMF)
// RAM: 16 GB
// Disco: SSD ~476 GB
// ============================================================================

export const HARDWARE = {
  cpu: 'Intel Xeon E5-2680 v4',
  gpu: 'AMD Radeon RX 580 8 GB',
  ramGb: 16,
  storageGb: 476,

  // Codificación por hardware disponible.
  amdAmfAvailable: false,

  // Límites de concurrencia para no saturar los 16 GB de RAM.
  maxConcurrentChromium: 1,
  maxConcurrentFfmpeg: 1,

  // Chromium: forzar aceleración gráfica cuando esté disponible, pero permitir
  // renderizado por CPU (software) si la GPU no responde.
  chromiumFlags: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu-sandbox',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--window-size=1920,1080',
    '--force-device-scale-factor=1',
    '--headless=new',
  ],

  // Umbrales de memoria (MB) para evitar procesos innecesarios.
  memoryWarningMb: 12000,
  memoryCriticalMb: 14000,
};

export default HARDWARE;
