package com.example.storage

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SecurityPreferences(context: Context) {

    private val prefs: SharedPreferences

    init {
        prefs = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_FILE_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.w(TAG, "EncryptedSharedPreferences unavailable, falling back to standard SharedPreferences: ${e.message}")
            context.getSharedPreferences(PREFS_FILE_NAME + "_fallback", Context.MODE_PRIVATE)
        }
    }

    private val _serverUrlFlow = MutableStateFlow(serverUrl)
    val serverUrlFlow: StateFlow<String> = _serverUrlFlow.asStateFlow()

    private val _topicFlow = MutableStateFlow(topic)
    val topicFlow: StateFlow<String> = _topicFlow.asStateFlow()

    private val _tokenFlow = MutableStateFlow(token)
    val tokenFlow: StateFlow<String> = _tokenFlow.asStateFlow()

    private val _isServiceEnabledFlow = MutableStateFlow(isServiceEnabled)
    val isServiceEnabledFlow: StateFlow<Boolean> = _isServiceEnabledFlow.asStateFlow()

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        set(value) {
            val sanitized = sanitizeServerUrl(value)
            prefs.edit().putString(KEY_SERVER_URL, sanitized).apply()
            _serverUrlFlow.value = sanitized
        }

    var topic: String
        get() = prefs.getString(KEY_TOPIC, "") ?: ""
        set(value) {
            val trimmed = value.trim()
            prefs.edit().putString(KEY_TOPIC, trimmed).apply()
            _topicFlow.value = trimmed
        }

    var token: String
        get() = prefs.getString(KEY_TOKEN, "") ?: ""
        set(value) {
            val trimmed = value.trim()
            prefs.edit().putString(KEY_TOKEN, trimmed).apply()
            _tokenFlow.value = trimmed
        }

    var isServiceEnabled: Boolean
        get() = prefs.getBoolean(KEY_SERVICE_ENABLED, false)
        set(value) {
            prefs.edit().putBoolean(KEY_SERVICE_ENABLED, value).apply()
            _isServiceEnabledFlow.value = value
        }

    fun saveConfig(serverUrl: String, topic: String, token: String, enabled: Boolean) {
        val sanitizedUrl = sanitizeServerUrl(serverUrl)
        val sanitizedTopic = topic.trim()
        val sanitizedToken = token.trim()

        prefs.edit()
            .putString(KEY_SERVER_URL, sanitizedUrl)
            .putString(KEY_TOPIC, sanitizedTopic)
            .putString(KEY_TOKEN, sanitizedToken)
            .putBoolean(KEY_SERVICE_ENABLED, enabled)
            .apply()

        _serverUrlFlow.value = sanitizedUrl
        _topicFlow.value = sanitizedTopic
        _tokenFlow.value = sanitizedToken
        _isServiceEnabledFlow.value = enabled
    }

    private fun sanitizeServerUrl(url: String): String {
        var trimmed = url.trim()
        if (trimmed.isEmpty()) return DEFAULT_SERVER_URL
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            trimmed = "https://$trimmed"
        }
        return trimmed.removeSuffix("/")
    }

    companion object {
        private const val TAG = "SecurityPreferences"
        private const val PREFS_FILE_NAME = "notifypush_secure_prefs"
        const val DEFAULT_SERVER_URL = "https://ntfy.sh"

        private const val KEY_SERVER_URL = "key_server_url"
        private const val KEY_TOPIC = "key_topic"
        private const val KEY_TOKEN = "key_token"
        private const val KEY_SERVICE_ENABLED = "key_service_enabled"

        @Volatile
        private var INSTANCE: SecurityPreferences? = null

        fun getInstance(context: Context): SecurityPreferences {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SecurityPreferences(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
