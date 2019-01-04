const {app, BrowserWindow, dialog, ipcMain} = require('electron')
var fs = require('fs');
var bigInt = require("big-integer");
var networking = require('./networking.js');
var encryption = require('./encryption.js');

var ServerIP = "192.168.1.104";
var ServerPort = 4242;
var key = bigInt(0);

var client = networking.connectToServer(ServerIP, ServerPort);
client.on('data', networking.streamToPacketParser);

function requestMOTD() {

    commandToSend = {CMDType:"login", data:JSON.stringify({username:"Jordan",password:"FSaP314"})}
    dataToSend = encryption.encrypt(JSON.stringify(commandToSend), networking.key());
    client.write(networking.constructPacket("__CMD__",dataToSend));

    var commandToSend = {CMDType:"requestMOTD"};
    var dataToSend = encryption.encrypt(JSON.stringify(commandToSend), networking.key());
    client.write(networking.constructPacket("__CMD__",dataToSend));
    console.log("Requesting MOTD");
    console.log(networking.constructPacket("__CMD__",dataToSend));
}

function authResultEvent(arg) {
    console.log("Authentication Result: " + arg);
}

module.exports = {
    key: key,
    authResultEvent: authResultEvent
}

setTimeout(requestMOTD, 2000);
