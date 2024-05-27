const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
  checkFileExist: (path) => ipcRenderer.invoke('checkFileExist', path),
  getRecentGames: () => ipcRenderer.invoke('games:get-recents'),
  getAllGames: () => ipcRenderer.invoke('games:get-all'),
  getReadyStatus: () => ipcRenderer.invoke('getReadyStatus'),
  pushImageResolver: (image) => ipcRenderer.invoke('pushImageResolver', image),
  onReceive: (channel, func) => {
    let validChannels = ['imageResolver-changed', 'cache'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
})