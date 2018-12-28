"""
    ACELib (AMPS Client Environment Library)

    A library to allow any process to supply data to an official AMPS Server
"""

import socket
import threading

import keyExchange

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

from datetime import datetime, timedelta


class Connection:
    """
        Connection class wraps the connection to an AMPS Server
    """
    def __init__(self, host="", port=4242):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        self.host = host
        self.port = port

    def connect(self):
        """
            Connects to the AMPS Server, and initalizes the connection
        """

        self.socket.connect((self.host, self.port))
