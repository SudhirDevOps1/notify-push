package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AppDatabase
import com.example.data.NotificationItem
import com.example.data.NotificationRepository
import com.example.network.NtfySender
import com.example.service.ConnectionState
import com.example.service.NotificationListenerService
import com.example.storage.SecurityPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = SecurityPreferences.getInstance(application)
    private val database = AppDatabase.getDatabase(application)
    private val repository = NotificationRepository(database.notificationDao())

    val serverUrl: StateFlow<String> = prefs.serverUrlFlow
    val topic: StateFlow<String> = prefs.topicFlow
    val token: StateFlow<String> = prefs.tokenFlow
    val isServiceEnabled: StateFlow<Boolean> = prefs.isServiceEnabledFlow
    val connectionState: StateFlow<ConnectionState> = NotificationListenerService.connectionState
    val channelApps: StateFlow<List<com.example.data.ChannelApp>> = prefs.channelAppsFlow

    val rawNotifications: StateFlow<List<NotificationItem>> = repository.allNotifications
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _filterPriority = MutableStateFlow<Int?>(null) // null = All, 4 = High/Urgent (>=4)
    val filterPriority: StateFlow<Int?> = _filterPriority.asStateFlow()

    private val _filterOnlyWithLinks = MutableStateFlow(false)
    val filterOnlyWithLinks: StateFlow<Boolean> = _filterOnlyWithLinks.asStateFlow()

    val notifications: StateFlow<List<NotificationItem>> = combine(
        repository.allNotifications,
        _searchQuery,
        _filterPriority,
        _filterOnlyWithLinks
    ) { list, query, priority, onlyLinks ->
        val trimmedQuery = query.trim()
        list.filter { item ->
            val matchesQuery = if (trimmedQuery.isEmpty()) true else {
                item.title.contains(trimmedQuery, ignoreCase = true) ||
                    item.message.contains(trimmedQuery, ignoreCase = true) ||
                    item.tags.contains(trimmedQuery, ignoreCase = true)
            }
            val matchesPriority = when (priority) {
                null -> true
                4 -> item.priority >= 4
                else -> item.priority == priority
            }
            val matchesLinks = if (onlyLinks) !item.clickUrl.isNullOrBlank() else true

            matchesQuery && matchesPriority && matchesLinks
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    private val _isTesting = MutableStateFlow(false)
    val isTesting: StateFlow<Boolean> = _isTesting.asStateFlow()

    private val _testMessage = MutableStateFlow<String?>(null)
    val testMessage: StateFlow<String?> = _testMessage.asStateFlow()

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setFilterPriority(priority: Int?) {
        _filterPriority.value = if (_filterPriority.value == priority) null else priority
    }

    fun toggleFilterOnlyWithLinks() {
        _filterOnlyWithLinks.value = !_filterOnlyWithLinks.value
    }

    fun clearFilters() {
        _searchQuery.value = ""
        _filterPriority.value = null
        _filterOnlyWithLinks.value = false
    }

    fun exportNotificationsJson(): String {
        val items = rawNotifications.value
        val jsonArray = JSONArray()
        for (item in items) {
            val obj = JSONObject()
            obj.put("id", item.id)
            obj.put("ntfyId", item.ntfyId)
            obj.put("title", item.title)
            obj.put("message", item.message)
            obj.put("topic", item.topic)
            obj.put("timestamp", item.timestamp)
            obj.put("priority", item.priority)
            obj.put("tags", item.tags)
            obj.put("clickUrl", item.clickUrl ?: "")
            jsonArray.put(obj)
        }
        return jsonArray.toString(2)
    }

    fun updateServerUrl(url: String) {
        prefs.serverUrl = url
    }

    fun updateTopic(newTopic: String) {
        prefs.topic = newTopic
    }

    fun updateToken(newToken: String) {
        prefs.token = newToken
    }

    fun applyScannedConfig(config: com.example.ui.qr.ScannedNtfyConfig) {
        config.serverUrl?.let { prefs.serverUrl = it }
        config.token?.let { prefs.token = it }
        if (!config.appName.isNullOrBlank()) {
            val app = prefs.addChannelApp(config.appName, config.topic)
            _testMessage.value = "Imported App '${app.name}' (#${app.topic}) via QR!"
        } else {
            prefs.topic = config.topic
            _testMessage.value = "Imported config: topic '${config.topic}'"
        }
        // Auto connect if topic is valid
        if (config.topic.isNotBlank()) {
            saveAndConnect()
        }
    }

    fun generateRandomTopic() {
        val randomSuffix = UUID.randomUUID().toString().take(8)
        val generated = "alerts-$randomSuffix"
        prefs.topic = generated
    }

    fun saveAndConnect() {
        val currentTopic = prefs.topic.trim()
        if (currentTopic.isBlank()) {
            _testMessage.value = "Please enter a topic name before connecting."
            return
        }

        prefs.isServiceEnabled = true
        NotificationListenerService.start(getApplication())
    }

    fun disconnect() {
        prefs.isServiceEnabled = false
        NotificationListenerService.stop(getApplication())
    }

    fun addChannelApp(name: String, topic: String) {
        val trimmedTopic = topic.trim()
        if (trimmedTopic.isBlank()) {
            _testMessage.value = "Topic cannot be empty"
            return
        }
        val app = prefs.addChannelApp(name, trimmedTopic)
        _testMessage.value = "Added app '${app.name}' (#${app.topic})"
        if (prefs.isServiceEnabled) {
            NotificationListenerService.start(getApplication())
        }
    }

    fun deleteChannelApp(id: String) {
        prefs.deleteChannelApp(id)
        if (prefs.isServiceEnabled) {
            NotificationListenerService.start(getApplication())
        }
    }

    fun sendTestNotificationForApp(app: com.example.data.ChannelApp) {
        val currentServer = prefs.serverUrl.trim()
        val currentToken = prefs.token.trim()

        viewModelScope.launch {
            _isTesting.value = true
            _testMessage.value = null

            val result = NtfySender.sendTestNotification(
                serverUrl = currentServer,
                topic = app.topic,
                token = currentToken.ifBlank { null },
                title = "Test Alert: ${app.name}",
                message = "Test alert from web app '${app.name}' (#${app.topic}). Real-time stream active!",
                tags = "bell,rocket,white_check_mark"
            )

            _isTesting.value = false
            result.onSuccess { msg ->
                _testMessage.value = "Sent test alert for '${app.name}'! Check drawer."
            }.onFailure { err ->
                _testMessage.value = "Test Failed: ${err.message}"
            }
        }
    }

    fun sendTestNotification() {
        val currentTopic = prefs.topic.trim()
        val currentServer = prefs.serverUrl.trim()
        val currentToken = prefs.token.trim()

        if (currentTopic.isBlank()) {
            _testMessage.value = "Add an app or topic before sending test notification."
            return
        }

        viewModelScope.launch {
            _isTesting.value = true
            _testMessage.value = null

            val result = NtfySender.sendTestNotification(
                serverUrl = currentServer,
                topic = currentTopic.split(",").firstOrNull()?.trim() ?: currentTopic,
                token = currentToken.ifBlank { null }
            )

            _isTesting.value = false
            result.onSuccess { msg ->
                _testMessage.value = "Success! $msg Check your notification drawer."
            }.onFailure { err ->
                _testMessage.value = "Test Failed: ${err.message}"
            }
        }
    }

    fun clearTestMessage() {
        _testMessage.value = null
    }

    fun deleteNotification(id: Long) {
        viewModelScope.launch {
            repository.deleteById(id)
        }
    }

    fun clearAllNotifications() {
        viewModelScope.launch {
            repository.clearAll()
        }
    }
}
