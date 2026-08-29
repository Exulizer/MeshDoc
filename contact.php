<?php
/**
 * ============================================================================
 * svender3d.de - MeshDoc — 3D Print Mesh Repair & Analyzer
 * Hetzner Server Kontaktformular Backend (PHP 7.4 - PHP 8.4+)
 * ============================================================================
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

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
// KONFIGURATION (SVENDER3D.DE)
// ============================================================================

// 1. Ziel-E-Mail-Adresse
$RECIPIENT_EMAIL = 'info@svender3d.de';

// 2. Absender-Adresse (Hetzner SPF/DMARC konform)
$FROM_EMAIL = 'noreply@svender3d.de';
$FROM_NAME  = 'MeshDoc [svender3d.de]';

// 3. E-Mail-Betreff-Praefix
$SUBJECT_PREFIX = '[MeshDoc - svender3d.de]';

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
        'message' => 'Vielen Dank! Ihre Nachricht wurde sicher uebertragen.'
    ]);
    exit;
}

// 2. Rate Limiting (Mindestens 5 Sekunden Abstand zwischen Anfragen)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$now = time();
if (isset($_SESSION['last_contact_ts']) && ($now - $_SESSION['last_contact_ts']) < 5) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte warten Sie einen kurzen Moment vor der naechsten Anfrage.'
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
        'error' => 'Bitte geben Sie einen gueltigen Namen ein (2 bis 100 Zeichen).'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte geben Sie eine gueltige E-Mail-Adresse ein.'
    ]);
    exit;
}

if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Die Nachricht muss zwischen 10 und 5000 Zeichen lang sein.'
    ]);
    exit;
}

if (!$privacy) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Bitte stimmen Sie der Datenschutzerklaerung zu.'
    ]);
    exit;
}

// ============================================================================
// E-MAIL ERSTELLEN & VERSENDEN
// ============================================================================

$subject = $SUBJECT_PREFIX . ' Neue Anfrage von ' . $name;
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
$body_text .= "NEUE KONTAKTANFRAGE UEBER DEINE WEBSEITE: svender3d.de\r\n";
$body_text .= "Tool: MeshDoc — 3D Print Mesh Repair & Analyzer\r\n";
$body_text .= "========================================================================\r\n\r\n";

$body_text .= "ABSENDER-DETAILS:\r\n";
$body_text .= "------------------------------------------------------------------------\r\n";
$body_text .= "Name:        " . $name . "\r\n";
$body_text .= "E-Mail:      " . $email . " (Klicke im Mailprogramm einfach auf Antworten)\r\n";
$body_text .= "Datum:       " . $timestamp . "\r\n";
$body_text .= "IP-Adresse:  " . $sender_ip . "\r\n";
$body_text .= "Herkunft:    https://svender3d.de (3D Mesh Repair Tool)\r\n\r\n";

$body_text .= "NACHRICHT DES NUTZERS:\r\n";
$body_text .= "------------------------------------------------------------------------\r\n";
$body_text .= $message . "\r\n";
$body_text .= "------------------------------------------------------------------------\r\n\r\n";

$body_text .= "Hinweis: Diese E-Mail wurde automatisch ueber das sichere Kontaktformular\r\n";
$body_text .= "auf https://svender3d.de generiert.\r\n";
$body_text .= "========================================================================\r\n";

// Hetzner Mail Header (From: noreply@svender3d.de, Reply-To: Absender-Mail)
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8; format=flowed',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . $encoded_from_name . ' <' . $FROM_EMAIL . '>',
    'Reply-To: "' . addslashes($name) . '" <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
    'X-Originating-IP: ' . $sender_ip,
    'X-Website: https://svender3d.de'
];

// Hetzner sendmail Envelope-Sender (-f Parameter)
$additional_parameters = '-f ' . escapeshellarg($FROM_EMAIL);

$mail_sent = @mail(
    $RECIPIENT_EMAIL,
    $encoded_subject,
    $body_text,
    implode("\r\n", $headers),
    $additional_parameters
);

// Fallback falls PHP sendmail-Parameter restringiert ist
if (!$mail_sent) {
    $mail_sent = @mail(
        $RECIPIENT_EMAIL,
        $encoded_subject,
        $body_text,
        implode("\r\n", $headers)
    );
}

if ($mail_sent) {
    $_SESSION['last_contact_ts'] = $now;
    echo json_encode([
        'success' => true,
        'message' => 'Vielen Dank! Ihre Nachricht wurde erfolgreich uebertragen.'
    ]);
} else {
    error_log('[svender3d.de ContactForm] E-Mail-Versand fehlgeschlagen an: ' . $RECIPIENT_EMAIL);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Der Server konnte die E-Mail derzeit nicht versenden. Bitte kontaktieren Sie uns direkt unter ' . $RECIPIENT_EMAIL
    ]);
}