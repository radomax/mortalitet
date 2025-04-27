<?php
// Database-tilkoblingsparametre
define('DB_HOST', getenv('DB_HOST') ? getenv('DB_HOST') : 'localhost');
define('DB_NAME', getenv('DB_NAME') ? getenv('DB_NAME') : 'mortalitet');
define('DB_USER', getenv('DB_USER') ? getenv('DB_USER') : 'mortalitetbruker');
define('DB_PASS', getenv('DB_PASS') ? getenv('DB_PASS') : 'mortalitetpassord');

// Applikasjonsinnstillinger
define('APP_NAME', 'Mortalitet');
define('SESSION_TIMEOUT', 1800); // 30 minutter
define('ENABLE_DEBUG', false);
define('LOG_PATH', '/var/log/mortalitet/');

// Sikkerhet
define('ENCRYPTION_KEY', 'p7Wq3L8xA2tF5sD1'); // Bytt denne til en tilfeldig streng i produksjon
define('ALLOWED_IPS', ''); // Tom for å tillate alle, eller komma-separert liste av IP-er

// Funksjon for databasetilkobling
function getDbConnection() {
    try {
        $conn = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        return $conn;
    } catch (PDOException $e) {
        // I produksjon, logg feilen istedenfor å vise den
        if (!ENABLE_DEBUG) {
            error_log("Database connection error: " . $e->getMessage(), 0);
            die("Det oppstod en feil ved tilkobling til databasen. Vennligst prøv igjen senere.");
        } else {
            throw $e; // Kast feilen på nytt i debug-modus
        }
    }
}

// Logger sikkerhetshendelser
function logSecurityEvent($message, $type = 'info', $userId = null) {
    $logFile = LOG_PATH . 'security.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    $logEntry = "[$timestamp][$type] IP: $ip, User ID: $userId, User-Agent: $userAgent - $message" . PHP_EOL;
    
    if (!file_exists(dirname($logFile))) {
        mkdir(dirname($logFile), 0755, true);
    }
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    
    // Hvis dette er en kritisk hendelse, forsøk også å logge til databasen
    if ($type === 'error' || $type === 'security') {
        try {
            $db = getDbConnection();
            $stmt = $db->prepare('INSERT INTO system_logs (log_type, log_message, log_source, user_id, ip_address) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$type, $message, 'application', $userId, $ip]);
        } catch (Exception $e) {
            // Fortsett selv om databaselogging feiler
            error_log("Failed to log to database: " . $e->getMessage(), 0);
        }
    }
}