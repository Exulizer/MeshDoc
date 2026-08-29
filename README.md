# MeshDoc 🩺 3D Print Mesh Repair & Analyzer

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg?style=flat-square)](https://github.com/svender3d/mesh-repair-3d)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Zero-Upload](https://img.shields.io/badge/Privacy-100%25%20Zero--Upload-emerald.svg?style=flat-square)](https://www.svender3d.de/datenschutz.html)
[![WebGL: Three.js](https://img.shields.io/badge/3D-Three.js%20WebGL-black.svg?style=flat-square)](https://threejs.org/)
[![Server: Hetzner](https://img.shields.io/badge/Backend-Hetzner%20PHP%20Mailer-red.svg?style=flat-square)](https://www.hetzner.com/)

> **100% Client-Side 3D Mesh Repair & Analysis Engine for Additive Manufacturing & 3D Printing.**
> Fully automated repair of defective STL, OBJ, and 3MF files inside browser memory — Zero-Upload, no cloud dependencies, maximum privacy.

🌐 **Website & Live Tool:** [https://www.svender3d.de](https://www.svender3d.de)

---

## ✨ Features & Capabilities

### 1. 🔒 100% Zero-Upload & Maximum Privacy (GDPR)
* All file operations (parsing, diagnostics, ear-clipping repair, vertex welding, export) run strictly **locally inside browser memory** (Float32Array, Blob, ArrayBuffer).
* No server uploads, no cloud dependencies, and no third-party CDNs (all fonts and Three.js modules are self-hosted).

### 2. ⚡ Deep Multi-Pass Force-Repair Pipeline (v1.4)
* **Remove Redundant CAD Duplicate Faces:** Identifies and cleans overlapping triangles from complex multi-body CAD exports.
* **Planar Ear-Clipping Hole Triangulation:** Reliable closure of open boundary loops and polygonal holes.
* **Topological BFS Surface Normal Alignment:** Consistent triangle winding propagation across shared edge graphs.
* **Spatial Vertex Welding:** Merges duplicated co-located vertices using a spatial hash table.
* **Sharp CAD Facet Shading:** Recalculates exact face normals for crystal-clear geometry rendering.

### 3. 🔬 Interactive 3D Viewport & Live Laser Hologram Scanner
* **Live 3D Scanning Laser:** Animated visual scanning HUD during the repair process with real-time multi-step progress feedback.
* **Zero-Offset Defect Lines:** Open edges (Red) and non-manifold edges (Yellow) are rigidly parented to the model for perfect alignment.
* **Comparison Modes:** *Original*, *Repaired*, and *Split-View* (Side-by-side pre/post inspection).
* **Bed Alignment Tools:** 1-click drop to build bed (Z = 0) and centering on a 220 x 220 mm build plate.

### 4. 📊 Detailed Diagnostics & Interactive Accordions
* Expandable diagnostic cards explaining the **exact root cause in 3D slicers** and the **applied algorithmic solution**.
* Metrics: Triangle count, vertices, dimensions ( \times Y \times Z$ in mm), surface area (^2$), and signed volume (^3$).
* **Slicer-Readiness Assessment:** Evaluated for Bambu Studio, OrcaSlicer, PrusaSlicer, and Ultimaker Cura.

### 5. ⚖️ Filament & Material Estimator
* Automatic calculation of model weight (g) and filament length (m) for **PLA, PETG, ABS, and TPU** with customizable infill ( - 100\%$).

### 6. 💾 Multi-Format Export
* **Binary STL:** Compact binary STL for all 3D printing slicers.
* **ASCII STL:** Human-readable STL format.
* **3MF:** Modern 3D Manufacturing Format container packaging.
* **Wavefront OBJ:** Universal 3D polygonal geometry.

### 7. 📬 Hetzner-Server Backend (contact.php)
* Secure PHP backend for Hetzner Webhosting & Cloud servers.
* Anti-spam honeypot, header injection protection, rate limiting, and SPF/DMARC compliant delivery to info@svender3d.de.

---

## 📁 Project Structure

`
mesh-repair-3d/
├── index.html              # Main UI Dashboard (Bento-Grid)
├── contact.php             # Hetzner PHP-Mailer Backend (info@svender3d.de)
├── robots.txt              # SEO & Crawler Configuration
├── llms.txt                # AI Tool Documentation
├── assets/
│   ├── css/
│   │   ├── variables.css   # Dark-Mode Design Tokens & Colors
│   │   ├── base.css        # Layout & Grid System
│   │   ├── components.css  # Viewer, Cards, Accordions, Laser-HUD
│   │   ├── modals.css      # Dialogs, Changelog, Contact Form
│   │   ├── fonts.css       # Self-Hosted WOFF2 Webfonts
│   │   └── style.min.css   # Minified Production Bundle
│   ├── fonts/              # Self-Hosted Inter & JetBrains Mono
│   ├── js/
│   │   ├── app.js          # Application Lifecycle & State Management
│   │   ├── viewer.js       # Three.js WebGL 3D Viewport
│   │   ├── analyzer.js     # Topology Analysis & Diagnostics
│   │   ├── repair.js       # Multi-Pass Repair & Ear-Clipping
│   │   ├── exporter.js     # STL, 3MF & OBJ Exporters
│   │   ├── i18n.js         # Bilingual Localization Engine (EN/DE)
│   │   ├── contact-form.js # Async Form Transmission
│   │   └── cookie-consent.js # Local Privacy Settings
│   └── vendor/
│       ├── three/          # Local Three.js Modules & OrbitControls
│       └── jszip/          # Local JSZip Library
└── README.md
`

---

## 🚀 Quick Start & Local Execution

No build step or Node.js environment required!

### With Python:
`ash
python -m http.server 8080
`
Open [http://localhost:8080](http://localhost:8080) in your browser.

### With Node.js (npx):
`ash
npx serve .
`

---

## 🌐 Deployment to Hetzner Webhosting

1. Connect via SFTP to your Hetzner Webhosting (konsoleH) or VPS.
2. Upload all files into your domain's public document root (e.g. public_html/ or www/).
3. Done! The web application and the PHP mailer backend (contact.php) work instantly out-of-the-box.

---

## 📄 License & Credits

Developed by **Sven Harzer** ([svender3d.de](https://www.svender3d.de))  
Licensed under the **MIT License**.
