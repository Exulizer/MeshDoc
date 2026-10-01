<?php
/**
 * ============================================================================
 * www.meshdoc.de - MeshDoc — 3D Print Mesh Repair & Analyzer
 * Hetzner Server Kontaktformular Backend (PHP 7.4 - PHP 8.4+)
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

// Allow Cross-Origin Requests (meshdoc.de, www.meshdoc.de, svender3d.de)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'ok']);
    exit;
}

// Nur POST-Anfragen erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method Not Allowed. Only POST requests are accepted.'
    ]);
    exit;
}

// ============================================================================
// KONFIGURATION (MESHDOC.DE)
// ============================================================================

// 1. Ziel-E-Mail-Adresse (Ausschliesslich info@meshdoc.de)
$RECIPIENT_EMAIL = 'info@meshdoc.de';

// 2. Absender-Adresse (fuer Hetzner SPF/DMARC auf der Domain meshdoc.de)
$FROM_EMAIL = 'info@meshdoc.de';
$FROM_NAME  = 'MeshDoc [www.meshdoc.de]';

// 3. E-Mail-Betreff-Praefix
$SUBJECT_PREFIX = '[MeshDoc - www.meshdoc.de]';

// ============================================================================
// DATEN EXTRAHIEREN & ENTKODIEREN
// ============================================================================

$raw_input = file_get_contents('php://input');
$data = [];

if (!empty($raw_input) && ($json = json_decode($raw_input, true))) {
    $data = $json;
} else {
    $data = $_POST;
}

// 1. Anti-Spam Honeypot Pruefung
if (!empty($data['contact_hp']) || !empty($data['website'])) {
    echo json_encode([
        'success' => true,
        'message' => 'Vielen Dank! Ihre Nachricht wurde sicher übertragen.'
    ]);
    exit;
}

// 2. Rate Limiting (Mindestens 3 Sekunden Abstand zwischen Anfragen)
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
$now = time();
if (isset($_SESSION['last_contact_ts']) && ($now - $_SESSION['last_contact_ts']) < 3) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte warten Sie einen kurzen Moment vor der nächsten Anfrage.'
    ]);
    exit;
}

// 3. Eingabedaten bereinigen & validieren
$name = isset($data['name']) ? trim(strip_tags((string)$data['name'])) : '';
$email = isset($data['email']) ? trim((string)$data['email']) : '';
$message = isset($data['message']) ? trim(strip_tags((string)$data['message'])) : '';
$privacy = isset($data['privacy']) ? (bool)$data['privacy'] : false;

// Header-Injection-Schutz
$name = str_replace(["\r", "\n", "%0a", "%0d"], '', $name);
$email = str_replace(["\r", "\n", "%0a", "%0d"], '', $email);

if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen).'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
    ]);
    exit;
}

if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Die Nachricht muss mindestens 10 Zeichen lang sein.'
    ]);
    exit;
}

if (!$privacy) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte stimmen Sie der Datenschutzerklärung zu.'
    ]);
    exit;
}

// ============================================================================
// 1. BENACHRICHTIGUNG AN DEN BETREIBER ERSTELLEN & VERSENDEN
// ============================================================================

$subject = $SUBJECT_PREFIX . ' Neue Nachricht von ' . $name;
if (function_exists('mb_encode_mimeheader')) {
    $encoded_subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
    $encoded_from_name = mb_encode_mimeheader($FROM_NAME, 'UTF-8', 'B');
} else {
    $encoded_subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $encoded_from_name = '=?UTF-8?B?' . base64_encode($FROM_NAME) . '?=';
}

$sender_ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'Unbekannt';
$timestamp = date('d.m.Y H:i:s') . ' Uhr';

// Uebersichtlicher, eindeutig gebrandeter E-Mail-Text
$body_text  = "========================================================================\r\n";
$body_text .= "NEUE KONTAKTANFRAGE UEBER DEINE WEBSEITE: www.meshdoc.de\r\n";
$body_text .= "Tool: MeshDoc — 3D Print Mesh Repair & Analyzer\r\n";
$body_text .= "========================================================================\r\n\r\n";

$body_text .= "ABSENDER-DETAILS:\r\n";
$body_text .= "------------------------------------------------------------------------\r\n";
$body_text .= "Name:        " . $name . "\r\n";
$body_text .= "E-Mail:      " . $email . " (Antworten geht direkt an diesen Absender)\r\n";
$body_text .= "Datum:       " . $timestamp . "\r\n";
$body_text .= "IP-Adresse:  " . $sender_ip . "\r\n";
$body_text .= "Website:     https://www.meshdoc.de\r\n\r\n";

$body_text .= "NACHRICHT:\r\n";
$body_text .= "------------------------------------------------------------------------\r\n";
$body_text .= $message . "\r\n";
$body_text .= "------------------------------------------------------------------------\r\n\r\n";

$body_text .= "========================================================================\r\n";
$body_text .= "Generiert über das verschlüsselte Kontaktformular auf https://www.meshdoc.de\r\n";
$body_text .= "========================================================================\r\n";

// Multi-Tier E-Mail Versand an Betreiber (Ausschliesslich info@meshdoc.de)
$mail_sent = false;

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8; format=flowed',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $encoded_from_name . ' <' . $FROM_EMAIL . '>',
    'Reply-To: "' . addslashes($name) . '" <' . $email . '>',
    'X-Mailer: PHP/' . phpversion()
];

$additional_parameters = '-f ' . escapeshellarg($FROM_EMAIL);

// 1. Versand an info@meshdoc.de mit Envelope-Sender
$mail_sent = @mail($RECIPIENT_EMAIL, $encoded_subject, $body_text, implode("\r\n", $headers), $additional_parameters);

// Fallback ohne -f Parameter falls durch Server restringiert
if (!$mail_sent) {
    $mail_sent = @mail($RECIPIENT_EMAIL, $encoded_subject, $body_text, implode("\r\n", $headers));
}

if ($mail_sent) {
    $_SESSION['last_contact_ts'] = $now;

    // ========================================================================
    // 2. SOFORTIGER DIREKTER AUTORESPONDER AN DEN ABSENDER ($email)
    // ========================================================================
    // Hinweis: Server-Autoresponder in Hetzner reagieren oft nicht auf Formulare,
    // da Absender und Empfaenger intern sind (Loop-Schutz).
    // Daher versendet dieses Skript die Bestaetigung direkt an den Kunden!
    
    $auto_subject = '[MeshDoc] Eingangsbestätigung: Vielen Dank für deine Nachricht!';
    if (function_exists('mb_encode_mimeheader')) {
        $encoded_auto_subject = mb_encode_mimeheader($auto_subject, 'UTF-8', 'B');
    } else {
        $encoded_auto_subject = '=?UTF-8?B?' . base64_encode($auto_subject) . '?=';
    }

    $auto_body  = "Hallo " . $name . ",\r\n\r\n";
    $auto_body .= "vielen Dank für deine Kontaktaufnahme über MeshDoc (https://www.meshdoc.de).\r\n";
    $auto_body .= "Wir haben deine Anfrage erfolgreich erhalten und werden uns schnellstmöglich bei dir melden.\r\n\r\n";
    $auto_body .= "DEINE NACHRICHT IM ÜBERBLICK:\r\n";
    $auto_body .= "------------------------------------------------------------------------\r\n";
    $auto_body .= $message . "\r\n";
    $auto_body .= "------------------------------------------------------------------------\r\n\r\n";
    $auto_body .= "Mit freundlichen Grüßen,\r\n";
    $auto_body .= "Dein MeshDoc Team\r\n";
    $auto_body .= "https://www.meshdoc.de\r\n\r\n";
    $auto_body .= "Hinweis: Dies ist eine automatische Eingangsbestätigung. Du kannst direkt auf diese E-Mail antworten.";

    $auto_headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8; format=flowed',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . $encoded_from_name . ' <' . $FROM_EMAIL . '>',
        'Reply-To: ' . $RECIPIENT_EMAIL,
        'X-Mailer: PHP/' . phpversion()
    ];

    @mail($email, $encoded_auto_subject, $auto_body, implode("\r\n", $auto_headers), $additional_parameters);

    echo json_encode([
        'success' => true,
        'message' => 'Vielen Dank! Deine Nachricht wurde erfolgreich versendet.'
    ]);
} else {
    error_log('[MeshDoc Contact] PHP mail() failed for: ' . $RECIPIENT_EMAIL);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Der Mailserver konnte die Nachricht nicht direkt zustellen. Bitte schreibe uns direkt an info@meshdoc.de.'
    ]);
}