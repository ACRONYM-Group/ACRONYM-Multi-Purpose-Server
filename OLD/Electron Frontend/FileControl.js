const {dialog} = require('electron').remote


function openFile() {
    console.log(dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}))
}