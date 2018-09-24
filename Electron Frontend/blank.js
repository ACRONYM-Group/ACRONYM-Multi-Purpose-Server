renderer = require('./renderer.js');
currentFileSystemDirectory = "";
loadedPageName = "";
const {ipcRenderer} = require('electron')

function navigateToPage(buttonID) {
    ipcRenderer.send('requestPage', buttonID.substring(3));
}

function loadStandardElements() {
    ipcRenderer.send('requestStandardElements', "ping");
}

function initialLoad() {
    ipcRenderer.send('requestPageNameToLoad', "ping");
}
initialLoad();

ipcRenderer.on('commandLoadPage', (event, arg) => {
    loadedPageName = arg;
    loadStandardElements();
});

ipcRenderer.on('standardElements', (event, arg) => {
    dataRec = JSON.parse(arg);
    if (loadedPageName == "login.html") {
        console.log(dataRec["titleGroup.html"]["data"]);
        document.getElementById("titlebarGroup").innerHTML = dataRec["titleGroup.html"]["data"];
        console.log("Got Standard Elements")
        renderer.init();
        ipcRenderer.send('requestPageData', loadedPageName);
    } else {
        console.log(dataRec["sidebar.html"]["data"]);
        console.log(dataRec["titleGroup.html"]["data"]);
        document.getElementById("titlebarGroup").innerHTML = dataRec["titleGroup.html"]["data"];
        document.getElementById("sidebar").innerHTML = dataRec["sidebar.html"]["data"];
        console.log("Got Standard Elements")
        renderer.init();

        script = document.createElement("script");
        script.src = "./standardElements/sidebar.js";
        script.type = "text/javascript";
        document.getElementsByTagName("head")[0].appendChild(script);

        ipcRenderer.send('requestPageData', loadedPageName);
    }
});

ipcRenderer.on('pageLoadData', (event, arg) => {
    if (loadedPageName == "login.html") {
        document.getElementById("bodyGroup").innerHTML = arg;
        script = document.createElement("script");
        script.src = "./pages/" + loadedPageName.slice(0, -4) + "js";
        script.type = "text/javascript";
        document.getElementsByTagName("head")[0].appendChild(script);
    } else 
    {
        document.getElementById("mainText").innerHTML = arg;
        script = document.createElement("script");
        script.src = "./pages/" + loadedPageName.slice(0, -4) + "js";
        script.type = "text/javascript";
        document.getElementsByTagName("head")[0].appendChild(script);
    }
});