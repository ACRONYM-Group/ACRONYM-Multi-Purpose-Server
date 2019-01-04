var net = require('net');
var packetReceiveHandler = require('./packetReceiveHandler.js');
var bigInt = require("big-integer");

var partiallyReceivedPacket = "";
var client;
var key = bigInt(0);

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
  console.log("Parsing Stream..");
  data = data.toString();
  if (partiallyReceivedPacket.length > 0) {
    data = partiallyReceivedPacket + data;
    partiallyReceivedPacket = "";
  }

  while (data.indexOf("\-ENDACROFTPPACKET-/") !== -1) {
    firstPacket = data.substring(0, data.indexOf("\-ENDACROFTPPACKET-/") - 1);
    packetReceiveHandler.handle(firstPacket, alreadyDecrypted, client, module.parent);
    key = packetReceiveHandler.key;
    data = data.substring(data.indexOf("\-ENDACROFTPPACKET-/") + 19, data.length);
  }

  if (data.length > 0) {
    partiallyReceivedPacket = data;
  }

  module.parent.exports.key = key;
}

function connectToServer(ip, port) {
  client = new net.Socket();
  client.connect(port, ip, function() {
    console.log('Connected');
  });
  return client;
}

function getKey() {
  return packetReceiveHandler.key;
}

module.exports = {
    constructPacket: constructPacket,
    connectToServer: connectToServer,
    streamToPacketParser: streamToPacketParser,
    key: getKey
}