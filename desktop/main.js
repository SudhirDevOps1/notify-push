const { app, BrowserWindow, Tray, Menu, Notification, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const QRCode = require('qrcode');
const { decryptE2ee, encryptE2ee } = require('./crypto');

let mainWindow = null;
let tray = null;
let streamProcess = null;
let sseRequest = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let connectionStatus = 'Disconnected';
const recentFloodMap = new Map(); // Flood / Debounce Rate Limiter Map

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
  let cfg = {
    serverUrl: 'https://ntfy.sh',
    topic: '',
    token: '',
    sound: true,
    apps: []
  };
  try {
    if (fs.existsSync(configPath)) {
      cfg = Object.assign(cfg, JSON.parse(fs.readFileSync(configPath, 'utf8')));
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }

  // Ensure apps array exists and migrate legacy single/comma topic string
  if (!Array.isArray(cfg.apps) || cfg.apps.length === 0) {
    const rawTopics = String(cfg.topic || '').split(',').map(t => t.trim()).filter(Boolean);
    if (rawTopics.length > 0) {
      cfg.apps = rawTopics.map((t, idx) => ({
        id: 'app-' + (Date.now() + idx),
        name: rawTopics.length === 1 ? 'Primary Web App' : `Web App ${idx + 1}`,
        topic: t,
        serverUrl: cfg.serverUrl || 'https://ntfy.sh',
        token: cfg.token || ''
      }));
    } else {
      const defaultTopic = 'desktop-alerts-' + Math.floor(1000 + Math.random() * 9000);
      cfg.apps = [{
        id: 'app-' + Date.now(),
        name: 'Default Web App',
        topic: defaultTopic,
        serverUrl: cfg.serverUrl || 'https://ntfy.sh',
        token: ''
      }];
    }
    cfg.topic = cfg.apps.map(a => a.topic).join(',');
    saveConfigData(cfg);
  }
  return cfg;
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
  const activeAppsCount = Array.isArray(appConfig.apps) ? appConfig.apps.length : 0;
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
      label: `Configured Apps: ${activeAppsCount}`,
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

function sanitizeTopic(t) {
  if (!t) return '';
  return String(t).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function getTopics() {
  let list = [];
  if (Array.isArray(appConfig.apps) && appConfig.apps.length > 0) {
    list = appConfig.apps.map(a => sanitizeTopic(a.topic)).filter(Boolean);
  } else if (appConfig.topic) {
    list = String(appConfig.topic).split(',').map(t => sanitizeTopic(t)).filter(Boolean);
  }
  return Array.from(new Set(list));
}

function getAppByTopic(topic) {
  if (!topic || !Array.isArray(appConfig.apps)) return null;
  return appConfig.apps.find(a => a.topic && a.topic.trim().toLowerCase() === topic.trim().toLowerCase());
}

function startSseConnection() {
  stopActiveStream();

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const topics = getTopics();
  if (topics.length === 0) {
    updateStatus('No Topic Configured');
    return;
  }

  let server = (appConfig.serverUrl || 'https://ntfy.sh').trim().replace(/\/+$/, '');
  // ntfy supports comma-separated topics in a single stream: server/topic1,topic2/json
  const urlStr = `${server}/${topics.map(encodeURIComponent).join(',')}/json`;

  updateStatus('Connecting...');

  // Use Windows built-in curl.exe first (native, signed by Microsoft, immune to Defender socket blocks)
  const curlStarted = startCurlStream(urlStr);
  if (!curlStarted) {
    startNodeHttpsStream(urlStr);
  }
}

function startCurlStream(urlStr) {
  const systemCurl = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'curl.exe');
  const curlExe = fs.existsSync(systemCurl) ? systemCurl : 'curl.exe';

  const args = ['-s', '-N', '-g'];
  if (appConfig.token?.trim()) {
    args.push('-H', `Authorization: Bearer ${appConfig.token.trim()}`);
  }
  args.push(urlStr);

  try {
    const proc = spawn(curlExe, args, {
      windowsHide: true
    });
    streamProcess = proc;

    let buffer = '';
    proc.stdout.on('data', (chunk) => {
      // First byte received from server means connection is alive
      if (connectionStatus !== 'Connected & Listening') {
        updateStatus('Connected & Listening');
        reconnectDelay = 1000;
      }

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
            // Keepalive pulse
          } else {
            handleIncomingNotification(data);
          }
        } catch (e) {
          // ignore non-json
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

  let title = data.title || 'Notification';
  let message = data.message || '';
  let priority = data.priority || 3;
  let tags = Array.isArray(data.tags) ? data.tags : [];
  let clickUrl = data.click || null;
  let actions = data.actions || [];

  const topics = getTopics();
  const itemTopic = data.topic || (topics.length > 0 ? topics[0] : '');
  const matchedApp = getAppByTopic(itemTopic);
  const appName = matchedApp ? matchedApp.name : itemTopic;

  // Check for Zero-Knowledge E2EE payload
  let isDecrypted = false;
  const rawMsg = String(message || '');
  if (rawMsg.trim().startsWith('{"_e2e"') || rawMsg.includes('"_e2e":1')) {
    const appPassword = matchedApp?.password;
    if (appPassword) {
      const decrypted = decryptE2ee(rawMsg, appPassword);
      if (decrypted) {
        isDecrypted = true;
        title = decrypted.title || 'Encrypted Alert';
        message = decrypted.message;
        if (decrypted.tags) tags = decrypted.tags;
        if (decrypted.clickUrl) clickUrl = decrypted.clickUrl;
      } else {
        title = 'Encrypted Alert';
        message = '⚠️ Passphrase mismatch: Unable to decrypt this alert.';
      }
    } else {
      title = 'Encrypted Alert';
      message = '⚠️ Passphrase required: Configure an E2EE password for this app.';
    }
  } else if (typeof message === 'string' && message.trim().startsWith('{') && message.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(message.trim());
      if (parsed.title) title = parsed.title;
      if (parsed.message) message = parsed.message;
      if (parsed.priority) priority = parsed.priority;
      if (parsed.tags) tags = Array.isArray(parsed.tags) ? parsed.tags : tags;
      if (parsed.click) clickUrl = parsed.click;
      if (parsed.actions) actions = parsed.actions;
    } catch (e) {}
  }

  // Rate limiting / Flood debounce protection
  const dedupeKey = `${itemTopic}::${title}::${String(message).slice(0, 60)}`;
  const now = Date.now();
  const floodEntry = recentFloodMap.get(dedupeKey);
  if (floodEntry && (now - floodEntry.firstSeen < 15000)) {
    floodEntry.count++;
    if (floodEntry.count === 2) {
      if (Notification.isSupported()) {
        new Notification({
          title: `[${appName}] ⚠️ Rapid Alerts Throttled`,
          body: `Burst detected: Repeating alerts from ${appName} are being grouped.`,
          silent: true
        }).show();
      }
    }
    return; // Suppress spam burst
  } else {
    recentFloodMap.set(dedupeKey, { firstSeen: now, count: 1 });
    if (recentFloodMap.size > 200) {
      for (const [k, v] of recentFloodMap.entries()) {
        if (now - v.firstSeen > 30000) recentFloodMap.delete(k);
      }
    }
  }

  const item = {
    id: data.id || ('id_' + Date.now()),
    time: data.time ? data.time * 1000 : Date.now(),
    title,
    message,
    topic: itemTopic,
    appName,
    isE2ee: isDecrypted,
    priority,
    tags,
    clickUrl,
    actions
  };

  notificationHistory.unshift(item);
  if (notificationHistory.length > 200) {
    notificationHistory = notificationHistory.slice(0, 200);
  }
  saveHistory(notificationHistory);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('new-notification', item);
  }

  // Windows Native Toast Notification (Shows which app/topic sent it)
  if (Notification.isSupported()) {
    const toastPrefix = isDecrypted
      ? `🔒 [${appName}] `
      : (appName ? `[${appName}] ` : (item.topic ? `[${item.topic}] ` : ''));
    const toastTitle = `${toastPrefix}${item.title}`;
    const notif = new Notification({
      title: toastTitle,
      body: item.message,
      icon: process.platform === 'win32' ? path.join(__dirname, 'assets', 'icon.ico') : path.join(__dirname, 'assets', 'icon.png'),
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

function sendAppTestAlert(targetApp) {
  if (!targetApp || !targetApp.topic) return;
  let server = (targetApp.serverUrl || appConfig.serverUrl || 'https://ntfy.sh').replace(/\/+$/, '');
  const url = `${server}/${encodeURIComponent(targetApp.topic)}`;

  const systemCurl = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'curl.exe');
  const curlExe = fs.existsSync(systemCurl) ? systemCurl : 'curl.exe';

  let postTitle = `[${targetApp.name}] Live Alert 🔔`;
  let postBody = `Push alert for ${targetApp.name} is working perfectly!`;
  if (targetApp.password) {
    postTitle = '🔒 Encrypted Alert';
    postBody = encryptE2ee({
      title: 'Live Alert 🔔',
      message: `Push alert for ${targetApp.name} is working perfectly! [E2EE Verified]`
    }, targetApp.password);
  }

  const curlArgs = [
    '-s',
    '-X', 'POST',
    url,
    '-H', `Title: ${postTitle}`,
    '-H', 'Priority: high',
    '-H', 'Tags: tada,white_check_mark',
    '-d', postBody
  ];
  if (targetApp.token?.trim() || appConfig.token?.trim()) {
    curlArgs.push('-H', `Authorization: Bearer ${(targetApp.token || appConfig.token).trim()}`);
  }

  try {
    const p = spawn(curlExe, curlArgs, { windowsHide: true });
    p.on('error', () => {
      sendTestAlertFallback(url);
    });
  } catch (err) {
    sendTestAlertFallback(url);
  }
}

function sendTestAlert() {
  const topics = getTopics();
  const targetTopic = topics.length > 0 ? topics[0] : (appConfig.topic || 'test-topic');
  if (!targetTopic) return;

  let server = (appConfig.serverUrl || 'https://ntfy.sh').replace(/\/+$/, '');
  const url = `${server}/${encodeURIComponent(targetTopic)}`;

  const systemCurl = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'curl.exe');
  const curlExe = fs.existsSync(systemCurl) ? systemCurl : 'curl.exe';

  const curlArgs = [
    '-s',
    '-X', 'POST',
    url,
    '-H', 'Title: Desktop Test Alert 🔔',
    '-H', 'Priority: high',
    '-H', 'Tags: tada,white_check_mark',
    '-d', 'NotifyPush Windows Desktop Client is working flawlessly!'
  ];
  if (appConfig.token?.trim()) {
    curlArgs.push('-H', `Authorization: Bearer ${appConfig.token.trim()}`);
  }

  try {
    const p = spawn(curlExe, curlArgs, { windowsHide: true });
    p.on('error', () => {
      sendTestAlertFallback(url);
    });
  } catch (err) {
    sendTestAlertFallback(url);
  }
}

function sendTestAlertFallback(url) {
  try {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const body = 'NotifyPush Windows Desktop Client is working flawlessly!';
    const headers = {
      'Title': 'Desktop Test Alert 🔔',
      'Priority': 'high',
      'Tags': 'tada,white_check_mark',
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
  const windowIconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 480,
    height: 740,
    minWidth: 420,
    minHeight: 580,
    title: 'NotifyPush Desktop',
    icon: windowIconPath,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('connection-status', connectionStatus);
  });

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
  const trayIconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'icon.ico')
    : path.join(__dirname, 'assets', 'icon.png');
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
  ipcMain.handle('get-status', () => connectionStatus);
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
  ipcMain.handle('add-app', (event, newApp) => {
    if (!newApp || !newApp.topic) return { success: false, error: 'Topic is required' };
    const cleanTopic = sanitizeTopic(newApp.topic);
    if (!cleanTopic) return { success: false, error: 'Valid topic name required' };
    const appItem = {
      id: 'app-' + Date.now(),
      name: (newApp.name && newApp.name.trim()) ? newApp.name.trim() : 'Web App ' + ((appConfig.apps?.length || 0) + 1),
      topic: cleanTopic,
      serverUrl: newApp.serverUrl?.trim() || appConfig.serverUrl || 'https://ntfy.sh',
      token: newApp.token?.trim() || '',
      password: newApp.password?.trim() || ''
    };
    if (!Array.isArray(appConfig.apps)) appConfig.apps = [];
    appConfig.apps.push(appItem);
    appConfig.topic = appConfig.apps.map(a => a.topic).join(',');
    saveConfigData(appConfig);
    updateTrayMenu();
    startSseConnection();
    return { success: true, app: appItem, apps: appConfig.apps };
  });

  ipcMain.handle('delete-app', (event, appId) => {
    if (!Array.isArray(appConfig.apps)) return { success: false };
    appConfig.apps = appConfig.apps.filter(a => a.id !== appId);
    appConfig.topic = appConfig.apps.map(a => a.topic).join(',');
    saveConfigData(appConfig);
    updateTrayMenu();
    startSseConnection();
    return { success: true, apps: appConfig.apps };
  });

  ipcMain.handle('test-app-alert', (event, appId) => {
    const targetApp = appConfig.apps?.find(a => a.id === appId);
    if (targetApp) {
      sendAppTestAlert(targetApp);
      return { success: true };
    }
    return { success: false, error: 'App not found' };
  });

  ipcMain.handle('get-autostart', () => {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('set-autostart', (event, enable) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!enable,
        openAsHidden: true
      });
      return app.getLoginItemSettings().openAtLogin;
    } catch (e) {
      console.error('Error setting autostart:', e);
      return false;
    }
  });

  ipcMain.handle('open-external', (event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  });

  ipcMain.handle('generate-qr-data-url', async (event, text) => {
    try {
      if (!text) return null;
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Failed to generate QR code data URL:', err);
      return null;
    }
  });
});

app.on('before-quit', () => {
  stopActiveStream();
});

app.on('window-all-closed', () => {
  // Do not quit on Windows: keep running in System Tray
});