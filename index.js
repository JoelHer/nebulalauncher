const langmap = new Map()
langmap.set("viewname_home", "Home")
langmap.set("viewname_library", "Library")
langmap.set("viewname_settings", "Settings")
langmap.set("settings_title_general", "General settings")
langmap.set("home_title", "Recently Played")
langmap.set("home_title_recent", "Recently played")
langmap.set("home_title_allgames", "All games")
langmap.set("aID_name-730", "counter strik")

var recentGames = null;
var steamReady = false
var steamCheckIntervalId = undefined

navigationHistory = []
navigationHistoryIndex = 0

function NavBarWrapper() {
    var x = undefined;
    this.get = function () {
        return x;
    }
    this.set = function (newX) {
        if (navigationHistoryIndex != 0) {
            navigationHistory.splice(0,navigationHistoryIndex)
            navigationHistoryIndex = 0
        }
        navigationHistory.splice(0, 0, newX)
        navigationHistory = navigationHistory.slice(0, 10)
        x = newX;
    }
}

function navforth() {
    if (navigationHistoryIndex == 0) return;
    
    if (navigationHistoryIndex > 0) {
        navigationHistoryIndex -= 1
    }
    var _c = navigationHistory[navigationHistoryIndex].split("%")
    var _cS = [..._c]
    _cS.shift()
    
    document.getElementById("pagetitle").innerText = resolveNavigationName(navigationHistory[navigationHistoryIndex])
    window.electronAPI.setTitle("Nebula Launcher - "+ resolveNavigationName(navigationHistory[navigationHistoryIndex]))
    navByName(_c[0], _setTitle=false, _cS)
}

function navBack() {
    if (navigationHistoryIndex >= navigationHistory.length-1) return;
    navigationHistoryIndex += 1

    var _c = navigationHistory[navigationHistoryIndex].split("%")
    var _cS = [..._c]
    _cS.shift()
    document.getElementById("pagetitle").innerText = resolveNavigationName(navigationHistory[navigationHistoryIndex])
    window.electronAPI.setTitle("Nebula Launcher - "+ resolveNavigationName(navigationHistory[navigationHistoryIndex]))
    navByName(_c[0], _setTitle=false, _cS)
}


var currentNavigation = new NavBarWrapper()
currentNavigation.set("home")

function resolveNavigationName(_o = undefined) {
    var _r = []
    var _c
    if (_o) {
        _c = _o.split("%")
    } else {
        _c = currentNavigation.get().split("%")
    }
    console.log(_c)
    _c.forEach((item)=>{_r.push(langmap.get("viewname_"+item))})
    _r.forEach((j, i)=>{ 
        if (!j) {
            if (returnAID(_c[i])) {
                _lmName = langmap.get("aID_name-"+returnAID(_c[i])); 
                if(_lmName){
                    _r[i] = _lmName
                }else{
                    _r[i] = returnAID(_c[i])
                }
            }else{ 
                _r[i] = _c[i] 
            }
        }
    })
    return _r.join(" - ")
}

function nav(_t) {
    if (navigationHistory[navigationHistoryIndex].split("%")[0] != _t.id) currentNavigation.set(_t.id)
    const els = document.getElementsByClassName("selected")
    try {
        for (i in els)  {
            if(els[i].classList.contains("selected")) {
                els[i].classList.remove('selected') 
            } 
        }
    } catch {}
    _t.classList.add('selected')
    showView(_t.id)
}

const handleRunGameClick = (_appId) => {
    window.electronAPI.runGame(_appId)
}

