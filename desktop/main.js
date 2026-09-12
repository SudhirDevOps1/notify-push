const { app, BrowserWindow, Tray, Menu, Notification, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let streamProcess = null;
let sseRequest = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let connectionStatus = 'Disconnected';

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// Storage paths
const configPath = path.join(app.getPath('userData'), 'config.json');
const historyPath = path.join(app.getPath('userData'), 'history.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return {
    serverUrl: 'https://ntfy.sh',
    topic: 'desktop-alerts-' + Math.floor(1000 + Math.random() * 9000),
    token: '',
    sound: true
  };
}

function saveConfigData(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

function loadHistory() {
  try {
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading history:', err);
  }
  return [];
}

function saveHistory(history) {
  try {
    fs.writeFileSync(historyPath, JSON.stringify(history.slice(0, 200), null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving history:', err);
  }
}

let appConfig = loadConfig();
let notificationHistory = loadHistory();

function updateStatus(status) {
  connectionStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('connection-status', status);
  }
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open NotifyPush',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: `Topic: ${appConfig.topic || '(None)'}`,
      enabled: false
    },
    {
      label: `Status: ${connectionStatus}`,
      enabled: false
    },
    {
      label: 'Send Test Notification',
      click: sendTestAlert
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

function stopActiveStream() {
  if (streamProcess) {
    try {
      streamProcess.kill();
    } catch (e) {}
    streamProcess = null;
  }
  if (sseRequest) {
    try {
      sseRequest.destroy();
    } catch (e) {}
    sseRequest = null;
  }
}

function startSseConnection() {
  stopActiveStream();

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const topic = appConfig.topic?.trim();
  if (!topic) {
    updateStatus('No Topic Configured');
    return;
  }

  let server = (appConfig.serverUrl || 'https://ntfy.sh').trim().replace(/\/+$/, '');
  const urlStr = `${server}/${encodeURIComponent(topic)}/json`;

  updateStatus('Connecting...');

  // Use Windows built-in curl.exe first (native, signed by Microsoft, immune to Defender socket blocks)
  const curlStarted = startCurlStream(urlStr);
  if (!curlStarted) {
    startNodeHttpsStream(urlStr);
  }
}

function startCurlStream(urlStr) {
  const args = ['-s', '-N'];
  if (appConfig.token?.trim()) {
    args.push('-H', `Authorization: Bearer ${appConfig.token.trim()}`);
  }
  args.push(urlStr);

  try {
    const proc = spawn('curl.exe', args, {
      windowsHide: true
    });
    streamProcess = proc;

    let buffer = '';
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line.trim());
          if (data.event === 'open') {
            updateStatus('Connected & Listening');
            reconnectDelay = 1000;
          } else if (data.event === 'keepalive') {
            // Keepalive pulse: connection is healthy
          } else {
            handleIncomingNotification(data);
          }
        } catch (e) {
          // ignore malformed lines
        }
      }
    });

    proc.on('error', (err) => {
      console.warn('curl.exe unavailable, falling back to node https:', err.message);
      streamProcess = null;
      startNodeHttpsStream(urlStr);
    });

    proc.on('exit', (code) => {
      if (streamProcess === proc) {
        streamProcess = null;
        updateStatus('Disconnected (Reconnecting...)');
        scheduleReconnect();
      }
    });

    return true;
  } catch (err) {
    console.warn('Could not spawn curl.exe:', err.message);
    streamProcess = null;
    return false;
  }
}

function startNodeHttpsStream(urlStr) {
  try {
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const headers = {
      'User-Agent': 'NotifyPush-Desktop/1.0.1'
    };
    if (appConfig.token?.trim()) {
      headers['Authorization'] = `Bearer ${appConfig.token.trim()}`;
    }

    sseRequest = client.get(parsedUrl, { headers }, (res) => {
      if (res.statusCode !== 200) {
        updateStatus(`HTTP Error ${res.statusCode}`);
        scheduleReconnect();
        return;
      }

      updateStatus('Connected & Listening');
      reconnectDelay = 1000;

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line.trim());
            handleIncomingNotification(data);
          } catch (e) {
            // Ignore malformed lines or keepalives
          }
        }
      });

      res.on('end', () => {
        updateStatus('Disconnected (Stream Ended)');
        scheduleReconnect();
      });

      res.on('error', (err) => {
        console.error('SSE response error:', err.message);
        updateStatus('Connection Error');
        scheduleReconnect();
      });
    });

    sseRequest.on('error', (err) => {
      console.error('SSE request error:', err.message);
      updateStatus('Network Error');
      scheduleReconnect();
    });
  } catch (err) {
    console.error('SSE init error:', err);
    updateStatus('Invalid URL');
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startSseConnection();
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  }, reconnectDelay);
}

