require('./renderer.js')

function switchToIndexPage() {
    console.log("Test")
    ipcRenderer.send('loginButtonPressed', 'ping')
}