function navByName(_n, _setTitle=true) {
    args = [...arguments]
    args.shift()
    args.shift()

    console.log("VIEWNMAME: ", _n, " ARGS: ", args[0][0])

    if (_n == "library" && returnAID(args[0])) {
        var e = document.getElementsByClassName("lib-left-top-bg")
        for (i in e) {
            e[i].style = `background-image: url("https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${returnAID(args[0][0])}/page_bg_raw.jpg")`
        }

        e = document.getElementsByClassName("lib-left-top-logo")
        for (i in e) {
            e[i].style = `background-image: url("https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${returnAID(args[0][0])}/logo.png")`
        }

        const runGameButtons = document.getElementsByClassName("runGame");

        for (let i = 0; i < runGameButtons.length; i++) {
            const button = runGameButtons[i];
            button.setAttribute('data-appid', returnAID(args[0][0]))
            const appId = button.getAttribute('data-appid');
            button.removeEventListener("click", handleRunGameClick);
            button.addEventListener("click", () => handleRunGameClick(appId));
        }
    }

    var els = document.getElementsByClassName("selected")
    try {
        for (i in els)  {
            if(els[i].classList.contains("selected")) {
                els[i].classList.remove('selected') 
            } 
        }
    } catch {}

    els = document.getElementsByClassName("navbaritem")
    for (i in els) {
        if (els[i].id == _n) els[i].classList.add('selected')
    }

    showView(_n, _setTitle)
}

const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

function showView(viewId, _setTitle=true) {
    if (_setTitle) {
        document.getElementById("pagetitle").innerText = resolveNavigationName()
        window.electronAPI.setTitle("Nebula Launcher - "+ resolveNavigationName())
    }

    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    document.getElementById(viewId+"View").style.display = 'block';
}
  
async function populateGrid(_id, data=null) {
    games = undefined
    if (_id == "recentGames" && data==null) {
        games = window.electronAPI.getRecentGames()
    }
    if (_id == "allGames" && data==null) {
        games = window.electronAPI.getAllGames()
    }
    if (data) {
        games = new Promise((resolve, reject) => {
            resolve(data)
        })
    }
    games.then(function(result) {
        var apps = result.apps
        var mostPlayed = [...apps]
        var lastPlayed = [...apps]
        mostPlayed.sort((a, b) => b.playtime_forever - a.playtime_forever)
        mostPlayed.forEach((e)=>{
            langmap.set("aID_name-"+e.appid, e.name)
        })
        lastPlayed = lastPlayed.sort((a, b) => b.rtime_last_played - a.rtime_last_played).slice(0, 10)

        if (_id == "recentGames") {
            document.getElementById(_id).innerHTML = ""
            lastPlayed.forEach((game, index) => {
                setTimeout(()=>{
                    window.electronAPI.checkFileExist("./images/card/"+game.appid+"_library_600x900.jpg").then((r)=>{
                        document.getElementById(_id).innerHTML += `
                        <div class="card" onclick="navLibrary(${game.appid})">
                            <div class="cardImage card-appid_${game.appid}" id="${_id}_${game.appid}" style="`+((r)?`background-image: url('./images/card/${game.appid}_library_600x900.jpg');`:"")+`">
                                ${(!r)?'<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>':''}
                            </div>
                            <div class="cardShadow">
                            </div>
                        </div>`
                        setTimeout(()=>{
                            if (r) {
                                document.getElementById(`${_id}_${game.appid}`).style.opacity = "100%"
                            } else {
                                window.electronAPI.pushImageResolver(
                                    {
                                        appid: game.appid,
                                        type: "card",
                                        file: game.appid+"_library_600x900.jpg",
                                        resolved: false,
                                        processing: false,
                                        error: false
                                    }
                                ).then((queue) => {
                                    console.log(queue)
                                })
                            }
                        },20)
                    })
                },50*index)
            });
        }
        if (_id == "allGames") {
            if (document.getElementById(_id).children.length == mostPlayed.length) return;

            console.log(document.getElementById(_id).children.length, ",", mostPlayed.length)
            document.getElementById(_id).innerHTML = ""

            mostPlayed.forEach((game, index) => {
                setTimeout(()=>{
                    window.electronAPI.checkFileExist("./images/card/"+game.appid+"_library_600x900.jpg").then((r)=>{
                        document.getElementById(_id).innerHTML += `
                        <div class="card" onclick="navLibrary(${game.appid})">
                            <div class="cardImage card-appid_${game.appid}" id="${_id}_${game.appid}" style="`+((r)?`background-image: url('./images/card/${game.appid}_library_600x900.jpg');`:"")+`">
                                ${(!r)?'<div class="spinner"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>':''}
                            </div>
                            <div class="cardShadow">
                            </div>
                        </div>`
                        setTimeout(()=>{
                            if (r) {
                                document.getElementById(`${_id}_${game.appid}`).style.opacity = "100%"
                            } else {
                                window.electronAPI.pushImageResolver(
                                    {
                                        appid: game.appid,
                                        type: "card",
                                        directory: "./images/card",
                                        type: "library_600x900",
                                        resolved: false,
                                        processing: false,
                                        error: false,
                                        htmlclass: "card-appid_"
                                    }
                                ).then((queue) => {})
                            }
                        },20)
                    })
                },50*index)
            });
        }
    })
}

