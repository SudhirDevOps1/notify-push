package com.example.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.service.NotificationListenerService
import com.example.storage.SecurityPreferences

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "BootReceiver received action: $action")

        val validActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON",
            Intent.ACTION_MY_PACKAGE_REPLACED
        )

        if (action in validActions) {
            val prefs = SecurityPreferences.getInstance(context)
            if (prefs.isServiceEnabled && prefs.topic.isNotBlank()) {
                Log.i(TAG, "Auto-starting NotificationListenerService after boot for topic: ${prefs.topic}")
                NotificationListenerService.start(context)
            } else {
                Log.d(TAG, "Service was not enabled or topic was empty; skipping boot restart.")
            }
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
