<?php
// Enkelt script for å teste databasetilkobling

// Vis alle PHP-feil (bare for testing)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Database Test</h1>";

// Tilkoblingsparametere
$host = 'db';  // Bruk containernavnet som hostname
$dbname = 'mortalitet';
$username = 'mortalitetbruker';
$password = 'mortalitetpassord';

try {
    // Forsøk å koble til databasen
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    
    // Sett feilmodus
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color:green'>✓ Databasetilkobling vellykket!</p>";
    
    // Sjekk om tabellene er opprettet
    $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h2>Tabeller i databasen:</h2>";
    echo "<ul>";
    if (count($tables) > 0) {
        foreach ($tables as $table) {
            echo "<li>$table</li>";
        }
    } else {
        echo "<li style='color:red'>Ingen tabeller funnet. Sjekk at databaseskjemaet er importert korrekt.</li>";
    }
    echo "</ul>";
    
    // Test innsetting av data
    echo "<h2>Test av dataregistrering:</h2>";
    
    // Sjekk om testtabellen finnes
    $tableExists = false;
    foreach ($tables as $table) {
        if ($table === 'test_table') {
            $tableExists = true;
            break;
        }
    }
    
    // Opprett testtabell hvis den ikke finnes
    if (!$tableExists) {
        $conn->exec("CREATE TABLE test_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_data VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        echo "<p>Testtabell opprettet.</p>";
    }
    
    // Sett inn testdata
    $stmt = $conn->prepare("INSERT INTO test_table (test_data) VALUES (:data)");
    $testData = "Test data " . date('Y-m-d H:i:s');
    $stmt->bindParam(':data', $testData);
    $stmt->execute();
    
    echo "<p style='color:green'>✓ Testdata satt inn i databasen: '$testData'</p>";
    
    // Vis testdata
    $result = $conn->query("SELECT * FROM test_table ORDER BY id DESC LIMIT 5");
    $rows = $result->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Siste 5 testregistreringer:</h3>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>Data</th><th>Tidspunkt</th></tr>";
    
    foreach ($rows as $row) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['test_data']}</td>";
        echo "<td>{$row['created_at']}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    // Sjekk hvis users-tabellen eksisterer og vis eventuelle brukere
    if (in_array('users', $tables)) {
        $result = $conn->query("SELECT user_id, username, role, email FROM users");
        $users = $result->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>Brukere i systemet:</h3>";
        if (count($users) > 0) {
            echo "<table border='1' cellpadding='5'>";
            echo "<tr><th>ID</th><th>Brukernavn</th><th>Rolle</th><th>E-post</th></tr>";
            
            foreach ($users as $user) {
                echo "<tr>";
                echo "<td>{$user['user_id']}</td>";
                echo "<td>{$user['username']}</td>";
                echo "<td>{$user['role']}</td>";
                echo "<td>{$user['email']}</td>";
                echo "</tr>";
            }
            
            echo "</table>";
        } else {
            echo "<p style='color:orange'>Ingen brukere funnet i users-tabellen.</p>";
        }
    } else {
        echo "<p style='color:red'>Users-tabellen finnes ikke i databasen!</p>";
    }
    
} catch(PDOException $e) {
    echo "<p style='color:red'>Tilkoblingsfeil: " . $e->getMessage() . "</p>";
    
    echo "<h3>Feilsøkingsinfo:</h3>";
    echo "<ul>";
    echo "<li>Host: $host</li>";
    echo "<li>Database: $dbname</li>";
    echo "<li>Brukernavn: $username</li>";
    echo "</ul>";
    
    echo "<p>Kontroller at:</p>";
    echo "<ol>";
    echo "<li>Databasecontaineren kjører (docker ps)</li>";
    echo "<li>Databasen er opprettet med riktig navn</li>";
    echo "<li>Brukeren har riktig passord og tilgangsrettigheter</li>";
    echo "<li>Nettverket mellom containerne fungerer</li>";
    echo "</ol>";
}
?>