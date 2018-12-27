var bigInt = require("big-integer");
var util = require("./utilities.js")

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
      var characterInt = util.utf16ToDig(data.charAt(y));
      newData += util.intToChar(bigInt(characterInt).add(r.mod(256)).mod(256));
      
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
      var oldVal = bigInt(util.utf16ToDig(data.charAt(y)));
      oldVal = oldVal.minus(r.mod(bigInt(256)));
      oldVal = Number(oldVal.toString());
  
      if (oldVal < 0) {
        oldVal = oldVal+256;
      }
  
      newData = newData + util.intToChar(oldVal);
    
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

  module.exports = {
      encrypt: CarterEncrypt,
      decrypt: CarterDecrypt
  }