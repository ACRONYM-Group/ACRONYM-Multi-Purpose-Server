const ipc = require('node-ipc');
const spawn = require('child_process').spawn;
const {app, BrowserWindow, dialog, ipcMain} = require('electron')

var randomID = Math.floor(Math.random()*5000)*Date.now();
var requiredACEs = [];
var ownedACEs = [];
var ownedACEsData = {};
var loginWin;

function createNewACE() {
  const command = 'C:/Users/Jordan/Desktop/AMPS/NodeJS Standard Client MK2/launch.bat'; //'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/launch.bat';
  const parameters = [];

  const child = spawn(command, parameters, {cwd: 'C:/Users/Jordan/Desktop/AMPS/NodeJS Standard Client MK2/'/*'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/'*/});

  requiredACEs.push({type:"generalPurpose"});
}

function createHubWindow() {
  hubWin = new BrowserWindow({width: 425, height: 340, frame: false, show: true});
  hubWin.loadFile('hub.html')
  return hubWin;
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
    console.log(ACEID);
    dataToSend = {target:ACEID, username:arg["username"], password:arg["password"]};
    ipc.server.emit(ownedACEsData[ACEID]["socket"], "login", dataToSend);
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