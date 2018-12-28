"""
    ACELib (AMPS Client Environment Library)

    A library to allow any process to supply data to an official AMPS Server
"""

import socket

import keyExchange

import encryption

import packet as Packet
import dataOverString as DataString

import json

import ACEExceptions as ACEE


class Connection:
    """
        Connection class wraps the connection to an AMPS Server
    """
    def __init__(self, host="", port=4242):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        self.host = host
        self.port = port

        self.key = 0

    def connect(self):
        """
            Connects to the AMPS Server, and initalizes the connection
        """
        self.socket.connect((self.host, self.port))

    def recievePacketVerify(self, encrypted=False):
        """
            Gets a packet from the server, and verifies it is of the correct
            format
        """
        if not encrypted:
            rawPacketData = Packet.readPacket(self.socket)
            if not rawPacketData.endswith("-ENDACROFTPPACKET-/"):
                raise ACEE.BadPacketException("Corrupted Packet")

            rawPacketData = rawPacketData[:-19]
        else:
            encryptedPacket = Packet.readPacket(self.socket)
            if not encryptedPacket.endswith("-ENDACROFTPPACKET-/"):
                raise ACEE.BadPacketException("Corrupted Packet")
            encryptedPacket = encryptedPacket[:-19]

            jsonPart = json.loads(encryptedPacket)["payload"]

            rawPacketData = encryption.decrypt(jsonPart, self.key)

        packetDataJSON = json.loads(rawPacketData)

        return packetDataJSON

    def recievePacketType(self, packetType,
                          exception=ACEE.BadPacketTypeException(),
                          encrypted=False):
        """
            Gets a packet from the server, and checks that it is of the
            correct type
        """
        packet = self.recievePacketVerify(encrypted)

        if packet['packetType'] == packetType:
            return packet

        raise exception

    def handshake(self):
        """
            Performs the standard handshake with an AMPS Server
        """
        packet = self.recievePacketVerify()

        if packet['packetType'] == '__HDS__' and packet['payload'] == '31415':
            Packet.Packet('31415', "__HDS__").send(self.socket)
        else:
            raise ACEE.BadHandshakeException("Handshake not formated well")

    def getKey(self):
        """
            Performs the other half of the key exchange, resulting in the
            sharing of keys between the AMPS Server and client
        """
        primeError = (ACEE.
                      BadPacketTypeException("Prime Packet has Bad Type"))
        mixedError = (ACEE.BadPacketTypeException("Mixed Secret has Bad Type"))

        primePacket1 = self.recievePacketType('__DAT__', primeError)
        primePacket2 = self.recievePacketType('__DAT__', primeError)

        primePacketData1 = primePacket1['payload'][2:]
        primePacketData2 = primePacket2['payload'][2:]

        primes = [DataString.convertDataToInt(primePacketData1),
                  DataString.convertDataToInt(primePacketData2)]

        exchange = keyExchange.KeyExchange(primes)
        exchange.randomSecret()

        mixed = exchange.calculateMixed()

        otherMixedPacket = self.recievePacketType('__DAT__', mixedError)
        otherMixed = (DataString.
                      convertDataToInt(otherMixedPacket['payload'][2:]))

        key = exchange.getSharedKey(otherMixed)

        mixedPacket = Packet.Packet("00" + DataString.convertIntToData(mixed))
        mixedPacket.send(self.socket)

        return key

    def initConnection(self):
        """
            Does the initalization of the connection with the server
            Does the connection, handshake, and the keyexchange
        """
        self.connect()
        self.handshake()
        self.key = self.getKey()

    def sendEncrypted(self, packetBody, packetType):
        """
            Sends encrypted data over the connection
        """
        Packet.Packet(encryption.encrypt(packetBody, self.key),
                      packetType).send(self.socket)

    def sendEncryptedDict(self, dictionary, dataType):
        """
            Converts a dictionary to a JSON object, and sends that over an
            encrypted connection
        """
        jsonObject = json.dumps(dictionary)

        self.sendEncrypted(jsonObject, dataType)

    def setData(self, name, value, dataType="str"):
        """
            Sets data in the cache on the server

            Specificly, sets the data under name to value
        """
        self.sendEncryptedDict({"CMDType": "setData",
                                "name": name,
                                "value": value,
                                "dataType": dataType}, "__CMD__")

    def getData(self, name):
        """
            Gets data by name from the server
        """
        self.sendEncryptedDict({"CMDType": "getData",
                                "name": name}, "__CMD__")

        data = self.recievePacketType("__DAT__", encrypted=True)
        return data["payload"]