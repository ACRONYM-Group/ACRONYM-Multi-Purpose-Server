require('./renderer.js');
const dialog = require('electron').remote.dialog 
var packageName = "Loading";

function updateInstallationData() {
    ipcRenderer.send('newSpecificMajor', {name:packageName, newSpecificMajor: document.getElementById("SpecificMajorDisplay").value});
}

function updateDefaultVersion() {
    ipcRenderer.send('newPackageDefaultVersion', {name:packageName, newDefaultVersion: document.getElementById("defaultVersion").value});
}

function forceUninstall() {
    ipcRenderer.send('uninstallPackage', {name:packageName});
    console.log("Uninstalling Package");
}

function uploadNewVersion() {
    var dirToUpload = dialog.showOpenDialog({properties: ['openDirectory']})[0];
    var newVersionNumber = document.getElementById("newVersionNumber").value;

    ipcRenderer.send('uploadNewVersion', {name:packageName, newVersionNumber: newVersionNumber, newVersionPath:dirToUpload});
}

function initialLoad() {
    ipcRenderer.send('requestPackageToDisplay', "Ping");
}

initialLoad();

ipcRenderer.on('packageToDisplay', (event, arg) => {
    packageName = arg;
    document.getElementById("packageName").innerText = arg;
    ipcRenderer.send('requestPackageInfo', arg);
})

ipcRenderer.on('localPackageInfo', (event, arg) => {
    console.log(arg);
    if (arg != undefined) {
        document.getElementById("SpecificMajorDisplay").value = arg["specificMajor"];
    }
});

ipcRenderer.on('serverPackageInfo', (event, arg) => {
    console.log(arg);
    document.getElementById("defaultVersion").value = arg["defaultVersion"];

    var textToAdd = "";
    for (var property in arg["versions"]) {
        if (arg["versions"].hasOwnProperty(property)) {
            var textToAdd = textToAdd + "<h5>" + property + "</h5>";
        }
    }

    document.getElementById("versionList").innerHTML = textToAdd;
});