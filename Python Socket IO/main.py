import socket
import threading

hostingSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

host = ""
port = 80

hostingSocket.bind((host, port))

def connectionHandler(conn, addr):
    print ("Got Connection From: " + str(addr[0])))

    data = conn.recv(4096)

    while data != "":
        print (data)

        data = conn.recv(4096)

    conn.close()

    print ("Connection with " + str(addr[0]) + " closed")

def listener(sock):
    while True:
        sock.listen(1)
        conn, addr = sock.accept()

        threading.Thread(target=connectionHandler, args=(conn, addr)).start()

def startListener(sock):
    threading.Thread(target=listener, args = (sock,)).start()

startListener(hostingSocket)