<?php
// Script de gestion d'affichage ou sécurisation d'accès aux images locales
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

echo json_encode([
    "status" => "ready",
    "allowed_mime" => ["image/jpeg", "image/png"],
    "max_size_mb" => 5
]);