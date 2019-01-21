const {app, BrowserWindow, dialog, ipcMain} = require('electron')
var seedrandom = require('seedrandom');
var fs = require('fs');
var bigInt = require("big-integer");
var aesjs = require("aes-js");
var path = require("path");
var latestMinecraftData = {};
var keyExchangeInts = [];
var keyExchangeLargerPrime = 0;
var keyExchangeSmallerPrime = 0;
var key = bigInt(0);
var theirMixed = 0;
//var ServerIP = "172.25.76.132";
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

const ipc = require('node-ipc');

function consoleOutput(data, ipcHost) {
  ipcHost.emit('command', {type:"printToConsole", data: data, ID:randomID, target:hostID})
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
      consoleOutput("Loging In...", ipc.of.world);
      commandToSend = {CMDType:"login", data:JSON.stringify({username:message["username"], password:message["password"], computerName:message["computerName"]})};
      dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
    }
  });

  ipc.of.world.on('requestDownloadPackage', (message) => {
    if (message["target"] == randomID) {
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

function constructPacket(type, payload, addEndStatement) {
  var packet = {"packetType":type, "payload":payload};
  packet = JSON.stringify(packet);
  if (addEndStatement == undefined) {
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

    if (command["CMDType"] == "avaliablePackages") {
      ipc.of.world.emit('command', {type:"avaliablePackages", data:command["data"], ID:randomID, target:hostID});
    }

    if (command["CMDType"] == "avaliablePackageUpdates") {
      ipc.of.world.emit('command', {type:"avaliablePackageUpdates", data:command["data"], ID:randomID, target:hostID});
    }

    if (command["CMDType"] == "updateMOTD") {
      MOTD = command["data"];
      console.log("New MOTD: ");
      console.log(MOTD);
      console.log(" ");
    }

    if (command["CMDType"] == "AuthResult") {
      ipc.of.world.emit('command', {type:"loginResult", data:command["data"], ID:randomID, target:hostID});
      if (command["data"] == true) {
        console.log("Login Successful!");

        //commandToSend = {CMDType:"requestMOTD"};
        //dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
        //client.write(constructPacket("__CMD__",dataToSend));

        

        //commandToSend = {CMDType:"downloadDir", data:{filePath:"C:/Users/Jordan/Pictures/Photography"}};
        //dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
        //client.write(constructPacket("__CMD__",dataToSend));
      } else {
        console.log("Login Failed!");
      }
    }
     if (command["CMDType"] == "updateFiles") {
      dataToSend = {currentDir: command["data"]["path"], files: command["data"]["files"]};
      if (command["data"]["window"] != -1) {
        BrowserWindow.fromId(command["data"]["window"]).send('FileList', JSON.stringify(dataToSend));
      }
    }

    if (command["CMDType"] == "downloadFile") {
      data = command["payload"]["file"]
      data = Buffer.from(data, 'base64');
      fs.writeFile("Z:/AcroFTPClient/" + command["payload"]["fileName"], data, (err) => {
        if (err) throw err;
      });
    }

    if (command["CMDType"] == "downloadFileChunk") {
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

    if (command["CMDType"] == "fileTransferProgressReport" && command["data"]["windowID"] != -1) {
      BrowserWindow.fromId(command["data"]["windowID"]).send("EncryptionProgressReport", command["data"]);
    }

    if (command["CMDType"] == "fileTransferComplete") {
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
        var elapsedTime = Date.now() - fileWriteQueue[writeDir]["startTime"];
        consoleOutput("File Transfer of " + packet["fileName"] + " Complete! It took " + elapsedTime + " Milliseconds.", ipc.of.world);
        setTimeout(fileWriteCallback(writeDir), 5000);
      } else {
        fileWriteQueue[writeDir]["hasServerSentEndPacket"] = true;
        fileWriteQueue[writeDir]["finalPacketIndex"] = packet["finalPacketIndex"];
      }
    }

  } else if (packet["packetType"] == "__HDS__") {
    client.write(constructPacket("__HDS__", packet["payload"]));

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
      client.write(constructPacket("__LPW__",dataToSend));

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

  if (fileWriteQueue[filePath]["hasServerSentEndPacket"] && fileWriteQueue[filePath]["packetIndex"] >= fileWriteQueue[filePath]["finalPacketIndex"]) {
    var elapsedTime = Date.now() - fileWriteQueue[filePath]["startTime"];
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
      BrowserWindow.fromId(windowID).send("EncryptionProgressReport", {y:totalBytesRead, yMax:fileSize});
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
    BrowserWindow.fromId(windowID).send("EncryptionProgressReport", {y:totalBytesRead, yMax:fileSize});
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