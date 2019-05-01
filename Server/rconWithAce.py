import ACELib
import mcrcon
import time

events = ACELib.Connection()

events.initConnection()

if events.loginServer("carter", "password"):
    print("AMPS Login Good")
else:
    print("AMPS Login Failed")

mcr = None

def connect():
    global mcr

    try:
        
        mcr = mcrcon.MCRcon("127.0.0.1", "password", port=4243)
        mcr.connect()

        
        print("Connected Successfully.")
        events.setData("MCServerStatus", "Online")
    except:
        print("Failed to Connect.")
        events.setData("MCServerStatus", "Offline")


def commandCallback(new, _):
    print(new)
    connect()

    

    try:
        print(mcr.command(new))
    except:
        pass

    if (new == "/stop"):
        print("Server shutting down.")

    mcr.disconnect()

    


events.addListener("rconCommand", commandCallback)
connect()
events.startListener()

lastMCRCheck = time.time()
connected = False

while True:
    if (time.time() > lastMCRCheck + 10 and connected == False):
        connect()
        connected = True
        print(mcr.command("/list true"))

    if (time.time() > lastMCRCheck + 11 and connected == True):
        mcr.disconnect()
        connected = False
        lastMCRCheck = time.time()

        