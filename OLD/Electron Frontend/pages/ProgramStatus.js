//require('../renderer.js');
currentFileSystemDirectory = "";

function requestMinecraftServerData() {
    ipcRenderer.send('requestMinecraftServerData', "ping");
}

function navigateToPage(buttonID) {
    ipcRenderer.send('requestPage', buttonID.substring(3));
}

ipcRenderer.on('MinecraftServerData', (event, arg) => {
    console.log(arg);
    document.getElementById("MCCurrentPlayers").innerHTML = "Current Players: " + arg["currentNumPlayers"];
    document.getElementById("MCMaxPlayers").innerHTML = "Max Players: " + arg["maxPlayers"];
    document.getElementById("MCMOTD").innerHTML = "MOTD: " + arg["mcServerMOTD"];
    document.getElementById("MCMinecraftVersion").innerHTML = "Version: " + arg["mcServerVersion"];
    document.getElementById("MCPort").innerHTML = "Port: " + arg["mcServerPort"];
})

setInterval(requestMinecraftServerData, 500);