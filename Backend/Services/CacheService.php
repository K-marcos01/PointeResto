<?php

declare(strict_types=1);

namespace App\Services;

class CacheService
{
    private ?\Redis $redis = null;
    private string $fallbackDir;

    public function __construct()
    {
        $this->fallbackDir = sys_get_temp_dir() . '/pointeresto_cache';
        if (!is_dir($this->fallbackDir)) {
            mkdir($this->fallbackDir, 0775, true);
        }

        $redisUrl = getenv('REDIS_URL') ?: '';
        if ($redisUrl !== '' && class_exists(\Redis::class)) {
            try {
                $parts = parse_url($redisUrl);
                $client = new \Redis();
                $client->connect($parts['host'] ?? '127.0.0.1', (int)($parts['port'] ?? 6379), 1.5);
                if (!empty($parts['pass'])) {
                    $client->auth($parts['pass']);
                }
                $this->redis = $client;
            } catch (\Throwable $e) {
                $this->redis = null;
            }
        }
    }

    public function get(string $key): mixed
    {
        if ($this->redis !== null) {
            $raw = $this->redis->get($key);
            return $raw !== false ? json_decode($raw, true) : null;
        }

        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        if (!is_file($file)) {
            return null;
        }

        $payload = json_decode((string)file_get_contents($file), true);
        if (!is_array($payload) || ($payload['expires_at'] ?? 0) < time()) {
            @unlink($file);
            return null;
        }

        return $payload['data'] ?? null;
    }

    public function set(string $key, mixed $value, int $ttlSeconds = 300): void
    {
        if ($this->redis !== null) {
            $this->redis->setex($key, $ttlSeconds, json_encode($value, JSON_UNESCAPED_UNICODE));
            return;
        }

        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        $payload = [
            'expires_at' => time() + $ttlSeconds,
            'data'       => $value,
        ];
        file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    public function delete(string $key): void
    {
        if ($this->redis !== null) {
            $this->redis->del($key);
            return;
        }

        $file = $this->fallbackDir . '/' . md5($key) . '.json';
        if (is_file($file)) {
            @unlink($file);
        }
    }
}