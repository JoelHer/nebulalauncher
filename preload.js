const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
  getRecentGames: () => ipcRenderer.invoke('games:get-recents'),
  getReadyStatus: () => ipcRenderer.invoke('getReadyStatus')
})
