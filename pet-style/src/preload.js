const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  askGroq: (message) => ipcRenderer.invoke('ask-groq', message),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (position) => ipcRenderer.send('set-window-position', position),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  openApp: (appKey) => ipcRenderer.invoke('open-app', appKey),
  getRunningApps: () => ipcRenderer.invoke('get-running-apps'),
});
