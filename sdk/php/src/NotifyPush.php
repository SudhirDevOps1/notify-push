<?php

namespace NotifyPush;

class NotifyPush {
    private string $serverUrl;
    private string $topic;
    private ?string $token;
    private int $timeout;

    public function __construct(
        ?string $serverUrl = null,
        ?string $topic = null,
        ?string $token = null,
        int $timeout = 4
    ) {
        $this->serverUrl = rtrim($serverUrl ?? getenv('NOTIFY_SERVER') ?: 'https://ntfy.sh', '/');
        $this->topic = $topic ?? getenv('NOTIFY_TOPIC') ?: '';
        $this->token = $token ?? getenv('NOTIFY_TOKEN') ?: null;
        $this->timeout = $timeout;
    }

    public function send(
        string $title,
        string $message,
        string $priority = 'default',
        array $tags = [],
        ?string $clickUrl = null,
        array $actions = [],
        ?string $customTopic = null
    ): bool {
        $targetTopic = $customTopic ?? $this->topic;
        if (empty($targetTopic)) {
            return false;
        }

        $headers = [
            "Title: " . str_replace(["\r", "\n"], ' ', $title),
            "Priority: {$priority}",
            "Content-Type: text/plain; charset=utf-8"
        ];

        if ($this->token) {
            $headers[] = "Authorization: Bearer {$this->token}";
        }
        if (!empty($tags)) {
            $headers[] = "Tags: " . implode(',', $tags);
        }
        if ($clickUrl) {
            $headers[] = "Click: {$clickUrl}";
        }
        if (!empty($actions)) {
            $actionStrings = [];
            foreach ($actions as $act) {
                $pairs = [];
                foreach ($act as $k => $v) {
                    $pairs[] = "{$k}={$v}";
                }
                $actionStrings[] = implode(', ', $pairs);
            }
            $headers[] = "Actions: " . implode('; ', $actionStrings);
        }

        $ch = curl_init("{$this->serverUrl}/" . urlencode($targetTopic));
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $message,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return ($httpCode >= 200 && $httpCode < 300);
    }
}
