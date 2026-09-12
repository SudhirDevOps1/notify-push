package com.example

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.MainViewModel
import com.example.ui.components.BatteryOptimizationCard
import com.example.ui.components.ConfigurationCard
import com.example.ui.components.ConnectionStatusBar
import com.example.ui.components.EmptyLogsView
import com.example.ui.components.IntegrationCodeDialog
import com.example.ui.components.NotificationFilterBar
import com.example.ui.components.NotificationLogCard
import com.example.ui.components.PermissionBanner
import com.example.ui.qr.QrCodeScannerDialog
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                NotifyPushApp(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotifyPushApp(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val serverUrl by viewModel.serverUrl.collectAsStateWithLifecycle()
    val topic by viewModel.topic.collectAsStateWithLifecycle()
    val token by viewModel.token.collectAsStateWithLifecycle()
    val isServiceEnabled by viewModel.isServiceEnabled.collectAsStateWithLifecycle()
    val connectionState by viewModel.connectionState.collectAsStateWithLifecycle()

    val rawNotifications by viewModel.rawNotifications.collectAsStateWithLifecycle()
    val notifications by viewModel.notifications.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val filterPriority by viewModel.filterPriority.collectAsStateWithLifecycle()
    val filterOnlyWithLinks by viewModel.filterOnlyWithLinks.collectAsStateWithLifecycle()

    val isTesting by viewModel.isTesting.collectAsStateWithLifecycle()
    val testMessage by viewModel.testMessage.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    var showClearConfirmDialog by remember { mutableStateOf(false) }
    var showQrScanner by remember { mutableStateOf(false) }
    var showIntegrationDialog by remember { mutableStateOf(false) }

    LaunchedEffect(testMessage) {
        testMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearTestMessage()
        }
    }

    Scaffold(
        contentWindowInsets = WindowInsets.safeDrawing,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.NotificationsActive,
                            contentDescription = "NotifyPush Logo",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "NotifyPush",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp
                            )
                        )
                    }
                },
                actions = {
                    // 1. Integration Code / Webhook Snippets
                    IconButton(
                        onClick = { showIntegrationDialog = true },
                        modifier = Modifier.testTag("open_code_snippets_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Code,
                            contentDescription = "Integration Code Snippets",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    // 2. Export History as JSON
                    if (rawNotifications.isNotEmpty()) {
                        IconButton(
                            onClick = {
                                val json = viewModel.exportNotificationsJson()
                                val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                                cm?.setPrimaryClip(ClipData.newPlainText("NotifyPush Logs JSON", json))
                                Toast.makeText(context, "Exported ${rawNotifications.size} logs to clipboard as JSON", Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.testTag("export_json_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.FileDownload,
                                contentDescription = "Export JSON",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        IconButton(
                            onClick = { showClearConfirmDialog = true },
                            modifier = Modifier.testTag("clear_all_logs_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.DeleteSweep,
                                contentDescription = "Clear All Logs",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        modifier = modifier.fillMaxSize()
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentAlignment = Alignment.TopCenter
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 680.dp), // Responsive centering for tablets / foldables
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Android 13+ Notification Permission Banner
                item(key = "permission_banner") {
                    PermissionBanner()
                }

                // 2. Battery Optimization Helper Card (Ensures 24/7 background delivery)
                item(key = "battery_card") {
                    BatteryOptimizationCard()
                }

                // 3. Active Connection Status Bar
                item(key = "status_bar") {
                    ConnectionStatusBar(
                        connectionState = connectionState,
                        isServiceEnabled = isServiceEnabled
                    )
                }

                // 4. Receiver Configuration Card
                item(key = "config_card") {
                    ConfigurationCard(
                        serverUrl = serverUrl,
                        topic = topic,
                        token = token,
                        isServiceEnabled = isServiceEnabled,
                        isTesting = isTesting,
                        onServerUrlChange = viewModel::updateServerUrl,
                        onTopicChange = viewModel::updateTopic,
                        onTokenChange = viewModel::updateToken,
                        onGenerateRandomTopic = viewModel::generateRandomTopic,
                        onScanQrClick = { showQrScanner = true },
                        onSaveAndConnect = viewModel::saveAndConnect,
                        onDisconnect = viewModel::disconnect,
                        onSendTest = viewModel::sendTestNotification
                    )
                }

                // 5. Search & Filter Bar (Shown when notifications exist)
                if (rawNotifications.isNotEmpty()) {
                    item(key = "filter_bar") {
                        NotificationFilterBar(
                            searchQuery = searchQuery,
                            onSearchQueryChange = viewModel::updateSearchQuery,
                            selectedPriority = filterPriority,
                            onSelectPriority = viewModel::setFilterPriority,
                            onlyWithLinks = filterOnlyWithLinks,
                            onToggleOnlyWithLinks = viewModel::toggleFilterOnlyWithLinks,
                            totalCount = rawNotifications.size,
                            filteredCount = notifications.size,
                            onClearFilters = viewModel::clearFilters
                        )
                    }
                }

                // 6. Section Header: Notification History
                item(key = "logs_header") {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp, bottom = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Received Notifications",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 17.sp
                                ),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                val countText = if (notifications.size != rawNotifications.size) {
                                    "${notifications.size} / ${rawNotifications.size}"
                                } else {
                                    "${notifications.size}"
                                }
                                Text(
                                    text = countText,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    ),
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }

                        if (rawNotifications.isNotEmpty()) {
                            TextButton(
                                onClick = { showClearConfirmDialog = true },
                                modifier = Modifier.testTag("clear_history_text_button")
                            ) {
                                Text("Clear History", fontSize = 13.sp)
                            }
                        }
                    }
                }

                // 7. Notification Log Items
                if (rawNotifications.isEmpty()) {
                    item(key = "empty_logs") {
                        EmptyLogsView()
                    }
                } else if (notifications.isEmpty()) {
                    item(key = "no_filtered_results") {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp)
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp)
                            ) {
                                Text(
                                    text = "No matching alerts found",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Try adjusting your search keyword or priority filters.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                TextButton(onClick = viewModel::clearFilters) {
                                    Text("Clear Filters")
                                }
                            }
                        }
                    }
                } else {
                    items(
                        items = notifications,
                        key = { it.id }
                    ) { item ->
                        NotificationLogCard(
                            item = item,
                            onDelete = viewModel::deleteNotification
                        )
                    }
                }

                item(key = "bottom_spacer") {
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }

        // Confirmation Dialog for Clearing Logs
        if (showClearConfirmDialog) {
            AlertDialog(
                onDismissRequest = { showClearConfirmDialog = false },
                title = { Text("Clear All History?") },
                text = { Text("This will permanently remove all received notification logs.") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            viewModel.clearAllNotifications()
                            showClearConfirmDialog = false
                        }
                    ) {
                        Text("Clear All", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearConfirmDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        // QR Code Scanner Dialog
        if (showQrScanner) {
            QrCodeScannerDialog(
                onDismissRequest = { showQrScanner = false },
                onScanned = { config ->
                    viewModel.applyScannedConfig(config)
                }
            )
        }

        // Universal Integration Code Generator Dialog
        if (showIntegrationDialog) {
            IntegrationCodeDialog(
                serverUrl = serverUrl,
                topic = topic,
                token = token,
                onDismissRequest = { showIntegrationDialog = false }
            )
        }
    }
}
