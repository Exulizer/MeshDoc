import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

export class Viewport3D {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.bedGrid = null;

    // Mesh references
    this.originalMesh = null;
    this.repairedMesh = null;
    this.activeMeshType = 'original'; // 'original' | 'repaired' | 'split'
    this.errorLinesGroup = new THREE.Group();

    // Visual options
    this.showWireframe = false;
    this.showBed = true;
    this.showErrors = true;

    // Materials
    this.materials = {
      original: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.35,
        metalness: 0.15,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      repaired: new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.35,
        metalness: 0.15,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
      wireframe: new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }),
      openEdge: new THREE.LineBasicMaterial({
        color: 0xef4444,
        linewidth: 3,
        depthTest: false,
        transparent: true,
      }),
      nonManifoldEdge: new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        linewidth: 3,
        depthTest: false,
        transparent: true,
      }),
    };

    this.needsRender = true;
    this.isInteracting = false;
    this.dampingFrames = 0;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    this.camera.position.set(150, 150, 150);

    // Ultra-optimized WebGL Renderer (No heavy shadow maps, capped pixel ratio to prevent GPU stress)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'default',
      precision: 'mediump',
    });
    this.renderer.setClearColor(0x0a0d14, 1);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = false; // Disable heavy shadow maps (eliminates GPU overheating & screen flickering)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.id = 'viewportCanvas';
    this.renderer.domElement.style.background = '#0a0d14';

    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls with Demand-Driven Change Listeners
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 3000;
    this.controls.minDistance = 2;

    this.controls.addEventListener('change', () => this.requestRender());
    this.controls.addEventListener('start', () => { this.isInteracting = true; });
    this.controls.addEventListener('end', () => {
      this.isInteracting = false;
      this.dampingFrames = 30; // Allow damping to settle smoothly
    });

    // Lights
    this.setupLighting();

    // 3D Printer Bed Grid
    this.setupBuildBed();

    // Error lines group
    this.scene.add(this.errorLinesGroup);

    // Resize listeners with debouncing
    this.resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.onResize(), 60);
    });

    if (window.ResizeObserver && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.onResize(), 60);
      });
      this.resizeObserver.observe(this.container);
    }

    // Animation Loop (Demand-driven: 0% GPU load when idle)
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.6);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(120, 200, 150);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-150, 50, -120);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.3);
    rimLight.position.set(0, -100, -100);
    this.scene.add(rimLight);
  }

  setupBuildBed() {
    const bedGroup = new THREE.Group();

    // Bed Grid (220mm x 220mm standard build plate)
    const size = 220;
    const divisions = 22;
    const grid = new THREE.GridHelper(size, divisions, 0x38bdf8, 0x1e293b);
    grid.position.y = 0;
    bedGroup.add(grid);

    // Semi-transparent build plate surface
    const planeGeo = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x121824,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const plate = new THREE.Mesh(planeGeo, planeMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = -0.05;
    bedGroup.add(plate);

    this.bedGrid = bedGroup;
    this.scene.add(bedGroup);
  }

  requestRender() {
    this.needsRender = true;
  }

  animate() {
    requestAnimationFrame(this.animate);

    let requireRender = this.needsRender || this.isInteracting;

    if (this.controls.enableDamping) {
      const updated = this.controls.update();
      if (updated || this.dampingFrames > 0) {
        requireRender = true;
        if (this.dampingFrames > 0) this.dampingFrames--;
      }
    }

    if (requireRender) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestRender();
  }

  /**
   * Set the active original geometry
   * @param {THREE.BufferGeometry} geometry
   */
  setOriginalGeometry(geometry) {
    if (this.originalMesh) {
      this.originalMesh.remove(this.errorLinesGroup);
      this.scene.remove(this.originalMesh);
      this.originalMesh.geometry.dispose();
    }

    this.originalMesh = new THREE.Mesh(geometry, this.materials.original);
    this.errorLinesGroup.position.set(0, 0, 0);
    this.originalMesh.add(this.errorLinesGroup);
    this.scene.add(this.originalMesh);

    this.switchViewMode('original');
    this.fitCameraToMesh(this.originalMesh);
    this.requestRender();
  }

  /**
   * Set the repaired geometry
   * @param {THREE.BufferGeometry} geometry
   * @param {boolean} [isSmooth=false]
   */
  setRepairedGeometry(geometry, isSmooth = false) {
    if (this.repairedMesh) {
      this.scene.remove(this.repairedMesh);
      this.repairedMesh.geometry.dispose();
    }

    this.materials.repaired.flatShading = !isSmooth;
    this.materials.repaired.needsUpdate = true;

    this.repairedMesh = new THREE.Mesh(geometry, this.materials.repaired);
    this.scene.add(this.repairedMesh);

    this.switchViewMode('repaired');
    this.requestRender();
  }

  /**
   * Update error line highlights on model
   * @param {Object} errorLines - { openEdges: Float32Array, nonManifoldEdges: Float32Array }
   */
  setErrorHighlights(errorLines) {
    this.clearErrorHighlights();
    this.errorLinesGroup.position.set(0, 0, 0);
    if (!this.showErrors || !errorLines) {
      this.requestRender();
      return;
    }

    if (errorLines.openEdges && errorLines.openEdges.length > 0) {
      const openGeo = new THREE.BufferGeometry();
      openGeo.setAttribute('position', new THREE.BufferAttribute(errorLines.openEdges, 3));
      const openLines = new THREE.LineSegments(openGeo, this.materials.openEdge);
      openLines.renderOrder = 999;
      this.errorLinesGroup.add(openLines);
    }

    if (errorLines.nonManifoldEdges && errorLines.nonManifoldEdges.length > 0) {
      const nmGeo = new THREE.BufferGeometry();
      nmGeo.setAttribute('position', new THREE.BufferAttribute(errorLines.nonManifoldEdges, 3));
      const nmLines = new THREE.LineSegments(nmGeo, this.materials.nonManifoldEdge);
      nmLines.renderOrder = 999;
      this.errorLinesGroup.add(nmLines);
    }

    if (this.originalMesh && this.errorLinesGroup.parent !== this.originalMesh) {
      this.originalMesh.add(this.errorLinesGroup);
    }

    this.requestRender();
  }

  clearErrorHighlights() {
    while (this.errorLinesGroup.children.length > 0) {
      const child = this.errorLinesGroup.children[0];
      this.errorLinesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }
    this.requestRender();
  }

  /**
   * Switch viewport rendering mode
   * @param {'original'|'repaired'|'split'} mode
   */
  switchViewMode(mode) {
    this.activeMeshType = mode;

    if (this.originalMesh) {
      this.originalMesh.visible = false;
      this.originalMesh.position.set(0, 0, 0);
    }
    if (this.repairedMesh) {
      this.repairedMesh.visible = false;
      this.repairedMesh.position.set(0, 0, 0);
    }
    this.errorLinesGroup.position.set(0, 0, 0);

    if (mode === 'original' && this.originalMesh) {
      this.originalMesh.visible = true;
      this.errorLinesGroup.visible = this.showErrors;
    } else if (mode === 'repaired' && this.repairedMesh) {
      this.repairedMesh.visible = true;
      this.errorLinesGroup.visible = false;
    } else if (mode === 'split' && this.originalMesh && this.repairedMesh) {
      this.originalMesh.visible = true;
      this.repairedMesh.visible = true;

      // Position side by side based on bounding box
      this.originalMesh.geometry.computeBoundingBox();
      const width = this.originalMesh.geometry.boundingBox.max.x - this.originalMesh.geometry.boundingBox.min.x;
      const offset = Math.max(40, width * 0.75);

      this.originalMesh.position.x = -offset;
      this.repairedMesh.position.x = offset;
      this.errorLinesGroup.visible = this.showErrors;
    }

    this.requestRender();
  }

  /**
   * Toggle wireframe mode
   */
  toggleWireframe(enabled) {
    this.showWireframe = enabled !== undefined ? enabled : !this.showWireframe;
    this.materials.original.wireframe = this.showWireframe;
    this.materials.repaired.wireframe = this.showWireframe;
    this.requestRender();
  }

  /**
   * Toggle bed visibility
   */
  toggleBed(enabled) {
    this.showBed = enabled !== undefined ? enabled : !this.showBed;
    if (this.bedGrid) this.bedGrid.visible = this.showBed;
    this.requestRender();
  }

  /**
   * Toggle error highlights
   */
  toggleErrors(enabled) {
    this.showErrors = enabled !== undefined ? enabled : !this.showErrors;
    this.errorLinesGroup.visible = this.showErrors && this.activeMeshType !== 'repaired';
    this.requestRender();
  }

  /**
   * Fit camera view to active object
   */
  fitCameraToMesh(mesh) {
    if (!mesh || !mesh.geometry) return;

    mesh.geometry.computeBoundingSphere();
    mesh.geometry.computeBoundingBox();
    const sphere = mesh.geometry.boundingSphere;
    if (!sphere) return;

    const radius = Math.max(sphere.radius, 45);
    const center = sphere.center.clone();

    const fov = this.camera.fov * (Math.PI / 180);
    const distance = Math.abs(radius / Math.sin(fov / 2)) * 1.25;

    this.camera.position.set(center.x + distance * 0.75, center.y + distance * 0.65, center.z + distance * 0.9);
    this.controls.target.set(center.x, Math.max(0, center.y * 0.5), center.z);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
    this.requestRender();
  }

  /**
   * Reset camera preset (Isometric, Top, Front, Right)
   */
  setCameraPreset(preset) {
    const target = this.controls.target;
    const dist = this.camera.position.distanceTo(target);

    switch (preset) {
      case 'top':
        this.camera.position.set(target.x, target.y + dist, target.z + 0.001);
        break;
      case 'front':
        this.camera.position.set(target.x, target.y, target.z + dist);
        break;
      case 'right':
        this.camera.position.set(target.x + dist, target.y, target.z);
        break;
      case 'iso':
      default:
        this.camera.position.set(target.x + dist * 0.6, target.y + dist * 0.6, target.z + dist * 0.6);
        break;
    }
    this.camera.lookAt(target);
    this.controls.update();
    this.requestRender();
  }
}
