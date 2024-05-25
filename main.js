const { app, BrowserWindow, screen, Notification, ipcMain } = require('electron')
const path = require('node:path')

function handleSetTitle (event, title) {
    console.log("set-title: ",title)
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    const tString = title.toString()
    win.setTitle(tString)
}

const createWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const win = new BrowserWindow({
        width: parseInt(width*0.7),
        height: parseInt(height*0.7),
        minHeight: 600,
        minWidth: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            nodeIntegration: true
        },
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#26292F',
            symbolColor: '#c7d2d2',
            height: 50,
        }
    })
  
    win.loadFile('index.html')
}

const NOTIFICATION_TITLE = 'Nebula Launcher running in tray'
const NOTIFICATION_BODY = 'Nebula Launcher has closed, and will be running in the background. Disable this notification in the settings, or click this notification.'

function showNotification () {
    new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show()
}

app.on('window-all-closed', () => {
    showNotification()
})

app.whenReady().then(() => {
    ipcMain.on('set-title', handleSetTitle)
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

