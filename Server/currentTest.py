import ACELib

conn = ACELib.Connection()

conn.initConnection()

if conn.loginServer("CarterDev", "pass"):
    print("Login Good")
else:
    print("Login Failed")

conn.uploadFile(open("C:\\Users\\Plasek\\Desktop\\IMG_20190120_221533.jpg", "rb"), "thingy.jpg")
