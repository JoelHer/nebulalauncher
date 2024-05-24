const { app, BrowserWindow, screen, Notification } = require('electron')
const path = require('path')

const createWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const win = new BrowserWindow({
        width: parseInt(width*0.7),
        height: parseInt(height*0.7),
        minHeight: 600,
        minWidth: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#26292F',
            symbolColor: '#c7d2d2',
            height: 50,
        },
        webPreferences: {
            nodeIntegration: true
        }
    })
  
    win.loadFile('index.html')
}

const NOTIFICATION_TITLE = 'Nebula Launcher Closed'
const NOTIFICATION_BODY = 'Nebula Launcher has closed, and will not be running in the background. Disable this notification in the settings, or click this notification.'

function showNotification () {
    new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show()
}

app.on('window-all-closed', () => {
    showNotification()
    if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

