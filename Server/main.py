import socket
import threading

import keyExchange
import errno

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

import hashlib

import AccountHandler


programStartTime = datetime.now()

OSName = platform.platform()

programInstallDirectory = "Z:/AcroFTP/"

AccountHandler.DATA_FILE_PATH = programInstallDirectory + "\\data\\data.json"

AccountHandler.import_data()

def check_user_passhash(username, password_hash):
    print(username, password_hash)
    print(AccountHandler.global_data)
    SUCCESS = AccountHandler.enums.LOGIN_SUCCESSFUL
    result = AccountHandler.check_credentials(username, password_hash)
    if result == SUCCESS:
        return True

    print(result)

    return False

def add_new_user(username, password=None, password_hash=None):
    assert not (password == None and password_hash == None)

    if password_hash == None:
        password_hash = hashlib.sha3_256(password).hexdigest()

    AccountHandler.add_credentials(username, password_hash)
    AccountHandler.export_data()

def onCorrectStart():
    print(" ")
    print("AMPS Starting Up...")
    print("====================")
    print("Current AMPS Software Version: 12.27.2018.1")
    print("Current Software Platform: " + OSName)
    print(" ")

onCorrectStart()

try:
    with open(programInstallDirectory + "Data/users.json","r") as f:
        contents = f.read()
    users = json.loads(contents)
    print("Successfully loaded data for " + str(len(users)) + " Users...")

except Exception as error:
    print("FAILED TO LOAD USER DATA!")
    print(error)

try:
    with open(programInstallDirectory + "Data/packages.json","r") as f:
        contents = f.read()
    packages = json.loads(contents)
    print("Successfully loaded data for " + str(len(packages)) + " Packages...")

except Exception as error:
    print("FAILED TO LOAD PACKAGE DATA!")
    print(error)


try:
    with open(programInstallDirectory + "Data/computers.json","r") as f:
        contents = f.read()
    computers = json.loads(contents)
    print("Successfully loaded data for " + str(len(computers)) + " Computers...")

except Exception as error:
    print("FAILED TO LOAD COMPUTER DATA!")
    print(error)

def writeUsersToDisk():
    f = open(programInstallDirectory + "Data/users.json","w")
    f.write(json.dumps(users))

def writeComputersToDisk():
    f = open(programInstallDirectory + "Data/computers.json","w")
    f.write(json.dumps(computers))

def PrintProgress(y, yMax, progressData):
    print("Progress: " + str(y/yMax*100) + "%")


def fileTransferProgressFunction(y, yMax, key, progressData=None):
    dataToSend = encryption.encrypt(json.dumps({"CMDType":"fileTransferProgressReport","data":{ "y":y, "yMax":yMax, "windowID":progressData["windowID"]}}), key)
    Packet.Packet(dataToSend,"__CMD__").send(progressData["conn"])

serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 4242
hostName = ""

serverSocket.bind((hostName, port))

MOTD = "Welcome to the A.C.R.O.N.Y.M. Network.\nServer is Running on " + OSName
masterPassword = "pass"

globalCache = {}

def doHandshake(conn, addr):
    Packet.Packet('31415', "__HDS__").send(conn)

    data = Packet.readPacket(conn)[:-19]
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
    print("Checking Password..")
    if password == users[username]["password"]:
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


    Packet.Packet(chr(0) + chr(1) + DataString.convertIntToData(primePair[0]),"__DAT__").send(conn)
    time.sleep(0.1)
    Packet.Packet(chr(0) + chr(2) + DataString.convertIntToData(primePair[1]),"__DAT__").send(conn)
    time.sleep(0.1)
    Packet.Packet(chr(0) + chr(3) + DataString.convertIntToData(mixed),"__DAT__").send(conn)

    packetData = Packet.readPacket(conn)[:-19]
    print(packetData)
    packet = json.loads(packetData)

    val = DataString.convertDataToInt(packet["payload"][2:])

    key = exchange.getSharedKey(val)
    print("Key Exchange Succesful!")
    print(key)
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

def getVerPart(version, part):
    versionParts = version.split(".")
    if part == "major":
        return int(versionParts[0])

    if part == "minor":
        return int(versionParts[1])

    if part == "patch":
        return int(versionParts[2])

