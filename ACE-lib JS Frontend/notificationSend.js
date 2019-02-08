nodeRequire('./renderer.js');

function sendNotification() {
    alert({subject:document.getElementById("subjectBox").value, body:document.getElementById("bodyBox").value});
    ipcRenderer.send('sendNotification', {subject:document.getElementById("subjectBox").nodeValue, body:document.getElementById("bodyBox").value});
    
    window = remote.getCurrentWindow();
    window.close();
}