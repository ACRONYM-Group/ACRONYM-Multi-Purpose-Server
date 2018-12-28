const {app, BrowserWindow, dialog, ipcMain} = require('electron')
var seedrandom = require('seedrandom');
var fs = require('fs');
var bigInt = require("big-integer");
var aesjs = require("aes-js");
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

const ipc = require('node-ipc');

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
      }
     }
  });

  ipc.of.world.on('heartbeat', (message) => {
    if (message["target"] == randomID) {
      console.log("Heartbeat!");
      lastHeartbeatTime = Date.now()
    }
  });

  ipc.of.world.on('endProccess', (message) => {
    if (message["target"] == randomID) {
      console.log("Ending Proccess!");
      console.log(app.quit());
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
    var oldVal = bigInt(utf16ToDig(data.charAt(y)));
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
    packet = packet + "\-ENDACROFTPPACKET-/";
  }
  return packet;
}

function streamToPacketParser(data, alreadyDecrypted) {
  data = data.toString();
  if (partiallyReceivedPacket.length > 0) {
    data = partiallyReceivedPacket + data;
    partiallyReceivedPacket = "";
  }

  while (data.indexOf("\-ENDACROFTPPACKET-/") !== -1) {
    firstPacket = data.substring(0, data.indexOf("\-ENDACROFTPPACKET-/") - 1);
    packetReceiveHander(firstPacket, alreadyDecrypted);
    data = data.substring(data.indexOf("\-ENDACROFTPPACKET-/") + 19, data.length);
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

    if (command["CMDType"] == "updateMOTD") {
      MOTD = command["data"];
      console.log("New MOTD: ");
      console.log(MOTD);
      console.log(" ");

      //uploadFile("Z:/AcroFTPClient/Gale Crater.png", "Z:/AcroFTP/Gale Crater.png", -1);

      //console.log("Client is sending file upload requset at: " + Date.now())

      //commandToSend = {CMDType:"downloadFile", data:{windowID:-1, filePath:"Z:/AcroFTP/Earth.jpg"}}
      //dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
      //client.write(constructPacket("__CMD__",dataToSend));

      //console.log("Client is sending file download requset at: " + Date.now())
    }

    if (command["CMDType"] == "AuthResult") {
      if (command["data"] == true) {
        console.log("Login Successful!");

        commandToSend = {CMDType:"requestMOTD"};
        dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
        client.write(constructPacket("__CMD__",dataToSend));
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

      var indexToCompare = -1;
      if (fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]] == undefined) {
        indexToCompare = 0;
      } else {
        indexToCompare = fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["packetIndex"];
      }

      if (packet["packetIndex"] == indexToCompare)  {
        writeFileChunk(packetData, "Z:/AcroFTPClient/" + packet["fileName"]);
      } else {
        fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["outOfOrderPackets"][packet["packetIndex"]] = packetData;
      }

      var hasFoundMissingPacket = false;
      for (var i = packet["packetIndex"] + 1; i <= packet["packetIndex"] + 5; i++) {
        if (fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]] != null) {
          if (fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["outOfOrderPackets"][i] != undefined) {
            if (hasFoundMissingPacket == false) {
              writeFileChunk(fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["outOfOrderPackets"][i], "Z:/AcroFTPClient/" + packet["fileName"]);
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
      if (fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["packetIndex"] == packet["finalPacketIndex"] + 1) {
        var elapsedTime = Date.now() - fileWriteQueue["Z:/AcroFTPClient/" - packet["fileName"]]["startTime"];
        console.log("File Transfer of " + packet["fileName"] + " Complete! It took " + elapsedTime + " Milliseconds.");
        fileWriteQueue["Z:/AcroFTPClient/" - packet["fileName"]] = null;
      } else {
        fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["hasServerSentEndPacket"] = true;
        fileWriteQueue["Z:/AcroFTPClient/" + packet["fileName"]]["finalPacketIndex"] = packet["finalPacketIndex"];
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

function writeCallback() {
  
}

function writeFileChunk(data, filePath) {
  data = Buffer.from(data, 'utf8');
  if (fileWriteQueue[filePath] == undefined) {
    //fs.writeFile(filePath, data, writeCallback);
    stream = fs.createWriteStream(filePath, {flags:'a'});
    fileWriteQueue[filePath] = {writeStream: stream, packetIndex:0, outOfOrderPackets:{}, startTime: Date.now()}
    fileWriteQueue[filePath]["writeStream"].write(data, writeCallback);
    fileWriteQueue[filePath]["packetIndex"] += 1;
  } else {
    fileWriteQueue[filePath]["writeStream"].write(data, writeCallback);
    fileWriteQueue[filePath]["packetIndex"] += 1;
  }

  if (fileWriteQueue[filePath]["hasServerSentEndPacket"] && fileWriteQueue[filePath]["packetIndex"] >= fileWriteQueue[filePath]["finalPacketIndex"]) {
    var elapsedTime = Date.now() - fileWriteQueue[filePath]["startTime"];
    console.log("File Transfer of " + filePath + " Complete! It took " + elapsedTime + " Milliseconds.");
    fileWriteQueue[filePath] = null;
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
  commandToSend = {CMDType:"login", data:JSON.stringify({username:"Jordan",password:"FSaP314"})};
  dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
  client.write(constructPacket("__CMD__",dataToSend));
}



app.on('ready', function() {
  keepAliveWin = new BrowserWindow({width: 10, height: 10, frame: false, show: false});
})