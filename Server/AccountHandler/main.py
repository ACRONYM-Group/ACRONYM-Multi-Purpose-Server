import json
import hashlib
import random

import enums

DATA_FILE_PATH = "CHANGE THIS PATH"

global_data = {'account_database': True, 'data': {}}


def import_data(filename=DATA_FILE_PATH):
    global global_data

    try:
        file_object = open(filename, 'r')

        global_data = json.loads(file_object.read())
    except FileNotFoundError:
        export_data(filename)


def export_data(filename=DATA_FILE_PATH):
    file_object = open(filename, 'w')

    string_type_data = json.dumps(global_data)
    file_object.write(string_type_data)


def verify_global_data():
    assert('account_database' in global_data)
    assert(global_data['account_database'])


def check_credentials(username, password_hash):
    if username not in global_data["data"]:
        return enums.BAD_USERNAME

    stored_hash = global_data["data"][username]["hash"]
    salt = global_data["data"][username]["salt"]

    result = hashlib.sha3_256((str(password_hash) + str(salt)).encode()).hexdigest()

    if result == stored_hash:
        return enums.LOGIN_SUCCESSFUL

    return enums.BAD_PASSWORD


def add_credentials(username, password_hash):
    salt = hex(random.randint(0, 100000000000000000000000000000000000000000))[2:]

    store_hash = hashlib.sha3_256((str(password_hash) + str(salt)).encode()).hexdigest()

    global_data["data"][username] = {'hash': store_hash, 'salt': salt}


class ExportWrapper:
    def __init__(self):
        pass

    def __enter__(self):
        import_data(DATA_FILE_PATH)

    def __exit__(self, exc_type, exc_val, exc_tb):
        export_data(DATA_FILE_PATH)

