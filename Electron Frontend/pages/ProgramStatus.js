require('../renderer.js');
currentFileSystemDirectory = "";

function navigateToPage(buttonID) {
    ipcRenderer.send('requestPage', buttonID.substring(3));
}