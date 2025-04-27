<?php
// Vis alle PHP-feil for debugging
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);

// Sett riktig content-type header for JSON
header("Content-Type: application/json");

// Enkel testrespons for å sjekke om API-et fungerer
$response = [
    "success" => true,
    "message" => "API fungerer!",
    "action" => $_GET["action"] ?? "none",
    "method" => $_SERVER["REQUEST_METHOD"],
    "time" => date("Y-m-d H:i:s")
];

// Legg til databasetilkobling for mer omfattende tester
if (isset($_GET["action"]) && $_GET["action"] == "showTables") {
    try {
        $db = new PDO("mysql:host=db;dbname=mortalitet;charset=utf8mb4", "mortalitetbruker", "mortalitetpassord");
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Hent alle tabeller
        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        
        $tableData = [];
        foreach ($tables as $table) {
            $count = $db->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            $tableData[$table] = (int)$count;
        }
        
        $response["success"] = true;
        $response["tables"] = $tableData;
    } catch (PDOException $e) {
        $response["success"] = false;
        $response["error"] = "Database error: " . $e->getMessage();
    }
}

// Håndter registrering av nye data
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_GET["action"]) && $_GET["action"] === "register") {
    // Hent POST-data
    $input = json_decode(file_get_contents("php://input"), true);
    
    if ($input) {
        // Sett default-verdi for alder hvis den mangler eller er ugyldig
        if (!isset($input["patientAge"]) || !is_numeric($input["patientAge"]) || $input["patientAge"] <= 0) {
            $input["patientAge"] = 65; // Default-alder
        }
        
        try {
            $db = new PDO("mysql:host=db;dbname=mortalitet;charset=utf8mb4", "mortalitetbruker", "mortalitetpassord");
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Start en transaksjon
            $db->beginTransaction();
            
            // Sett inn i death_records tabellen
            $stmt = $db->prepare("INSERT INTO death_records (
                patient_id, patient_age, patient_gender, patient_residence,
                death_date, death_context, autopsy_performed, registered_by,
                additional_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)");
            
            $stmt->execute([
                $input["patientId"] ?? "TEST" . rand(1000, 9999),
                $input["patientAge"],
                $input["patientGender"] ?? "male",
                $input["patientResidence"] ?? "Oslo",
                $input["deathDate"] ?? date("Y-m-d"),
                $input["deathContext"] ?? "natural",
                $input["autopsyPerformed"] ?? "no",
                $input["additionalInfo"] ?? null
            ]);
            
            $recordId = $db->lastInsertId();
            
            // Legg til primær dødsårsak
            $stmt = $db->prepare("INSERT INTO death_causes (
                record_id, cause_type, icd_code, description
            ) VALUES (?, \"primary\", ?, ?)");
            
            $stmt->execute([
                $recordId,
                $input["primaryCauseCode"] ?? "I21.9",
                $input["primaryCauseDesc"] ?? "Hjerteinfarkt"
            ]);
            
            // Håndter sekundære dødsårsaker hvis de finnes
            if (!empty($input["secondaryCauseCodes"])) {
                $codes = explode(",", $input["secondaryCauseCodes"]);
                $descParts = explode(";", $input["secondaryCauseDesc"] ?? "");
                
                foreach ($codes as $index => $code) {
                    $desc = isset($descParts[$index]) ? trim($descParts[$index]) : "";
                    
                    $stmt = $db->prepare("INSERT INTO death_causes (
                        record_id, cause_type, icd_code, description
                    ) VALUES (?, \"secondary\", ?, ?)");
                    
                    $stmt->execute([
                        $recordId,
                        trim($code),
                        $desc
                    ]);
                }
            }
            
            // Håndter underliggende dødsårsaker hvis de finnes
            if (!empty($input["underlyingCauseCodes"])) {
                $codes = explode(",", $input["underlyingCauseCodes"]);
                $descParts = explode(";", $input["underlyingCauseDesc"] ?? "");
                
                foreach ($codes as $index => $code) {
                    $desc = isset($descParts[$index]) ? trim($descParts[$index]) : "";
                    
                    $stmt = $db->prepare("INSERT INTO death_causes (
                        record_id, cause_type, icd_code, description
                    ) VALUES (?, \"underlying\", ?, ?)");
                    
                    $stmt->execute([
                        $recordId,
                        trim($code),
                        $desc
                    ]);
                }
            }
            
            // Fullfør transaksjonen
            $db->commit();
            
            $response["success"] = true;
            $response["recordId"] = $recordId;
            $response["message"] = "Registrering lagret";
            
        } catch (PDOException $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            
            $response["success"] = false;
            $response["error"] = "Database error: " . $e->getMessage();
        }
    } else {
        $response["success"] = false;
        $response["error"] = "Ugyldig JSON i forespørselen";
    }
}

// Hent registreringer
if (isset($_GET["action"]) && $_GET["action"] == "getRecords") {
    try {
        $db = new PDO("mysql:host=db;dbname=mortalitet;charset=utf8mb4", "mortalitetbruker", "mortalitetpassord");
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $query = "
            SELECT dr.record_id, dr.patient_id, dr.death_date, dr.patient_age, dr.patient_gender,
                  (SELECT icd_code FROM death_causes WHERE record_id = dr.record_id AND cause_type = \"primary\" LIMIT 1) as primary_cause_code,
                  (SELECT description FROM death_causes WHERE record_id = dr.record_id AND cause_type = \"primary\" LIMIT 1) as primary_cause_desc
            FROM death_records dr
            ORDER BY dr.death_date DESC
            LIMIT 100
        ";
        
        $stmt = $db->query($query);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $response["success"] = true;
        $response["records"] = $records;
    } catch (PDOException $e) {
        $response["success"] = false;
        $response["error"] = "Database error: " . $e->getMessage();
    }
}

// Returner responsen som JSON
echo json_encode($response);
?>