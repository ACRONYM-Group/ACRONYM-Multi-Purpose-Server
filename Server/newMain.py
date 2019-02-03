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

users_data = None
packages_data = None
computers_data = None

server_socket = None

port = 4242
host_name = ""


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
    f = open(programInstallDirectory + "Data/users.json","w")
    f.write(json.dumps(users_data))
    f = open(programInstallDirectory + "Data/computers.json","w")
    f.write(json.dumps(computers_data))


class ClientConnection:
    def __init__(self, connection, address):
        self.connection = connection
        self.address = address

        self.packet_recieve_generator = Packet.fullGenerator(self.connection)

        self.shared_key = None

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

    def connection_handler(self):
        self.perform_handshake()


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
