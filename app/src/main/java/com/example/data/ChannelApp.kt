package com.example.data

import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

data class ChannelApp(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val topic: String,
    val password: String? = null,
    val createdAt: Long = System.currentTimeMillis()
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("name", name)
            put("topic", topic)
            if (!password.isNullOrBlank()) {
                put("password", password)
            }
            put("createdAt", createdAt)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): ChannelApp {
            return ChannelApp(
                id = json.optString("id", UUID.randomUUID().toString()),
                name = json.optString("name", "Untitled App"),
                topic = json.optString("topic", ""),
                password = if (json.has("password") && !json.isNull("password")) {
                    json.getString("password").trim().takeIf { it.isNotBlank() }
                } else null,
                createdAt = json.optLong("createdAt", System.currentTimeMillis())
            )
        }

        fun listToJson(list: List<ChannelApp>): String {
            val array = JSONArray()
            list.forEach { array.put(it.toJson()) }
            return array.toString()
        }

        fun listFromJson(jsonStr: String): List<ChannelApp> {
            if (jsonStr.isBlank()) return emptyList()
            return try {
                val array = JSONArray(jsonStr)
                val result = mutableListOf<ChannelApp>()
                for (i in 0 until array.length()) {
                    val obj = array.optJSONObject(i)
                    if (obj != null) {
                        result.add(fromJson(obj))
                    }
                }
                result
            } catch (e: Exception) {
                emptyList()
            }
        }
    }
}
