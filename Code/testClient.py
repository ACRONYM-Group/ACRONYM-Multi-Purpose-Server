import socket

clientSocket = socket.socket(socket.AF_INET, socket.SOCK_STEREAM)

clientSocket.connect(("127.0.0.1", 4242))

print(clientSocket.recv(1024))