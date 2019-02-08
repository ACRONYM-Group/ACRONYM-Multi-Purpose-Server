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

conn.runLibraryFunction("RCON", "connect", {"address":"127.0.0.1", "password":"password"})
conn.runLibraryFunction("RCON", "run_command", {"command":"/gamemode survival AcronymMc"})
conn.runLibraryFunction("RCON", "run_command", {"command":"/time set day"})

def smite(playername):
    conn.runLibraryFunction("RCON", "run_command", {"command":"/execute as " + playername + " at @s run summon minecraft:lightning_bolt ~ ~ ~"})

#smite("AcronymMc")
