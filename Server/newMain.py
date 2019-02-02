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

def check_user_passhash(username, password_hash):
    SUCCESS = AccountHandler.enums.LOGIN_SUCCESSFUL
    result = AccountHandler.check_credentials(username, password_hash)
    if result == SUCCESS:
        return True

    return False
