const ipc = require('node-ipc');
const spawn = require('child_process').spawn;
const {app, BrowserWindow, dialog, ipcMain} = require('electron')

var randomID = Math.floor(Math.random()*5000)*Date.now();
var requiredACEs = [];
var ownedACEs = [];
var ownedACEsData = {};
var loginWin;
var username = "NOTLOGGEDIN";
var CardsData = "<div class='programStatusCard' style='height:45px;'><h5 style='color:white; width:100%; background-color:#444444;'>Minecraft Server</h5><div style='width:100%; height:1px; background-color:black;'></div><div style='display:flex; width:100%;'><div style='display:flex;'><h5 style='color:white;'>Status: Online </h5><div class='cardHorizontalSpacer' style='width:1px; height:25px; background-color:black;'></div><h5 style='color:white;'>Players: 3 </h5></div></div></div>";
var programInstallDirectory = "Z:/AcroFTPClient/";

var avaliablePackageUpdates = [];

function createNewACE() {
  const command = 'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/launch.bat';
  const parameters = [];

  const child = spawn(command, parameters, {cwd: 'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/'});

  requiredACEs.push({type:"generalPurpose"});
}

function createHubWindow() {
  hubWin = new BrowserWindow({width: 425, height: 340, frame: false, show: true});
  hubWin.loadFile('hub.html')
  return hubWin;
}

function createUpdateDialog(data) {
  updateWin = new BrowserWindow({width: 375, height: 200, frame: false, show: true});
  updateWin.loadFile('update.html')
  updateWin.webContents.openDevTools();
  return updateWin;
}

createNewACE();

ipc.config.id = 'world';
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.serve(() => ipc.server.on('command', (message, socket) => {
  if (message["type"] == "connectionRequest") {
    if (requiredACEs.length > 0) {
      ipc.server.emit(socket, "connectionResponse", {target:message["ID"], hostID:randomID, role:requiredACEs[0]["type"]});
    }
  }

  if (message["type"] == "connectionAccepted" && message["target"] == randomID) {
    ownedACEs.push(message["ID"]);
    ownedACEsData[message["ID"]] = {type:requiredACEs[0]["type"], socket:socket};
    requiredACEs.shift();
    console.log("Gained ownership of ACE #" + message["ID"]);
  }
  if (ownedACEs.indexOf(message["ID"]) != -1 && message["target"] == randomID) {
    if (message["type"] == "heartbeat") {
      ipc.server.emit(socket, "heartbeat", {target:message["ID"]});
    } else if (message["type"] == "rawMessage") {
      console.log(message["data"]);
      ipc.server.emit(socket, "message", {target:message["ID"], data:"Hello ACE!"});
    } else if (message["type"] == "loginResult") {
      if (message["data"]) {
        loginWin.send("authResult", message["data"]);
        loginWin.close();
        hubWin = createHubWindow();
      } else {
        loginWin.send("authResult", message["data"]);
      }
    } else if (message["type"] == "printToConsole") {
      console.log("ACE Output: " + message["data"]);
    } else if (message["type"] == "avaliablePackageUpdates") {
      console.log("avaliablePackageUpdates: " + message["data"]);
      avaliablePackageUpdates = message["data"];
      createUpdateDialog(message["data"]);
    }
  }
}
));
ipc.server.start()


function findGeneralPurposeACE(ownedACEs, ownedACEsData) {
  for (var i = 0; i < ownedACEs.length; i++) {
    console.log("Searching ACES... " + i);
    console.log(ownedACEsData[ownedACEs[i]]["type"]);
    if (ownedACEsData[ownedACEs[i]]["type"] == "generalPurpose") {
      console.log("Found generalPurposeACE")
      return ownedACEs[i];
      i = ownedACEs.length + 1;
    } 
  }
}




ipcMain.on('login', (event, arg) => {
  console.log("Attempting Login")
  var ACEID = findGeneralPurposeACE(ownedACEs, ownedACEsData);
  dataToSend = {target:ACEID, username:arg["username"], password:arg["password"]};
  username = arg["username"];
  ipc.server.emit(ownedACEsData[ACEID]["socket"], "login", dataToSend);
});

ipcMain.on('requestProgramStatusCards', (event, arg) => {
  var ACEID = findGeneralPurposeACE(ownedACEs, ownedACEsData);
  dataToSend = {target:ACEID, username:username};
  ipc.server.emit(ownedACEsData[ACEID]["socket"], "requestProgramStatusCards", dataToSend);

  event.sender.send("programStatusCards", CardsData);
});

ipcMain.on('openPackManager', (event, arg) => {
  packManagerWin = new BrowserWindow({width: 350, height: 360, frame: false, show: true});
  packManagerWin.loadFile('packManager.html')
});

ipcMain.on('requestAvaliablePackageUpdates', (event, arg) => {
  console.log("Window has requested list of Updates.");
  event.sender.send("avaliablePackageUpdates", avaliablePackageUpdates);
});

ipcMain.on('updatePackage', (event, arg) => {
  console.log("Window has requested to update " + arg);
  event.sender.send("updatingPackage", arg);
});





app.on('ready', function() {
  keepAliveWin = new BrowserWindow({width: 10, height: 10, frame: false, show: false});
  loginWin = new BrowserWindow({width: 235, height: 240, frame: false, show: true});
  loginWin.loadFile('login.html')
  //loginWin.webContents.openDevTools()
})

app.on('window-all-closed', () => {
  console.log("Ending App");
  ipc.server.emit(socket, "endProccess", "closingUI");
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  console.log("Ending App");
  ipc.server.emit(socket, "endProccess", "closingUI");
})