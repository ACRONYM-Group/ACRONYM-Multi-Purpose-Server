import ACELib

conn = ACELib.Connection()

conn.connect()
conn.handshake()

print(conn.getKey())
