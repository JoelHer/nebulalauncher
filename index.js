const langmap = new Map()
langmap.set("viewname_home", "Home")
langmap.set("viewname_library", "Library")
langmap.set("viewname_settings", "Settings")
langmap.set("settings_title_general", "General settings")
langmap.set("home_title", "Recently Played")
langmap.set("home_title_recent", "Recently Played")
langmap.set("home_title_currentfree", "Currently Free")

var recentGames = null;

var steamReady = false
var steamCheckIntervalId = undefined

function nav(_t) {
    document.getElementById("pagetitle").innerText = langmap.get("viewname_"+_t.id)
    window.electronAPI.setTitle("Nebula Launcher - "+ langmap.get("viewname_"+_t.id))
    const els = document.getElementsByClassName("selected")
    try {
        for (i in els)  {
            if(els[i].classList.contains("selected")) {
                els[i].classList.remove('selected') 
            } 
        }
    } catch {}
    _t.classList.add('selected')
    showView(_t.id+"View")
}

const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    document.getElementById(viewId).style.display = 'block';
}
  
async function populateGrid() {
    recentGames = window.electronAPI.getRecentGames()
    recentGames.then(function(result) {
        var apps = result.apps
        var mostPlayed = apps
        var lastPlayed = apps
        mostPlayed.sort((a, b) => b.playtime_forever - a.playtime_forever)
        lastPlayed = lastPlayed.sort((a, b) => b.rtime_last_played - a.rtime_last_played).slice(0, 10)
        console.log(lastPlayed)

        document.getElementById("recentGames").innerHTML = ""
        lastPlayed.forEach(game => {
            document.getElementById("recentGames").innerHTML += `<div class="card">
            <div class="cardImage" style="background-image: url('./images/card/${game.appid}_library_600x900.jpg');">
                </div>
                    <div class="cardShadow">
                </div>
            </div>`
        });
    })
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
    showView('homeView');
    
    const btn = document.getElementById('btn')
    const filePathElement = document.getElementById('filePath')
});
  


