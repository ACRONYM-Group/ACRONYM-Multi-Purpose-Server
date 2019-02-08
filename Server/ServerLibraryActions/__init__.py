import ServerLibraryActions.RCON as RCON

LIBRARY_CODES = {"RCON": RCON}

def execute(library_code, function, arguments):
    return LIBRARY_CODES[library_code].functions[function](arguments)
