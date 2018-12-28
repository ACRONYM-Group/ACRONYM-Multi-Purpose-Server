import ACELib

conn = ACELib.Connection()

conn.initConnection()

conn.setData("name", "value")
print(conn.getData("name"))
