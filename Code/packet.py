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
import struct

class Packet:
    def __init__(self, body, packetType="__RAW__", connection = None):
        self.connection = connection

        self.body = body
        self.type = packetType

    def send(self, conn=None, windowID = None):
        LPWID = time.clock()
        if conn == None:
            conn = self.connection

        data = {"packetType": self.type, "payload":self.body}

        data = json.dumps(data)
        LPWPacketLength = 2048
        if (len(data) <= LPWPacketLength):
            dataToSend = data.encode() + "-ENDACROFTPPACKET-/".encode()
            conn.sendall(dataToSend)

        if (len(data) > LPWPacketLength):
            numberOfLPWPackets = math.ceil(len(data)/LPWPacketLength)
            i = 0
            currentDataIndex = 0
            while currentDataIndex < len(data):
                i = i + 1
                LPWPayload = data[currentDataIndex:currentDataIndex + LPWPacketLength]
                LargePacketWrapper = {"packetType":"__LPW__", "LPWID": LPWID, "len": numberOfLPWPackets, "ind": i, "windowID":windowID, "payload":LPWPayload}
                currentDataIndex = currentDataIndex + LPWPacketLength
                dataToSend = json.dumps(LargePacketWrapper).encode()
                dataToSend = dataToSend + "-ENDACROFTPPACKET-/".encode()
                conn.sendall(dataToSend)

        

    def __repr__(self):
        return "self.body = " + '"' + str(self.body) + '"\n' + "self.type = " + '"' + str(self.type) + '"'

def readPacket(connection):
    data = connection.recv(4096000)
    
    try:
        data = data.decode()
    except:
        data2 = connection.recv(4096000)
        data += data2
        data = data.decode()
    return data



    