import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("carter", "password"):
    print("Login Good")
else:
    print("Login Failed")

conn.setData("name", "value")
conn.uploadFile(open("C://Users//Plasek//Desktop//Programming//Python//Server File Transfer//ACRONYM-File-Transfer-System//Server//main.py", 'rb'), "/data.txt")
