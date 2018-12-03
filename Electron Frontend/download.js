require('./renderer.js')
const {dialog} = require('electron').remote
const {ipcRenderer} = require('electron')
var bigInt = require("big-integer");
const BrowserWindow = require('electron').remote.BrowserWindow;

function closeWindow() {
    window.close();
}

ipcRenderer.on('EncryptionProgressReport', (event, arg) => {
    var decimalPercent = arg["y"]/arg["yMax"];
    if (decimalPercent > 1) {
        decimalPercent = 1;
    }

    var percentage = (Math.floor(decimalPercent*1000)/1000)*100;
    console.log(percentage);
    document.getElementById("EncryptionProgressBar").style.width = percentage + "%";

    if (percentage >= 100) {
        document.getElementById("StatusMessage").innerText = "Transfer Complete";
        setTimeout(closeWindow, 5000);
    }
    
})
//window.close();