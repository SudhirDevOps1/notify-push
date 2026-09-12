package com.example

import android.app.Application
import android.util.Log
import com.example.notification.NotificationHelper
import com.example.service.NotificationListenerService
import com.example.storage.SecurityPreferences

class NotifyPushApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.d("NotifyPushApplication", "Application onCreate")

        // 1. Ensure notification channels are registered immediately
        NotificationHelper.createNotificationChannels(this)

        // 2. If the user previously left the service active, restart it seamlessly
        val prefs = SecurityPreferences.getInstance(this)
        if (prefs.isServiceEnabled && prefs.topic.isNotBlank()) {
            Log.i("NotifyPushApplication", "Restarting background notification listener for: ${prefs.topic}")
            try {
                NotificationListenerService.start(this)
            } catch (e: Exception) {
                Log.e("NotifyPushApplication", "Failed to start service on app launch: ${e.message}")
            }
        }
    }
}
