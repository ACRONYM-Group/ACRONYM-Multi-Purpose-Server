require('./renderer.js')

function switchToIndexPage() {
    console.log("Test")
    var username = document.getElementById("usernameForm").value;
    var password = document.getElementById("passwordForm").value;
    var userCredentials = {username:username, password:password}
    ipcRenderer.send('login', JSON.stringify(userCredentials));
}

ipcRenderer.on('displayLoginError', (event, arg) => {
    document.getElementById("ErrorDisplay").innerText = arg;
})