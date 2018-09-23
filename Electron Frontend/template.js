require('./renderer.js');
currentFileSystemDirectory = "";
const {ipcRenderer} = require('electron')

function navigateToPage(buttonID) {
    ipcRenderer.send('requestPage', buttonID.substring(3));
}