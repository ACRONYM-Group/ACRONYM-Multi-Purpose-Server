import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("CarterDev", "pass"):
    print("Login Good")
else:
    print("Login Failed")
