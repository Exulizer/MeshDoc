/**
 * analyzer.js - 100% Client-side 3D Mesh Diagnostics & Topology Analyzer
 * Detects non-manifold edges, open boundaries (holes), inverted normals,
 * degenerate triangles, signed volume, bounding box, and surface area.
 */

export class MeshAnalyzer {
  /**
   * Analyze a THREE.BufferGeometry
   * @param {THREE.BufferGeometry} geometry
   * @returns {Object} Full diagnostic analysis report
   */
  static analyze(geometry) {
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
      dimensions: {
        x: size.x,
        y: size.y,
        z: size.z,
      },
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
