const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  askGroq: (message) => ipcRenderer.invoke('ask-groq', message),
  quitApp: () => ipcRenderer.invoke('quit-app'),
});
