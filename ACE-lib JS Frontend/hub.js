require('./renderer.js');

function initialLoad() {
    ipcRenderer.send('requestProgramStatusCards', "Ping");
}

function drawCards(data) {
    var cardTextToAdd = "";
    for (var i = 0; i < data.length; i++) {
        cardTextToAdd += data[i]
    }
    document.getElementById("CardArea").innerHTML = cardTextToAdd;
}

function openPackManager() {
    ipcRenderer.send('openPackManager', "Ping");
}

initialLoad()

ipcRenderer.on('programStatusCards', (event, arg) => {
    drawCards(arg);
})