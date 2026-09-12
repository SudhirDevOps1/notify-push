package com.example.ui.qr

import org.json.JSONObject
import java.net.URI

data class ScannedNtfyConfig(
    val serverUrl: String? = null,
    val topic: String,
    val token: String? = null
)

object QrCodeParser {

    /**
     * Parses raw scanned QR code text into Ntfy configuration.
     * Supports:
     * 1. Full URL: "https://ntfy.sh/my-topic" or "https://ntfy.mydomain.com:8443/alerts"
     * 2. URL with token: "https://ntfy.sh/my-topic?auth=tk_123" or "?token=tk_123"
     * 3. Custom scheme: "ntfy://ntfy.sh/my-topic" or "ntfy://my-topic"
     * 4. JSON payload: {"server": "https://ntfy.sh", "topic": "my-topic", "token": "xyz"}
     * 5. Plain text topic: "my-topic-1234"
     */
    fun parse(rawText: String): ScannedNtfyConfig? {
        val trimmed = rawText.trim()
        if (trimmed.isBlank()) return null

        // 1. Check if JSON
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                val json = JSONObject(trimmed)
                val topic = if (json.has("topic")) json.getString("topic").trim() else ""
                if (topic.isNotBlank()) {
                    val server = if (json.has("server")) json.getString("server").trim().takeIf { it.isNotBlank() } else null
                    val token = if (json.has("token")) json.getString("token").trim().takeIf { it.isNotBlank() } else null
                    return ScannedNtfyConfig(serverUrl = server, topic = topic, token = token)
                }
            } catch (_: Exception) {
                // Fall through
            }
        }

        // 2. Check if ntfy:// URI
        if (trimmed.startsWith("ntfy://", ignoreCase = true)) {
            val withoutScheme = trimmed.removePrefix("ntfy://").removePrefix("NTFY://")
            val parts = withoutScheme.split("?", limit = 2)
            val pathPart = parts[0]
            val queryPart = parts.getOrNull(1)

            val segments = pathPart.split("/").filter { it.isNotBlank() }
            val token = queryPart?.let { extractQueryParam(it, "token") ?: extractQueryParam(it, "auth") }

            return if (segments.size >= 2) {
                val host = segments[0]
                val topic = segments.drop(1).joinToString("/")
                ScannedNtfyConfig(
                    serverUrl = "https://$host",
                    topic = topic,
                    token = token
                )
            } else if (segments.size == 1) {
                ScannedNtfyConfig(topic = segments[0], token = token)
            } else {
                null
            }
        }

        // 3. Check if HTTP / HTTPS URL
        if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            try {
                val javaUri = URI(trimmed)
                val scheme = javaUri.scheme ?: "https"
                val host = javaUri.host ?: ""
                val port = javaUri.port
                val serverUrl = if (port != -1) "$scheme://$host:$port" else "$scheme://$host"
                val path = javaUri.path?.trim('/') ?: ""
                val query = javaUri.query
                val token = query?.let { extractQueryParam(it, "token") ?: extractQueryParam(it, "auth") }

                if (path.isNotBlank()) {
                    return ScannedNtfyConfig(
                        serverUrl = serverUrl,
                        topic = path,
                        token = token
                    )
                }
            } catch (_: Exception) {
                // Fall through
            }
        }

        // 4. Plain topic string (alphanumeric, dashes, underscores)
        val cleanTopic = trimmed.replace(" ", "-")
        return ScannedNtfyConfig(topic = cleanTopic)
    }

    private fun extractQueryParam(query: String, key: String): String? {
        val pairs = query.split("&")
        for (pair in pairs) {
            val keyValue = pair.split("=", limit = 2)
            if (keyValue[0].equals(key, ignoreCase = true) && keyValue.size > 1) {
                return keyValue[1]
            }
        }
        return null
    }
}
