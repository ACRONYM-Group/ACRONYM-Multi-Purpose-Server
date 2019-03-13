import ACELib
import time
import math
import psutil

conn = ACELib.Connection("206.188.224.174")
events = ACELib.Connection("206.188.224.174")

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


x = 0

while True:
    conn.setData("data", [x, psutil.virtual_memory()[2]])
    x += 0.2

    time.sleep(1)
