<?php
class Database {
    private $host = "localhost";
    private $dbname = "pointeresto";
    private $user = "kpano";
    private $password = ""; 
    private $conn = null;

    public function connect() {
        if ($this->conn !== null) {
            return $this->conn;
        }
        try {
            $dsn = "pgsql:host={$this->host};dbname={$this->dbname}";
            $this->conn = new PDO($dsn, $this->user, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            return $this->conn;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database failure: " . $e->getMessage()]);
            exit;
        }
    }
}