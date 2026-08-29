import * as THREE from 'three';

export class MeshRepairer {
  /**
   * Complete Deep Auto-Repair pipeline (Iterative Multi-Pass Convergence)
   * @param {THREE.BufferGeometry} geometry
   * @param {Object} options
   * @returns {THREE.BufferGeometry}
   */
  static autoRepair(geometry, options = { closeHoles: true, fixNormals: true, weldTolerance: 1e-4 }) {
    let repaired = geometry.clone();

    // Multi-pass iterative repair to handle cascaded multi-body defects
    const passes = 2;
    for (let pass = 0; pass < passes; pass++) {
      // 1. Spatial vertex welding
      repaired = this.weldVertices(repaired, options.weldTolerance || 1e-4);

      // 2. Remove degenerate & duplicate triangles
      repaired = this.removeDegenerates(repaired);
      repaired = this.removeDuplicateFaces(repaired);

      // 3. Close open boundary loops (Ear-Clipping)
      if (options.closeHoles) {
        repaired = this.closeHoles(repaired);
      }
    }

    // 4. Orient normals consistently and outward using BFS
    if (options.fixNormals) {
      repaired = this.orientNormalsOutward(repaired);
    }

    // 5. Convert to clean non-indexed geometry with crisp, razor-sharp face normals
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
   * @returns {THREE.BufferGeometry}
   */
  static closeHoles(geometry) {
    const posAttr = geometry.getAttribute('position');
    const indexAttr = geometry.index;
    if (!indexAttr) return geometry;

    const indices = Array.from(indexAttr.array);
    const triCount = indices.length / 3;

    // Find all boundary directed half-edges
    const edgeCounts = new Map();
    const halfEdges = new Map(); // u1 -> u2

    for (let f = 0; f < triCount; f++) {
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
   * @returns {THREE.BufferGeometry}
   */
  static orientNormalsOutward(geometry) {
    const posAttr = geometry.getAttribute('position');
    const indexAttr = geometry.index;
    if (!indexAttr) return geometry;

    const indices = Array.from(indexAttr.array);
    const triCount = indices.length / 3;

    // 1. Build half-edge to face map for adjacency graph
    const edgeToFaces = new Map();
    for (let f = 0; f < triCount; f++) {
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
    for (let startF = 0; startF < triCount; startF++) {
      if (visited[startF]) continue;

      const queue = [startF];
      visited[startF] = 1;

      while (queue.length > 0) {
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
   * Fast Mesh Decimation (Polygon Reduction) via Vertex Clustering
   * @param {THREE.BufferGeometry} geometry
   * @param {number} targetRatio - Target face ratio between 0.05 and 1.0 (e.g. 0.5 for 50%)
   * @returns {THREE.BufferGeometry}
   */
  static decimate(geometry, targetRatio = 0.5) {
    if (targetRatio >= 0.99) return geometry.clone();

    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    const posAttr = nonIndexed.getAttribute('position');
    const triCount = posAttr.count / 3;

    nonIndexed.computeBoundingBox();
    const bbox = nonIndexed.boundingBox;
    const maxDim = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z);

    // Compute grid cell resolution based on reduction ratio
    // Target clusters ~ triCount * targetRatio
    const targetTriangles = Math.max(12, Math.floor(triCount * targetRatio));
    const targetCells = Math.cbrt(targetTriangles * 2);
    const cellSize = maxDim / Math.max(8, targetCells);

    const clusterMap = new Map();
    const clusterPositions = [];

    const getClusterId = (x, y, z) => {
      const cx = Math.floor((x - bbox.min.x) / cellSize);
      const cy = Math.floor((y - bbox.min.y) / cellSize);
      const cz = Math.floor((z - bbox.min.z) / cellSize);
      const key = `${cx}_${cy}_${cz}`;

      let id = clusterMap.get(key);
      if (id === undefined) {
        id = clusterPositions.length / 3;
        clusterMap.set(key, id);
        // Cluster representative is cell center or average
        clusterPositions.push(x, y, z);
      }
      return id;
    };

    const newIndices = [];
    for (let f = 0; f < triCount; f++) {
      const i0 = f * 3;
      const i1 = f * 3 + 1;
      const i2 = f * 3 + 2;

      const c0 = getClusterId(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0));
      const c1 = getClusterId(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
      const c2 = getClusterId(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));

      // Discard collapsed triangles (all or 2 vertices in same cluster)
      if (c0 !== c1 && c1 !== c2 && c2 !== c0) {
        newIndices.push(c0, c1, c2);
      }
    }

    // If over-collapsed, fallback to original
    if (newIndices.length < 12) {
      return geometry.clone();
    }

    const decimated = new THREE.BufferGeometry();
    decimated.setAttribute('position', new THREE.Float32BufferAttribute(clusterPositions, 3));
    decimated.setIndex(newIndices);
    decimated.computeVertexNormals();
    decimated.computeBoundingBox();
    decimated.computeBoundingSphere();
    return decimated;
  }
}
