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
    this.frontLight = null;

    // Mesh references
    this.originalMesh = null;
    this.repairedMesh = null;
    this.activeMeshType = 'original'; // 'original' | 'repaired' | 'split'
    this.errorLinesGroup = new THREE.Group();
    this.overhangGroup = new THREE.Group();

    // Visual options
    this.showWireframe = false;
    this.showBed = true;
    this.showErrors = true;
    this.showOverhangs = false;

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
      overhang: new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      overhangHeatmap: new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        vertexColors: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
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

    // Camera with optimized near/far planes for high-precision Z-buffer resolution (eliminates Z-fighting)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    this.camera.position.set(150, 150, 150);

    // Ultra-optimized WebGL Renderer with full 32-bit floating point precision
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'default',
      precision: 'highp',
    });
    this.renderer.setClearColor(0x0a0d14, 1);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = false; // Disable heavy shadow maps (eliminates GPU overheating & screen flickering)
    this.renderer.localClippingEnabled = true;
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

    // Mobile touch coordination:
    // 1 finger = native page scrolling (never traps the user)
    // 2 fingers = 3D rotation and pinch-zoom
    this.controls.touches = {
      ONE: null,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    };

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

    // Mobile touch coordination: eliminates scroll-trap on small screens
    this.setupMobileTouchHandling();

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

  setupMobileTouchHandling() {
    const canvas = this.renderer.domElement;
    if (!canvas) return;

    // By default, allow vertical page panning on touch devices so user is NEVER trapped
    canvas.style.touchAction = 'pan-y';

    const hint = document.getElementById('viewerTouchHint');
    let hintTimeout = null;

    const showHintBriefly = () => {
      if (!hint) return;
      hint.style.display = 'flex';
      hint.style.opacity = '1';
      clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => { if (hint) hint.style.display = 'none'; }, 350);
      }, 3000);
    };

    // Auto-fade initial touch hint after 4 seconds
    hintTimeout = setTimeout(() => {
      if (hint) {
        hint.style.opacity = '0';
        setTimeout(() => { if (hint) hint.style.display = 'none'; }, 350);
      }
    }, 4000);

    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        // 1 Finger = PURE NATIVE PAGE SCROLL: never block or trap the user!
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        canvas.style.touchAction = 'pan-y';
      } else if (e.touches.length >= 2) {
        // 2 Fingers = 3D ROTATION, ZOOM & PAN
        canvas.style.touchAction = 'none';
        if (this.container) this.container.classList.add('viewer-touch-active');
        showHintBriefly();
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        // 1 finger: allow page scroll. If user performs horizontal swipe, remind gently about 2 fingers
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > 35 && dx > dy * 1.6) {
          showHintBriefly();
        }
        canvas.style.touchAction = 'pan-y';
      } else if (e.touches.length >= 2) {
        // 2 fingers: prevent browser page zooming while manipulating 3D model
        e.preventDefault();
      }
    }, { passive: false });

    const endTouch = (e) => {
      if (!e.touches || e.touches.length < 2) {
        canvas.style.touchAction = 'pan-y';
        if (this.container) this.container.classList.remove('viewer-touch-active');
      }
    };

    canvas.addEventListener('touchend', endTouch, { passive: true });
    canvas.addEventListener('touchcancel', endTouch, { passive: true });
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.65);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.keyLight.position.set(120, 200, 150);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    this.fillLight.position.set(-150, 50, -120);
    this.scene.add(this.fillLight);

    // Front fill light (illuminates front facets neutrally)
    this.frontLight = new THREE.DirectionalLight(0xffffff, 0.25);
    this.frontLight.position.set(-80, 90, 180);
    this.scene.add(this.frontLight);

    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.20);
    this.rimLight.position.set(0, -100, -100);
    this.scene.add(this.rimLight);
  }

  setupBuildBed(isLight = (document.documentElement.getAttribute('data-theme') === 'light')) {
    if (this.bedGrid) {
      this.scene.remove(this.bedGrid);
      this.bedGrid.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    const bedGroup = new THREE.Group();

    // Bed Grid (220mm x 220mm standard build plate)
    // Offset slightly below Y=0 with polygonOffset to prevent co-planar Z-fighting with models resting on the bed
    const size = 220;
    const divisions = 22;
    const centerColor = isLight ? 0x0284c7 : 0x38bdf8;
    const gridColor = isLight ? 0x64748b : 0x222f46;
    const grid = new THREE.GridHelper(size, divisions, centerColor, gridColor);
    grid.position.y = -0.02;
    if (grid.material) {
      grid.material.polygonOffset = true;
      grid.material.polygonOffsetFactor = 1;
      grid.material.polygonOffsetUnits = 1;
      grid.material.depthWrite = true;
    }
    bedGroup.add(grid);

    // Build plate surface (opaque with depthWrite and polygonOffset to eliminate transparent queue sorting artifacts)
    const planeGeo = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0xffffff : 0x121824,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    });
    const plate = new THREE.Mesh(planeGeo, planeMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = -0.04;
    bedGroup.add(plate);

    // Build plate border frame
    const frameGeo = new THREE.EdgesGeometry(planeGeo);
    const frameMat = new THREE.LineBasicMaterial({
      color: isLight ? 0x334155 : 0x38bdf8,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const frame = new THREE.LineSegments(frameGeo, frameMat);
    frame.rotation.x = -Math.PI / 2;
    frame.position.y = -0.02;
    bedGroup.add(frame);

    this.bedGrid = bedGroup;
    this.bedGrid.visible = this.showBed;
    this.scene.add(bedGroup);
  }

  setTheme(theme) {
    const isLight = theme === 'light';
    const bgColor = isLight ? 0xedf2f7 : 0x0a0d14;
    const bgCss = isLight ? '#edf2f7' : '#0a0d14';

    if (this.scene) {
      this.scene.background = new THREE.Color(bgColor);
    }
    if (this.renderer) {
      this.renderer.setClearColor(bgColor, 1);
      if (this.renderer.domElement) {
        this.renderer.domElement.style.background = bgCss;
      }
    }

    // Update Lighting for Light / Dark environment
    if (this.hemiLight) {
      if (isLight) {
        this.hemiLight.color.setHex(0xffffff);
        this.hemiLight.groundColor.setHex(0xcbd5e1);
        this.hemiLight.intensity = 0.75;
      } else {
        this.hemiLight.color.setHex(0xdbeafe);
        this.hemiLight.groundColor.setHex(0x1e293b);
        this.hemiLight.intensity = 0.6;
      }
    }
    if (this.fillLight) {
      this.fillLight.color.setHex(0xffffff);
      this.fillLight.intensity = isLight ? 0.35 : 0.35;
    }
    if (this.rimLight) {
      this.rimLight.color.setHex(0xffffff);
      this.rimLight.intensity = isLight ? 0.15 : 0.20;
    }
    if (this.frontLight) {
      this.frontLight.color.setHex(0xffffff);
      this.frontLight.intensity = isLight ? 0.25 : 0.25;
    }

    // Update Build Bed Colors
    this.setupBuildBed(isLight);

    // Update Materials for crisp contrast
    if (this.materials) {
      if (this.materials.original) {
        this.materials.original.color.setHex(isLight ? 0x0284c7 : 0x38bdf8);
        this.materials.original.needsUpdate = true;
      }
      if (this.materials.repaired) {
        this.materials.repaired.color.setHex(isLight ? 0x059669 : 0x10b981);
        this.materials.repaired.needsUpdate = true;
      }
      if (this.materials.wireframe) {
        this.materials.wireframe.color.setHex(isLight ? 0x334155 : 0x94a3b8);
        this.materials.wireframe.opacity = isLight ? 0.5 : 0.35;
        this.materials.wireframe.needsUpdate = true;
      }
      if (this.materials.openEdge) {
        this.materials.openEdge.color.setHex(isLight ? 0xdc2626 : 0xef4444);
        this.materials.openEdge.needsUpdate = true;
      }
      if (this.materials.nonManifoldEdge) {
        this.materials.nonManifoldEdge.color.setHex(isLight ? 0xd97706 : 0xf59e0b);
        this.materials.nonManifoldEdge.needsUpdate = true;
      }
    }

    this.requestRender();
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
    if (this.repairedMesh) {
      this.repairedMesh.remove(this.overhangGroup);
      this.scene.remove(this.repairedMesh);
      if (this.repairedMesh.geometry) {
        this.repairedMesh.geometry.dispose();
      }
      this.repairedMesh = null;
    }

    if (this.originalMesh) {
      this.originalMesh.remove(this.errorLinesGroup);
      this.originalMesh.remove(this.overhangGroup);
      this.scene.remove(this.originalMesh);
      if (this.originalMesh.geometry) {
        this.originalMesh.geometry.dispose();
      }
      this.originalMesh = null;
    }

    this.showWireframe = false;
    this.materials.original.wireframe = false;
    this.materials.repaired.wireframe = false;

    this.clearOverhangHighlights();
    this.clearErrorHighlights();

    this.originalMesh = new THREE.Mesh(geometry, this.materials.original);
    this.errorLinesGroup.position.set(0, 0, 0);
    this.overhangGroup.position.set(0, 0, 0);
    this.originalMesh.add(this.errorLinesGroup);
    this.originalMesh.add(this.overhangGroup);
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
      this.repairedMesh.remove(this.overhangGroup);
      this.scene.remove(this.repairedMesh);
      this.repairedMesh.geometry.dispose();
    }

    this.materials.repaired.flatShading = !isSmooth;
    this.materials.repaired.needsUpdate = true;

    this.repairedMesh = new THREE.Mesh(geometry, this.materials.repaired);
    this.overhangGroup.position.set(0, 0, 0);
    this.repairedMesh.add(this.overhangGroup);
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
   * Update overhang highlights on model (traffic-light heatmap or red facet overlay)
   * @param {Float32Array} trianglesBuffer - Float32Array containing x,y,z of 3 vertices per overhang triangle
   * @param {Float32Array} [colorsBuffer] - Float32Array containing r,g,b of 3 vertices per overhang triangle
   */
  setOverhangHighlights(trianglesBuffer, colorsBuffer) {
    this.clearOverhangHighlights();
    this.overhangGroup.position.set(0, 0, 0);

    if (!trianglesBuffer || trianglesBuffer.length === 0) {
      this.requestRender();
      return;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(trianglesBuffer, 3));
    
    const hasColors = colorsBuffer && colorsBuffer.length > 0;
    if (hasColors) {
      geo.setAttribute('color', new THREE.BufferAttribute(colorsBuffer, 3));
    }
    geo.computeVertexNormals();

    const mat = hasColors ? this.materials.overhangHeatmap : this.materials.overhang;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 998;
    this.overhangMesh = mesh;
    this.overhangGroup.add(mesh);

    const activeTarget = (this.activeMeshType === 'repaired' && this.repairedMesh) ? this.repairedMesh : this.originalMesh;
    if (activeTarget && this.overhangGroup.parent !== activeTarget) {
      activeTarget.add(this.overhangGroup);
    }

    this.overhangGroup.visible = this.showOverhangs;
    this.requestRender();
  }

  clearOverhangHighlights() {
    while (this.overhangGroup.children.length > 0) {
      const child = this.overhangGroup.children[0];
      this.overhangGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }
    this.overhangMesh = null;
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
    this.overhangGroup.position.set(0, 0, 0);

    if (mode === 'original' && this.originalMesh) {
      this.originalMesh.visible = true;
      this.errorLinesGroup.visible = this.showErrors;
      if (this.overhangGroup.parent !== this.originalMesh) {
        this.originalMesh.add(this.overhangGroup);
      }
    } else if (mode === 'repaired' && this.repairedMesh) {
      this.repairedMesh.visible = true;
      this.errorLinesGroup.visible = false;
      if (this.overhangGroup.parent !== this.repairedMesh) {
        this.repairedMesh.add(this.overhangGroup);
      }
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

    this.overhangGroup.visible = this.showOverhangs;
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
   * Toggle overhang highlights
   */
  toggleOverhangs(enabled) {
    this.showOverhangs = enabled !== undefined ? enabled : !this.showOverhangs;
    this.overhangGroup.visible = this.showOverhangs;
    this.requestRender();
    return this.showOverhangs;
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

    const radius = Math.max(sphere.radius, 18);
    const center = sphere.center.clone();
    center.applyMatrix4(mesh.matrixWorld);

    const fov = this.camera.fov * (Math.PI / 180);
    const distance = Math.abs(radius / Math.sin(fov / 2)) * 1.35;

    this.camera.position.set(center.x + distance * 0.75, center.y + distance * 0.65, center.z + distance * 0.95);
    this.controls.target.copy(center);
    this.camera.lookAt(center);
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

  /**
   * Reset all viewport tools, highlights, camera and active modes to pristine default
   */
  resetViewportState() {
    this.showWireframe = false;
    this.materials.original.wireframe = false;
    this.materials.repaired.wireframe = false;

    this.showBed = true;
    if (this.bedGrid) this.bedGrid.visible = true;

    this.showErrors = true;
    this.errorLinesGroup.visible = true;

    this.showOverhangs = false;
    this.overhangGroup.visible = false;

    if (this.repairedMesh) {
      this.repairedMesh.remove(this.overhangGroup);
      this.scene.remove(this.repairedMesh);
      if (this.repairedMesh.geometry) {
        this.repairedMesh.geometry.dispose();
      }
      this.repairedMesh = null;
    }

    this.activeMeshType = 'original';
    this.clearOverhangHighlights();
    this.clearErrorHighlights();

    this.requestRender();
  }
}
