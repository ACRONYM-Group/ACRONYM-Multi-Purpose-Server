"""
    Packages data to 
"""
import math


def convertIntToData(integer):
    num = math.ceil(math.log(integer, 256))

    data = chr(num)

    for i in reversed(list(range(num))):
        current = int(int(integer / float(256**i)) % 256)

        data += chr(current)

    return data


def convertDataToInt(data):
    result = 0

    for c in data[1:]:
        result *= 256
        result += ord(c)

    return result


def convertDataToIntArray(data):
    chunks = []

    while not data:
        num = ord(data[0])

        newChunk = ""

        newChunk += data[0]

        for i in range(num):
            data = data[1:]
            newChunk += data[0]

        data = data[1:]

        chunks.append(newChunk)

    array = []

    for chunk in chunks:
        array.append(convertDataToInt(chunk))

    return array
