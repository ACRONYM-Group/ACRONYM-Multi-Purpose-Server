import socket
import threading

import keyExchange
import errno

import primes as Primes
import dataOverStream as DataStream

import encryption
import re

import packet as Packet
import dataOverString as DataString

import time
import json

import platform
import os

import base64
import math

from datetime import datetime
from datetime import timedelta

import hashlib

import AccountHandler


programStartTime = datetime.now()
OSName = platform.platform()

programInstallDirectory = "Z:/AcroFTP/"

AccountHandler.DATA_FILE_PATH = programInstallDirectory + "\\data\\data.json"
AccountHandler.import_data()

AccountHandler.add_credentials("carter", hashlib.sha3_256("password".encode()).hexdigest())

AccountHandler.export_data()

users_data = None
packages_data = None
computers_data = None

server_socket = None

port = 4242
host_name = ""

global_cache = {}

def check_user_passhash(username, password_hash):
    SUCCESS = AccountHandler.enums.LOGIN_SUCCESSFUL
    result = AccountHandler.check_credentials(username, password_hash)
    if result == SUCCESS:
        return True

    return False


def read_data_files():
    global users_data
    global packages_data
    global computers_data
    
    try:
        with open(programInstallDirectory + "Data/users.json","r") as f:
            contents = f.read()
        users_data = json.loads(contents)
        print("Successfully loaded data for " + str(len(users_data)) + " Users...")

    except Exception as error:
        print("FAILED TO LOAD USER DATA!")
        print(error)

    try:
        with open(programInstallDirectory + "Data/packages.json","r") as f:
            contents = f.read()
        packages_data = json.loads(contents)
        print("Successfully loaded data for " + str(len(packages_data)) + " Packages...")

    except Exception as error:
        print("FAILED TO LOAD PACKAGE DATA!")
        print(error)


    try:
        with open(programInstallDirectory + "Data/computers.json","r") as f:
            contents = f.read()
        computers_data = json.loads(contents)
        print("Successfully loaded data for " + str(len(computers_data)) + " Computers...")

    except Exception as error:
        print("FAILED TO LOAD COMPUTER DATA!")
        print(error)
     

def initalize_connection():
    global server_socket

    print("Connecting to address " + str(host_name) + ":" + str(port))
      
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host_name, port))


def dump_data():
    f = open(programInstallDirectory + "Data/users.json", "w")
    f.write(json.dumps(users_data))
    f = open(programInstallDirectory + "Data/computers.json", "w")
    f.write(json.dumps(computers_data))


def file_download_process(packet):
    file_name = packet["data"]["filePath"]


class ClientConnection:
    def __init__(self, connection, address):
        self.connection = connection
        self.address = address

        self.packet_recieve_generator = Packet.fullGenerator(self.connection)

        self.shared_key = None
        self.authenticated = False

        self.username = ""

    def perform_handshake(self):
        Packet.Packet('31415', "__HDS__").send(self.connection)

        data = next(self.packet_recieve_generator)

        if data["payload"] == "31415":
            print ("Handshake with " + str(self.address[0]) + " sucessful!")
            return True
        else:
            print ("Handshake with " + str(self.address[0]) + " failed!")
            print ("Responce Recieved: ")
            print (data)
            return False

    def perform_key_exchange(self):
        primePair = Primes.getPrimePair()
        exchange = keyExchange.KeyExchange(primePair)
        exchange.randomSecret()

        mixed = exchange.calculateMixed()


        Packet.Packet(chr(0) + chr(1) + DataString.convertIntToData(primePair[0]),"__DAT__").send(self.connection)
        time.sleep(0.1)
        Packet.Packet(chr(0) + chr(2) + DataString.convertIntToData(primePair[1]),"__DAT__").send(self.connection)
        time.sleep(0.1)
        Packet.Packet(chr(0) + chr(3) + DataString.convertIntToData(mixed),"__DAT__").send(self.connection)

        packet = next(self.packet_recieve_generator)

        val = DataString.convertDataToInt(packet["payload"][2:])

        self.shared_key = exchange.getSharedKey(val)

    def connection_handler(self):
        self.perform_handshake()
        self.perform_key_exchange()

        print(self.shared_key)

        while True:
            packet = next(self.packet_recieve_generator)

            #If the packet is a command, it is encrypted, so decrypt that quick
            if packet["packetType"] == "__CMD__":
                packet = encryption.decrypt(packet["payload"], self.shared_key)
                packet = "".join(packet)

                try:
                    packet = json.loads(packet)
                except TypeError as e:
                    print("Packet Unable to be parsed")
                    print(packet)
                    continue

            self.process_packet(packet)

    def process_packet(self, packet):
        if packet["CMDType"] == "login":
            try:
                userCredentials = json.loads(packet["data"])
            except TypeError:
                userCredentials = packet["data"]
            
            self.authenticated = check_user_passhash(userCredentials["username"], userCredentials["password"])

            dataToSend = encryption.encrypt(json.dumps({"CMDType":"AuthResult", "data":self.authenticated}), self.shared_key)
            Packet.Packet(dataToSend, "__CMD__").send(self.connection)
            self.username = userCredentials["username"]

            print(self.username + " has attempted to login: " + str(self.authenticated))
        
        elif packet["CMDType"] == "setData":
            print("Set Data", packet["name"], "=", packet["value"])
            value = packet["value"]

            global_cache[packet["name"]] = value

            print(global_cache)
        
        elif packet["CMDType"] == "getData":
            if packet["name"] in global_cache:
                value = global_cache[packet["name"]]
            else:
                value = ""
            
            data = {"packetType":"__DAT__","payload":value}
            encr = encryption.encrypt(json.dumps(data), self.shared_key)
            Packet.Packet(encr, "__DAT__").send(self.connection)

        elif packet["CMDType"] == "downloadFile":
            threading.Thread(target=file_download_process, args=(packet,)).start()


def listener():
    while True:
        server_socket.listen(1)
        conn, addr = server_socket.accept()

        connection = ClientConnection(conn, addr)

        threading.Thread(target=connection.connection_handler, args=()).start()


def start_listener():
    threading.Thread(target=listener, args=()).start()
       
if __name__ == "__main__":
    read_data_files()
    initalize_connection()

    start_listener()
