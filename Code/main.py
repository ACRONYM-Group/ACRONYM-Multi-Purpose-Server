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

OSName = platform.platform()
print("Current Software Platform: " + OSName)

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

def doHandshake(conn, addr):
    Packet.Packet('31415', "__HDS__").send(conn)

    data = Packet.readPacket(conn)

    if data.body == "31415":
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

    packet = Packet.readPacket(conn)

    val = DataString.convertDataToInt(packet.body[2:])

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

def connectionHandler(conn, addr):
    print ("Connection Recieved From " + str(addr[0]))

    doHandshake(conn, addr)
    key = doKeyExchange(conn)

    print(encryption.decrypt(chr(205), key))

    while True:
        packetRec = Packet.readPacket(conn)
        if packetRec.type == "__CMD__":
            print("Client sent Command, decrypting...")
            commandRec = encryption.decryptWrapper(packetRec.body, key)
            print("Decrypted Command: " + commandRec)

            commandRec = json.loads(commandRec)

            if commandRec["CMDType"] == "requestMOTD":
                print("Sending the client the MOTD")
                dataToSend = encryption.encryptWrapper(json.dumps({"CMDType":"updateMOTD", "data":MOTD}), key)
                print(" ")
                print("Data to send and data to send Decrypt:")
                print(dataToSend)
                dataToSendDecrypt = encryption.decryptWrapper(dataToSend, key)
                print(dataToSendDecrypt)
                Packet.Packet(dataToSend,"__CMD__").send(conn)




def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()

startListener(serverSocket)