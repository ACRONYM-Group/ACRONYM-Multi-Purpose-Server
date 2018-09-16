DATA_TYPE_BYTE = 0      #1 Byte
DATA_TYPE_SHORT = 1     #2 Bytes
DATA_TYPE_STRING = 2    #n Bytes
DATA_TYPE_LONG = 3       #4 Bytes

class DataStream:
    def __init__(self, conn, header = None, ending = None):
        self.conn = conn

        self.header = header
        self.ending = ending

    def __enter__(self):
        if self.header != None:
            self.conn.sendall(bytearray(self.header))
        
    def sendData(self, dataType, data):
        if dataType == DATA_TYPE_BYTE:
            self.conn.sendall(bytearray([data%256]))

        elif dataType == DATA_TYPE_SHORT:
            array = [int(data/256) % 256, int(data) % 256]

            self.conn.sendall(bytearray(array))

        elif dataType == DATA_TYPE_STRING:
            array = []

            for c in data:
                array.append(ord(c) % 256)

            self.conn.sendall(bytearray(array))

        elif dataType == DATA_TYPE_LONG:
            array = []

            array.append(int(data)/256/256/256 % 256)
            data = data - (int(data/256/256/256)*256*256*256)
            array.append(int(data)/256/256 % 256)
            data = data - (int(data/256/256)*256*256)
            array.append(int(data)/256 % 256)
            data = data - (int(data/256)*256)
            array.append(int(data) % 256)

    def __exit__(self):
        if self.ending != None:
            self.conn.sendall(bytearray(self.ending))

    