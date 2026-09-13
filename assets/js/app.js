/**
 * app.js - Main Application Orchestrator & State Management
 * 100% Client-side processing for STL, OBJ, and 3MF files.
 * Fully Internationalized (German DE / English EN).
 */

import * as THREE from 'three';
import { Viewport3D } from './viewer.js';
import { MeshAnalyzer } from './analyzer.js';
import { MeshRepairer } from './repair.js';
import { MeshExporter } from './exporter.js';
import { I18n } from './i18n.js';

class App {
  constructor() {
    this.viewer = null;
    this.currentFileName = 'model.stl';
    this.currentFileRawName = 'model';
    this.originalGeometry = null;
    this.baseFullDetailGeometry = null;
    this.repairedGeometry = null;
    this.activeAnalysis = null;
    this.currentFileSize = 0;
    this.hasAutoRepaired = false;
    this.rawLoadedGeometry = null;
    this.currentScaleFactor = 1.0;
    window.THREE = THREE;

    this.init();
  }

  init() {
    // Initialize 3D Viewport
    const canvasContainer = document.getElementById('viewportWrapper');
    this.viewer = new Viewport3D(canvasContainer);

    this.initTheme();
    this.bindEvents();
    this.loadSampleModel('brokenCube');
  }

  initTheme() {
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem('mesh3d_theme') || 'dark';
    } catch (e) {
      savedTheme = 'dark';
    }
    this.applyTheme(savedTheme);

    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mesh3d_theme', theme);
    } catch (e) {
      console.warn('LocalStorage not available for theme:', e);
    }

    if (this.viewer && typeof this.viewer.setTheme === 'function') {
      this.viewer.setTheme(theme);
    }

    const btn = document.getElementById('btnThemeToggle');
    if (btn) {
      const isLight = theme === 'light';
      const label = isLight ? (I18n.t('themeToggleDark') || 'Zu dunklem Design wechseln') : (I18n.t('themeToggleLight') || 'Zu hellem Design wechseln');
      btn.setAttribute('title', label);
      btn.setAttribute('aria-label', label);
    }
  }

  onLanguageChange(lang) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const btn = document.getElementById('btnThemeToggle');
    if (btn) {
      const isLight = currentTheme === 'light';
      const label = isLight ? (I18n.t('themeToggleDark') || 'Zu dunklem Design wechseln') : (I18n.t('themeToggleLight') || 'Zu hellem Design wechseln');
      btn.setAttribute('title', label);
      btn.setAttribute('aria-label', label);
    }
  }

  bindEvents() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    // Click on Dropzone triggers File Dialog
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });

      dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFiles(e.target.files);
          e.target.value = ''; // Reset input to allow re-uploading the same file
        }
      });
    }

    // Drag and drop events for dropzone
    if (dropzone) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'dragend'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-over');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.handleFiles(files);
        }
      });
    }

    // Global drag & drop on entire window
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (!e.target.closest('#dropzone')) {
          this.handleFiles(e.dataTransfer.files);
        }
      }
    });

    // Sample Model Selector
    const sampleSelect = document.getElementById('sampleModelSelect');
    if (sampleSelect) {
      sampleSelect.addEventListener('change', (e) => {
        if (e.target.value) this.loadSampleModel(e.target.value);
      });
    }

    // View Mode Switcher (Desktop & Mobile Quick Action Bar)
    document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.mode === mode);
        });
        this.viewer.switchViewMode(mode);

        // Update Diagnostics panel to reflect currently active view mode
        if (mode === 'original' && this.originalGeometry) {
          this.runAnalysis(this.originalGeometry, true);
        } else if (mode === 'repaired' && this.repairedGeometry) {
          this.runAnalysis(this.repairedGeometry, false);
        }
      });
    });

    // Mobile Bottom Sticky Action Bar Triggers
    document.getElementById('mobileBtnAutoRepair')?.addEventListener('click', () => this.runAutoRepair());

    // Viewport Controls
    document.getElementById('toggleWireframe')?.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('active');
      this.viewer.toggleWireframe();
    });

    document.getElementById('toggleBed')?.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('active');
      this.viewer.toggleBed();
    });

    document.getElementById('toggleErrors')?.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('active');
      this.viewer.toggleErrors();
    });

    // Overhang / Support 3D Highlight Toggle
    const toggleOverhangViewportBtn = document.getElementById('toggleOverhangs');
    const toggleOverhangDrawerBtn = document.getElementById('btnToggleOverhangOverlay');
    const onToggleOverhangs = () => this.toggleOverhangView();
    toggleOverhangViewportBtn?.addEventListener('click', onToggleOverhangs);
    toggleOverhangDrawerBtn?.addEventListener('click', onToggleOverhangs);

    document.getElementById('btnResetCamera')?.addEventListener('click', () => {
      this.viewer.setCameraPreset('iso');
    });

    // Sidebar Tabs (Reparatur & Export vs Geometrie)
    document.getElementById('tabBtnRepair')?.addEventListener('click', () => this.switchSidebarTab('repair'));
    document.getElementById('tabBtnGeometry')?.addEventListener('click', () => this.switchSidebarTab('geometry'));

    // Action Buttons (Sidebar & On-Screen 3D Viewport HUD)
    document.getElementById('btnAutoRepair')?.addEventListener('click', () => this.runAutoRepair());
    document.getElementById('btnCancelAutoRepair')?.addEventListener('click', () => this.cancelAutoRepair());
    document.getElementById('btnCancelScan')?.addEventListener('click', () => this.cancelAutoRepair());
    document.getElementById('btnDropToBed')?.addEventListener('click', () => this.runDropToBed());
    document.getElementById('hudBtnDropToBed')?.addEventListener('click', () => this.runDropToBed());
    document.getElementById('btnCenterBed')?.addEventListener('click', () => this.runCenterOnBed());
    document.getElementById('hudBtnCenterBed')?.addEventListener('click', () => this.runCenterOnBed());
    document.getElementById('btnRotateX')?.addEventListener('click', () => this.runRotate('x'));
    document.getElementById('hudBtnRotateX')?.addEventListener('click', () => this.runRotate('x'));
    document.getElementById('btnRotateY')?.addEventListener('click', () => this.runRotate('y'));
    document.getElementById('hudBtnRotateY')?.addEventListener('click', () => this.runRotate('y'));
    document.getElementById('btnRotateZ')?.addEventListener('click', () => this.runRotate('z'));
    document.getElementById('hudBtnRotateZ')?.addEventListener('click', () => this.runRotate('z'));

    // Scale & Unit Conversion Drawer
    const toggleScaleDrawer = document.getElementById('toggleScaleDrawer');
    const scaleDrawerContent = document.getElementById('scaleDrawerContent');
    if (toggleScaleDrawer && scaleDrawerContent) {
      toggleScaleDrawer.addEventListener('click', () => {
        const isOpen = scaleDrawerContent.style.display === 'flex';
        scaleDrawerContent.style.display = isOpen ? 'none' : 'flex';
        toggleScaleDrawer.classList.toggle('expanded', !isOpen);
        toggleScaleDrawer.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });
    }

    document.getElementById('btnScaleInchToMm')?.addEventListener('click', () => this.applyScale(25.4, 'inchToMm'));
    document.getElementById('btnScaleMmToInch')?.addEventListener('click', () => this.applyScale(1 / 25.4, 'mmToInch'));
    document.getElementById('btnResetScale')?.addEventListener('click', () => this.resetScale());

    // Overhang & Support Drawer
    const toggleOverhangDrawer = document.getElementById('toggleOverhangDrawer');
    const overhangDrawerContent = document.getElementById('overhangDrawerContent');
    if (toggleOverhangDrawer && overhangDrawerContent) {
      toggleOverhangDrawer.addEventListener('click', () => {
        const isOpen = overhangDrawerContent.style.display === 'flex';
        overhangDrawerContent.style.display = isOpen ? 'none' : 'flex';
        toggleOverhangDrawer.classList.toggle('expanded', !isOpen);
        toggleOverhangDrawer.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });
    }

    // Overhang Angle Slider & Number Input (2-Way Synchronized)
    const overhangSlider = document.getElementById('overhangAngleSlider');
    const overhangInput = document.getElementById('overhangAngleInput');
    const overhangVal = document.getElementById('overhangAngleValue');
    const syncOverhang = (rawVal) => {
      const angle = Math.min(85, Math.max(15, parseInt(rawVal, 10) || 45));
      if (overhangSlider) overhangSlider.value = angle;
      if (overhangInput) overhangInput.value = angle;
      if (overhangVal) overhangVal.textContent = `${angle}°`;
      this.recalculateOverhangs(angle);
    };
    overhangSlider?.addEventListener('input', (e) => syncOverhang(e.target.value));
    overhangInput?.addEventListener('input', (e) => syncOverhang(e.target.value));

    // Mobile Collapsible Section Cards (< 768px Accordions)
    document.querySelectorAll('.mobile-collapsible-header').forEach((header) => {
      const card = header.closest('.mobile-collapsible-card');
      const toggleCollapsible = () => {
        if (!card) return;
        // On desktop, sections are permanently expanded via CSS
        if (window.innerWidth > 768) return;
        const isExpanded = card.classList.contains('is-expanded');
        card.classList.toggle('is-expanded', !isExpanded);
        header.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
      };

      header.addEventListener('click', toggleCollapsible);
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCollapsible();
        }
      });
    });

    document.getElementById('btnDecimate')?.addEventListener('click', () => this.runDecimation());
    document.getElementById('btnResetDecimate')?.addEventListener('click', () => this.resetDecimation());
    document.getElementById('btnSmoothMesh')?.addEventListener('click', () => this.runSmoothing());
    document.getElementById('btnResetSmooth')?.addEventListener('click', () => this.resetSmoothing());
    document.getElementById('btnQuickAutoRepairFromSmooth')?.addEventListener('click', () => {
      const alertEl = document.getElementById('smoothFeasibilityAlert');
      if (alertEl) alertEl.style.display = 'none';
      this.runAutoRepair();
    });

    // Decimation Slider & Number Input (2-Way Synchronized)
    const decimateSlider = document.getElementById('decimateRatio');
    const decimateInput = document.getElementById('decimateInput');
    const decimateVal = document.getElementById('decimateValue');
    const updateDecimate = (rawVal) => {
      const num = Math.min(90, Math.max(10, parseInt(rawVal, 10) || 50));
      if (decimateSlider) decimateSlider.value = num;
      if (decimateInput) decimateInput.value = num;
      const ratio = num / 100;
      const base = this.baseFullDetailGeometry || this.originalGeometry;
      const triCount = base ? Math.round(base.getAttribute('position').count / 3) : 0;
      const estTriangles = Math.max(24, Math.round(triCount * ratio));
      if (decimateVal) decimateVal.textContent = `${num}% (${estTriangles.toLocaleString()} ▲)`;
    };
    decimateSlider?.addEventListener('input', (e) => updateDecimate(e.target.value));
    decimateInput?.addEventListener('input', (e) => updateDecimate(e.target.value));
    this.updateDecimateSliderLabel = () => updateDecimate(decimateSlider ? decimateSlider.value : 50);

    // Smoothing Intensity Slider
    const smoothSlider = document.getElementById('smoothIntensity');
    const smoothVal = document.getElementById('smoothIntensityValue');
    const intensityNames = {
      1: () => I18n.t('levelLight'),
      2: () => I18n.t('levelMedium'),
      3: () => I18n.t('levelStrong'),
      4: () => I18n.t('levelUltra'),
    };
    smoothSlider?.addEventListener('input', (e) => {
      const fn = intensityNames[e.target.value];
      if (smoothVal && fn) smoothVal.textContent = fn();
    });

    // Material & Infill calculation triggers (2-Way Synchronized)
    const infillSlider = document.getElementById('infillSlider');
    const infillInput = document.getElementById('infillInput');
    const infillVal = document.getElementById('infillValue');
    const syncInfill = (rawVal) => {
      const num = Math.min(100, Math.max(0, parseInt(rawVal, 10) || 0));
      if (infillSlider) infillSlider.value = num;
      if (infillInput) infillInput.value = num;
      if (infillVal) infillVal.textContent = `${num}%`;
      this.updateMaterialMetrics();
    };
    document.getElementById('materialSelect')?.addEventListener('change', () => this.updateMaterialMetrics());
    infillSlider?.addEventListener('input', (e) => syncInfill(e.target.value));
    infillInput?.addEventListener('input', (e) => syncInfill(e.target.value));

    // Export Buttons
    document.getElementById('btnExportBinarySTL')?.addEventListener('click', () => this.exportModel('stl-binary'));
    document.getElementById('btnExportAsciiSTL')?.addEventListener('click', () => this.exportModel('stl-ascii'));
    document.getElementById('btnExport3MF')?.addEventListener('click', () => this.exportModel('3mf'));
    document.getElementById('btnExportOBJ')?.addEventListener('click', () => this.exportModel('obj'));

    // Floating Back-To-Top Button
    this.setupBackToTop();

    // Floating Sticky Auto-Repair Bar
    this.setupStickyRepairBar();

    // Mobile Bottom Sheet Quick Tools
    this.setupMobileBottomSheet();

    // Mobile Dashboard Segmented Tabs (< 768px)
    this.setupMobileDashboardTabs();
  }

  /**
   * Setup Mobile Quick Controls Bottom Sheet with gesture handling & backdrop
   */
  setupMobileBottomSheet() {
    const sheet = document.getElementById('mobileBottomSheet');
    const backdrop = document.getElementById('mobileSheetBackdrop');
    const openBtn = document.getElementById('mobileBtnOpenTools');
    const closeBtn = document.getElementById('mobileSheetCloseBtn');
    const handleZone = document.getElementById('mobileSheetHandleZone');

    if (!sheet) return;

    const openSheet = () => {
      sheet.classList.add('active');
      if (backdrop) backdrop.classList.add('active');
      sheet.setAttribute('aria-hidden', 'false');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeSheet = () => {
      sheet.classList.remove('active');
      sheet.style.transform = '';
      if (backdrop) backdrop.classList.remove('active');
      sheet.setAttribute('aria-hidden', 'true');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    openBtn?.addEventListener('click', openSheet);
    closeBtn?.addEventListener('click', closeSheet);
    backdrop?.addEventListener('click', closeSheet);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.classList.contains('active')) {
        closeSheet();
      }
    });

    // Touch gesture drag handle to pull down and dismiss
    if (handleZone) {
      let startY = 0;
      let currentY = 0;
      let isDragging = false;

      handleZone.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startY = e.touches[0].clientY;
          currentY = startY;
          isDragging = true;
        }
      }, { passive: true });

      handleZone.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) {
          sheet.style.transform = `translateY(${deltaY}px)`;
        }
      }, { passive: true });

      const finishDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        const deltaY = currentY - startY;
        sheet.style.transform = '';
        if (deltaY > 50) {
          closeSheet();
        }
      };

      handleZone.addEventListener('touchend', finishDrag, { passive: true });
      handleZone.addEventListener('touchcancel', finishDrag, { passive: true });
    }
  }

  /**
   * Setup sleek floating sticky Auto-Repair button when scrolling past the dashboard
   */
  setupStickyRepairBar() {
    const mainBtn = document.getElementById('btnAutoRepair');
    const stickyBtn = document.getElementById('btnStickyAutoRepair');
    const footer = document.querySelector('footer.app-footer');
    const mobileBar = document.getElementById('mobileStickyActionBar');

    // Clicking sticky repair button triggers main repair flow
    if (stickyBtn && mainBtn) {
      stickyBtn.addEventListener('click', () => {
        mainBtn.click();
      });
    }

    // Scroll & Intersection listener
    const updateStickyVisibility = () => {
      // Desktop floating button
      if (mainBtn && stickyBtn) {
        const mainRect = mainBtn.getBoundingClientRect();
        const isPastMain = mainRect.bottom < 40;

        let isNearFooter = false;
        if (footer) {
          const footerRect = footer.getBoundingClientRect();
          isNearFooter = footerRect.top < (window.innerHeight - 30);
        }

        if (isPastMain && !isNearFooter) {
          stickyBtn.classList.add('visible');
        } else {
          stickyBtn.classList.remove('visible');
        }
      }

      // Mobile sticky bar: hide when footer enters viewport (Bild 1 fix)
      if (mobileBar && footer) {
        const footerRect = footer.getBoundingClientRect();
        if (footerRect.top < window.innerHeight) {
          mobileBar.classList.add('hidden-at-footer');
        } else {
          mobileBar.classList.remove('hidden-at-footer');
        }
      }
    };

    window.addEventListener('scroll', updateStickyVisibility, { passive: true });
    window.addEventListener('resize', updateStickyVisibility, { passive: true });

    // IntersectionObserver on footer for instantaneous response
    if (footer && mobileBar && 'IntersectionObserver' in window) {
      const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            mobileBar.classList.add('hidden-at-footer');
          } else {
            mobileBar.classList.remove('hidden-at-footer');
          }
        });
      }, { threshold: [0, 0.05, 0.1] });
      footerObserver.observe(footer);
    }
  }

  /**
   * Setup Mobile Dashboard Segmented Tabs (< 768px)
   * Switches between Model Diagnostics (left-sidebar) and Tools & Repair (right-sidebar)
   */
  setupMobileDashboardTabs() {
    const diagBtn = document.getElementById('mobileTabBtnDiag');
    const toolsBtn = document.getElementById('mobileTabBtnTools');
    const grid = document.querySelector('.dashboard-grid');

    if (!diagBtn || !toolsBtn || !grid) return;

    const showTab = (tab) => {
      if (tab === 'tools') {
        grid.classList.add('show-tools');
        toolsBtn.classList.add('active');
        toolsBtn.setAttribute('aria-selected', 'true');
        diagBtn.classList.remove('active');
        diagBtn.setAttribute('aria-selected', 'false');
      } else {
        grid.classList.remove('show-tools');
        diagBtn.classList.add('active');
        diagBtn.setAttribute('aria-selected', 'true');
        toolsBtn.classList.remove('active');
        toolsBtn.setAttribute('aria-selected', 'false');
      }
    };

    diagBtn.addEventListener('click', () => showTab('diag'));
    toolsBtn.addEventListener('click', () => showTab('tools'));
  }

  /**
   * Initialize Back-To-Top button with scroll listener
   */
  setupBackToTop() {
    const btn = document.getElementById('btnBackToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 260) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      this.scrollToTop(850);
    });
  }

  /**
   * Smooth scroll to top with custom Ease-In-Out cubic deceleration curve
   * (starts with slow acceleration, reaches smooth glide, and decelerates gently at the end)
   */
  scrollToTop(duration = 850) {
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    if (startPosition <= 0) return;
    
    const startTime = performance.now();

    // Ease-In-Out Cubic easing function
    const easeInOutCubic = (t) => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * Called by I18n when user switches language
   */
  onLanguageChange(lang) {
    const smoothSlider = document.getElementById('smoothIntensity');
    const smoothVal = document.getElementById('smoothIntensityValue');
    if (smoothSlider && smoothVal) {
      const intensityMap = {
        '1': I18n.t('levelLight'),
        '2': I18n.t('levelMedium'),
        '3': I18n.t('levelStrong'),
        '4': I18n.t('levelUltra')
      };
      smoothVal.textContent = intensityMap[smoothSlider.value] || I18n.t('levelMedium');
    }

    if (this.activeAnalysis) {
      const isOriginal = this.viewer.activeMeshType !== 'repaired';
      this.runAnalysis(isOriginal ? this.originalGeometry : this.repairedGeometry, isOriginal);
    }
  }

  /**
   * Process loaded local file
   * @param {FileList} files
   */
  async handleFiles(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    this.showProgress(true);
    this.showToast(I18n.t('toastLoading', { fileName }), 'info');

    try {
      let geometry = null;

      if (ext === 'stl') {
        const arrayBuffer = await file.arrayBuffer();
        geometry = this.parseSTLBuffer(arrayBuffer);
      } else if (ext === 'obj') {
        const text = await file.text();
        geometry = this.parseOBJText(text);
      } else if (ext === '3mf') {
        const arrayBuffer = await file.arrayBuffer();
        geometry = await this.parse3MFBuffer(arrayBuffer);
      } else {
        throw new Error(I18n.t('toastUnsupportedFormat', { ext }));
      }

      if (!geometry || !geometry.getAttribute('position') || geometry.getAttribute('position').count === 0) {
        throw new Error(I18n.t('toastNoGeometry'));
      }

      this.currentFileName = fileName;
      this.currentFileRawName = fileName.replace(/\.[^/.]+$/, '');
      this.currentFileSize = file.size;
      const sampleSelect = document.getElementById('sampleModelSelect');
      if (sampleSelect) sampleSelect.value = '';
      this.setOriginalModel(geometry, file.size);
      this.showToast(I18n.t('toastLoadSuccess', { fileName }), 'success');
    } catch (err) {
      console.error(err);
      this.showToast(err.message, 'error');
    } finally {
      this.showProgress(false);
    }
  }

  /**
   * Native 100% Client-side STL parser (Binary and ASCII) with auto-detection & fallback
   * @param {ArrayBuffer} buffer
   * @returns {THREE.BufferGeometry}
   */
  parseSTLBuffer(buffer) {
    if (!buffer || buffer.byteLength < 84) {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      return this.parseAsciiSTL(decoder.decode(buffer || new ArrayBuffer(0)));
    }

    const dataView = new DataView(buffer);
    const faceCount = dataView.getUint32(80, true);
    const expectedSize = 84 + faceCount * 50;

    // Check if explicitly ASCII
    const headerBytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 512));
    const headerStr = new TextDecoder('utf-8', { fatal: false }).decode(headerBytes).toLowerCase();
    const isExplicitAscii = headerStr.includes('solid') && (headerStr.includes('facet') || headerStr.includes('outer loop'));

    const isBinary = !isExplicitAscii && (buffer.byteLength >= expectedSize || (faceCount > 0 && Math.abs(buffer.byteLength - expectedSize) <= 1024));

    if (isBinary) {
      const maxPossibleFaces = Math.floor((buffer.byteLength - 84) / 50);
      const actualFaceCount = Math.min(faceCount > 0 ? faceCount : maxPossibleFaces, maxPossibleFaces);

      if (actualFaceCount > 0) {
        const vertices = new Float32Array(actualFaceCount * 9);
        const normals = new Float32Array(actualFaceCount * 9);
        let offset = 84;

        for (let f = 0; f < actualFaceCount; f++) {
          const nx = dataView.getFloat32(offset, true);
          const ny = dataView.getFloat32(offset + 4, true);
          const nz = dataView.getFloat32(offset + 8, true);
          offset += 12;

          for (let v = 0; v < 3; v++) {
            const vIdx = f * 9 + v * 3;
            vertices[vIdx] = dataView.getFloat32(offset, true);
            vertices[vIdx + 1] = dataView.getFloat32(offset + 4, true);
            vertices[vIdx + 2] = dataView.getFloat32(offset + 8, true);

            normals[vIdx] = nx;
            normals[vIdx + 1] = ny;
            normals[vIdx + 2] = nz;

            offset += 12;
          }
          offset += 2;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        return geom;
      }
    }

    // Try ASCII parser
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(buffer);
    const asciiGeom = this.parseAsciiSTL(text);
    if (asciiGeom && asciiGeom.getAttribute('position') && asciiGeom.getAttribute('position').count > 0) {
      return asciiGeom;
    }

    // Secondary Fallback: Force Binary interpretation if ASCII failed
    const maxPossibleFaces = Math.floor((buffer.byteLength - 84) / 50);
    if (maxPossibleFaces > 0) {
      const actualFaceCount = Math.min(faceCount > 0 ? faceCount : maxPossibleFaces, maxPossibleFaces);
      const vertices = new Float32Array(actualFaceCount * 9);
      const normals = new Float32Array(actualFaceCount * 9);
      let offset = 84;

      for (let f = 0; f < actualFaceCount; f++) {
        const nx = dataView.getFloat32(offset, true);
        const ny = dataView.getFloat32(offset + 4, true);
        const nz = dataView.getFloat32(offset + 8, true);
        offset += 12;

        for (let v = 0; v < 3; v++) {
          const vIdx = f * 9 + v * 3;
          vertices[vIdx] = dataView.getFloat32(offset, true);
          vertices[vIdx + 1] = dataView.getFloat32(offset + 4, true);
          vertices[vIdx + 2] = dataView.getFloat32(offset + 8, true);

          normals[vIdx] = nx;
          normals[vIdx + 1] = ny;
          normals[vIdx + 2] = nz;

          offset += 12;
        }
        offset += 2;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      return geom;
    }

    return asciiGeom;
  }

  /**
   * Parse ASCII STL Text with scientific notation support
   */
  parseAsciiSTL(text) {
    const vertices = [];
    const lines = text.split(/\r?\n/);
    const vertexRegex = /vertex\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = vertexRegex.exec(line);
      if (match) {
        vertices.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Set original geometry, analyze and render
   */
  setOriginalModel(geometry, fileSizeBytes = 0) {
    // Abort any ongoing repair operation
    if (this.repairAbortController) {
      try {
        this.repairAbortController.abort('USER_NEW_MODEL');
      } catch (e) {}
      this.repairAbortController = null;
    }

    // Automatically center and drop on bed
    this.originalGeometry = MeshRepairer.alignToBed(geometry);
    this.baseFullDetailGeometry = this.originalGeometry.clone();
    this.rawLoadedGeometry = this.originalGeometry.clone();
    this.currentScaleFactor = 1.0;
    this.repairedGeometry = null;
    this.hasAutoRepaired = false;
    this.currentMode = 'original';
    this.currentFileSize = fileSizeBytes;

    // Reset view mode buttons: 'original' active, 'repaired' and 'split' disabled
    document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
      b.classList.remove('active');
      if (b.dataset.mode === 'original') {
        b.disabled = false;
        b.classList.add('active');
      } else {
        b.disabled = true;
      }
    });

    // Reset scanner overlay, progress bar & abort/cancel buttons
    const timeoutBox = document.getElementById('timeoutNoticeBox');
    if (timeoutBox) timeoutBox.style.display = 'none';
    const repairOverlay = document.getElementById('repairScanOverlay');
    if (repairOverlay) repairOverlay.classList.remove('active');
    const btnCancel = document.getElementById('btnCancelAutoRepair');
    if (btnCancel) btnCancel.style.display = 'none';
    const scanProgressBar = document.getElementById('scanProgressBar');
    if (scanProgressBar) scanProgressBar.style.width = '0%';
    const scanPercentText = document.getElementById('scanPercentText');
    if (scanPercentText) scanPercentText.textContent = '0%';

    // Reset main, sticky, and mobile auto-repair buttons
    const btnAuto = document.getElementById('btnAutoRepair');
    const btnAutoSpan = document.getElementById('btnAutoRepairText');
    if (btnAuto) {
      btnAuto.classList.remove('running', 'done');
      btnAuto.disabled = false;
      if (btnAutoSpan) btnAutoSpan.textContent = typeof I18n !== 'undefined' ? I18n.t('btnAutoRepair') : 'Auto-Reparatur starten';
    }
    const stickyAuto = document.getElementById('btnStickyAutoRepair');
    if (stickyAuto) {
      stickyAuto.classList.remove('running', 'done');
      stickyAuto.disabled = false;
      const stickySpan = stickyAuto.querySelector('span');
      if (stickySpan) stickySpan.textContent = typeof I18n !== 'undefined' ? I18n.t('btnAutoRepair') : 'Auto-Reparatur starten';
    }
    const mobileAuto = document.getElementById('mobileBtnAutoRepair');
    if (mobileAuto) {
      mobileAuto.classList.remove('running', 'done');
      mobileAuto.disabled = false;
      const mobileSpan = document.getElementById('mobileBtnRepairText');
      if (mobileSpan) mobileSpan.textContent = typeof I18n !== 'undefined' ? I18n.t('btnAutoRepair') : 'Auto-Reparatur';
    }

    // Reset before/after delta badges
    const vDelta = document.getElementById('v-delta-badge');
    if (vDelta) vDelta.style.display = 'none';
    const tDelta = document.getElementById('t-delta-badge');
    if (tDelta) tDelta.style.display = 'none';

    // Clear file input value so re-selecting the same file fires 'change' event
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    // Update File info badge
    const fileBadge = document.getElementById('fileBadge');
    if (fileBadge) fileBadge.style.display = 'flex';
    const fileNameText = document.getElementById('fileNameText');
    if (fileNameText) fileNameText.textContent = this.currentFileName;
    const fileSizeText = document.getElementById('fileSizeText');
    if (fileSizeText) fileSizeText.textContent = this.formatBytes(fileSizeBytes);

    // Reset Decimate slider & label & disable reset decimate button
    const decimateSlider = document.getElementById('decimateRatio');
    if (decimateSlider) decimateSlider.value = '50';
    if (typeof this.updateDecimateSliderLabel === 'function') {
      this.updateDecimateSliderLabel();
    }
    const btnResetDecimate = document.getElementById('btnResetDecimate');
    if (btnResetDecimate) btnResetDecimate.disabled = true;

    // Reset Smooth slider & label & disable reset smooth button
    const smoothSlider = document.getElementById('smoothIntensity');
    if (smoothSlider) {
      smoothSlider.value = '2';
      const smoothVal = document.getElementById('smoothIntensityValue');
      if (smoothVal) smoothVal.textContent = typeof I18n !== 'undefined' ? I18n.t('levelMedium') : 'Mittel';
    }
    const btnResetSmooth = document.getElementById('btnResetSmooth');
    if (btnResetSmooth) btnResetSmooth.disabled = true;
    const smoothAlert = document.getElementById('smoothFeasibilityAlert');
    if (smoothAlert) smoothAlert.style.display = 'none';

    // Reset Scale inputs, UI badge & disable reset scale button
    const customScaleInput = document.getElementById('customScaleInput');
    if (customScaleInput) customScaleInput.value = '';
    this.updateScaleUI();
    const btnResetScale = document.getElementById('btnResetScale');
    if (btnResetScale) btnResetScale.disabled = true;

    // Reset Overhang Angle slider & label
    const overhangSlider = document.getElementById('overhangAngleSlider');
    const overhangVal = document.getElementById('overhangAngleValue');
    if (overhangSlider) overhangSlider.value = '45';
    if (overhangVal) overhangVal.textContent = '45°';

    // Reset Material & Infill options
    const materialSelect = document.getElementById('materialSelect');
    if (materialSelect) materialSelect.value = 'PLA';
    const infillSlider = document.getElementById('infillSlider');
    if (infillSlider) {
      infillSlider.value = '20';
      const infillVal = document.getElementById('infillValue');
      if (infillVal) infillVal.textContent = '20%';
    }

    // Close all collapsible drawers in the sidebar
    const toggleOverhangDrawer = document.getElementById('toggleOverhangDrawer');
    const overhangDrawerContent = document.getElementById('overhangDrawerContent');
    if (overhangDrawerContent) {
      overhangDrawerContent.style.display = 'none';
      toggleOverhangDrawer?.classList.remove('expanded');
      toggleOverhangDrawer?.setAttribute('aria-expanded', 'false');
    }

    const toggleScaleDrawer = document.getElementById('toggleScaleDrawer');
    const scaleDrawerContent = document.getElementById('scaleDrawerContent');
    if (scaleDrawerContent) {
      scaleDrawerContent.style.display = 'none';
      toggleScaleDrawer?.classList.remove('expanded');
      toggleScaleDrawer?.setAttribute('aria-expanded', 'false');
    }

    // Reset all Issue expandable cards
    document.querySelectorAll('.issue-item.expanded').forEach((el) => {
      el.classList.remove('expanded');
    });

    // Reset viewport tool toggle buttons
    const toggleOverhangViewportBtn = document.getElementById('toggleOverhangs');
    const toggleOverhangDrawerBtn = document.getElementById('btnToggleOverhangOverlay');
    const toggleWireframeBtn = document.getElementById('toggleWireframe');
    const toggleErrorsBtn = document.getElementById('toggleErrors');
    const toggleBedBtn = document.getElementById('toggleBed');

    if (toggleOverhangViewportBtn) toggleOverhangViewportBtn.classList.remove('active');
    if (toggleOverhangDrawerBtn) toggleOverhangDrawerBtn.classList.remove('active');
    const overhangHud = document.getElementById('viewerOverhangHud');
    if (overhangHud) overhangHud.style.display = 'none';
    if (toggleWireframeBtn) toggleWireframeBtn.classList.remove('active');
    if (toggleErrorsBtn) toggleErrorsBtn.classList.add('active');
    if (toggleBedBtn) toggleBedBtn.classList.add('active');

    // Switch back to Repair tab by default
    this.switchSidebarTab('repair');

    // Reset pipeline steps
    document.getElementById('pipeUpload')?.classList.remove('active');
    document.getElementById('pipeUpload')?.classList.add('done');
    document.getElementById('pipeAnalyze')?.classList.remove('active');
    document.getElementById('pipeAnalyze')?.classList.add('done');
    document.getElementById('pipeRepair')?.classList.remove('active', 'done');
    document.getElementById('pipeExport')?.classList.remove('active', 'done');

    // Enable repair, bed transformation, decimation & smooth buttons
    if (document.getElementById('btnDropToBed')) document.getElementById('btnDropToBed').disabled = false;
    if (document.getElementById('hudBtnDropToBed')) document.getElementById('hudBtnDropToBed').disabled = false;
    if (document.getElementById('btnCenterBed')) document.getElementById('btnCenterBed').disabled = false;
    if (document.getElementById('hudBtnCenterBed')) document.getElementById('hudBtnCenterBed').disabled = false;
    if (document.getElementById('btnRotateX')) document.getElementById('btnRotateX').disabled = false;
    if (document.getElementById('hudBtnRotateX')) document.getElementById('hudBtnRotateX').disabled = false;
    if (document.getElementById('btnRotateY')) document.getElementById('btnRotateY').disabled = false;
    if (document.getElementById('hudBtnRotateY')) document.getElementById('hudBtnRotateY').disabled = false;
    if (document.getElementById('btnRotateZ')) document.getElementById('btnRotateZ').disabled = false;
    if (document.getElementById('hudBtnRotateZ')) document.getElementById('hudBtnRotateZ').disabled = false;
    if (document.getElementById('btnScaleInchToMm')) document.getElementById('btnScaleInchToMm').disabled = false;
    if (document.getElementById('btnScaleMmToInch')) document.getElementById('btnScaleMmToInch').disabled = false;
    if (document.getElementById('btnDecimate')) document.getElementById('btnDecimate').disabled = false;
    if (document.getElementById('btnSmoothMesh')) document.getElementById('btnSmoothMesh').disabled = false;
    document.getElementById('exportButtonGroup')?.querySelectorAll('button').forEach((b) => (b.disabled = false));

    // Reset Viewport tools, overlays, and camera
    if (this.viewer?.resetViewportState) {
      this.viewer.resetViewportState();
    }

    // Render in viewport
    this.viewer.setOriginalGeometry(this.originalGeometry);

    // Analyze mesh topology and update highlights
    this.runAnalysis(this.originalGeometry, true);
  }

  runAnalysis(geometry, isOriginal = true) {
    const analysis = MeshAnalyzer.analyze(geometry);
    this.activeAnalysis = analysis;

    // Update UI Cards
    document.getElementById('metricVertices').textContent = analysis.vertexCount.toLocaleString();
    document.getElementById('metricTriangles').textContent = analysis.triangleCount.toLocaleString();

    // Update Before / After Section
    const vStatDisplay = document.getElementById('v-stat-display');
    const tStatDisplay = document.getElementById('t-stat-display');
    const errStatDisplay = document.getElementById('err-stat-display');
    const vDelta = document.getElementById('v-delta-badge');
    const tDelta = document.getElementById('t-delta-badge');
    const vNote = document.getElementById('v-detail-note');
    const tNote = document.getElementById('t-detail-note');
    const errBadge = document.getElementById('errors-badge');
    const errNote = document.getElementById('errors-detail-note');
    const statusPill = document.getElementById('repairStatusPill');

    const totalErrors = (analysis.boundaryEdgesCount || 0) + (analysis.nonManifoldEdgesCount || 0) + (analysis.invertedEdgesCount || 0) + (analysis.degenerateTriangles || 0);

    if (isOriginal) {
      this.originalAnalysis = analysis;

      // Current Mesh Status Before Repair
      if (vStatDisplay) {
        vStatDisplay.innerHTML = `<span data-i18n="labelCurrentMesh">${I18n.t('labelCurrentMesh')}</span> <span id="v-current-val" style="font-weight: 700; color: var(--accent-cyan);">${analysis.vertexCount.toLocaleString()}</span>`;
      }
      if (tStatDisplay) {
        tStatDisplay.innerHTML = `<span data-i18n="labelCurrentMesh">${I18n.t('labelCurrentMesh')}</span> <span id="t-current-val" style="font-weight: 700; color: var(--accent-cyan);">${analysis.triangleCount.toLocaleString()}</span>`;
      }
      if (errStatDisplay) {
        if (totalErrors === 0) {
          errStatDisplay.innerHTML = `<span data-i18n="labelStatusMesh">${I18n.t('labelStatusMesh')}</span> <span id="err-current-val" style="font-weight: 700; color: var(--status-success);">${I18n.t('cleanBadge')}</span>`;
        } else {
          errStatDisplay.innerHTML = `<span data-i18n="labelStatusMesh">${I18n.t('labelStatusMesh')}</span> <span id="err-current-val" style="font-weight: 700; color: var(--status-warning);">${I18n.t('errorsCountLabel', { count: totalErrors })}</span>`;
        }
      }

      if (vDelta) vDelta.style.display = 'none';
      if (tDelta) tDelta.style.display = 'none';

      if (vNote) vNote.textContent = totalErrors === 0 ? I18n.t('vNotePost') : I18n.t('vNoteAction');
      if (tNote) tNote.textContent = totalErrors === 0 ? I18n.t('tNotePost') : I18n.t('tNoteAction');
      if (errNote) errNote.textContent = totalErrors === 0 ? I18n.t('errorsNotePost') : I18n.t('errorsNoteAction');

      if (errBadge) {
        errBadge.style.background = totalErrors === 0 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)';
        errBadge.style.color = totalErrors === 0 ? 'var(--status-success)' : 'var(--status-warning)';
        errBadge.style.borderColor = totalErrors === 0 ? 'var(--status-success-border)' : 'var(--status-warning-border)';
        errBadge.textContent = totalErrors === 0 ? '✔ 100% Manifold' : '⚠️ ' + totalErrors + ' Fehler';
      }

      if (statusPill) {
        statusPill.className = totalErrors === 0 ? 'status-pill good' : 'status-pill warning';
        statusPill.innerHTML = totalErrors === 0 ? `<span>${I18n.t('statusAlreadyClean')}</span>` : `<span>${I18n.t('statusPreRepair')}</span>`;
      }

      // Update Pipeline Step
      document.getElementById('pipeUpload')?.classList.add('done');
      document.getElementById('pipeAnalyze')?.classList.add('active');
    } else {
      // Repaired Geometry: Display full Vorher -> Nachher Comparison Audit
      const origV = this.originalAnalysis ? this.originalAnalysis.vertexCount : analysis.vertexCount;
      const origT = this.originalAnalysis ? this.originalAnalysis.triangleCount : analysis.triangleCount;
      const origErrors = this.originalAnalysis ? 
        (this.originalAnalysis.boundaryEdgesCount + this.originalAnalysis.nonManifoldEdgesCount + this.originalAnalysis.invertedEdgesCount + this.originalAnalysis.degenerateTriangles) : 0;
      const deltaV = analysis.vertexCount - origV;
      const deltaT = analysis.triangleCount - origT;

      if (vStatDisplay) {
        vStatDisplay.innerHTML = `<span data-i18n="statBeforeLabel">${I18n.t('statBeforeLabel')}</span> <span>${origV.toLocaleString()}</span> &rarr; <span data-i18n="statAfterLabel">${I18n.t('statAfterLabel')}</span> <span style="font-weight: 700; color: var(--status-success);">${analysis.vertexCount.toLocaleString()}</span>`;
      }
      if (tStatDisplay) {
        tStatDisplay.innerHTML = `<span data-i18n="statBeforeLabel">${I18n.t('statBeforeLabel')}</span> <span>${origT.toLocaleString()}</span> &rarr; <span data-i18n="statAfterLabel">${I18n.t('statAfterLabel')}</span> <span style="font-weight: 700; color: var(--status-success);">${analysis.triangleCount.toLocaleString()}</span>`;
      }
      if (errStatDisplay) {
        errStatDisplay.innerHTML = `<span data-i18n="statBeforeLabel">${I18n.t('statBeforeLabel')}</span> <span>${origErrors === 0 ? I18n.t('cleanBadge') : I18n.t('errorsCountLabel', { count: origErrors })}</span> &rarr; <span data-i18n="statAfterLabel">${I18n.t('statAfterLabel')}</span> <span style="font-weight: 700; color: var(--status-success);">${I18n.t('cleanStatusLabel')}</span>`;
      }

      if (vDelta) {
        vDelta.style.display = 'inline-block';
        vDelta.textContent = (deltaV >= 0 ? '+' : '') + deltaV.toLocaleString();
        vDelta.style.background = 'var(--status-success-bg)';
        vDelta.style.color = 'var(--status-success)';
        vDelta.style.borderColor = 'var(--status-success-border)';
      }
      if (tDelta) {
        tDelta.style.display = 'inline-block';
        tDelta.textContent = (deltaT >= 0 ? '+' : '') + deltaT.toLocaleString();
        tDelta.style.background = 'var(--status-success-bg)';
        tDelta.style.color = 'var(--status-success)';
        tDelta.style.borderColor = 'var(--status-success-border)';
      }

      if (vNote) vNote.textContent = I18n.t('vNotePost');
      if (tNote) tNote.textContent = I18n.t('tNotePost');
      if (errNote) errNote.textContent = I18n.t('errorsNotePost');

      if (errBadge) {
        errBadge.style.background = 'var(--status-success-bg)';
        errBadge.style.color = 'var(--status-success)';
        errBadge.style.borderColor = 'var(--status-success-border)';
        errBadge.textContent = '✔ 100% Manifold';
      }
      if (statusPill) {
        statusPill.className = 'status-pill good';
        statusPill.innerHTML = `<span>${I18n.t('statusPostRepair')}</span>`;
      }

      // Update Pipeline Step
      document.getElementById('pipeAnalyze')?.classList.add('done');
      document.getElementById('pipeRepair')?.classList.add('done');
      document.getElementById('pipeExport')?.classList.add('active');
    }

    // Bounding Box
    document.getElementById('metricDimX').textContent = analysis.dimensions.x.toFixed(1);
    document.getElementById('metricDimY').textContent = analysis.dimensions.y.toFixed(1);
    document.getElementById('metricDimZ').textContent = analysis.dimensions.z.toFixed(1);

    // Volume & Area
    document.getElementById('metricVolume').textContent = `${analysis.volumeCm3.toFixed(2)} cm³`;
    document.getElementById('metricArea').textContent = `${analysis.surfaceAreaCm2.toFixed(2)} cm²`;

    // 3D Printability Verdict Assessment
    const isClean = analysis.isWatertight && analysis.isManifold && analysis.boundaryEdgesCount === 0 && analysis.nonManifoldEdgesCount === 0 && analysis.invertedEdgesCount === 0 && analysis.degenerateTriangles === 0;
    const isPrintReady = !isOriginal || isClean;

    const printCard = document.getElementById('printabilityCard');
    const printBadge = document.getElementById('printabilityBadge');
    const printDescText = document.getElementById('printabilityDescText');
    const reasonsList = document.getElementById('printabilityReasonsList');

    if (printCard && printBadge && printDescText && reasonsList) {
      if (isPrintReady) {
        printCard.className = 'printability-card ready';
        printBadge.className = 'printability-badge good';
        printBadge.innerHTML = `
          <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>${I18n.t('printReadyTitle')}</span>
        `;
        printDescText.textContent = I18n.t('printReadyDesc');

        let readyHTML = '';
        readyHTML += `<div class="reason-item good"><span>${I18n.t('checklistSlicers')}</span></div>`;
        readyHTML += `<div class="reason-item good"><span>${I18n.t('checklistWatertight')}</span></div>`;
        
        if (analysis.nonManifoldEdgesCount > 0) {
          readyHTML += `<div class="reason-item good" style="color: #93c5fd;"><span>${I18n.t('repairedNoteNonManifold', { count: analysis.nonManifoldEdgesCount })}</span></div>`;
        }
        if (analysis.invertedEdgesCount > 0) {
          readyHTML += `<div class="reason-item good" style="color: #93c5fd;"><span>${I18n.t('repairedNoteNormals', { count: analysis.invertedEdgesCount })}</span></div>`;
        }
        if (analysis.boundaryEdgesCount === 0) {
          readyHTML += `<div class="reason-item good"><span>${I18n.t('repairedNoteHoles')}</span></div>`;
        }
        reasonsList.innerHTML = readyHTML;
      } else {
        printCard.className = 'printability-card not-ready';
        printBadge.className = 'printability-badge warning';
        printBadge.innerHTML = `
          <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clip-rule="evenodd"/>
          </svg>
          <span>${I18n.t('printNotReadyTitle')}</span>
        `;
        printDescText.textContent = I18n.t('printNotReadyDesc');

        let reasonsHTML = '';
        if (analysis.boundaryEdgesCount > 0) {
          reasonsHTML += `<div class="reason-item bad"><span>${I18n.t('reasonHoles', { count: analysis.boundaryEdgesCount })}</span></div>`;
        }
        if (analysis.nonManifoldEdgesCount > 0) {
          reasonsHTML += `<div class="reason-item bad"><span>${I18n.t('reasonNonManifold', { count: analysis.nonManifoldEdgesCount })}</span></div>`;
        }
        if (analysis.invertedEdgesCount > 0) {
          reasonsHTML += `<div class="reason-item bad"><span>${I18n.t('reasonNormals', { count: analysis.invertedEdgesCount })}</span></div>`;
        }
        if (analysis.degenerateTriangles > 0) {
          reasonsHTML += `<div class="reason-item bad"><span>${I18n.t('reasonDegenerates', { count: analysis.degenerateTriangles })}</span></div>`;
        }
        reasonsList.innerHTML = reasonsHTML;
      }
    }

    // Issues list
    this.updateIssueRow('issueOpenEdges', analysis.boundaryEdgesCount, I18n.t('issueOpenEdges'), 'issueOpenEdges', isOriginal);
    this.updateIssueRow('issueNonManifold', analysis.nonManifoldEdgesCount, I18n.t('issueNonManifold'), 'issueNonManifold', isOriginal);
    this.updateIssueRow('issueInverted', analysis.invertedEdgesCount, I18n.t('issueInverted'), 'issueInverted', isOriginal);
    this.updateIssueRow('issueDegenerates', analysis.degenerateTriangles, I18n.t('issueDegenerates'), 'issueDegenerates', isOriginal);
    this.updateUnitScaleRow(analysis.unitScale, isOriginal);
    this.updateOverhangRow(analysis.overhangs, isOriginal);
    this.updateOverhangMetricsUI(analysis.overhangs);

    // Update error visualizer in 3D viewport
    if (isOriginal) {
      this.viewer.setErrorHighlights(analysis.errorLines);
    }
    if (this.viewer && analysis.overhangs && analysis.overhangs.overhangTrianglesBuffer) {
      this.viewer.setOverhangHighlights(
        analysis.overhangs.overhangTrianglesBuffer,
        analysis.overhangs.overhangColorsBuffer
      );
    } else if (this.viewer) {
      this.viewer.clearOverhangHighlights();
    }

    // Update Material estimates
    this.updateMaterialMetrics();
  }

  updateIssueRow(id, count, label, issueKey, isOriginal = true) {
    const el = document.getElementById(id);
    if (!el) return;

    const isExpanded = el.classList.contains('expanded');
    const isError = count > 0;
    el.className = `issue-item ${isError ? 'error' : 'success'} ${isExpanded ? 'expanded' : ''}`;

    const problemText = I18n.t(`${issueKey}DescProblem`);
    const solutionText = I18n.t(`${issueKey}DescSolution`);
    const problemLabel = I18n.t('problemLabel');
    const solutionLabel = I18n.t('solutionLabel');
    const fixBtnText = I18n.t('fixWithAutoRepairBtn');

    el.innerHTML = `
      <div class="issue-header">
        <span class="issue-name">
          ${isError 
            ? '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
            : '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
          }
          ${label}
        </span>
        <div class="issue-count-wrapper">
          <span class="issue-count" ${!isError ? 'style="color: var(--status-success);"' : ''}>${isError ? count : I18n.t('cleanBadge')}</span>
          <svg class="issue-chevron" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
      <div class="issue-detail-drawer">
        <div class="issue-info-block ${isError ? 'problem' : ''}">
          <div class="issue-info-title">${problemLabel}</div>
          <div>${problemText}</div>
        </div>
        <div class="issue-info-block solution">
          <div class="issue-info-title">${solutionLabel}</div>
          <div>${solutionText}</div>
        </div>
        ${isOriginal && isError ? `
          <button type="button" class="btn btn-primary btn-mini btn-quick-fix" onclick="event.stopPropagation(); window.meshApp?.runAutoRepair();">
            ${fixBtnText}
          </button>
        ` : ''}
      </div>
    `;

    // Click handler to expand/collapse
    if (!el.dataset.bound) {
      el.dataset.bound = 'true';
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-quick-fix')) return;
        el.classList.toggle('expanded');
      });
    }
  }

  updateUnitScaleRow(unitScale, isOriginal = true) {
    const el = document.getElementById('issueUnitScale');
    if (!el) return;

    const isExpanded = el.classList.contains('expanded');
    const isAnomaly = unitScale && unitScale.isAnomaly;
    el.className = `issue-item ${isAnomaly ? 'warning' : 'success'} ${isExpanded ? 'expanded' : ''}`;

    const label = I18n.t('issueUnitScale');
    const badgeText = isAnomaly ? I18n.t(unitScale.labelKey) : I18n.t('unitNormal');
    const problemLabel = I18n.t('problemLabel');
    const solutionLabel = I18n.t('solutionLabel');
    const problemText = I18n.t('issueUnitScaleDescProblem');
    const solutionText = I18n.t('issueUnitScaleDescSolution');
    const quickFixText = I18n.t('btnQuickScaleInch');

    el.innerHTML = `
      <div class="issue-header">
        <span class="issue-name">
          ${isAnomaly 
            ? '<svg width="14" height="14" viewBox="0 0 20 20" fill="#f59e0b"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
            : '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
          }
          ${label}
        </span>
        <div class="issue-count-wrapper">
          <span class="issue-count" style="${isAnomaly ? 'color: #f59e0b;' : 'color: var(--status-success);'}">${badgeText}</span>
          <svg class="issue-chevron" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
      <div class="issue-detail-drawer">
        <div class="issue-info-block ${isAnomaly ? 'problem' : ''}">
          <div class="issue-info-title">${problemLabel}</div>
          <div>${problemText}</div>
        </div>
        <div class="issue-info-block solution">
          <div class="issue-info-title">${solutionLabel}</div>
          <div>${solutionText}</div>
        </div>
        ${isAnomaly ? `
          <button type="button" class="btn btn-primary btn-mini btn-quick-fix" onclick="event.stopPropagation(); window.meshApp?.applyScale(${unitScale.suggestedFactor}, 'autoUnit');">
            ${quickFixText}
          </button>
        ` : ''}
      </div>
    `;

    // Click handler to expand/collapse
    if (!el.dataset.bound) {
      el.dataset.bound = 'true';
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-quick-fix')) return;
        el.classList.toggle('expanded');
      });
    }
  }

  updateOverhangRow(overhangs, isOriginal = true) {
    const el = document.getElementById('issueOverhangs');
    if (!el) return;

    const isExpanded = el.classList.contains('expanded');
    const hasOverhangs = overhangs && overhangs.overhangAreaPercent > 0;
    el.className = `issue-item ${hasOverhangs ? 'warning' : 'success'} ${isExpanded ? 'expanded' : ''}`;

    const label = I18n.t('issueOverhangs');
    const badgeText = hasOverhangs 
      ? I18n.t('overhangBadge', { percent: overhangs.overhangAreaPercent, volume: overhangs.supportVolumeCm3 })
      : I18n.t('overhangNone');
    const problemLabel = I18n.t('problemLabel');
    const solutionLabel = I18n.t('solutionLabel');
    const problemText = I18n.t('issueOverhangsDescProblem', { 
      angle: overhangs?.thresholdDeg || 45, 
      volume: overhangs?.supportVolumeCm3 || 0 
    });
    const solutionText = I18n.t('issueOverhangsDescSolution');
    const quickFixText = I18n.t('btnShowOverhangsIn3D');

    el.innerHTML = `
      <div class="issue-header">
        <span class="issue-name">
          ${hasOverhangs 
            ? '<svg width="14" height="14" viewBox="0 0 20 20" fill="#f59e0b"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
            : '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
          }
          ${label}
        </span>
        <div class="issue-count-wrapper">
          <span class="issue-count" style="${hasOverhangs ? 'color: #f59e0b;' : 'color: var(--status-success);'}">${badgeText}</span>
          <svg class="issue-chevron" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
      </div>
      <div class="issue-detail-drawer">
        <div class="issue-info-block ${hasOverhangs ? 'problem' : ''}">
          <div class="issue-info-title">${problemLabel}</div>
          <div>${problemText}</div>
        </div>
        <div class="issue-info-block solution">
          <div class="issue-info-title">${solutionLabel}</div>
          <div>${solutionText}</div>
        </div>
        ${hasOverhangs ? `
          <button type="button" class="btn btn-secondary btn-mini btn-quick-fix" onclick="event.stopPropagation(); window.meshApp?.openOverhangDrawer(); window.meshApp?.toggleOverhangView(true);">
            ${quickFixText}
          </button>
        ` : ''}
      </div>
    `;

    // Click handler to expand/collapse
    if (!el.dataset.bound) {
      el.dataset.bound = 'true';
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-quick-fix')) return;
        el.classList.toggle('expanded');
      });
    }
  }

  updateOverhangMetricsUI(overhangs) {
    const badge = document.getElementById('currentOverhangBadge');
    const area = document.getElementById('overhangAreaMetric');
    const vol = document.getElementById('supportVolumeMetric');

    if (!overhangs) {
      if (badge) badge.textContent = '0%';
      if (area) area.textContent = '0 mm² (0%)';
      if (vol) vol.textContent = '0.0 cm³';
      return;
    }

    if (badge) badge.textContent = `${overhangs.overhangAreaPercent}%`;
    if (area) area.textContent = `${overhangs.overhangAreaMm2.toLocaleString()} mm² (${overhangs.overhangAreaPercent}%)`;
    if (vol) vol.textContent = `${overhangs.supportVolumeCm3.toLocaleString()} cm³`;
  }

  recalculateOverhangs(angleDeg = 45) {
    const geom = (this.currentMode === 'repaired' && this.repairedGeometry)
      ? this.repairedGeometry
      : this.originalGeometry;
    if (!geom) return;

    const totalArea = this.activeAnalysis ? this.activeAnalysis.surfaceAreaMm2 : 0;
    const overhangs = MeshAnalyzer.analyzeOverhangs(geom, { thresholdAngleDeg: angleDeg, overhangAngleDeg: angleDeg }, totalArea);

    if (this.activeAnalysis) {
      this.activeAnalysis.overhangs = overhangs;
    }

    if (this.viewer && overhangs.overhangTrianglesBuffer) {
      this.viewer.setOverhangHighlights(overhangs.overhangTrianglesBuffer, overhangs.overhangColorsBuffer);
    }

    // Update HUD and drawer limit labels
    const hudThreshold = document.getElementById('overhangHudThreshold');
    if (hudThreshold) hudThreshold.textContent = `Limit: ${angleDeg}°`;
    const legendThreshold = document.getElementById('overhangLegendThreshold');
    if (legendThreshold) legendThreshold.textContent = `Limit: ${angleDeg}°`;

    this.updateOverhangMetricsUI(overhangs);
    this.updateOverhangRow(overhangs, this.currentMode === 'original');
    this.updateMaterialMetrics();
  }

  toggleOverhangView(forceState) {
    const active = this.viewer.toggleOverhangs(forceState);
    const toggleOverhangViewportBtn = document.getElementById('toggleOverhangs');
    const toggleOverhangDrawerBtn = document.getElementById('btnToggleOverhangOverlay');
    const overhangHud = document.getElementById('viewerOverhangHud');
    if (toggleOverhangViewportBtn) toggleOverhangViewportBtn.classList.toggle('active', active);
    if (toggleOverhangDrawerBtn) toggleOverhangDrawerBtn.classList.toggle('active', active);
    if (overhangHud) overhangHud.style.display = active ? 'flex' : 'none';
  }

  switchSidebarTab(tabName) {
    const isRepair = tabName === 'repair';
    const tabBtnRepair = document.getElementById('tabBtnRepair');
    const tabBtnGeometry = document.getElementById('tabBtnGeometry');
    const tabPaneRepair = document.getElementById('tabPaneRepair');
    const tabPaneGeometry = document.getElementById('tabPaneGeometry');

    tabBtnRepair?.classList.toggle('active', isRepair);
    tabBtnRepair?.setAttribute('aria-selected', isRepair ? 'true' : 'false');
    tabBtnGeometry?.classList.toggle('active', !isRepair);
    tabBtnGeometry?.setAttribute('aria-selected', !isRepair ? 'true' : 'false');

    if (tabPaneRepair) {
      tabPaneRepair.classList.toggle('active', isRepair);
      tabPaneRepair.style.display = isRepair ? 'block' : 'none';
    }
    if (tabPaneGeometry) {
      tabPaneGeometry.classList.toggle('active', !isRepair);
      tabPaneGeometry.style.display = !isRepair ? 'block' : 'none';
    }
  }

  openOverhangDrawer() {
    this.switchSidebarTab('geometry');
    const toggleOverhangDrawer = document.getElementById('toggleOverhangDrawer');
    const overhangDrawerContent = document.getElementById('overhangDrawerContent');
    if (overhangDrawerContent && overhangDrawerContent.style.display !== 'flex') {
      overhangDrawerContent.style.display = 'flex';
      toggleOverhangDrawer?.classList.add('expanded');
      toggleOverhangDrawer?.setAttribute('aria-expanded', 'true');
    }
  }

  openScaleDrawer() {
    this.switchSidebarTab('geometry');
    const toggleScaleDrawer = document.getElementById('toggleScaleDrawer');
    const scaleDrawerContent = document.getElementById('scaleDrawerContent');
    if (scaleDrawerContent && scaleDrawerContent.style.display !== 'flex') {
      scaleDrawerContent.style.display = 'flex';
      toggleScaleDrawer?.classList.add('expanded');
      toggleScaleDrawer?.setAttribute('aria-expanded', 'true');
    }
  }

  updateMaterialMetrics() {
    if (!this.activeAnalysis) return;
    const material = document.getElementById('materialSelect').value;
    const infill = parseInt(document.getElementById('infillSlider').value, 10);
    const result = MeshAnalyzer.calculateMaterial(this.activeAnalysis.volumeCm3, material, infill);

    document.getElementById('metricWeight').textContent = `${result.estimatedWeightGrams} g`;
    document.getElementById('metricFilament').textContent = `${result.filamentLengthMeters} m`;

    if (this.activeAnalysis.overhangs && this.activeAnalysis.overhangs.supportVolumeCm3 > 0) {
      const densities = { PLA: 1.24, PETG: 1.27, ABS: 1.04, TPU: 1.21, RESIN: 1.15 };
      const density = densities[material] || 1.24;
      const supportWeight = Math.round(this.activeAnalysis.overhangs.supportVolumeCm3 * density * 10) / 10;
      const volEl = document.getElementById('supportVolumeMetric');
      if (volEl) {
        volEl.textContent = `${this.activeAnalysis.overhangs.supportVolumeCm3.toLocaleString()} cm³ (~${supportWeight} g)`;
      }
    }
  }

  /**
   * Cancel ongoing repair immediately
   */
  cancelAutoRepair() {
    if (this.repairAbortController) {
      this.repairAbortController.abort('UserCancelled');
      this.repairAbortController = null;
    }
  }

  /**
   * Run automated mesh repair pipeline with animated feedback HUD, watchdog timeout, and cancellation
   */
  async runAutoRepair() {
    if (!this.originalGeometry) return;

    // Reset previous timeout notice box
    const timeoutBox = document.getElementById('timeoutNoticeBox');
    if (timeoutBox) timeoutBox.style.display = 'none';

    const btn = document.getElementById('btnAutoRepair');
    const btnCancel = document.getElementById('btnCancelAutoRepair');
    const overlay = document.getElementById('repairScanOverlay');
    const stepText = document.getElementById('scanStepText');
    const progressBar = document.getElementById('scanProgressBar');
    const percentText = document.getElementById('scanPercentText');
    const scanWatchdogSec = document.getElementById('scanWatchdogSec');
    const btnSpan = btn ? btn.querySelector('span') : null;

    // Calculate dynamic timeout based on geometry complexity
    const posAttr = this.originalGeometry.getAttribute('position');
    const triCount = posAttr ? Math.round(posAttr.count / 3) : 0;
    const timeoutSec = triCount > 1000000 ? 180 : (triCount > 100000 ? 120 : 60);
    const timeoutMs = timeoutSec * 1000;

    if (scanWatchdogSec) scanWatchdogSec.textContent = timeoutSec;

    // Create AbortController
    this.repairAbortController = new AbortController();
    const signal = this.repairAbortController.signal;

    // Set UI into active repair state
    const mobileBtn = document.getElementById('mobileBtnAutoRepair');
    const mobileSpan = document.getElementById('mobileBtnRepairText');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('running');
      if (btnSpan) btnSpan.textContent = I18n.t('repairBtnRunning');
    }
    if (mobileBtn) {
      mobileBtn.disabled = true;
      mobileBtn.classList.add('running');
      if (mobileSpan) mobileSpan.textContent = I18n.t('repairBtnRunning');
    }
    if (btnCancel) {
      btnCancel.style.display = 'inline-flex';
    }

    if (overlay) {
      overlay.classList.add('active');
    }

    try {
      if (stepText) stepText.textContent = I18n.t('repairStep1');
      if (progressBar) progressBar.style.width = '10%';
      if (percentText) percentText.textContent = '10%';

      const closeHoles = document.getElementById('optCloseHoles')?.checked ?? true;
      const fixNormals = document.getElementById('optFixNormals')?.checked ?? true;
      const weldTolerance = document.getElementById('optWeldVerts')?.checked ? 1e-4 : 0;

      const sourceGeom = this.repairedGeometry || this.originalGeometry;

      const onProgress = (stepKey, percent) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}%`;
        if (stepKey.includes('weld') && stepText) stepText.textContent = I18n.t('repairStep1');
        else if (stepKey.includes('holes') && stepText) stepText.textContent = I18n.t('repairStep2');
        else if (stepKey.includes('normals') && stepText) stepText.textContent = I18n.t('repairStep3');
        else if (stepKey.includes('finalize') && stepText) stepText.textContent = I18n.t('repairStep5');
      };

      const repaired = await MeshRepairer.autoRepairAsync(sourceGeom, { closeHoles, fixNormals, weldTolerance, timeoutMs }, onProgress, signal);

      if (progressBar) progressBar.style.width = '100%';
      if (percentText) percentText.textContent = '100%';
      if (stepText) stepText.textContent = I18n.t('repairBtnDone');

      this.repairedGeometry = repaired;
      this.baseFullDetailGeometry = repaired.clone();
      this.hasAutoRepaired = true;
      this.updateDecimateSliderLabel?.();

      // Update 3D Viewport
      this.viewer.setRepairedGeometry(this.repairedGeometry);
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
        b.disabled = false;
        b.classList.toggle('active', b.dataset.mode === 'repaired');
      });

      // Analyze repaired mesh
      this.runAnalysis(this.repairedGeometry, false);

      if (btn) {
        btn.classList.remove('running');
        btn.classList.add('done');
        if (btnSpan) btnSpan.textContent = I18n.t('repairBtnDone');
        setTimeout(() => {
          btn.classList.remove('done');
          btn.disabled = false;
          if (btnSpan) btnSpan.textContent = I18n.t('btnAutoRepair');
        }, 2200);
      }
      if (mobileBtn) {
        mobileBtn.classList.remove('running');
        mobileBtn.classList.add('done');
        if (mobileSpan) mobileSpan.textContent = I18n.t('repairBtnDone');
        setTimeout(() => {
          mobileBtn.classList.remove('done');
          mobileBtn.disabled = false;
          if (mobileSpan) mobileSpan.textContent = I18n.t('btnAutoRepair');
        }, 2200);
      }

      this.showToast(I18n.t('toastRepairSuccess'), 'success');
    } catch (err) {
      console.warn('Repair interrupted:', err);
      const isTimeout = err.name === 'TimeoutError' || String(err.message).startsWith('TIMEOUT');
      const isCancelled = err.name === 'AbortError' || err.message === 'USER_CANCELLED';

      if (isTimeout || isCancelled) {
        if (timeoutBox) {
          timeoutBox.style.display = 'block';
          const titleEl = document.getElementById('timeoutNoticeTitle');
          const descEl = document.getElementById('timeoutNoticeDesc');
          if (isCancelled) {
            if (titleEl) titleEl.textContent = '🛑 ' + I18n.t('toastRepairCancelled');
            if (descEl) descEl.textContent = I18n.t('timeoutAlertDesc');
          } else {
            if (titleEl) titleEl.textContent = I18n.t('timeoutAlertTitle');
            if (descEl) descEl.textContent = `${I18n.t('timeoutAlertDesc')} (${timeoutSec}s)`;
          }
        }

        this.showToast(isCancelled ? I18n.t('toastRepairCancelled') : I18n.t('toastRepairTimeout'), isCancelled ? 'info' : 'warning');
      } else {
        this.showToast(I18n.t('toastRepairFail', { error: err.message }), 'error');
      }

      // Revert to original view in viewer
      if (this.originalGeometry) {
        this.viewer.setOriginalGeometry(this.originalGeometry);
      }

      if (btn) {
        btn.classList.remove('running', 'done');
        btn.disabled = false;
        if (btnSpan) btnSpan.textContent = I18n.t('btnAutoRepair');
      }
      if (mobileBtn) {
        mobileBtn.classList.remove('running', 'done');
        mobileBtn.disabled = false;
        if (mobileSpan) mobileSpan.textContent = I18n.t('btnAutoRepair');
      }
    } finally {
      this.repairAbortController = null;
      if (btnCancel) btnCancel.style.display = 'none';
      if (overlay) {
        setTimeout(() => overlay.classList.remove('active'), 250);
      }
    }
  }

  /**
   * Drop active model flat onto build plate (lowest point Y=0)
   */
  runDropToBed() {
    const targetGeom = this.repairedGeometry || this.originalGeometry;
    if (!targetGeom) return;

    const aligned = MeshRepairer.dropToBed(targetGeom);
    if (this.baseFullDetailGeometry) {
      this.baseFullDetailGeometry = MeshRepairer.dropToBed(this.baseFullDetailGeometry);
    }
    if (this.originalGeometry) {
      this.originalGeometry = MeshRepairer.dropToBed(this.originalGeometry);
    }
    if (this.repairedGeometry) {
      this.repairedGeometry = aligned;
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.viewer.setOriginalGeometry(this.originalGeometry);
    }

    this.runAnalysis(aligned, !this.repairedGeometry);
    this.showToast(I18n.t('toastDroppedBed'), 'success');
  }

  /**
   * Center active model horizontally on build plate (X=0, Z=0)
   */
  runCenterOnBed() {
    const targetGeom = this.repairedGeometry || this.originalGeometry;
    if (!targetGeom) return;

    const aligned = MeshRepairer.centerOnBed(targetGeom);
    if (this.baseFullDetailGeometry) {
      this.baseFullDetailGeometry = MeshRepairer.centerOnBed(this.baseFullDetailGeometry);
    }
    if (this.originalGeometry) {
      this.originalGeometry = MeshRepairer.centerOnBed(this.originalGeometry);
    }
    if (this.repairedGeometry) {
      this.repairedGeometry = aligned;
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.viewer.setOriginalGeometry(this.originalGeometry);
    }

    this.runAnalysis(aligned, !this.repairedGeometry);
    this.showToast(I18n.t('toastCenteredBed'), 'success');
  }

  /**
   * Rotate model 90 degrees around selected axis and drop to bed
   */
  runRotate(axis) {
    const targetGeom = this.repairedGeometry || this.originalGeometry;
    if (!targetGeom) return;

    const rotated = MeshRepairer.rotateGeometry(targetGeom, axis);
    if (this.baseFullDetailGeometry) {
      this.baseFullDetailGeometry = MeshRepairer.rotateGeometry(this.baseFullDetailGeometry, axis);
    }
    if (this.originalGeometry) {
      this.originalGeometry = MeshRepairer.rotateGeometry(this.originalGeometry, axis);
    }
    if (this.repairedGeometry) {
      this.repairedGeometry = rotated;
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.viewer.setOriginalGeometry(this.originalGeometry);
    }

    this.runAnalysis(rotated, !this.repairedGeometry);
    this.showToast(I18n.t('toastRotated', { axis: axis.toUpperCase() }), 'success');
  }

  /**
   * Scale model by factor (e.g. 25.4 for Inch to mm or 1/25.4 for mm to Inch)
   * @param {number} factor
   * @param {string} mode
   */
  applyScale(factor, mode = 'inchToMm') {
    const targetGeom = this.repairedGeometry || this.originalGeometry;
    if (!targetGeom) return;

    this.currentScaleFactor = (this.currentScaleFactor || 1.0) * factor;

    if (this.baseFullDetailGeometry) {
      this.baseFullDetailGeometry = MeshRepairer.scaleGeometry(this.baseFullDetailGeometry, factor);
    }
    if (this.originalGeometry) {
      this.originalGeometry = MeshRepairer.scaleGeometry(this.originalGeometry, factor);
    }
    if (this.repairedGeometry) {
      this.repairedGeometry = MeshRepairer.scaleGeometry(this.repairedGeometry, factor);
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.viewer.setOriginalGeometry(this.originalGeometry);
    }

    const activeMesh = this.repairedGeometry ? this.viewer.repairedMesh : this.viewer.originalMesh;
    if (activeMesh && this.viewer.fitCameraToMesh) {
      this.viewer.fitCameraToMesh(activeMesh);
    }

    const currentGeom = this.repairedGeometry || this.originalGeometry;
    this.runAnalysis(currentGeom, !this.repairedGeometry);
    this.updateScaleUI();

    const toastMsg = factor > 1 ? I18n.t('toastScaledInchToMm') : I18n.t('toastScaledMmToInch');
    this.showToast(toastMsg, 'success');
  }

  /**
   * Reset model to 100% original unscaled geometry
   */
  resetScale() {
    if (!this.rawLoadedGeometry) return;
    this.currentScaleFactor = 1.0;

    this.originalGeometry = MeshRepairer.alignToBed(this.rawLoadedGeometry.clone());
    this.baseFullDetailGeometry = this.originalGeometry.clone();
    this.repairedGeometry = null;
    this.hasAutoRepaired = false;

    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
    document.querySelector('.mode-btn[data-mode="original"]')?.classList.add('active');

    this.viewer.setOriginalGeometry(this.originalGeometry);
    if (this.viewer.originalMesh && this.viewer.fitCameraToMesh) {
      this.viewer.fitCameraToMesh(this.viewer.originalMesh);
    }

    this.runAnalysis(this.originalGeometry, true);
    this.updateScaleUI();
    this.showToast(I18n.t('toastScaleReset'), 'info');
  }

  updateScaleUI() {
    const factor = this.currentScaleFactor || 1.0;
    const badge = document.getElementById('currentScaleBadge');
    if (badge) {
      badge.textContent = `${factor.toFixed(2)}×`;
      if (Math.abs(factor - 1.0) > 0.001) {
        badge.style.color = 'var(--accent-cyan)';
        badge.style.borderColor = 'var(--accent-cyan)';
      } else {
        badge.style.color = 'var(--text-muted)';
        badge.style.borderColor = 'var(--border-subtle)';
      }
    }
    const btnResetScale = document.getElementById('btnResetScale');
    if (btnResetScale) {
      btnResetScale.disabled = Math.abs(factor - 1.0) <= 0.001;
    }
  }

  /**
   * Run mesh decimation / polygon reduction
   */
  async runDecimation() {
    const sourceGeom = this.baseFullDetailGeometry || this.originalGeometry;
    if (!sourceGeom) return;

    const btn = document.getElementById('btnDecimate');
    const rawVal = parseFloat(document.getElementById('decimateRatio').value);
    const ratio = rawVal > 1 ? rawVal / 100 : rawVal;
    
    if (btn) {
      btn.disabled = true;
      btn.textContent = I18n.currentLang === 'de' ? 'Reduziere Polygone...' : 'Reducing Polygons...';
    }

    this.showToast(I18n.t('toastDecimating', { ratio: Math.round(ratio * 100) }), 'info');

    // Allow UI to render toast & spinner
    await new Promise((r) => setTimeout(r, 60));

    try {
      const decimated = MeshRepairer.decimate(sourceGeom, ratio);
      this.repairedGeometry = decimated;

      // Update 3D Viewport
      this.viewer.setRepairedGeometry(this.repairedGeometry);
      
      // Update UI mode switch
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
        b.disabled = false;
        b.classList.remove('active');
      });
      document.querySelectorAll('.mode-btn[data-mode="repaired"], .mode-quick-btn[data-mode="repaired"]').forEach((b) => b.classList.add('active'));
      const btnResetDecimate = document.getElementById('btnResetDecimate');
      if (btnResetDecimate) btnResetDecimate.disabled = false;

      // Re-run diagnostics to update triangle and vertex metrics immediately
      this.runAnalysis(this.repairedGeometry, false);

      this.showToast(I18n.t('toastDecimateSuccess'), 'success');
    } catch (err) {
      console.error('Decimation error:', err);
      this.showToast(I18n.t('toastDecimateFail', { error: err.message }), 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = I18n.t('btnDecimate');
      }
    }
  }

  /**
   * Reset decimation back to the un-decimated base geometry and reset slider to default 50%
   */
  resetDecimation() {
    const slider = document.getElementById('decimateRatio');
    const input = document.getElementById('decimateInput');
    if (slider) {
      slider.value = '50';
      slider.dispatchEvent(new Event('input'));
    }
    if (input) {
      input.value = '50';
    }
    if (typeof this.updateDecimateSliderLabel === 'function') {
      this.updateDecimateSliderLabel();
    }
    const btnResetDecimate = document.getElementById('btnResetDecimate');
    if (btnResetDecimate) btnResetDecimate.disabled = true;

    const base = this.baseFullDetailGeometry || this.originalGeometry;
    if (!base) return;

    if (this.hasAutoRepaired) {
      this.repairedGeometry = base.clone();
      this.viewer.setRepairedGeometry(this.repairedGeometry, false);
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.mode-btn[data-mode="repaired"], .mode-quick-btn[data-mode="repaired"]').forEach((b) => b.classList.add('active'));
      this.runAnalysis(this.repairedGeometry, false);
    } else {
      this.repairedGeometry = null;
      if (this.viewer.repairedMesh) {
        this.viewer.scene.remove(this.viewer.repairedMesh);
        this.viewer.repairedMesh.geometry.dispose();
        this.viewer.repairedMesh = null;
      }
      this.viewer.switchViewMode('original');
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
        b.classList.remove('active');
        if (b.dataset.mode !== 'original') {
          b.disabled = true;
        } else {
          b.disabled = false;
          b.classList.add('active');
        }
      });
      this.runAnalysis(this.originalGeometry, true);
    }

    this.showToast(I18n.t('toastDecimateReset'), 'info');
  }

  /**
   * Run volume-preserving surface smoothing (Taubin) with structure feasibility check
   * Always computes non-destructively from base un-smoothed geometry so levels can be changed freely anytime.
   */
  async runSmoothing() {
    const sourceGeom = this.baseFullDetailGeometry || this.originalGeometry;
    if (!sourceGeom) return;

    const alertEl = document.getElementById('smoothFeasibilityAlert');
    const alertText = document.getElementById('smoothFeasibilityText');
    const btn = document.getElementById('btnSmoothMesh');

    // Structural feasibility pre-check (smoothing bad non-manifold meshes leads to collapse)
    const currentAnalysis = this.activeAnalysis || MeshAnalyzer.analyze(sourceGeom);
    const hasCriticalIssues = (currentAnalysis.nonManifoldEdgesCount > 0 || currentAnalysis.boundaryEdgesCount > 0);

    if (hasCriticalIssues && !this.hasAutoRepaired) {
      if (alertEl) {
        alertEl.style.display = 'block';
        if (alertText) {
          alertText.textContent = I18n.t('smoothFeasibilityWarning');
        }
      }
    } else {
      if (alertEl) alertEl.style.display = 'none';
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = I18n.currentLang === 'de' ? 'Glätte Geometrie...' : 'Smoothing Mesh...';
    }

    this.showToast(I18n.t('toastSmoothing'), 'info');
    await new Promise((r) => setTimeout(r, 60));

    try {
      const intensityVal = parseInt(document.getElementById('smoothIntensity').value, 10);
      const iterations = intensityVal === 1 ? 4 : intensityVal === 2 ? 8 : 14;
      const preserveSharpEdges = intensityVal <= 2;

      const smoothed = MeshRepairer.smoothMesh(sourceGeom, {
        iterations,
        preserveSharpEdges,
        angleThresholdDeg: 35,
        subdivide: intensityVal >= 2
      });

      this.repairedGeometry = smoothed;

      // Update Viewport & UI with smooth shading
      this.viewer.setRepairedGeometry(this.repairedGeometry, true);
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
        b.disabled = false;
        b.classList.remove('active');
      });
      document.querySelectorAll('.mode-btn[data-mode="repaired"], .mode-quick-btn[data-mode="repaired"]').forEach((b) => b.classList.add('active'));
      const btnResetSmooth = document.getElementById('btnResetSmooth');
      if (btnResetSmooth) btnResetSmooth.disabled = false;

      // Re-run diagnostics
      this.runAnalysis(this.repairedGeometry, false);

      this.showToast(I18n.t('toastSmoothSuccess'), 'success');
    } catch (err) {
      console.error('Smoothing error:', err);
      this.showToast(I18n.t('toastRepairFail', { error: err.message }), 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = I18n.t('btnSmoothMesh');
      }
    }
  }

  /**
   * Reset smoothing back to the un-smoothed base geometry and reset intensity slider to default (Medium)
   */
  resetSmoothing() {
    const smoothSlider = document.getElementById('smoothIntensity');
    if (smoothSlider) {
      smoothSlider.value = '2';
      smoothSlider.dispatchEvent(new Event('input'));
    }
    const smoothVal = document.getElementById('smoothIntensityValue');
    if (smoothVal) smoothVal.textContent = I18n.t('levelMedium');
    const btnResetSmooth = document.getElementById('btnResetSmooth');
    if (btnResetSmooth) btnResetSmooth.disabled = true;

    const base = this.baseFullDetailGeometry || this.originalGeometry;
    if (!base) return;

    if (this.hasAutoRepaired) {
      this.repairedGeometry = base.clone();
      this.viewer.setRepairedGeometry(this.repairedGeometry, false);
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.mode-btn[data-mode="repaired"], .mode-quick-btn[data-mode="repaired"]').forEach((b) => b.classList.add('active'));
      this.runAnalysis(this.repairedGeometry, false);
    } else {
      this.repairedGeometry = null;
      if (this.viewer.repairedMesh) {
        this.viewer.scene.remove(this.viewer.repairedMesh);
        this.viewer.repairedMesh.geometry.dispose();
        this.viewer.repairedMesh = null;
      }
      this.viewer.switchViewMode('original');
      document.querySelectorAll('.mode-btn, .mode-quick-btn').forEach((b) => {
        b.classList.remove('active');
        if (b.dataset.mode !== 'original') {
          b.disabled = true;
        } else {
          b.disabled = false;
          b.classList.add('active');
        }
      });
      this.runAnalysis(this.originalGeometry, true);
    }

    this.showToast(I18n.t('toastSmoothReset'), 'info');
  }

  /**
   * Export active geometry to file format
   */
  async exportModel(format) {
    const targetGeom = this.repairedGeometry || this.originalGeometry;
    if (!targetGeom) {
      this.showToast(I18n.t('toastNoModelExport'), 'error');
      return;
    }

    const baseName = `${this.currentFileRawName}_repaired`;

    switch (format) {
      case 'stl-binary': {
        const buffer = MeshExporter.toBinarySTL(targetGeom);
        MeshExporter.downloadFile(buffer, `${baseName}.stl`, 'application/octet-stream');
        this.showToast(I18n.t('toastDownloadedBinary'), 'success');
        break;
      }
      case 'stl-ascii': {
        const text = MeshExporter.toAsciiSTL(targetGeom, baseName);
        MeshExporter.downloadFile(text, `${baseName}_ascii.stl`, 'text/plain');
        this.showToast(I18n.t('toastDownloadedAscii'), 'success');
        break;
      }
      case '3mf': {
        const blob = await MeshExporter.to3MF(targetGeom);
        MeshExporter.downloadFile(blob, `${baseName}.3mf`, 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
        this.showToast(I18n.t('toastDownloaded3MF'), 'success');
        break;
      }
      case 'obj': {
        const text = MeshExporter.toOBJ(targetGeom);
        MeshExporter.downloadFile(text, `${baseName}.obj`, 'text/plain');
        this.showToast(I18n.t('toastDownloadedOBJ'), 'success');
        break;
      }
    }
  }

  /**
   * Direct OBJ parser for client-side zero-upload with robust vertex/face handling
   */
  parseOBJText(text) {
    const lines = text.split(/\r?\n/);
    const positions = [];
    const faces = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('v ')) {
        const parts = line.split(/\s+/).slice(1);
        if (parts.length >= 3) {
          positions.push(parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0);
        }
      } else if (line.startsWith('f ')) {
        const parts = line.split(/\s+/).slice(1).filter(Boolean);
        const vIndices = parts.map((p) => {
          const v = parseInt(p.split('/')[0], 10);
          return v > 0 ? v - 1 : Math.floor(positions.length / 3) + v;
        });

        // Fan triangulation for quads / n-gons
        for (let j = 1; j < vIndices.length - 1; j++) {
          if (!isNaN(vIndices[0]) && !isNaN(vIndices[j]) && !isNaN(vIndices[j + 1])) {
            faces.push(vIndices[0], vIndices[j], vIndices[j + 1]);
          }
        }
      }
    }

    if (positions.length === 0) {
      throw new Error('OBJ model contained no vertices.');
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (faces.length > 0) geom.setIndex(faces);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Direct 3MF parser using JSZip and XML parsing with full namespace and multi-mesh support
   */
  async parse3MFBuffer(buffer) {
    if (!window.JSZip) {
      throw new Error('JSZip required for 3MF files.');
    }

    const zip = await window.JSZip.loadAsync(buffer);
    const modelFiles = Object.keys(zip.files).filter((k) => k.toLowerCase().endsWith('.model'));
    if (modelFiles.length === 0) {
      throw new Error('No .model geometry found in 3MF file.');
    }

    const positions = [];
    const indices = [];
    const parser = new DOMParser();

    for (const mf of modelFiles) {
      const xmlText = await zip.file(mf).async('text');
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

      // Query elements with standard and wildcard namespace selectors
      const getElements = (parent, tag) => {
        let list = parent.getElementsByTagName(tag);
        if (!list || list.length === 0) {
          list = parent.getElementsByTagNameNS('*', tag);
        }
        return list;
      };

      const meshes = getElements(xmlDoc, 'mesh');
      const meshList = meshes && meshes.length > 0 ? Array.from(meshes) : [xmlDoc];

      for (const mesh of meshList) {
        const vertices = getElements(mesh, 'vertex');
        const triangles = getElements(mesh, 'triangle');
        const vertexOffset = positions.length / 3;

        for (let i = 0; i < vertices.length; i++) {
          positions.push(
            parseFloat(vertices[i].getAttribute('x') || '0'),
            parseFloat(vertices[i].getAttribute('y') || '0'),
            parseFloat(vertices[i].getAttribute('z') || '0')
          );
        }

        for (let i = 0; i < triangles.length; i++) {
          const v1 = parseInt(triangles[i].getAttribute('v1') || '0', 10);
          const v2 = parseInt(triangles[i].getAttribute('v2') || '0', 10);
          const v3 = parseInt(triangles[i].getAttribute('v3') || '0', 10);
          indices.push(vertexOffset + v1, vertexOffset + v2, vertexOffset + v3);
        }
      }
    }

    if (positions.length === 0) {
      throw new Error('3MF model contained no vertices.');
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (indices.length > 0) geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Load built-in sample models
   */
  loadSampleModel(type) {
    let geom;
    if (type === 'brokenCube') {
      const box = new THREE.BoxGeometry(40, 40, 40);
      const indices = Array.from(box.index.array);
      const brokenIndices = indices.slice(0, indices.length - 6);
      geom = box.clone();
      geom.setIndex(brokenIndices);
      this.currentFileName = 'sample_broken_box_with_hole.stl';
      this.currentFileRawName = 'sample_broken_box';
    } else if (type === 'torus') {
      geom = new THREE.TorusGeometry(25, 10, 24, 48);
      this.currentFileName = 'sample_watertight_torus.stl';
      this.currentFileRawName = 'sample_torus';
    } else if (type === 'cylinder') {
      geom = new THREE.CylinderGeometry(20, 20, 40, 24, 1, true);
      this.currentFileName = 'sample_open_cylinder.stl';
      this.currentFileRawName = 'sample_cylinder';
    }

    geom.computeVertexNormals();
    this.setOriginalModel(geom, 24500);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  showProgress(visible) {
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.display = visible ? 'block' : 'none';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Bootstrap on DOM ready or immediately if already loaded
function initApp() {
  if (!window.meshApp) {
    window.meshApp = new App();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
