package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notification_logs")
data class NotificationItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val ntfyId: String = "",
    val title: String = "",
    val message: String = "",
    val topic: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val clickUrl: String? = null,
    val priority: Int = 3,
    val tags: String = "" // comma-separated e.g. "warning,bell"
)
