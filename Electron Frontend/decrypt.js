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


function CarterDecrypt(data, key) {
    //console.log("decrypting...");
    var newData = ""
    key = key % 2560;
    key = key*2;
    key = bigInt(key);
    var r = key.multiply(10);
    r = r.pow(key).mod(123);
    //r = (key*10)**key%123;
    //console.log("Starting Decrypt. Mathed R:");
    //console.log(r);
  
    for (var c = 0; c < data.length; c++) {
      //console.log("Decrypt Tick");
      var oldVal = bigInt(utf16ToDig(data.charAt(c)));
      oldVal = oldVal.minus(r.mod(bigInt(256)));
      //console.log(r.mod(256).toJSNumber());
      oldVal = Number(oldVal.toString());
      //console.log(oldVal);
  
      if (oldVal < 0) {
        oldVal = oldVal+256;
      }
  
      //console.log(intToChar(oldVal));
      newData = newData + intToChar(oldVal);
    
      //r = r.multiply(key.add(bigInt(1).add(bigInt(r.divide(key))).mod(250))); //(key + 1+utf16ToDig(r/key))%250;
      var factor = key.add(1);
      var factor2 = r.divide(key);
      //console.log("DIVIDING")
      //console.log(r);
      //console.log(key);
      //console.log(factor2);
      factor = factor.add(factor2);
      factor = factor.mod(250);
  
      r = r.multiply(factor)
      //(key + 1+int(r/key))%250
    }
  
    return newData;
  }

function CarterDecryptWrapper(data, key) {
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
ipcRenderer.on('textToDecrypt', (event, arg) => {
    console.log("Starting Decrypt...")
    console.log(arg["key"].value);
    decryptedText = CarterDecryptWrapper(arg["data"], arg["key"].value);
    console.log("Finished Decrypting.")
    ipcRenderer.send('decryptionFinished', {output:decryptedText, inputType: arg["inputType"]});
    window.close();
})

ipcRenderer.send('requestTextToDecrypt', "ping");