package com.example.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object NtfySender {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    suspend fun sendTestNotification(
        serverUrl: String,
        topic: String,
        token: String? = null,
        title: String = "Test Alert: NotifyPush Client",
        message: String = "Live push notification received! Webhook receiver is active and running.",
        priority: Int = 4,
        tags: String = "bell,rocket,tada",
        clickUrl: String = "https://ntfy.sh"
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val endpoint = "$serverUrl/$topic"
            val requestBody = message.toRequestBody("text/plain; charset=utf-8".toMediaType())

            val requestBuilder = Request.Builder()
                .url(endpoint)
                .post(requestBody)
                .header("Title", title)
                .header("Priority", priority.toString())
                .header("Tags", tags)
                .header("Click", clickUrl)

            if (!token.isNullOrBlank()) {
                requestBuilder.header("Authorization", "Bearer ${token.trim()}")
            }

            val response = client.newCall(requestBuilder.build()).execute()
            if (response.isSuccessful) {
                Result.success("Test notification published successfully! (HTTP ${response.code})")
            } else {
                Result.failure(Exception("Server returned HTTP ${response.code}: ${response.message}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
