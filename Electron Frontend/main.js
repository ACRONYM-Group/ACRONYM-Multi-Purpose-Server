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
var ServerIP = "192.168.1.10";
var ServerPort = 4242;
let win
let loginWin

var testInt = bigInt("214325345634634");
var keyArray = testInt.toArray(10)["value"];
console.log(keyArray);

if (keyArray.length < 16) {
  for (i = keyArray.length; i < 16; i++) {
    keyArray.unshift(0);
  }
}

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

function constructPacket(type, payload) {
  var packet = {"packetType":type, "payload":payload};
  console.log("Packet Constructed:")
  console.log(packet);
  return JSON.stringify(packet);
}

function packetReceiveHander(data) {
  //var dataArr = data.split('')
  console.log(" ");
  console.log('Received: ');
  //for (var i = 0; i < data.length; i++) {
  //  console.log(charToInt(dataArr[i]))
  //}
  console.log(data.toString());
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

  } else if (packet["packetType"] == "__HDS__") {
    client.write(constructPacket("__HDS__", packet["payload"]));
  }

  //latestMinecraftData = 
  //console.log(Array.apply([], data).join(","));
  //client.write(data);
}

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
  //client.write(String.fromCharCode(3) + String.fromCharCode(1) + String.fromCharCode(4) + String.fromCharCode(1) + String.fromCharCode(5));
  //client.write('{"clientType": "electron"}')
});

function sendPacket(data) {
  var client = new net.Socket();
  client.connect(ServerPort, ServerIP, function() {
    //console.log('Connected');
    client.write(data);
  });

  client.on('data', packetReceiveHander);
}

client.on('data', packetReceiveHander);

  function createLoginWindow () {
    // Create the browser window.
    loginWin = new BrowserWindow({width: 400, height: 600, frame: false})

    // Open the DevTools.
    loginWin.webContents.openDevTools()

    loginWin.loadFile('blank.html')
    pageToLoad = "login.html";

    ipcMain.on('loginButtonPressed', (event, arg) => {
        console.log(arg)
        //sendPacket("User has logged in.")
        loginWin.loadFile('blank.html')
        pageToLoad = "index.html";
        loginWin.setSize(1280, 600)
        loginWin.center()

    })

    ipcMain.on('requestMinecraftServerData', (event, arg) => {
      sendPacket('{"clientType": "electron"}');
      event.sender.send("MinecraftServerData", latestMinecraftData);
    })

    ipcMain.on('requestFiles', (event, arg) => {
      console.log("User Requested File Directory Data")

      var path = "z:/AcroFTP/";
 
      fs.readdir(path, function(err, items) {
        for (i = 0; i < items.length; i++) {
          currentFileName = items[i]
          items[i] = {'name': currentFileName, 'size': fs.statSync(path + currentFileName).size/1000000.0}
        }
        dataToSend = {currentDir: path, files: items}
        event.sender.send('FileList', JSON.stringify(dataToSend))
      });
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

      console.log("reading from " + path);
      fs.readdir(path, function(err, items) {
        for (i = 0; i < items.length; i++) {
          currentFileName = items[i]
          items[i] = {'name': currentFileName, 'size': fs.statSync(path + currentFileName).size/1000000.0}
        }
        dataToSend = {currentDir: path, files: items}
        event.sender.send('FileList', JSON.stringify(dataToSend))
      });
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