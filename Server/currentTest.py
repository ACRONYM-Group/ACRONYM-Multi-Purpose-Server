import ACELib

conn = ACELib.Connection()
events = ACELib.Connection()

conn.initConnection()
events.initConnection()

if conn.loginServer("carter", "password"):
    print("Login Good")
else:
    print("Login Failed")

if events.loginServer("carter", "password"):
    print("Login Good")
else:
    print("Login Failed")

def callback(new, old):
    print(new, old)

events.addListener("name", callback)

conn.setData("name", "value")

events.startListener()
