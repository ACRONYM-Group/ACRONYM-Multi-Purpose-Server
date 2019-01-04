require('./renderer.js');

function initialLoad() {
    ipcRenderer.send('requestAvaliablePackageUpdates', "Ping");
}

function updatePackage(data) {
    console.log("Updating " + data);

    ipcRenderer.send('updatePackage', data);
}

function closeWindow() {
    window = remote.getCurrentWindow();
    window.close();
}

function drawUpdates(data) {
    var cardTextToAdd = "";
    console.log(data);
    console.log(Object.keys(data).length);
    for (var i = 0; i < Object.keys(data).length; i++) {
        console.log(i);
        console.log(data[i]);
        cardTextToAdd += (data[i] + "<button id='" + data[i] + "' class='packUpdateButton' onclick='updatePackage(this.id)'>Update</button>" + "<br>");
    }
    document.getElementById("updateList").innerHTML = cardTextToAdd;
}

initialLoad()

ipcRenderer.on('avaliablePackageUpdates', (event, arg) => {
    drawUpdates(arg);
    console.log("Displaying list of updates.");
})

ipcRenderer.on('updatingPackage', (event, arg) => {
    var element = document.getElementById(arg);
    element.parentNode.removeChild(element);
})