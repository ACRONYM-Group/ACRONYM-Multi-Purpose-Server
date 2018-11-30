"""
Packet Types

__RAW__     Raw Text
__CMD__     Command
__HDS__     Handshake
__DAT__     Raw Data (Binary)
__LPW__     Large Packet Wrapper
"""

import json
import math
import time

class Packet:
    def __init__(self, body, packetType="__RAW__", connection = None):
        self.connection = connection

        self.body = body
        self.type = packetType

    def send(self, conn=None):
        if conn == None:
            conn = self.connection

        data = {"packetType": self.type, "payload":self.body}

        data = json.dumps(data)
        LPWPacketLength = 700
        if (len(data) <= LPWPacketLength):
            conn.sendall(data.encode())
            conn.sendall("\-ENDACROFTPPACKET-/".encode())

        if (len(data) > LPWPacketLength):
            numberOfLPWPackets = math.ceil(len(data)/LPWPacketLength)
            i = 0
            while len(data) > 0:
                i = i + 1
                LPWPayload = data[:LPWPacketLength]
                LargePacketWrapper = {"packetType":"__LPW__", "len": numberOfLPWPackets, "ind": i, "payload":LPWPayload}
                data = data[LPWPacketLength:]
                dataToSend = json.dumps(LargePacketWrapper).encode()
                #print("Sending:")
                #print(LargePacketWrapper)
                #print(" ")
                conn.sendall(dataToSend)
                #time.sleep(1)
                conn.sendall("\-ENDACROFTPPACKET-/".encode())

        

    def __repr__(self):
        return "self.body = " + '"' + str(self.body) + '"\n' + "self.type = " + '"' + str(self.type) + '"'

def readPacket(connection):
    data = connection.recv(1024)
    data = data.decode()

    data = json.loads(data)

    return Packet(data["payload"], data["packetType"], connection)