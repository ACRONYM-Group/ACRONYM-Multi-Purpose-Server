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

postMessage(newData);