function handleIncomingNotification(data) {
  if (data.event !== 'message') return;

  const item = {
    id: data.id || ('id_' + Date.now()),
    time: data.time ? data.time * 1000 : Date.now(),
    title: data.title || 'Notification',
    message: data.message || '',
    priority: data.priority || 3,
    tags: data.tags || [],
    clickUrl: data.click || null,
    actions: data.actions || []
  };

  notificationHistory.unshift(item);
  if (notificationHistory.length > 200) {
    notificationHistory = notificationHistory.slice(0, 200);
  }
  saveHistory(notificationHistory);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('new-notification', item);
  }

  // Windows Native Toast Notification
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: item.title,
      body: item.message,
      icon: path.join(__dirname, 'assets', 'icon.png'),
      silent: !appConfig.sound
    });

    notif.on('click', () => {
      if (item.clickUrl) {
        shell.openExternal(item.clickUrl);
      } else if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notif.show();
  }
}

function sendTestAlert() {
  const topic = appConfig.topic;
  if (!topic) return;

  let server = (appConfig.serverUrl || 'https://ntfy.sh').replace(/\/+$/, '');
  const url = `${server}/${encodeURIComponent(topic)}`;

  const body = JSON.stringify({
    topic,
    title: 'Desktop Test Alert 🔔',
    message: 'NotifyPush Windows Desktop Client is working flawlessly!',
    priority: 4,
    tags: ['tada', 'white_check_mark']
  });

  const curlArgs = [
    '-s',
    '-X', 'POST',
    url,
    '-H', 'Content-Type: application/json',
    '-d', body
  ];
  if (appConfig.token?.trim()) {
    curlArgs.push('-H', `Authorization: Bearer ${appConfig.token.trim()}`);
  }

  try {
    const p = spawn('curl.exe', curlArgs, { windowsHide: true });
    p.on('error', () => {
      sendTestAlertFallback(url, body);
    });
  } catch (err) {
    sendTestAlertFallback(url, body);
  }
}

function sendTestAlertFallback(url, body) {
  try {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    };
    if (appConfig.token?.trim()) {
      headers['Authorization'] = `Bearer ${appConfig.token.trim()}`;
    }
    const req = client.request(parsedUrl, {
      method: 'POST',
      headers
    });
    req.on('error', (err) => {
      console.error('Test alert fallback error:', err.message);
    });
    req.write(body);
    req.end();
  } catch (e) {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 740,
    minWidth: 420,
    minHeight: 580,
    title: 'NotifyPush Desktop',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Create System Tray
  const trayIconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(trayIconPath);
  tray.setToolTip('NotifyPush - Real-Time Push Receiver');
  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Start real-time connection
  startSseConnection();

  // IPC Handlers
  ipcMain.handle('get-config', () => appConfig);
  ipcMain.handle('save-config', (event, newConfig) => {
    const topicChanged = newConfig.topic !== appConfig.topic || newConfig.serverUrl !== appConfig.serverUrl || newConfig.token !== appConfig.token;
    appConfig = { ...appConfig, ...newConfig };
    saveConfigData(appConfig);
    updateTrayMenu();
    if (topicChanged) {
      startSseConnection();
    }
    return { success: true };
  });

  ipcMain.handle('get-history', () => notificationHistory);
  ipcMain.handle('clear-history', () => {
    notificationHistory = [];
    saveHistory(notificationHistory);
    return { success: true };
  });
  ipcMain.handle('send-test-alert', () => {
    sendTestAlert();
    return { success: true };
  });
  ipcMain.handle('open-external', (event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  });
});

app.on('before-quit', () => {
  stopActiveStream();
});

app.on('window-all-closed', () => {
  // Do not quit on Windows: keep running in System Tray
});