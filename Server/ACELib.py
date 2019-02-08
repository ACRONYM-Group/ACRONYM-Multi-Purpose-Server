"""
    ACELib (AMPS Client Environment Library)

    A library to allow any process to supply data to an official AMPS Server
"""

import socket

import json
import base64

import hashlib

import threading

import keyExchange

import encryption

import packet as Packet
import dataOverString as DataString

import ACEExceptions as ACEE


class Connection:
    """
        Connection class wraps the connection to an AMPS Server
    """
    def __init__(self, host="127.0.0.1", port=4242):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        self.host = host
        self.port = port

        self.key = 0

        self.callBacks = {}

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

        rawPacketData = "".join(rawPacketData)

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

    def loginServer(self, username, password):
        """
            Starts the login process with the AMPS server
        """
        password = hashlib.sha3_256(password.encode()).hexdigest()

        self.sendEncryptedDict({"CMDType": "login",
                                "data": {"username": username,
                                         "password": password}},
                               "__CMD__")

        result = self.recievePacketVerify(encrypted=True)

        return result["data"]

    def downloadFile(self, fileName, fileObject):
        """
            Downloads the file with the given filename on the server,
            and outputs it to the (binary, must be binary) file stored in
            fileObject
        """
        self.sendEncryptedDict({"CMDType": "downloadFile",
                                "data":{"filePath": fileName,
                                        "windowID": -42,
                                        "filePathModifier":""}}, "__CMD__",)

        encryptedData = "".join(Packet.getPacket(self.socket)['payload'])
        data = json.loads("".join(encryption.decrypt(encryptedData, self.key)))["payload"]["file"]

        fileObject.write(base64.b64decode(data))

    def runLibraryFunction(self, libraryName, functionName, arguments):
        self.sendEncryptedDict({"CMDType": "libraryFunction",
                                "data":{"library": libraryName,
                                        "function": functionName,
                                        "arguments":arguments}}, "__CMD__",)

    def uploadFile(self, fileObject, fileName):
        """
            Uploads the data from the fileObject and stores it in the file
            designated by fileName
        """
        self.sendEncryptedDict({"CMDType": "uploadFile",
                                "data":{"filePath": fileName,
                                        "index": 0,
                                        "file":base64.b64encode(
                                            fileObject.read()
                                            ).decode("ascii")}}, "__CMD__")

    def addListener(self, key, callBack):
        """
            Adds an event listener on the server to respond to the variable in
            key being updated, upon it being updated callBack will be called, with
            two parameters, the first being the new value, and the second, the old
            value.
        """
        self.callBacks[key] = callBack

        self.sendEncryptedDict({"CMDType": "subscribeToEvent",
                                "data":{"dataTitle": key}}, "__CMD__")
  
    def _listener(self):
        generator = Packet.fullGenerator(self.socket)
        while True:
            packet = json.loads("".join(encryption.
                                        decrypt(next(generator)['payload'],
                                                self.key)))

            self.callBacks[packet["payload"]["key"]](
                packet["payload"]["newValue"],
                packet["payload"]["oldValue"])

    def startListener(self):
        """
            Starts the event loop, while this occurs in a seperate thread and code
            can be run after this is called, it is still recomended to call this
            at the end of a file.
        """
        threading.Thread(target=self._listener, args=()).start()

