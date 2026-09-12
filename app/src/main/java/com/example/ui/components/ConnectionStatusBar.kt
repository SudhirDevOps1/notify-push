package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.service.ConnectionState
import com.example.ui.theme.AmberWarning
import com.example.ui.theme.EmeraldSuccess
import com.example.ui.theme.RoseError

@Composable
fun ConnectionStatusBar(
    connectionState: ConnectionState,
    isServiceEnabled: Boolean,
    modifier: Modifier = Modifier
) {
    val (statusText, subText, indicatorColor, icon) = when {
        !isServiceEnabled -> Quadruple(
            "Disconnected",
            "Listener service is stopped",
            Color.Gray,
            Icons.Default.CloudOff
        )
        connectionState is ConnectionState.Connected -> Quadruple(
            "Connected & Listening",
            "Real-time SSE active on topic: ${connectionState.topic}",
            EmeraldSuccess,
            Icons.Default.CheckCircle
        )
        connectionState is ConnectionState.Connecting -> Quadruple(
            "Connecting...",
            "Establishing live stream with server",
            MaterialTheme.colorScheme.primary,
            Icons.Default.Sync
        )
        connectionState is ConnectionState.Reconnecting -> Quadruple(
            "Reconnecting",
            "Retrying in ${connectionState.nextRetrySeconds}s (attempt ${connectionState.attempt})",
            AmberWarning,
            Icons.Default.Sync
        )
        connectionState is ConnectionState.Error -> Quadruple(
            "Connection Error",
            connectionState.message,
            RoseError,
            Icons.Default.Warning
        )
        else -> Quadruple(
            "Disconnected",
            "Tap 'Save & Connect' to start",
            Color.Gray,
            Icons.Default.CloudOff
        )
    }

    val animatedColor by animateColorAsState(targetValue = indicatorColor, label = "statusColor")

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(animatedColor.copy(alpha = 0.10f))
            .border(1.dp, animatedColor.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .testTag("connection_status_bar")
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            // Pulse circle / indicator
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(animatedColor.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = statusText,
                    tint = animatedColor,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
