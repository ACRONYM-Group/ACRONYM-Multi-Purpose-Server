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

console.log(buffer.constants.MAX_STRING_LENGTH);

var testInt = bigInt("214325345634634");
var keyArray = testInt.toArray(10)["value"];
console.log(keyArray);

if (keyArray.length < 16) {
  for (i = keyArray.length; i < 16; i++) {
    keyArray.unshift(0);
  }
}

/*
var textToEncrypt = "Encryption is cool!";
var encryptedHex = encryptString(keyArray, 5, textToEncrypt);
console.log(" ")
console.log("The text:");
console.log(textToEncrypt);
console.log("Has been encrypted to:");
console.log(encryptedHex);
console.log(" ");
console.log("The hex decrypts to:")
var decryptedString = decryptString(keyArray, 5, encryptedHex);
console.log(decryptedString);
console.log(" ");
*/

console.log("!!!!!!!!!!!!!!!!!!!");
console.log(intToChar(205))
console.log(intToChar(205).length)

function decryptionProgressReport(y, yMax, progressData) {
  BrowserWindow.fromId(progressData["windowID"]).send("DecryptProgressReport", {y: y, yMax: yMax});
}

function encryptString(keyArray, counterInt, string) {
  var textBytes = aesjs.utils.utf8.toBytes(string);

  var aesCtr = new aesjs.ModeOfOperation.ctr(keyArray, new aesjs.Counter(counterInt));
  var encryptedBytes = aesCtr.encrypt(textBytes);

  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

function decryptString(keyArray, counterInt, string) {
  var encryptedBytes = aesjs.utils.hex.toBytes(string);
  var aesCtr = new aesjs.ModeOfOperation.ctr(keyArray, new aesjs.Counter(counterInt));
  var decryptedString = aesCtr.decrypt(encryptedBytes);
  
  return aesjs.utils.utf8.fromBytes(decryptedString);
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

function CarterEncryptWrapper(data, key) {
  return CarterEncrypt(data, key);
}

function CarterDecryptWrapperOLD(data, key) {
  queue = "";
  output = "";

  i = 0
  while (i < data.length) {
    queue += data.charAt(0);
    data = data.substr(1);

    if (queue.length == 4 || data.length == 0) {
      output += CarterDecrypt(queue, key);
      queue = "";
    }
  }

  return output;
}

function CarterDecryptWrapper(data, key) {
  return CarterDecrypt(data, key);
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
  //console.log("  ");
  //console.log("  ");
  //console.log("--------------");
  //console.log(data);
  if (partiallyReceivedPacket.length > 0) {
    data = partiallyReceivedPacket + data;
    partiallyReceivedPacket = "";
  }

  while (data.indexOf("\-ENDACROFTPPACKET-/") !== -1) {
    //console.log(data); 
    firstPacket = data.substring(0, data.indexOf("\-ENDACROFTPPACKET-/") - 1);
    //console.log("Parsing Stream to: ")
    //console.log(firstPacket);
    packetReceiveHander(firstPacket, alreadyDecrypted);
    data = data.substring(data.indexOf("\-ENDACROFTPPACKET-/") + 19, data.length);

    //console.log("------");
    //console.log(" ");
    //console.log("Remaining Data to Parse: ");
    //console.log(data);
  }

  if (data.length > 0) {
    partiallyReceivedPacket = data;
  }
}

function packetReceiveHander(data, alreadyDecrypted) {
  //var dataArr = data.split('')
  //console.log(" ");
  //console.log('Received: ');
  //for (var i = 0; i < data.length; i++) {
  //  console.log(charToInt(dataArr[i]))
  //}
  //console.log(data.toString());


  

  var packet = JSON.parse(data.toString());
  if (packet["packetType"] == "__DAT__") {
    var rawBinary = stringToBytes(packet["payload"]);
    //console.log(rawBinary[0].toString());
    //console.log(rawBinary[1].toString());
    //console.log(rawBinary[2].toString());
    //console.log(rawBinary[3].toString());

    console.log("Whole Binary received:");
    console.log(rawBinary);
    var dataID = rawBinary[0] * 256 + rawBinary[1];
    var dataIDFirstByte = rawBinary[0];
    var dataIDSecondByte = rawBinary[1];
    console.log("Server wants talk about raw Data ID " + dataID);
    rawBinary = rawBinary.splice(2,rawBinary.length - 2);
    console.log("Whole Binary Minus DataID received:");
    console.log(rawBinary);
    var dataLength = rawBinary[0];
    console.log("Server is sending " + dataLength + " Bytes");
    rawBinary = rawBinary.splice(1,rawBinary.length-1);
    console.log("Binary Data received:");
    console.log(rawBinary);
    console.log("Received Integer: " + convertCharListToInt(rawBinary));

    if (dataIDFirstByte == 0) {
      console.log("-----");
      console.log("Message is Key Exchange");
      console.log("Key exchange step: " + dataIDSecondByte);
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

        console.log("Larger Prime is: " + keyExchangeLargerPrime);
        console.log("Smaller Prime is: " + keyExchangeSmallerPrime);
        console.log("Their Mixed Number: " + theirMixed);

        var g = keyExchangeSmallerPrime;
        var p = keyExchangeLargerPrime;
        var secret = Math.floor(Math.random()*48) + 2;
        console.log("My Secret Number: " + secret);
        var mixedNumber = bigInt(g).pow(secret).mod(p);

        console.log("My Mixed Number: " + mixedNumber);

        
        client.write(constructPacket("__DAT__", intToChar(0) + intToChar(3) + intToRawBin(mixedNumber)));

        key = bigInt(theirMixed).pow(secret).mod(p);
        console.log("Got key: " + key);
      }
    }

  } else if (packet["packetType"] == "__RAW__") {

  } else if (packet["packetType"] == "__CMD__") {
    console.log("Got Command!");
    var keyArray = key.toArray(10)["value"];

    if (alreadyDecrypted) {
      decryptedPacketData = packet["payload"];
    } else {
      decryptedPacketData = CarterDecryptWrapper(packet["payload"], key);
    }
    
    //console.log("Decrypted Command:");
    //console.log(decryptedPacketData);

    command = JSON.parse(decryptedPacketData);

    if (command["CMDType"] == "updateMOTD") {
      MOTD = command["data"];
    }

    if (command["CMDType"] == "AuthResult") {
      if (command["data"] == true) {
        loginWin.loadFile('blank.html');
        pageToLoad = "index.html";
        loginWin.setSize(1280, 600);
        loginWin.center();

        commandToSend = {CMDType:"requestMOTD"};
        dataToSend = CarterEncryptWrapper(JSON.stringify(commandToSend), key);
        client.write(constructPacket("__CMD__",dataToSend));
      } else {
        console.log("Authentication Result: " + command["data"]);
        displayLoginError("Authentication Failed!", loginButtonPushEvent);
      }
    }
     if (command["CMDType"] == "updateFiles") {
      dataToSend = {currentDir: command["data"]["path"], files: command["data"]["files"]};
      BrowserWindow.fromId(command["data"]["window"]).send('FileList', JSON.stringify(dataToSend));
      console.log("Displaying new Directory...");
    }

    if (command["CMDType"] == "downloadFile") {
      console.log("Server is sending file.")
      data = command["payload"]["file"]
      data = Buffer.from(data, 'base64');
      fs.writeFile("Z:/AcroFTPClient/" + command["payload"]["fileName"], data, (err) => {
        if (err) throw err;
        console.log('The file has been saved at ' + Date.now() + '!');
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

    if (command["CMDType"] == "fileTransferProgressReport") {
      console.log("Server File Transfer Encryption Progress: " + (command["data"]["y"] / command["data"]["yMax"] * 100) + "%");
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
      console.log("Receiving LPW Packet - " + packet["ind"] + "/" + packet["len"] + "- ID" + packet["LPWID"]);
    }

    if (packet["windowID"] != null) {
      if ((packet["ind"] / 1000 - Math.floor(packet["ind"] / 1000)) == 0) {
        BrowserWindow.fromId(packet["windowID"]).send("TransferProgressReport", {index: packet["ind"], length: packet["len"]});
      }
    }
    
    if (packet["ind"] == packet["len"]) {
      //console.log("-------------");
      //console.log("ID" + packet["LPWID"]);
      //console.log(partialLPWPackets[packet["LPWID"]]["data"])
      //console.log("-------------");
      if (packet["windowID"] != null) {
        BrowserWindow.fromId(packet["windowID"]).send("TransferProgressReport", {index: packet["ind"], length: packet["len"]});
      }
      if (packet["windowID"] != null) {
        createDecryptionThread(JSON.parse(partialLPWPackets[packet["LPWID"]]["data"])["payload"], key, "command", "Hi", {windowID: packet["windowID"]});
        console.log("Window ID founding running Decryption in progress report mode");
      } else {
        createDecryptionThread(JSON.parse(partialLPWPackets[packet["LPWID"]]["data"])["payload"], key, "command", "none");
        console.log("Window ID not found, running Decryption without progress report.")
      }
      
      partialLPWPackets[packet["LPWID"]] = null;
      console.log("Finished LPW Packet ID" + packet["LPWID"] + " Receive.");
    }
  }

  //latestMinecraftData = 
}
  //console.log(Array.apply([], data).join(","));
  //client.write(data);

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
      //console.log("Sending LPW Packet!");
      //console.log(data.length);
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
  console.log("WriteFunc received " + data.length + " Bytes.");
  data = Buffer.from(data, 'utf8');
  console.log("Converted to " + data.length + " Bytes. Writing.");
  if (fileWriteQueue[filePath] == undefined) {
    //fs.writeFile(filePath, data, writeCallback);
    console.log("Writing " + data.length + " Bytes to file");
    stream = fs.createWriteStream(filePath, {flags:'a'});
    fileWriteQueue[filePath] = {writeStream: stream, packetIndex:0, outOfOrderPackets:{}, startTime: Date.now()}
    fileWriteQueue[filePath]["writeStream"].write(data, writeCallback);
    fileWriteQueue[filePath]["packetIndex"] += 1;
  } else {
    console.log("Appending " + data.length + " Bytes to file");
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

    
    /*commandToSend = {CMDType:"uploadFile", data:{filePath:uploadPath, index:index, file:fileReadBuffer.toString("base64")}};
    dataToSend = CarterEncrypt(JSON.stringify(commandToSend), key);
    var packetToSend = constructPacket("__CMD__", dataToSend, false);
    console.log(packetToSend.toString("base64"));;
    console.log(JSON.parse(packetToSend.toString("base64")))
    sendLPWPacket(packetToSend);*/

    
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
    BrowserWindow.fromId(windowID).send("EncryptionProgressReport", {y:totalBytesRead, yMax:fileSize});
    index = index + 1;
    
    console.log("attempted to read " + bufferSize + " Actually got " + bytesRead);
    console.log("File Size: " + fileSize + " Read Chunk Size: " + readChunkSize + " Total Bytes Read: " + totalBytesRead);
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
  BrowserWindow.fromId(windowID).send("EncryptionProgressReport", {y:totalBytesRead, yMax:fileSize});
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
  //console.log("Decryption Thread Finished. InputType: " + arg["inputType"]);
  //console.log("output: " + arg["output"])
  if (arg["inputType"] == "command") {
    packetReceiveHander(JSON.stringify({packetType:"__CMD__", payload:arg["output"]}), true);
  } else if (arg["inputType"] == "fileChunk") {
    console.log("Decryption has output " + arg["output"].length + " Bytes");
    writeFileChunk(arg["output"], arg["filePathToWrite"]);
  }
})

ipcMain.on('decryptionProgressReport', (event, arg) => {
  decryptionProgressReport(arg["y"], arg["yMax"], arg["progressData"])
  //console.log("Decryption Status Report!");
})

ipcMain.on('requestTextToDecrypt', (event, arg) => {
  console.log("Starting Decryption...");
  event.sender.send("textToDecrypt", queuedDecryptionJobs[0]);
  console.log("sending " + queuedDecryptionJobs[0]["data"].length + " Bytes to decryption;");
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

/*
console.log(" ")
console.log("Encryption Test Results:");
EncryptionTest = CarterEncryptWrapper("Welcome to the A.C.R.O.N.Y.M. Network.", 12345678910);
console.log(EncryptionTest);
DecryptionTest = CarterDecryptWrapper(EncryptionTest, 12345678910);
console.log(DecryptionTest);
console.log(" ")
*/

function displayLoginError(txt, event) {
  event.sender.send("displayLoginError", txt);
}

var net = require('net');

var client = new net.Socket();
client.connect(ServerPort, ServerIP, function() {
  console.log('Connected');
  //client.write(String.fromCharCode(3) + String.fromCharCode(1) + String.fromCharCode(4) + String.fromCharCode(1) + String.fromCharCode(5));
  //client.write('{"clientType": "electron"}')
});

function sendPacket(data) {
  var client = new net.Socket();
  client.connect(ServerPort, ServerIP, function() {
    //console.log('Connected');
    client.write(data);
  });

  client.on('data', streamToPacketParser);
}

client.on('data', streamToPacketParser);

  function createLoginWindow () {
    // Create the browser window.
    loginWin = new BrowserWindow({width: 400, height: 600, frame: false})

    // Open the DevTools.
    loginWin.webContents.openDevTools()

    loginWin.loadFile('blank.html')
    pageToLoad = "login.html";

    ipcMain.on('loginButtonPressed', (event, arg) => {
        console.log(arg)
        commandToSend = {CMDType:"login", data:arg}
        dataToSend = CarterEncryptWrapper(JSON.stringify(commandToSend), key);
        client.write(constructPacket("__CMD__",dataToSend));
        loginButtonPushEvent = event;

    })

    ipcMain.on('requestMinecraftServerData', (event, arg) => {
      sendPacket('{"clientType": "electron"}');
      event.sender.send("MinecraftServerData", latestMinecraftData);
    })

    ipcMain.on('requestMOTD', (event, arg) => {
      event.sender.send("updateMOTD", MOTD);
    })

    ipcMain.on('downloadFile', (event, arg) => {
      downloadWin = new BrowserWindow({width: 400, height: 100, frame: false});
      downloadWin.loadFile('download.html')
      //downloadWin.webContents.openDevTools()

      commandToSend = {CMDType:"downloadFile", data:{windowID:downloadWin.id, filePath:arg}}
      dataToSend = CarterEncryptWrapper(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));

      console.log("Client is sending file download requset at: " + Date.now())

    })

    ipcMain.on('uploadFile', (event, arg) => {
      downloadWin = new BrowserWindow({width: 400, height: 100, frame: false});
      downloadWin.loadFile('download.html')
      //downloadWin.webContents.openDevTools()

      uploadFile(arg["file"], arg["uploadDirectory"], downloadWin.id);

      console.log("Client is sending file download requset at: " + Date.now())

    })


    ipcMain.on('requestFiles', (event, arg) => {
      console.log("User Requested File Directory Data")

      var path = arg;

      commandToSend = {CMDType:"requestFiles", data:{path: path, windowID: event.sender.getOwnerBrowserWindow().id}}
      console.log(event.sender.getOwnerBrowserWindow().id);
      dataToSend = CarterEncryptWrapper(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
 
      /*
      fs.readdir(path, function(err, items) {
        for (i = 0; i < items.length; i++) {
          currentFileName = items[i]
          items[i] = {'name': currentFileName, 'size': fs.statSync(path + currentFileName).size/1000000.0}
        }
        dataToSend = {currentDir: path, files: items}
        event.sender.send('FileList', JSON.stringify(dataToSend))
      });
      */
      });


  ipcMain.on('requestPacketSend', (event, arg) => {
    console.log("Window is asking to send packet")
    sendPacket(arg)
    });

  ipcMain.on('requestPage', (event, arg) => {
    loginWin.loadFile("blank.html");
    if (arg == "ProgramStatus") {
      pageToLoad = "ProgramStatus.html";

    } else if (arg == "FileSystem") {
      pageToLoad = "index.html";

    } else if (arg == "Settings") {
      pageToLoad = "settings.html";

    }
  });

  ipcMain.on('requestPageNameToLoad', (event, arg) => {
    event.sender.send('commandLoadPage', pageToLoad);
  });

  ipcMain.on('requestPageData', (event, arg) => {
    path = "z:/files/projects/ACRONYM-File-Transfer-System/Electron Frontend/pages/" + arg;
    console.log(path);
    file = fs.readFileSync(path, 'utf8');
    event.sender.send('pageLoadData', file);
  });

  ipcMain.on('requestStandardElements', (event, arg) => {
    console.log("Client is requesting Standard Elements");
    path = "z:/files/projects/ACRONYM-File-Transfer-System/Electron Frontend/standardElements/"
    standardElements = {};
    fs.readdir(path, function(err, items) {
      for (i = 0; i < items.length; i++) {
        currentFileName = items[i];
        console.log("Reading " + currentFileName);
        standardElements[currentFileName] = {'name': currentFileName, 'data': fs.readFileSync(path + currentFileName, 'utf8')}
      }
      dataToSend = standardElements;
      event.sender.send('standardElements', JSON.stringify(dataToSend))
    });
  });

    ipcMain.on('requestDirectory', (event, arg) => {
      path = arg;

      if (path[path.length-1] == "/") {
        var path = arg;
      } else {
        var path = arg + "/";
      }

      commandToSend = {CMDType:"requestFiles", data:{path: path, windowID: event.sender.getOwnerBrowserWindow().id}}
      console.log(event.sender.getOwnerBrowserWindow().id);
      dataToSend = CarterEncryptWrapper(JSON.stringify(commandToSend), key);
      client.write(constructPacket("__CMD__",dataToSend));
      
      /*
      console.log("reading from " + path);
      fs.readdir(path, function(err, items) {
        for (i = 0; i < items.length; i++) {
          currentFileName = items[i]
          items[i] = {'name': currentFileName, 'size': fs.statSync(path + currentFileName).size/1000000.0}
        }
        dataToSend = {currentDir: path, files: items}
        event.sender.send('FileList', JSON.stringify(dataToSend))
      });*/
      });



    loginWin.on('closed', () => {
        loginWin = null

      });
    
  }


  app.on('ready', createLoginWindow)
  
  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createLoginWindow()
    }
  })