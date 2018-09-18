def checkCredentials(username, passwordHash):
    creditFile = open("credentials.csv",'r')

    allLines = creditFile.readlines() 