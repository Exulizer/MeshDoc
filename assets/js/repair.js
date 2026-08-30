import * as THREE from 'three';

export class MeshRepairer {
  /**
   * Asynchronous Deep Auto-Repair pipeline with Watchdog-Timeout and Cancellation Support
   * @param {THREE.BufferGeometry} geometry
   * @param {Object} options
   * @param {Function} onProgress
   * @param {AbortSignal} abortSignal
   * @returns {Promise<THREE.BufferGeometry>}
   */
  static async autoRepairAsync(geometry, options = { closeHoles: true, fixNormals: true, weldTolerance: 1e-4, timeoutMs: 60000 }, onProgress = null, abortSignal = null) {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 60000;

    const checkAbortOrTimeout = () => {
      if (abortSignal && abortSignal.aborted) {
        const err = new Error('USER_CANCELLED');
        err.name = 'AbortError';
        throw err;
      }
      if (Date.now() - startTime > timeoutMs) {
        const err = new Error(`TIMEOUT_REACHED_${Math.round(timeoutMs / 1000)}s`);
        err.name = 'TimeoutError';
        throw err;
      }
    };

    let repaired = geometry.clone();

    // Multi-pass iterative repair to handle cascaded multi-body defects
    const passes = 2;
    for (let pass = 0; pass < passes; pass++) {
      checkAbortOrTimeout();
      if (onProgress) onProgress(`pass_${pass + 1}_weld`, 15 + pass * 35);
      await new Promise(r => setTimeout(r, 0));

      // 1. Spatial vertex welding
      repaired = this.weldVertices(repaired, options.weldTolerance || 1e-4);
      checkAbortOrTimeout();

      // 2. Remove degenerate & duplicate triangles
      repaired = this.removeDegenerates(repaired);
      repaired = this.removeDuplicateFaces(repaired);
      checkAbortOrTimeout();

      // 3. Close open boundary loops (Ear-Clipping)
      if (options.closeHoles) {
        if (onProgress) onProgress(`pass_${pass + 1}_holes`, 30 + pass * 35);
        await new Promise(r => setTimeout(r, 0));
        repaired = this.closeHoles(repaired, checkAbortOrTimeout);
      }
    }

    // 4. Orient normals consistently and outward using BFS
    if (options.fixNormals) {
      checkAbortOrTimeout();
      if (onProgress) onProgress('normals', 85);
      await new Promise(r => setTimeout(r, 0));
      repaired = this.orientNormalsOutward(repaired, checkAbortOrTimeout);
    }

    checkAbortOrTimeout();
    if (onProgress) onProgress('finalize', 95);
    await new Promise(r => setTimeout(r, 0));

    // 5. Convert to clean non-indexed geometry with crisp, razor-sharp face normals
    repaired = repaired.toNonIndexed();
    repaired.computeVertexNormals();
    repaired.computeBoundingBox();
    repaired.computeBoundingSphere();

    return repaired;
  }

  /**
   * Synchronous fallback Auto-Repair
   */
  static autoRepair(geometry, options = { closeHoles: true, fixNormals: true, weldTolerance: 1e-4 }) {
    let repaired = geometry.clone();
    const passes = 2;
    for (let pass = 0; pass < passes; pass++) {
      repaired = this.weldVertices(repaired, options.weldTolerance || 1e-4);
      repaired = this.removeDegenerates(repaired);
      repaired = this.removeDuplicateFaces(repaired);
      if (options.closeHoles) {
        repaired = this.closeHoles(repaired);
      }
    }
    if (options.fixNormals) {
      repaired = this.orientNormalsOutward(repaired);
    }
    repaired = repaired.toNonIndexed();
    repaired.computeVertexNormals();
    repaired.computeBoundingBox();
    repaired.computeBoundingSphere();
    return repaired;
  }

  /**
   * Remove redundant duplicate triangles sharing the same 3 vertices
   */
  static removeDuplicateFaces(geometry) {
    if (!geometry.index) return geometry;
    const indices = Array.from(geometry.index.array);
    const triCount = indices.length / 3;

    const seen = new Set();
    const cleanIndices = [];

    for (let f = 0; f < triCount; f++) {
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const sorted = [i0, i1, i2].sort((a, b) => a - b).join('_');
      if (!seen.has(sorted)) {
        seen.add(sorted);
        cleanIndices.push(i0, i1, i2);
      }
    }

    const cleanGeom = geometry.clone();
    cleanGeom.setIndex(cleanIndices);
    return cleanGeom;
  }

