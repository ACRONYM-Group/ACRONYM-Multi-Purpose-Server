import socket

clientSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

clientSocket.connect(("127.0.0.1", 4242))

data = list(clientSocket.recv(1024))

clientSocket.sendall(bytearray([3,1,4,1,5]))