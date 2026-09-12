package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface NotificationDao {
    @Query("SELECT * FROM notification_logs ORDER BY timestamp DESC")
    fun getAllNotifications(): Flow<List<NotificationItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(item: NotificationItem): Long

    @Query("DELETE FROM notification_logs WHERE id = :id")
    suspend fun deleteNotificationById(id: Long)

    @Query("DELETE FROM notification_logs")
    suspend fun clearAllNotifications()

    @Query("SELECT COUNT(*) FROM notification_logs")
    suspend fun getCount(): Int
}
