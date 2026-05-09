const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  askGroq: (message) => ipcRenderer.invoke('ask-groq', message),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  setWindowPosition: (position) => ipcRenderer.send('set-window-position', position),
  quitApp: () => ipcRenderer.invoke('quit-app'),
});