def compareGreaterVersion(firstVersion, secondVersion):
    if getVerPart(firstVersion, "major") > getVerPart(secondVersion, "major"):
        return True
    elif getVerPart(firstVersion, "major") == getVerPart(secondVersion, "minor"):
        if getVerPart(firstVersion, "minor") > getVerPart(secondVersion, "minor"):
            return True
        elif getVerPart(firstVersion, "minor") == getVerPart(secondVersion, "minor"):
            if getVerPart(firstVersion, "patch") > getVerPart(secondVersion, "patch"):
                return True
            else:
                return False
        else:
            return False
    else:
        return False

def getHighestVersion(verList, specificMajor=-1):
    highest = "0.0.0"
    for s in verList:
        if specificMajor == -1 or getVerPart(s, "major") == specificMajor:
            if getVerPart(s, "major") > getVerPart(highest, "major"):
                highest = s
            
            if getVerPart(s, "major") == getVerPart(highest, "major"):
                if getVerPart(s, "minor") > getVerPart(highest, "minor"):
                    highest = s
                
                if getVerPart(s, "minor") == getVerPart(highest, "minor"):
                    if getVerPart(s, "patch") > getVerPart(highest, "patch"):
                        highest = s

    return highest


xinvalid = re.compile(r'\\x([0-9a-fA-F]{2})')

def fix_xinvalid(m):
    return chr(int(m.group(1), 16))

def fix(s):
    return xinvalid.sub(fix_xinvalid, s)

def downloadDirHandler(conn, commandRec, key, dir, shouldIncludeFinalFolder=True, isPackage=False, packageName=None):
    print("Client would like to download " + dir)
    for root, directories, filenames in os.walk(dir):
        for directory in directories:

            directory_path = os.path.join(root, directory)

        for filename in filenames:

            file_path = os.path.join(root,filename).replace("\\", "/")
            if shouldIncludeFinalFolder:
                filePathModifier = os.path.dirname(file_path)
                filePathModifier = filePathModifier[len(os.path.dirname(dir))+1:] + "/"
            else:
                filePathModifier = ""
            downloadFileHandler(conn, {"data":{"filePath":file_path, "windowID":-1, "filePathModifier":commandRec["data"]["filePathModifier"] + filePathModifier}}, key)
    if isPackage:
        dataToSend = encryption.encrypt(json.dumps({"CMDType":"packageDownloadComplete", "payload": {"package":packageName}}), key)
        Packet.Packet(dataToSend,"__CMD__").send(conn, -1)

def downloadFileHandler(conn, commandRec, key):
    print("Client has requested to download " + commandRec["data"]["filePath"])
    file = open(commandRec["data"]["filePath"], "rb")
    fileName = commandRec["data"]["filePath"][::-1][:commandRec["data"]["filePath"][::-1].find("/")][::-1]
    fileLength = os.stat(commandRec["data"]["filePath"]).st_size

    try:
        filePathModifier = commandRec["data"]["filePathModifier"]
    except:
        filePathModifier = "NONE"

    fileData = file.read(2000000)
    index = 0
    packetIndex = 0
    while index < fileLength: 
        fileDataB64 = base64.b64encode(fileData).decode("ascii")
        dataToSend = encryption.encrypt(json.dumps({"CMDType":"downloadFileChunk", "payload":{"file":fileDataB64, "index": index, "packetIndex": packetIndex, "length": fileLength, "filePath":commandRec["data"]["filePath"], "fileName": fileName, "filePathModifier":filePathModifier, "windowID":commandRec["data"]["windowID"]}}), key)
        
        Packet.Packet(dataToSend,"__CMD__").send(conn, commandRec["data"]["windowID"])

        fileTransferProgressFunction(index, fileLength, key, {"conn":conn, "windowID":commandRec["data"]["windowID"]})

        fileData = file.read(2000000)
        index = index + 2000000
        packetIndex += 1
    
    fileTransferProgressFunction(index, fileLength, key, {"conn":conn, "windowID":commandRec["data"]["windowID"]})
    dataToSend = encryption.encrypt(json.dumps({"CMDType":"fileTransferComplete", "payload": {"fileName":fileName, "finalPacketIndex":packetIndex, "filePathModifier":filePathModifier}}), key)
    Packet.Packet(dataToSend,"__CMD__").send(conn, commandRec["data"]["windowID"])

