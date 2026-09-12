package com.example.service

import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.content.ContextCompat
import com.example.data.AppDatabase
import com.example.data.NotificationItem
import com.example.notification.NotificationHelper
import com.example.storage.SecurityPreferences
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class NotificationListenerService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var connectionJob: Job? = null
    private var eventSource: EventSource? = null

    private lateinit var prefs: SecurityPreferences
    private lateinit var database: AppDatabase
    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    private var retryAttempt = 0
    private var isManuallyStopped = false

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .readTimeout(0, TimeUnit.MILLISECONDS) // Indefinite read for SSE streaming
            .connectTimeout(15, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "NotificationListenerService onCreate")
        prefs = SecurityPreferences.getInstance(this)
        database = AppDatabase.getDatabase(this)
        NotificationHelper.createNotificationChannels(this)
        registerNetworkCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        Log.d(TAG, "onStartCommand action: $action")

        when (action) {
            ACTION_STOP -> {
                isManuallyStopped = true
                stopListening()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                _connectionState.value = ConnectionState.Disconnected
                return START_NOT_STICKY
            }
            ACTION_RESTART, ACTION_START -> {
                isManuallyStopped = false
                val topic = prefs.topic
                startForegroundServiceNotification(topic)
                if (topic.isBlank()) {
                    _connectionState.value = ConnectionState.Error("Topic is not configured")
                    updateForegroundNotification(topic, "Topic not configured")
                } else {
                    connectSse(resetBackoff = true)
                }
            }
        }

        return START_STICKY
    }

    private fun startForegroundServiceNotification(topic: String) {
        val notification = NotificationHelper.buildServiceNotification(
            this,
            topic.ifBlank { "Unset" },
            "Connecting..."
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NotificationHelper.FOREGROUND_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING
            )
        } else {
            startForeground(
                NotificationHelper.FOREGROUND_NOTIFICATION_ID,
                notification
            )
        }
    }

    private fun updateForegroundNotification(topic: String, status: String) {
        try {
            val notification = NotificationHelper.buildServiceNotification(this, topic, status)
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(NotificationHelper.FOREGROUND_NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to update foreground notification: ${e.message}")
        }
    }

    @Synchronized
    private fun connectSse(resetBackoff: Boolean = false) {
        if (isManuallyStopped) return

        if (resetBackoff) {
            retryAttempt = 0
        }

        connectionJob?.cancel()
        connectionJob = serviceScope.launch {
            val serverUrl = prefs.serverUrl
            val rawTopic = prefs.topic
            val token = prefs.token

            val topics = rawTopic.split(",")
                .map { it.trim() }
                .filter { it.isNotBlank() }

            if (topics.isEmpty()) {
                _connectionState.value = ConnectionState.Error("No topic configured")
                updateForegroundNotification("Unset", "Topic not set")
                return@launch
            }

            _connectionState.value = ConnectionState.Connecting
            updateForegroundNotification(rawTopic, "Connecting to $serverUrl...")

            val multiTopicPath = topics.joinToString(",") { it }
            val sseUrl = "$serverUrl/$multiTopicPath/sse"
            Log.d(TAG, "Initiating SSE connection to: $sseUrl")

            val requestBuilder = Request.Builder()
                .url(sseUrl)
                .header("Accept", "text/event-stream")
                .header("Cache-Control", "no-cache")

            if (token.isNotBlank()) {
                requestBuilder.header("Authorization", "Bearer $token")
            }

            val request = requestBuilder.build()

            // Close existing event source if any
            eventSource?.cancel()

            val factory = EventSources.createFactory(okHttpClient)
            eventSource = factory.newEventSource(request, object : EventSourceListener() {
                override fun onOpen(eventSource: EventSource, response: Response) {
                    Log.i(TAG, "SSE Connected to topics: $multiTopicPath (HTTP ${response.code})")
                    retryAttempt = 0
                    _connectionState.value = ConnectionState.Connected(rawTopic)
                    updateForegroundNotification(rawTopic, "Connected • Listening for alerts")
                }

                override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                    Log.d(TAG, "SSE Event received [type=$type, id=$id]: $data")
                    handleSseData(data, type)
                }

                override fun onClosed(eventSource: EventSource) {
                    Log.w(TAG, "SSE Closed cleanly by server")
                    if (!isManuallyStopped) {
                        scheduleReconnect()
                    }
                }

                override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                    val code = response?.code
                    val errorMsg = t?.message ?: "HTTP $code"
                    Log.e(TAG, "SSE Failure: $errorMsg", t)

                    if (code == 401 || code == 403) {
                        _connectionState.value = ConnectionState.Error("Auth failed (HTTP $code). Check API key / Access Token.")
                        updateForegroundNotification(rawTopic, "Auth failed (HTTP $code)")
                    } else if (code == 404) {
                        _connectionState.value = ConnectionState.Error("Topic or server not found (HTTP 404)")
                        updateForegroundNotification(rawTopic, "Error: 404 Not Found")
                    } else {
                        if (!isManuallyStopped) {
                            scheduleReconnect()
                        }
                    }
                }
            })
        }
    }

    private fun handleSseData(data: String, type: String?) {
        serviceScope.launch {
            try {
                val json = JSONObject(data)
                val event = json.optString("event", type ?: "message")

                // We only process 'message' events as notifications
                if (event == "message") {
                    val ntfyId = json.optString("id", "")
                    val title = if (json.has("title") && !json.isNull("title")) json.getString("title") else ""
                    val message = json.optString("message", "")
                    val topic = json.optString("topic", prefs.topic)
                    val timestampSeconds = json.optLong("time", System.currentTimeMillis() / 1000)
                    val timestamp = timestampSeconds * 1000
                    val clickUrl = if (json.has("click") && !json.isNull("click")) json.getString("click") else null
                    val priority = json.optInt("priority", 3)

                    val tagsList = mutableListOf<String>()
                    val tagsArray = json.optJSONArray("tags")
                    if (tagsArray != null) {
                        for (i in 0 until tagsArray.length()) {
                            tagsList.add(tagsArray.getString(i))
                        }
                    }
                    val tagsString = tagsList.joinToString(",")

                    // 1. Save to Room database for persistent history
                    val item = NotificationItem(
                        ntfyId = ntfyId,
                        title = title,
                        message = message,
                        topic = topic,
                        timestamp = timestamp,
                        clickUrl = clickUrl,
                        priority = priority,
                        tags = tagsString
                    )
                    database.notificationDao().insertNotification(item)

                    // 2. Dispatch High-Priority Android Notification
                    NotificationHelper.showNotification(
                        context = this@NotificationListenerService,
                        title = title.ifBlank { null },
                        message = message,
                        clickUrl = clickUrl,
                        priority = priority,
                        tags = tagsList,
                        topic = topic
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing incoming SSE JSON payload: ${e.message}", e)
            }
        }
    }

    private fun scheduleReconnect() {
        if (isManuallyStopped || !prefs.isServiceEnabled) return

        connectionJob?.cancel()
        connectionJob = serviceScope.launch {
            retryAttempt++
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s, up to 30s
            val delaySeconds = (1L shl (retryAttempt - 1).coerceAtMost(5)).coerceAtMost(30L)
            Log.d(TAG, "Scheduling reconnect attempt $retryAttempt in ${delaySeconds}s")

            _connectionState.value = ConnectionState.Reconnecting(retryAttempt, delaySeconds)
            updateForegroundNotification(prefs.topic, "Reconnecting in ${delaySeconds}s (attempt $retryAttempt)...")

            delay(delaySeconds * 1000)

            if (isActive && !isManuallyStopped) {
                connectSse(resetBackoff = false)
            }
        }
    }

    private fun registerNetworkCallback() {
        try {
            connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            networkCallback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    Log.d(TAG, "Network became available")
                    if (!isManuallyStopped && prefs.isServiceEnabled && _connectionState.value !is ConnectionState.Connected) {
                        serviceScope.launch {
                            delay(500) // Brief delay for socket stability
                            connectSse(resetBackoff = true)
                        }
                    }
                }

                override fun onLost(network: Network) {
                    Log.d(TAG, "Network connection lost")
                    if (!isManuallyStopped && prefs.isServiceEnabled) {
                        scheduleReconnect()
                    }
                }
            }
            connectivityManager?.registerNetworkCallback(request, networkCallback!!)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to register network callback: ${e.message}")
        }
    }

    private fun stopListening() {
        eventSource?.cancel()
        eventSource = null
        connectionJob?.cancel()
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "NotificationListenerService onDestroy")
        stopListening()
        networkCallback?.let {
            try {
                connectivityManager?.unregisterNetworkCallback(it)
            } catch (e: Exception) {
                // Ignore
            }
        }
        serviceScope.cancel()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.d(TAG, "App cleared from recent tasks")
        // If service is enabled by user, ensure it continues or restarts automatically
        if (prefs.isServiceEnabled && prefs.topic.isNotBlank()) {
            val restartIntent = Intent(applicationContext, NotificationListenerService::class.java).apply {
                action = ACTION_RESTART
            }
            ContextCompat.startForegroundService(applicationContext, restartIntent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "NotifyListenerService"

        const val ACTION_START = "com.example.notifypush.ACTION_START"
        const val ACTION_STOP = "com.example.notifypush.ACTION_STOP"
        const val ACTION_RESTART = "com.example.notifypush.ACTION_RESTART"

        private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
        val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

        fun start(context: Context) {
            val intent = Intent(context, NotificationListenerService::class.java).apply {
                action = ACTION_START
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, NotificationListenerService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun restart(context: Context) {
            val intent = Intent(context, NotificationListenerService::class.java).apply {
                action = ACTION_RESTART
            }
            ContextCompat.startForegroundService(context, intent)
        }
    }
}
