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
    this.repairedGeometry = null;
    this.activeAnalysis = null;
    this.currentFileSize = 0;

    this.init();
  }

  init() {
    // Initialize 3D Viewport
    const canvasContainer = document.getElementById('viewportWrapper');
    this.viewer = new Viewport3D(canvasContainer);

    this.bindEvents();
    this.loadSampleModel('brokenCube');
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

    // View Mode Switcher
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        const mode = targetBtn.dataset.mode;
        this.viewer.switchViewMode(mode);

        // Update Diagnostics panel to reflect currently active view mode
        if (mode === 'original' && this.originalGeometry) {
          this.runAnalysis(this.originalGeometry, true);
        } else if (mode === 'repaired' && this.repairedGeometry) {
          this.runAnalysis(this.repairedGeometry, false);
        }
      });
    });

    // Viewport Utility Toggles
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

    document.getElementById('btnResetCamera')?.addEventListener('click', () => {
      this.viewer.setCameraPreset('iso');
    });

    // Action Buttons
    document.getElementById('btnAutoRepair')?.addEventListener('click', () => this.runAutoRepair());
    document.getElementById('btnDropToBed')?.addEventListener('click', () => this.runDropToBed());
    document.getElementById('btnCenterBed')?.addEventListener('click', () => this.runCenterOnBed());
    document.getElementById('btnRotateX')?.addEventListener('click', () => this.runRotate('x'));
    document.getElementById('btnRotateY')?.addEventListener('click', () => this.runRotate('y'));
    document.getElementById('btnRotateZ')?.addEventListener('click', () => this.runRotate('z'));
    document.getElementById('btnDecimate')?.addEventListener('click', () => this.runDecimation());

    // Decimation Slider
    const decimateSlider = document.getElementById('decimateRatio');
    const decimateVal = document.getElementById('decimateValue');
    decimateSlider?.addEventListener('input', (e) => {
      decimateVal.textContent = `${Math.round(e.target.value * 100)}%`;
    });

    // Material & Infill calculation triggers
    document.getElementById('materialSelect')?.addEventListener('change', () => this.updateMaterialMetrics());
    document.getElementById('infillSlider')?.addEventListener('input', (e) => {
      document.getElementById('infillValue').textContent = `${e.target.value}%`;
      this.updateMaterialMetrics();
    });

    // Export Buttons
    document.getElementById('btnExportBinarySTL')?.addEventListener('click', () => this.exportModel('stl-binary'));
    document.getElementById('btnExportAsciiSTL')?.addEventListener('click', () => this.exportModel('stl-ascii'));
    document.getElementById('btnExport3MF')?.addEventListener('click', () => this.exportModel('3mf'));
    document.getElementById('btnExportOBJ')?.addEventListener('click', () => this.exportModel('obj'));
  }

  /**
   * Called by I18n when user switches language
   */
  onLanguageChange(lang) {
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
   * Native 100% Client-side STL parser (Binary and ASCII)
   * @param {ArrayBuffer} buffer
   * @returns {THREE.BufferGeometry}
   */
  parseSTLBuffer(buffer) {
    const dataView = new DataView(buffer);
    const isBinary = () => {
      if (buffer.byteLength < 84) return false;
      const faceCount = dataView.getUint32(80, true);
      const expectedSize = 84 + faceCount * 50;
      return Math.abs(buffer.byteLength - expectedSize) <= 2;
    };

    if (isBinary()) {
      const faceCount = dataView.getUint32(80, true);
      const vertices = new Float32Array(faceCount * 9);
      const normals = new Float32Array(faceCount * 9);
      let offset = 84;

      for (let f = 0; f < faceCount; f++) {
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
    } else {
      const decoder = new TextDecoder();
      const text = decoder.decode(buffer);
      return this.parseAsciiSTL(text);
    }
  }

  /**
   * Parse ASCII STL Text
   */
  parseAsciiSTL(text) {
    const vertices = [];
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('vertex ')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        vertices.push(parts[0], parts[1], parts[2]);
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
    // Automatically center and drop on bed
    this.originalGeometry = MeshRepairer.alignToBed(geometry);
    this.repairedGeometry = null;
    this.currentFileSize = fileSizeBytes;

    // Reset view buttons state
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
    document.querySelector('.mode-btn[data-mode="original"]')?.classList.add('active');

    // Update File info badge
    document.getElementById('fileBadge').style.display = 'flex';
    document.getElementById('fileNameText').textContent = this.currentFileName;
    document.getElementById('fileSizeText').textContent = this.formatBytes(fileSizeBytes);

    // Enable repair & export buttons
    document.getElementById('btnAutoRepair').disabled = false;
    if (document.getElementById('btnDropToBed')) document.getElementById('btnDropToBed').disabled = false;
    if (document.getElementById('btnCenterBed')) document.getElementById('btnCenterBed').disabled = false;
    if (document.getElementById('btnRotateX')) document.getElementById('btnRotateX').disabled = false;
    if (document.getElementById('btnRotateY')) document.getElementById('btnRotateY').disabled = false;
    if (document.getElementById('btnRotateZ')) document.getElementById('btnRotateZ').disabled = false;
    document.getElementById('btnDecimate').disabled = false;
    document.getElementById('exportButtonGroup').querySelectorAll('button').forEach((b) => (b.disabled = false));

    // Analyze mesh topology
    this.runAnalysis(this.originalGeometry, true);

    // Render in viewport
    this.viewer.setOriginalGeometry(this.originalGeometry);
  }

  /**
   * Perform mesh topology diagnostic analysis
   */
  runAnalysis(geometry, isOriginal = true) {
    const analysis = MeshAnalyzer.analyze(geometry);
    this.activeAnalysis = analysis;

    // Update UI Cards
    document.getElementById('metricVertices').textContent = analysis.vertexCount.toLocaleString();
    document.getElementById('metricTriangles').textContent = analysis.triangleCount.toLocaleString();

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

    // Update error visualizer in 3D viewport
    if (isOriginal) {
      this.viewer.setErrorHighlights(analysis.errorLines);
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

  updateMaterialMetrics() {
    if (!this.activeAnalysis) return;
    const material = document.getElementById('materialSelect').value;
    const infill = parseInt(document.getElementById('infillSlider').value, 10);
    const result = MeshAnalyzer.calculateMaterial(this.activeAnalysis.volumeCm3, material, infill);

    document.getElementById('metricWeight').textContent = `${result.estimatedWeightGrams} g`;
    document.getElementById('metricFilament').textContent = `${result.filamentLengthMeters} m`;
  }

  /**
   * Run automated mesh repair pipeline with animated feedback HUD & scanlines
   */
  async runAutoRepair() {
    if (!this.originalGeometry) return;

    const btn = document.getElementById('btnAutoRepair');
    const overlay = document.getElementById('repairScanOverlay');
    const stepText = document.getElementById('scanStepText');
    const progressBar = document.getElementById('scanProgressBar');
    const percentText = document.getElementById('scanPercentText');
    const btnSpan = btn ? btn.querySelector('span') : null;

    // Set UI into active repair state
    if (btn) {
      btn.disabled = true;
      btn.classList.add('running');
      if (btnSpan) btnSpan.textContent = I18n.t('repairBtnRunning');
    }

    if (overlay) {
      overlay.classList.add('active');
    }

    const steps = [
      { text: I18n.t('repairStep1'), percent: 20, delay: 350 },
      { text: I18n.t('repairStep2'), percent: 45, delay: 400 },
      { text: I18n.t('repairStep3'), percent: 70, delay: 350 },
      { text: I18n.t('repairStep4'), percent: 88, delay: 300 },
      { text: I18n.t('repairStep5'), percent: 100, delay: 250 },
    ];

    try {
      for (const step of steps) {
        if (stepText) stepText.textContent = step.text;
        if (progressBar) progressBar.style.width = `${step.percent}%`;
        if (percentText) percentText.textContent = `${step.percent}%`;
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      const closeHoles = document.getElementById('optCloseHoles')?.checked ?? true;
      const fixNormals = document.getElementById('optFixNormals')?.checked ?? true;
      const weldTolerance = document.getElementById('optWeldVerts')?.checked ? 1e-4 : 0;

      const sourceGeom = this.repairedGeometry || this.originalGeometry;
      const repaired = MeshRepairer.autoRepair(sourceGeom, { closeHoles, fixNormals, weldTolerance });
      this.repairedGeometry = repaired;

      // Analyze repaired mesh
      this.runAnalysis(this.repairedGeometry, false);

      // Update 3D Viewport
      this.viewer.setRepairedGeometry(this.repairedGeometry);
      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
      document.querySelector('.mode-btn[data-mode="repaired"]')?.classList.add('active');

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

      this.showToast(I18n.t('toastRepairSuccess'), 'success');
    } catch (err) {
      console.error(err);
      this.showToast(I18n.t('toastRepairFail', { error: err.message }), 'error');
      if (btn) {
        btn.classList.remove('running', 'done');
        btn.disabled = false;
        if (btnSpan) btnSpan.textContent = I18n.t('btnAutoRepair');
      }
    } finally {
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
    if (this.repairedGeometry) {
      this.repairedGeometry = aligned;
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.originalGeometry = aligned;
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
    if (this.repairedGeometry) {
      this.repairedGeometry = aligned;
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.originalGeometry = aligned;
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
    if (this.repairedGeometry) {
      this.repairedGeometry = rotated;
      this.viewer.setRepairedGeometry(this.repairedGeometry);
    } else {
      this.originalGeometry = rotated;
      this.viewer.setOriginalGeometry(this.originalGeometry);
    }

    this.runAnalysis(rotated, !this.repairedGeometry);
    this.showToast(I18n.t('toastRotated', { axis: axis.toUpperCase() }), 'success');
  }

  /**
   * Run mesh decimation / polygon reduction
   */
  runDecimation() {
    const targetGeom = this.repairedGeometry || this.originalGeometry;
    if (!targetGeom) return;

    const ratio = parseFloat(document.getElementById('decimateRatio').value);
    this.showToast(I18n.t('toastDecimating', { ratio: Math.round(ratio * 100) }), 'info');

    setTimeout(() => {
      try {
        const decimated = MeshRepairer.decimate(targetGeom, ratio);
        this.repairedGeometry = decimated;
        this.viewer.setRepairedGeometry(this.repairedGeometry);
        this.runAnalysis(this.repairedGeometry, false);

        document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
        document.querySelector('.mode-btn[data-mode="repaired"]')?.classList.add('active');

        this.showToast(I18n.t('toastDecimateSuccess'), 'success');
      } catch (err) {
        console.error(err);
        this.showToast(I18n.t('toastDecimateFail', { error: err.message }), 'error');
      }
    }, 50);
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
   * Direct OBJ parser for client-side zero-upload
   */
  parseOBJText(text) {
    const lines = text.split('\n');
    const positions = [];
    const faces = [];

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('v ')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        positions.push(parts[0], parts[1], parts[2]);
      } else if (line.startsWith('f ')) {
        const parts = line.split(/\s+/).slice(1);
        const vIndices = parts.map((p) => {
          const v = parseInt(p.split('/')[0], 10);
          return v > 0 ? v - 1 : positions.length / 3 + v;
        });

        // Fan triangulation for quads/n-gons
        for (let i = 1; i < vIndices.length - 1; i++) {
          faces.push(vIndices[0], vIndices[i], vIndices[i + 1]);
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(faces);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Direct 3MF parser using JSZip and XML parsing
   */
  async parse3MFBuffer(buffer) {
    if (!window.JSZip) {
      throw new Error('JSZip required for 3MF files.');
    }

    const zip = await window.JSZip.loadAsync(buffer);
    let modelFile = zip.file('3D/3dmodel.model') || zip.file('3d/3dmodel.model');
    if (!modelFile) {
      const modelKeys = Object.keys(zip.files).filter((k) => k.endsWith('.model'));
      if (modelKeys.length > 0) modelFile = zip.file(modelKeys[0]);
    }

    if (!modelFile) {
      throw new Error('No .model geometry found in 3MF file.');
    }

    const xmlText = await modelFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const vertices = xmlDoc.getElementsByTagName('vertex');
    const triangles = xmlDoc.getElementsByTagName('triangle');

    const positions = [];
    for (let i = 0; i < vertices.length; i++) {
      positions.push(
        parseFloat(vertices[i].getAttribute('x') || 0),
        parseFloat(vertices[i].getAttribute('y') || 0),
        parseFloat(vertices[i].getAttribute('z') || 0)
      );
    }

    const indices = [];
    for (let i = 0; i < triangles.length; i++) {
      indices.push(
        parseInt(triangles[i].getAttribute('v1') || 0, 10),
        parseInt(triangles[i].getAttribute('v2') || 0, 10),
        parseInt(triangles[i].getAttribute('v3') || 0, 10)
      );
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
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

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.meshApp = new App();
});
