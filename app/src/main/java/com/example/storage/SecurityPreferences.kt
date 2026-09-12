package com.example.storage

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.example.data.ChannelApp
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

        // Auto-migration: if no apps are stored but legacy topic exists, convert it
        val storedAppsJson = prefs.getString(KEY_CHANNEL_APPS, null)
        if (storedAppsJson.isNullOrBlank()) {
            val legacyTopic = prefs.getString(KEY_TOPIC, "") ?: ""
            val legacyTopics = legacyTopic.split(",").map { it.trim() }.filter { it.isNotBlank() }
            if (legacyTopics.isNotEmpty()) {
                val initialApps = legacyTopics.mapIndexed { idx, top ->
                    val appName = if (legacyTopics.size == 1) "Main App" else "Web App ${idx + 1}"
                    ChannelApp(name = appName, topic = top)
                }
                saveChannelAppsInternal(initialApps)
            }
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

    private val _channelAppsFlow = MutableStateFlow<List<ChannelApp>>(getChannelApps())
    val channelAppsFlow: StateFlow<List<ChannelApp>> = _channelAppsFlow.asStateFlow()

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

    fun getChannelApps(): List<ChannelApp> {
        val json = prefs.getString(KEY_CHANNEL_APPS, "") ?: ""
        return ChannelApp.listFromJson(json)
    }

    private fun saveChannelAppsInternal(apps: List<ChannelApp>) {
        val json = ChannelApp.listToJson(apps)
        val combinedTopics = apps.map { sanitizeTopic(it.topic) }.filter { it.isNotBlank() }.distinct().joinToString(",")
        prefs.edit()
            .putString(KEY_CHANNEL_APPS, json)
            .putString(KEY_TOPIC, combinedTopics)
            .apply()
    }

    fun saveChannelApps(apps: List<ChannelApp>) {
        saveChannelAppsInternal(apps)
        _channelAppsFlow.value = apps
        val combinedTopics = apps.map { it.topic.trim() }.filter { it.isNotBlank() }.distinct().joinToString(",")
        _topicFlow.value = combinedTopics
    }

    fun addChannelApp(name: String, topic: String): ChannelApp {
        val current = getChannelApps().toMutableList()
        val trimmedTopic = topic.trim()
        val trimmedName = name.trim().ifBlank { "App ${current.size + 1}" }
        val newApp = ChannelApp(name = trimmedName, topic = trimmedTopic)
        current.add(newApp)
        saveChannelApps(current)
        return newApp
    }

    fun deleteChannelApp(id: String) {
        val current = getChannelApps().filter { it.id != id }
        saveChannelApps(current)
    }

    fun findAppByTopic(topicName: String): ChannelApp? {
        val trimmed = topicName.trim()
        return getChannelApps().find { it.topic.equals(trimmed, ignoreCase = true) }
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
        fun sanitizeTopic(raw: String): String {
            return raw.trim()
                .lowercase()
                .replace(Regex("[^a-z0-9_-]"), "-")
                .replace(Regex("-+"), "-")
                .trim('-')
        }
        private const val TAG = "SecurityPreferences"
        private const val PREFS_FILE_NAME = "notifypush_secure_prefs"
        const val DEFAULT_SERVER_URL = "https://ntfy.sh"

        private const val KEY_SERVER_URL = "key_server_url"
        private const val KEY_TOPIC = "key_topic"
        private const val KEY_TOKEN = "key_token"
        private const val KEY_SERVICE_ENABLED = "key_service_enabled"
        private const val KEY_CHANNEL_APPS = "key_channel_apps"

        @Volatile
        private var INSTANCE: SecurityPreferences? = null

        fun getInstance(context: Context): SecurityPreferences {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SecurityPreferences(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
