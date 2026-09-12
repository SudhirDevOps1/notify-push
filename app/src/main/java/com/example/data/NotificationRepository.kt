package com.example.data

import kotlinx.coroutines.flow.Flow

class NotificationRepository(private val dao: NotificationDao) {
    val allNotifications: Flow<List<NotificationItem>> = dao.getAllNotifications()

    suspend fun insert(item: NotificationItem): Long {
        return dao.insertNotification(item)
    }

    suspend fun deleteById(id: Long) {
        dao.deleteNotificationById(id)
    }

    suspend fun clearAll() {
        dao.clearAllNotifications()
    }
}
