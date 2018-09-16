import socket
import threading

import keyExchange

import primes as Primes
import dataOverStream as DataStream

serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 4242
hostName = ""

serverSocket.bind((hostName, port))

def doHandshake(conn, addr):
    conn.sendall(bytearray([3,1,4,1,5]))

    data = conn.recv(5)

    if list(data) == [3,1,4,1,5]:
        print ("Handshake with " + str(addr[0]) + " sucessful!")
    else:
        print ("Handshake with " + str(addr[0]) + " failed!")

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

def connectionHandler(conn, addr):
    print ("Connection Recieved From " + str(addr[0]))

    doHandshake(conn, addr)
    doKeyExchange(conn)

def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()

startListener(serverSocket)