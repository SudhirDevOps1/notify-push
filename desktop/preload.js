const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notifyPushApi', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  testAlert: () => ipcRenderer.invoke('send-test-alert'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onNotification: (callback) => {
    ipcRenderer.on('new-notification', (event, data) => callback(data));
  },
  onStatusChange: (callback) => {
    ipcRenderer.on('connection-status', (event, status) => callback(status));
  }
});