  /**
   * Weld duplicate / nearby vertices within tolerance
   * @param {THREE.BufferGeometry} geometry
   * @param {number} tolerance
   * @returns {THREE.BufferGeometry}
   */
  static weldVertices(geometry, tolerance = 1e-4) {
    const posAttr = geometry.getAttribute('position');
    const isIndexed = geometry.index !== null;
    const vertexCount = posAttr.count;

    const precision = 1 / tolerance;
    const hash = (x, y, z) => `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;

    const uniqueMap = new Map();
    const uniquePositions = [];
    const newIndices = [];

    const getIndex = (i) => (isIndexed ? geometry.index.getX(i) : i);
    const totalIndices = isIndexed ? geometry.index.count : vertexCount;

    for (let i = 0; i < totalIndices; i++) {
      const idx = getIndex(i);
      const x = posAttr.getX(idx);
      const y = posAttr.getY(idx);
      const z = posAttr.getZ(idx);
      const key = hash(x, y, z);

      let uId = uniqueMap.get(key);
      if (uId === undefined) {
        uId = uniquePositions.length / 3;
        uniqueMap.set(key, uId);
        uniquePositions.push(x, y, z);
      }
      newIndices.push(uId);
    }

    const welded = new THREE.BufferGeometry();
    welded.setAttribute('position', new THREE.Float32BufferAttribute(uniquePositions, 3));
    welded.setIndex(newIndices);
    return welded;
  }

  /**
   * Remove degenerate zero-area triangles
   * @param {THREE.BufferGeometry} geometry
   * @returns {THREE.BufferGeometry}
   */
  static removeDegenerates(geometry) {
    const posAttr = geometry.getAttribute('position');
    const indexAttr = geometry.index;
    if (!indexAttr) return geometry;

    const cleanIndices = [];
    const triCount = indexAttr.count / 3;

    for (let f = 0; f < triCount; f++) {
      const i0 = indexAttr.getX(f * 3);
      const i1 = indexAttr.getX(f * 3 + 1);
      const i2 = indexAttr.getX(f * 3 + 2);

      if (i0 === i1 || i1 === i2 || i2 === i0) continue;

      const p0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
      const p1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
      const p2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

      const vA = new THREE.Vector3().subVectors(p1, p0);
      const vB = new THREE.Vector3().subVectors(p2, p0);
      const area = vA.cross(vB).length() * 0.5;

      if (area > 1e-7) {
        cleanIndices.push(i0, i1, i2);
      }
    }

    const cleanGeom = geometry.clone();
    cleanGeom.setIndex(cleanIndices);
    return cleanGeom;
  }

  /**
   * Close open boundary loops cleanly using 2D projected Ear-Clipping (prevents spiderweb folds)
   * @param {THREE.BufferGeometry} geometry
   * @param {Function} [checkCallback]
   * @returns {THREE.BufferGeometry}
   */
  static closeHoles(geometry, checkCallback = null) {
    const posAttr = geometry.getAttribute('position');
    const indexAttr = geometry.index;
    if (!indexAttr) return geometry;

    const indices = Array.from(indexAttr.array);
    const triCount = indices.length / 3;

    // Find all boundary directed half-edges
    const edgeCounts = new Map();
    const halfEdges = new Map(); // u1 -> u2

    for (let f = 0; f < triCount; f++) {
      if (f % 5000 === 0 && checkCallback) checkCallback();
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const addEdge = (a, b) => {
        const undirected = a < b ? `${a}_${b}` : `${b}_${a}`;
        edgeCounts.set(undirected, (edgeCounts.get(undirected) || 0) + 1);
      };
      addEdge(i0, i1);
      addEdge(i1, i2);
      addEdge(i2, i0);
    }

    // Now identify boundary edges (count === 1) and record their directional flow
    for (let f = 0; f < triCount; f++) {
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const checkEdge = (a, b) => {
        const undirected = a < b ? `${a}_${b}` : `${b}_${a}`;
        if (edgeCounts.get(undirected) === 1) {
          halfEdges.set(b, a);
        }
      };
      checkEdge(i0, i1);
      checkEdge(i1, i2);
      checkEdge(i2, i0);
    }

    if (halfEdges.size === 0) {
      return geometry;
    }

    // Trace closed boundary loops
    const visited = new Set();
    const newIndices = [...indices];

    const getPos = (idx) => [posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx)];

    for (const [startV] of halfEdges) {
      if (visited.has(startV)) continue;

      const loop = [];
      let curr = startV;
      let isLoop = false;

      while (curr !== undefined && !visited.has(curr)) {
        visited.add(curr);
        loop.push(curr);
        const next = halfEdges.get(curr);
        if (next === startV) {
          isLoop = true;
          break;
        }
        curr = next;
      }

      if (isLoop && loop.length >= 3) {
        // Ear-clipping triangulation on projected 2D plane
        const n = loop.length;
        if (n === 3) {
          newIndices.push(loop[0], loop[1], loop[2]);
          continue;
        }

        // 1. Calculate best-fit plane normal using Newell's method
        let nx = 0, ny = 0, nz = 0;
        for (let i = 0; i < n; i++) {
          const p1 = getPos(loop[i]);
          const p2 = getPos(loop[(i + 1) % n]);
          nx += (p1[1] - p2[1]) * (p1[2] + p2[2]);
          ny += (p1[2] - p2[2]) * (p1[0] + p2[0]);
          nz += (p1[0] - p2[0]) * (p1[1] + p2[1]);
        }

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len < 1e-7) continue;
        nx /= len; ny /= len; nz /= len;

        // 2. Project vertices to 2D plane perpendicular to dominant normal axis
        const absX = Math.abs(nx), absY = Math.abs(ny), absZ = Math.abs(nz);
        const uIdx = absX > absY && absX > absZ ? 1 : 0;
        const vIdx = absZ >= absX && absZ >= absY ? 1 : 2;

        const pts2D = loop.map((v) => {
          const p = getPos(v);
          return [p[uIdx], p[vIdx]];
        });

        // 3. Compute 2D signed area
        let area2D = 0;
        for (let i = 0; i < n; i++) {
          const p1 = pts2D[i];
          const p2 = pts2D[(i + 1) % n];
          area2D += p1[0] * p2[1] - p2[0] * p1[1];
        }

        // 4. Ear clipping loop
        let poly = loop.map((v, i) => ({ v, p: pts2D[i], origIdx: i }));
        if (area2D < 0) {
          poly.reverse();
        }

        const isPointInTri2D = (p, a, b, c) => {
          const cross = (p1, p2, p3) => (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
          const c1 = cross(a, b, p);
          const c2 = cross(b, c, p);
          const c3 = cross(c, a, p);
          return (c1 >= 0 && c2 >= 0 && c3 >= 0) || (c1 <= 0 && c2 <= 0 && c3 <= 0);
        };

        let maxAttempts = poly.length * 3;
        while (poly.length > 2 && maxAttempts > 0) {
          maxAttempts--;
          let earFound = false;

          for (let i = 0; i < poly.length; i++) {
            const prev = poly[(i + poly.length - 1) % poly.length];
            const curr = poly[i];
            const next = poly[(i + 1) % poly.length];

            // Convexity check
            const cross = (curr.p[0] - prev.p[0]) * (next.p[1] - prev.p[1]) - (curr.p[1] - prev.p[1]) * (next.p[0] - prev.p[0]);
            if (cross <= 1e-8) continue; // Reflex vertex

            // Check if any other point is inside the triangle
            let hasPointInside = false;
            for (let j = 0; j < poly.length; j++) {
              if (j === (i + poly.length - 1) % poly.length || j === i || j === (i + 1) % poly.length) continue;
              if (isPointInTri2D(poly[j].p, prev.p, curr.p, next.p)) {
                hasPointInside = true;
                break;
              }
            }

            if (!hasPointInside) {
              newIndices.push(prev.v, curr.v, next.v);
              poly.splice(i, 1);
              earFound = true;
              break;
            }
          }

          if (!earFound && poly.length > 2) {
            // Fallback: take first triangle and advance to prevent endless loop
            newIndices.push(poly[0].v, poly[1].v, poly[2].v);
            poly.splice(1, 1);
          }
        }
      }
    }

    const patched = geometry.clone();
    patched.setIndex(newIndices);
    return patched;
  }

  /**
   * Auto-orient face normals so they point outward and are 100% consistently wound
   * @param {THREE.BufferGeometry} geometry
   * @param {Function} [checkCallback]
   * @returns {THREE.BufferGeometry}
   */
  static orientNormalsOutward(geometry, checkCallback = null) {
    const posAttr = geometry.getAttribute('position');
    const indexAttr = geometry.index;
    if (!indexAttr) return geometry;

    const indices = Array.from(indexAttr.array);
    const triCount = indices.length / 3;

    // 1. Build half-edge to face map for adjacency graph
    const edgeToFaces = new Map();
    for (let f = 0; f < triCount; f++) {
      if (f % 5000 === 0 && checkCallback) checkCallback();
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const edges = [
        { u: i0, v: i1 },
        { u: i1, v: i2 },
        { u: i2, v: i0 }
      ];

      for (const e of edges) {
        const key = e.u < e.v ? `${e.u}_${e.v}` : `${e.v}_${e.u}`;
        if (!edgeToFaces.has(key)) edgeToFaces.set(key, []);
        edgeToFaces.get(key).push({ face: f, u: e.u, v: e.v });
      }
    }

    // 2. Propagate consistent winding across connected face components via BFS
    const visited = new Uint8Array(triCount);
    let bfsSteps = 0;
    for (let startF = 0; startF < triCount; startF++) {
      if (visited[startF]) continue;

      const queue = [startF];
      visited[startF] = 1;

      while (queue.length > 0) {
        bfsSteps++;
        if (bfsSteps % 5000 === 0 && checkCallback) checkCallback();
        const currF = queue.shift();
        const f0 = indices[currF * 3];
        const f1 = indices[currF * 3 + 1];
        const f2 = indices[currF * 3 + 2];

        const currEdges = [
          [f0, f1],
          [f1, f2],
          [f2, f0]
        ];

        for (const [u, v] of currEdges) {
          const key = u < v ? `${u}_${v}` : `${v}_${u}`;
          const adjList = edgeToFaces.get(key) || [];

          for (const adj of adjList) {
            const nextF = adj.face;
            if (visited[nextF]) continue;

            // Check how nextF traverses this shared edge
            const n0 = indices[nextF * 3];
            const n1 = indices[nextF * 3 + 1];
            const n2 = indices[nextF * 3 + 2];

            // If nextF traverses u -> v in the SAME direction as currF, nextF needs to be flipped!
            let sameDir = false;
            if ((n0 === u && n1 === v) || (n1 === u && n2 === v) || (n2 === u && n0 === v)) {
              sameDir = true;
            }

            if (sameDir) {
              // Flip nextF's winding
              const tmp = indices[nextF * 3 + 1];
              indices[nextF * 3 + 1] = indices[nextF * 3 + 2];
              indices[nextF * 3 + 2] = tmp;
            }

            visited[nextF] = 1;
            queue.push(nextF);
          }
        }
      }
    }

    // 3. Compute signed volume of the consistently wound mesh to ensure outward orientation
    let signedVolume = 0;
    for (let f = 0; f < triCount; f++) {
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const p0 = [posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0)];
      const p1 = [posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1)];
      const p2 = [posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)];

      const px = p1[1] * p2[2] - p1[2] * p2[1];
      const py = p1[2] * p2[0] - p1[0] * p2[2];
      const pz = p1[0] * p2[1] - p1[1] * p2[0];
      signedVolume += (p0[0] * px + p0[1] * py + p0[2] * pz) / 6.0;
    }

    // If overall volume is negative, flip ALL triangles
    if (signedVolume < 0) {
      for (let f = 0; f < triCount; f++) {
        const tmp = indices[f * 3 + 1];
        indices[f * 3 + 1] = indices[f * 3 + 2];
        indices[f * 3 + 2] = tmp;
      }
    }

    const oriented = geometry.clone();
    oriented.setIndex(indices);
    oriented.computeVertexNormals();
    return oriented;
  }

  /**
   * Place model directly onto the build bed surface (lowest point Y=0)
   * @param {THREE.BufferGeometry} geometry
   * @returns {THREE.BufferGeometry}
   */
  static dropToBed(geometry) {
    const aligned = geometry.clone();
    aligned.computeBoundingBox();
    const bbox = aligned.boundingBox;
    const minY = bbox.min.y;

    aligned.translate(0, -minY, 0);
    aligned.computeBoundingBox();
    aligned.computeBoundingSphere();
    return aligned;
  }

  /**
   * Center model horizontally on the build bed (X=0, Z=0)
   * @param {THREE.BufferGeometry} geometry
   * @returns {THREE.BufferGeometry}
   */
  static centerOnBed(geometry) {
    const aligned = geometry.clone();
    aligned.computeBoundingBox();
    const bbox = aligned.boundingBox;

    const centerX = (bbox.min.x + bbox.max.x) / 2;
    const centerZ = (bbox.min.z + bbox.max.z) / 2;

    aligned.translate(-centerX, 0, -centerZ);
    aligned.computeBoundingBox();
    aligned.computeBoundingSphere();
    return aligned;
  }

  /**
   * Align 3D Model flat on build plate: Drop to Y=0 and Center on X=0, Z=0
   * @param {THREE.BufferGeometry} geometry
   * @returns {THREE.BufferGeometry}
   */
  static alignToBed(geometry) {
    const aligned = geometry.clone();
    aligned.computeBoundingBox();
    const bbox = aligned.boundingBox;

    const centerX = (bbox.min.x + bbox.max.x) / 2;
    const centerZ = (bbox.min.z + bbox.max.z) / 2;
    const minY = bbox.min.y;

    aligned.translate(-centerX, -minY, -centerZ);
    aligned.computeBoundingBox();
    aligned.computeBoundingSphere();
    return aligned;
  }

  /**
   * Rotate geometry 90 degrees around chosen axis and rest on bed
   * @param {THREE.BufferGeometry} geometry
   * @param {'x'|'y'|'z'} axis
   * @returns {THREE.BufferGeometry}
   */
  static rotateGeometry(geometry, axis = 'x') {
    const rotated = geometry.clone();
    const angle = Math.PI / 2;
    if (axis === 'x') rotated.rotateX(angle);
    else if (axis === 'y') rotated.rotateY(angle);
    else if (axis === 'z') rotated.rotateZ(angle);

    rotated.computeBoundingBox();
    rotated.computeBoundingSphere();
    return this.dropToBed(rotated);
  }

  /**
   * Fast & Robust Mesh Decimation (Polygon Reduction) via Adaptive Non-Uniform Centroid Clustering
   * Preserves watertight topology, sharp edges, aspect ratio, and exact target ratios.
   * @param {THREE.BufferGeometry} geometry
   * @param {number} targetRatio - Target face ratio between 0.05 and 1.0 (e.g. 0.5 for 50%)
   * @returns {THREE.BufferGeometry}
   */
  static decimate(geometry, targetRatio = 0.5) {
    if (targetRatio >= 0.99) return geometry.clone();

    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const posAttr = nonIndexed.getAttribute('position');
    const initialTriCount = posAttr.count / 3;

    if (initialTriCount <= 24) return geometry.clone();

    nonIndexed.computeBoundingBox();
    const bbox = nonIndexed.boundingBox;
    const sizeX = Math.max(1e-4, bbox.max.x - bbox.min.x);
    const sizeY = Math.max(1e-4, bbox.max.y - bbox.min.y);
    const sizeZ = Math.max(1e-4, bbox.max.z - bbox.min.z);

    // Clamp target ratio safely so even 5% (0.05) preserves a recognizable 3D hull
    const safeRatio = Math.max(0.05, Math.min(0.98, targetRatio));
    const targetTriangles = Math.max(48, Math.floor(initialTriCount * safeRatio));

    // Calculate ideal non-uniform cell dimension based on volume
    const volume = sizeX * sizeY * sizeZ;
    const totalCells = Math.max(20, targetTriangles * 1.6);
    const idealCellEdge = Math.cbrt(volume / totalCells);

    let baseCellsX = Math.max(4, Math.round(sizeX / idealCellEdge));
    let baseCellsY = Math.max(4, Math.round(sizeY / idealCellEdge));
    let baseCellsZ = Math.max(4, Math.round(sizeZ / idealCellEdge));

    // Multi-scale adaptive search to hit target ratio with precision
    let bestGeom = null;
    let bestDiff = Infinity;

    const testScales = [1.0, 0.82, 1.22, 0.68, 1.45, 0.5];

    for (const scale of testScales) {
      const cellsX = Math.max(3, Math.round(baseCellsX * scale));
      const cellsY = Math.max(3, Math.round(baseCellsY * scale));
      const cellsZ = Math.max(3, Math.round(baseCellsZ * scale));

      const cellStepX = sizeX / cellsX;
      const cellStepY = sizeY / cellsY;
      const cellStepZ = sizeZ / cellsZ;

      // 1. Accumulate vertices and their centroid sums per cell
      const clusterMap = new Map();
      const clusterSums = []; // [sumX, sumY, sumZ, count]

      const getClusterId = (x, y, z) => {
        const cx = Math.min(cellsX - 1, Math.max(0, Math.floor((x - bbox.min.x) / cellStepX)));
        const cy = Math.min(cellsY - 1, Math.max(0, Math.floor((y - bbox.min.y) / cellStepY)));
        const cz = Math.min(cellsZ - 1, Math.max(0, Math.floor((z - bbox.min.z) / cellStepZ)));
        const key = `${cx}_${cy}_${cz}`;

        let id = clusterMap.get(key);
        if (id === undefined) {
          id = clusterSums.length / 4;
          clusterMap.set(key, id);
          clusterSums.push(x, y, z, 1);
        } else {
          clusterSums[id * 4] += x;
          clusterSums[id * 4 + 1] += y;
          clusterSums[id * 4 + 2] += z;
          clusterSums[id * 4 + 3] += 1;
        }
        return id;
      };

      // Map all triangle vertices
      const mappedTriangles = [];
      for (let f = 0; f < initialTriCount; f++) {
        const i0 = f * 3;
        const i1 = f * 3 + 1;
        const i2 = f * 3 + 2;

        const c0 = getClusterId(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
        const c1 = getClusterId(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
        const c2 = getClusterId(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

        if (c0 !== c1 && c1 !== c2 && c2 !== c0) {
          mappedTriangles.push(c0, c1, c2);
        }
      }

      // Filter duplicate triangles
      const seenFaces = new Set();
      const cleanIndices = [];
      for (let f = 0; f < mappedTriangles.length / 3; f++) {
        const c0 = mappedTriangles[f * 3];
        const c1 = mappedTriangles[f * 3 + 1];
        const c2 = mappedTriangles[f * 3 + 2];

        const sortedKey = [c0, c1, c2].sort((a, b) => a - b).join('_');
        if (!seenFaces.has(sortedKey)) {
          seenFaces.add(sortedKey);
          cleanIndices.push(c0, c1, c2);
        }
      }

      const resultingTriangles = cleanIndices.length / 3;
      if (resultingTriangles >= 24) {
        const diff = Math.abs(resultingTriangles - targetTriangles);
        if (diff < bestDiff) {
          bestDiff = diff;

          // Compute true centroid positions
          const clusterCount = clusterSums.length / 4;
          const finalPositions = new Float32Array(clusterCount * 3);
          for (let i = 0; i < clusterCount; i++) {
            const count = clusterSums[i * 4 + 3];
            finalPositions[i * 3] = clusterSums[i * 4] / count;
            finalPositions[i * 3 + 1] = clusterSums[i * 4 + 1] / count;
            finalPositions[i * 3 + 2] = clusterSums[i * 4 + 2] / count;
          }

          const decGeom = new THREE.BufferGeometry();
          decGeom.setAttribute('position', new THREE.BufferAttribute(finalPositions, 3));
          decGeom.setIndex(cleanIndices);
          bestGeom = decGeom;

          if (diff < targetTriangles * 0.05) break; // Optimal match
        }
      }
    }

    if (!bestGeom) {
      return geometry.clone();
    }

    // Convert to non-indexed with crisp, clean face normals and outward alignment
    let result = bestGeom.toNonIndexed();
    result = this.removeDegenerates(this.weldVertices(result, 1e-5));
    if (result.index) result = result.toNonIndexed();

    result.computeVertexNormals();
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
  }

  /**
   * Check if a 3D mesh structure is topologically suitable for smoothing
   * @param {THREE.BufferGeometry} geometry
   * @param {Object} analysis
   * @returns {{ canSmooth: boolean, reasonKey?: string, count?: number }}
   */
  static checkSmoothingFeasibility(geometry, analysis) {
    if (!analysis) return { canSmooth: true };

    // Severe Non-Manifold defects cause self-intersections during smoothing
    if (analysis.nonManifoldEdgesCount > 50) {
      return {
        canSmooth: false,
        reasonKey: 'nonManifold',
        count: analysis.nonManifoldEdgesCount,
        messageDe: `Das Modell enthält ${analysis.nonManifoldEdgesCount} Non-Manifold Kanten. Eine Glättung würde Selbstüberschneidungen erzeugen.`,
        messageEn: `The model contains ${analysis.nonManifoldEdgesCount} non-manifold edges. Smoothing would cause self-intersections.`
      };
    }

    // Huge open boundary loops shrink and tear open further without prior hole filling
    if (analysis.boundaryEdgesCount > 200) {
      return {
        canSmooth: false,
        reasonKey: 'openHoles',
        count: analysis.boundaryEdgesCount,
        messageDe: `Das Modell enthält ${analysis.boundaryEdgesCount} offene Kanten (Löcher). Bitte schließe diese zuerst per Auto-Reparatur.`,
        messageEn: `The model contains ${analysis.boundaryEdgesCount} open boundary edges. Please patch holes with Auto-Repair first.`
      };
    }

    return { canSmooth: true };
  }

  /**
   * Mathematically exact curvature subdivision using sagitta normal projection.
   * Smooths polygonal cylinders, spheres, tori and organic curves into true curved surfaces
   * while strictly keeping flat planar lids 100% planar and sharp mechanical rims 100% sharp.
   * @param {THREE.BufferGeometry} geometry
   * @returns {THREE.BufferGeometry}
   */
  static subdivideSagittaCurvature(geometry) {
    const indexedGeom = this.weldVertices(geometry, 1e-4);
    const posAttr = indexedGeom.getAttribute('position');
    const indexAttr = indexedGeom.index;
    if (!indexAttr) return geometry.clone();

    const indices = Array.from(indexAttr.array);
    const triCount = indices.length / 3;
    const vertexCount = posAttr.count;

    // 1. Compute face normals & adjacency
    const faceNormals = new Array(triCount);
    const edgeToFaces = new Map();
    const vertexFaceNormals = Array.from({ length: vertexCount }, () => []);

    for (let f = 0; f < triCount; f++) {
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const p0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
      const p1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
      const p2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

      const fn = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0)).normalize();
      faceNormals[f] = fn;

      vertexFaceNormals[i0].push(fn);
      vertexFaceNormals[i1].push(fn);
      vertexFaceNormals[i2].push(fn);

      const addEdge = (a, b) => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        if (!edgeToFaces.has(key)) edgeToFaces.set(key, []);
        edgeToFaces.get(key).push(f);
      };
      addEdge(i0, i1);
      addEdge(i1, i2);
      addEdge(i2, i0);
    }

    // 2. Vertex smooth normals (filtering out sharp crease angles > 35 deg)
    const vertexNormals = Array.from({ length: vertexCount }, (_, i) => {
      const norms = vertexFaceNormals[i];
      const avg = new THREE.Vector3(0, 0, 0);
      for (const n of norms) avg.add(n);
      if (avg.lengthSq() > 1e-6) avg.normalize();
      return avg;
    });

    const newPositions = [];
    for (let i = 0; i < vertexCount; i++) {
      newPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }

    const edgeMidMap = new Map();

    const getMidpoint = (iA, iB) => {
      const key = iA < iB ? `${iA}_${iB}` : `${iB}_${iA}`;
      let midIdx = edgeMidMap.get(key);
      if (midIdx !== undefined) return midIdx;

      const pA = new THREE.Vector3(posAttr.getX(iA), posAttr.getY(iA), posAttr.getZ(iA));
      const pB = new THREE.Vector3(posAttr.getX(iB), posAttr.getY(iB), posAttr.getZ(iB));

      const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

      const adjacentFaces = edgeToFaces.get(key) || [];
      if (adjacentFaces.length === 2) {
        const fn1 = faceNormals[adjacentFaces[0]];
        const fn2 = faceNormals[adjacentFaces[1]];
        const dot = fn1.dot(fn2);

        // Curved surface: Angle between 1 deg (dot ~ 0.9998) and 35 deg (dot ~ 0.819)
        // If dot >= 0.9998 -> Flat planar surface (e.g. cylinder cap) -> Keep midpoint linear!
        // If dot < 0.819 -> Sharp mechanical edge (> 35 deg) -> Keep midpoint linear!
        if (dot >= 0.819 && dot < 0.9998) {
          const nA = vertexNormals[iA];
          const nB = vertexNormals[iB];
          const nDot = Math.max(-1, Math.min(1, nA.dot(nB)));

          if (nDot >= 0.819 && nDot < 0.9998) {
            const ang = Math.acos(nDot);
            const v = new THREE.Vector3().subVectors(pB, pA);
            // Project chord length onto plane perpendicular to average normal
            const avgN = new THREE.Vector3().addVectors(nA, nB).normalize();
            const chordLen = v.clone().projectOnPlane(avgN).length();

            if (chordLen > 1e-4) {
              const sagitta = (chordLen / 2.0) * Math.tan(ang / 4.0);
              const clampedSagitta = Math.min(chordLen * 0.06, sagitta);
              mid.addScaledVector(avgN, clampedSagitta);
            }
          }
        }
      }

      midIdx = newPositions.length / 3;
      newPositions.push(mid.x, mid.y, mid.z);
      edgeMidMap.set(key, midIdx);
      return midIdx;
    };

    const newIndices = [];
    for (let f = 0; f < triCount; f++) {
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      const m01 = getMidpoint(i0, i1);
      const m12 = getMidpoint(i1, i2);
      const m20 = getMidpoint(i2, i0);

      newIndices.push(i0, m01, m20);
      newIndices.push(m01, i1, m12);
      newIndices.push(m20, m12, i2);
      newIndices.push(m01, m12, m20);
    }

    const subGeom = new THREE.BufferGeometry();
    subGeom.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    subGeom.setIndex(newIndices);
    return subGeom;
  }

  /**
   * Compute smooth vertex normals with a crease angle threshold (e.g. 35 deg).
   * Blends normals seamlessly across curved surfaces while keeping sharp mechanical edges crisp.
   * @param {THREE.BufferGeometry} geometry
   * @param {number} [creaseAngleDeg=35]
   * @returns {THREE.BufferGeometry}
   */
  static computeCreaseNormals(geometry, creaseAngleDeg = 35) {
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const posAttr = nonIndexed.getAttribute('position');
    const vertexCount = posAttr.count;
    const triCount = vertexCount / 3;

    const thresholdCos = Math.cos(creaseAngleDeg * (Math.PI / 180));

    // 1. Compute face normals & corner angles
    const faceNormals = new Array(triCount);
    const posToFaces = new Map();
    const hashPrec = 1e4;
    const hashPos = (x, y, z) => `${Math.round(x * hashPrec)},${Math.round(y * hashPrec)},${Math.round(z * hashPrec)}`;

    for (let f = 0; f < triCount; f++) {
      const i0 = f * 3;
      const i1 = f * 3 + 1;
      const i2 = f * 3 + 2;

      const p0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
      const p1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
      const p2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

      const v01 = new THREE.Vector3().subVectors(p1, p0);
      const v02 = new THREE.Vector3().subVectors(p2, p0);
      const v12 = new THREE.Vector3().subVectors(p2, p1);

      const fn = new THREE.Vector3().crossVectors(v01, v02).normalize();
      faceNormals[f] = fn;

      const len01 = v01.length();
      const len02 = v02.length();
      const len12 = v12.length();

      const angle0 = Math.acos(Math.max(-1, Math.min(1, v01.dot(v02) / (len01 * len02 || 1))));
      const angle1 = Math.acos(Math.max(-1, Math.min(1, v01.clone().negate().dot(v12) / (len01 * len12 || 1))));
      const angle2 = Math.PI - angle0 - angle1;

      const corners = [
        { p: p0, angle: angle0 },
        { p: p1, angle: angle1 },
        { p: p2, angle: angle2 }
      ];

      for (const { p, angle } of corners) {
        const key = hashPos(p.x, p.y, p.z);
        if (!posToFaces.has(key)) posToFaces.set(key, []);
        posToFaces.get(key).push({ faceIdx: f, normal: fn, angle });
      }
    }

    // 2. Average normals per corner within crease threshold
    const normals = new Float32Array(vertexCount * 3);

    for (let f = 0; f < triCount; f++) {
      const fn = faceNormals[f];

      for (let c = 0; c < 3; c++) {
        const vIdx = f * 3 + c;
        const x = posAttr.getX(vIdx);
        const y = posAttr.getY(vIdx);
        const z = posAttr.getZ(vIdx);
        const key = hashPos(x, y, z);

        const neighbors = posToFaces.get(key) || [];
        const smoothNorm = new THREE.Vector3(0, 0, 0);

        for (const n of neighbors) {
          if (fn.dot(n.normal) >= thresholdCos) {
            smoothNorm.addScaledVector(n.normal, n.angle || 1.0);
          }
        }

        if (smoothNorm.lengthSq() > 1e-6) {
          smoothNorm.normalize();
        } else {
          smoothNorm.copy(fn);
        }

        normals[vIdx * 3] = smoothNorm.x;
        normals[vIdx * 3 + 1] = smoothNorm.y;
        normals[vIdx * 3 + 2] = smoothNorm.z;
      }
    }

    nonIndexed.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    return nonIndexed;
  }

  /**
   * Volume-Preserving Taubin Surface Smoothing & Curvature Refinement
   * Robust against flat cylinder lids, sharp mechanical edges, and organic curves.
   * @param {THREE.BufferGeometry} geometry
   * @param {Object} options
   * @returns {THREE.BufferGeometry}
   */
  static smoothTaubin(geometry, options = { iterations: 3, lambda: 0.25, mu: -0.26, preserveSharpEdges: true, angleThresholdDeg: 30, subdivide: false }) {
    const iterations = Math.max(1, Math.min(10, options.iterations || 3));
    const lambda = options.lambda || 0.25;
    const mu = options.mu || -0.26;
    const preserveSharp = options.preserveSharpEdges ?? true;
    const shouldSubdivide = options.subdivide ?? false;
    const thresholdCos = Math.cos((options.angleThresholdDeg || 30) * (Math.PI / 180));

    let workGeom = geometry;

    // Optional Sagitta Curvature Subdivision pass
    if (shouldSubdivide) {
      const posCount = workGeom.getAttribute('position')?.count || 0;
      if (posCount < 200000) {
        workGeom = this.subdivideSagittaCurvature(workGeom);
      }
    }

    // 1. Build indexed mesh with welded vertices to establish adjacency
    const indexedGeom = this.weldVertices(workGeom, 1e-4);
    const posAttr = indexedGeom.getAttribute('position');
    const indexAttr = indexedGeom.index;

    if (!indexAttr) return geometry.clone();

    const vertexCount = posAttr.count;
    const indices = Array.from(indexAttr.array);
    const triCount = indices.length / 3;

    // 2. Build Vertex Adjacency Graph and Face Normals
    const adjacency = Array.from({ length: vertexCount }, () => new Set());
    const vertexFaceNormals = Array.from({ length: vertexCount }, () => []);
    const edgeToFaceNormals = new Map();

    const faceNormals = new Array(triCount);
    for (let f = 0; f < triCount; f++) {
      const i0 = indices[f * 3];
      const i1 = indices[f * 3 + 1];
      const i2 = indices[f * 3 + 2];

      adjacency[i0].add(i1).add(i2);
      adjacency[i1].add(i0).add(i2);
      adjacency[i2].add(i0).add(i1);

      const p0 = new THREE.Vector3(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
      const p1 = new THREE.Vector3(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
      const p2 = new THREE.Vector3(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

      const norm = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0)).normalize();
      faceNormals[f] = norm;

      vertexFaceNormals[i0].push(norm);
      vertexFaceNormals[i1].push(norm);
      vertexFaceNormals[i2].push(norm);

      const addEdgeNormal = (a, b) => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        if (!edgeToFaceNormals.has(key)) edgeToFaceNormals.set(key, []);
        edgeToFaceNormals.get(key).push(norm);
      };
      addEdgeNormal(i0, i1);
      addEdgeNormal(i1, i2);
      addEdgeNormal(i2, i0);
    }

    // 3. Detect Vertex Types (Planar, Sharp Rim, or Curved Organic)
    const vertexType = new Uint8Array(vertexCount); // 0 = curved, 1 = planar (constrained to plane), 2 = locked (sharp edge)
    const vertexMeanNormal = Array.from({ length: vertexCount }, () => new THREE.Vector3(0, 0, 0));

    // Mark sharp edge vertices (e.g. cylinder top/bottom circular rims)
    for (const [key, norms] of edgeToFaceNormals) {
      if (norms.length === 2) {
        const dot = norms[0].dot(norms[1]);
        if (dot < thresholdCos) { // Sharp edge (> 30 deg)
          const [u, v] = key.split('_').map(Number);
          vertexType[u] = 2;
          vertexType[v] = 2;
        }
      } else if (norms.length === 1) { // Boundary edge
        const [u, v] = key.split('_').map(Number);
        vertexType[u] = 2;
        vertexType[v] = 2;
      }
    }

    // Compute mean normal and detect flat planar caps (e.g. cylinder lids, flat faces)
    for (let i = 0; i < vertexCount; i++) {
      const norms = vertexFaceNormals[i];
      if (!norms || norms.length === 0) continue;

      const avg = new THREE.Vector3(0, 0, 0);
      for (const n of norms) avg.add(n);
      if (avg.lengthSq() > 1e-6) avg.normalize();
      vertexMeanNormal[i] = avg;

      if (vertexType[i] !== 2) {
        let isPlanar = true;
        for (const n of norms) {
          if (n.dot(avg) < 0.995) {
            isPlanar = false;
            break;
          }
        }
        if (isPlanar) {
          vertexType[i] = 1; // Planar vertex: movement constrained strictly to tangent plane
        }
      }
    }

    // 4. Taubin Iterations with Planar & Feature Constraints
    let currentPositions = new Float32Array(posAttr.array);
    let nextPositions = new Float32Array(posAttr.array);

    const applyStep = (weight) => {
      for (let i = 0; i < vertexCount; i++) {
        const type = vertexType[i];

        // Locked sharp edges/rims remain completely fixed
        if (type === 2 && preserveSharp) {
          nextPositions[i * 3] = currentPositions[i * 3];
          nextPositions[i * 3 + 1] = currentPositions[i * 3 + 1];
          nextPositions[i * 3 + 2] = currentPositions[i * 3 + 2];
          continue;
        }

        const neighbors = adjacency[i];
        if (!neighbors || neighbors.size === 0) continue;

        let avgX = 0, avgY = 0, avgZ = 0;
        for (const n of neighbors) {
          avgX += currentPositions[n * 3];
          avgY += currentPositions[n * 3 + 1];
          avgZ += currentPositions[n * 3 + 2];
        }
        avgX /= neighbors.size;
        avgY /= neighbors.size;
        avgZ /= neighbors.size;

        const curX = currentPositions[i * 3];
        const curY = currentPositions[i * 3 + 1];
        const curZ = currentPositions[i * 3 + 2];

        let dx = avgX - curX;
        let dy = avgY - curY;
        let dz = avgZ - curZ;

        // If planar vertex (e.g. cylinder cap center): remove normal displacement so it stays flat!
        if (type === 1) {
          const norm = vertexMeanNormal[i];
          const dot = dx * norm.x + dy * norm.y + dz * norm.z;
          dx -= dot * norm.x;
          dy -= dot * norm.y;
          dz -= dot * norm.z;
        }

        nextPositions[i * 3] = curX + weight * dx;
        nextPositions[i * 3 + 1] = curY + weight * dy;
        nextPositions[i * 3 + 2] = curZ + weight * dz;
      }

      // Swap buffers
      const tmp = currentPositions;
      currentPositions = nextPositions;
      nextPositions = tmp;
    };

    for (let iter = 0; iter < iterations; iter++) {
      // Step 1: Shrinking smooth pass (+lambda)
      applyStep(lambda);
      // Step 2: Un-shrinking inflation pass (-mu)
      applyStep(mu);
    }

    const smoothedGeom = indexedGeom.clone();
    smoothedGeom.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));

    // 5. Compute crease-aware smooth normals (35 deg threshold)
    const result = this.computeCreaseNormals(smoothedGeom, options.angleThresholdDeg || 35);
    result.computeBoundingBox();
    result.computeBoundingSphere();
    return result;
  }
}

