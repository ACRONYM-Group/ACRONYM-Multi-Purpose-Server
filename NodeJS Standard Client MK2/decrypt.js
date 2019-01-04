require('./renderer.js')
const {dialog} = require('electron').remote
const {ipcRenderer} = require('electron')
var bigInt = require("big-integer");
const BrowserWindow = require('electron').remote.BrowserWindow;

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


function CarterDecrypt(data, key, progressFunction, progressData) {
  console.log("Decrypting with key: " + key)
  var newData = "";
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

    if (progressFunction != "none") {
      if (x >= data.length/20) {
        x = 0
        console.log(data.length);
        ipcRenderer.send("decryptionProgressReport", {y: y, yMax: yMax, progressFunction: progressFunction, progressData: progressData});
        console.log("Sending Status Report");
      }
    }
    y = y + 1;
    x = x + 1;
  }

  if (progressFunction != "none") {
    console.log(data.length);
    ipcRenderer.send("decryptionProgressReport", {y: y, yMax: yMax, progressFunction: progressFunction, progressData: progressData});
    console.log("Sending Status Report");
  }

  return newData;
}

ipcRenderer.on('textToDecrypt', (event, arg) => {
    console.log("Starting Decrypt...")
    decryptedText = CarterDecrypt(arg["data"], arg["key"].value, arg["progressFunction"], arg["progressData"]);
    console.log("Finished Decrypting.")
    ipcRenderer.send('decryptionFinished', {output:decryptedText, inputType: arg["inputType"], filePathToWrite: arg["filePathToWrite"]});
    ipcRenderer.removeAllListeners("textToDecrypt");
    window.close();
})

ipcRenderer.send('requestTextToDecrypt', "ping");