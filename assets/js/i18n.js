/**
 * i18n.js - Complete German (DE) and English (EN) Internationalization Engine
 * Ensures 100% pure translations with zero language mixing.
 */

export const translations = {
  de: {
    // Header & Meta
    skipToContent: "Zum Inhalt springen",
    pageTitle: "MeshDoc – Kostenlose Online 3D-Mesh Diagnose & STL Reparatur",
    ogTitle: "MeshDoc – Kostenlose Online 3D-Mesh Diagnose & STL Reparatur",
    appTitle: "MeshDoc – STL Repair & Mesh Diagnose Tool",
    appSubtitle: "Fehlerhafte STL-Dateien analysieren, reparieren und slicerfertig exportieren.",
    appDescription: "MeshDoc ist ein spezialisiertes Browser-Werkzeug für 3D-Druck-Anwender zur schnellen Reparatur defekter STL-, OBJ- und 3MF-Meshes. Die Anwendung schließt offene Netzlöcher, korrigiert Non-Manifold-Kanten und richtet invertierte Normalen automatisch für fehlerfreies Slicing aus. Alle Rechenschritte erfolgen zu 100% lokal auf deinem Gerät ohne Cloud-Upload.",
    metaDescription: "Kostenlos & Zero-Upload: Repariere 3D-Dateien 100% lokal im Browser. Automatische Korrektur von Non-Manifold-Kanten, Löchern & Normalen für STL, OBJ und 3MF.",
    privacyBadge: "100% Lokale Verarbeitung (Zero-Upload)",
    contactBtn: "✉️ Kontakt",

    // Left Sidebar: Diagnostics & Upload
    uploadHeading: "STL-Datei hochladen & prüfen",
    diagnosticsTitle: "Mesh-Diagnose",
    dropzoneTitle: "Datei ablegen oder hier klicken",
    dropzoneSubtitle: "STL, OBJ oder 3MF per Drag & Drop",
    sampleSelectDefault: "Beispiel-Modell testen...",
    sampleBrokenCube: "⚠️ Würfel mit Loch (Non-Manifold Test)",
    sampleCylinder: "⚠️ Offener Zylinder (Boundary Test)",
    sampleTorus: "✅ Perfekter Torus (Geschlossener Manifold)",

    // Pipeline
    pipeUpload: "1. Upload",
    pipeAnalyze: "2. Analyse",
    pipeRepair: "3. Reparatur",
    pipeExport: "4. Slicer-Ready",

    // Section 2: Before / After Stats & Comparison
    metricsHeading: "Mesh-Statistik & Vorher/Nachher-Vergleich",
    statusPreRepair: "⚡ Original-Modell geladen (Reparatur bereit)",
    statusAlreadyClean: "✔ Modell ist bereits 100% sauber & druckbereit",
    statusPostRepair: "✔ Erfolgreich repariert & optimiert",
    statVerticesTitle: "Vertices (Eckpunkte)",
    statTrianglesTitle: "Triangles (Dreiecke)",
    statErrorsTitle: "Topologie & Wasserdichtigkeit",
    labelCurrentMesh: "Aktuell:",
    labelStatusMesh: "Status:",
    statBeforeLabel: "Vorher:",
    statAfterLabel: "Nachher:",
    vNoteAction: "⚡ Auto-Repair verschweißt redundante Vertices & glättet T-Junctions.",
    vNotePost: "✔ Vertices erfolgreich topologisch harmonisiert und verschweißt.",
    tNoteAction: "⚡ Auto-Repair schließt offene Löcher wasserdicht & filtert Null-Flächen.",
    tNotePost: "✔ Alle offenen Löcher wasserdicht per Ohr-Triangulation geschlossen.",
    errorsNoteAction: "⚡ Auto-Repair stellt 100% Manifold-Wasserdichtigkeit für alle Slicer her.",
    errorsNotePost: "✔ 0 Fehler: Vollständig wasserdichter Manifold-Volumenkörper.",
    errorsCountLabel: "{count} Defekte",
    cleanStatusLabel: "0 (100% Manifold & Wasserdicht)",
    cleanBadge: "0 (Sauber & Manifold)",

    // Section 3: Diagnostics Catalog
    diagnosticsHeading: "Automatisch behobene Mesh-Fehler",
    diagNakedEdgesTitle: "Naked Edges (Offene Außenkanten)",
    diagNakedEdgesDesc: "Erkennt und schließt offene Netzkanten. Beim 3D-Druck führen offene Kanten dazu, dass der Slicer das Modell nicht als geschlossenen Volumenkörper erkennt und dadurch Schichten auslässt oder Wände fehlerhaft druckt.",
    diagHolesTitle: "Planar & Non-Planar Holes (Löcher im Mesh)",
    diagHolesDesc: "Füllt ebene und komplexe dreidimensionale Lücken in der Netzhülle wasserdicht auf. Durch Löcher dringt virtueller Leerraum in das Modell ein, wodurch Slicer kein Infill generieren und der Druck instabil wird oder fehlschlägt.",
    diagNonManifoldTitle: "Non-Manifold Edges (Ungültige Kantenverbindungen)",
    diagNonManifoldDesc: "Bereinigt Kanten, an denen mehr als zwei Dreiecksflächen anliegen. Non-Manifold-Strukturen verwirren den Schicht-Algorithmus des Slicers, was zu doppelten Druckbahnen, Filament-Knubbeln oder Schichtabrissen führt.",
    diagInvertedTitle: "Inverted Normals (Verdrehte Flächenausrichtung)",
    diagInvertedDesc: "Richtet nach innen zeigende Flächennormalen automatisch nach außen aus. Invertierte Normalen lassen den Slicer annehmen, die Außenwand liege im Modellinneren, wodurch Außenwände gar nicht oder spiegelverkehrt gedruckt werden.",
    diagDuplicateTitle: "Duplicate Faces (Doppelte Dreiecke)",
    diagDuplicateDesc: "Entfernt identische, übereinanderliegende Dreiecke aus fehlerhaften CAD-Exporten. Doppelte Flächen führen im Slicer zu lokaler Überextrusion und unschönen Artefakten auf den Oberflächen des Drucks.",
    diagDegenerateTitle: "Degenerate Faces (Null-Flächen)",
    diagDegenerateDesc: "Löscht entartete Dreiecke ohne Flächeninhalt oder mit kollinearen Punkten. Null-Flächen können im Slicer mathematische Fehler auslösen und die Schichtberechnung verlangsamen oder zum Absturz bringen.",
    diagDisjointTitle: "Disjoint Shells (Isolierte Teilnetze)",
    diagDisjointDesc: "Identifiziert getrennte Körperfragmente und verbindet oder bereinigt diese. Unverbundene, in der Luft schwebende Teilnetze führen beim 3D-Druck zu Filament-Fäden (Spaghetti-Effekt) und Fehldrucken.",

    // Section 3.5: Slicer Compatibility Hub
    slicerHeading: "100% Kompatibel mit modernen 3D-Slicern",
    slicerSubtitle: "Reparierte Meshes lassen sich nahtlos und fehlerfrei in alle marktführenden Slicer-Programme importieren.",
    slicerBambuTitle: "Bambu Studio & Bambu Lab",
    slicerBambuDesc: "Beseitigt 'Non-Manifold-Kanten erkannt' und offene Netzkanten für saubere Schichtberechnung ohne Druckfehler auf X1-, P1- und A1-Serien.",
    slicerOrcaTitle: "OrcaSlicer",
    slicerOrcaDesc: "Verhindert Schichtabriss und Hohlraum-Artefakte durch lückenlose planare Triangulierung und konsistente Flächennormalen.",
    slicerPrusaTitle: "PrusaSlicer",
    slicerPrusaDesc: "Erzeugt 100% wasserdichte Manifold-Volumenkörper, sodass PrusaSlicer saubere Perimeter ohne überkreuzte Werkzeugbahnen generiert.",
    slicerCuraTitle: "Ultimaker Cura & Creality Print",
    slicerCuraDesc: "Eliminiert 'Mesh ist nicht wasserdicht'-Warnungen und verhindert fehlerhaftes Weglassen von dünnen Wänden oder solidem Infill.",

    // Section 4: FAQ
    faqHeading: "Häufig gestellte Fragen zu MeshDoc",
    faqQ1: "Was bedeutet Non-Manifold bei einer STL-Datei?",
    faqA1: "Ein Non-Manifold-Fehler beschreibt eine geometrisch ungültige oder nicht wasserdichte Mesh-Struktur (z. B. Kanten, die von drei oder mehr Flächen geteilt werden, oder sich selbst schneidende Wände). Slicer können daraus kein eindeutiges Innen- und Außenvolumen berechnen, was zu Druckfehlern führt.",
    faqQ2: "Warum zeigt mein 3D-Slicer (Bambu Studio, OrcaSlicer, PrusaSlicer, Cura) Mesh-Fehler an?",
    faqA2: "Viele CAD-Programme und 3D-Modellierer exportieren beim Konvertieren in Polygone offene Kanten, invertierte Flächennormalen oder T-Junctions. Moderne Slicer prüfen die Wasserdichtigkeit streng und warnen vor Instabilitäten und Lücken im Werkzeugpfad.",
    faqQ3: "Was ist der Unterschied zwischen STL, OBJ und 3MF?",
    faqA3: "STL ist das traditionelle Standardformat für Dreiecksnetze ohne Farb- oder Einheiten-Informationen. OBJ unterstützt zusätzliche Textur- und Geometriedaten. 3MF ist das moderne, kompakte XML-Container-Format, das Netze verlustfrei komprimiert, Metadaten speichert und von modernen Slicern bevorzugt wird.",
    faqQ4: "Werden meine hochgeladenen 3D-Modelle auf einem Server gespeichert?",
    faqA4: "Nein. MeshDoc arbeitet nach dem strikten Zero-Upload-Prinzip: Alle Analysen, Triangulierungen und Reparaturen laufen zu 100% lokal im Arbeitsspeicher deines Webbrowsers ab. Keine 3D-Datei verlässt dein Gerät.",
    faqQ5: "Welche Dateigröße wird maximal unterstützt?",
    faqA5: "Da die Verarbeitung direkt im Browser über hardwarebeschleunigte Typ-Arrays (Float32Array) erfolgt, gibt es kein künstliches Server-Limit. Dateien bis ca. 150–200 MB bzw. über 2.000.000 Polygone lassen sich auf modernen Rechnern problemlos verarbeiten.",
    faqQ6: "Funktioniert MeshDoc auch auf Smartphones und Tablets?",
    faqA6: "Ja. MeshDoc ist vollständig responsiv aufgebaut und unterstützt mobile WebGL-Renderer auf iOS (Safari) und Android (Chrome/Firefox), sodass du 3D-Dateien auch unterwegs auf dem Handy oder Tablet prüfen und reparieren kannst.",
    faqQ7: "Welche Dateiformate können repariert und exportiert werden?",
    faqA7: "Du kannst STL (sowohl binär als auch ASCII), Wavefront OBJ und 3MF importieren. Nach der Reparatur kannst du das saubere Modell als Binary-STL, ASCII-STL, 3MF-Paket oder OBJ-Datei herunterladen.",
    manifoldStatusTitle: "Manifold-Status",
    manifoldStatusSubtitle: "Topologische Druckbarkeit",
    statusAnalyzing: "Analyse läuft...",
    statusWatertight: "Geschlossener Körper (Manifold)",
    statusNonManifold: "Non-Manifold Probleme",
    metricVertices: "Vertices",
    metricTriangles: "Dreiecke (Facets)",
    metricVolume: "Volumen (cm³)",
    metricArea: "Oberfläche (cm²)",
    dimensionsLabel: "Abmessungen (X × Y × Z in mm)",

    // Issues
    issueOpenEdges: "Löcher / Offene Kanten",
    issueNonManifold: "Non-Manifold Kanten",
    issueInverted: "Inkonsistente Normalen",
    issueDegenerates: "Degenerierte Dreiecke",
    issueUnitScale: "Einheit & Skalierung",
    issueOverhangs: "Überhänge & Support",
    cleanBadge: "0 (Sauber)",
    problemLabel: "Problem:",
    solutionLabel: "Lösung:",
    fixWithAutoRepairBtn: "⚡ Jetzt per Auto-Reparatur beheben",

    // 3D Printability Verdict (German)
    printabilityTitle: "Topologie & Optimierungsstatus",
    printReadyTitle: "✅ Druckbereit (Im Slicer druckbar)",
    printReadyDesc: "Das 3D-Modell ist für den Druck aufbereitet. Trotz einzelner CAD-Strukturmeldungen können moderne Slicer (Bambu Studio, PrusaSlicer, OrcaSlicer, Cura) das Modell fehlerfrei verarbeiten.",
    printNotReadyTitle: "⚡ Topologie-Optimierung empfohlen",
    printNotReadyDesc: "Das Modell enthält Unregelmäßigkeiten, die vor dem Slicen durch die Auto-Reparatur behoben werden können.",
    checklistWatertight: "✔ Geschlossener 3D-Volumenkörper (Manifold)",
    checklistNormals: "✔ Einheitliche Ausrichtung aller Flächennormalen",
    checklistManifold: "✔ Saubere Wandübergänge ohne T-Junctions",
    checklistSlicers: "✔ Druckbereit für alle Slicer & 3D-Drucker",
    repairedNoteNonManifold: "ℹ️ {count} Non-Manifold Kanten (Interne CAD-Körper: Werden im Slicer verschmolzen)",
    repairedNoteNormals: "ℹ️ {count} Normalen harmonisiert (Wandlinien zeigen nach außen)",
    repairedNoteHoles: "✔ Offene Kanten wurden durch Deckflächen verschlossen.",
    reasonHoles: "💡 {count} offene Kanten: Werden per Auto-Reparatur geschlossen.",
    reasonNonManifold: "💡 {count} Non-Manifold Kanten: Werden zu einem homogenen Körper verschmolzen.",
    reasonNormals: "💡 {count} invertierte Normalen: Werden nach außen ausgerichtet.",
    reasonDegenerates: "💡 {count} degenerierte Dreiecke: Werden herausgefiltert.",

    // Issue Details (German)
    issueOpenEdgesDescProblem: "Offene Kanten gehören nur zu 1 statt zu 2 Dreiecken. Das Modell hat offene Grenzflächen, was im 3D-Druck-Slicer zu leeren Hohlräumen oder fehlerhaften Schichten führt.",
    issueOpenEdgesDescSolution: "Die Auto-Reparatur wendet planares Ear-Clipping an, um offene Konturen mit sauber ausgerichteten Dreiecken vollständig zu schließen.",

    issueNonManifoldDescProblem: "Kanten werden von 3 oder mehr Dreiecken geteilt oder schneiden sich selbst. Der Slicer kann nicht bestimmen, was 'innen' und was 'außen' ist.",
    issueNonManifoldDescSolution: "Doppelte Vertices werden mit 0,0001 mm Toleranz verschweißt und interne T-Junctions werden bereinigt.",

    issueInvertedDescProblem: "Flächennormalen zeigen ins Innere des Modells statt nach außen. Der Slicer kehrt Wandlinien um oder druckt Wände spiegelverkehrt.",
    issueInvertedDescSolution: "Flächennormalen werden einheitlich nach außen bezüglich des Modell-Schwerpunkts ausgerichtet.",

    issueDegeneratesDescProblem: "Dreiecke mit einer Fläche von 0 oder auf einer Linie liegenden Eckpunkten. Können den Slicer zum Absturz bringen.",
    issueDegeneratesDescSolution: "Null-Flächen-Dreiecke werden gefiltert und entfernt, und die umliegenden Index-Verknüpfungen werden repariert.",

    issueUnitScaleDescProblem: "Sehr kleine (< 15 mm) oder ungewöhnlich riesige Abmessungen deuten auf einen Einheiten-Fehler beim CAD-Export hin (z. B. Modell in Zoll/Inches konstruiert, aber als mm interpretiert).",
    issueUnitScaleDescSolution: "Mit der 1-Klick-Zoll-Konvertierung (× 25.4) wird das Modell auf die beabsichtigte metrische Größe skaliert und sofort neu zentriert.",
    unitNormal: "1:1 (mm)",
    unitSuspectedInch: "Zoll (Inch) vermutet",
    unitSuspectedMmAsInch: "Falsche Einheit (zu groß)",

    issueOverhangsDescProblem: "Flächen, die steiler als {angle}° vom Druckbett weg geneigt sind (bzw. flacher als {angle}° zum Horizont), können ohne Stützstrukturen (Support) absacken oder Fäden ziehen.",
    issueOverhangsDescSolution: "Aktiviere im Slicer Stützstrukturen (z. B. Tree/Baum-Support) oder drehe das Modell (↻ 90° X/Y/Z), um die überhängende Fläche zu minimieren.",
    overhangNone: "0% (Kein Support nötig)",
    overhangBadge: "{percent}% (~{volume} cm³)",
    btnShowOverhangsIn3D: "👁️ Überhänge im 3D-Modell anzeigen",

    // Viewport Overlays
    viewerTouchHint: "Mit 2 Fingern 3D drehen & zoomen • 1 Finger zum Scrollen",
    modeOriginal: "Original",
    modeRepaired: "Repariert",
    modeSplit: "Split",
    toggleErrorsTooltip: "Fehler-Highlighting (rote Kanten) ein/aus",
    toggleOverhangsTooltip: "Überhang-Farbskala (Ampelsystem Grün/Gelb/Rot) ein/aus",
    toggleWireframeTooltip: "Drahtgittermodell (Wireframe) ein/aus",
    toggleBedTooltip: "Druckbett-Gitter ein/aus",
    resetCameraTooltip: "Kamera zurücksetzen (Iso)",
    watermarkHint: "Druckbett: 220 × 220 mm | Orbit: L-Klick | Pan: R-Klick | Zoom: Scroll",

    // Right Sidebar: Repair & Tools
    repairEngineTitle: "Reparatur & Export",
    tabRepairTitle: "🛠️ Reparatur",
    tabGeometryTitle: "📐 Geometrie",
    tabRepairTooltip: "Auto-Reparatur, Materialberechnung & Export",
    tabGeometryTooltip: "Druckbett-Ausrichtung, Skalierung & Geometrie",
    autoRepairSectionTitle: "Auto-Reparatur Engine",
    autoRepairSectionDesc: "Repariert Topologiefehler mit planarer Ohr-Triangulation und scharfer Kantenschattierung.",
    optCloseHoles: "Löcher schließen (Planar Ear-Clipping)",
    optFixNormals: "Normalen nach außen ausrichten",
    optWeldVerts: "Doppelte Vertices verschweißen",
    btnAutoRepair: "Auto-Reparatur starten",
    mobileToolsBtn: "Werkzeuge",
    tabModelDiagnosis: "Model-Diagnose",
    tabToolsAndSettings: "Werkzeuge & Reparatur",

    // Positioning
    positioningTitle: "Druckbett-Ausrichtung & Position",
    btnDropToBed: "Auf Bett absetzen",
    btnDropToBedTooltip: "Setzt das Modell mit dem tiefsten Punkt exakt auf die Druckbett-Oberfläche",
    btnCenterBed: "Mittig zentrieren",
    btnCenterBedTooltip: "Zentriert das Modell exakt in der Mitte des Druckbetts",
    btnRotateX: "↻ 90° X",
    btnRotateY: "↻ 90° Y",
    btnRotateZ: "↻ 90° Z",

    // Scale & Units
    scaleTitle: "Skalierung & Einheiten",
    scaleTitleTooltip: "Werkzeuge zur Einheiten-Konvertierung (Zoll / mm)",
    btnScaleInchToMm: "Zoll ➔ mm (× 25.4)",
    btnScaleMmToInch: "mm ➔ Zoll (/ 25.4)",
    btnResetScale: "Originalgröße (1:1)",
    btnQuickScaleInch: "⚡ In metrische Maße umrechnen (× 25.4)",

    // Overhangs & Support Tools
    overhangTitle: "Überhang- & Support-Schätzung",
    overhangTitleTooltip: "Berechnet überhängende Druckflächen und das benötigte Stützmaterial",
    overhangAngleLabel: "Support-Grenzwinkel:",
    overhangAreaLabel: "Überhangfläche:",
    supportVolumeLabel: "Geschätztes Supportvolumen:",
    supportWeightLabel: "Support-Gewicht ({material}):",
    btnToggleOverhangOverlay: "Überhang-Farbskala in 3D hervorheben",
    overhangHeatmapTitle: "Überhang-Farbskala",
    overhangSafeLabel: "Safe (< 35°)",
    overhangWarnLabel: "Warnung",
    overhangCritLabel: "Support nötig",

    // Decimation
    decimationTitle: "Polygon-Dezimierung",
    targetDensityLabel: "Ziel-Dichte:",
    btnDecimate: "Polygone reduzieren",
    btnResetDecimate: "Zurücksetzen",
    btnResetDecimateTooltip: "Dezimierung auf Standard zurücksetzen",

    // Material
    materialTitle: "Material- & Gewichtsberechnung",
    infillLabel: "Infill (Fülldichte):",
    estWeightLabel: "Gewicht ca.",
    filamentLengthLabel: "Filament (1.75mm)",

    // Export
    exportTitle: "Modell Herunterladen",
    btnExportBinarySTL: "STL (Binary)",
    btnExport3MF: "3MF Paket",
    btnExportAsciiSTL: "STL (ASCII)",
    btnExportOBJ: "Wavefront OBJ",

    // Footer & Header Navigation
    footerDisclaimer: 'MeshDoc • Ein Projekt von <a href="https://www.svender3d.de" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: underline;">svender3d.de</a> • 100% Lokale Zero-Upload Engine • Keine Datenübertragung an Dritte.',
    navWhatsNew: "Was ist neu?",
    themeToggleDark: "Zu dunklem Design wechseln",
    themeToggleLight: "Zu hellem Design wechseln",
    linkWhatsNew: "Was ist neu? (v1.7)",
    linkGitHub: "GitHub",
    linkImpressum: "Impressum",
    linkDatenschutz: "Datenschutz",
    linkContact: "Kontakt",
    linkSitemap: "Sitemap",
    linkCookieSettings: "Cookie-Einstellungen",
    modalWhatsNewTitle: "✨ Was ist neu? — Versionshinweise",
    changelogBadgeLatest: "Aktuelle Version",
    changelogV17Title: "Mobiles Redesign, 2-Finger-Gesten &amp; Überhang-Ampelsystem",
    changelogV17Date: "September 2026",
    changelogV17Item1: "<strong>Überhang-Ampelsystem &amp; Farbverlauf (Feature):</strong> Stufenloser Farbverlauf von Grün (sicher, &lt; 35°) über Gelb/Orange bis Rot (kritisch / Stützstruktur erforderlich) mit Live-HUD im 3D-Viewer und synchronisiertem Schwellenwert-Regler.",
    changelogV17Item2: "<strong>2-Finger-Touch-Navigation auf Mobilgeräten (Feature):</strong> Mit 1 Finger lässt sich die Seite normal scrollen ohne Hängenbleiben; mit 2 Fingern wird das 3D-Modell stufenlos gedreht und gezoomt.",
    changelogV17Item3: "<strong>Segmentierte Mobile-Dashboard-Tabs (Feature):</strong> Schnelles Umschalten zwischen „Modell-Diagnose“ und „Werkzeuge &amp; Reparatur“ direkt unter der 3D-Ansicht erspart langes Scrollen auf Smartphones.",
    changelogV17Item4: "<strong>Mobile Schnellzugriffsleiste &amp; Tools-Sheet (Verbesserung):</strong> Fixierte Leiste am unteren Bildschirmrand für 1-Klick-Reparatur und Direktzugriff auf Werkzeuge (blendet vor dem Footer automatisch aus).",
    changelogV17Item5: "<strong>Entzerrte Bedienelemente &amp; Touch-Regler (Verbesserung):</strong> Modus-Buttons oben links und vertikale Werkzeugleiste oben rechts schaffen über 150 px freien Raum im 3D-Viewer. Regler bieten 44 px Touch-Ziele und direkte Zahleneingabe.",
    changelogV17Item6: "<strong>Vollständiger Reset bei neuem Modell (Bugfix):</strong> Das Laden einer neuen 3D-Datei setzt alle Diagnosewerte, Fehlerlinien, Überhang-Hervorhebungen und Dialoge vollständig zurück.",
    changelogV17Item7: "<strong>Schwellenwert-Synchronisation (Bugfix):</strong> Änderungen des Stützwinkel-Schwellenwerts aktualisieren Facettenfarben und Stützvolumen nun sofort in Echtzeit.",
    changelogV16Title: "Duale Dark/Light Design-Engine, Studio 3D-Viewport &amp; UI-Verschlankung",
    changelogV16Date: "September 2026",
    changelogV16Item1: "<strong>Duale Dark &amp; Light Design-Engine:</strong> Nahtloser Design-Umschalter im Header mit FOUC-freier Sofort-Initialisierung. Volle WCAG AA/AAA-konforme kontraststarke helle Farbpalette mit Dark Mode als Standard.",
    changelogV16Item2: "<strong>Adaptiver CAD Studio 3D-Viewport:</strong> Three.js Canvas transformiert dynamisch in einen authentischen CAD-Studiohintergrund mit hellem Druckbett, kontrastoptimierten Modell-Shadern und mattierten schwebenden Bedienelementen.",
    changelogV16Item3: "<strong>Verschlankter Header &amp; Toolbar:</strong> Bereinigte obere Navigation, integrierter Theme-Schalter, zentraler Sprachwechsler und Entfernung redundanter Links für maximale Arbeitsfokus.",
    changelogV16Item4: "<strong>Domain- &amp; Mail-Migration zu meshdoc.de:</strong> Direkte Domain-Bindung an www.meshdoc.de mit aktualisiertem Hetzner-Mailer direkt an info@meshdoc.de.",
    changelogV16Item5: "<strong>SEO- &amp; KI-Crawler-Architektur:</strong> Verbesserte semantische HTML5-Struktur, strukturierte JSON-LD Schemas, robots.txt, dynamische Sitemap und llms.txt.",
    changelogV15Title: "Zero-Idle GPU-Engine, Vorher/Nachher-Vergleich &amp; UX-Umstrukturierung",
    changelogV15Date: "August 2026",
    changelogV15Item1: "<strong>Zero-Idle GPU &amp; Bedarfsorientiertes WebGL:</strong> WebGL-Renderschleife senkt GPU-Last im Leerlauf auf 0% (0 FPS bei Stillstand), verhindert Überhitzung, VRAM-Lastspitzen und Bildschirmflackern.",
    changelogV15Item2: "<strong>Zwei-Phasen Vorher/Nachher-Vergleichsarchitektur:</strong> Datei-Upload zeigt exakte aktuelle Geometriewerte; nach Reparatur automatische Transformation in vollständige Vorher ➔ Nachher Delta-Analyse mit bestätigtem 100% Manifold-Status.",
    changelogV15Item3: "<strong>Dezente schwebende Auto-Repair Schnelltaste:</strong> Elegantes Floating-Pill am unteren Bildschirmrand beim Scrollen für sofortige 1-Klick-Reparatur, ohne Seitenleisten-Werkzeuge zu verdecken.",
    changelogV15Item4: "<strong>Sanfte Ease-In-Out Nach-Oben-Navigation:</strong> Präzise Zurück-nach-oben-Animation mit <code>easeInOutCubic</code> Verzögerungskurve (sanfter Start, fließendes Gleiten, sanftes Abbremsen).",
    changelogV15Item5: "<strong>Semantische HTML5-Strukturierung &amp; On-Page SEO / JSON-LD:</strong> Vollständige semantische HTML5-Landmarks, H1–H3 Hierarchie, schema.org <code>WebApplication</code> &amp; <code>FAQPage</code> Schemas und 100% DE/EN Übersetzungsparität.",

    // Cookie Banner
    cookieTitle: "Privatsphäre & Datenschutzeinstellungen",
    cookieBody: "Diese Anwendung verarbeitet 3D-Dateien zu <strong>100% lokal im Browser</strong> (Zero-Upload). Wir verwenden ausschließlich technisch notwendige Speicherungen für Ihre Einstellungen. Keine Tracking-Cookies, keine Drittanbieter-CDNs.",
    cookieLearnMore: "Datenschutzerklärung",
    cookieAcceptAll: "Alle akzeptieren",
    cookieEssentialOnly: "Nur Essenziell",

    // Modals
    modalImpressumTitle: "Impressum",
    modalImpressumHeading1: "Angaben gemäß § 5 DDG",
    modalImpressumHeading2: "Kontakt",
    modalImpressumHeading3: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
    modalImpressumHeading4: "Haftungsausschluss",
    modalImpressumText4: "Die Inhalte dieser Anwendung wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte und 3D-Reparaturergebnisse können wir jedoch keine Gewähr übernehmen.",

    modalPrivacyTitle: "Datenschutzerklärung",
    modalPrivacyHeading1: "1. Datenschutz auf einen Blick (100% Zero-Upload)",
    modalPrivacyText1: "Sämtliche von Ihnen ausgewählten oder abgelegten 3D-Dateien (STL, 3MF, OBJ) werden ausschließlich lokal im Speicher Ihres Webbrowsers verarbeitet. Zu keinem Zeitpunkt werden 3D-Modelldaten an externe Server oder Dritte übertragen.",
    modalPrivacyHeading2: "2. Lokales Hosting & Schriftarten",
    modalPrivacyText2: "Diese Webseite lädt alle Skripte, Stylesheets und Schriftarten (WOFF2) zu 100% lokal vom eigenen Server. Es finden keine Verbindungen zu Google Fonts, CDNs oder externen Analyse-Diensten statt.",
    modalPrivacyHeading3: "3. Lokale Speicherung (Cookies & LocalStorage)",
    modalPrivacyText3: "Wir setzen keine Marketing- oder Tracking-Cookies ein. Zur Speicherung Ihrer Datenschutzeinstellungen wird lediglich ein lokaler Eintrag (localStorage) auf Ihrem Endgerät hinterlegt.",
    modalPrivacyHeading4: "4. Kontaktformular",
    modalPrivacyText4: "Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Formular zur Bearbeitung der Anfrage verarbeitet. Die Datenübermittlung erfolgt gesichert und wird nicht an Dritte weitergegeben.",
    modalPrivacyHeading5: "5. Ihre Rechte",
    modalPrivacyText5: "Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.",

    modalContactTitle: "Kontakt aufnehmen",
    labelName: "Ihr Name *",
    placeholderName: "Max Mustermann",
    labelEmail: "Ihre E-Mail-Adresse *",
    placeholderEmail: "name@beispiel.de",
    labelMessage: "Ihre Nachricht *",
    placeholderMessage: "Wie können wir Ihnen weiterhelfen?",
    checkboxPrivacy: "Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.",
    btnSendMessage: "Nachricht absenden",
    spamProtectionNote: "Spamschutz & clientseitige Eingabevalidierung aktiv",

    // Toasts & Messages
    toastLoading: "Lade {fileName}...",
    toastLoadSuccess: "{fileName} erfolgreich geladen!",
    toastUnsupportedFormat: "Nicht unterstütztes Format: .{ext}. Bitte STL, OBJ oder 3MF verwenden.",
    toastNoGeometry: "Konnte keine gültige 3D-Geometrie aus der Datei laden.",
    toastRepairing: "Repariere Topologie & schließe Löcher...",
    toastRepairSuccess: "Modell erfolgreich repariert & scharfkantig aufbereitet!",
    toastRepairFail: "Reparatur fehlgeschlagen: {error}",
    toastDroppedBed: "Modell auf Druckbett abgesetzt (Bodenkontakt)!",
    toastCenteredBed: "Modell mittig zentriert!",
    toastRotated: "Modell um 90° ({axis}) gedreht!",
    toastScaledInchToMm: "Modell erfolgreich um Faktor 25.4 skaliert (Zoll ➔ mm)!",
    toastScaledMmToInch: "Modell erfolgreich um Faktor 1/25.4 skaliert (mm ➔ Zoll)!",
    toastScaleReset: "Modell-Skalierung auf Originalgröße (1:1) zurückgesetzt.",
    toastDecimating: "Reduziere Polygone auf {ratio}%...",
    toastDecimateSuccess: "Polygon-Dezimierung abgeschlossen!",
    toastDecimateFail: "Dezimierungsfehler: {error}",
    toastDecimateReset: "Polygon-Dezimierung auf Standard zurückgesetzt.",
    toastNoModelExport: "Kein 3D-Modell zum Exportieren geladen.",
    toastDownloadedBinary: "Binary STL heruntergeladen!",
    toastDownloadedAscii: "ASCII STL heruntergeladen!",
    toastDownloaded3MF: "3MF Paket heruntergeladen!",
    toastDownloadedOBJ: "Wavefront OBJ heruntergeladen!",
    toastContactSent: "Vielen Dank! Deine Nachricht wurde sicher übermittelt.",
    toastContactSending: "Nachricht wird übertragen...",
    toastContactError: "Fehler beim Senden. Bitte versuche es später erneut oder kontaktiere uns direkt per Mail.",
    toastContactWait: "Bitte warte einige Sekunden vor dem nächsten Absenden.",
    toastContactInvalidName: "Bitte gib einen gültigen Namen an.",
    toastContactInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    toastContactInvalidMsg: "Die Nachricht sollte mindestens 10 Zeichen lang sein.",
    toastContactPrivacyReq: "Bitte stimme den Datenschutzbestimmungen zu.",
    toastCookieSaved: "Datenschutzeinstellungen gespeichert.",
    toastRepairCancelled: "Reparatur abgebrochen.",
    toastRepairTimeout: "Reparatur-Zeitlimit erreicht (Timeout).",
    btnCancelRepair: "✕ Abbrechen",
    timeoutAlertTitle: "⏱️ Reparatur-Zeitlimit erreicht",
    timeoutAlertDesc: "Die automatische Reparatur wurde gestoppt, um ein Einfrieren des Browsers zu verhindern.",
    timeoutAlertCause: "Ursache: Das Modell weicht zu stark von einem geschlossenen Manifold-Volumenkörper ab (z. B. offenes CAD-Flächenmodell oder unvollständiger 3D-Scan).",
    timeoutAlertSolution: "Empfehlung: Korrigiere die Quelldatei bitte direkt in deiner CAD-Software (Fusion 360, Blender, SolidWorks) und exportiere sie erneut als geschlossenen Solid.",

    // Surface Smoothing
    smoothingTitle: "Oberflächen-Glättung",
    smoothIntensityLabel: "Glättungs-Intensität:",
    smoothIntensitySub: "Taubin Volumenerhaltend (Schrumpffrei)",
    smoothProtectEdges: "Scharfe CAD-Kanten schützen (> 30°)",
    btnSmoothMesh: "Oberfläche glätten",
    btnResetSmooth: "Zurücksetzen",
    btnResetSmoothTooltip: "Glättung auf Standard zurücksetzen",
    btnSmoothingRunning: "Glätte Oberfläche...",
    toastSmoothSuccess: "Oberfläche erfolgreich geglättet!",
    toastSmoothReset: "Glättung auf Original zurückgesetzt.",
    toastSmoothFeasibilityWarning: "Struktur lässt Glättung aktuell nicht zu. Bitte zuerst Auto-Reparatur durchführen.",
    smoothAlertTitle: "⚠️ Struktur nicht glättbar",
    smoothAlertDesc: "Das Modell enthält zu viele offene Kanten oder Non-Manifold-Strukturen, die sich beim Glätten verformen würden. Bitte führe zuerst die Auto-Reparatur durch.",
    levelLight: "Leicht (1 Pass)",
    levelMedium: "Mittel (3 Passes)",
    levelStrong: "Stark (6 Passes)",
    levelUltra: "Ultra (10 Passes)",
    smoothTickLight: "Leicht (1)",
    smoothTickMedium: "Mittel (3)",
    smoothTickStrong: "Stark (6)",
    smoothTickUltra: "Ultra (10)",

    // Repair Animation Steps
    repairStep1: "🔍 Analysiere Grenzschleifen & Topologie...",
    repairStep2: "🧩 Trianguliere offene Löcher (Ear-Clipping)...",
    repairStep3: "📐 Richte Flächennormalen nach außen aus...",
    repairStep4: "⚡ Verschweiße Vertices & erstelle Manifold...",
    repairStep5: "✨ Berechne scharfe CAD-Kantenschattierung...",
    repairBtnRunning: "Repariere Modell...",
    repairBtnDone: "Repariert! ✓",
  },

  en: {
    // Header & Meta
    skipToContent: "Skip to content",
    pageTitle: "MeshDoc – Free Online 3D Mesh Diagnostics & STL Repair Tool",
    ogTitle: "MeshDoc – Free Online 3D Mesh Diagnostics & STL Repair Tool",
    appTitle: "MeshDoc – STL Repair & Mesh Diagnostics Tool",
    appSubtitle: "Analyze, repair and export defective STL files ready for slicing.",
    appDescription: "MeshDoc is a browser-based utility designed for 3D printing enthusiasts and engineers to repair broken STL, OBJ, and 3MF meshes. It automatically fixes non-manifold edges, caps open holes, and aligns inverted normals for error-free slicing. All processing runs 100% locally on your machine without cloud uploads.",
    metaDescription: "Free & Zero-Upload: Repair 3D meshes 100% locally in your browser. Automated fixing of non-manifold edges, holes & inverted normals for STL, OBJ and 3MF files.",
    privacyBadge: "100% Local Processing (Zero-Upload)",
    contactBtn: "✉️ Contact",

    // Left Sidebar: Diagnostics & Upload
    uploadHeading: "Upload & Inspect STL File",
    diagnosticsTitle: "Mesh Diagnostics",
    dropzoneTitle: "Drop file here or click to browse",
    dropzoneSubtitle: "Drag & drop STL, OBJ, or 3MF",
    sampleSelectDefault: "Try sample model...",
    sampleBrokenCube: "⚠️ Cube with Hole (Non-Manifold Test)",
    sampleCylinder: "⚠️ Open Cylinder (Boundary Test)",
    sampleTorus: "✅ Perfect Torus (Closed Manifold)",

    // Pipeline
    pipeUpload: "1. Upload",
    pipeAnalyze: "2. Analyze",
    pipeRepair: "3. Repair",
    pipeExport: "4. Slicer-Ready",

    // Section 2: Before / After Stats & Comparison
    metricsHeading: "Mesh Statistics & Before/After Comparison",
    statusPreRepair: "⚡ Original Model Loaded (Ready for Repair)",
    statusAlreadyClean: "✔ Model is already 100% clean & slicer-ready",
    statusPostRepair: "✔ Successfully Repaired & Optimized",
    statVerticesTitle: "Vertices",
    statTrianglesTitle: "Triangles",
    statErrorsTitle: "Topology & Watertightness",
    labelCurrentMesh: "Current:",
    labelStatusMesh: "Status:",
    statBeforeLabel: "Before:",
    statAfterLabel: "After:",
    vNoteAction: "⚡ Auto-Repair welds redundant vertices & cleans T-junctions.",
    vNotePost: "✔ Vertices successfully harmonized and topologically welded.",
    tNoteAction: "⚡ Auto-Repair seals open boundary holes & eliminates zero-area faces.",
    tNotePost: "✔ All boundary loops watertight closed via planar ear-clipping.",
    errorsNoteAction: "⚡ Auto-Repair creates 100% manifold watertightness for all slicers.",
    errorsNotePost: "✔ 0 Defects: Fully watertight solid volume body.",
    errorsCountLabel: "{count} defects",
    cleanStatusLabel: "0 (100% Manifold & Watertight)",
    cleanBadge: "0 (Clean & Manifold)",

    // Section 3: Diagnostics Catalog
    diagnosticsHeading: "Automatically Resolved Mesh Defects",
    diagNakedEdgesTitle: "Naked Edges (Open Boundaries)",
    diagNakedEdgesDesc: "Detects and bridges open boundary edges. In 3D printing, open edges prevent slicers from recognizing a closed solid, resulting in skipped layers or incomplete perimeter walls.",
    diagHolesTitle: "Planar & Non-Planar Holes",
    diagHolesDesc: "Fills planar and complex 3D surface voids to restore watertight solid geometry. Holes cause slicers to miscalculate interior volumes, resulting in missing infill or structurally weak prints.",
    diagNonManifoldTitle: "Non-Manifold Edges",
    diagNonManifoldDesc: "Cleans edges shared by more than two triangles for seamless slicing. Non-manifold geometry confuses slicing algorithms, producing self-intersecting toolpaths, nozzle blobs, or layer tears.",
    diagInvertedTitle: "Inverted Face Normals",
    diagInvertedDesc: "Automatically realigns inward-pointing face normal vectors outward. Inverted normals cause slicers to treat outer perimeters as hollow cavities, skipping material or printing inverted walls.",
    diagDuplicateTitle: "Duplicate Faces",
    diagDuplicateDesc: "Removes duplicate overlapping triangles from multi-body CAD exports. Overlapping faces cause severe slicer artifacts, nozzle collisions, and localized over-extrusion on outer perimeters.",
    diagDegenerateTitle: "Degenerate Faces",
    diagDegenerateDesc: "Eliminates zero-area triangles and collapsed collinear vertices. Degenerate faces can trigger math errors during slicing, frequently freezing or crashing slicer software.",
    diagDisjointTitle: "Disjoint Shells",
    diagDisjointDesc: "Identifies isolated mesh fragments and unifies or handles them consistently. Floating disconnected shells cause mid-air extrusion, spaghetti prints, and bed adhesion failures.",

    // Section 3.5: Slicer Compatibility Hub
    slicerHeading: "100% Compatible with Modern 3D Slicers",
    slicerSubtitle: "Repaired watertight models import seamlessly without warnings into all leading slicing software.",
    slicerBambuTitle: "Bambu Studio & Bambu Lab",
    slicerBambuDesc: "Instantly eliminates 'Non-manifold edges detected' and open seam alerts for flawless toolpaths on X1, P1, and A1 series printers.",
    slicerOrcaTitle: "OrcaSlicer",
    slicerOrcaDesc: "Fixes missing infill and perimeter slicing artifacts with watertight hole ear-clipping and outward-aligned face normals.",
    slicerPrusaTitle: "PrusaSlicer",
    slicerPrusaDesc: "Restores true manifold solid geometry, enabling PrusaSlicer to generate clean perimeter toolpaths with zero micro-gaps.",
    slicerCuraTitle: "Ultimaker Cura & Creality Print",
    slicerCuraDesc: "Eliminates 'Mesh is not watertight' warnings, preventing missing perimeters, layer tears, and unexpected hollow prints.",

    // Section 4: FAQ
    faqHeading: "Frequently Asked Questions about MeshDoc",
    faqQ1: "What does Non-Manifold mean in an STL file?",
    faqA1: "A non-manifold defect describes a geometrically invalid or non-watertight mesh structure (e.g. edges shared by three or more triangles, or self-intersecting walls). Slicers cannot determine clear interior vs exterior volumes, leading to slicing errors.",
    faqQ2: "Why does my 3D slicer show mesh or non-manifold warnings?",
    faqA2: "Many CAD modeling programs export open seams, inverted normals, or T-junctions during polygon tessellation. Modern slicers like Bambu Studio, OrcaSlicer, PrusaSlicer, or Cura strictly validate watertight manifold topology and warn about toolpath anomalies.",
    faqQ3: "What is the difference between STL, OBJ, and 3MF?",
    faqA3: "STL is the legacy standard format storing raw triangle coordinates without unit or color data. OBJ adds support for texture coordinates. 3MF (3D Manufacturing Format) is the modern XML-based container format that losslessly compresses meshes, retains metadata, and is preferred by modern slicers.",
    faqQ4: "Are my uploaded 3D models stored on external servers?",
    faqA4: "No. MeshDoc strictly operates on a Zero-Upload architecture: all parsing, ear-clipping hole triangulation, and exports execute 100% locally inside your browser memory. No 3D model files ever leave your device.",
    faqQ5: "What is the maximum supported file size?",
    faqA5: "Because processing runs entirely client-side via hardware-accelerated typed arrays (Float32Array), there is no artificial upload limit. Files up to 150–200 MB or over 2,000,000 polygons process smoothly on modern computers.",
    faqQ6: "Does MeshDoc work on smartphones and tablets?",
    faqA6: "Yes. MeshDoc is fully responsive and supports mobile WebGL on iOS (Safari) and Android (Chrome/Firefox), enabling you to inspect and repair 3D files directly on your mobile device.",
    faqQ7: "Which file formats can be repaired and exported?",
    faqA7: "You can import binary/ASCII STL, Wavefront OBJ, and 3MF files. After repair, you can export the clean mesh as Binary STL, ASCII STL, 3MF package, or OBJ file.",
    manifoldStatusTitle: "Manifold Status",
    manifoldStatusSubtitle: "Topological Printability",
    statusAnalyzing: "Analyzing...",
    statusWatertight: "Closed Solid (Manifold)",
    statusNonManifold: "Non-Manifold Issues",
    metricVertices: "Vertices",
    metricTriangles: "Triangles (Facets)",
    metricVolume: "Volume (cm³)",
    metricArea: "Surface Area (cm²)",
    dimensionsLabel: "Dimensions (X × Y × Z in mm)",

    // Issues
    issueOpenEdges: "Holes / Open Edges",
    issueNonManifold: "Non-Manifold Edges",
    issueInverted: "Inconsistent Face Normals",
    issueDegenerates: "Degenerate Triangles",
    issueUnitScale: "Units & Scale",
    issueOverhangs: "Overhangs & Support",
    cleanBadge: "0 (Clean)",
    problemLabel: "Problem:",
    solutionLabel: "Solution:",
    fixWithAutoRepairBtn: "⚡ Fix with Auto-Repair",

    // 3D Printability Verdict (English)
    printabilityTitle: "Topology & Optimization Status",
    printReadyTitle: "✅ Slicer-Ready (Printable in all Slicers)",
    printReadyDesc: "The 3D model is prepared for 3D printing. Despite remaining internal CAD structural warnings, modern slicers (Bambu Studio, PrusaSlicer, OrcaSlicer, Cura) can process this model without defects.",
    printNotReadyTitle: "⚡ Optimization Recommended",
    printNotReadyDesc: "The model has topological irregularities that can be automatically resolved via Auto-Repair before slicing.",
    checklistWatertight: "✔ Closed 3D solid geometry (Manifold)",
    checklistNormals: "✔ Unified outward surface normal vectors",
    checklistManifold: "✔ Clean wall transitions without T-junctions",
    checklistSlicers: "✔ Slicer-ready for all 3D printers & slicers",
    repairedNoteNonManifold: "ℹ️ {count} Non-Manifold edges (Internal CAD shells: Slicers automatically union these)",
    repairedNoteNormals: "ℹ️ {count} Normals harmonized (Perimeters print cleanly outwards)",
    repairedNoteHoles: "✔ Open boundary holes have been capped and sealed.",
    reasonHoles: "💡 {count} open boundary edges: Resolved via auto-capping.",
    reasonNonManifold: "💡 {count} non-manifold edges: Unified into a single solid body.",
    reasonNormals: "💡 {count} inverted face normals: Realigned outwards.",
    reasonDegenerates: "💡 {count} degenerate triangles: Filtered and cleaned.",

    // Issue Details (English)
    issueOpenEdgesDescProblem: "Boundary edges belong to only 1 triangle instead of 2. The mesh has open boundaries, causing slicers to generate slicing voids or infill defects.",
    issueOpenEdgesDescSolution: "Auto-Repair uses planar ear-clipping triangulation to cap all open boundary loops and create clean, manifold solid faces.",

    issueNonManifoldDescProblem: "Edges shared by 3 or more triangles or self-intersecting shells. Slicers cannot distinguish 'inside' from 'outside'.",
    issueNonManifoldDescSolution: "Welds duplicate boundary vertices with a 0.0001 mm epsilon tolerance and removes internal zero-volume T-junctions.",

    issueInvertedDescProblem: "Face normals point inward toward the mesh core instead of outward. Slicers may invert wall toolpaths or print shells backwards.",
    issueInvertedDescSolution: "Aligns all surface normal vectors outward relative to the geometry's center of mass.",

    issueDegeneratesDescProblem: "Triangles with zero surface area or collinear points. These can freeze or crash slicer engines during perimeter generation.",
    issueDegeneratesDescSolution: "Filters out zero-area and collapsed facets, then rebuilds surrounding vertex index connectivity.",

    issueUnitScaleDescProblem: "Very small (< 15 mm) or exceptionally huge dimensions indicate a unit mismatch during CAD export (e.g., model created in inches but imported as millimeters).",
    issueUnitScaleDescSolution: "With 1-click inch conversion (× 25.4), the model is scaled to the intended metric size and immediately re-centered.",
    unitNormal: "1:1 (mm)",
    unitSuspectedInch: "Suspected Inch",
    unitSuspectedMmAsInch: "Unit mismatch (too large)",

    issueOverhangsDescProblem: "Surfaces tilted more than {angle}° from vertical (or shallower than {angle}° to horizontal) can sag or string without support structures.",
    issueOverhangsDescSolution: "Enable support structures in your slicer (e.g. tree supports) or rotate the model (↻ 90° X/Y/Z) to minimize overhang area.",
    overhangNone: "0% (No support needed)",
    overhangBadge: "{percent}% (~{volume} cm³)",
    btnShowOverhangsIn3D: "👁️ Highlight Overhangs in 3D",

    // Viewport Overlays
    viewerTouchHint: "Use 2 fingers to rotate & zoom • 1 finger to scroll",
    modeOriginal: "Original",
    modeRepaired: "Repaired",
    modeSplit: "Split",
    toggleErrorsTooltip: "Toggle error highlights (red edges)",
    toggleOverhangsTooltip: "Toggle overhang heatmap (Traffic-light Green/Yellow/Red)",
    toggleWireframeTooltip: "Toggle wireframe view",
    toggleBedTooltip: "Toggle build bed grid",
    resetCameraTooltip: "Reset camera (Isometric)",
    watermarkHint: "Build Bed: 220 × 220 mm | Orbit: Left Click | Pan: Right Click | Zoom: Scroll",

    // Right Sidebar: Repair & Tools
    repairEngineTitle: "Repair & Export",
    tabRepairTitle: "🛠️ Repair",
    tabGeometryTitle: "📐 Geometry",
    tabRepairTooltip: "Auto-Repair, Material & Export",
    tabGeometryTooltip: "Build bed alignment, scaling & geometry",
    autoRepairSectionTitle: "Auto-Repair Engine",
    autoRepairSectionDesc: "Repairs topological defects using planar ear-clipping triangulation and sharp facet shading.",
    optCloseHoles: "Close holes (Planar Ear-Clipping)",
    optFixNormals: "Align normals outwards",
    optWeldVerts: "Weld duplicate vertices",
    btnAutoRepair: "Start Auto-Repair",
    mobileToolsBtn: "Tools",
    tabModelDiagnosis: "Model Diagnostics",
    tabToolsAndSettings: "Tools & Repair",

    // Positioning
    positioningTitle: "Build Bed Alignment & Position",
    btnDropToBed: "Drop to Bed",
    btnDropToBedTooltip: "Places the lowest point of the model flush on the build bed surface",
    btnCenterBed: "Center in Middle",
    btnCenterBedTooltip: "Centers the model exactly in the middle of the build bed",
    btnRotateX: "↻ 90° X",
    btnRotateY: "↻ 90° Y",
    btnRotateZ: "↻ 90° Z",

    // Scale & Units
    scaleTitle: "Scale & Units",
    scaleTitleTooltip: "Unit conversion tools (Inch / mm)",
    btnScaleInchToMm: "Inch ➔ mm (× 25.4)",
    btnScaleMmToInch: "mm ➔ Inch (/ 25.4)",
    btnResetScale: "Original Size (1:1)",
    btnQuickScaleInch: "⚡ Convert to metric scale (× 25.4)",

    // Overhangs & Support Tools
    overhangTitle: "Overhang & Support Estimate",
    overhangTitleTooltip: "Calculates overhang surfaces and required support material",
    overhangAngleLabel: "Support Angle Threshold:",
    overhangAreaLabel: "Overhang Area:",
    supportVolumeLabel: "Est. Support Volume:",
    supportWeightLabel: "Support Weight ({material}):",
    btnToggleOverhangOverlay: "Highlight Overhang Heatmap in 3D",
    overhangHeatmapTitle: "Overhang Heatmap",
    overhangSafeLabel: "Safe (< 35°)",
    overhangWarnLabel: "Warning",
    overhangCritLabel: "Support needed",

    // Decimation
    decimationTitle: "Polygon Decimation",
    targetDensityLabel: "Target Density:",
    btnDecimate: "Reduce Polygons",
    btnResetDecimate: "Reset",
    btnResetDecimateTooltip: "Reset decimation to default",

    // Material
    materialTitle: "Material & Weight Calculation",
    infillLabel: "Infill Density:",
    estWeightLabel: "Est. Weight",
    filamentLengthLabel: "Filament (1.75mm)",

    // Export
    exportTitle: "Download Model",
    btnExportBinarySTL: "STL (Binary)",
    btnExport3MF: "3MF Package",
    btnExportAsciiSTL: "STL (ASCII)",
    btnExportOBJ: "Wavefront OBJ",

    // Footer & Header Navigation
    footerDisclaimer: 'MeshDoc • A project by <a href="https://www.svender3d.de" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: underline;">svender3d.de</a> • 100% Local Zero-Upload Engine • No data sent to third parties.',
    navWhatsNew: "What's New",
    themeToggleDark: "Switch to Dark Mode",
    themeToggleLight: "Switch to Light Mode",
    linkWhatsNew: "What's New (v1.7)",
    linkGitHub: "GitHub",
    linkImpressum: "Legal Notice",
    linkDatenschutz: "Privacy Policy",
    linkContact: "Contact",
    linkSitemap: "Sitemap",
    linkCookieSettings: "Cookie Settings",
    modalWhatsNewTitle: "✨ What's New — Release Notes & Updates",
    changelogBadgeLatest: "Latest Release",
    changelogV17Title: "Mobile Redesign, 2-Finger Gestures &amp; Overhang Heatmap",
    changelogV17Date: "September 2026",
    changelogV17Item1: "<strong>Overhang Traffic-Light Heatmap (Feature):</strong> Continuous color gradient from Green (safe, &lt; 35°) through Yellow/Orange to Red (critical / support required) with live 3D viewport HUD and synchronized threshold slider.",
    changelogV17Item2: "<strong>2-Finger Touch Navigation on Mobile (Feature):</strong> 1 finger scrolls the page freely without trapping your swipe; 2 fingers smoothly rotate and zoom the 3D model.",
    changelogV17Item3: "<strong>Segmented Mobile Dashboard Tabs (Feature):</strong> Instant switching between \"Model Diagnostics\" and \"Tools &amp; Repair\" right below the 3D view, saving over 1,000 px of vertical scrolling.",
    changelogV17Item4: "<strong>Mobile Quick Action Bar &amp; Tools Sheet (Improvement):</strong> Fixed bottom action bar for 1-click auto-repair and quick slider access (auto-hides cleanly before reaching the footer).",
    changelogV17Item5: "<strong>Decluttered Controls &amp; Touch Sliders (Improvement):</strong> Repositioned mode buttons top-left and vertical tool strip top-right create over 150 px of free canvas space. Sliders feature 44 px touch targets with synchronized number inputs.",
    changelogV17Item6: "<strong>Full State Reset on New Upload (Bugfix):</strong> Uploading a new 3D model now cleanly resets all diagnostic metrics, error lines, overhang highlights, and UI drawers.",
    changelogV17Item7: "<strong>Threshold Slider Parameter Sync (Bugfix):</strong> Live support angle threshold adjustments now immediately update 3D facet colors and support volume metrics in real-time.",
    changelogV16Title: "Dual Dark/Light Theme Engine, Studio 3D Viewport &amp; UI Decluttering",
    changelogV16Date: "September 2026",
    changelogV16Item1: "<strong>Dual Dark &amp; Light Theme Engine:</strong> Seamless theme toggle in the header with zero-FOUC instant initialization. Full WCAG AA/AAA compliant high-contrast light palette with Dark Mode as default.",
    changelogV16Item2: "<strong>Adaptive CAD Studio 3D Viewport:</strong> Three.js canvas transforms dynamically into an authentic CAD studio background with bright build plate, contrast-tuned model shaders, and frosted floating controls.",
    changelogV16Item3: "<strong>Streamlined Header &amp; Toolbar:</strong> Cleaned up top navigation, integrated theme toggle, centralized language switch, and removed redundant links for a distraction-free workspace.",
    changelogV16Item4: "<strong>Domain &amp; Mail Migration to meshdoc.de:</strong> Direct domain binding to www.meshdoc.de with updated Hetzner mailer routing directly to info@meshdoc.de.",
    changelogV16Item5: "<strong>SEO &amp; AI Crawler Architecture:</strong> Enhanced semantic HTML5 markup, structured JSON-LD schemas, robots.txt, dynamic sitemap, and llms.txt.",
    changelogV15Title: "Zero-Idle GPU Engine, Two-Phase Comparison &amp; UX Restructuring",
    changelogV15Date: "August 2026",
    changelogV15Item1: "<strong>Zero-Idle GPU &amp; Demand-Driven WebGL:</strong> WebGL render loop drops to 0% GPU load during idle states (0 FPS when stationary), eliminating GPU overheating, VRAM bandwidth spikes, and display driver screen flickering.",
    changelogV15Item2: "<strong>Two-Phase Before/After Comparison Architecture:</strong> File loading displays exact verified current geometry metrics; post-repair automatically transforms into a complete Before ➔ After delta audit with confirmed 100% Watertight / Manifold status.",
    changelogV15Item3: "<strong>Non-Intrusive Floating Sticky Auto-Repair Action:</strong> A sleek bottom-center floating action pill appears when scrolling past the dashboard, offering instant 1-click repair without obstructing sidebar tools.",
    changelogV15Item4: "<strong>Smooth Ease-In-Out Back-To-Top Navigation:</strong> High-precision Back-to-Top physics utilizing an <code>easeInOutCubic</code> deceleration curve (gentle start, fluid glide, soft deceleration).",
    changelogV15Item5: "<strong>Semantic HTML5 Restructuring &amp; On-Page SEO / JSON-LD:</strong> Full HTML5 semantic landmarks (<code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;footer&gt;</code>), strict H1–H3 hierarchy, schema.org <code>WebApplication</code> &amp; <code>FAQPage</code> schemas, and 100% EN/DE translation parity.",

    // Cookie Banner
    cookieTitle: "Privacy & Cookie Preferences",
    cookieBody: "This application processes 3D files <strong>100% locally in your browser</strong> (Zero-Upload). We only store strictly necessary technical preferences. No tracking cookies, no third-party CDNs.",
    cookieLearnMore: "Privacy Policy",
    cookieAcceptAll: "Accept All",
    cookieEssentialOnly: "Essential Only",

    // Modals
    modalImpressumTitle: "Legal Notice",
    modalImpressumHeading1: "Information pursuant to § 5 DDG",
    modalImpressumHeading2: "Contact",
    modalImpressumHeading3: "Responsible for Content",
    modalImpressumHeading4: "Disclaimer",
    modalImpressumText4: "The contents of this application have been created with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the contents and 3D repair results.",

    modalPrivacyTitle: "Privacy Policy (GDPR)",
    modalPrivacyHeading1: "1. Privacy at a Glance (100% Zero-Upload)",
    modalPrivacyText1: "All 3D files (STL, 3MF, OBJ) selected or dropped by you are processed exclusively inside your web browser memory. At no point are 3D model data transmitted to external servers or third parties.",
    modalPrivacyHeading2: "2. Local Hosting & Self-Hosted Fonts",
    modalPrivacyText2: "This website loads all scripts, stylesheets, and fonts (WOFF2) 100% locally from its own server. No connections are made to Google Fonts, CDNs, or external analytics services.",
    modalPrivacyHeading3: "3. Local Storage (Cookies & LocalStorage)",
    modalPrivacyText3: "We do not use any marketing or tracking cookies. Only a local entry (localStorage) is stored on your device to persist your privacy and language preferences.",
    modalPrivacyHeading4: "4. Contact Form",
    modalPrivacyText4: "If you send inquiries via the contact form, your details from the form will be processed to handle the request. Data transmission is secure and will not be shared with third parties.",
    modalPrivacyHeading5: "5. Your Rights",
    modalPrivacyText5: "You have the right at any time to receive free information about your stored personal data, as well as the right to rectification, blocking, or deletion of this data under GDPR.",

    modalContactTitle: "Contact Us",
    labelName: "Your Name *",
    placeholderName: "John Doe",
    labelEmail: "Your Email Address *",
    placeholderEmail: "name@example.com",
    labelMessage: "Your Message *",
    placeholderMessage: "How can we help you?",
    checkboxPrivacy: "I agree to the processing of my data according to the privacy policy.",
    btnSendMessage: "Send Message",
    spamProtectionNote: "Spam protection & client-side input validation active",

    // Toasts & Messages
    toastLoading: "Loading {fileName}...",
    toastLoadSuccess: "{fileName} loaded successfully!",
    toastUnsupportedFormat: "Unsupported format: .{ext}. Please use STL, OBJ, or 3MF.",
    toastNoGeometry: "Could not extract valid 3D geometry from file.",
    toastRepairing: "Repairing topology & capping holes...",
    toastRepairSuccess: "Model successfully repaired with sharp facet shading!",
    toastRepairFail: "Repair failed: {error}",
    toastDroppedBed: "Model dropped to build bed (ground contact)!",
    toastCenteredBed: "Model centered in the middle!",
    toastRotated: "Model rotated by 90° ({axis})!",
    toastScaledInchToMm: "Model successfully scaled by factor 25.4 (Inch ➔ mm)!",
    toastScaledMmToInch: "Model successfully scaled by factor 1/25.4 (mm ➔ Inch)!",
    toastScaleReset: "Model scale reset to original dimensions (1:1).",
    toastDecimating: "Reducing polygons to {ratio}%...",
    toastDecimateSuccess: "Polygon decimation complete!",
    toastDecimateFail: "Decimation error: {error}",
    toastDecimateReset: "Polygon decimation reset to default.",
    toastNoModelExport: "No 3D model loaded to export.",
    toastDownloadedBinary: "Binary STL downloaded!",
    toastDownloadedAscii: "ASCII STL downloaded!",
    toastDownloaded3MF: "3MF Package downloaded!",
    toastDownloadedOBJ: "Wavefront OBJ downloaded!",
    toastContactSent: "Thank you! Your message has been sent securely.",
    toastContactSending: "Transmitting message...",
    toastContactError: "Failed to send message. Please try again later or contact us directly by email.",
    toastContactWait: "Please wait a few seconds before sending another message.",
    toastContactInvalidName: "Please enter a valid name.",
    toastContactInvalidEmail: "Please enter a valid email address.",
    toastContactInvalidMsg: "Message should be at least 10 characters long.",
    toastContactPrivacyReq: "Please accept the privacy policy.",
    toastCookieSaved: "Privacy settings saved.",
    toastRepairCancelled: "Repair operation cancelled.",
    toastRepairTimeout: "Repair time limit reached (Timeout).",
    btnCancelRepair: "✕ Cancel",
    timeoutAlertTitle: "⏱️ Repair Time Limit Reached",
    timeoutAlertDesc: "The automatic repair was stopped to prevent your browser from freezing.",
    timeoutAlertCause: "Cause: The model is too far from a closed solid (e.g. open CAD surface sheet or incomplete 3D scan).",
    timeoutAlertSolution: "Recommendation: Please fix the source geometry directly in your CAD software (Fusion 360, Blender, SolidWorks) and re-export as a closed solid.",

    // Surface Smoothing
    smoothingTitle: "Surface Smoothing",
    smoothIntensityLabel: "Smoothing Intensity:",
    smoothIntensitySub: "Taubin Volume-Preserving (No Shrinkage)",
    smoothProtectEdges: "Protect Sharp CAD Edges (> 30°)",
    btnSmoothMesh: "Smooth Surface",
    btnResetSmooth: "Reset",
    btnResetSmoothTooltip: "Reset smoothing to default",
    btnSmoothingRunning: "Smoothing Surface...",
    toastSmoothSuccess: "Surface successfully smoothed!",
    toastSmoothReset: "Smoothing reset to original model.",
    toastSmoothFeasibilityWarning: "Structure does not allow smoothing currently. Please run Auto-Repair first.",
    smoothAlertTitle: "⚠️ Structure Not Suitable For Smoothing",
    smoothAlertDesc: "The model contains too many open boundary edges or non-manifold structures that would distort during smoothing. Please run Auto-Repair first.",
    levelLight: "Light (1 Pass)",
    levelMedium: "Medium (3 Passes)",
    levelStrong: "Strong (6 Passes)",
    levelUltra: "Ultra (10 Passes)",
    smoothTickLight: "Light (1)",
    smoothTickMedium: "Medium (3)",
    smoothTickStrong: "Strong (6)",
    smoothTickUltra: "Ultra (10)",

    // Repair Animation Steps
    repairStep1: "🔍 Analyzing boundary loops & topology...",
    repairStep2: "🧩 Triangulating open holes (Ear-Clipping)...",
    repairStep3: "📐 Aligning surface normals outwards...",
    repairStep4: "⚡ Welding vertices & ensuring manifold...",
    repairStep5: "✨ Computing sharp CAD facet shading...",
    repairBtnRunning: "Repairing Mesh...",
    repairBtnDone: "Repaired! ✓",
  }
};

