import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("client", "pass"):
    print("Login Good")

conn.setData("name", "value")
print(conn.getData("name"))
