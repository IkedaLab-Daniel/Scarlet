const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApi', {
  onDeepLink: (handler) => {
    if (typeof handler !== 'function') {
      return () => {};
    }

    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on('deep-link', wrapped);
    return () => ipcRenderer.removeListener('deep-link', wrapped);
  },
  runScan: (payload) => ipcRenderer.invoke('run-scan', payload),
});
