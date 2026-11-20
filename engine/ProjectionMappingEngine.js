// ============================================================================
// engine/ProjectionMappingEngine.js
// Motor principal para producción de shorts de projection mapping.
// Combina personajes ilustrados 2D con escenarios 3D, contornos de tinta negra,
// iluminación cinematográfica y animaciones sutiles.
// ============================================================================

import { Scene, PerspectiveCamera, WebGLRenderer, Color, Group, BoxGeometry, 
         MeshStandardMesh, MeshBasicMesh, Mesh, AmbientLight, DirectionalLight, 
         PointLight, ShadowMap, WebGLRenderTarget, sRGBEncoding } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/geometries/TextGeometry.js';
import { GUI } from 'lil-gui';

// ============================================================================
// Configuración visual basada en visual-style.json
// ============================================================================

const VISUAL_STYLE = {
  resolution: { width: 1080, height: 1920 },
  aspectRatio: '9:16',
  fps: 30,
  duration: 30,
  
  // Paleta de colores
  primaryColor: '#FF6B6B',
  secondaryColor: '#4ECDC4',
  accentColor: '#FFE66D',
  backgroundColor: '#2C3E50',
  
  // Iluminación
  keyLightColor: '#FF6B6B',
  fillLightColor: '#4ECDC4',
  rimLightColor: '#FFE66D',
  ambientColor: '#2C3E50',
  
  // Contornos
  outlines: {
    enabled: true,
    width: 2, // pixels at 1080p
    color: '#000000',
    technique: 'depth-based'
  },
  
  // Personajes 2D
  characters: {
    style: 'illustrated-2d',
    heightHeads: 3.5,
    lineColor: '#030303',
    lineWidthNear: 5.1,
    lineWidthFar: 3.3,
    noBlush: true,
    noEyeHighlights: true,
    faceBrightness: 0.93
  },
  
  // Cámara
  camera: {
    defaultFov: 45,
    smoothMoveFrames: 20,
    acceleration: 'smootherstep'
  }
};

// ============================================================================
// Motor de Projection Mapping
// ============================================================================

export class ProjectionMappingEngine {
  
  constructor(options = {}) {
    this.canvas = options.canvas || document.createElement('canvas');
    this.width = options.width || VISUAL_STYLE.resolution.width;
    this.height = options.height || VISUAL_STYLE.resolution.height;
    this.fps = options.fps || VISUAL_STYLE.fps;
    this.duration = options.duration || VISUAL_STYLE.duration;
    this.totalFrames = this.fps * this.duration;
    
    // Estado de la escena
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Elementos de la escena
    this.objects = []; // Objetos 3D
    this.characters = []; // Personajes 2D integrados
    this.lights = [];
    this.outlinePass = null;
    
    // Configuración
    this.outlineConfig = {
      enabled: VISUAL_STYLE.outlines.enabled,
      width: VISUAL_STYLE.outlines.width,
      color: new Color(VISUAL_STYLE.outlines.color),
      technique: VISUAL_STYLE.outlines.technique
    };
    
    this.initThree.js();
  }
  
  // ==========================================================================
  // Inicialización de Three.js
  // ============================================================================
  
