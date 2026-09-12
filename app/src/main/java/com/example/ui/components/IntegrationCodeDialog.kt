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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import com.example.storage.SecurityPreferences

@Composable
fun IntegrationCodeDialog(
    serverUrl: String,
    topic: String,
    token: String,
    onDismissRequest: () -> Unit
) {
    val context = LocalContext.current
    val effectiveServer = serverUrl.ifBlank { SecurityPreferences.DEFAULT_SERVER_URL }.removeSuffix("/")
    val effectiveTopic = topic.ifBlank { "your-topic-name" }
    val effectiveToken = token.trim()

    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("cURL / Bash", "Next.js / Node", "Python", "PHP", "Go")

    val codeSnippets = remember(effectiveServer, effectiveTopic, effectiveToken) {
        listOf(
            // 0: cURL
            buildString {
                append("curl -X POST \"$effectiveServer/$effectiveTopic\" \\\n")
                append("  -H \"Title: Payment Received\" \\\n")
                append("  -H \"Priority: high\" \\\n")
                append("  -H \"Tags: moneybag,white_check_mark\" \\\n")
                if (effectiveToken.isNotEmpty()) {
                    append("  -H \"Authorization: Bearer $effectiveToken\" \\\n")
                }
                append("  -d \"Order #1042 was placed for $49.00\"")
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
                append("      'Title': title || 'Alert from Next.js',\n")
                append("      'Priority': 'high',\n")
                append("      'Tags': 'rocket,bell',\n")
                if (effectiveToken.isNotEmpty()) {
                    append("      'Authorization': 'Bearer $effectiveToken',\n")
                }
                append("    },\n")
                append("    body: message || 'Event triggered successfully!'\n")
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
                append("    req.add_header('Title', title)\n")
                append("    req.add_header('Priority', 'high')\n")
                append("    req.add_header('Tags', 'snake,zap')\n")
                if (effectiveToken.isNotEmpty()) {
                    append("    req.add_header('Authorization', 'Bearer $effectiveToken')\n")
                }
                append("    with urllib.request.urlopen(req, timeout=4) as resp:\n")
                append("        return resp.status == 200\n\n")
                append("send_push('Python Alert', 'Backup job completed successfully!')")
            },

            // 3: PHP (Laravel / cURL)
            buildString {
                append("<?php\n")
                append("\$url = '$effectiveServer/$effectiveTopic';\n")
                append("\$headers = [\n")
                append("    'Title: PHP Order Alert',\n")
                append("    'Priority: high',\n")
                append("    'Tags: package,truck',\n")
                if (effectiveToken.isNotEmpty()) {
                    append("    'Authorization: Bearer $effectiveToken',\n")
                }
                append("];\n\n")
                append("\$ch = curl_init(\$url);\n")
                append("curl_setopt_array(\$ch, [\n")
                append("    CURLOPT_POST => true,\n")
                append("    CURLOPT_POSTFIELDS => 'Customer placed new subscription order',\n")
                append("    CURLOPT_HTTPHEADER => \$headers,\n")
                append("    CURLOPT_RETURNTRANSFER => true,\n")
                append("    CURLOPT_TIMEOUT => 4\n")
                append("]);\n")
                append("\$res = curl_exec(\$ch);\n")
                append("curl_close(\$ch);")
            },

            // 4: Go
            buildString {
                append("package main\n\n")
                append("import (\n")
                append("    \"bytes\"\n")
                append("    \"net/http\"\n")
                append(")\n\n")
                append("func sendAlert() error {\n")
                append("    url := \"$effectiveServer/$effectiveTopic\"\n")
                append("    body := bytes.NewBufferString(\"Service CPU Spike Alert: 92%\")\n")
                append("    req, _ := http.NewRequest(\"POST\", url, body)\n")
                append("    req.Header.Set(\"Title\", \"Go Microservice\")\n")
                append("    req.Header.Set(\"Priority\", \"urgent\")\n")
                append("    req.Header.Set(\"Tags\", \"fire,chart\")\n")
                if (effectiveToken.isNotEmpty()) {
                    append("    req.Header.Set(\"Authorization\", \"Bearer $effectiveToken\")\n")
                }
                append("    _, err := http.DefaultClient.Do(req)\n")
                append("    return err\n")
                append("}")
            }
        )
    }

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
                        text = "Integration Code Generator",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Ready-to-use snippets with your current topic",
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
                // Topic & Server indicator
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
                            text = "Target: ",
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

                // Code box with copy button
                val currentSnippet = codeSnippets[selectedTabIndex]
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF1E1E1E))
                        .padding(14.dp)
                ) {
                    Text(
                        text = currentSnippet,
                        color = Color(0xFFD4D4D4),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Quick copy button
                Button(
                    onClick = {
                        val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                        cm?.setPrimaryClip(ClipData.newPlainText("Code Snippet", currentSnippet))
                        Toast.makeText(context, "${tabs[selectedTabIndex]} code copied!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.ContentCopy,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Copy ${tabs[selectedTabIndex]} Code")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Done")
            }
        }
    )
}
