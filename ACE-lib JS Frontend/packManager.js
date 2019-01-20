require('./renderer.js');
var packages = {};

function initialLoad() {
    ipcRenderer.send('requestAvaliablePackages', "Ping");
}

initialLoad()

function installPackage(id) {
    ipcRenderer.send('installPackage', {name:id, version:packages[id]["defaultVersion"]});
}

function drawCards(data) {
    packages = data;

    var cardTextToAdd = "";
    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            cardTextToAdd += "<div class='packageDisplay'><div class='packDescription'><h4>" + property + "</h4><h6>" + data[property]["desc"] + "</h6></div><div class='cardHorizontalSpacer' style='width:1px; height:25px; background-color:black;'></div><div id='" + property + "' class='packInstallButton' onclick='installPackage(this.id)'>Install</div><div class='packEditButton'>Details</div></div>"
        }
    }
    document.getElementById("bodyGroup").innerHTML = cardTextToAdd;
}

ipcRenderer.on('avaliablePackages', (event, arg) => {
    drawCards(arg);
})

ipcRenderer.on('installingPackages', (event, arg) => {
    document.getElementById(arg).innerText = "Installing...";
})