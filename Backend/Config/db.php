<?php

class Database {
    private ?PDO $conn = null;

    public function connect(): PDO {
        if ($this->conn !== null) {
            return $this->conn;
        }

        $appEnv      = getenv('APP_ENV') ?: 'development';
        $databaseUrl = getenv('DATABASE_URL') ?: '';

        if ($databaseUrl !== '') {
            $params = parse_url($databaseUrl);
            $queryParams = [];
            if (!empty($params['query'])) {
                parse_str($params['query'], $queryParams);
            }

            $defaultSslMode = ($appEnv === 'production') ? 'require' : 'prefer';
            $sslMode = $queryParams['sslmode'] ?? $defaultSslMode;

            $dsn = sprintf(
                'pgsql:host=%s;port=%d;dbname=%s;sslmode=%s',
                $params['host'] ?? 'localhost',
                (int)($params['port'] ?? 5432),
                ltrim($params['path'] ?? '/pointeresto', '/'),
                $sslMode
            );
            $user     = isset($params['user']) ? urldecode($params['user']) : 'postgres';
            $password = isset($params['pass']) ? urldecode($params['pass']) : '';
        } else {
            $host     = getenv('PGHOST') ?: 'localhost';
            $port     = getenv('PGPORT') ?: '5432';
            $dbname   = getenv('PGDATABASE') ?: 'pointeresto';
            $dsn      = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $dbname);
            $user     = getenv('PGUSER') ?: (getenv('DB_USER') ?: 'pointeresto_user');
            $password = getenv('PGPASSWORD') ?: (getenv('DB_PASSWORD') ?: 'pointeresto_pass');
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
            $message = ($appEnv === 'production')
                ? 'Erreur de connexion à la base de données.'
                : 'Database failure: ' . $e->getMessage();
            echo json_encode(['error' => $message]);
            exit;
        }
    }
}