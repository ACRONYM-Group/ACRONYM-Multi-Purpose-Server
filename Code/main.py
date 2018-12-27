import socket
import threading

import keyExchange

import primes as Primes
import dataOverStream as DataStream

import encryption
import re

import packet as Packet
import dataOverString as DataString

import time
import json

import platform
import os

import base64
import math

from datetime import datetime
from datetime import timedelta

programStartTime = datetime.now()

OSName = platform.platform()

print("Current Software Platform: " + OSName)



def PrintProgress(y, yMax, progressData):
    print("Progress: " + str(y/yMax*100) + "%")

def fileTransferProgressFunction(y, yMax, key, progressData=None):
    print("Transfer Progress Key: ")
    print(key)
    dataToSend = encryption.encrypt(json.dumps({"CMDType":"fileTransferProgressReport","data":{ "y":y, "yMax":yMax, "windowID":progressData["windowID"]}}), key)
    Packet.Packet(dataToSend,"__CMD__").send(progressData["conn"])

#varToEncrypt = "HELLO WORLD! HOW ARE YOU?"
#print(varToEncrypt)
#test = encryption.encrypt(varToEncrypt, 123456)
#print(test)
#print(encryption.decrypt(test, 123456))


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

def millis(startTime):
   dt = datetime.now() - startTime
   ms = (dt.days * 24 * 60 * 60 + dt.seconds) * 1000 + dt.microseconds / 1000.0
   return ms

xinvalid = re.compile(r'\\x([0-9a-fA-F]{2})')

def fix_xinvalid(m):
    return chr(int(m.group(1), 16))

def fix(s):
    return xinvalid.sub(fix_xinvalid, s)

def downloadFileHandler(conn, commandRec, key):
    print("Client has requested to download " + commandRec["data"]["filePath"])
    file = open(commandRec["data"]["filePath"], "rb")
    fileName = commandRec["data"]["filePath"][::-1][:commandRec["data"]["filePath"][::-1].find("/")][::-1]
    fileLength = os.stat(commandRec["data"]["filePath"]).st_size

    fileData = file.read(2000000)
    index = 0
    packetIndex = 0
    while index < fileLength: 
        fileDataB64 = base64.b64encode(fileData).decode("ascii")
        print("Converted to: " + str(len(fileDataB64)))
        dataToSend = encryption.encrypt(json.dumps({"CMDType":"downloadFileChunk", "payload":{"file":fileDataB64, "index": index, "packetIndex": packetIndex, "length": fileLength, "filePath":commandRec["data"]["filePath"], "fileName": fileName, "windowID":commandRec["data"]["windowID"]}}), key)
        
        Packet.Packet(dataToSend,"__CMD__").send(conn, commandRec["data"]["windowID"])

        fileTransferProgressFunction(index, fileLength, key, {"conn":conn, "windowID":commandRec["data"]["windowID"]})

        fileData = file.read(2000000)
        index = index + 2000000
        packetIndex += 1
    
    print("File Encryption Complete.")
    print("File Sent.")
    fileTransferProgressFunction(index, fileLength, key, {"conn":conn, "windowID":commandRec["data"]["windowID"]})
    dataToSend = encryption.encrypt(json.dumps({"CMDType":"fileTransferComplete", "payload": {"fileName":fileName, "finalPacketIndex":packetIndex}}), key)
    Packet.Packet(dataToSend,"__CMD__").send(conn, commandRec["data"]["windowID"])

