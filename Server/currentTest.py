import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("carter", "password"):
    print("Login Good")
else:
    print("Login Failed")

conn.setData("name", "value")
conn.downloadFile("ACELib.py", open("datafile.txt", 'wb'))
