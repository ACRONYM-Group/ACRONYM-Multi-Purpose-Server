"""
    Holds all of the exceptions that ACELib makes use of
"""


class ACELibException(Exception):
    pass


class BadPacketException(ACELibException):
    pass


class BadHandshakeException(ACELibException):
    pass


class BadPacketTypeException(ACELibException):
    pass
