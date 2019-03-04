nodeRequire('./renderer.js');

function sendNotification() {
    ipcRenderer.send('sendNotification', {subject:document.getElementById("subjectBox").value, body:document.getElementById("bodyBox").value});
    
    window = remote.getCurrentWindow();
    window.close();
}