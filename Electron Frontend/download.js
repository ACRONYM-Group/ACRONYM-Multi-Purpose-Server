require('./renderer.js')
const {dialog} = require('electron').remote
const {ipcRenderer} = require('electron')
var bigInt = require("big-integer");
const BrowserWindow = require('electron').remote.BrowserWindow;

function closeWindow() {
    window.close();
}

ipcRenderer.on('EncryptionProgressReport', (event, arg) => {
    var percentage = (Math.floor(arg["y"]/arg["yMax"]*10)/10)*100*0.8;
    console.log(percentage);
    document.getElementById("EncryptionProgressBar").style.width = percentage + "%";
    
})

ipcRenderer.on('TransferProgressReport', (event, arg) => {
    var percentage = (Math.floor(arg["index"]/arg["length"]*10)/10)*100*0.8;
    console.log(percentage);
    document.getElementById("TransferProgressBar").style.width = percentage + "%";
    
})

ipcRenderer.on('DecryptProgressReport', (event, arg) => {
    var percentage = (Math.floor(arg["y"]/arg["yMax"]*10)/10)*100*0.8;
    document.getElementById("DecryptProgressBar").style.width = percentage + "%";
    console.log("receiving decryption status report");

    console.log(percentage/0.8);
    if (percentage/0.8 >= 100) {
        document.getElementById("StatusMessage").innerText = "Transfer Complete";
        setTimeout(closeWindow, 5000);
    }
    
})
//window.close();