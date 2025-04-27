# Opprett debug-api.php i app/api/
echo '<?php
header("Content-Type: application/json");
echo json_encode(["success" => true, "message" => "API fungerer!", "data" => $_GET, "time" => date("Y-m-d H:i:s")]);
?>' > app/api/debug-api.php