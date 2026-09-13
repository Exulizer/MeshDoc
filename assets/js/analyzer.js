/**
 * analyzer.js - 100% Client-side 3D Mesh Diagnostics & Topology Analyzer
 * Detects non-manifold edges, open boundaries (holes), inverted normals,
 * degenerate triangles, signed volume, bounding box, and surface area.
 */

import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

export class MeshAnalyzer {
  /**
   * Analyze a THREE.BufferGeometry
   * @param {THREE.BufferGeometry} geometry
   * @param {Object} [options]
   * @returns {Object} Full diagnostic analysis report
   */
  static analyze(geometry, options = {}) {
    if (!geometry) {
      throw new Error('No geometry provided for analysis.');
    }

    const posAttr = geometry.getAttribute('position');
    if (!posAttr) {
      throw new Error('Geometry has no position attribute.');
    }

    // Ensure bounding box is computed
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const size = {
      x: bbox.max.x - bbox.min.x,
      y: bbox.max.y - bbox.min.y,
      z: bbox.max.z - bbox.min.z,
    };

    const vertexCount = posAttr.count;
    const isIndexed = geometry.index !== null;
    const triangleCount = isIndexed ? geometry.index.count / 3 : vertexCount / 3;

    // Fast vertex quantization for topology adjacency map
    const precision = 1e4; // 0.1 micron precision
    const quantize = (x, y, z) => `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;

    // Build unique vertex map
    const vertexMap = new Map(); // key -> uniqueId
    const uniquePositions = [];
    const indexToUnique = new Int32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const key = quantize(x, y, z);

      let uId = vertexMap.get(key);
      if (uId === undefined) {
        uId = uniquePositions.length;
        vertexMap.set(key, uId);
        uniquePositions.push([x, y, z]);
      }
      indexToUnique[i] = uId;
    }

    const uniqueVertexCount = uniquePositions.length;

    // Edge adjacency tracking
    // edgeKey -> { count: number, faces: Array<{faceIndex, dir: 1|-1}>, p1: [x,y,z], p2: [x,y,z] }
    const edgeMap = new Map();
    let degenerateTriangles = 0;
    let surfaceArea = 0;
    let signedVolume = 0;

    const getTriangleIndices = (f) => {
      if (isIndexed) {
        const i0 = geometry.index.getX(f * 3);
        const i1 = geometry.index.getX(f * 3 + 1);
        const i2 = geometry.index.getX(f * 3 + 2);
        return [i0, i1, i2];
      } else {
        return [f * 3, f * 3 + 1, f * 3 + 2];
      }
    };

    const getVertex = (idx) => [posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx)];

    for (let f = 0; f < triangleCount; f++) {
      const [i0, i1, i2] = getTriangleIndices(f);
      const u0 = indexToUnique[i0];
      const u1 = indexToUnique[i1];
      const u2 = indexToUnique[i2];

      const p0 = getVertex(i0);
      const p1 = getVertex(i1);
      const p2 = getVertex(i2);

      // Check degenerate triangle (identical vertices)
      if (u0 === u1 || u1 === u2 || u2 === u0) {
        degenerateTriangles++;
      }

      // Calculate area via cross product: 0.5 * |(p1 - p0) x (p2 - p0)|
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
      const cx = ay * bz - az * by;
      const cy = az * bx - ax * bz;
      const cz = ax * by - ay * bx;
      const triArea = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);

      if (triArea < 1e-7) {
        degenerateTriangles++;
      }
      surfaceArea += triArea;

      // Calculate signed volume contribution using divergence theorem / tetrahedra
      // Signed volume of tetrahedron formed by origin and triangle (p0, p1, p2)
      // V = 1/6 * p0 . (p1 x p2)
      const px = p1[1] * p2[2] - p1[2] * p2[1];
      const py = p1[2] * p2[0] - p1[0] * p2[2];
      const pz = p1[0] * p2[1] - p1[1] * p2[0];
      signedVolume += (p0[0] * px + p0[1] * py + p0[2] * pz) / 6.0;

      // Register 3 edges of this face
      const registerEdge = (ua, ub, pa, pb) => {
        const minU = Math.min(ua, ub);
        const maxU = Math.max(ua, ub);
        const edgeKey = `${minU}_${maxU}`;
        const dir = ua < ub ? 1 : -1;

        let edgeEntry = edgeMap.get(edgeKey);
        if (!edgeEntry) {
          edgeEntry = { count: 0, dirs: [], p1: pa, p2: pb };
          edgeMap.set(edgeKey, edgeEntry);
        }
        edgeEntry.count++;
        edgeEntry.dirs.push(dir);
      };

      registerEdge(u0, u1, p0, p1);
      registerEdge(u1, u2, p1, p2);
      registerEdge(u2, u0, p2, p0);
    }

    // Inspect edges for manifold & boundary issues
    let boundaryEdgesCount = 0;
    let nonManifoldEdgesCount = 0;
    let invertedEdgesCount = 0;

    // Bad edge positions for 3D visual highlight lines [x1,y1,z1, x2,y2,z2, ...]
    const openEdgeLines = [];
    const nonManifoldEdgeLines = [];

    for (const [_, edge] of edgeMap) {
      if (edge.count === 1) {
        // Boundary edge (Hole / open shell)
        boundaryEdgesCount++;
        openEdgeLines.push(...edge.p1, ...edge.p2);
      } else if (edge.count > 2) {
        // Non-manifold edge (shared by >2 triangles)
        nonManifoldEdgesCount++;
        nonManifoldEdgeLines.push(...edge.p1, ...edge.p2);
      } else if (edge.count === 2) {
        // Shared by 2 triangles: check normal consistency (should have opposite directions: 1 and -1)
        if (edge.dirs[0] === edge.dirs[1]) {
          invertedEdgesCount++;
        }
      }
    }

    const volumeMm3 = Math.abs(signedVolume);
    const volumeCm3 = volumeMm3 / 1000.0;
    const surfaceAreaCm2 = surfaceArea / 100.0;
    const isWatertight = boundaryEdgesCount === 0 && nonManifoldEdgesCount === 0 && triangleCount > 0;
    const isManifold = isWatertight && invertedEdgesCount === 0;
    const hasInvertedVolume = signedVolume < 0;

    const dimensions = {
      x: size.x,
      y: size.y,
      z: size.z,
    };

    const unitScale = this.detectUnitScaleAnomaly(dimensions, triangleCount);
    const overhangs = this.analyzeOverhangs(geometry, { thresholdAngleDeg: 45 }, surfaceArea);

    return {
      vertexCount,
      uniqueVertexCount,
      triangleCount,
      degenerateTriangles,
      boundaryEdgesCount,
      nonManifoldEdgesCount,
      invertedEdgesCount,
      isWatertight,
      isManifold,
      hasInvertedVolume,
      dimensions,
      unitScale,
      overhangs,
      volumeMm3,
      volumeCm3,
      surfaceAreaMm2: surfaceArea,
      surfaceAreaCm2,
      errorLines: {
        openEdges: new Float32Array(openEdgeLines),
        nonManifoldEdges: new Float32Array(nonManifoldEdgeLines),
      },
    };
  }

  /**
   * Detect potential unit / scale mismatch (e.g. Inches vs mm) based on bounding box
   * @param {Object} dimensions - { x, y, z } in mm
   * @param {number} triangleCount - number of triangles
   * @param {Object} [bedSize={ x: 220, y: 220, z: 250 }] - standard build volume
   * @returns {Object} { isAnomaly: boolean, type: 'inch_as_mm'|'mm_as_inch'|'normal', suggestedFactor: number, labelKey: string }
   */
  static detectUnitScaleAnomaly(dimensions, triangleCount, bedSize = { x: 220, y: 220, z: 250 }) {
    if (!dimensions) return { isAnomaly: false, type: 'normal', suggestedFactor: 1.0, labelKey: 'unitNormal' };

    const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z);
    const minDim = Math.min(dimensions.x, dimensions.y, dimensions.z);

    // Case A: Model imported in inches instead of mm (appears 25.4x too small)
    // E.g. A part with max dimension 0.1 - 15mm that has substantial facets (triangleCount >= 60)
    // When multiplied by 25.4, it fits comfortably on standard print bed (<= 250mm)
    if (maxDim > 0 && maxDim <= 15.0 && (maxDim * 25.4) <= bedSize.z && (minDim * 25.4) >= 0.2 && triangleCount >= 60) {
      return {
        isAnomaly: true,
        type: 'inch_as_mm',
        suggestedFactor: 25.4,
        labelKey: 'unitSuspectedInch',
      };
    }

    // Case B: Model exported in mm but imported into software expecting inches (appears 25.4x too big)
    if (maxDim > (bedSize.x * 1.2) && (maxDim / 25.4) <= bedSize.z && (minDim / 25.4) >= 1.0) {
      return {
        isAnomaly: true,
        type: 'mm_as_inch',
        suggestedFactor: 1 / 25.4,
        labelKey: 'unitSuspectedMmAsInch',
      };
    }

    return {
      isAnomaly: false,
      type: 'normal',
      suggestedFactor: 1.0,
      labelKey: 'unitNormal',
    };
  }

  /**
   * Analyze overhangs and estimate required 3D print support structures
   * @param {THREE.BufferGeometry} geometry
   * @param {Object} [options]
   * @param {number} [options.thresholdAngleDeg=45] - overhang threshold from vertical (standard: 45°)
   * @param {number} [options.bedMargin=0.05] - triangles with all vertices <= this Y are touching the build plate
   * @param {number} [options.supportDensity=0.15] - infill density factor for supports (standard: 15%)
   * @param {number} [totalSurfaceArea=0] - total surface area in mm² (if already calculated)
   * @returns {Object} Overhang analysis result
   */
  static analyzeOverhangs(geometry, options = {}, totalSurfaceArea = 0) {
    if (!geometry || !geometry.getAttribute('position')) {
      return {
        overhangAreaMm2: 0,
        overhangAreaPercent: 0,
        supportVolumeMm3: 0,
        supportVolumeCm3: 0,
        overhangTriangleCount: 0,
        hasSevereOverhangs: false,
        overhangTrianglesBuffer: new Float32Array(0),
        overhangColorsBuffer: new Float32Array(0),
        thresholdAngleDeg: 45,
      };
    }

    const posAttr = geometry.getAttribute('position');
    const normAttr = geometry.getAttribute('normal');
    const isIndexed = !!geometry.index;
    const triangleCount = isIndexed ? geometry.index.count / 3 : posAttr.count / 3;

    const thresholdDeg = options.thresholdAngleDeg !== undefined
      ? options.thresholdAngleDeg
      : (options.overhangAngleDeg !== undefined ? options.overhangAngleDeg : 45);
    const bedMargin = options.bedMargin !== undefined ? options.bedMargin : 0.05;
    const supportDensity = options.supportDensity !== undefined ? options.supportDensity : 0.15;

    // Normal Ny threshold: for downward face, critical when Ny < -sin(thresholdDeg)
    // E.g. at 45°: -sin(45°) = -0.7071
    const nyCutoff = -Math.sin(thresholdDeg * (Math.PI / 180));

    let calcSurfaceArea = totalSurfaceArea;
    let overhangAreaMm2 = 0;
    let supportVolumeMm3 = 0;
    let overhangTriangleCount = 0;

    const overhangCoords = [];
    const overhangColors = [];

    const getTriangleIndices = (f) => {
      if (isIndexed) {
        return [
          geometry.index.getX(f * 3),
          geometry.index.getX(f * 3 + 1),
          geometry.index.getX(f * 3 + 2),
        ];
      }
      return [f * 3, f * 3 + 1, f * 3 + 2];
    };

    for (let f = 0; f < triangleCount; f++) {
      const [i0, i1, i2] = getTriangleIndices(f);
      const x0 = posAttr.getX(i0), y0 = posAttr.getY(i0), z0 = posAttr.getZ(i0);
      const x1 = posAttr.getX(i1), y1 = posAttr.getY(i1), z1 = posAttr.getZ(i1);
      const x2 = posAttr.getX(i2), y2 = posAttr.getY(i2), z2 = posAttr.getZ(i2);

      const ax = x1 - x0, ay = y1 - y0, az = z1 - z0;
      const bx = x2 - x0, by = y2 - y0, bz = z2 - z0;
      const cx = ay * bz - az * by;
      const cy = az * bx - ax * bz;
      const cz = ax * by - ay * bx;
      const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
      const triArea = 0.5 * len;

      if (!totalSurfaceArea) {
        calcSurfaceArea += triArea;
      }

      if (len < 1e-7) continue;

      const ny = cy / len;

      // Skip faces touching the print bed (bottom of the model)
      if (y0 <= bedMargin && y1 <= bedMargin && y2 <= bedMargin) {
        continue;
      }

      // Overhang condition: face normal points downward (Ny < 0)
      if (ny < -0.01) {
        // Calculate overhang angle from vertical (0° = vertical wall, 90° = horizontal bottom)
        const faceAngleDeg = Math.asin(Math.min(1.0, Math.max(0.0, -ny))) * (180 / Math.PI);

        // Include all downward faces with overhang angle >= 15° in the 3D heatmap overlay
        if (faceAngleDeg >= 15) {
          overhangCoords.push(x0, y0, z0, x1, y1, z1, x2, y2, z2);

          if (normAttr && isIndexed) {
            // Smooth indexed mesh: compute color per vertex normal for fluid gradient
            for (let k = 0; k < 3; k++) {
              const vi = [i0, i1, i2][k];
              const vny = normAttr.getY(vi);
              const vAngle = vny < 0 ? Math.asin(Math.min(1.0, -vny)) * (180 / Math.PI) : 0;
              const [r, g, b] = MeshAnalyzer.getOverhangColor(vAngle, thresholdDeg);
              overhangColors.push(r, g, b);
            }
          } else {
            // STL / Unindexed facet: use facet normal color across all 3 vertices
            const [r, g, b] = MeshAnalyzer.getOverhangColor(faceAngleDeg, thresholdDeg);
            overhangColors.push(r, g, b, r, g, b, r, g, b);
          }
        }

        // Critical overhang metric calculation (faces exceeding support threshold)
        if (ny < nyCutoff) {
          overhangTriangleCount++;
          overhangAreaMm2 += triArea;

          // Support volume: projected area on bed * average height from bed * density factor
          const avgHeight = Math.max(0, (y0 + y1 + y2) / 3.0);
          const projectedArea = triArea * Math.abs(ny);
          supportVolumeMm3 += projectedArea * avgHeight * supportDensity;
        }
      }
    }

    const overhangAreaPercent = calcSurfaceArea > 0 ? (overhangAreaMm2 / calcSurfaceArea) * 100 : 0;
    const supportVolumeCm3 = supportVolumeMm3 / 1000.0;

    return {
      overhangAreaMm2,
      overhangAreaPercent: Math.round(overhangAreaPercent * 10) / 10,
      supportVolumeMm3,
      supportVolumeCm3: Math.round(supportVolumeCm3 * 10) / 10,
      overhangTriangleCount,
      hasSevereOverhangs: overhangTriangleCount > 0,
      overhangTrianglesBuffer: new Float32Array(overhangCoords),
      overhangColorsBuffer: new Float32Array(overhangColors),
      thresholdAngleDeg: thresholdDeg,
    };
  }

  /**
   * Evaluates the traffic-light heatmap color for an overhang angle
   * Grün: Safe / Sicher (0° to safe threshold)
   * Gelb: Warnung / Schwellenwert (approaching user support threshold)
   * Orange: Support nötig (exceeding threshold)
   * Rot / Tiefrot: Kritisch (severe horizontal bottom)
   * @param {number} angleDeg - Overhang angle in degrees (0 = vertical wall, 90 = flat horizontal bottom)
   * @param {number} thresholdDeg - Support threshold angle in degrees (default 45)
   * @returns {[number, number, number]} RGB color in 0.0-1.0 float range
   */
  static getOverhangColor(angleDeg, thresholdDeg = 45) {
    const safeAng = Math.max(18, thresholdDeg - 12);
    const warnAng = thresholdDeg;
    const critAng1 = thresholdDeg + 12;
    const critAng2 = Math.min(85, thresholdDeg + 25);

    // Color definitions (sRGB 0.0 - 1.0)
    const cGreen = [0.133, 0.773, 0.369];   // #22c55e (Safe)
    const cYellow = [0.918, 0.702, 0.031];  // #eab308 (Warning / Threshold)
    const cOrange = [0.976, 0.451, 0.086];  // #f97316 (Support recommended)
    const cRed = [0.937, 0.267, 0.267];     // #ef4444 (Critical support)
    const cDarkRed = [0.725, 0.110, 0.110]; // #b91c1c (Extreme underside)

    if (angleDeg <= safeAng) {
      return cGreen;
    } else if (angleDeg <= warnAng) {
      const t = (angleDeg - safeAng) / (warnAng - safeAng);
      return [
        cGreen[0] + t * (cYellow[0] - cGreen[0]),
        cGreen[1] + t * (cYellow[1] - cGreen[1]),
        cGreen[2] + t * (cYellow[2] - cGreen[2]),
      ];
    } else if (angleDeg <= critAng1) {
      const t = (angleDeg - warnAng) / (critAng1 - warnAng);
      return [
        cYellow[0] + t * (cOrange[0] - cYellow[0]),
        cYellow[1] + t * (cOrange[1] - cYellow[1]),
        cYellow[2] + t * (cOrange[2] - cYellow[2]),
      ];
    } else if (angleDeg <= critAng2) {
      const t = (angleDeg - critAng1) / (critAng2 - critAng1);
      return [
        cOrange[0] + t * (cRed[0] - cOrange[0]),
        cOrange[1] + t * (cRed[1] - cOrange[1]),
        cOrange[2] + t * (cRed[2] - cOrange[2]),
      ];
    } else {
      const t = Math.min(1.0, (angleDeg - critAng2) / 15);
      return [
        cRed[0] + t * (cDarkRed[0] - cRed[0]),
        cRed[1] + t * (cDarkRed[1] - cRed[1]),
        cRed[2] + t * (cDarkRed[2] - cRed[2]),
      ];
    }
  }

  /**
   * Calculate material print weight and estimated filament length
   * @param {number} volumeCm3
   * @param {string} material - 'PLA' | 'PETG' | 'ABS' | 'TPU'
   * @param {number} infillPercent - 0 to 100
   * @returns {Object} weight in grams and length in meters
   */
  static calculateMaterial(volumeCm3, material = 'PLA', infillPercent = 20) {
    const densities = {
      PLA: 1.24, // g/cm³
      PETG: 1.27,
      ABS: 1.04,
      TPU: 1.21,
    };

    const density = densities[material] || 1.24;
    // Effective volume factoring infill (assumes solid walls ~15% + internal infill)
    const effectiveFactor = 0.15 + (infillPercent / 100) * 0.85;
    const solidWeight = volumeCm3 * density;
    const estimatedWeight = solidWeight * Math.min(1.0, effectiveFactor);

    // 1.75mm filament cross-section area in cm²: PI * (0.175 / 2)^2
    const filamentAreaCm2 = Math.PI * Math.pow(0.175 / 2, 2);
    const filamentLengthCm = (volumeCm3 * effectiveFactor) / filamentAreaCm2;
    const filamentLengthMeters = filamentLengthCm / 100.0;

    return {
      material,
      density,
      solidWeightGrams: Math.round(solidWeight * 10) / 10,
      estimatedWeightGrams: Math.round(estimatedWeight * 10) / 10,
      filamentLengthMeters: Math.round(filamentLengthMeters * 10) / 10,
    };
  }
}

