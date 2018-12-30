DATA_TYPE_BYTE = 0      #1 Byte
DATA_TYPE_SHORT = 1     #2 Bytes
DATA_TYPE_STRING = 2    #n Bytes
DATA_TYPE_LONG = 3      #4 Bytes


class DataStreamOut:
    def __init__(self, conn, header=None, ending=None):
        self.conn = conn

        self.header = header
        self.ending = ending

    def __enter__(self):
        if self.header is not None:
            self.conn.send(bytearray(self.header))

        return self
        
    def sendData(self, dataType, data):
        if dataType == DATA_TYPE_BYTE:
            self.conn.send(bytearray([data % 256]))

        elif dataType == DATA_TYPE_SHORT:
            array = [int(data/256) % 256, int(data) % 256]

            self.conn.send(bytearray(array))

        elif dataType == DATA_TYPE_STRING:
            array = []

            for c in data:
                array.append(ord(c) % 256)

            self.conn.send(bytearray(array))

        elif dataType == DATA_TYPE_LONG:
            array = []

            array.append(int(int(data)/256/256/256 % 256))
            data = data - (int(int(data/256/256/256)*256*256*256))
            array.append(int(int(data)/256/256 % 256))
            data = data - (int(int(data/256/256)*256*256))
            array.append(int(int(data)/256 % 256))
            data = data - (int(int(data/256)*256))
            array.append(int(int(data) % 256))

            self.conn.send(bytearray(array))

    def __exit__(self, *args):
        if self.ending is not None:
            self.conn.send(bytearray(self.ending))


class DataStreamIn:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        return self

    def getData(self, dataType):
        if dataType == DATA_TYPE_BYTE:
            return int(list(self.conn.recv(1))[0])

        elif dataType == DATA_TYPE_SHORT:
            array = list(self.conn.recv(2))

            return int(array[0])*256 + int(array[1])

        elif dataType == DATA_TYPE_STRING:
            array = list(self.conn.recv(1024))

            strOut = ""

            for v in array:
                strOut += chr(v)

            return strOut

        elif dataType == DATA_TYPE_LONG:
            array = list(self.conn.recv(4))

            intOut = array[0]*256*256*256
            intOut += array[1]*256*256
            intOut += array[2]*256
            intOut += array[3]

            return intOut

        return None

    def __exit__(self, *args):
        pass
