# MeshDoc 🩺 3D Print Mesh Repair & Analyzer

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg?style=flat-square)](https://github.com/Exulizer/MeshDoc)
[![License: Custom](https://img.shields.io/badge/License-Source--Available-yellow.svg?style=flat-square)](LICENSE)
[![Zero-Upload](https://img.shields.io/badge/Privacy-100%25%20Zero--Upload-emerald.svg?style=flat-square)](http://meshdoc.svender3d.de/)
[![WebGL: Three.js](https://img.shields.io/badge/3D-Three.js%20WebGL-black.svg?style=flat-square)](https://threejs.org/)
[![Server: Hetzner](https://img.shields.io/badge/Backend-Hetzner%20PHP%20Mailer-red.svg?style=flat-square)](https://www.hetzner.com/)

> **100% Client-Side 3D Mesh Diagnostics & Auto-Repair Engine for Additive Manufacturing & 3D Printing.**
> Automated repair of broken STL, OBJ, and 3MF files directly in browser memory — Zero-Upload, no cloud dependencies, maximum privacy.

🌐 **Website & Live Tool:** [http://meshdoc.svender3d.de/](http://meshdoc.svender3d.de/)

---

## ✨ Features & Capabilities

### 1. 🔒 100% Zero-Upload & Maximum Privacy (GDPR)
* All file operations (parsing, diagnostics, ear-clipping hole repair, vertex welding, and export) execute strictly **locally inside client browser memory** (`Float32Array`, `Blob`, `ArrayBuffer`).
* No server uploads, no cloud dependencies, and no third-party CDNs (all fonts and Three.js modules are self-hosted).

### 2. ⚡ Deep Multi-Pass Force-Repair Pipeline (v1.4)
* **Remove Redundant CAD Duplicate Faces:** Identifies and cleans overlapping triangles from complex multi-body CAD exports.
* **Planar Ear-Clipping Hole Triangulation:** Reliable closure of open boundary loops and missing surface patches.
* **Topological BFS Surface Normal Alignment:** Consistent outward-facing normal winding propagation across shared edge graphs.
* **Spatial Vertex Welding:** Merges duplicated co-located vertices using a spatial hash table.
* **Sharp CAD Facet Shading:** Recalculates exact face normals for crystal-clear geometry rendering.

### 3. 🔬 Interactive 3D Viewport & Live Laser Hologram Scanner
* **Live 3D Scanning Laser:** Animated visual scanning HUD during the repair process with real-time multi-step progress feedback.
* **Zero-Offset Defect Lines:** Open edges (Red) and non-manifold edges (Yellow) are rigidly parented to the model for perfect alignment.
* **Comparison Modes:** *Original*, *Repaired*, and *Split-View* (Side-by-side pre/post inspection).
* **Bed Alignment Tools:** 1-click drop to build bed (`Z = 0`) and centering on a 220 x 220 mm build plate.

### 4. 📊 Detailed Diagnostics & Interactive Accordions
* Expandable diagnostic cards explaining the **exact root cause in 3D slicers** and the **applied algorithmic solution**.
* Metrics: Triangle count, vertices, dimensions (X × Y × Z in mm), surface area (cm²), and signed volume (cm³).
* **Slicer-Readiness Assessment:** Evaluated for Bambu Studio, OrcaSlicer, PrusaSlicer, and Ultimaker Cura.

### 5. ⚖️ Filament & Material Estimator
* Automatic calculation of model weight (g) and filament length (m) for **PLA, PETG, ABS, and TPU** with customizable infill (0 – 100%).

### 6. 💾 Multi-Format Export
* **Binary STL:** Compact binary STL for all 3D printing slicers.
* **ASCII STL:** Human-readable STL format.
* **3MF:** Modern 3D Manufacturing Format container packaging.
* **Wavefront OBJ:** Universal 3D polygonal geometry.

### 7. 📬 Hetzner-Server Backend (`contact.php`)
* Secure PHP backend for Hetzner Webhosting & Cloud servers.
* Anti-spam honeypot, header injection protection, rate limiting, and SPF/DMARC compliant delivery to `info@svender3d.de`.

---
