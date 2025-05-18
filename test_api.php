# en enkel API-testfil
echo '<?php
header("Content-Type: application/json");
echo json_encode(["success" => true, "message" => "API fungerer!", "time" => date("Y-m-d H:i:s")]);
?>' > app/api-test.php