def packetHandler(packetRec, key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue):
    if packetRec.type == "__LPW__":
        #print("Received LPW subPacket")
        LPWPacketRec = json.loads(packetRec.body)
        if not LPWPacketRec["LPWID"] in LPWPackets:
            LPWPackets[LPWPacketRec["LPWID"]] = {}

        LPWPackets[LPWPacketRec["LPWID"]][LPWPacketRec["index"]] = LPWPacketRec["LPWPayload"]
        #print(str(len(LPWPackets[LPWPacketRec["LPWID"]])) + "/" + str(LPWPacketRec["len"]-1))
        if (len(LPWPackets[LPWPacketRec["LPWID"]]) >= LPWPacketRec["len"]):
            #print("Got all LPW subpackets")
            completeLPWPayload = ""
            i = 0
            while i < len(LPWPackets[LPWPacketRec["LPWID"]]):
                completeLPWPayload += LPWPackets[LPWPacketRec["LPWID"]][i]
                i += 1
            loadedPacket = {}
            try:
                loadedPacket = json.loads(completeLPWPayload, strict = False)
                #print("LPW Receive Complete")
            except Exception as e:
                print("LPW Packet Load Error!")
                #print(completeLPWPayload)
                print(e)
            hasUserAuthenticated, LPWPackets, fileWriteQueue = packetHandler(Packet.Packet( loadedPacket["payload"], loadedPacket["packetType"], conn), key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue)

    if packetRec.type == "__CMD__":
        commandRec = encryption.decrypt(packetRec.body, key)
        commandRecOrig = commandRec
        try:
            commandRec = json.loads(commandRec)
        except:
            try:
                commandRec = json.loads(packetRec.body)
                #print("????????????????????")
                #print("COMMAND WAS NOT ENCRYPTED")
                #print("????????????????????")
                #print("-------decrypt------")
                #print(commandRecOrig)
                #print("-------body---------")
                #print(packetRec.body)
                #print("????????????????????")
                #print("????????????????????")
            except:
                print("????????????????????")
                print("Failed to load command")
                print("????????????????????")
                print("-------decrypt------")
                print(commandRecOrig)
                print("-------body---------")
                print(packetRec.body)
                print("????????????????????")
                print("????????????????????")
        
        #print(commandRec["CMDType"])
        if commandRec["CMDType"] == "login":
            userCredentials = json.loads(commandRec["data"])
            hasUserAuthenticated = tempPassCheck(userCredentials["username"], userCredentials["password"])
            dataToSend = encryption.encrypt(json.dumps({"CMDType":"AuthResult", "data":hasUserAuthenticated}), key)
            Packet.Packet(dataToSend,"__CMD__").send(conn)

        if hasUserAuthenticated:

            if commandRec["CMDType"] == "uploadFileFinish":
                print("Upload Finished Packet received.")
                if fileWriteQueue[commandRec["data"]["filePath"]]["index"] >= commandRec["data"]["finalPacketIndex"]:
                    print("Write of " + commandRec["data"]["filePath"] + " Complete! Took " + str(millis(fileWriteQueue[commandRec["data"]["filePath"]]["startTime"])) + " Milliseconds")
                    fileWriteQueue[commandRec["data"]["filePath"]]["fileReference"].close()
                    fileWriteQueue[commandRec["data"]["filePath"]] = None
                else:
                    print("Received upload finish, but not all packets yet. Waiting.")
                    fileWriteQueue[commandRec["data"]["filePath"]]["finalPacketIndex"] = commandRec["data"]["finalPacketIndex"]

            
            if commandRec["CMDType"] == "downloadFile":
                threading.Thread(target=downloadFileHandler, args=(conn, commandRec, key)).start()

            if commandRec["CMDType"] == "requestMOTD":
                print("Sending the client the MOTD")
                dataToSend = encryption.encrypt(json.dumps({"CMDType":"updateMOTD", "data":MOTD}), key)
                #print(" ")
                #print("Data to send and data to send Decrypt:")
                #print(dataToSend)
                dataToSendDecrypt = encryption.decrypt(dataToSend, key)
                #print(dataToSendDecrypt)
                Packet.Packet(dataToSend,"__CMD__").send(conn)

            if commandRec["CMDType"] == "uploadFile":
                #print("Receiving File Upload")
                if not commandRec["data"]["filePath"] in fileWriteQueue:
                    fileWriteQueue[commandRec["data"]["filePath"]] = {"index":0, "outOfOrderPackets":{}, "startTime": datetime.now()}
                print(fileWriteQueue[commandRec["data"]["filePath"]]["index"])
                print(commandRec["data"]["index"])
                if fileWriteQueue[commandRec["data"]["filePath"]]["index"] == commandRec["data"]["index"]:
                    if not "fileReference" in fileWriteQueue[commandRec["data"]["filePath"]]:
                        file = open(commandRec["data"]["filePath"], "wb")
                        file.write(base64.b64decode(commandRec["data"]["file"]))
                        file.close()
                        fileWriteQueue[commandRec["data"]["filePath"]]["fileReference"] = open(commandRec["data"]["filePath"], "ab")
                        fileWriteQueue[commandRec["data"]["filePath"]]["index"] += 1
                    else:
                        fileWriteQueue[commandRec["data"]["filePath"]]["fileReference"].write(base64.b64decode(commandRec["data"]["file"]))
                        fileWriteQueue[commandRec["data"]["filePath"]]["index"] += 1
                else:
                    fileWriteQueue[commandRec["data"]["filePath"]]["outOfOrderPackets"][commandRec["data"]["index"]] = commandRec["data"]["file"]

                i = fileWriteQueue[commandRec["data"]["filePath"]]["index"] + 1
                hasFoundEmptyPacket = False
                while (i <= 5):
                    if i in fileWriteQueue[commandRec["data"]["filePath"]]["outOfOrderPackets"] and "fileReference" in fileWriteQueue[commandRec["data"]["filePath"]]:
                        if hasFoundEmptyPacket == False:
                            fileWriteQueue[commandRec["data"]["filePath"]]["fileReference"].write(base64.b64decode(fileWriteQueue[commandRec["data"]["filePath"]]["outOfOrderPackets"][i]))
                            fileWriteQueue[commandRec["data"]["filePath"]]["index"] += 1
                    else:
                        hasFoundEmptyPacket = True
                    i = i + 1

                if "finalPacketIndex" in fileWriteQueue[commandRec["data"]["filePath"]]:
                    if fileWriteQueue[commandRec["data"]["filePath"]]["finalPacketIndex"] == fileWriteQueue[commandRec["data"]["filePath"]]["index"]:
                        print("Write of " + commandRec["data"]["filePath"] + " Complete! Took " + millis(fileWriteQueue[commandRec["data"]["filePath"]]["startTime"]) + " Milliseconds")
                        #fileWriteQueue[commandRec["data"]["filePath"]]["fileReference"].close()
                        #fileWriteQueue[commandRec["data"]["filePath"]] = None


            if commandRec["CMDType"] == "requestFiles":
                print("Sending the client the File Structure...")
                filesDataToSend = []
                commandData = commandRec["data"]
                directory = os.listdir(commandData["path"])
                for s in directory:
                    fileData = {"name":s,"size":os.stat(commandRec["data"]["path"] + s).st_size}
                    filesDataToSend.append(fileData)
                
                dataToSend = encryption.encrypt(json.dumps({"CMDType":"updateFiles", "data":{"files":filesDataToSend, "window":commandData["windowID"], "path": commandRec["data"]["path"]}}), key)
                Packet.Packet(dataToSend,"__CMD__").send(conn)
                print("Client requested " + commandRec["data"]["path"])

    return hasUserAuthenticated, LPWPackets, fileWriteQueue



