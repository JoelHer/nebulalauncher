const { app, BrowserWindow, screen, Notification, dialog, ipcMain } = require('electron')
const path = require('node:path')
const SteamUser = require('steam-user');
const client = new SteamUser();
const axios = require('axios');
const fs = require('fs');
const cacheMgr = require('./modules/cache')
async function initCache() {
    await cacheMgr.initStorage(); 
}
initCache()


var steamConnected = false
var imageResolver = []

let imageResolverProxy = new Proxy(imageResolver, {
    set(target, property, value) {
      target[property] = value;
      if (property !== "length") {
        if (typeof value === "object" && value !== null) {
            if (value.processing == false && value.resolved == false) {
                var res = downloadImage(value.appid, './images/card', 'library_600x900')
                var res2 = downloadImage(value.appid, './images/hero', 'library_hero')
                var res2 = downloadImage(value.appid, './images/hero', 'library_hero_blur')
                var res2 = downloadImage(value.appid, './images/logo', 'logo', 'png')
                res.then(() =>{
                    imageResolver.forEach(job => {
                        if (job.appid == value.appid) {
                            job.resolved = true
                            job.processing = false
                            job.error = false
                            win.webContents.send('imageResolver-changed', job);
                        }
                    })
                }).catch((err) => {
                    console.log("Error downloading image: ",err)
                    imageResolver.forEach(job => {
                        if (job.appid == value.appid) {
                            job.resolved = true
                            job.processing = false
                            job.error = true
                            console.log(`Error resolving image job for appid ${job.appid}`)
                            win.webContents.send('imageResolver-changed', job);
                        }
                    })
                })
            }
        } 
      }
      return true;
    },
    deleteProperty(target, property) {
      delete target[property];
      return true;
    }
});



function handleSetTitle (event, title) {
    console.log("set-title: ",title)
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    const tString = title.toString()
    win.setTitle(tString)
}

function hadleCheckFile(event, path) {
    if (fs.existsSync(path)) {
        return true
    } else {
        return false
    }
}

function hadlePushImageResolver(event, image) {
    imageResolverProxy.push(image)
    return imageResolver
}


function getReadyStatus (event) {
    return steamConnected
}

async function handleGetRecents () {
    return new Promise((resolve, reject) => {
        client.getUserOwnedApps(client.steamID.getSteamID64()).then(function(result) {
            resolve(result)
            cacheMgr.storeData("recentGames", result)
        })
    });
}


function handleGetAllGames () {
    return new Promise((resolve, reject) => {
        client.getUserOwnedApps(client.steamID.getSteamID64()).then(function(result) {
            resolve(result)
            cacheMgr.storeData("allGames", result)
        })
    });
}



let win;
const createWindow = () => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    win = new BrowserWindow({
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
    ipcMain.handle('games:get-recents', handleGetRecents)
    ipcMain.handle('games:get-all', handleGetAllGames)
    ipcMain.on('set-title', handleSetTitle)
    ipcMain.handle('getReadyStatus', getReadyStatus)
    ipcMain.handle('checkFileExist', hadleCheckFile)
    ipcMain.handle('pushImageResolver', hadlePushImageResolver)

    // Load Cache data
    cacheMgr.getData("recentGames").then((d)=>{
        if (d != null) {
            win.webContents.send('cache', {"type":"recentGames","cache":d})
        }
    })

    cacheMgr.getData("allGames").then((d)=>{
        if (d != null) {
            win.webContents.send('cache', {"type":"allGames","cache":d})
        }
    })
    
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
client.options.enablePicsCache = true;
client.logOn({
    refreshToken:""
});

client.on('loggedOn', () => {
    console.log('Logged into Steam as ' + client.steamID.getSteam3RenderedID());
    
});

client.on('licenses', function(licenses) {
	console.log('Our account owns ' + licenses.length + ' license' + (licenses.length == 1 ? '' : 's') + '.');
});

client.on('refreshToken', function(refreshToken) {
	console.log('Refreshtoken: ' + refreshToken);
});

client.on('ownershipCached', async () => {
    console.log('Ownership cached');
    const filterOptions = {
        excludeFree: false,
        excludeShared: false
    };

    const ownedAppIDs = client.getOwnedApps(filterOptions);
    let ownedGames = []
    client.getProductInfo(ownedAppIDs, [], (apps, packages) => {
        for (const packageId in packages) {
            if (packages.hasOwnProperty(packageId)) {
                const package = packages[packageId];
                const appinfo = package.appinfo;
                const common = appinfo.common;
                try { 
                    if (common.type == "Game") {
                        ownedGames.push(appinfo.appid)
                    }
                } catch {}
            }
        }
        steamConnected = true;
    });
});



async function downloadImage(appID, folderPath, type, format="jpg") {
    const url = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appID}/${type}.${format}`;
    const filePath = path.join(folderPath, `${appID}_${type}.jpg`);

    if (fs.existsSync(folderPath+`/${appID}_${type}.jpg`)) {
        return;
    } 

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        fs.mkdirSync(folderPath, { recursive: true });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image for AppID ${appID}:`);
    }
}

client.on('error', (err) => {
    console.error('An error occurred:', err);
});
