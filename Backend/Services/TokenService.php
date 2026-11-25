<?php

declare(strict_types=1);

class TokenService {
    private static function getSecret(): string {
        $secret = getenv('APP_SECRET') ?: '';
        if ($secret !== '') {
            return $secret;
        }
        return 'pointeresto-hmac-secret-key-2026';
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string|false {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'), true);
    }

    public static function generate(array $user, int $ttlSeconds = 86400): string {
        $header = self::base64UrlEncode((string)json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ]));

        $now = time();
        $payload = self::base64UrlEncode((string)json_encode([
            'sub'   => (int)$user['id_utilisateur'],
            'role'  => (string)($user['role'] ?? 'client'),
            'email' => (string)($user['email'] ?? ''),
            'iat'   => $now,
            'exp'   => $now + $ttlSeconds,
        ]));

        $signature = hash_hmac('sha256', "{$header}.{$payload}", self::getSecret(), true);
        return "{$header}.{$payload}." . self::base64UrlEncode($signature);
    }

    public static function verify(string $token): ?array {
        $parts = explode('.', trim($token));
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;
        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "{$headerB64}.{$payloadB64}", self::getSecret(), true)
        );

        if (!hash_equals($expectedSig, $signatureB64)) {
            return null;
        }

        $decodedPayload = self::base64UrlDecode($payloadB64);
        if ($decodedPayload === false) {
            return null;
        }

        $payload = json_decode($decodedPayload, true);
        if (!is_array($payload) || empty($payload['sub'])) {
            return null;
        }

        if (isset($payload['exp']) && (int)$payload['exp'] < time()) {
            return null;
        }

        return [
            'id_utilisateur' => (int)$payload['sub'],
            'role'           => (string)($payload['role'] ?? 'client'),
            'email'          => (string)($payload['email'] ?? ''),
        ];
    }

    public static function extractBearerToken(): ?string {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if ($authHeader === '' && function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $key => $value) {
                if (strcasecmp((string)$key, 'Authorization') === 0) {
                    $authHeader = (string)$value;
                    break;
                }
            }
        }

        if (preg_match('/^Bearer\s+(\S+)$/i', trim($authHeader), $matches)) {
            return $matches[1];
        }

        return null;
    }

    public static function getAuthenticatedUser(): ?array {
        $token = self::extractBearerToken();
        if ($token === null) {
            return null;
        }
        return self::verify($token);
    }
}