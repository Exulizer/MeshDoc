/**
 * exporter.js - 100% Client-side 3D Mesh Exporter
 * Generates Binary STL, ASCII STL, Wavefront OBJ, and 3MF files directly in the browser.
 */

export class MeshExporter {
  /**
   * Export BufferGeometry to Binary STL ArrayBuffer
   * @param {THREE.BufferGeometry} geometry
   * @returns {ArrayBuffer}
   */
  static toBinarySTL(geometry) {
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    const posAttr = nonIndexed.getAttribute('position');
    const normalAttr = nonIndexed.getAttribute('normal');
    const triangleCount = posAttr.count / 3;

    // Binary STL size: 80 bytes header + 4 bytes triCount + (50 bytes * triCount)
    const bufferLength = 84 + 50 * triangleCount;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const dataView = new DataView(arrayBuffer);

    // 80 bytes header
    const headerStr = '3D Print Mesh Repair Tool (100% Client-Side Local Zero-Upload)';
    for (let i = 0; i < Math.min(80, headerStr.length); i++) {
      dataView.setUint8(i, headerStr.charCodeAt(i));
    }

    // 4 bytes triangle count (little endian)
    dataView.setUint32(80, triangleCount, true);

    let offset = 84;
    for (let f = 0; f < triangleCount; f++) {
      const idx = f * 3;

      // Normal (if not present, calculate on the fly)
      let nx = 0, ny = 0, nz = 1;
      if (normalAttr) {
        nx = normalAttr.getX(idx);
        ny = normalAttr.getY(idx);
        nz = normalAttr.getZ(idx);
      }

      dataView.setFloat32(offset, nx, true);
      dataView.setFloat32(offset + 4, ny, true);
      dataView.setFloat32(offset + 8, nz, true);
      offset += 12;

      // 3 Vertices (V1, V2, V3)
      for (let v = 0; v < 3; v++) {
        const vIdx = idx + v;
        dataView.setFloat32(offset, posAttr.getX(vIdx), true);
        dataView.setFloat32(offset + 4, posAttr.getY(vIdx), true);
        dataView.setFloat32(offset + 8, posAttr.getZ(vIdx), true);
        offset += 12;
      }

      // 2 bytes attribute byte count (usually 0)
      dataView.setUint16(offset, 0, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  /**
   * Export BufferGeometry to ASCII STL string
   * @param {THREE.BufferGeometry} geometry
   * @param {string} solidName
   * @returns {string}
   */
  static toAsciiSTL(geometry, solidName = 'repaired_mesh') {
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    const posAttr = nonIndexed.getAttribute('position');
    const normalAttr = nonIndexed.getAttribute('normal');
    const triangleCount = posAttr.count / 3;

    let output = `solid ${solidName}\n`;

    for (let f = 0; f < triangleCount; f++) {
      const idx = f * 3;
      let nx = 0, ny = 0, nz = 1;
      if (normalAttr) {
        nx = normalAttr.getX(idx);
        ny = normalAttr.getY(idx);
        nz = normalAttr.getZ(idx);
      }

      output += `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
      output += '    outer loop\n';
      for (let v = 0; v < 3; v++) {
        const vIdx = idx + v;
        output += `      vertex ${posAttr.getX(vIdx).toFixed(6)} ${posAttr.getY(vIdx).toFixed(6)} ${posAttr.getZ(vIdx).toFixed(6)}\n`;
      }
      output += '    endloop\n';
      output += '  endfacet\n';
    }

    output += `endsolid ${solidName}\n`;
    return output;
  }

  /**
   * Export BufferGeometry to Wavefront OBJ string
   * @param {THREE.BufferGeometry} geometry
   * @returns {string}
   */
  static toOBJ(geometry) {
    const posAttr = geometry.getAttribute('position');
    const isIndexed = geometry.index !== null;
    let output = '# Exported by 3D Print Mesh Repairer (Zero-Upload)\n';

    // Vertices
    for (let i = 0; i < posAttr.count; i++) {
      output += `v ${posAttr.getX(i).toFixed(6)} ${posAttr.getY(i).toFixed(6)} ${posAttr.getZ(i).toFixed(6)}\n`;
    }

    // Faces (1-indexed)
    if (isIndexed) {
      const indexAttr = geometry.index;
      for (let i = 0; i < indexAttr.count; i += 3) {
        output += `f ${indexAttr.getX(i) + 1} ${indexAttr.getX(i + 1) + 1} ${indexAttr.getX(i + 2) + 1}\n`;
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        output += `f ${i + 1} ${i + 2} ${i + 3}\n`;
      }
    }

    return output;
  }

  /**
   * Export BufferGeometry to 3MF (XML Model within OPC ZIP package)
   * @param {THREE.BufferGeometry} geometry
   * @returns {Promise<Blob>}
   */
  static async to3MF(geometry) {
    // Generate 3dmodel.model XML
    const posAttr = geometry.getAttribute('position');
    const isIndexed = geometry.index !== null;

    let verticesXml = '';
    for (let i = 0; i < posAttr.count; i++) {
      verticesXml += `        <vertex x="${posAttr.getX(i).toFixed(5)}" y="${posAttr.getY(i).toFixed(5)}" z="${posAttr.getZ(i).toFixed(5)}" />\n`;
    }

    let trianglesXml = '';
    if (isIndexed) {
      const indexAttr = geometry.index;
      for (let i = 0; i < indexAttr.count; i += 3) {
        trianglesXml += `        <triangle v1="${indexAttr.getX(i)}" v2="${indexAttr.getX(i + 1)}" v3="${indexAttr.getX(i + 2)}" />\n`;
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        trianglesXml += `        <triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" />\n`;
      }
    }

    const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">Repaired 3D Print Model</metadata>
  <metadata name="Application">Zero-Upload 3D Print Mesh Repairer</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;

    // Check if JSZip is loaded on window
    if (window.JSZip) {
      const zip = new window.JSZip();
      zip.file('[Content_Types].xml', contentTypesXml);
      zip.file('_rels/.rels', relsXml);
      zip.file('3D/3dmodel.model', modelXml);
      return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });
    } else {
      // Fallback to XML Model file Blob
      return new Blob([modelXml], { type: 'application/xml' });
    }
  }

  /**
   * Trigger local browser file download
   * @param {Blob|ArrayBuffer|string} content
   * @param {string} filename
   * @param {string} mimeType
   */
  static downloadFile(content, filename, mimeType = 'application/octet-stream') {
    let blob;
    if (content instanceof Blob) {
      blob = content;
    } else if (content instanceof ArrayBuffer) {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = new Blob([content], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
