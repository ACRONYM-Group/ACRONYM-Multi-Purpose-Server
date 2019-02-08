const {app, BrowserWindow, dialog, ipcMain} = require('electron')
var seedrandom = require('seedrandom');
var fs = require('fs');
var fse = require('fs-extra');
const del = require('del');
var rimraf = require('rimraf');
var bigInt = require("big-integer");
var aesjs = require("aes-js");
var path = require("path");
var readDir = require("recursive-readdir");
var sha256 = require('js-sha3').sha3_256;

var latestMinecraftData = {};
var keyExchangeInts = [];
var keyExchangeLargerPrime = 0;
var keyExchangeSmallerPrime = 0;
var key = bigInt(0);
var theirMixed = 0;
//var ServerIP = "74.127.130.100";
var ServerIP = "192.168.1.104";
var ServerPort = 4242;
var MOTD = "Message Of The Day...";
var loginButtonPushEvent;
let win
let loginWin
var partialLPWPackets = {};
var partiallyReceivedPacket = "";
var buffer = require('buffer')
var queuedDecryptionJobs = [];
var DecryptWindows = [];
var fileWriteQueue = {};
var lastHeartbeatTime = Date.now();
var randomID = Math.floor(Math.random()*5000)*Date.now();
var hostID = -1;
var computerName = "";
var serverInstallDir = "Z:/AcroFTP/"

const ipc = require('node-ipc');

function consoleOutput(data, ipcHost) {
  ipcHost.emit('command', {type:"printToConsole", data: data, ID:randomID, target:hostID})
}

function rmdir(d) {
  var self = arguments.callee
  if (fs.existsSync(d)) {
      fs.readdirSync(d).forEach(function(file) {
          var C = d + '/' + file
          if (fs.statSync(C).isDirectory()) self(C)
          else fs.unlinkSync(C)
      })
      fs.rmdirSync(d)
  }
}

function cleanEmptyFoldersRecursively(folder) {
  var isDir = fs.statSync(folder).isDirectory();
  if (!isDir) {
    return;
  }
  var files = fs.readdirSync(folder);
  if (files.length > 0) {
    files.forEach(function(file) {
      var fullPath = path.join(folder, file);
      cleanEmptyFoldersRecursively(fullPath);
    });

    // re-evaluate files; after deleting subfolder
    // we may have parent folder empty now
    files = fs.readdirSync(folder);
  }

  if (files.length == 0) {
    console.log("removing: ", folder);
    fs.rmdirSync(folder);
    return;
  }
}

