package com.example.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties
import com.example.data.ChannelApp
import com.example.storage.SecurityPreferences

@Composable
fun IntegrationCodeDialog(
    serverUrl: String,
    topic: String,
    token: String,
    channelApps: List<ChannelApp> = emptyList(),
    initialSelectedAppId: String? = null,
    onDismissRequest: () -> Unit
) {
    val context = LocalContext.current
    val effectiveServer = serverUrl.ifBlank { SecurityPreferences.DEFAULT_SERVER_URL }.removeSuffix("/")
    val effectiveToken = token.trim()

    var activeAppId by remember(initialSelectedAppId, channelApps) {
        mutableStateOf(initialSelectedAppId ?: channelApps.firstOrNull()?.id)
    }

    val selectedApp = channelApps.find { it.id == activeAppId }
    val effectiveTopic = selectedApp?.topic ?: topic.ifBlank { "your-topic-name" }
    val effectiveAppName = selectedApp?.name ?: "NotifyPush Alert"

    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("cURL / Bash", "Next.js / Node", "Python", "PHP", "Go")

    val codeSnippets = remember(effectiveServer, effectiveTopic, effectiveToken, effectiveAppName) {
        listOf(
            // 0: cURL
            buildString {
                append("curl -X POST \"")
                append(effectiveServer)
                append("/")
                append(effectiveTopic)
                append("\" \\\n")
                append("  -H \"Title: [")
                append(effectiveAppName)
                append("] New Alert\" \\\n")
                append("  -H \"Priority: high\" \\\n")
                append("  -H \"Tags: bell,rocket,white_check_mark\" \\\n")
                if (effectiveToken.isNotEmpty()) {
                    append("  -H \"Authorization: Bearer ")
                    append(effectiveToken)
                    append("\" \\\n")
                }
                append("  -d \"Alert received from ")
                append(effectiveAppName)
                append(" successfully!\"")
            },

            // 1: Next.js (App Router API route)
            buildString {
                append("// app/api/notify/route.ts\n")
                append("import { NextResponse } from 'next/server';\n\n")
                append("export async function POST(req: Request) {\n")
                append("  const { title, message } = await req.json();\n")
                append("  const res = await fetch('$effectiveServer/$effectiveTopic', {\n")
                append("    method: 'POST',\n")
                append("    headers: {\n")
                append("      'Title': title || '[$effectiveAppName] Notification',\n")
                append("      'Priority': 'high',\n")
                append("      'Tags': 'rocket,bell',\n")
                if (effectiveToken.isNotEmpty()) {
                    append("      'Authorization': 'Bearer $effectiveToken',\n")
                }
                append("    },\n")
                append("    body: message || 'Event triggered from $effectiveAppName'\n")
                append("  });\n")
                append("  return NextResponse.json({ success: res.ok });\n")
                append("}")
            },

            // 2: Python (FastAPI / Requests)
            buildString {
                append("import urllib.request\n\n")
                append("def send_push(title: str, message: str):\n")
                append("    url = '$effectiveServer/$effectiveTopic'\n")
                append("    req = urllib.request.Request(url, data=message.encode('utf-8'), method='POST')\n")
                append("    req.add_header('Title', f'[$effectiveAppName] {title}')\n")
                append("    req.add_header('Priority', '4')\n")
                append("    req.add_header('Tags', 'bell,snake')\n")
                if (effectiveToken.isNotEmpty()) {
                    append("    req.add_header('Authorization', 'Bearer $effectiveToken')\n")
                }
                append("    with urllib.request.urlopen(req) as resp:\n")
                append("        return resp.status == 200\n")
            },

            // 3: PHP
            buildString {
                append("<?php\n")
                append("\$url = '$effectiveServer/$effectiveTopic';\n")
                append("\$headers = [\n")
                append("    'Title: [$effectiveAppName] Server Notice',\n")
                append("    'Priority: high',\n")
                append("    'Tags: bell,elephant'\n")
                if (effectiveToken.isNotEmpty()) {
                    append("    ,'Authorization: Bearer $effectiveToken'\n")
                }
                append("];\n")
                append("\$options = [\n")
                append("    'http' => [\n")
                append("        'method' => 'POST',\n")
                append("        'header' => implode(\"\\r\\n\", \$headers),\n")
                append("        'content' => 'Notification triggered from PHP script.'\n")
                append("    ]\n")
                append("];\n")
                append("\$context = stream_context_create(\$options);\n")
                append("\$result = file_get_contents(\$url, false, \$context);\n")
            },

            // 4: Go
            buildString {
                append("package main\n\n")
                append("import (\n")
                append("    \"net/http\"\n")
                append("    \"strings\"\n")
                append(")\n\n")
                append("func sendPush(title, msg string) error {\n")
                append("    req, err := http.NewRequest(\"POST\", \"$effectiveServer/$effectiveTopic\", strings.NewReader(msg))\n")
                append("    if err != nil { return err }\n")
                append("    req.Header.Set(\"Title\", \"[$effectiveAppName] \" + title)\n")
                append("    req.Header.Set(\"Priority\", \"high\")\n")
                if (effectiveToken.isNotEmpty()) {
                    append("    req.Header.Set(\"Authorization\", \"Bearer $effectiveToken\")\n")
                }
                append("    _, err = http.DefaultClient.Do(req)\n")
                append("    return err\n")
                append("}\n")
            }
        )
    }

    val currentSnippet = codeSnippets.getOrElse(selectedTabIndex) { codeSnippets[0] }

    AlertDialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false),
        modifier = Modifier
            .fillMaxWidth(0.95f)
            .testTag("integration_code_dialog"),
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        text = "Website Code Snippets",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Tailored code snippets for your active web apps",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onDismissRequest) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close dialog")
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
            ) {
                // App Selector Chips if multiple apps exist
                if (channelApps.isNotEmpty()) {
                    Text(
                        text = "Select Web App:",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        channelApps.forEach { app ->
                            val isSelected = app.id == activeAppId
                            FilterChip(
                                selected = isSelected,
                                onClick = { activeAppId = app.id },
                                label = { Text(app.name, fontSize = 12.sp) },
                                leadingIcon = if (isSelected) {
                                    {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = null,
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                } else null,
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                // Target Endpoint indicator
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Target Endpoint: ",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "$effectiveServer/$effectiveTopic",
                            style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                            maxLines = 1
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Language Tabs
                ScrollableTabRow(
                    selectedTabIndex = selectedTabIndex,
                    edgePadding = 0.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = { Text(title, fontSize = 13.sp) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Code Box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF0F172A))
                        .padding(14.dp)
                ) {
                    Text(
                        text = currentSnippet,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.5.sp,
                        color = Color(0xFFE2E8F0),
                        lineHeight = 16.sp,
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                    clipboard?.setPrimaryClip(ClipData.newPlainText("NotifyPush Snippet", currentSnippet))
                    Toast.makeText(context, "Snippet copied to clipboard!", Toast.LENGTH_SHORT).show()
                },
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(
                    imageVector = Icons.Default.ContentCopy,
                    contentDescription = "Copy code",
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Copy Snippet")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Close")
            }
        }
    )
}
