import random
import math
import time

def encrypt(data, key, progressFunction=None, progressData=None, progressInterval=250000):
    msStart = time.time()*1000.0
    newData = []

    origKey = key
    key = key%2560

    key = key*2

    rOrig = (key*10)**key%123
    r = rOrig
    yMax = len(data) - 1
    y = 0
    x = 0
    startupTime = time.time()*1000.0 - msStart

    msStart = time.time()*1000.0
    while y <= yMax:
        c = data[y]
        newData.append((chr((ord(c) + r%256) % 256)))
        r *= (key + 1+int(r/key))%250
        if r >= 10000000 or r <= 0:
            r = rOrig

        if (x >= progressInterval):
            x = 0
            if progressFunction != None:
                progressFunction(y, yMax, origKey, progressData)
        
        y = y + 1
        x = x + 1

    encryptionTime = time.time()*1000.0 - msStart

    msStart = time.time()*1000.0
    newData = ''.join(newData)
    joinTime = time.time()*1000.0 - msStart
    totalTime = startupTime + encryptionTime + joinTime
    print("Encrypt Time - Total: " + str(math.floor(totalTime*10)/10) + " ms, Encrypt: " +  str(math.floor(encryptionTime * 10)/10) + " ms, Join: " + str(math.floor(joinTime*10)/10) + " ms")

    if progressFunction != None:
        progressFunction(y, yMax, origKey, progressData)
        
    return newData

def decrypt(data, key, progressFunction=None, progressData=None, progressInterval=1000000):
    msStart = time.time()*1000.0
    newData = []

    origKey = key
    key = key%2560

    key = key*2

    rOrig = (key*10)**key%123
    r = rOrig
    yMax = len(data) - 1
    y = 0
    x = 0
    startupTime = time.time()*1000.0 - msStart

    msStart = time.time()*1000.0

    while y <= yMax:
        oldVal = ord(data[y])

        oldVal -= r%256

        if oldVal < 0:
            oldVal += 256

        newData += (chr(oldVal))

        r *= (key + 1+int(r/key))%250

        if r >= 10000000 or r <= 0:
            r = rOrig
        
        if (x >= progressInterval):
            x = 0
            if progressFunction != None:
                progressFunction(y, yMax, origKey, progressData)
        
        y = y + 1
        x = x + 1

    decryptionTime = time.time()*1000.0 - msStart

    msStart = time.time()*1000.0
    newData = ''.join(newData)
    joinTime = time.time()*1000.0 - msStart
    totalTime = startupTime + decryptionTime + joinTime
    print("Decrypt Time - Total: " + str(math.floor(totalTime*10)/10) + " ms, Decrypt: " +  str(math.floor(decryptionTime * 10)/10) + " ms, Join: " + str(math.floor(joinTime*10)/10) + " ms")

    return newData

oldTime = time.time()
decrypt("Hello WORLD", 10000000)
print (time.time() - oldTime)