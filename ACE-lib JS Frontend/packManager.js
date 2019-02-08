nodeRequire('./renderer.js');
const dialog = nodeRequire('electron').remote.dialog 
var packages = {};
var subbedPackages = {};

function initialLoad() {
    ipcRenderer.send('requestSubbedPackages', "Ping");
}

initialLoad()

function installPackage(id) {
    ipcRenderer.send('installPackage', {name:id, version:packages[id]["defaultVersion"]});
    console.log("Installing Package");
}

function uninstallPackage(id) {
    ipcRenderer.send('uninstallPackage', {name:id});
    console.log("Uninstalling Package");
}

function requestSubbedPackages() {
    ipcRenderer.send('requestSubbedPackages', "Ping");
}

function installingResponse(id) {
    alert("package is already being installed");
    console.log("package is already being installed");
}

function openpackage(packageName) {
    console.log("opening package editor");
    ipcRenderer.send('openPackageEditor', packageName);
}

function checkForUpdates() {
    ipcRenderer.send('checkForUpdates', "Ping");
}

function uploadNewPackage() {
    var dirToUpload = dialog.showOpenDialog({properties: ['openDirectory']})[0];
    var newVersionNumber = document.getElementById("newPackageVersion").value;
    var packageName = document.getElementById("newPackageName").value;
    var packageDesc = document.getElementById("newPackageDesc").value;
    console.log(packageDesc);

    ipcRenderer.send('uploadNewPackage', {name:packageName, newVersionNumber: newVersionNumber, newVersionPath:dirToUpload, packageDesc:packageDesc});
}

function drawCards(data) {
    packages = data;

    var cardTextToAdd = "";
    for (var property in data) {
        if (data.hasOwnProperty(property)) {
            if (subbedPackages[property] == undefined) {
                packageStatus = "install";
                installButtonOnclick = 'installPackage(this.id)';
            } else if (subbedPackages[property]["status"] == "installed") {
                packageStatus = "uninstall"
                installButtonOnclick = 'uninstallPackage(this.id)';
            } else if (subbedPackages[property]["status"] == "installing") {
                packageStatus = "installing"
                installButtonOnclick = 'installingResponse(this.id)';
            } else {
                packageStatus = "install"
                installButtonOnclick = 'installPackage(this.id)';
            }
            cardTextToAdd += "<div class='packageDisplay'><div class='packDescription'><h4>" + property + "</h4><h6>" + data[property]["desc"] + "</h6></div><div class='cardHorizontalSpacer' style='width:1px; height:25px; background-color:black;'></div><div id='" + property + "' class='packInstallButton' onclick='" + installButtonOnclick + "'>" + packageStatus + "</div><div class='packEditButton' onclick='openpackage(\"" + property + "\" );'>More</div></div>"
        }
    }
    document.getElementById("bodyGroup").innerHTML = cardTextToAdd;
}

ipcRenderer.on('avaliablePackages', (event, arg) => {
    drawCards(arg);
})

ipcRenderer.on('subbedPackages', (event, arg) => {
    subbedPackages = arg;
    ipcRenderer.send('requestAvaliablePackages', "Ping");
})

ipcRenderer.on('installingPackage', (event, arg) => {
    //document.getElementById(arg["name"]).innerText = "Installing";
})

setInterval(requestSubbedPackages, 1000);