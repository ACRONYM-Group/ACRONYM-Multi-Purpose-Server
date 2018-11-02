var express = require('express');
var http = require('http')
var socketio = require('socket.io');
var ServerIP = "192.168.1.10";
var ServerPort = 4242;

var net = require('net');

function packetReceiveHander(data) {
}

var client = new net.Socket();
client.connect(ServerPort, ServerIP, function() {
  console.log('Connected');
  //client.write(String.fromCharCode(3) + String.fromCharCode(1) + String.fromCharCode(4) + String.fromCharCode(1) + String.fromCharCode(5));
  client.write('{"clientType": "react"}')
  client.on('data', function() {
    var packet = JSON.parse(data.toString());
    socket.emit('AcroFTP', 'Hi World!');
  });
});


var app = express();
var server = http.Server(app);
var websocket = socketio(server);


// The event will be called when a client is connected.
websocket.on('connection', (socket) => {
  console.log('A client just joined on', socket.id);
  socket.emit('AcroFTP', 'Hello world!');

  socket.on('AcroFTP', (message) => console.log(message));
});

server.listen(3000, () => console.log('listening on *:3000'));