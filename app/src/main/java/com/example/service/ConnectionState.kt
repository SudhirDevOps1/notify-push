package com.example.service

sealed class ConnectionState {
    object Disconnected : ConnectionState()
    object Connecting : ConnectionState()
    data class Connected(val topic: String, val connectedAt: Long = System.currentTimeMillis()) : ConnectionState()
    data class Reconnecting(val attempt: Int, val nextRetrySeconds: Long) : ConnectionState()
    data class Error(val message: String) : ConnectionState()
}
