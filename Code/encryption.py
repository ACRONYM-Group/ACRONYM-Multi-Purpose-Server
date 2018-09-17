import random
import math
import time

def encrypt(data, key):
    newData = ""

    key = key%2560

    key = key*2

    r = (key*10)**key%123

    for c in data:
        newData += (chr((ord(c) + r%256) % 256))

        r *= (key + 1+int(r/key))%250

    return newData

def decrypt(data, key):
    newData = ""

    key = key%2560

    key = key*2

    r = (key*10)**key%123

    for c in data:
        oldVal = ord(c)

        oldVal -= r%256

        if oldVal < 0:
            oldVal += 256

        newData += (chr(oldVal))

        r *= (key + 1+int(r/key))%250


    return newData

oldTime = time.time()
decrypt("Hello WORLD", 10000000)
print (time.time() - oldTime)