import socket
import threading

import keyExchange

import primes as Primes
import dataOverStream as DataStream

import encryption

import packet as Packet
import dataOverString as DataString

import time
import json

import platform
import os

import base64

OSName = platform.platform()
print("Current Software Platform: " + OSName)


def encrypt(data, key):
    print("Length of Input: " + str(len(data)))
    newData = []

    key = key%2560

    key = key*2

    rOrig = (key*10)**key%123
    r = rOrig
    msStart = time.time()*1000.0
    yMax = len(data) - 1
    y = 0
    x = 0
    while y < yMax:
        c = data[y]
        newData.append((chr((ord(c) + r%256) % 256)))

        r *= (key + 1+int(r/key))%250
        if r == 0:
            r = rOrig
        if (x >= 1000000):
            print (yMax - y)
            x = 0
        #print(r)
        y = y + 1
        x = x + 1

    print("Encryption took: " + str(time.time()*1000.0 - msStart) + " Milliseconds")
    print("Length of Output: " + str(len(newData)))
    print("Joining Output...")

    msStart = time.time()*1000.0
    newData = ''.join(newData)
    print("Joining Took: " + str(time.time()*1000.0 - msStart) + " Milliseconds")

    #print(newData) 

file = open("Z:/AcroFTP/earth.jpg", "rb")
fileData = file.read()
fileDataB64 = base64.b64encode(fileData).decode('ascii')
dataToSend = encrypt(json.dumps({"CMDType":"downloadFile", "payload":{"file":fileDataB64, "filePath":"Z:/AcroFTP/earth.jpg"}}), 12345)


n = 0
while n < 0:
    test = ""
    msStart = time.time()*1000.0
    i = 0
    while i < 1:
        test = encrypt("Which is probably really good, because I'd assume that means the rest is in overhead of dealing with large strings, and so we might be able to come up with a mathematical solution to this. (For instance: Make the encryption algorithm work properly with strings longer than 4 characters.)", 12345)
        i = i + 1

    msEnd = time.time()*1000.0
    elapsedTime = msEnd - msStart
    print("10,000 Raw Encryptions finished in " + str(elapsedTime) + " milliseconds")
    n = n + 1

#print(chr(205))
test = encryption.encrypt("AFTP", 123456789106576575675685678567)
print(test)
testDecrypt = encryption.decrypt(test, 12345678910)
print(testDecrypt)


serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 4242
hostName = ""

serverSocket.bind((hostName, port))

MOTD = "Welcome to the A.C.R.O.N.Y.M. Network.\nServer is Running on " + OSName
masterPassword = "FSaP314"

def doHandshake(conn, addr):
    Packet.Packet('31415', "__HDS__").send(conn)

    data = Packet.readPacket(conn)[:-19]
    print(data)
    data = json.loads(data)

    if data["payload"] == "31415":
        print ("Handshake with " + str(addr[0]) + " sucessful!")
        return True
    else:
        print ("Handshake with " + str(addr[0]) + " failed!")
        print ("Responce Recieved: ")
        print (data)
        return False

def checkUserPass(user, password):
    f = open("credit.csv","r")

    for line in f.readlines():
        items = line.split(",")
        items = [i.strip() for i in items]

        if items == [user, password]:
            print ("User Accepted")
            return True
            
    return False

def tempPassCheck(username, password):
    print(" ")
    print(username + " is attempting login.")
    print("Checking against master Password..")
    if password == masterPassword:
        print("Authentication Successful!")
        return True
    else:
        print("User failed Authentication!")
        return False

    print(" ")


def doKeyExchange(conn):
    primePair = Primes.getPrimePair()
    exchange = keyExchange.KeyExchange(primePair)
    exchange.randomSecret()

    mixed = exchange.calculateMixed()

    print (primePair)

    Packet.Packet(chr(0) + chr(1) + DataString.convertIntToData(primePair[0]),"__DAT__").send(conn)
    time.sleep(0.1)
    Packet.Packet(chr(0) + chr(2) + DataString.convertIntToData(primePair[1]),"__DAT__").send(conn)
    time.sleep(0.1)
    Packet.Packet(chr(0) + chr(3) + DataString.convertIntToData(mixed),"__DAT__").send(conn)

    print ("My Mixed: " + str(mixed))

    print ("Secret: " + str(exchange.secret))

    packet = json.loads(Packet.readPacket(conn)[:-19])

    val = DataString.convertDataToInt(packet["payload"][2:])

    print ("Their Mixed: " + str(val))

    key = exchange.getSharedKey(val)

    print ("Settled Key: " + str(key))

    return key

