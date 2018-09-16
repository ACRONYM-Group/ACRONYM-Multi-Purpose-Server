import socket
import threading

import keyExchange

import primes as Primes

serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

port = 4242
hostName = ""

serverSocket = socket.bind((hostName, port))

def doHandshake(conn):
    conn.sendall([3,1,4,1,5])

    data = conn.recv(5)

    print (data)

def connectionHandler(conn, addr):
    print ("Connection Recieved From " + str(addr))

    doHandshake(conn)

def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn,addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args=(sock,)).start()
