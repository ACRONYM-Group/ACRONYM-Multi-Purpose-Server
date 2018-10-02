"""
Packet Types

__RAW__     Raw Text
__CMD__     Command
__HDS__     Handshake
__DAT__     Raw Data (Binary)
"""

import json

class Packet:
    def __init__(self, body, packetType="__RAW__", connection = None):
        self.connection = connection

        self.body = body
        self.type = packetType

    def send(self, conn=None):
        if conn == None:
            conn = self.connection

        data = {"packetType": self.type, "payload":self.body}

        data = json.dumps(data).encode()

        conn.sendall(data)

    def __repr__(self):
        return "self.body = " + '"' + str(self.body) + '"\n' + "self.type = " + '"' + str(self.type) + '"'

def readPacket(connection):
    data = connection.recv(1024)
    data = data.decode()

    data = json.loads(data)

    return Packet(data["payload"], data["packetType"], connection)