import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("CarterDev", "pass"):
    print("Login Good")

conn.downloadFile("test.file", open("test.file", 'w+'))