  initThree.js() {
    // Crear escena
    this.scene = new Scene();
    this.scene.background = new Color('#2C3E50');
    this.scene.fog = new Fog('#2C3E50', 50, 200);
    
    // Crear cámara
    this.camera = new PerspectiveCamera(
      VISUAL_STYLE.camera.defaultFov,
      VISUAL_STYLE.resolution.width / VISUAL_STYLE.resolution.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 15);
    
    // Crear renderer
    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas: this.canvas
    });
    this.renderer.setSize(VISUAL_STYLE.resolution.width, VISUAL_STYLE.resolution.height);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.colorSpace = sRGBEncoding;
    
    // Controles (orbitales para desarrollo, cámara controlada para renderizado)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Configurar iluminación
    this.setupLighting();
    
    // Configurar outlines
    this.setupOutlines();
    
    // Crear elementos de la escena
    this.createSceneElements();
  }
  
  // ==========================================================================
  // Iluminación Cinematográfica
  // ============================================================================
  
  setupLighting() {
    // Light clave (principal)
    this.keyLight = new DirectionalLight('#FF6B6B', 0.8);
    this.keyLight.position.set(5, 8, 7);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0001;
    this.scene.add(this.keyLight);
    
    // Light de llenado
    this.fillLight = new DirectionalLight('#4ECDC4', 0.4);
    this.fillLight.position.set(-5, 5, -7);
    this.fillLight.castShadow = true;
    this.scene.add(this.fillLight);
    
    // Light de borde (rim)
    this.rimLight = new DirectionalLight('#FFE66D', 0.5);
    this.rimLight.position.set(0, 10, 0);
    this.rimLight.castShadow = true;
    this.scene.add(this.rimLight);
    
    // Light ambiental
    const ambientLight = new AmbientLight('#2C3E50', 0.3);
    this.scene.add(ambientLight);
  }
  
  // ==========================================================================
  // Sistema de Contornos de Tinta Negra
  // ============================================================================
  
  setupOutlines() {
    if (!this.outlineConfig.enabled) return;
    
    // Configuramos un render target para el pass de outlines
    this.outlineTarget = new WebGLRenderTarget(
      VISUAL_STYLE.resolution.width,
      VISUAL_STYLE.resolution.height
    );
    
    // Configuramos un shader simple para detección de bordes basado en profundidad
    // En una implementación completa, esto usaría un post-processing pass
    this.outlineShader = {
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D depthTexture;
        varying vec2 vUv;
        
        float outlineThickness = 2.0;
        
        void main() {
          // Sample depth at neighboring pixels
          float depth = texture2D(depthTexture, vUv).r;
          
          // Check neighboring pixels for depth differences
          vec2 texel = vec2(1.0 / ${VISUAL_STYLE.resolution.width}, 1.0 / ${VISUAL_STYLE.resolution.height});
          
          float depthRight = texture2D(depthTexture, vUv + texel * vec2(1.0, 0.0)).r;
          float depthLeft = texture2D(depthTexture, vUv + texel * vec2(-1.0, 0.0)).r;
          float depthUp = texture2D(depthTexture, vUv + texel * vec2(0.0, 1.0)).r;
          float depthDown = texture2D(depthTexture, vUv + texel * vec2(0.0, -1.0)).r;
          
          float maxDiff = max(max(abs(depth - depthRight), abs(depth - depthLeft)),
                             max(abs(depth - depthUp), abs(depth - depthDown)));
          
          // If there's a significant depth difference, we're on an edge
          if (maxDiff > 0.1) {
            gl_FragColor = vec4(${VISUAL_STYLE.outlines.color}, 1.0);
          } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          }
        }
      `
    };
  }
  
  // ==========================================================================
  // Creación de Elementos de la Escena
  // ============================================================================
  
  createSceneElements() {
    // Crear arquitectura de projection mapping
    this.createArchitecture();
    
    // Crear proyector/luz del proyectador
    this.createProjector();
    
    // Crear personajes ilustrados 2D
    this createCharacters();
  }
  
  createArchitecture() {
    // Pared frontal
    const wallGeometry = new BoxGeometry(10, 12, 0.5);
    const wallMaterial = new MeshStandardMaterial({
      color: '#E8E8E8',
      roughness: 0.7,
      metalness: 0.3
    });
    const wall = new MeshBasicMesh(wallGeometry, wallMaterial); // MeshBasic para outlines
    wall.position.set(0, 6, -0.01);
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.objects.push(wall);
    
    // Columnas laterales
    const columnGeometry = new CylinderGeometry(0.3, 0.3, 4, 16);
    const columnMaterial = new MeshStandardMaterial({ color: '#CD853F' });
    
    for (let i = -4; i <= 4; i += 2) {
      const column = new Mesh(columnGeometry, columnMaterial);
      column.position.set(i, 2, -5);
      column.castShadow = true;
      column.receiveShadow = true;
      this.scene.add(column);
      this.objects.push(column);
    }
    
    // Suelo
    const floorGeometry = new PlaneGeometry(20, 20);
    const floorMaterial = new MeshStandardMaterial({
      color: '#F5F5F5',
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.01, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.objects.push(floor);
  }
  
  createProjector() {
    // Representación de un proyectador
    const projectorGeometry = new ConeGeometry(0.3, 1, 16);
    const projectorMaterial = new MeshBasicMaterial({ color: '#8B4513' });
    const projector = new Mesh(projectorGeometry, projectorMaterial);
    projector.position.set(-8, 1.5, -8);
    projector.castShadow = true;
    this.scene.add(projector);
    this.objects.push(projector);
    
    // Luz del proyectador
    const projectorLight = new SpotLight('#FFD700', 2, 15, Math.PI / 6);
    projectorLight.position.set(-8, 1.5, -8);
    projectorLight.angle = Math.PI / 6;
    projectorLight.penumbra = 0.3;
    projectorLight.decay = 1.5;
    projectorLight.distance = 15;
    projectorLight.castShadow = true;
    this.scene.add(projectorLight);
    this.lights.push(projectorLight);
  }
  
  createCharacters() {
    // Personajes ilustrados 2D - representados como carteles/cuadros en la escena
    // que siempre enfrentan la cámara (billboards)
    
    // Personaje 1: Arquitecto/proyectista
    const char1Group = new Group();
    
    // Cuerpo como caja simple con material que parece ilustración 2D
    const char1BodyGeometry = new BoxGeometry(0.6, 1.8, 0.1);
    const char1BodyMaterial = new MeshBasicMaterial({
      color: '#FF6B6B',
      transparent: true,
      opacity: 0.9
    });
    const char1Body = new Mesh(char1BodyGeometry, char1BodyMaterial);
    char1Body.position.set(-3, 0.9, -5);
    char1Body.rotation.y = Math.PI / 2;
    char1Body.name = 'character-1';
    char1Group.add(char1Body);
    
    // Cara/rostro simplificado
    const char1FaceGeometry = new BoxGeometry(0.4, 0.5, 0.1);
    const char1FaceMaterial = new MeshBasicMaterial({ color: '#FFFFFF' });
    const char1Face = new Mesh(char1FaceGeometry, char1FaceMaterial);
    char1Face.position.set(-2.8, 1.3, 0.01);
    char1Group.add(char1Face);
    
    char1Group.userData = {
      type: 'illustrated-character',
      id: 'architect',
      expressions: ['neutral', 'surprised', 'thinking'],
      currentExpression: 'neutral'
    };
    
    this.scene.add(char1Group);
    this.characters.push(char1Group);
  }
  
  // ==========================================================================
  // Animación y Actualización
  // ============================================================================
  
  update(frameIndex) {
    const t = (frameIndex / this.totalFrames) * Math.PI * 2;
    const progress = frameIndex / this.totalFrames;
    
    // Actualizar controles suavemente (para desarrollo)
    this.controls.update();
    
    // Microanimaciones sutiles
    this.microanimations(frameIndex);
    
    // Actualizar personajes
    this.updateCharacters(frameIndex);
  }
  
  microanimations(frameIndex) {
    // Parpadeo de personajes cada pocas frames
    if (frameIndex % 45 === 0) {
      this.characters.forEach(char => {
        // Lógica de parpadeo simple
      });
    }
    
    // Sway suave de elementos
    this.objects.forEach((obj, i) => {
      if (i % 3 === 0) {
        obj.rotation.y += 0.001;
      }
    });
  }
  
  updateCharacters(frameIndex) {
    // Actualizar expresiones faciales según la narrativa
    this.characters.forEach(char => {
      if (char.userData && char.userData.currentExpression) {
        // Lógica para cambiar expresiones según el timeline
      }
    });
  }
  
  // ==========================================================================
  // Renderizado de un Frame
  // ============================================================================
  
  renderFrame(frameIndex) {
    this.update(frameIndex);
    
    // Renderizar escena principal
    this.renderer.render(this.scene, this.camera);
    
    // Si los outlines están habilitados, podríamos hacer un pass adicional
    // En una implementación completa, esto usaría EffectComposer
  }
  
  // ==========================================================================
  // Generación de Frames para Renderizado
  // ============================================================================
  
  generateFrames(onFrameCallback) {
    const frames = [];
    
    for (let i = 0; i < this.totalFrames; i++) {
      this.renderFrame(i);
      if (onFrameCallback) {
        onFrameCallback(i, this.getFrameData(i));
      }
    }
    
    return frames;
  }
  
  getFrameData(frameIndex) {
    // Retornaría datos del frame para debugging/validación
    return {
      frame: frameIndex,
      time: (frameIndex / this.fps).toFixed(3),
      cameraPosition: this.camera.position.clone(),
      cameraRotation: this.camera.rotation.clone()
    };
  }
}

// Exportar para uso modular
export default ProjectionMappingEngine;

// Ejemplo de uso:
// const engine = new ProjectionMappingEngine({ canvas: document.querySelector('#glCanvas') });
// engine.createSceneElements();
// for (let i = 0; i < engine.totalFrames; i++) {
//   engine.renderFrame(i);
// }
// engine.renderer.domElement.toDataURL();