def sendEncrypted(conn, data, key):
    with DataStream.DataStreamOut(conn) as stream:
        stream.sendData(DataStream.DATA_TYPE_STRING, encryption.encrypt(data, key))

def readEncrypted(conn, key):
    with DataStream.DataStreamIn(conn) as stream:
        data = stream.getData(DataStream.DATA_TYPE_STRING)
        return encryption.decrypt(data, key)

def packetHandler(packetRec, key, hasUserAuthenticated, conn):
    if packetRec.type == "__CMD__":
        print("Client sent Command, decrypting...")
        commandRec = encryption.decryptWrapper(packetRec.body, key)
        print("Decrypted Command: " + commandRec)

        commandRec = json.loads(commandRec)
        if commandRec["CMDType"] == "login":
            userCredentials = json.loads(commandRec["data"])
            hasUserAuthenticated = tempPassCheck(userCredentials["username"], userCredentials["password"])
            dataToSend = encryption.encryptWrapper(json.dumps({"CMDType":"AuthResult", "data":hasUserAuthenticated}), key)
            Packet.Packet(dataToSend,"__CMD__").send(conn)

        if hasUserAuthenticated:
            if commandRec["CMDType"] == "downloadFile":
                print("Client has requested to download " + commandRec["data"]["filePath"])
                file = open(commandRec["data"]["filePath"], "rb")
                print("Starting File Read...")
                fileData = file.read()
                print("File read complete. Encoding in Base64...")
                fileDataB64 = base64.b64encode(fileData).decode('ascii')
                print("File encoded.")
                print("Encrypting File.")
                dataToSend = encryption.encryptWrapper(json.dumps({"CMDType":"downloadFile", "payload":{"file":fileDataB64, "filePath":commandRec["data"]["filePath"]}}), key)
                print("File Encryption Complete.")
                print("Sending File.")
                Packet.Packet(dataToSend,"__CMD__").send(conn)

            if commandRec["CMDType"] == "requestMOTD":
                print("Sending the client the MOTD")
                dataToSend = encryption.encryptWrapper(json.dumps({"CMDType":"updateMOTD", "data":MOTD}), key)
                #print(" ")
                #print("Data to send and data to send Decrypt:")
                #print(dataToSend)
                dataToSendDecrypt = encryption.decryptWrapper(dataToSend, key)
                #print(dataToSendDecrypt)
                Packet.Packet(dataToSend,"__CMD__").send(conn)
            
            if commandRec["CMDType"] == "requestFiles":
                print("Sending the client the File Structure...")
                filesDataToSend = []
                commandData = commandRec["data"]
                directory = os.listdir(commandData["path"])
                for s in directory:
                    fileData = {"name":s,"size":os.stat(commandRec["data"]["path"] + s).st_size}
                    filesDataToSend.append(fileData)
                
                dataToSend = encryption.encryptWrapper(json.dumps({"CMDType":"updateFiles", "data":{"files":filesDataToSend, "window":commandData["windowID"], "path": commandRec["data"]["path"]}}), key)
                Packet.Packet(dataToSend,"__CMD__").send(conn)
                print("Client requested " + commandRec["data"]["path"])

    return hasUserAuthenticated

def connectionHandler(conn, addr):
    print ("Connection Recieved From " + str(addr[0]))

    doHandshake(conn, addr)
    key = doKeyExchange(conn)

    hasUserAuthenticated = False

    print(encryption.decrypt(chr(205), key))

    partialPacket = ""

    while True:
        rawRec = Packet.readPacket(conn)
        packetsRec = rawRec.split("\-ENDACROFTPPACKET-/")

        i = -1
        for s in packetsRec:

            i = i + 1
            if len(s) > 0:
                print(s)
                if (s[-19:] == "-ENDACROFTPPACKET-/"):
                    s = s[:-19]

                try:
                    s = json.loads(s)
                    packet = Packet.Packet(s["payload"], s["packetType"], conn)
                    hasUserAuthenticated = packetHandler(packet, key, hasUserAuthenticated, conn)
                except ValueError:
                    if (i == 0):
                        s = partialPacket + s
                        try:
                            s = json.loads(s)
                            packet = Packet.Packet(s["payload"], s["packetType"], conn)
                            hasUserAuthenticated = packetHandler(packet, key, hasUserAuthenticated, conn)
                        except:
                            print("DOUBLE PACKET PARSE EXCEPTION, Ignoring Packet.")

                    if (i == len(packetsRec) - 1):
                        partialPacket = s
        




def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()

startListener(serverSocket)