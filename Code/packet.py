"""
Packet Types

__RAW__     Raw Text
__CMD__     Command
__HDS__     Handshake
__DAT__     Raw Data (Binary)
"""

class Packet:
    def __init__(self, body, packetType="__RAW__", connection = None):
        self.connection = connection

        self.body = body
        self.type = packetType

    def send(self, conn=None):
        if conn == None:
            conn = self.connection

        data = ""

        data += "packet{"
        data += "packetType: "
        data += self.type
        data += " payloadLength: "
        data += str(len(self.body))
        data += " payload: "
        data += self.body
        data += "}"

        data = data.encode()

        conn.send(data)
