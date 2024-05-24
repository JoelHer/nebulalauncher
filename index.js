const langmap = new Map()
langmap.set("viewname_home", "Home")
langmap.set("viewname_library", "Library")
langmap.set("viewname_settings", "Settings")
langmap.set("settings_title_general", "General settings")
langmap.set("home_title", "Welcome Home!")

function nav(_t) {
    document.getElementById("pagetitle").innerText = langmap.get("viewname_"+_t.id)
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


function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    document.getElementById(viewId).style.display = 'block';
}
  
document.addEventListener('DOMContentLoaded', () => {
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
    showView('homeView');
});
  