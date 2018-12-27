var networking = require('./networking.js');
var util = require("./utilities.js");
var bigInt = require("big-integer");
var encryption = require('./encryption.js');

var keyExchangeInts = [];
var keyExchangeLargerPrime = 0;
var keyExchangeSmallerPrime = 0;
var key = bigInt(0);
var theirMixed = 0;

function handle(data, alreadyDecrypted, client) {
  var networking = require('./networking.js');
  var util = require("./utilities.js");
  var bigInt = require("big-integer");
  var encryption = require('./encryption.js');

  var packet = JSON.parse(data.toString());
  console.log("Receiving " + packet["packetType"]);
  if (packet["packetType"] == "__DAT__") {
    console.log("proccessing __DAT__ packet");
    var rawBinary = util.stringToBytes(packet["payload"]);
    var dataID = rawBinary[0] * 256 + rawBinary[1];
    var dataIDFirstByte = rawBinary[0];
    var dataIDSecondByte = rawBinary[1];
    rawBinary = rawBinary.splice(2,rawBinary.length - 2);
    var dataLength = rawBinary[0];
    rawBinary = rawBinary.splice(1,rawBinary.length-1);
    if (dataIDFirstByte == 0) {
      keyExchangeInts.push(util.convertCharListToInt(rawBinary));
      console.log(keyExchangeInts.length);
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

        
        client.write(networking.constructPacket("__DAT__", util.intToChar(0) + util.intToChar(3) + util.intToRawBin(mixedNumber)));
        console.log("Responding to key exchange!");

        key = bigInt(theirMixed).pow(secret).mod(p);
        console.log("Key: " + key);
        module.exports.key = key;
      }
    }

  } else if (packet["packetType"] == "__RAW__") {

  } else if (packet["packetType"] == "__CMD__") {
    var keyArray = key.toArray(10)["value"];

    if (alreadyDecrypted) {
      decryptedPacketData = packet["payload"];
    } else {
      decryptedPacketData = encryption.decrypt(packet["payload"], key);
    }

    command = JSON.parse(decryptedPacketData);

    if (command["CMDType"] == "updateMOTD") {
      MOTD = command["data"];
      console.log("New MOTD: " + MOTD);
    }

    if (command["CMDType"] == "AuthResult") {
      if (command["data"] == true) {
        module.parent.parent.authResultEvent("Successful!");

        commandToSend = {CMDType:"requestMOTD"};
        dataToSend = CarterEncryptWrapper(JSON.stringify(commandToSend), key);
        client.write(networking.constructPacket("__CMD__",dataToSend));
      } else {
        module.parent.authResultEvent("Failed!");
      }
    }
     if (command["CMDType"] == "updateFiles") {
      dataToSend = {currentDir: command["data"]["path"], files: command["data"]["files"]};
      BrowserWindow.fromId(command["data"]["window"]).send('FileList', JSON.stringify(dataToSend));
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

    if (command["CMDType"] == "fileTransferProgressReport") {
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
    client.write(networking.constructPacket("__HDS__", packet["payload"]));

  } else if (packet["packetType"] == "__LPW__") {
    LPWPacket = packet["payload"];
    if (partialLPWPackets[packet["LPWID"]] == undefined) {
      partialLPWPackets[packet["LPWID"]] = {};
      partialLPWPackets[packet["LPWID"]]["data"] = "";
    }
    partialLPWPackets[packet["LPWID"]]["data"] += LPWPacket;

    if ((packet["ind"] / 10000 - Math.floor(packet["ind"] / 10000)) == 0) {
    }

    if (packet["windowID"] != null) {
      if ((packet["ind"] / 1000 - Math.floor(packet["ind"] / 1000)) == 0) {
        BrowserWindow.fromId(packet["windowID"]).send("TransferProgressReport", {index: packet["ind"], length: packet["len"]});
      }
    }
    
    if (packet["ind"] == packet["len"]) {
      if (packet["windowID"] != null) {
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

module.exports = {
  handle: handle,
  key: key
}