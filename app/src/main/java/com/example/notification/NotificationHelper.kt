package com.example.notification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.MainActivity
import com.example.R
import java.util.concurrent.atomic.AtomicInteger

object NotificationHelper {

    const val CHANNEL_WEBSITE_ALERTS = "website_alerts_channel"
    const val CHANNEL_FOREGROUND_SERVICE = "foreground_service_channel"

    const val FOREGROUND_NOTIFICATION_ID = 1001
    private val notificationIdCounter = AtomicInteger(2000)

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // 1. High Importance Alerts Channel (Heads-up banner, vibration, sound)
            val alertsChannel = NotificationChannel(
                CHANNEL_WEBSITE_ALERTS,
                "Website Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming real-time push notifications from websites and webhooks"
                enableLights(true)
                lightColor = Color.parseColor("#6366F1")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 200, 250)
                setShowBadge(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC

                val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build()
                setSound(soundUri, audioAttributes)
            }

            // 2. Foreground Service Persistent Channel (Low importance, discreet)
            val serviceChannel = NotificationChannel(
                CHANNEL_FOREGROUND_SERVICE,
                "Push Listener Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Status of persistent ntfy background connection"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }

            notificationManager.createNotificationChannel(alertsChannel)
            notificationManager.createNotificationChannel(serviceChannel)
        }
    }

    /**
     * Builds the persistent notification for the Foreground Service.
     */
    fun buildServiceNotification(
        context: Context,
        topic: String,
        statusText: String
    ): Notification {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_FOREGROUND_SERVICE)
            .setSmallIcon(R.drawable.ic_stat_notification)
            .setContentTitle("NotifyPush Active")
            .setContentText("Topic: $topic • $statusText")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setContentIntent(pendingIntent)
            .build()
    }

    /**
     * Shows a heads-up high-priority notification for incoming push message.
     */
    fun showNotification(
        context: Context,
        title: String?,
        message: String,
        clickUrl: String?,
        priority: Int,
        tags: List<String>,
        topic: String? = null
    ): Int {
        val notificationId = notificationIdCounter.incrementAndGet()

        // Content intent: open clickUrl in browser if available, else open MainActivity
        val contentIntent = if (!clickUrl.isNullOrBlank() && (clickUrl.startsWith("http://") || clickUrl.startsWith("https://"))) {
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(clickUrl)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            PendingIntent.getActivity(
                context,
                notificationId,
                browserIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else {
            val appIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            PendingIntent.getActivity(
                context,
                notificationId,
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        val displayTitle = when {
            !title.isNullOrBlank() -> title
            tags.isNotEmpty() -> "[${tags.joinToString(" ")}] New Alert"
            else -> "New Alert"
        }

        // Map ntfy priority (1-5) to Android priority
        val androidPriority = when (priority) {
            1 -> NotificationCompat.PRIORITY_MIN
            2 -> NotificationCompat.PRIORITY_LOW
            3 -> NotificationCompat.PRIORITY_DEFAULT
            4 -> NotificationCompat.PRIORITY_HIGH
            5 -> NotificationCompat.PRIORITY_MAX
            else -> NotificationCompat.PRIORITY_HIGH
        }

        val builder = NotificationCompat.Builder(context, CHANNEL_WEBSITE_ALERTS)
            .setSmallIcon(R.drawable.ic_stat_notification)
            .setContentTitle(displayTitle)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(androidPriority)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)

        if (!topic.isNullOrBlank()) {
            builder.setSubText(topic)
        }

        // For high priority (4 or 5), make sure it pops up as heads-up banner
        if (priority >= 4) {
            builder.setVibrate(longArrayOf(0, 300, 200, 300))
            builder.setDefaults(NotificationCompat.DEFAULT_SOUND or NotificationCompat.DEFAULT_LIGHTS)
        }

        // Add action button if clickUrl exists
        if (!clickUrl.isNullOrBlank() && (clickUrl.startsWith("http://") || clickUrl.startsWith("https://"))) {
            val viewIntent = Intent(Intent.ACTION_VIEW, Uri.parse(clickUrl)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val viewPendingIntent = PendingIntent.getActivity(
                context,
                notificationId + 100000,
                viewIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(
                android.R.drawable.ic_menu_view,
                "Open Link",
                viewPendingIntent
            )
        }

        try {
            val manager = NotificationManagerCompat.from(context)
            manager.notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            // Handled when POST_NOTIFICATIONS permission not granted yet
        }

        return notificationId
    }
}
