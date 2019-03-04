nodeRequire('./renderer.js');

function closeWindow() {
    window = remote.getCurrentWindow();
    window.close();
}

ipcRenderer.on('notificationInfo', (event, arg) => {
    console.log("Adding Notification Data");
    notificationInfo = JSON.parse(arg);
    document.getElementById("subjectBox").innerText = notificationInfo["subject"];
    document.getElementById("bodyBox").innerText = notificationInfo["body"];
});