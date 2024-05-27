const storage = require('node-persist');
const path = require('path');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'Nebula', 'Launcher');

console.log("CACHEDIR: ", cacheDir)

async function initStorage() {
    await storage.init({ dir: cacheDir });
}

async function storeData(key, value) {
    try {
        await storage.setItem(key, value);
        console.log(`Stored: { ${key}: ${value} }`);
    } catch (err) {
        console.error(`Error storing data: { ${key}: ${value} }`, err);
    }
}

async function getData(key) {
    try {
        const value = await storage.getItem(key);
        if (value !== undefined) {
            return value;
        } else {
            return null;
        }
    } catch (err) {
        console.error(`Error getting data for key: ${key}`, err);
        return null;
    }
}

module.exports = {
    initStorage,
    storeData,
    getData
}
