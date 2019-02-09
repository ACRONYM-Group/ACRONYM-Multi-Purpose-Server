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


conn.downloadFile("main.py","data.txt")
