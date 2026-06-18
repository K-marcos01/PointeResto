<?php
class Database {
    private $conn = null;

    public function connect() {
        if ($this->conn !== null) return $this->conn;

        // Railway injecte DATABASE_URL automatiquement
        $databaseUrl = getenv('DATABASE_URL');

        if ($databaseUrl) {
            $params = parse_url($databaseUrl);
            $dsn = sprintf(
                "pgsql:host=%s;port=%s;dbname=%s;sslmode=require",
                $params['host'],
                $params['port'] ?? 5432,
                ltrim($params['path'], '/')
            );
            $user     = $params['user'];
            $password = $params['pass'];
        } else {
            // Fallback local
            $dsn      = "pgsql:host=localhost;dbname=pointeresto";
            $user     = getenv('DB_USER')     ?: 'kpano';
            $password = getenv('DB_PASSWORD') ?: '';
        }

        try {
            $this->conn = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            return $this->conn;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Database failure: " . $e->getMessage()]);
            exit;
        }
    }
}
