const SteamUser = require('steam-user');
const client = new SteamUser();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Log in to Steam
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
                    //console.log(`--- ${common.name} ---`);
                    //console.log(`App ID: ${appinfo.appid}`);
                    //console.log(`Type: ${common.type}`);
                    //console.log(`Missing Token: ${package.missingToken}`);
                    //console.log('--- ---');
                    ownedGames.push(appinfo.appid)
                }
            } catch {}
            }
        }
        (async () => {
            for (const appID of ownedGames) {
                await downloadImage(appID, './images/card');
            }
        })();
        client.getUserOwnedApps(client.steamID.getSteamID64()).then(function(result) {
            console.log(result) 
        })
    });
});



async function downloadImage(appID, folderPath) {
    const url = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appID}/library_600x900.jpg`;
    const filePath = path.join(folderPath, `${appID}_library_600x900.jpg`);

    //check if image is already downloaded
    if (fs.existsSync(folderPath+`/${appID}_library_600x900.jpg`)) {
        //console.log(`Image for AppID ${appID} already exists`);
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
        //console.log(`Downloaded banner for AppID ${appID}`);
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
