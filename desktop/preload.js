const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notifyPushApi', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getHistory: () => ipcRenderer.invoke('get-history'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  testAlert: () => ipcRenderer.invoke('send-test-alert'),
  addApp: (app) => ipcRenderer.invoke('add-app', app),
  deleteApp: (id) => ipcRenderer.invoke('delete-app', id),
  testApp: (id) => ipcRenderer.invoke('test-app-alert', id),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  setAutoStart: (enable) => ipcRenderer.invoke('set-autostart', enable),
  generateQrCode: (text) => ipcRenderer.invoke('generate-qr-data-url', text),
  onNotification: (callback) => {
    ipcRenderer.on('new-notification', (event, data) => callback(data));
  },
  onStatusChange: (callback) => {
    ipcRenderer.on('connection-status', (event, status) => callback(status));
  }
});