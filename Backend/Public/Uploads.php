<?php

$corsOrigin = trim((string)(getenv('CORS_ORIGIN') ?: ''));
if ($corsOrigin !== '') {
    $origins = array_map('trim', explode(',', $corsOrigin));
    header('Access-Control-Allow-Origin: ' . $origins[0]);
} else {
    $appEnv = getenv('APP_ENV') ?: 'development';
    header('Access-Control-Allow-Origin: ' . ($appEnv === 'production' ? 'https://k-marcos01.github.io' : '*'));
}

header('X-Content-Type-Options: nosniff');

$requestedFile = $_GET['file'] ?? '';

if ($requestedFile === '') {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status'       => 'ready',
        'allowed_mime' => ['image/jpeg', 'image/png'],
        'max_size_mb'  => 5,
    ]);
    exit(0);
}

$safeName = basename((string)$requestedFile);
if (!preg_match('/^[a-f0-9]{32}\.(jpg|png)$/i', $safeName)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['message' => 'Nom de fichier invalide.']);
    exit(0);
}

$fullPath = __DIR__ . '/uploads/' . $safeName;
if (!is_file($fullPath)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['message' => 'Média introuvable.']);
    exit(0);
}

$mime = (string)mime_content_type($fullPath);
if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
    http_response_code(415);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['message' => 'Format de fichier non autorisé.']);
    exit(0);
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: public, max-age=86400');
readfile($fullPath);