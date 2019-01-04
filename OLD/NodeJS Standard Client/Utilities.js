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

  module.exports = {
      utf16ToDig: utf16ToDig,
      intToRawBin: intToRawBin,
      logCustomBase: logCustomBase,
      intToChar: intToChar,
      charToInt: charToInt,
      stringToBytes: stringToBytes,
      convertCharListToInt: convertCharListToInt
  }