def connectionHandler(conn, addr):
    print ("Connection Recieved From " + str(addr[0]))

    doHandshake(conn, addr)
    key = doKeyExchange(conn)

    hasUserAuthenticated = False
    LPWPackets = {}
    fileWriteQueue = {}

    print(encryption.decrypt(chr(205), key))

    partialPacket = ""
    LPWIDs = []

    while True:
        rawRec = Packet.readPacket(conn)
        packetsRec = rawRec.split("-ENDACROFTPPACKET-/")

        i = -1
        for s in packetsRec:

            i = i + 1
            if len(s) > 0:
                #print(s)
                if (s[-19:] == "-ENDACROFTPPACKET-/"):
                    s = s[:-19]

                try:
                    v = json.loads(s)
                    #print("JSON Load Complete Zero Exception Mode")
                    packet = Packet.Packet(v["payload"], v["packetType"], conn)
                    hasUserAuthenticated, LPWPackets, fileWriteQueue = packetHandler(packet, key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue)
                except ValueError:
                    #print("VALUE ERROR!")
                    if (i == 0):
                        #print(s)
                        s = str(partialPacket) + str(s)
                        try:
                            v = json.loads(s)
                            #print("JSON Load Complete Single Exception Mode")
                            packet = Packet.Packet(v["payload"], v["packetType"], conn)
                            hasUserAuthenticated, LPWPackets, fileWriteQueue = packetHandler(packet, key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue)
                        except:
                            print("DOUBLE PACKET PARSE EXCEPTION, Unable to read:")
                            print(s)

                    if (i == len(packetsRec) - 1):
                        #print("Setting partialPacket to: " + partialPacket)
                        partialPacket = s
        




def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()

startListener(serverSocket)