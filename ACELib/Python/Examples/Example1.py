import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("Username", "Password"):
    print("Login Good")
else:
    print("Login Failed")
