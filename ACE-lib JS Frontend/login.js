nodeRequire('./renderer.js')

function switchToIndexPage() {
    console.log("Test")
    var username = document.getElementById("usernameForm").value;
    var password = document.getElementById("passwordForm").value;
    var userCredentials = {username:username, password:password}
    ipcRenderer.send('login', userCredentials);
}

ipcRenderer.on('authResult', (event, arg) => {
    if (arg == false) {
        document.getElementById("ErrorDisplay").innerText = "Authentication Failed! Please Try Again.";
    }  else {
        document.getElementById("ErrorDisplay").innerText = "Login Succesful!... Why are you still here?";
    }
})