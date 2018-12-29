"""
    Performs the encryption algorithm for the key exchange
"""


def encrypt(data, key, progressFunction=None,
            progressData=None, progressInterval=250000):
    newData = []

    origKey = key
    key = key % 2560

    key = key*2

    rOrig = (key*10)**key % 123
    r = rOrig
    yMax = len(data) - 1
    y = 0
    x = 0

    while y <= yMax:
        c = data[y]
        newData.append((chr((ord(c) + r % 256) % 256)))
        r *= (key + 1+int(r/key)) % 250
        if r >= 10000000 or r <= 0:
            r = rOrig

        if (x >= progressInterval):
            x = 0
            if progressFunction is not None:
                progressFunction(y, yMax, origKey, progressData)

        y = y + 1
        x = x + 1

    if progressFunction is not None:
        progressFunction(y, yMax, origKey, progressData)

    return newData


def decrypt(data, key, progressFunction=None,
            progressData=None, progressInterval=1000000):
    newData = []

    origKey = key
    key %= 2560

    key *= 2

    rOrig = (key*10)**key % 123
    r = rOrig
    yMax = len(data) - 1
    y = 0
    x = 0

    while y <= yMax:
        oldVal = ord(data[y])

        oldVal -= r % 256

        if oldVal < 0:
            oldVal += 256

        newData += (chr(oldVal))

        r *= (key + 1+int(r/key)) % 250

        if r >= 10000000 or r <= 0:
            r = rOrig

        if (x >= progressInterval):
            x = 0
            if progressFunction is not None:
                progressFunction(y, yMax, origKey, progressData)

        y = y + 1
        x = x + 1

    return newData