function returnAID(_iS) {
    console.log(_iS)
    if (Array.isArray(_iS)) {
        _iS = _iS[0]
    }
    const prefix = "aID:";
    if (_iS.startsWith(prefix)) {
      return _iS.slice(prefix.length);
    } else {
      return null;
    }
}

function navLibrary(_appId) {
    /*
    var e = document.getElementsByClassName("lib-left-top-bg")
    for (i in e) {
        e[i].style = `background-image: url("https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${_appId}/page_bg_raw.jpg")`
    }

    e = document.getElementsByClassName("lib-left-top-logo")
    for (i in e) {
        e[i].style = `background-image: url("https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${_appId}/logo.png")`
    }
    */
    
    currentNavigation.set("library%aID:"+_appId)
    var _c = currentNavigation.get().split("%")
    var _cS = [..._c]
    _cS.shift()
    navByName(_c[0], true, _cS)
}

document.addEventListener('DOMContentLoaded', () => {
    steamCheckIntervalId = setInterval(()=> {
        if(!steamReady) {
            var re = window.electronAPI.getReadyStatus()
            re.then((res) => {
                steamReady = res
            })
        } else {
            console.log("STEAM IS READY")
            setTimeout(()=>{
                populateGrid("recentGames")
                populateGrid("allGames")
            },100)
            clearInterval(steamCheckIntervalId)
        }
    },100)
    const textel = document.querySelectorAll('p, h1, h2, h3, h4, h5')
    textel.forEach(element => {
        if (element.innerText.charAt(0) == "$") {
            if (langmap.get(element.innerText.substring(1))) {
                element.innerText = langmap.get(element.innerText.substring(1))
            } else {
                console.error("Error: Could not find language string for: "+element.innerText.substring(1))
                element.innerText = "No key named '"+element.innerText+"' in langmap"
            }
        }
    })

    window.electronAPI.setTitle("Nebula Launcher - "+ langmap.get("viewname_home"))
    
    var _c = currentNavigation.get().split("%")
    var _cS = [..._c]
    _cS.shift()
    navByName(_c[0], true, _cS)
    
    const btn = document.getElementById('btn')
    const filePathElement = document.getElementById('filePath')
});
  


window.electronAPI.onReceive('imageResolver-changed', (job) => {
    setTimeout(()=>{
        if(job.error == false && job.processing == false && job.resolved) {
            try {
                if (job.htmlclass) {
                    els = document.getElementsByClassName(`${job.htmlclass}${job.appid}`)
                    for (i in els) {
                        var element = els[i] 
                        element.innerHTML = ""
                        element.style.opacity = "100%"
                        element.style.backgroundImage = "url("+job.file+")"
                    }
                }
            } catch {}
        }
    },100)
});

window.electronAPI.onReceive('cache', (edata) => {
    populateGrid(edata.type, edata.cache)
});

window.electronAPI.onReceive('game:runStateChanged', (edata) => {
    console.log(edata)
    const runGameButtons = document.getElementsByClassName("runGame");

    for (let i = 0; i < runGameButtons.length; i++) {
        const button = runGameButtons[i];
        const appId = button.getAttribute('data-appid');
        if (!appId) return;

        if (appId == edata.appid) {
            if (edata.state == "started") {
                button.classList.add("started");
                button.innerHTML = `<span class="loader"></span>`
            }
            if (edata.state == "stopped") {
                button.classList.remove("started");
            }
        }
    }
});