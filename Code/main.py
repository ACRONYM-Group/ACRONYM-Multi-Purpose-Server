import socket
import threading

import keyExchange

import primes as Primes
import dataOverStream as DataStream

import encryption

import packet as Packet

serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 4242
hostName = ""

serverSocket.bind((hostName, port))

def doHandshake(conn, addr):
    conn.sendall(bytearray([3,1,4,1,5]))

    data = list(conn.recv(5))

    if list(data) == [3,1,4,1,5]:
        print ("Handshake with " + str(addr[0]) + " sucessful!")
    else:
        print ("Handshake with " + str(addr[0]) + " failed!")
        print (str(bytearray(data)))
        print (data)

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

    with DataStream.DataStreamOut(conn) as stream:
        stream.sendData(DataStream.DATA_TYPE_LONG, primePair[0])
        stream.sendData(DataStream.DATA_TYPE_LONG, primePair[1])
        stream.sendData(DataStream.DATA_TYPE_LONG, mixed)

    with DataStream.DataStreamIn(conn) as stream:
        otherMixed = stream.getData(DataStream.DATA_TYPE_LONG)

    key = exchange.getSharedKey(otherMixed)

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

    Packet.Packet('31415', "__HDS__").send(conn)

    print (Packet.readPacket(conn))

    conn.close()

def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()

startListener(serverSocket)