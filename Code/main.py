import socket
import threading

import keyExchange

import primes as Primes
import dataOverStream as DataStream

import encryption

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

    doHandshake(conn, addr)
    key = doKeyExchange(conn)

    connectionAlive = True

    while connectionAlive:
        command = readEncrypted(conn, key)

        if command == "END_COMMS":
            connectionAlive = False

        if command == "LOGIN":
            sendEncrypted(conn ,"GO" ,key)
            username = readEncrypted(conn, key)
            sendEncrypted(conn ,"GO" ,key)
            passwordHash = readEncrypted(conn, key)

            print ("Got Username: " + str(username))
            print ("Got Password: " + str(passwordHash))

            if not checkUserPass(username, passwordHash):
                conn.close()
                connectionAlive = False

    conn.close()

def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()

startListener(serverSocket)