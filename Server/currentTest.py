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


def callback(new, old):
    print(new, old)


events.addListener("name", callback)

conn.setData("name", "value")

events.startListener()

def smite(playername):
    conn.runLibraryFunction("RCON", "run_command", {"command":"/execute as " + playername + " at @s run summon minecraft:lightning_bolt ~ ~ ~"})

#smite("AcronymMc")