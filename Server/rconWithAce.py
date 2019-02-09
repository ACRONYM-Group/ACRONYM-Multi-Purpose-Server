import ACELib
import mcrcon

events = ACELib.Connection()

events.initConnection()

if events.loginServer("carter", "password"):
    print("Login Good")
else:
    print("Login Failed")

mcr = None

def connect():
    global mcr

    mcr = mcrcon.MCRcon("127.0.0.1", "password", port=4243)
    mcr.connect()


def commandCallback(new, _):
    print(new)
    print(mcr.command(new))


events.addListener("rconCommand", commandCallback)

connect()

events.startListener()
