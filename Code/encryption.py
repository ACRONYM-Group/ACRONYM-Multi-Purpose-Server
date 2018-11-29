import random
import math
import time

def encrypt(data, key):
    newData = ""

    key = key%2560

    key = key*2

    r = (key*10)**key%123

    for c in data:
        #print(" ")
        #print(r)
        #print(c)
        #print((chr((ord(c) + r%256) % 256)))
        newData += (chr((ord(c) + r%256) % 256))


        r *= (key + 1+int(r/key))%250

    return newData

def decrypt(data, key):
    newData = ""

    key = key%2560

    key = key*2

    r = (key*10)**key%123

    #print("starting decrypt. mathed r:")
    #print(r)

    for c in data:
        oldVal = ord(c)

        oldVal -= r%256

        if oldVal < 0:
            oldVal += 256

        newData += (chr(oldVal))

        r *= (key + 1+int(r/key))%250
        #print("R:")
        #print(r)

    return newData

def encryptWrapper(data, key):
    queue = ""
    output = ""

    i = 0
    while i < len(data):
        queue += data[:1]
        data = data[1:]

        if len(queue) == 4 or len(data) == 0:
            output += encrypt(queue, key)
            queue = ""

    return output

def decryptWrapper(data, key):
    queue = ""
    output = ""

    i = 0
    while i < len(data):
        queue += data[:1]
        data = data[1:]

        if len(queue) == 4 or len(data) == 0:
            output += decrypt(queue, key)
            queue = ""
    
    return output


oldTime = time.time()
decrypt("Hello WORLD", 10000000)
print (time.time() - oldTime)