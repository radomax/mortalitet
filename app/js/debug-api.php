<?php
/**
 * Debug API for Mortalitet Application
 * 
 * Denne filen fungerer som en mellommann mellom frontend og backend
 * og logger alle API-forespørsler for feilsøking.
 */

// Vis alle PHP-feil for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Loggfunksjon for debugging
function debug_log($message, $data = null) {
    $logFile = '../logs/api-debug.log';
    $logDir = dirname($logFile);
    
    // Opprett loggmappen hvis den ikke finnes
    if (!file_exists($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";
    
    if ($data !== null) {
        $logMessage .= json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
    
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Legg til CORS-headers for utvikling
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Behandle pre-flight OPTIONS-forespørsler
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Få innholdet fra forespørselen
$requestBody = file_get_contents('php://input');
$requestData = json_decode($requestBody, true);

// Logg innkommende forespørsel
debug_log("Innkommende {$_SERVER['REQUEST_METHOD']}-forespørsel til {$_SERVER['REQUEST_URI']}", [
    'headers' => getallheaders(),
    'query' => $_GET,
    'body' => $requestData,
    'files' => $_FILES
]);

// Hent databasetilkobling
function getDbConnection() {
    $host = 'db'; // Container-navn i Docker
    $dbname = 'mortalitet';
    $username = 'mortalitetbruker';
    $password = 'mortalitetpassord';
    
    try {
        $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        debug_log("Databasetilkoblingsfeil", ['error' => $e->getMessage()]);
        return null;
    }
}

// Håndter registrering av dødsårsak
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'register') {
    $db = getDbConnection();
    
    if (!$db) {
        echo json_encode(['error' => 'Kunne ikke koble til databasen']);
        exit;
    }
    
    try {
        debug_log("Starter registrering i databasen", $requestData);
        
        // Start transaksjon
        $db->beginTransaction();
        
        // Lagre hovedoppføring
        $stmt = $db->prepare('INSERT INTO death_records 
                            (patient_id, patient_age, patient_gender, patient_residence, 
                            death_date, death_context, autopsy_performed, 
                            registered_by, additional_info) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        
        // Sett default registrar user_id til 1 (admin)
        $registeredBy = 1;
        
        $stmt->execute([
            $requestData['patientId'],
            $requestData['patientAge'],
            $requestData['patientGender'],
            $requestData['patientResidence'],
            $requestData['deathDate'],
            $requestData['deathContext'],
            $requestData['autopsyPerformed'],
            $registeredBy,
            $requestData['additionalInfo'] ?? null
        ]);
        
        $recordId = $db->lastInsertId();
        debug_log("Opprettet death_record med ID: $recordId");
        
        // Lagre primær dødsårsak
        $stmt = $db->prepare('INSERT INTO death_causes (record_id, cause_type, icd_code, description) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $recordId,
            'primary',
            $requestData['primaryCauseCode'],
            $requestData['primaryCauseDesc']
        ]);
        debug_log("Lagret primær dødsårsak");
        
        // Lagre sekundære dødsårsaker (hvis de finnes)
        if (!empty($requestData['secondaryCauseCodes'])) {
            $secondaryCodes = array_map('trim', explode(',', $requestData['secondaryCauseCodes']));
            $secondaryDescs = explode(';', $requestData['secondaryCauseDesc'] ?? '');
            
            foreach ($secondaryCodes as $index => $code) {
                $desc = isset($secondaryDescs[$index]) ? trim($secondaryDescs[$index]) : '';
                $stmt->execute([
                    $recordId,
                    'secondary',
                    $code,
                    $desc
                ]);
            }
            debug_log("Lagret sekundære dødsårsaker");
        }
        
        // Lagre underliggende dødsårsaker (hvis de finnes)
        if (!empty($requestData['underlyingCauseCodes'])) {
            $underlyingCodes = array_map('trim', explode(',', $requestData['underlyingCauseCodes']));
            $underlyingDescs = explode(';', $requestData['underlyingCauseDesc'] ?? '');
            
            foreach ($underlyingCodes as $index => $code) {
                $desc = isset($underlyingDescs[$index]) ? trim($underlyingDescs[$index]) : '';
                $stmt->execute([
                    $recordId,
                    'underlying',
                    $code,
                    $desc
                ]);
            }
            debug_log("Lagret underliggende dødsårsaker");
        }
        
        // Commit transaksjonen
        $db->commit();
        
        debug_log("Registrering fullført vellykket");
        echo json_encode([
            'success' => true,
            'recordId' => $recordId,
            'message' => 'Registrering lagret'
        ]);
    } catch (Exception $e) {
        // Rollback ved feil
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        
        debug_log("Feil under registrering", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        
        echo json_encode([
            'error' => 'Kunne ikke lagre registrering',
            'details' => $e->getMessage()
        ]);
    }
} 
// Håndter henting av registreringer
else if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'getRecords') {
    $db = getDbConnection();
    
    if (!$db) {
        echo json_encode(['error' => 'Kunne ikke koble til databasen']);
        exit;
    }
    
    try {
        $query = '
            SELECT dr.record_id, dr.patient_id, dr.patient_age, dr.patient_gender, 
                dr.patient_residence, dr.death_date, dr.death_context, 
                (SELECT icd_code FROM death_causes WHERE record_id = dr.record_id AND cause_type = "primary") as primary_cause_code,
                (SELECT description FROM death_causes WHERE record_id = dr.record_id AND cause_type = "primary") as primary_cause_desc
            FROM death_records dr
            ORDER BY dr.death_date DESC
            LIMIT 100
        ';
        
        $stmt = $db->query($query);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        debug_log("Hentet " . count($records) . " registreringer");
        
        echo json_encode([
            'success' => true,
            'records' => $records
        ]);
    } catch (Exception $e) {
        debug_log("Feil ved henting av registreringer", ['error' => $e->getMessage()]);
        
        echo json_encode([
            'error' => 'Kunne ikke hente registreringer',
            'details' => $e->getMessage()
        ]);
    }
}
// Håndter testing av frontend/backend-kommunikasjon
else if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'test') {
    // Enkelt test-endepunkt for å verifisere at API er tilgjengelig
    debug_log("Test-endepunkt kalt", $requestData);
    
    echo json_encode([
        'success' => true,
        'message' => 'API tilgjengelig og fungerer',
        'received' => $requestData,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
// Debug-endepunkt for å vise alle tabeller
else if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'showTables') {
    $db = getDbConnection();
    
    if (!$db) {
        echo json_encode(['error' => 'Kunne ikke koble til databasen']);
        exit;
    }
    
    try {
        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        
        $tableData = [];
        foreach ($tables as $table) {
            $count = $db->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            $tableData[$table] = $count;
        }
        
        echo json_encode([
            'success' => true,
            'tables' => $tableData
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'error' => 'Kunne ikke hente tabellinformasjon',
            'details' => $e->getMessage()
        ]);
    }
}
else {
    debug_log("Ukjent endepunkt eller metode");
    
    echo json_encode([
        'error' => 'Ukjent endepunkt eller metode',
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI']
    ]);
}