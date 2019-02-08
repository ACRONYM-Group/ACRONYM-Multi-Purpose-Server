import mcrcon

mcr = None

def connect(arguments):
    global mcr

    mcr = mcrcon.MCRcon(arguments["address"], arguments["password"], port=4243)
    mcr.connect()

def run_command(arguments):
    print(mcr.command(arguments["command"]))

functions = {"connect":connect, "run_command":run_command}

