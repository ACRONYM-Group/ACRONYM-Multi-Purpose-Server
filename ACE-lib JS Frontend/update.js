require('./renderer.js');

function initialLoad() {
    ipcRenderer.send('requestAvaliablePackageUpdates', "Ping");
}

function updatePackage(data, newVersion) {
    console.log("Updating " + data);

    ipcRenderer.send('updatePackage', {package:data, version:newVersion});
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
        cardTextToAdd += (data[i]["package"] + "<button id='" + data[i]["package"] + "' class='packUpdateButton' onclick='updatePackage(this.id,\"" + data[i]["newVersion"] + "\")'>Update</button>" + "<br><h5>" + data[i]["currentVersion"] + " to " + data[i]["newVersion"] + "</h5><br>");
    }
    document.getElementById("updateList").innerHTML = cardTextToAdd;
}

initialLoad()

ipcRenderer.on('avaliablePackageUpdates', (event, arg) => {
    drawUpdates(arg);
    console.log("Displaying list of updates.");
})

ipcRenderer.on('updatingPackage', (event, arg) => {
    console.log(arg);
    var element = document.getElementById(arg["package"]);
    element.parentNode.removeChild(element);
})