def packetHandler(packetRec, key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue, username):
    if packetRec.type == "__LPW__":
        LPWPacketRec = json.loads(packetRec.body)
        if not LPWPacketRec["LPWID"] in LPWPackets:
            LPWPackets[LPWPacketRec["LPWID"]] = {}

        LPWPackets[LPWPacketRec["LPWID"]][LPWPacketRec["index"]] = LPWPacketRec["LPWPayload"]
        if (len(LPWPackets[LPWPacketRec["LPWID"]]) >= LPWPacketRec["len"]):
            completeLPWPayload = ""
            i = 0
            while i < len(LPWPackets[LPWPacketRec["LPWID"]]):
                completeLPWPayload += LPWPackets[LPWPacketRec["LPWID"]][i]
                i += 1
            loadedPacket = {}
            try:
                loadedPacket = json.loads(completeLPWPayload, strict = False)
            except Exception as e:
                print("LPW Packet Load Error!")
                print(e)
            hasUserAuthenticated, LPWPackets, fileWriteQueue, username = packetHandler(Packet.Packet( loadedPacket["payload"], loadedPacket["packetType"], conn), key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue, username)

    if packetRec.type == "__CMD__":
        commandRec = encryption.decrypt(packetRec.body, key)
        commandRecOrig = commandRec
        commandRec = "".join(commandRec)
        #print("COMMAND RECEIVED!")
        #print(commandRec)

        try:
            commandRec = json.loads(commandRec)
        except:
            try:
                commandRec = json.loads(packetRec.body)
                print("COMMAND WAS NOT ENCRYPTED")
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
        
        print(commandRec["CMDType"])
        
        if commandRec["CMDType"] == "login":
            try:
                userCredentials = json.loads(commandRec["data"])
            except TypeError:
                userCredentials = commandRec["data"]
            hasUserAuthenticated = check_user_passhash(userCredentials["username"], userCredentials["password"])
            dataToSend = encryption.encrypt(json.dumps({"CMDType":"AuthResult", "data":hasUserAuthenticated}), key)
            Packet.Packet(dataToSend,"__CMD__").send(conn)
            username = userCredentials["username"]

        if hasUserAuthenticated:
            
            if commandRec["CMDType"] == "updateSubbedPackages":
                computers[json.loads(commandRec["data"])["computerName"]]["subbedPackages"] = json.loads(commandRec["data"])["subbedPackages"]
                writeComputersToDisk()

            if commandRec["CMDType"] == "installPackage":
                commandRec["data"] = json.loads(commandRec["data"])
                computers[commandRec["data"]["computerName"]]["subbedPackages"][commandRec["data"]["package"]] = {"specificMajor":-1, "version":"0.0.0"}
                writeComputersToDisk()

            if commandRec["CMDType"] == "downloadPackageList":
                dataToSend = encryption.encrypt(json.dumps({"CMDType":"avaliablePackages", "data":packages}), key)
                Packet.Packet(dataToSend,"__CMD__").send(conn)

            if commandRec["CMDType"] == "checkForPackageUpdates":
                packagesToUpdate = {}
                index = 0
                for s in computers[commandRec["data"]["computerName"]]["subbedPackages"]:
                    usersCurrentVersion = computers[commandRec["data"]["computerName"]]["subbedPackages"][s]["version"]
                    usersSpecificMajor = computers[commandRec["data"]["computerName"]]["subbedPackages"][s]["specificMajor"]
                    highestVersion = getHighestVersion(packages[s]["versions"], computers[commandRec["data"]["computerName"]]["subbedPackages"][s]["specificMajor"])
                    print("Checking " + str(s) + " for updates. user: " + str(usersCurrentVersion) + " specificMajor: " + str(usersSpecificMajor) + " highest: " + str(highestVersion))
                    if compareGreaterVersion(highestVersion, usersCurrentVersion):
                        print("     Found updated version!")
                        packagesToUpdate[index] = {"package":s, "currentVersion":usersCurrentVersion, "newVersion":highestVersion}
                        index = index + 1
                        
                if len(packagesToUpdate) > 0:
                    dataToSend = encryption.encrypt(json.dumps({"CMDType":"avaliablePackageUpdates", "data":packagesToUpdate}), key)
                    Packet.Packet(dataToSend,"__CMD__").send(conn)

            if commandRec["CMDType"] == "downloadPackage":
                commandRec["data"] = json.loads(commandRec["data"])
                downloadDirHandler(conn, {"data":{"filePathModifier":packages[commandRec["data"]["package"]]["dataDir"]}}, key, programInstallDirectory[:-1] + packages[commandRec["data"]["package"]]["dataDir"] + commandRec["data"]["version"], False, True, commandRec["data"]["package"])
                computers[commandRec["data"]["computerName"]]["subbedPackages"][commandRec["data"]["package"]]["version"] = commandRec["data"]["version"]
                writeComputersToDisk()

            if commandRec["CMDType"] == "downloadDir":
                downloadDirHandler(conn, commandRec, key, commandRec["data"]["filePath"])

            if commandRec["CMDType"] == "setData":
                print("Set Data", commandRec["name"],"=",commandRec["value"])
                value = commandRec["value"]
                if commandRec["dataType"] == "str":
                    value = str(value)
                elif commandRec["dataType"] == "int":
                    value = int(value)
                elif commandRec["dataType"] == "float":
                    value = float(value)
                elif commandRec["dataType"] == "list":
                    value = list(value)

                globalCache[commandRec["name"]] = value

                print(globalCache)
            
            elif commandRec["CMDType"] == "getData":
                if commandRec["name"] in globalCache:
                    value = globalCache[commandRec["name"]]
                else:
                    value = ""
                data = {"packetType":"__DAT__","payload":value}
                encr = encryption.encrypt(json.dumps(data), key)
                Packet.Packet(encr, "__DAT__").send(conn)

            if commandRec["CMDType"] == "uploadFileFinish":
                if fileWriteQueue[commandRec["data"]["filePath"]]["index"] >= commandRec["data"]["finalPacketIndex"]:
                    print("Write of " + commandRec["data"]["filePath"] + " Complete! Took " + str(millis(fileWriteQueue[commandRec["data"]["filePath"]]["startTime"])) + " Milliseconds")
                    fileWriteQueue[commandRec["data"]["filePath"]]["fileReference"].close()
                    fileWriteQueue[commandRec["data"]["filePath"]] = None
                else:
                    fileWriteQueue[commandRec["data"]["filePath"]]["finalPacketIndex"] = commandRec["data"]["finalPacketIndex"]

            
            if commandRec["CMDType"] == "downloadFile":
                threading.Thread(target=downloadFileHandler, args=(conn, commandRec, key)).start()

            if commandRec["CMDType"] == "requestMOTD":
                print("Sending the client the MOTD")
                dataToSend = encryption.encrypt(json.dumps({"CMDType":"updateMOTD", "data":MOTD}), key)
                dataToSendDecrypt = encryption.decrypt(dataToSend, key)
                Packet.Packet(dataToSend,"__CMD__").send(conn)

            if commandRec["CMDType"] == "uploadFile":
                if not os.path.exists(os.path.dirname(commandRec["data"]["filePath"])):
                    try:
                        os.makedirs(os.path.dirname(commandRec["data"]["filePath"]))
                    except OSError as exc: # Guard against race condition
                        if exc.errno != errno.EEXIST:
                            raise

                if not commandRec["data"]["filePath"] in fileWriteQueue:
                    fileWriteQueue[commandRec["data"]["filePath"]] = {"index":0, "outOfOrderPackets":{}, "startTime": datetime.now()}
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
                filesDataToSend = []
                commandData = commandRec["data"]
                directory = os.listdir(commandData["path"])
                for s in directory:
                    fileData = {"name":s,"size":os.stat(commandRec["data"]["path"] + s).st_size}
                    filesDataToSend.append(fileData)
                
                dataToSend = encryption.encrypt(json.dumps({"CMDType":"updateFiles", "data":{"files":filesDataToSend, "window":commandData["windowID"], "path": commandRec["data"]["path"]}}), key)
                Packet.Packet(dataToSend,"__CMD__").send(conn)

    return hasUserAuthenticated, LPWPackets, fileWriteQueue, username



def connectionHandler(conn, addr):
    doHandshake(conn, addr)
    key = doKeyExchange(conn)

    hasUserAuthenticated = False
    LPWPackets = {}
    fileWriteQueue = {}
    username = ""

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
                    hasUserAuthenticated, LPWPackets, fileWriteQueue, username = packetHandler(packet, key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue, username)
                except ValueError:
                    #print("VALUE ERROR!")
                    if (i == 0):
                        #print(s)
                        s = str(partialPacket) + str(s)
                        try:
                            v = json.loads(s)
                            #print("JSON Load Complete Single Exception Mode")
                            packet = Packet.Packet(v["payload"], v["packetType"], conn)
                            hasUserAuthenticated, LPWPackets, fileWriteQueue, username = packetHandler(packet, key, hasUserAuthenticated, conn, LPWPackets, fileWriteQueue, username)
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