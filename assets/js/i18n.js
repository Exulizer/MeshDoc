/**
 * i18n.js - Complete German (DE) and English (EN) Internationalization Engine
 * Ensures 100% pure translations with zero language mixing.
 */

export const translations = {
  de: {
    // Header & Meta
    appTitle: "MeshDoc",
    appSubtitle: "3D-Druck Mesh-Diagnose, Auto-Reparatur & Optimierung",
    privacyBadge: "100% Lokale Verarbeitung (Zero-Upload)",
    contactBtn: "✉️ Kontakt",

    // Left Sidebar: Diagnostics & Upload
    diagnosticsTitle: "Mesh-Diagnose",
    dropzoneTitle: "Datei ablegen oder hier klicken",
    dropzoneSubtitle: "STL, OBJ oder 3MF per Drag & Drop",
    sampleSelectDefault: "Beispiel-Modell testen...",
    sampleBrokenCube: "⚠️ Würfel mit Loch (Non-Manifold Test)",
    sampleCylinder: "⚠️ Offener Zylinder (Boundary Test)",
    sampleTorus: "✅ Perfekter Torus (Geschlossener Manifold)",
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

    // Viewport Overlays
    modeOriginal: "Original",
    modeRepaired: "Repariert",
    modeSplit: "Vergleich (Split)",
    toggleErrorsTooltip: "Fehler-Highlighting (rote Kanten) ein/aus",
    toggleWireframeTooltip: "Drahtgittermodell (Wireframe) ein/aus",
    toggleBedTooltip: "Druckbett-Gitter ein/aus",
    resetCameraTooltip: "Kamera zurücksetzen (Iso)",
    watermarkHint: "Druckbett: 220 × 220 mm | Orbit: L-Klick | Pan: R-Klick | Zoom: Scroll",

    // Right Sidebar: Repair & Tools
    repairEngineTitle: "Reparatur & Export",
    autoRepairSectionTitle: "Auto-Reparatur Engine",
    autoRepairSectionDesc: "Repariert Topologiefehler mit planarer Ohr-Triangulation und scharfer Kantenschattierung.",
    optCloseHoles: "Löcher schließen (Planar Ear-Clipping)",
    optFixNormals: "Normalen nach außen ausrichten",
    optWeldVerts: "Doppelte Vertices verschweißen",
    btnAutoRepair: "Auto-Reparatur starten",

    // Positioning
    positioningTitle: "Druckbett-Ausrichtung & Position",
    btnDropToBed: "Auf Bett absetzen",
    btnDropToBedTooltip: "Setzt das Modell mit dem tiefsten Punkt exakt auf die Druckbett-Oberfläche",
    btnCenterBed: "Mittig zentrieren",
    btnCenterBedTooltip: "Zentriert das Modell exakt in der Mitte des Druckbetts",
    btnRotateX: "↻ 90° X",
    btnRotateY: "↻ 90° Y",
    btnRotateZ: "↻ 90° Z",

    // Decimation
    decimationTitle: "Polygon-Dezimierung",
    targetDensityLabel: "Ziel-Dichte:",
    btnDecimate: "Polygone reduzieren",

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
    footerDisclaimer: "MeshDoc • 100% Lokale Zero-Upload Engine • Keine Datenübertragung an Dritte.",
    navWhatsNew: "Was ist neu?",
    linkWhatsNew: "Was ist neu? (v1.4)",
    linkGitHub: "GitHub",
    linkImpressum: "Impressum",
    linkDatenschutz: "Datenschutz",
    linkContact: "Kontakt",
    linkCookieSettings: "Cookie-Einstellungen",
    modalWhatsNewTitle: "✨ Was ist neu? — Versionshinweise",

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
    toastDecimating: "Reduziere Polygone auf {ratio}%...",
    toastDecimateSuccess: "Polygon-Dezimierung abgeschlossen!",
    toastDecimateFail: "Dezimierungsfehler: {error}",
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
    appTitle: "MeshDoc",
    appSubtitle: "Client-Side 3D Mesh Diagnostics, Auto-Repair & Optimization",
    privacyBadge: "100% Local Processing (Zero-Upload)",
    contactBtn: "✉️ Contact",

    // Left Sidebar: Diagnostics & Upload
    diagnosticsTitle: "Mesh Diagnostics",
    dropzoneTitle: "Drop file here or click to browse",
    dropzoneSubtitle: "Drag & drop STL, OBJ, or 3MF",
    sampleSelectDefault: "Try sample model...",
    sampleBrokenCube: "⚠️ Cube with Hole (Non-Manifold Test)",
    sampleCylinder: "⚠️ Open Cylinder (Boundary Test)",
    sampleTorus: "✅ Perfect Torus (Closed Manifold)",
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

    // Viewport Overlays
    modeOriginal: "Original",
    modeRepaired: "Repaired",
    modeSplit: "Comparison (Split)",
    toggleErrorsTooltip: "Toggle error highlights (red edges)",
    toggleWireframeTooltip: "Toggle wireframe view",
    toggleBedTooltip: "Toggle build bed grid",
    resetCameraTooltip: "Reset camera (Isometric)",
    watermarkHint: "Build Bed: 220 × 220 mm | Orbit: Left Click | Pan: Right Click | Zoom: Scroll",

    // Right Sidebar: Repair & Tools
    repairEngineTitle: "Repair & Export",
    autoRepairSectionTitle: "Auto-Repair Engine",
    autoRepairSectionDesc: "Repairs topological defects using planar ear-clipping triangulation and sharp facet shading.",
    optCloseHoles: "Close holes (Planar Ear-Clipping)",
    optFixNormals: "Align normals outwards",
    optWeldVerts: "Weld duplicate vertices",
    btnAutoRepair: "Start Auto-Repair",

    // Positioning
    positioningTitle: "Build Bed Alignment & Position",
    btnDropToBed: "Drop to Bed",
    btnDropToBedTooltip: "Places the lowest point of the model flush on the build bed surface",
    btnCenterBed: "Center in Middle",
    btnCenterBedTooltip: "Centers the model exactly in the middle of the build bed",
    btnRotateX: "↻ 90° X",
    btnRotateY: "↻ 90° Y",
    btnRotateZ: "↻ 90° Z",

    // Decimation
    decimationTitle: "Polygon Decimation",
    targetDensityLabel: "Target Density:",
    btnDecimate: "Reduce Polygons",

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
    footerDisclaimer: "MeshDoc • 100% Local Zero-Upload Engine • No data sent to third parties.",
    navWhatsNew: "What's New",
    linkWhatsNew: "What's New (v1.4)",
    linkGitHub: "GitHub",
    linkImpressum: "Legal Notice",
    linkDatenschutz: "Privacy Policy",
    linkContact: "Contact",
    linkCookieSettings: "Cookie Settings",
    modalWhatsNewTitle: "✨ What's New — Release Notes & Updates",

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
    toastDecimating: "Reducing polygons to {ratio}%...",
    toastDecimateSuccess: "Polygon decimation complete!",
    toastDecimateFail: "Decimation error: {error}",
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
    // Check localStorage, default to English
    const saved = localStorage.getItem('mesh3d_lang_preference');
    if (saved && (saved === 'de' || saved === 'en')) {
      this.currentLang = saved;
    } else {
      this.currentLang = 'en'; // Standard is English
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
    this.applyLanguage(lang);
  }

  static applyLanguage(lang) {
    const dict = translations[lang] || translations.en;
    document.documentElement.lang = lang;

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
