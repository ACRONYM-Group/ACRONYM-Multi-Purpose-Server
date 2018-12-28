const ipc = require('node-ipc');
const spawn = require('child_process').spawn;

var randomID = Math.floor(Math.random()*5000)*Date.now();
var requiredACEs = [];
var ownedACEs = [];
var ownedACEsData = {};

function createNewACE() {
  const command = 'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/launch.bat';
  const parameters = [];

  const child = spawn(command, parameters, {cwd: 'Z:/Files/Projects/ACRONYM-File-Transfer-System/NodeJS Standard Client MK2/'});

  requiredACEs.push({type:"generalPurpose"});
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
    ownedACEsData[message["ID"]] = {type:requiredACEs[0]["type"]};
    requiredACEs.shift();
    console.log("Gained ownership of ACE #" + message["ID"]);
  }
  if (ownedACEs.indexOf(message["ID"]) != -1 && message["target"] == randomID) {
    console.log(message)
    if (message["type"] == "heartbeat") {
      console.log(message["data"]);
      ipc.server.emit(socket, "heartbeat", {target:message["ID"]});
    } else if (message["type"] == "rawMessage") {
      console.log(message["data"]);
      ipc.server.emit(socket, "message", {target:message["ID"], data:"Hello ACE!"});
    }
  }
}
));
ipc.server.start()