export class I18n {
  static currentLang = 'en';

  static init() {
    // 1. Check URL parameters first (?lang=de or ?lang=en)
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');
    
    // 2. Check localStorage
    const saved = localStorage.getItem('mesh3d_lang_preference');

    if (paramLang && (paramLang === 'de' || paramLang === 'en')) {
      this.currentLang = paramLang;
      localStorage.setItem('mesh3d_lang_preference', paramLang);
    } else if (saved && (saved === 'de' || saved === 'en')) {
      this.currentLang = saved;
    } else {
      this.currentLang = 'en'; // Standard/Hauptsprache is English
    }

    this.applyLanguage(this.currentLang);
    this.bindLanguageSwitcher();
  }

  static bindLanguageSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        if (lang && lang !== this.currentLang) {
          this.setLanguage(lang);
        }
      });
    });
  }

  static setLanguage(lang) {
    if (lang !== 'de' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('mesh3d_lang_preference', lang);

    // Sync URL parameter cleanly without reloading
    try {
      const url = new URL(window.location);
      if (lang === 'en') {
        url.searchParams.delete('lang'); // clean canonical URL for English
      } else {
        url.searchParams.set('lang', lang);
      }
      window.history.replaceState({}, '', url);
    } catch (e) {
      // Ignore in non-browser environments
    }

    this.applyLanguage(lang);
  }

  static applyLanguage(lang) {
    const dict = translations[lang] || translations.en;
    document.documentElement.lang = lang;

    // Update Page Title
    if (dict.pageTitle) {
      document.title = dict.pageTitle;
      document.querySelector('meta[name="title"]')?.setAttribute('content', dict.pageTitle);
    }

    // Update Meta Description
    if (dict.metaDescription) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', dict.metaDescription);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', dict.metaDescription);
      document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', dict.metaDescription);
    }

    // Update Open Graph & Twitter Titles
    if (dict.ogTitle) {
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', dict.ogTitle);
      document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', dict.ogTitle);
    }

    // Update Open Graph Locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.setAttribute('content', lang === 'de' ? 'de_DE' : 'en_US');
    }

    // Update Self-Referencing Canonical Tag & Social URLs
    const canonicalHref = lang === 'de' ? 'https://www.meshdoc.de/?lang=de' : 'https://www.meshdoc.de/';
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalHref);
    }
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalHref);
    }
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute('content', canonicalHref);
    }

    // Update Language Toggle buttons
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Translate title/tooltips
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.setAttribute('title', dict[key]);
      }
    });

    // Notify app of language change to update dynamic strings/labels
    if (window.meshApp && window.meshApp.onLanguageChange) {
      window.meshApp.onLanguageChange(lang);
    }
  }

  static t(key, params = {}) {
    const dict = translations[this.currentLang] || translations.en;
    let text = dict[key] || key;
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
    }
    return text;
  }
}

function initI18n() {
  I18n.init();
}

if (typeof window !== 'undefined') {
  window.I18n = I18n;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}