ipc.config.id = 'hello';
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.connectTo('world', () => {
  ipc.of.world.on('connect', () => {
    ipc.of.world.emit('command', {type:"connectionRequest", data:randomID, ID:randomID});
  });

  ipc.of.world.on('message', (message) => {
    if (message["target"] == randomID) {
      console.log("New Message!");
      console.log(message);
    }
  });

  ipc.of.world.on('connectionResponse', (message) => {
    if (message["target"] == randomID) {
      if (message["hostID"] != -1 && hostID == -1) {
        hostID = message["hostID"];
        ipc.of.world.emit('command', {type:"connectionAccepted", data:"ping", ID:randomID, target:hostID});
        consoleOutput("ACE has accepeted!", ipc.of.world);
      }
     }
  });

  ipc.of.world.on('heartbeat', (message) => {
    if (message["target"] == randomID) {
      lastHeartbeatTime = Date.now()
    }
  });

  ipc.of.world.on('endProccess', (message) => {
    if (message["target"] == randomID) {
      console.log("Ending Proccess!");
      console.log(app.quit());
    }
  });

  ipc.of.world.on('login', (message) => {
    if (message["target"] == randomID) {
      consoleOutput("Loging In... with " + sha256(message["password"]), ipc.of.world);
      commandToSend = {CMDType:"login", data:JSON.stringify({username:message["username"], password: sha256(message["password"]), computerName:message["computerName"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('requestDownloadPackage', (message) => {
    if (message["target"] == randomID) {
      try {
        rimraf(message["programInstallDirectory"] + "\\data\\packages\\" + message["package"] + "\\*.*", fs, function() {});
      } catch (error) {

      }

      consoleOutput("Downloading Package...", ipc.of.world);
      commandToSend = {CMDType:"downloadPackage", data:JSON.stringify({username:message["username"], package:message["package"], version:message["version"], computerName:message["computerName"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('requestInstallPackage', (message) => {
    if (message["target"] == randomID) {
      consoleOutput("Installing Package...", ipc.of.world);
      commandToSend = {CMDType:"installPackage", data:JSON.stringify({username:message["username"], package:message["package"], version:message["version"], computerName:message["computerName"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));

      consoleOutput("Downloading Package...", ipc.of.world);
      commandToSend = {CMDType:"downloadPackage", data:JSON.stringify({username:message["username"], package:message["package"], version:message["version"], computerName:message["computerName"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('requestUninstallPackage', (message) => {
    if (message["target"] == randomID) {
      consoleOutput("Uninstalling Package " + message["package"] + "...", ipc.of.world);
      commandToSend = {CMDType:"updateSubbedPackages", data:JSON.stringify({username:message["username"], computerName:message["computerName"], subbedPackages:message["subbedPackages"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));

      try {
        rimraf(message["programInstallDirectory"] + "\\data\\packages\\" + message["package"] + "\\*.*", fs, function() {
          setTimeout(function() {
            try {
              if (fs.existsSync(message["programInstallDirectory"] + "\\data\\packages\\" + message["package"] + "\\")) {
                fs.rmdir(message["programInstallDirectory"] + "\\data\\packages\\" + message["package"] + "\\");
              }
            } catch (error) {

            }
          }, 10000);
        });
      } catch (error) {

      }

      consoleOutput(message["package"] + " uninstalled.", ipc.of.world);
    }
  });

  ipc.of.world.on('updateSubbedPackages', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"updateSubbedPackages", data:JSON.stringify({username:message["username"], computerName:message["computerName"], subbedPackages:message["subbedPackages"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('requestListOfPackages', (message) => {
    if (message["target"] == randomID) {
      consoleOutput("Downloading Package List...", ipc.of.world);
      commandToSend = {CMDType:"downloadPackageList", data:JSON.stringify({username:message["username"], computerName:message["computerName"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('checkForPackageUpdates', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"checkForPackageUpdates", data:{computerName:message["computerName"]}};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('uploadDir', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"checkForPackageUpdates", data:{computerName:message["computerName"]}};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('updatePackageDefaultVersion', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"updatePackageDefaultVersion", data:{computerName:message["computerName"], package:message["package"], newDefaultVersion:message["newDefaultVersion"]}};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('uploadNewVersion', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"uploadNewVersion", data:{computerName:message["computerName"], package:message["package"], newVersionNumber:message["newVersionNumber"]}};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));

      uploadDir(message["uploadDir"], serverInstallDir + "Data/packages/" + message["package"] + "/");
    }
  });

  ipc.of.world.on('uploadNewPackage', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"uploadNewPackage", data:{computerName:message["computerName"], package:message["package"], newVersionNumber:message["newVersionNumber"], packageDesc:message["packageDesc"]}};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));

      uploadDir(message["uploadDir"], serverInstallDir + "Data/packages/" + message["package"] + "/");
    }
  });

  ipc.of.world.on('proxyCommand', (message) => {
    if (message["target"] == randomID) {
      commandToSend =  message["command"];
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('deletePackage', (message) => {
    if (message["target"] == randomID) {
      commandToSend = {CMDType:"deletePackage", data:{computerName:message["computerName"], package:message["package"]}};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });
});

function checkHeartbeat() {
  if (lastHeartbeatTime < Date.now() - 10000) {
    app.quit()
  }

  ipc.of.world.emit('command', {type:"heartbeat", data:"ping", ID:randomID, target:hostID});
}

setInterval(checkHeartbeat, 5000);

function decryptionProgressReport(y, yMax, progressData) {
  if (progressData["windowID"] != -1) {  
    BrowserWindow.fromId(progressData["windowID"]).send("DecryptProgressReport", {y: y, yMax: yMax});
  }
}

function CarterEncrypt(data, key) {
  var newData = ""
  key = key % 2560;
  key = key*2;
  key = bigInt(key);
  var r = key.multiply(10);
  r = r.pow(key).mod(123);
  var rOrig = r;

  var y = 0;
  var x = 0;
  var yMax = data.length - 1;

  while (y <= yMax) {
    var characterInt = utf16ToDig(data.charAt(y));
    newData += intToChar(bigInt(characterInt).add(r.mod(256)).mod(256));
    
    var factor = key.add(1);
    var factor2 = r.divide(key);
    factor = factor.add(factor2);
    factor = factor.mod(250);

    r = r.multiply(factor)

    if (r >= 10000000 || r <= 0) {
      r = rOrig;
    }

    y = y + 1;
    x = x + 1;
  }

  return newData;
}

function CarterDecrypt(data, key) {
  var newData = ""
  key = key % 2560;
  key = key*2;
  key = bigInt(key);
  var r = key.multiply(10);
  r = r.pow(key).mod(123);
  var rOrig = r;

  var y = 0;
  var x = 0;
  var yMax = data.length - 1;

  while (y <= yMax) {
    var oldVal = bigInt(utf16ToDig(data[y]));
    oldVal = oldVal.minus(r.mod(bigInt(256)));
    oldVal = Number(oldVal.toString());

    if (oldVal < 0) {
      oldVal = oldVal+256;
    }

    newData = newData + intToChar(oldVal);
  
    var factor = key.add(1);
    var factor2 = r.divide(key);
    factor = factor.add(factor2);
    factor = factor.mod(250);

    r = r.multiply(factor)
    if (r >= 10000000 || r <= 0) {
      r = rOrig
    }
    y = y + 1;
    x = x + 1;
  }

  return newData;
}

function CarterEncryptWrapperOLD(data, key) {
  queue = "";
  output = "";

  i = 0
  while (i < data.length) {
    queue += data.charAt(0);
    data = data.substr(1);

    if (queue.length == 4 || data.length == 0) {
      output += CarterEncrypt(queue, key);
      queue = "";
    }
  }

  return output;
}

function constructPacket(type, payload, addEndStatement, LPWIndex, LPWLen) {
  var packet = {"packetType":type, "payload":payload};
  if (type == "__LPW__") {
    packet["index"] = LPWIndex;
    packet["len"] = LPWLen;
  }
  packet = JSON.stringify(packet);
  if (addEndStatement == undefined || addEndStatement == "default") {
    addEndStatement = true;
  }

  if (addEndStatement) {
    packet = packet + "-ENDACROFTPPACKET-/";
  }
  return packet;
}

function streamToPacketParser(data, alreadyDecrypted) {
  data = data.toString();
  if (partiallyReceivedPacket.length > 0) {
    data = partiallyReceivedPacket + data;
    partiallyReceivedPacket = "";
  }

  while (data.indexOf("-ENDACROFTPPACKET-/") !== -1) {
    firstPacket = data.substring(0, data.indexOf("-ENDACROFTPPACKET-/"));
    packetReceiveHander(firstPacket, alreadyDecrypted);
    data = data.substring(data.indexOf("-ENDACROFTPPACKET-/") + 19, data.length);
  }

  if (data.length > 0) {
    partiallyReceivedPacket = data;
  }
}

function packetReceiveHander(data, alreadyDecrypted) {
  var packet = JSON.parse(data.toString());
  if (packet["packetType"] == "__DAT__") {
    var rawBinary = stringToBytes(packet["payload"]);
    var dataID = rawBinary[0] * 256 + rawBinary[1];
    var dataIDFirstByte = rawBinary[0];
    var dataIDSecondByte = rawBinary[1];
    rawBinary = rawBinary.splice(2,rawBinary.length - 2);
    var dataLength = rawBinary[0];
    rawBinary = rawBinary.splice(1,rawBinary.length-1);

    if (dataIDFirstByte == 0) {
      keyExchangeInts.push(convertCharListToInt(rawBinary));
      if (keyExchangeInts.length == 3) {
        if (keyExchangeInts[0] >= keyExchangeInts[1]) {
          keyExchangeLargerPrime = keyExchangeInts[0];
          keyExchangeSmallerPrime = keyExchangeInts[1];
        } else {
          keyExchangeLargerPrime = keyExchangeInts[1];
          keyExchangeSmallerPrime = keyExchangeInts[0];
        }
        theirMixed = keyExchangeInts[2];

        var g = keyExchangeSmallerPrime;
        var p = keyExchangeLargerPrime;
        var secret = Math.floor(Math.random()*48) + 2;
        var mixedNumber = bigInt(g).pow(secret).mod(p);

        
        client.write(constructPacket("__DAT__", intToChar(0) + intToChar(3) + intToRawBin(mixedNumber)));

        key = bigInt(theirMixed).pow(secret).mod(p);
        keyExchangeComplete();
      }
    }

  } else if (packet["packetType"] == "__RAW__") {

  } else if (packet["packetType"] == "__CMD__") {
    var keyArray = key.toArray(10)["value"];

    if (alreadyDecrypted) {
      decryptedPacketData = packet["payload"];
    } else {
      decryptedPacketData = CarterDecrypt(packet["payload"], key);
    }

    command = JSON.parse(decryptedPacketData);

    if (command["CMDType"] == "packageDownloadComplete") {
      ipc.of.world.emit('command', {type:"packageDownloadComplete", data:command["payload"]["package"], ID:randomID, target:hostID})
      consoleOutput(command["payload"]["package"] + " installation Complete!", ipc.of.world);
    }

    else if (command["CMDType"] == "avaliablePackages") {
      ipc.of.world.emit('command', {type:"avaliablePackages", data:command["data"], ID:randomID, target:hostID});
    }

    else if (command["CMDType"] == "avaliablePackageUpdates") {
      ipc.of.world.emit('command', {type:"avaliablePackageUpdates", data:command["data"], ID:randomID, target:hostID});
    }

    else if (command["CMDType"] == "updateMOTD") {
      MOTD = command["data"];
      console.log("New MOTD: ");
      console.log(MOTD);
      console.log(" ");
    }

    else if (command["CMDType"] == "installationDir") {
      serverInstallDir = command["data"];
      consoleOutput("Server installation Directory: " + serverInstallDir, ipc.of.world);
    }

    else if (command["CMDType"] == "AuthResult") {
      ipc.of.world.emit('command', {type:"loginResult", data:command["data"], ID:randomID, target:hostID});
      if (command["data"] == true) {
        console.log("Login Successful!");

        //commandToSend = {CMDType:"requestMOTD"};
        //dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
        //client.write(constructPacket("__CMD__",dataToSend));

        commandToSend = {CMDType:"requestInstallationDir"};
        dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
        client.write(constructPacket("__CMD__",dataToSend));


        //ploadDir("Z:\\Files\\Projects\\ACRONYM Name Plate\\")
        

        //commandToSend = {CMDType:"downloadDir", data:{filePath:"C:/Users/Jordan/Pictures/Photography"}};
        //dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
        //client.write(constructPacket("__CMD__",dataToSend));
      } else {
        console.log("Login Failed!");
      }
    }
    else if (command["CMDType"] == "updateFiles") {
      dataToSend = {currentDir: command["data"]["path"], files: command["data"]["files"]};
      if (command["data"]["window"] != -1) {
        BrowserWindow.fromId(command["data"]["window"]).send('FileList', JSON.stringify(dataToSend));
      }
    }

    else if (command["CMDType"] == "downloadFile") {
      data = command["payload"]["file"]
      data = Buffer.from(data, 'base64');
      fs.writeFile("Z:/AcroFTPClient/" + command["payload"]["fileName"], data, (err) => {
        if (err) throw err;
      });
    }

    else if (command["CMDType"] == "downloadFileChunk") {
      packet = command["payload"];
      packetData = Buffer.from(packet["file"], "base64");

      //consoleOutput(JSON.stringify(packet), ipc.of.world);
      if (packet["filePathModifier"] == undefined) {
        filePathModifier = "";
      } else {
        if (packet["filePathModifier"] == "NONE") {

        } else {
          filePathModifier = packet["filePathModifier"];
        }
      }
      var writeDir = "Z:/AcroFTPClient/" + filePathModifier + packet["fileName"];

      if ((!dirChainExists(path.dirname("Z:/AcroFTPClient/" + filePathModifier)))) {
        mkDirChain(path.dirname("Z:/AcroFTPClient/" + filePathModifier));
      }

      var indexToCompare = -1;
      if (fileWriteQueue[writeDir] == undefined) {
        indexToCompare = 0;
      } else {
        indexToCompare = fileWriteQueue[writeDir]["packetIndex"];
      }

      if (packet["packetIndex"] == indexToCompare)  {
        writeFileChunk(packetData, writeDir);
      } else {
        writeFileChunk(packetData, writeDir, false);
        fileWriteQueue[writeDir]["outOfOrderPackets"][packet["packetIndex"]] = packetData;
      }

      var hasFoundMissingPacket = false;
      for (var i = packet["packetIndex"] + 1; i <= packet["packetIndex"] + 5; i++) {
        if (fileWriteQueue[writeDir] != null) {
          if (fileWriteQueue[writeDir]["outOfOrderPackets"][i] != undefined) {
            if (hasFoundMissingPacket == false) {
              writeFileChunk(fileWriteQueue[writeDir]["outOfOrderPackets"][i], writeDir);
            }
          } else {
            hasFoundMissingPacket = true;
          }
        }
      }
  }

  else if (command["CMDType"] == "fileTransferProgressReport" && command["data"]["windowID"] != -1) {
      BrowserWindow.fromId(command["data"]["windowID"]).send("EncryptionProgressReport", command["data"]);
    }

    else if (command["CMDType"] == "fileTransferComplete") {
      consoleOutput("FileTransferComplete", ipc.of.world);
      packet = command["payload"];
      if (packet["filePathModifier"] == undefined) {
        filePathModifier = "";
      } else {
        filePathModifier = packet["filePathModifier"];
      }
      var writeDir = "Z:/AcroFTPClient/" + filePathModifier + packet["fileName"];

      if (fileWriteQueue[writeDir] == undefined) {
        writeFileChunk("NOTHING", writeDir, false);
      }
      if (fileWriteQueue[writeDir]["packetIndex"] == packet["finalPacketIndex"] + 1) {
        consoleOutput("File Transfer Complete, all packest received", ipc.of.world);
        var elapsedTime = Date.now() - fileWriteQueue[writeDir]["startTime"];
        consoleOutput("File Transfer of " + packet["fileName"] + " Complete! It took " + elapsedTime + " Milliseconds.", ipc.of.world);
        setTimeout(fileWriteCallback(writeDir), 5000);
      } else {
        fileWriteQueue[writeDir]["hasServerSentEndPacket"] = true;
        fileWriteQueue[writeDir]["finalPacketIndex"] = packet["finalPacketIndex"];
      }
    }

    else {
      ipc.of.world.emit('command', {type:"unknownCommand", data:command, ID:randomID, target:hostID});
    }

  } else if (packet["packetType"] == "__HDS__") {
    client.write(constructPacket("__HDS__", packet["payload"]));
    consoleOutput("Server sent handshake, responding with " + packet["payload"], ipc.of.world);

  } else if (packet["packetType"] == "__LPW__") {
    LPWPacket = packet["payload"];
    if (partialLPWPackets[packet["LPWID"]] == undefined) {
      partialLPWPackets[packet["LPWID"]] = {};
      partialLPWPackets[packet["LPWID"]]["data"] = "";
    }
    partialLPWPackets[packet["LPWID"]]["data"] += LPWPacket;

    if ((packet["ind"] / 10000 - Math.floor(packet["ind"] / 10000)) == 0) {
    }

    if (packet["windowID"] != null && packet["windowID"] != -1) {
      if ((packet["ind"] / 1000 - Math.floor(packet["ind"] / 1000)) == 0) {
        BrowserWindow.fromId(packet["windowID"]).send("TransferProgressReport", {index: packet["ind"], length: packet["len"]});
      }
    }
    
    if (packet["ind"] == packet["len"]) {
      if (packet["windowID"] != null && packet["windowID"] != -1) {
        BrowserWindow.fromId(packet["windowID"]).send("TransferProgressReport", {index: packet["ind"], length: packet["len"]});
      }
      if (packet["windowID"] != null) {
        createDecryptionThread(JSON.parse(partialLPWPackets[packet["LPWID"]]["data"])["payload"], key, "command", "Hi", {windowID: packet["windowID"]});
      } else {
        createDecryptionThread(JSON.parse(partialLPWPackets[packet["LPWID"]]["data"])["payload"], key, "command", "none");
      }
      
      partialLPWPackets[packet["LPWID"]] = null;
    }
  }
}

function sendLPWPacket(data) {
  var LPWPacketLength = 700;
  if (true) {
    index = 0;
    var hrTime = process.hrtime()
    var LPWID = hrTime[0] * 1000000 + hrTime[1] / 1000;
    var dataIndex = 0;
    var numLPWPackets = Math.ceil(data.length/LPWPacketLength);

    while (data.length > 0) {
      LPWPayload = data.slice(0, LPWPacketLength)
      if (data.length <= LPWPacketLength) {
        LPWPacketLength = data.length
        numLPWPackets = index + 1
        LPWPayload = data
      }
      commandToSend = {LPWPayload:LPWPayload, index:index, LPWID:LPWID, len:numLPWPackets};
      dataToSend = JSON.stringify(commandToSend);
      client.write(constructPacket("__LPW__", dataToSend, true, index, numLPWPackets));

      dataIndex = dataIndex + LPWPacketLength;
      data = data.slice(LPWPacketLength, data.length);

      index = index + 1
    }
  } else {

    index = 0;
    var hrTime = process.hrtime()
    var LPWID = hrTime[0] * 1000000 + hrTime[1] / 1000;
    var dataIndex = 0;
    var LPWPacketLength = 300;
    var numLPWPackets = Math.ceil(data.length/LPWPacketLength);

    LPWPayload = data;
    commandToSend = {LPWPayload:LPWPayload, index:index, LPWID:LPWID, len:numLPWPackets};
    dataToSend = JSON.stringify(commandToSend);
    client.write(constructPacket("__LPW__",dataToSend));
  }
}

function mkDirChain(filePath) {
  try {
    fs.mkdirSync(filePath)
  } catch (e) {
    try {
    mkDirChain(path.dirname(filePath).split(path.sep).pop())
    fs.mkdirSync(filePath)
    } catch (e) {
    }
  }
}

function dirChainExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

function writeCallback() {

}

function fileWriteCallback(filePath) {
  fileWriteQueue[filePath]["writeStream"].close()
  fileWriteQueue[filePath] = null;
}

function writeFileChunk(data, filePath, shouldWrite) {
  if (shouldWrite == undefined) {
    shouldWrite = true;
  }
  if ((!dirChainExists(path.dirname(filePath)))) {
    mkDirChain(path.dirname(filePath));
  }

  data = Buffer.from(data, 'utf8');
  if (fileWriteQueue[filePath] == undefined) {
    //fs.writeFile(filePath, data, writeCallback);
    stream = fs.createWriteStream(filePath, {flags:'a'});
    fileWriteQueue[filePath] = {writeStream: stream, packetIndex:0, outOfOrderPackets:{}, startTime: Date.now()}
    if (shouldWrite) {
      fileWriteQueue[filePath]["writeStream"].write(data, writeCallback);
      fileWriteQueue[filePath]["packetIndex"] += 1;
    }
  } else {
    if (shouldWrite) {
      fileWriteQueue[filePath]["writeStream"].write(data, writeCallback);
      fileWriteQueue[filePath]["packetIndex"] += 1;
    }
  }

  if (fileWriteQueue[filePath]["hasServerSentEndPacket"] && fileWriteQueue[filePath]["packetIndex"] > fileWriteQueue[filePath]["finalPacketIndex"]) {
    var elapsedTime = Date.now() - fileWriteQueue[filePath]["startTime"];
    consoleOutput("Received Last Packet, File Transfer Complete", ipc.of.world);
    consoleOutput("File Transfer of " + filePath + " Complete! It took " + elapsedTime + " Milliseconds.", ipc.of.world);
    setTimeout(function() {fileWriteCallback(filePath)}, 5000);
  }
  
}

function uploadFile(filePath, uploadPath, windowID) {
  fs.open(filePath, 'r', (err, fd) => {
    var totalBytesRead = 0;
    var index = 0;
    var fileSize = fs.statSync(filePath).size;
    var readChunkSize = 1500000;
    var filePosition = 0;
    var sizeExcludingFinalPacket = Math.floor(fileSize/readChunkSize);
    bufferSize = readChunkSize;
    fs.closeSync(fd);
    setTimeout(function() {uploadFileChunk(fileSize, totalBytesRead, readChunkSize, index, bufferSize, uploadPath, windowID, filePath, filePosition);}, 2000);

    
  });

}

function uploadDir(dir, serverWriteDir, windowID) {
  if (serverWriteDir != undefined) {
    dirToWrite = serverWriteDir;
  } else {
    dirToWrite = serverInstallDir;
  }

  files = readDir(dir).then(
    function(files) {
      consoleOutput("Uploading Directory: " + dir, ipc.of.world);
      consoleOutput(JSON.stringify(files), ipc.of.world);
      for (var i = 0; i < files.length; i++) {
        consoleOutput("Uploading " + dirToWrite + path.basename(dir) + "\\" + path.basename(files[i]) + " \n baseDir: " + path.basename(dir) + "\n", ipc.of.world);
        uploadFile(files[i],  dirToWrite + path.basename(dir) + "\\" + path.basename(files[i]));
      }
  });
}


function uploadFileChunk(fileSize, totalBytesRead, readChunkSize, index, bufferSize, uploadPath, windowID, filePath, filePosition) {
  fs.open(filePath, 'r', (err, fd) => {
    bufferSize = readChunkSize;
    if (fileSize - totalBytesRead < readChunkSize) {
      bufferSize = fileSize - totalBytesRead;
    }
    
    var fileReadBuffer = Buffer.alloc(bufferSize);
    var bytesRead = fs.readSync(fd, fileReadBuffer, 0, bufferSize, filePosition);
    filePosition += bufferSize;
    

    commandToSend = {CMDType:"uploadFile", data:{filePath:uploadPath, index:index, file:fileReadBuffer.toString("base64")}};
    dataToSend = JSON.stringify(commandToSend);

    dataToSend = CarterEncrypt(dataToSend, key);

    var packetToSend = constructPacket("__CMD__", dataToSend, false);
    sendLPWPacket(packetToSend);

    totalBytesRead = totalBytesRead + bytesRead;
    if (windowID != -1) {
      if (windowID != undefined) {
        BrowserWindow.fromId(windowID).send("EncryptionProgressReport", {y:totalBytesRead, yMax:fileSize});
      }
    }

    index = index + 1;

    fs.closeSync(fd);
    if (fileSize - (totalBytesRead+1) > 0) {
      setTimeout(function() {uploadFileChunk(fileSize, totalBytesRead, readChunkSize, index, bufferSize, uploadPath, windowID, filePath, filePosition);}, 500);
    } else {
      setTimeout(function() { uploadFinishedCallback(uploadPath, index, windowID, totalBytesRead, fileSize, bytesRead); },2000);
    }
  });
}


function uploadFinishedCallback(uploadPath, index, windowID, totalBytesRead, fileSize, bytesRead) {
  commandToSend = {CMDType:"uploadFileFinish", data:{filePath:uploadPath, finalPacketIndex:index}};
  dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
  client.write(constructPacket("__CMD__",dataToSend));
  totalBytesRead = totalBytesRead + bytesRead;
  if (windowID != -1) {
    if (windowID != undefined) {
      BrowserWindow.fromId(windowID).send("EncryptionProgressReport", {y:totalBytesRead, yMax:fileSize});
    }
  }
}

function createDecryptionThread(data, key, inputType, progressFunction, progressData, filePathToWrite) {
  DecryptWindows.push(new BrowserWindow({width: 400, height: 400, frame: false, show: false}));
  id = DecryptWindows.length - 1;

  // Open the DevTools.
  DecryptWindows[id].webContents.openDevTools()

  DecryptWindows[id].loadFile('decrypt.html')

  DecryptWindows[id].on('closed', () => {
    DecryptWindows[id] = null

  });

  if (filePathToWrite == undefined) {
    filePathToWrite = "none";
  }

  queuedDecryptionJobs.push({data: data, key: key, inputType: inputType, progressFunction: progressFunction, progressData: progressData, filePathToWrite});
}

ipcMain.on('decryptionFinished', (event, arg) => {
  if (arg["inputType"] == "command") {
    packetReceiveHander(JSON.stringify({packetType:"__CMD__", payload:arg["output"]}), true);
  } else if (arg["inputType"] == "fileChunk") {
    writeFileChunk(arg["output"], arg["filePathToWrite"]);
  }
})

ipcMain.on('decryptionProgressReport', (event, arg) => {
  decryptionProgressReport(arg["y"], arg["yMax"], arg["progressData"])
})

ipcMain.on('requestTextToDecrypt', (event, arg) => {
  event.sender.send("textToDecrypt", queuedDecryptionJobs[0]);
  queuedDecryptionJobs.splice(0,1);
})




function convertCharListToInt(charList) {
  var result = 0;
  for (var i = 0; i < charList.length; i++) {
    result *= 256;
    result += charList[i];
  }

  return result;
}

function stringToBytes(str) {
  var ch, st, re = [];
  for (var i = 0; i < str.length; i++ ) {
	ch = str.charCodeAt(i);  // get char 
	st = [];                 // set up "stack"
	do {
	  st.push( ch & 0xFF );  // push byte to stack
	  ch = ch >> 8;          // shift value down by 1 byte
	}  
	while ( ch );
	// add stack contents to result
	// done because chars have "wrong" endianness
	re = re.concat( st.reverse() );
  }
  // return an array of bytes
  return re;
}

function intToChar(integer) {
  return String.fromCharCode(integer)
}

function charToInt(char) {
  return char.charCodeAt(0)
}

var utf16ToDig = function(s) {
  var length = s.length;
  var index = -1;
  var result = "";
  var hex;
  while (++index < length) {
      hex = s.charCodeAt(index).toString(16).toUpperCase();
      result += ('0000' + hex).slice(-4);
  }
  return parseInt(result, 16);
}

function intToRawBin(int) {
  num = Math.ceil(logCustomBase(int, 256));

  data = intToChar(num);

  for (i = num; i >= 0; i--) {
    var current = Math.floor(Math.floor(int/(Math.pow(256,i)))%256)

    data += intToChar(current);
  }

  return data;
}

function logCustomBase(num, logBase) {
  return Math.log(num)/Math.log(logBase);
}

var net = require('net');

var client = new net.Socket();
client.connect(ServerPort, ServerIP, function() {
  console.log('Connected');
});

client.on('data', streamToPacketParser);

function keyExchangeComplete() {
  
}



app.on('ready', function() {
  keepAliveWin = new BrowserWindow({width: 10, height: 10, frame: false, show: false});
})