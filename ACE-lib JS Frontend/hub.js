require('./renderer.js');

function initialLoad() {
    ipcRenderer.send('requestProgramStatusCards', "Ping");
}

initialLoad()

ipcRenderer.on('programStatusCards', (event, arg) => {
    
})